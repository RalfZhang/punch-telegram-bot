const TelegramBot = require('node-telegram-bot-api');
const sqlConfig = require('./sql-config');
const { token, groupId } = require('./app-config');

const bot = new TelegramBot(token, {polling: true});

const knex = require('knex')(sqlConfig);

const save = (id, num, time) => {
  return knex('check').insert({
    tg_id: id,
    num: num,
    time: new Date(time * 1000),
  });
}

const get = async (id) => {
  const res = await knex('check').where({
    tg_id: id,
  }).sum('num as n');

  return res[0].n;
}

// Matches "/echo [whatever]"
bot.onText(/\/echo (.+)/, (msg, match) => {
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  const resp = match[1]; // the captured "whatever"

  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, resp);
});


// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', async (msg) => {
  try {
    console.log('msg----\n', msg);
    const chatId = msg.chat.id;
    if (chatId !== groupId) {
      bot.sendMessage(chatId, `不让你用，除非打钱`);

      return;
    }
    if (!msg.from.id) {
      bot.sendMessage(chatId, `你是谁？`);
      return;
    }
    const uid = `${msg.from.id}`;
    if (!msg.text) {
      return;
    }
    if (msg.text.startsWith('/punch')) {
      const numRegRes = msg.text.match(/punch(@daily_punch_bot)? (\d)+/i);
      const num = numRegRes && numRegRes[2] && +numRegRes[2];
      if (!num) {
        bot.sendMessage(chatId, `/punch 后面只能给我正确的数字！`);
        return;
      }

      await save(uid, +num, msg.date);
      const res = await get(uid) || 0;

      bot.sendMessage(chatId, `你练了 ${res} 个题了！`);
    } else if (msg.text.startsWith('/num')) {
      const res = await get(uid) || 0;

      bot.sendMessage(chatId, `你练了 ${res} 个题了！`);
    }

  } catch (error) {
    console.log('error', error);
  }

});

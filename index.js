const Telegraf = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
const diffordsguideHost = 'https://www.diffordsguide.com';

const months = {
    0: 'january',
    1: 'february',
    2: 'march',
    3: 'april',
    4: 'may',
    5: 'june',
    6: 'july',
    7: 'august',
    8: 'september',
    9: 'october',
    10: 'november',
    11: 'december'
};

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

if (process.env.NODE_ENV === 'production') {
    bot.telegram.setWebhook(`${process.env.HEROKU_URL}/bot${process.env.BOT_TOKEN}`);
    bot.startWebhook(`/bot${BOT_TOKEN}`, null, PORT);    
}

bot.start((ctx) => ctx.reply('Welcome 🥃'));
bot.command('help', (ctx) => {
    const msg = `
This bot uses cocktails from [Difford's Guide](https://www.diffordsguide.com/).

You can control me by sending these commands:
    
- /today - sends today's cocktail.
- /recipe [keyword] - sends a list of 20 (max) cocktails that contain the given keyword.
`
    ctx.reply(msg, { parse_mode: "Markdown", disable_web_page_preview: true });
});
bot.command('today', async (ctx) => {
    let $;
    const today = new Date();
    const res = await axios.get(`${diffordsguideHost}/on-this-day/${months[today.getMonth()]}/${today.getDate()}`);
    $ = cheerio.load(res.data);
    
    const todayDate = $('.bg-dailycocktail-tone h1').text();
    const funFact = $('.bg-dailycocktail-tone h2').text();
    const parsedLink = $('.button.button--cocktails').attr('href');
    const name = $('.cell h3').first().text();
    const msg = `
*Today's cocktail 🍸:*

_${todayDate}: ${funFact}_

[${name}](${diffordsguideHost}${parsedLink})
`;
    ctx.reply(msg, {parse_mode: 'Markdown'});
});
bot.command('recipe', async (ctx) => {
    let $;
    let results = [];
    const keyword = ctx.update.message.text.split(' ')[1];
    const url = `${diffordsguideHost}/cocktails/search?limit=20&keyword%5B%5D=${keyword}`;
    const res = await axios.get(url);
    $ = cheerio.load(res.data);

    $('.box').each((i, elem) => {
        results.push({
            name: $('.box__title', elem).text(),
            link: `${diffordsguideHost}${$(elem).attr('href')}`
        });
    });

    const resultsMarkdown = results.map((item) => `[${item.name}](${item.link})`).join('\n');
    const msg = `
*Results 🥃:*

${resultsMarkdown}
[More...](${url})
`;
    //results.forEach(item => ctx.reply(item));
    ctx.reply(msg, { parse_mode: 'Markdown', disable_web_page_preview: true });
});
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
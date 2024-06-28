const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

// إنشاء عميل واتساب
const client = new Client();

client.on('qr', (qr) => {
    // توليد وعرض رمز QR للمصادقة
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async msg => {
    if (msg.body.startsWith('!uptodown ')) {
        const query = msg.body.slice(10);
        const url = `https://en.uptodown.com/search?q=${encodeURIComponent(query)}`;

        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
            const appLink = $('a.box').first().attr('href');

            if (appLink) {
                const appPage = await axios.get(appLink);
                const $$ = cheerio.load(appPage.data);
                const downloadLink = $$('a.download').attr('href');

                if (downloadLink) {
                    msg.reply(`Here's your download link: ${downloadLink}`);
                } else {
                    msg.reply('Sorry, I could not find the download link.');
                }
            } else {
                msg.reply('Sorry, I could not find any app with that name.');
            }
        } catch (error) {
            console.error(error);
            msg.reply('An error occurred while fetching the app.');
        }
    }
});

client.initialize();

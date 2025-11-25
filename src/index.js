const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { initScheduler, reloadJobs } = require('./services/scheduler');
const { handleMessage, handleMenu } = require('./handlers/commands');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan the QR code above to log in.');
});

client.on('ready', async () => {
    console.log('Client is ready!');

    try {
        await initDatabase();
        initScheduler(client);
        await reloadJobs();
        console.log('✅ Bot is fully operational!');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

client.on('message', async (msg) => {
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    try {
        await handleMessage(msg, client);
    } catch (error) {
        console.error('Error handling message:', error);
        await msg.reply('❌ An error occurred. Please try again later.');
    }
});

client.initialize();

console.log('Starting Quran WhatsApp Bot...');

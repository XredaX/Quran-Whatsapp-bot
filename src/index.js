const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { initScheduler, reloadJobs } = require('./services/scheduler');
const { handleMessage, handleMenu } = require('./handlers/commands');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('\n===========================================');
    console.log('QR CODE FOR WHATSAPP LOGIN');
    console.log('===========================================');
    console.log('\nOption 1: Scan the QR code above');
    console.log('\nOption 2: Open this URL in your browser:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr)}`);
    console.log('\nOption 3: Use this link on your phone:');
    console.log(`https://qr.link/qr?data=${encodeURIComponent(qr)}`);
    console.log('\n===========================================\n');
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

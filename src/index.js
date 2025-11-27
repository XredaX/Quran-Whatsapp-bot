const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const { initScheduler, reloadJobs } = require('./services/scheduler');
const { handleMessage, handleMenu } = require('./handlers/commands');
const { sessionManager } = require('./utils/sessionManager');

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
    // Ignore messages from the bot itself
    if (msg.fromMe) return;

    // Ignore non-chat messages (status, broadcast, etc.)
    if (msg.isStatus) return;
    if (msg.broadcast) return;

    // Ignore system/notification messages
    if (msg.type !== 'chat' && msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'audio' && msg.type !== 'document' && msg.type !== 'sticker') {
        return;
    }

    // Ignore empty messages
    if (!msg.body || msg.body.trim() === '') return;

    const chat = await msg.getChat();
    
    // Ignore group messages
    if (chat.isGroup) return;

    // Note: @lid (linked device) IDs are handled by phoneResolver utility
    // No need to resolve here - it's done when needed

    // Use session manager to queue messages per user
    await sessionManager.handleMessage(msg, client, handleMessage);
});

client.initialize();

console.log('Starting Quran WhatsApp Bot...');

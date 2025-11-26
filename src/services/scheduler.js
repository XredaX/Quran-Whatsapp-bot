const schedule = require('node-schedule');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const { getAllActiveGroups, updateGroupConfig } = require('../config/database');
const { getRandomQuote } = require('../utils/quotes');

const IMAGES_DIR = 'quran-images';
const jobs = {};

let client = null;

function initScheduler(whatsappClient) {
    client = whatsappClient;
    console.log('Scheduler initialized');
}

async function reloadJobs() {
    try {
        Object.keys(jobs).forEach(groupId => {
            if (jobs[groupId]) {
                jobs[groupId].cancel();
                delete jobs[groupId];
            }
        });

        const groups = await getAllActiveGroups();
        console.log(`Loading ${groups.length} active groups...`);

        for (const group of groups) {
            scheduleGroup(group);
        }

        console.log(`Scheduled ${Object.keys(jobs).length} jobs`);
    } catch (error) {
        console.error('Error reloading jobs:', error);
    }
}

function scheduleGroup(group) {
    try {
        let schedules = [];
        try {
            schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');
        } catch (e) {
            console.error(`Error parsing schedules for ${group.name}, using default`);
            schedules = ['0 18 * * *'];
        }

        schedules.forEach((cronSchedule, index) => {
            const job = schedule.scheduleJob(cronSchedule, async () => {
                await sendQuranImage(group);
            });

            const jobKey = `${group.group_id}_${index}`;
            jobs[jobKey] = job;
            console.log(`Scheduled job ${index + 1}/${schedules.length} for group: ${group.name} (${cronSchedule})`);
        });
    } catch (error) {
        console.error(`Error scheduling group ${group.name}:`, error);
    }
}

async function sendQuranImage(group) {
    const pagesPerSend = group.pages_per_send || 1;
    const maxPage = 604;
    
    console.log(`Attempting to send ${pagesPerSend} page(s) starting from page ${group.current_page} to ${group.name}...`);

    try {
        let pagesSent = 0;
        let currentPage = group.current_page;

        for (let i = 0; i < pagesPerSend; i++) {
            // Check if we've reached the end of the Quran
            if (currentPage > maxPage) {
                console.log(`Reached end of Quran for ${group.name}. Stopping at page ${maxPage}.`);
                break;
            }

            const imagePath = path.join(process.cwd(), IMAGES_DIR, `${currentPage}.jpg`);

            if (!fs.existsSync(imagePath)) {
                console.error(`Error: Image not found at ${imagePath}`);
                break;
            }

            const media = MessageMedia.fromFilePath(imagePath);
            const quote = getRandomQuote();
            const caption = `📖 *Page ${currentPage}*\n\n${quote}`;

            await client.sendMessage(group.group_id, media, {
                caption: caption
            });

            console.log(`✅ Sent page ${currentPage} to ${group.name}`);
            pagesSent++;
            currentPage++;

            // Add a small delay between messages to avoid rate limiting
            if (i < pagesPerSend - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Completed sending ${pagesSent} page(s) to ${group.name} at ${new Date().toLocaleString()}`);

        // Update to the next page
        await updateGroupConfig(group.group_id, { current_page: currentPage });
        console.log(`Updated ${group.name} to page ${currentPage}`);

    } catch (error) {
        console.error(`Failed to send message to ${group.name}:`, error);
    }
}

module.exports = {
    initScheduler,
    reloadJobs,
    scheduleGroup
};

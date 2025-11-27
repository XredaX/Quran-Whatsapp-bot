const schedule = require('node-schedule');
const { MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const { getAllActiveGroups, updateGroupConfig, getAllActiveSubscriptions, updateSubscription } = require('../config/database');
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
        // Cancel all existing jobs
        Object.keys(jobs).forEach(jobKey => {
            if (jobs[jobKey]) {
                jobs[jobKey].cancel();
                delete jobs[jobKey];
            }
        });

        // Schedule groups
        const groups = await getAllActiveGroups();
        console.log(`Loading ${groups.length} active groups...`);
        for (const group of groups) {
            scheduleGroup(group);
        }

        // Schedule private subscriptions
        const subscriptions = await getAllActiveSubscriptions();
        console.log(`Loading ${subscriptions.length} active subscriptions...`);
        for (const subscription of subscriptions) {
            scheduleSubscription(subscription);
        }

        console.log(`Scheduled ${Object.keys(jobs).length} total jobs`);
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
                const { getGroup } = require('../config/database');
                const freshGroup = await getGroup(group.group_id);
                if (freshGroup && freshGroup.is_active) {
                    await sendQuranImage(freshGroup);
                }
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

function scheduleSubscription(subscription) {
    try {
        let schedules = [];
        try {
            schedules = JSON.parse(subscription.cron_schedules || '["0 18 * * *"]');
        } catch (e) {
            console.error(`Error parsing schedules for subscription ${subscription.user_id}, using default`);
            schedules = ['0 18 * * *'];
        }

        schedules.forEach((cronSchedule, index) => {
            const job = schedule.scheduleJob(cronSchedule, async () => {
                const { getSubscription } = require('../config/database');
                const freshSub = await getSubscription(subscription.user_id);
                if (freshSub && freshSub.is_active) {
                    await sendQuranToUser(freshSub);
                }
            });

            const jobKey = `sub_${subscription.user_id}_${index}`;
            jobs[jobKey] = job;
            console.log(`Scheduled subscription job ${index + 1}/${schedules.length} for user: ${subscription.user_id} (${cronSchedule})`);
        });
    } catch (error) {
        console.error(`Error scheduling subscription ${subscription.user_id}:`, error);
    }
}

async function sendQuranToUser(subscription) {
    const pagesPerSend = subscription.pages_per_send || 1;
    const maxPage = 604;
    
    console.log(`Attempting to send ${pagesPerSend} page(s) starting from page ${subscription.current_page} to user ${subscription.user_id}...`);

    try {
        let pagesSent = 0;
        let currentPage = subscription.current_page;

        for (let i = 0; i < pagesPerSend; i++) {
            if (currentPage > maxPage) {
                console.log(`Reached end of Quran for user ${subscription.user_id}. Stopping at page ${maxPage}.`);
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

            await client.sendMessage(subscription.user_id, media, {
                caption: caption
            });

            console.log(`✅ Sent page ${currentPage} to user ${subscription.user_id}`);
            pagesSent++;
            currentPage++;

            if (i < pagesPerSend - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log(`✅ Completed sending ${pagesSent} page(s) to user ${subscription.user_id} at ${new Date().toLocaleString()}`);

        await updateSubscription(subscription.user_id, { current_page: currentPage });
        console.log(`Updated subscription for user ${subscription.user_id} to page ${currentPage}`);

    } catch (error) {
        console.error(`Failed to send message to user ${subscription.user_id}:`, error);
    }
}

module.exports = {
    initScheduler,
    reloadJobs,
    scheduleGroup,
    scheduleSubscription
};

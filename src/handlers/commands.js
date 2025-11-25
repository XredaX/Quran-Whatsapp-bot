const { getOrCreateUser, getUserGroups, linkGroup, updateGroupConfig, getGroup, getUser, updateUserLanguage } = require('../config/database');
const { reloadJobs } = require('../services/scheduler');
const { t } = require('../utils/translations');

const userStates = {};

async function getUserLang(userId) {
    const user = await getUser(userId);
    return user?.language || 'en';
}

function timeToCron(timeStr) {
    const parts = timeStr.trim().split(':');
    if (parts.length !== 2) return null;

    const hour = parseInt(parts[0]);
    const minute = parseInt(parts[1]);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return null;
    }

    return `${minute} ${hour} * * *`;
}

function cronToTime(cron) {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const minute = parts[0].padStart(2, '0');
    const hour = parts[1].padStart(2, '0');

    return `${hour}:${minute}`;
}

async function handleLanguageSelection(msg) {
    const userId = msg.from;

    userStates[userId] = { command: 'select_language', step: 'selecting' };
    await msg.reply(t('en', 'selectLanguage'));
}

async function processLanguageSelection(msg, selection) {
    const userId = msg.from;

    const langMap = { '1': 'en', '2': 'fr', '3': 'ar' };
    const selectedLang = langMap[selection];

    if (!selectedLang) {
        await msg.reply('❌ Invalid selection. Please reply with 1, 2, or 3.');
        return;
    }

    await getOrCreateUser(userId);
    await updateUserLanguage(userId, selectedLang);

    delete userStates[userId];

    await msg.reply(t(selectedLang, 'languageSet'));

    await handleMenu(msg);
}

async function handleMenu(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    await msg.reply(t(lang, 'menu'));

    userStates[userId] = { command: 'main_menu', step: 'selecting' };
}

async function handleMenuSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    switch (selection) {
        case '1':
            await handleLink(msg);
            break;
        case '2':
            await handleMyGroups(msg);
            break;
        case '3':
            await msg.reply(t(lang, 'help'));
            delete userStates[userId];
            break;
        case '4':
            await handleLanguageSelection(msg);
            break;
        default:
            await msg.reply(t(lang, 'invalidOption', 4));
    }
}

async function handleLink(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    userStates[userId] = { command: 'link', step: 'waiting_name' };

    await msg.reply(t(lang, 'linkGroup'));
}

async function handleLinkGroupName(msg, client, groupName) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const lowerName = groupName.toLowerCase().trim();
    if (lowerName === 'menu' || lowerName === 'help' || lowerName === 'cancel' || lowerName === 'back') {
        delete userStates[userId];
        await handleMenu(msg);
        return;
    }

    try {
        const chats = await client.getChats();
        const groups = chats.filter(chat => chat.isGroup);
        const targetGroup = groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());

        if (!targetGroup) {
            await msg.reply(t(lang, 'groupNotFound', groupName));
            return;
        }

        const result = await linkGroup(userId, targetGroup.id._serialized, targetGroup.name);

        if (result.success) {
            await msg.reply(t(lang, 'groupLinked', targetGroup.name));
            await reloadJobs();
            delete userStates[userId];
        } else {
            await msg.reply(t(lang, 'alreadyLinked'));
            delete userStates[userId];
        }

    } catch (error) {
        console.error('Error linking group:', error);
        await msg.reply(t(lang, 'error'));
        delete userStates[userId];
    }
}

async function handleMyGroups(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    const groups = await getUserGroups(userId);

    if (groups.length === 0) {
        await msg.reply(t(lang, 'noGroups'));
        delete userStates[userId];
        return;
    }

    let responseText = t(lang, 'yourGroups', groups.length);

    groups.forEach((group, index) => {
        const status = group.is_active ? '✅' : '❌';
        const schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');
        const times = schedules.map(s => cronToTime(s)).join(', ');
        responseText += `*${index + 1}.* ${status} ${group.name}\n`;
        responseText += `   📄 ${t(lang, 'page')}: ${group.current_page}\n   ⏰ ${times}\n\n`;
    });

    responseText += t(lang, 'selectGroup', groups.length);

    userStates[userId] = {
        command: 'mygroups',
        step: 'selecting',
        groups: groups
    };

    await msg.reply(responseText);
}

async function handleGroupSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    const groupIndex = parseInt(selection) - 1;

    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= state.groups.length) {
        await msg.reply(t(lang, 'invalidSelection'));
        return;
    }

    const selectedGroup = state.groups[groupIndex];
    await handleSettings(msg, selectedGroup.group_id);
}

async function handleSettings(msg, groupId) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    const group = await getGroup(groupId);
    if (!group) {
        await msg.reply(t(lang, 'error'));
        delete userStates[userId];
        return;
    }

    userStates[userId] = {
        command: 'settings',
        step: 'configuring',
        group: group
    };

    const schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');

    let schedulesList = '';
    schedules.forEach((s, i) => {
        schedulesList += `   ${i + 1}. ${cronToTime(s)}\n`;
    });

    const configText = t(lang, 'configure', group.name) +
        t(lang, 'currentPage', group.current_page) +
        t(lang, 'schedules', schedules.length) + schedulesList +
        t(lang, 'status', group.is_active) +
        t(lang, 'whatToChange');

    await msg.reply(configText);
}

async function handleSettingsOption(msg, option) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    if (!state || !state.group) {
        await msg.reply(t(lang, 'sessionExpired'));
        delete userStates[userId];
        return;
    }

    switch (option) {
        case '1':
            userStates[userId].step = 'waiting_page';
            await msg.reply(t(lang, 'setPage'));
            break;

        case '2':
            userStates[userId].step = 'waiting_add_schedule';
            await msg.reply(t(lang, 'addSchedule'));
            break;

        case '3':
            await handleRemoveSchedule(msg);
            break;

        case '4':
            const newStatus = !state.group.is_active;
            await updateGroupConfig(state.group.group_id, { is_active: newStatus });
            await reloadJobs();
            await msg.reply(newStatus ? t(lang, 'resumed', state.group.name) : t(lang, 'paused', state.group.name));
            delete userStates[userId];
            break;

        case '5':
            await handleMyGroups(msg);
            break;

        default:
            await msg.reply(t(lang, 'invalidOption', 5));
    }
}

async function handlePageInput(msg, pageNumber) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    const page = parseInt(pageNumber);

    if (isNaN(page) || page < 1 || page > 604) {
        await msg.reply(t(lang, 'invalidPage'));
        return;
    }

    await updateGroupConfig(state.group.group_id, { current_page: page });
    await msg.reply(t(lang, 'pageUpdated', state.group.name, page));
    delete userStates[userId];
}

async function handleAddScheduleInput(msg, schedule) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    const cron = timeToCron(schedule);

    if (!cron) {
        await msg.reply(t(lang, 'invalidTime'));
        return;
    }

    const currentSchedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');
    currentSchedules.push(cron);

    await updateGroupConfig(state.group.group_id, { cron_schedules: currentSchedules });
    await reloadJobs();
    await msg.reply(t(lang, 'scheduleAdded', state.group.name, currentSchedules.length));
    delete userStates[userId];
}

async function handleRemoveSchedule(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    const schedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');

    if (schedules.length === 1) {
        await msg.reply(t(lang, 'cannotRemoveLast'));
        return;
    }

    let schedulesList = t(lang, 'selectToRemove');
    schedules.forEach((s, i) => {
        schedulesList += `${i + 1}. ${cronToTime(s)}\n`;
    });
    schedulesList += '\n_Reply with the number_';

    userStates[userId].step = 'waiting_remove_schedule';
    await msg.reply(schedulesList);
}

async function handleRemoveScheduleSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = userStates[userId];

    const schedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');
    const scheduleIndex = parseInt(selection) - 1;

    if (isNaN(scheduleIndex) || scheduleIndex < 0 || scheduleIndex >= schedules.length) {
        await msg.reply(t(lang, 'invalidSelection'));
        return;
    }

    const removedSchedule = schedules.splice(scheduleIndex, 1)[0];

    await updateGroupConfig(state.group.group_id, { cron_schedules: schedules });
    await reloadJobs();
    await msg.reply(t(lang, 'scheduleRemoved', cronToTime(removedSchedule)));
    delete userStates[userId];
}

async function handleMessage(msg, client) {
    const userId = msg.from;
    const text = msg.body.trim().toLowerCase();

    if (userStates[userId]) {
        const state = userStates[userId];

        if (state.command === 'select_language' && state.step === 'selecting') {
            await processLanguageSelection(msg, text);
            return true;
        }

        if (state.command === 'main_menu' && state.step === 'selecting') {
            await handleMenuSelection(msg, text);
            return true;
        }

        if (state.command === 'link' && state.step === 'waiting_name') {
            await handleLinkGroupName(msg, client, msg.body.trim());
            return true;
        }

        if (state.command === 'mygroups' && state.step === 'selecting') {
            await handleGroupSelection(msg, text);
            return true;
        }

        if (state.command === 'settings' && state.step === 'configuring') {
            await handleSettingsOption(msg, text);
            return true;
        }

        if (state.command === 'settings' && state.step === 'waiting_page') {
            await handlePageInput(msg, text);
            return true;
        }

        if (state.command === 'settings' && state.step === 'waiting_add_schedule') {
            await handleAddScheduleInput(msg, text);
            return true;
        }

        if (state.command === 'settings' && state.step === 'waiting_remove_schedule') {
            await handleRemoveScheduleSelection(msg, text);
            return true;
        }
    }

    if (text === 'menu' || text === '!menu' || text === 'help' || text === '!help' || text === 'start' || text === '!start') {
        await handleMenu(msg);
        return true;
    }

    if (text === 'language' || text === '!language' || text === 'lang' || text === '!lang') {
        await handleLanguageSelection(msg);
        return true;
    }

    const user = await getUser(userId);
    if (!user) {
        await handleLanguageSelection(msg);
        return true;
    }

    await handleMenu(msg);
    return true;
}

module.exports = {
    handleMessage,
    handleMenu
};

const { getOrCreateUser, getUserGroups, linkGroup, updateGroupConfig, getGroup, getUser, updateUserLanguage, deleteGroup, getSubscription, createSubscription, updateSubscription, deleteSubscription } = require('../config/database');
const { reloadJobs } = require('../services/scheduler');
const { t } = require('../utils/translations');
const { getUserAccessibleGroups, isUserInGroup } = require('../utils/groupSecurity');
const { addNavigationFooter } = require('../utils/messageFormatter');
const { generatePreview, generateWizardPreview } = require('../utils/confirmations');
const { startGroupWizard, generateWizardStepMessage, processWizardInput } = require('../utils/wizards');
const { sessionManager } = require('../utils/sessionManager');

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

async function handleMessage(msg, client, session = null) {
    const userId = msg.from;
    const messageText = msg.body.trim();
    const lowerText = messageText.toLowerCase();

    // Get state from session if provided, otherwise from session manager
    const state = session ? session.getState() : sessionManager.getUserState(userId);

    if (lowerText === '!language') {
        await handleLanguageSelection(msg);
        return;
    }

    if (!state && (lowerText === 'menu' || lowerText === 'help' || lowerText === 'start')) {
        await handleMenu(msg);
        return;
    }

    if (!state) {
        const user = await getUser(userId);
        if (!user) {
            await handleLanguageSelection(msg);
        } else {
            await handleMenu(msg);
        }
        return;
    }
    if (state.command === 'select_language' && state.step === 'selecting') {
        await processLanguageSelection(msg, messageText);
    } else if (state.command === 'main_menu' && state.step === 'selecting') {
        await handleMenuSelection(msg, messageText, client);
    } else if (state.command === 'link' && state.step === 'selecting') {
        await handleLinkGroupSelection(msg, client, messageText);
    } else if (state.command === 'wizard') {
        await handleWizardStep(msg, client, messageText);
    } else if (state.command === 'wizard_confirm') {
        await handleWizardConfirmation(msg, client, messageText);
    } else if (state.command === 'edit_confirm') {
        await handleEditConfirmation(msg, messageText);
    } else if (state.command === 'mygroups' && state.step === 'selecting') {
        await handleGroupSelection(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'configuring') {
        await handleSettingsOption(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'waiting_page') {
        await handlePageInput(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'waiting_add_schedule') {
        await handleAddScheduleInput(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'waiting_remove_schedule') {
        await handleRemoveScheduleSelection(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'waiting_pages_per_send') {
        await handlePagesPerSendInput(msg, messageText);
    } else if (state.command === 'settings' && state.step === 'confirm_delete') {
        await handleDeleteConfirmation(msg, messageText);
    } else if (state.command === 'subscribe' && state.step === 'prompt') {
        await handleSubscribePrompt(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'configuring') {
        await handleSubscriptionSettingsOption(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'waiting_page') {
        await handleSubscriptionPageInput(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'waiting_add_schedule') {
        await handleSubscriptionAddSchedule(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'waiting_remove_schedule') {
        await handleSubscriptionRemoveScheduleSelection(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'waiting_pages_per_send') {
        await handleSubscriptionPagesPerSend(msg, messageText);
    } else if (state.command === 'subscription_settings' && state.step === 'confirm_unsubscribe') {
        await handleUnsubscribeConfirmation(msg, messageText);
    } else {
        await handleMenu(msg);
    }
}

async function handleLanguageSelection(msg) {
    const userId = msg.from;

    sessionManager.setUserState(userId, { command: 'select_language', step: 'selecting' });
    await msg.reply(addNavigationFooter(t('en', 'selectLanguage'), 'en'));
}

async function processLanguageSelection(msg, selection) {
    const userId = msg.from;

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'cancel' || lowerSelection === 'back') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }

    const langMap = { '1': 'en', '2': 'fr', '3': 'ar' };
    const selectedLang = langMap[selection];

    if (!selectedLang) {
        await msg.reply('❌ Invalid selection. Please reply with 1, 2, or 3.');
        return;
    }

    await getOrCreateUser(userId);
    await updateUserLanguage(userId, selectedLang);

    sessionManager.clearUserState(userId);

    await msg.reply(t(selectedLang, 'languageSet'));

    await handleMenu(msg);
}

async function handleMenu(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    await msg.reply(addNavigationFooter(t(lang, 'menu'), lang));

    sessionManager.setUserState(userId, { command: 'main_menu', step: 'selecting' });
}

async function handleMenuSelection(msg, selection, client) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'help' || lowerSelection === 'start') {
        await handleMenu(msg);
        return;
    }

    switch (selection) {
        case '1':
            await handleLink(msg, client);
            break;
        case '2':
            await handleMyGroups(msg);
            break;
        case '3':
            await handleSubscription(msg);
            break;
        case '4':
            await msg.reply(addNavigationFooter(t(lang, 'help'), lang));
            sessionManager.clearUserState(userId);
            break;
        case '5':
            await handleLanguageSelection(msg);
            break;
        default:
            await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 5), lang));
    }
}

async function handleLink(msg, client) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    const userGroups = await getUserAccessibleGroups(client, userId);

    if (userGroups.length === 0) {
        await msg.reply(addNavigationFooter(t(lang, 'noGroupsAvailable'), lang));
        sessionManager.clearUserState(userId);
        return;
    }

    const linkedGroups = await getUserGroups(userId);
    const linkedIds = linkedGroups.map(g => g.group_id);

    let responseText = t(lang, 'selectGroupToLink', userGroups.length) + '\n\n';

    userGroups.forEach((group, index) => {
        const isLinked = linkedIds.includes(group.id);
        const status = isLinked ? '✅' : '⚪';
        responseText += `${status} *${index + 1}.* ${group.name}\n`;
        responseText += `   👥 ${group.participantCount} members\n\n`;
    });

    responseText += '\n' + t(lang, 'linkInstructions', userGroups.length);

    sessionManager.setUserState(userId, {
        command: 'link',
        step: 'selecting',
        availableGroups: userGroups
    });

    await msg.reply(addNavigationFooter(responseText, lang));
}

async function handleLinkGroupSelection(msg, client, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'cancel' || lowerSelection === 'back') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }

    const groupIndex = parseInt(selection) - 1;

    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= state.availableGroups.length) {
        const matchingGroups = state.availableGroups.filter(g =>
            g.name.toLowerCase().includes(selection.toLowerCase())
        );

        if (matchingGroups.length === 0) {
            await msg.reply(addNavigationFooter(t(lang, 'invalidGroupSelection', state.availableGroups.length), lang));
            return;
        }

        if (matchingGroups.length === 1) {
            await linkSelectedGroup(msg, client, matchingGroups[0], userId, lang);
            return;
        }

        let responseText = t(lang, 'multipleGroupsFound', selection, matchingGroups.length) + '\n\n';
        matchingGroups.forEach((group, index) => {
            responseText += `*${index + 1}.* ${group.name}\n`;
            responseText += `   👥 ${group.participantCount} members\n\n`;
        });
        responseText += t(lang, 'selectFromMatches', matchingGroups.length);

        const currentState = sessionManager.getUserState(userId);
        currentState.availableGroups = matchingGroups;
        sessionManager.setUserState(userId, currentState);
        await msg.reply(responseText);
        return;
    }

    const selectedGroup = state.availableGroups[groupIndex];
    await linkSelectedGroup(msg, client, selectedGroup, userId, lang);
}

async function linkSelectedGroup(msg, client, group, userId, lang) {
    try {
        const isInGroup = await isUserInGroup(client, group.id, userId);

        if (!isInGroup) {
            await msg.reply(addNavigationFooter(t(lang, 'notMemberOfGroup', group.name), lang));
            sessionManager.clearUserState(userId);
            return;
        }

        const linkedGroups = await getUserGroups(userId);
        const alreadyLinked = linkedGroups.some(g => g.group_id === group.id);

        if (alreadyLinked) {
            await msg.reply(addNavigationFooter(t(lang, 'alreadyLinked'), lang));
            sessionManager.clearUserState(userId);
            return;
        }

        const wizard = startGroupWizard(group.id, group.name, lang);
        sessionManager.setUserState(userId, wizard.state);
        await msg.reply(wizard.message);

    } catch (error) {
        console.error('Error linking group:', error);
        await msg.reply(addNavigationFooter(t(lang, 'error'), lang));
        sessionManager.clearUserState(userId);
    }
}

async function handleMyGroups(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    const groups = await getUserGroups(userId);

    if (groups.length === 0) {
        await msg.reply(addNavigationFooter(t(lang, 'noGroups'), lang));
        sessionManager.clearUserState(userId);
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

    sessionManager.setUserState(userId, {
        command: 'mygroups',
        step: 'selecting',
        groups: groups
    });

    await msg.reply(addNavigationFooter(responseText, lang));
}

async function handleGroupSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'cancel' || lowerSelection === 'back' || lowerSelection === 'home') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }

    const groupIndex = parseInt(selection) - 1;

    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= state.groups.length) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidSelection'), lang));
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
        await msg.reply(addNavigationFooter(t(lang, 'error'), lang));
        sessionManager.clearUserState(userId);
        return;
    }

    sessionManager.setUserState(userId, {
        command: 'settings',
        step: 'configuring',
        group: group
    });

    const schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');
    const pagesPerSend = group.pages_per_send || 1;

    let schedulesList = '';
    schedules.forEach((s, i) => {
        schedulesList += `   ${i + 1}. ${cronToTime(s)}\n`;
    });

    const statusText = group.is_active ? t(lang, 'statusActive') : t(lang, 'statusPaused');

    const configText = t(lang, 'configure', group.name) +
        t(lang, 'currentPage', group.current_page) +
        t(lang, 'pagesPerSend', pagesPerSend) +
        t(lang, 'schedules', schedules.length) + schedulesList +
        t(lang, 'status', statusText) +
        t(lang, 'whatToChange');

    await msg.reply(addNavigationFooter(configText, lang));
}

async function handleSettingsOption(msg, option) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    if (!state || !state.group) {
        await msg.reply(addNavigationFooter(t(lang, 'sessionExpired'), lang));
        sessionManager.clearUserState(userId);
        return;
    }

    const lowerOption = option.toLowerCase().trim();
    if (lowerOption === 'menu' || lowerOption === 'cancel' || lowerOption === 'home') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }
    if (lowerOption === 'back') {
        sessionManager.clearUserState(userId);
        await handleMyGroups(msg);
        return;
    }

    switch (option) {
        case '1':
            state.step = 'waiting_page';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'setPage'), lang));
            break;

        case '2':
            state.step = 'waiting_add_schedule';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'addSchedule'), lang));
            break;

        case '3':
            await handleRemoveSchedule(msg);
            break;

        case '4':
            state.step = 'waiting_pages_per_send';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'setPagesPerSend'), lang));
            break;

        case '5':
            await handleToggleStatus(msg);
            break;

        case '6':
            state.step = 'confirm_delete';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'confirmDelete', state.group.name), lang));
            break;

        case '7':
            sessionManager.clearUserState(userId);
            await handleMyGroups(msg);
            break;

        default:
            await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 7), lang));
    }
}

async function handlePageInput(msg, pageNumber) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerInput = pageNumber.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        sessionManager.clearUserState(userId);
        await handleSettings(msg, state.group.group_id);
        return;
    }

    const page = parseInt(pageNumber);

    if (isNaN(page) || page < 1 || page > 604) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidPage'), lang));
        return;
    }

    const group = state.group;
    const schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');
    const preview = generatePreview({
        lang,
        groupName: group.name,
        field: 'current_page',
        oldValue: group.current_page,
        newValue: page,
        currentPage: page,
        pagesPerSend: group.pages_per_send || 1,
        schedules
    });

    sessionManager.setUserState(userId, {
        command: 'edit_confirm',
        step: 'confirming',
        editData: {
            groupId: group.group_id,
            field: 'current_page',
            oldValue: group.current_page,
            newValue: page
        }
    });

    await msg.reply(addNavigationFooter(preview, lang));
}

async function handleAddScheduleInput(msg, schedule) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerInput = schedule.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        sessionManager.clearUserState(userId);
        await handleSettings(msg, state.group.group_id);
        return;
    }

    try {
        const cron = timeToCron(schedule);

        if (!cron) {
            await msg.reply(addNavigationFooter(t(lang, 'invalidTime'), lang));
            return;
        }

        if (!state || !state.group) {
            console.error('State or group missing for user:', userId);
            await msg.reply(addNavigationFooter(t(lang, 'sessionExpired'), lang));
            sessionManager.clearUserState(userId);
            return;
        }

        console.log(`Adding schedule ${schedule} (cron: ${cron}) for group ${state.group.name}`);

        const currentSchedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');
        currentSchedules.push(cron);

        await updateGroupConfig(state.group.group_id, { cron_schedules: currentSchedules });
        await reloadJobs();
        await msg.reply(addNavigationFooter(t(lang, 'scheduleAdded', state.group.name, currentSchedules.length), lang));
        sessionManager.clearUserState(userId);
    } catch (error) {
        console.error('Error adding schedule:', error);
        await msg.reply(addNavigationFooter(t(lang, 'error'), lang));
        sessionManager.clearUserState(userId);
    }
}

async function handleRemoveSchedule(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const schedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');

    if (schedules.length === 0) {
        await msg.reply(addNavigationFooter(t(lang, 'noSchedules'), lang));
        return;
    }

    let schedulesList = '';
    schedules.forEach((s, i) => {
        schedulesList += `${i + 1}. ${cronToTime(s)}\n`;
    });

    state.step = 'waiting_remove_schedule';
    sessionManager.setUserState(userId, state);
    await msg.reply(addNavigationFooter(t(lang, 'selectScheduleToRemove', schedulesList), lang));
}

async function handleRemoveScheduleSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'cancel' || lowerSelection === 'back') {
        sessionManager.clearUserState(userId);
        await handleSettings(msg, state.group.group_id);
        return;
    }

    const scheduleIndex = parseInt(selection) - 1;
    const schedules = JSON.parse(state.group.cron_schedules || '["0 18 * * *"]');

    if (isNaN(scheduleIndex) || scheduleIndex < 0 || scheduleIndex >= schedules.length) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidSelection'), lang));
        return;
    }

    schedules.splice(scheduleIndex, 1);

    await updateGroupConfig(state.group.group_id, { cron_schedules: schedules });
    await reloadJobs();
    await msg.reply(addNavigationFooter(t(lang, 'scheduleRemoved', state.group.name), lang));
    sessionManager.clearUserState(userId);
}

async function handleToggleStatus(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const newStatus = !state.group.is_active;
    await updateGroupConfig(state.group.group_id, { is_active: newStatus });
    await reloadJobs();

    const statusText = newStatus ? t(lang, 'statusActive') : t(lang, 'statusPaused');
    await msg.reply(addNavigationFooter(t(lang, 'statusToggled', state.group.name, statusText), lang));
    sessionManager.clearUserState(userId);
}

async function handlePagesPerSendInput(msg, pagesCount) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerInput = pagesCount.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        sessionManager.clearUserState(userId);
        await handleSettings(msg, state.group.group_id);
        return;
    }

    const pages = parseInt(pagesCount);

    if (isNaN(pages) || pages < 1 || pages > 50) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidPagesPerSend'), lang));
        return;
    }

    const group = state.group;
    const schedules = JSON.parse(group.cron_schedules || '["0 18 * * *"]');
    const preview = generatePreview({
        lang,
        groupName: group.name,
        field: 'pages_per_send',
        oldValue: group.pages_per_send || 1,
        newValue: pages,
        currentPage: group.current_page,
        pagesPerSend: pages,
        schedules
    });

    sessionManager.setUserState(userId, {
        command: 'edit_confirm',
        step: 'confirming',
        editData: {
            groupId: group.group_id,
            field: 'pages_per_send',
            oldValue: group.pages_per_send || 1,
            newValue: pages
        }
    });

    await msg.reply(addNavigationFooter(preview, lang));
}

async function handleDeleteConfirmation(msg, response) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const trimmed = response.trim();

    if (trimmed === '1') {
        await deleteGroup(state.group.group_id);
        await reloadJobs();
        await msg.reply(addNavigationFooter(t(lang, 'groupDeleted', state.group.name), lang));
        sessionManager.clearUserState(userId);
    } else if (trimmed === '2') {
        await msg.reply(addNavigationFooter(t(lang, 'deleteCancelled'), lang));
        sessionManager.clearUserState(userId);
    } else {
        await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 2), lang));
    }
}

async function handleWizardStep(msg, client, input) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerInput = input.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }

    const result = processWizardInput(state.step, input, state.wizardData);

    if (!result.valid) {
        await msg.reply(addNavigationFooter(t(lang, result.error), lang));
        return;
    }

    state.wizardData = result.updatedData;

    if (result.nextStep === 'preview') {
        const preview = generateWizardPreview(result.updatedData, lang);
        sessionManager.setUserState(userId, {
            command: 'wizard_confirm',
            step: 'confirming',
            wizardData: result.updatedData
        });
        await msg.reply(addNavigationFooter(preview, lang));
    } else {
        state.step = result.nextStep;
        sessionManager.setUserState(userId, state);
        const nextMessage = generateWizardStepMessage(result.nextStep, result.updatedData, lang);
        await msg.reply(nextMessage);
    }
}

async function handleWizardConfirmation(msg, client, response) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const trimmed = response.trim();

    if (trimmed === '1') {
        const { groupId, groupName, currentPage, pagesPerSend, schedules, isActive } = state.wizardData;

        try {
            const result = await linkGroup(userId, groupId, groupName);

            if (result.success) {
                await updateGroupConfig(groupId, {
                    current_page: currentPage,
                    pages_per_send: pagesPerSend,
                    cron_schedules: schedules,
                    is_active: isActive
                });

                await reloadJobs();
                await msg.reply(addNavigationFooter(t(lang, 'groupLinked', groupName), lang));
                sessionManager.clearUserState(userId);
            } else {
                await msg.reply(addNavigationFooter(t(lang, 'alreadyLinked'), lang));
                sessionManager.clearUserState(userId);
            }
        } catch (error) {
            console.error('Error saving wizard configuration:', error);
            await msg.reply(addNavigationFooter(t(lang, 'error'), lang));
            sessionManager.clearUserState(userId);
        }
    } else if (trimmed === '3') {
        const wizard = startGroupWizard(state.wizardData.groupId, state.wizardData.groupName, lang);
        sessionManager.setUserState(userId, wizard.state);
        await msg.reply(wizard.message);
    } else if (trimmed === '2') {
        await msg.reply(addNavigationFooter(t(lang, 'deleteCancelled'), lang));
        sessionManager.clearUserState(userId);
    } else {
        await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 3), lang));
    }
}

async function handleEditConfirmation(msg, input) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const trimmed = input.trim();

    if (trimmed === '1') {
        const { groupId, field, newValue } = state.editData;

        try {
            const update = {};
            update[field] = newValue;
            await updateGroupConfig(groupId, update);
            await reloadJobs();

            const group = await getGroup(groupId);
            
            const updateKeyMap = {
                'current_page': 'pageUpdated',
                'pages_per_send': 'pagesPerSendUpdated',
                'is_active': 'statusToggled'
            };
            
            const translationKey = updateKeyMap[field] || 'pageUpdated';
            await msg.reply(addNavigationFooter(t(lang, translationKey, group.name, newValue), lang));
            sessionManager.clearUserState(userId);
        } catch (error) {
            console.error('Error applying edit:', error);
            await msg.reply(addNavigationFooter(t(lang, 'error'), lang));
            sessionManager.clearUserState(userId);
        }
    } else if (trimmed === '2') {
        await msg.reply(addNavigationFooter(t(lang, 'deleteCancelled'), lang));
        sessionManager.clearUserState(userId);
    } else {
        await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 2), lang));
    }
}

// ==================== SUBSCRIPTION HANDLERS ====================

async function handleSubscription(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    await getOrCreateUser(userId);

    const subscription = await getSubscription(userId);

    if (subscription) {
        // User already subscribed - show settings
        await showSubscriptionSettings(msg, subscription);
    } else {
        // Not subscribed - ask if they want to
        sessionManager.setUserState(userId, { command: 'subscribe', step: 'prompt' });
        await msg.reply(addNavigationFooter(t(lang, 'subscribePrompt') + t(lang, 'notSubscribed'), lang));
    }
}

async function showSubscriptionSettings(msg, subscription) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const schedules = JSON.parse(subscription.cron_schedules || '["0 18 * * *"]');
    const pagesPerSend = subscription.pages_per_send || 1;

    let schedulesList = '';
    schedules.forEach((s, i) => {
        schedulesList += `   ${i + 1}. ${cronToTime(s)}\n`;
    });

    const statusText = subscription.is_active ? t(lang, 'statusActive') : t(lang, 'statusPaused');

    const configText = t(lang, 'mySubscription') +
        t(lang, 'currentPage', subscription.current_page) +
        t(lang, 'pagesPerSend', pagesPerSend) +
        t(lang, 'schedules', schedules.length) + schedulesList +
        t(lang, 'status', statusText) +
        t(lang, 'subscriptionSettings');

    sessionManager.setUserState(userId, {
        command: 'subscription_settings',
        step: 'configuring',
        subscription: subscription
    });

    await msg.reply(addNavigationFooter(configText, lang));
}

async function handleSubscribePrompt(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    if (selection === '1') {
        // Subscribe
        await getOrCreateUser(userId);
        const result = await createSubscription(userId);
        
        if (result.success) {
            await reloadJobs();
            await msg.reply(addNavigationFooter(t(lang, 'subscribed'), lang));
            // Show settings after subscribing
            await showSubscriptionSettings(msg, result.subscription);
        } else {
            await msg.reply(addNavigationFooter(t(lang, 'alreadySubscribed'), lang));
            const subscription = await getSubscription(userId);
            await showSubscriptionSettings(msg, subscription);
        }
    } else if (selection === '2') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
    } else {
        await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 2), lang));
    }
}

async function handleSubscriptionSettingsOption(msg, option) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    if (!state || !state.subscription) {
        await msg.reply(addNavigationFooter(t(lang, 'sessionExpired'), lang));
        sessionManager.clearUserState(userId);
        return;
    }

    const lowerOption = option.toLowerCase().trim();
    if (lowerOption === 'menu' || lowerOption === 'cancel' || lowerOption === 'home') {
        sessionManager.clearUserState(userId);
        await handleMenu(msg);
        return;
    }

    switch (option) {
        case '1':
            state.step = 'waiting_page';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'setPage'), lang));
            break;
        case '2':
            state.step = 'waiting_add_schedule';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'addSchedule'), lang));
            break;
        case '3':
            await handleSubscriptionRemoveSchedule(msg);
            break;
        case '4':
            state.step = 'waiting_pages_per_send';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'setPagesPerSend'), lang));
            break;
        case '5':
            await handleSubscriptionToggleStatus(msg);
            break;
        case '6':
            state.step = 'confirm_unsubscribe';
            sessionManager.setUserState(userId, state);
            await msg.reply(addNavigationFooter(t(lang, 'confirmUnsubscribe'), lang));
            break;
        case '7':
            sessionManager.clearUserState(userId);
            await handleMenu(msg);
            break;
        default:
            await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 7), lang));
    }
}

async function handleSubscriptionPageInput(msg, pageNumber) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const lowerInput = pageNumber.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        const subscription = await getSubscription(userId);
        await showSubscriptionSettings(msg, subscription);
        return;
    }

    const page = parseInt(pageNumber);
    if (isNaN(page) || page < 1 || page > 604) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidPage'), lang));
        return;
    }

    await updateSubscription(userId, { current_page: page });
    await reloadJobs();
    await msg.reply(addNavigationFooter(t(lang, 'pageUpdated', t(lang, 'yourWird'), page), lang));
    sessionManager.clearUserState(userId);
}

async function handleSubscriptionAddSchedule(msg, schedule) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const lowerInput = schedule.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        const subscription = await getSubscription(userId);
        await showSubscriptionSettings(msg, subscription);
        return;
    }

    const cron = timeToCron(schedule);
    if (!cron) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidTime'), lang));
        return;
    }

    const subscription = await getSubscription(userId);
    const currentSchedules = JSON.parse(subscription.cron_schedules || '["0 18 * * *"]');
    currentSchedules.push(cron);

    await updateSubscription(userId, { cron_schedules: currentSchedules });
    await reloadJobs();
    await msg.reply(addNavigationFooter(t(lang, 'scheduleAdded', t(lang, 'yourWird'), currentSchedules.length), lang));
    sessionManager.clearUserState(userId);
}

async function handleSubscriptionRemoveSchedule(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const schedules = JSON.parse(state.subscription.cron_schedules || '["0 18 * * *"]');

    if (schedules.length === 0) {
        await msg.reply(addNavigationFooter(t(lang, 'noSchedules'), lang));
        return;
    }

    let schedulesList = '';
    schedules.forEach((s, i) => {
        schedulesList += `${i + 1}. ${cronToTime(s)}\n`;
    });

    state.step = 'waiting_remove_schedule';
    sessionManager.setUserState(userId, state);
    await msg.reply(addNavigationFooter(t(lang, 'selectScheduleToRemove', schedulesList), lang));
}

async function handleSubscriptionRemoveScheduleSelection(msg, selection) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const lowerSelection = selection.toLowerCase().trim();
    if (lowerSelection === 'menu' || lowerSelection === 'cancel' || lowerSelection === 'back') {
        const subscription = await getSubscription(userId);
        await showSubscriptionSettings(msg, subscription);
        return;
    }

    const scheduleIndex = parseInt(selection) - 1;
    const schedules = JSON.parse(state.subscription.cron_schedules || '["0 18 * * *"]');

    if (isNaN(scheduleIndex) || scheduleIndex < 0 || scheduleIndex >= schedules.length) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidSelection'), lang));
        return;
    }

    schedules.splice(scheduleIndex, 1);
    await updateSubscription(userId, { cron_schedules: schedules });
    await reloadJobs();
    await msg.reply(addNavigationFooter(t(lang, 'scheduleRemoved', t(lang, 'yourWird')), lang));
    sessionManager.clearUserState(userId);
}

async function handleSubscriptionPagesPerSend(msg, pagesCount) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const lowerInput = pagesCount.toLowerCase().trim();
    if (lowerInput === 'menu' || lowerInput === 'cancel' || lowerInput === 'back') {
        const subscription = await getSubscription(userId);
        await showSubscriptionSettings(msg, subscription);
        return;
    }

    const pages = parseInt(pagesCount);
    if (isNaN(pages) || pages < 1 || pages > 50) {
        await msg.reply(addNavigationFooter(t(lang, 'invalidPagesPerSend'), lang));
        return;
    }

    await updateSubscription(userId, { pages_per_send: pages });
    await reloadJobs();
    await msg.reply(addNavigationFooter(t(lang, 'pagesPerSendUpdated', t(lang, 'yourWird'), pages), lang));
    sessionManager.clearUserState(userId);
}

async function handleSubscriptionToggleStatus(msg) {
    const userId = msg.from;
    const lang = await getUserLang(userId);
    const state = sessionManager.getUserState(userId);

    const newStatus = !state.subscription.is_active;
    await updateSubscription(userId, { is_active: newStatus });
    await reloadJobs();

    const statusText = newStatus ? t(lang, 'statusActive') : t(lang, 'statusPaused');
    await msg.reply(addNavigationFooter(t(lang, 'statusToggled', t(lang, 'yourWird'), statusText), lang));
    sessionManager.clearUserState(userId);
}

async function handleUnsubscribeConfirmation(msg, response) {
    const userId = msg.from;
    const lang = await getUserLang(userId);

    const trimmed = response.trim();

    if (trimmed === '1') {
        await deleteSubscription(userId);
        await reloadJobs();
        await msg.reply(addNavigationFooter(t(lang, 'unsubscribed'), lang));
        sessionManager.clearUserState(userId);
    } else if (trimmed === '2') {
        await msg.reply(addNavigationFooter(t(lang, 'deleteCancelled'), lang));
        sessionManager.clearUserState(userId);
    } else {
        await msg.reply(addNavigationFooter(t(lang, 'invalidOption', 2), lang));
    }
}

module.exports = {
    handleMessage,
    handleMenu
};

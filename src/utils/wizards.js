const { t } = require('./translations');
const { addNavigationFooter, formatProgress } = require('./messageFormatter');

function startGroupWizard(groupId, groupName, lang) {
    const wizardData = {
        groupId,
        groupName,
        currentPage: 1,
        pagesPerSend: 1,
        schedules: [],
        isActive: true
    };

    const message = generateWizardStepMessage('page', wizardData, lang);

    return {
        state: {
            command: 'wizard',
            step: 'page',
            wizardData
        },
        message
    };
}

function generateWizardStepMessage(step, wizardData, lang) {
    let message = '';

    switch (step) {
        case 'page':
            message = t(lang, 'wizardStepPage', wizardData.groupName);
            message += '\n\n' + formatProgress(1, 4, lang);
            message += '\n\n' + t(lang, 'wizardPagePrompt');
            break;

        case 'pages_per_send':
            message = t(lang, 'wizardStepPagesPerSend', wizardData.currentPage);
            message += '\n\n' + formatProgress(2, 4, lang);
            message += '\n\n' + t(lang, 'wizardPagesPerSendPrompt');
            break;

        case 'schedule':
            message = t(lang, 'wizardStepSchedule', wizardData.pagesPerSend);
            message += '\n\n' + formatProgress(3, 4, lang);
            message += '\n\n' + t(lang, 'wizardSchedulePrompt');
            break;

        case 'activate':
            message = t(lang, 'wizardStepActivate');
            message += '\n\n' + formatProgress(4, 4, lang);
            message += '\n\n' + t(lang, 'wizardActivatePrompt');
            break;
    }

    return addNavigationFooter(message, lang);
}

function processWizardInput(step, input, wizardData) {
    const result = {
        valid: false,
        error: null,
        nextStep: null,
        updatedData: { ...wizardData }
    };

    switch (step) {
        case 'page':
            const page = parseInt(input);
            if (isNaN(page) || page < 1 || page > 604) {
                result.error = 'invalidPage';
            } else {
                result.valid = true;
                result.updatedData.currentPage = page;
                result.nextStep = 'pages_per_send';
            }
            break;

        case 'pages_per_send':
            const pages = parseInt(input);
            if (isNaN(pages) || pages < 1 || pages > 50) {
                result.error = 'invalidPagesPerSend';
            } else {
                result.valid = true;
                result.updatedData.pagesPerSend = pages;
                result.nextStep = 'schedule';
            }
            break;

        case 'schedule':
            const cron = timeToCron(input);
            if (!cron) {
                result.error = 'invalidTime';
            } else {
                result.valid = true;
                result.updatedData.schedules = [cron];
                result.nextStep = 'activate';
            }
            break;

        case 'activate':
            if (input === '1' || input.toLowerCase() === 'yes' || input.toLowerCase() === 'نعم' || input.toLowerCase() === 'oui') {
                result.valid = true;
                result.updatedData.isActive = true;
                result.nextStep = 'preview';
            } else if (input === '2' || input.toLowerCase() === 'no' || input.toLowerCase() === 'لا' || input.toLowerCase() === 'non') {
                result.valid = true;
                result.updatedData.isActive = false;
                result.nextStep = 'preview';
            } else {
                result.error = 'invalidActivateOption';
            }
            break;
    }

    return result;
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

module.exports = {
    startGroupWizard,
    generateWizardStepMessage,
    processWizardInput
};

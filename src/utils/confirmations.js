const { t } = require('./translations');
const { calculateImpact, formatNextSend } = require('./messageFormatter');

function generatePreview(params) {
    const { 
        lang, 
        groupName, 
        field, 
        oldValue, 
        newValue, 
        currentPage = 1,
        pagesPerSend = 1,
        schedules = []
    } = params;

    let preview = t(lang, 'previewHeader') + '\n\n';
    preview += t(lang, 'previewGroup', groupName) + '\n';
    preview += t(lang, 'previewSetting', t(lang, `field_${field}`)) + '\n';
    preview += t(lang, 'previewCurrent', oldValue) + '\n';
    preview += t(lang, 'previewNew', newValue) + '\n\n';

    const config = { currentPage, pagesPerSend, schedules };
    const impact = calculateImpact(config);

    preview += t(lang, 'impactHeader') + '\n';
    
    if (field === 'pages_per_send') {
        const oldDays = Math.ceil((604 - currentPage + 1) / (oldValue * schedules.length));
        const newDays = impact.daysToComplete;
        preview += t(lang, 'impactPagesPerSend', oldValue, newValue, oldDays, newDays) + '\n';
    } else if (field === 'current_page') {
        preview += t(lang, 'impactPageChange', oldValue, newValue) + '\n';
    } else if (field === 'schedule') {
        preview += t(lang, 'impactScheduleChange', schedules.length) + '\n';
    }

    preview += formatNextSend(currentPage, pagesPerSend, lang) + '\n\n';
    preview += t(lang, 'confirmInstructions');

    return preview;
}

function generateWizardPreview(config, lang) {
    const { 
        groupName, 
        currentPage, 
        pagesPerSend, 
        schedules, 
        isActive 
    } = config;

    let preview = t(lang, 'wizardPreviewHeader', groupName) + '\n\n';
    
    preview += t(lang, 'configSummary') + '\n';
    preview += '━━━━━━━━━━━━━━━━━━\n';
    preview += t(lang, 'summaryPage', currentPage) + '\n';
    preview += t(lang, 'summaryPagesPerSend', pagesPerSend) + '\n';
    
    const schedulesList = schedules.map(s => cronToTime(s)).join(', ');
    preview += t(lang, 'summarySchedules', schedulesList) + '\n';
    
    const statusText = isActive ? t(lang, 'statusActive') : t(lang, 'statusPaused');
    preview += t(lang, 'summaryStatus', statusText) + '\n\n';

    const impact = calculateImpact(config);
    preview += t(lang, 'impactHeader') + '\n';
    preview += t(lang, 'impactDaily', impact.pagesPerDay) + '\n';
    preview += t(lang, 'impactCompletion', impact.daysToComplete) + '\n';
    preview += formatNextSend(currentPage, pagesPerSend, lang) + '\n\n';
    
    preview += t(lang, 'wizardConfirmInstructions');

    return preview;
}

function cronToTime(cron) {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const minute = parts[0].padStart(2, '0');
    const hour = parts[1].padStart(2, '0');

    return `${hour}:${minute}`;
}

module.exports = {
    generatePreview,
    generateWizardPreview
};

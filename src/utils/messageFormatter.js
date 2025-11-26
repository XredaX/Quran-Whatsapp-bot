const { t } = require('./translations');

function addNavigationFooter(message, lang) {
    const hint = t(lang, 'navigationHint');
    
    if (message.includes(hint)) {
        return message;
    }
    
    return message + '\n\n' + hint;
}

function formatProgress(current, total, lang) {
    return t(lang, 'wizardProgress', current, total);
}

function calculateImpact(config) {
    const { currentPage = 1, pagesPerSend = 1, schedules = ['0 18 * * *'] } = config;
    
    const totalPages = 604;
    const remainingPages = totalPages - currentPage + 1;
    const pagesPerDay = pagesPerSend * schedules.length;
    const daysToComplete = Math.ceil(remainingPages / pagesPerDay);
    
    return {
        remainingPages,
        pagesPerDay,
        daysToComplete,
        completionPercentage: Math.round(((currentPage - 1) / totalPages) * 100)
    };
}

function formatImpact(impact, lang) {
    return t(lang, 'impactInfo', 
        impact.pagesPerDay, 
        impact.daysToComplete,
        impact.completionPercentage
    );
}

function formatNextSend(currentPage, pagesPerSend, lang) {
    const endPage = currentPage + pagesPerSend - 1;
    if (pagesPerSend === 1) {
        return t(lang, 'nextSendSingle', currentPage);
    }
    return t(lang, 'nextSendMultiple', currentPage, endPage);
}

module.exports = {
    addNavigationFooter,
    formatProgress,
    calculateImpact,
    formatImpact,
    formatNextSend
};

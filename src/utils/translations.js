const translations = {
    en: {
        selectLanguage: '🌍 *Select Your Language*\n\n1️⃣ English\n2️⃣ Français (French)\n3️⃣ العربية (Arabic)\n\n_Reply with a number_',
        languageSet: '✅ Language set to English',
        menu: '📋 *Quran Bot Menu*\n\n1️⃣ Link a new group\n2️⃣ View my groups\n3️⃣ Help\n4️⃣ Change language\n\n_Reply with a number to select an option_',
        linkGroup: '📝 *Link a Group*\n\nPlease send the *exact name* of the group you want to link.\n\n_Make sure I\'m already added to that group!_',
        groupNotFound: (name) => `❌ *Group Not Found*\n\nI couldn't find a group named "${name}".\n\nPlease make sure:\n1. The name is exact\n2. I'm added to the group\n\nSend the group name again or type *menu* to go back.`,
        groupLinked: (name) => `✅ *Success!*\n\nGroup *${name}* has been linked!\n\nDefault settings:\n📄 Starting from page 1\n⏰ Daily at 6:00 PM\n\nType *menu* to see options.`,
        alreadyLinked: '⚠️ *Already Linked*\n\nThis group is already linked.\n\nType *menu* to see options.',
        error: '❌ *Error*\n\nSomething went wrong. Please try again.',
        noGroups: '📭 *No Groups Linked*\n\nYou haven\'t linked any groups yet.\n\nType *menu* to link one!',
        yourGroups: (count) => `📚 *Your Linked Groups* (${count})\n\n`,
        selectGroup: (count) => `_Reply with a number (1-${count}) to configure a group_`,
        configure: (name) => `⚙️ *Configure: ${name}*\n\n`,
        currentPage: (page) => `📄 Current Page: *${page}*\n`,
        schedules: (count) => `⏰ Schedules (${count}):\n`,
        status: (active) => `Status: ${active ? '✅ Active' : '❌ Paused'}\n\n`,
        page: 'Page',
        active: 'Active',
        paused_status: 'Paused'
    },

    fr: {
        selectLanguage: '🌍 *Sélectionnez votre langue*\n\n1️⃣ English (Anglais)\n2️⃣ Français\n3️⃣ العربية (Arabe)\n\n_Répondez avec un numéro_',
        languageSet: '✅ Langue définie sur Français',
        menu: '📋 *Menu Bot Coran*\n\n1️⃣ Lier un nouveau groupe\n2️⃣ Voir mes groupes\n3️⃣ Aide\n4️⃣ Changer de langue\n\n_Répondez avec un numéro_',
        linkGroup: '📝 *Lier un groupe*\n\nEnvoyez le *nom exact* du groupe que vous voulez lier.\n\n_Assurez-vous que je suis déjà ajouté à ce groupe!_',
        groupNotFound: (name) => `❌ *Groupe introuvable*\n\nJe n'ai pas trouvé de groupe nommé "${name}".\n\nAssurez-vous que:\n1. Le nom est exact\n2. Je suis ajouté au groupe\n\nRenvoyez le nom ou tapez *menu*.`,
        groupLinked: (name) => `✅ *Succès!*\n\nGroupe *${name}* lié!\n\nParamètres par défaut:\n📄 Page 1\n⏰ Quotidien à 18:00\n\nTapez *menu*.`,
        alreadyLinked: '⚠️ *Déjà lié*\n\nCe groupe est déjà lié.\n\nTapez *menu*.',
        error: '❌ *Erreur*\n\nQuelque chose s\'est mal passé.',
        noGroups: '📭 *Aucun groupe lié*\n\nVous n\'avez lié aucun groupe.\n\nTapez *menu*!',
        yourGroups: (count) => `📚 *Vos groupes liés* (${count})\n\n`,
        selectGroup: (count) => `_Répondez avec un numéro (1-${count})_`,
        configure: (name) => `⚙️ *Configurer: ${name}*\n\n`,
        currentPage: (page) => `📄 Page actuelle: *${page}*\n`,
        schedules: (count) => `⏰ Horaires (${count}):\n`,
        status: (active) => `Statut: ${active ? '✅ Actif' : '❌ En pause'}\n\n`,
        page: 'Page',
        active: 'Actif',
        paused_status: 'En pause'
    },

    ar: {
        selectLanguage: '🌍 *اختر لغتك*\n\n1️⃣ English (الإنجليزية)\n2️⃣ Français (الفرنسية)\n3️⃣ العربية\n\n_أجب برقم_',
        languageSet: '✅ تم تعيين اللغة إلى العربية',
        menu: '📋 *قائمة بوت القرآن*\n\n1️⃣ ربط مجموعة جديدة\n2️⃣ عرض مجموعاتي\n3️⃣ مساعدة\n4️⃣ تغيير اللغة\n\n_أجب برقم_',
        linkGroup: '📝 *ربط مجموعة*\n\nأرسل *الاسم الدقيق* للمجموعة.\n\n_تأكد من إضافتي للمجموعة أولاً!_',
        groupNotFound: (name) => `❌ *المجموعة غير موجودة*\n\nلم أجد مجموعة باسم "${name}".\n\nتأكد من:\n1. الاسم صحيح\n2. تمت إضافتي للمجموعة\n\nأرسل الاسم مرة أخرى أو اكتب *menu*.`,
        groupLinked: (name) => `✅ *نجح!*\n\nتم ربط المجموعة *${name}*!\n\nالإعدادات الافتراضية:\n📄 البدء من الصفحة 1\n⏰ يومياً في 18:00\n\nاكتب *menu*`,
        alreadyLinked: '⚠️ *مربوطة بالفعل*\n\nهذه المجموعة مربوطة بالفعل.\n\nاكتب *menu*',
        error: '❌ *خطأ*\n\nحدث خطأ ما.',
        noGroups: '📭 *لا توجد مجموعات*\n\nلم تربط أي مجموعة بعد.\n\nاكتب *menu*',
        yourGroups: (count) => `📚 *مجموعاتك المرتبطة* (${count})\n\n`,
        selectGroup: (count) => `_أجب برقم (1-${count})_`,
        configure: (name) => `⚙️ *تكوين: ${name}*\n\n`,
        currentPage: (page) => `📄 الصفحة الحالية: *${page}*\n`,
        schedules: (count) => `⏰ المواعيد (${count}):\n`,
        status: (active) => `الحالة: ${active ? '✅ نشطة' : '❌ موقوفة'}\n\n`,
        active: 'نشط',
        paused_status: 'موقوف'
    }
};

function t(lang, key, ...args) {
    const translation = translations[lang] || translations['en'];
    const text = translation[key];

    if (typeof text === 'function') {
        return text(...args);
    }
    return text || key;
}

module.exports = { translations, t };
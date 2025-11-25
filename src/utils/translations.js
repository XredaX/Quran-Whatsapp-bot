linkGroup: '📝 *Link a Group*\n\nPlease send the *exact name* of the group you want to link.\n\n_Make sure I\'m already added to that group!_',
    groupNotFound: (name) => `❌ *Group Not Found*\n\nI couldn't find a group named "${name}".\n\nPlease make sure:\n1. The name is exact\n2. I'm added to the group\n\nSend the group name again or type *menu* to go back.`,
        groupLinked: (name) => `✅ *Success!*\n\nGroup *${name}* has been linked!\n\nDefault settings:\n📄 Starting from page 1\n⏰ Daily at 6:00 PM\n\nType *menu* to see options.`,
            alreadyLinked: '⚠️ *Already Linked*\n\nThis group is already linked.\n\nType *menu* to see options.',
                error: '❌ *Error*\n\nSomething went wrong. Please try again.',

                    // My groups
                    noGroups: '📭 *No Groups Linked*\n\nYou haven\'t linked any groups yet.\n\nType *menu* to link one!',
                        yourGroups: (count) => `📚 *Your Linked Groups* (${count})\n\n`,
                            selectGroup: (count) => `_Reply with a number (1-${count}) to configure a group_`,

                                // Settings
                                configure: (name) => `⚙️ *Configure: ${name}*\n\n`,
                                    currentPage: (page) => `📄 Current Page: *${page}*\n`,
                                        schedules: (count) => `⏰ Schedules (${count}):\n`,
                                            status: (active) => `Status: ${active ? '✅ Active' : '❌ Paused'}\n\n`,
                                                whatToChange: '*What would you like to change?*\n\n1️⃣ Set start page\n2️⃣ Add schedule\n3️⃣ Remove schedule\n4️⃣ Pause/Resume\n5️⃣ Back to groups\n\n_Reply with a number_',

                                                    // Page
                                                    setPage: '📄 *Set Start Page*\n\nEnter the page number (1-604):',
                                                        invalidPage: '❌ Invalid page number. Please enter a number between 1 and 604.',
                                                            pageUpdated: (name, page) => `✅ *Updated!*\n\n${name} will start from page ${page}.\n\nType *menu* to see options.`,

                                                                // Schedule
                                                                addSchedule: '⏰ *Add Schedule*\n\nEnter the time in 24-hour format:\n\nExamples:\n• `09:00` - 9 AM\n• `12:30` - 12:30 PM\n• `18:00` - 6 PM\n\n_The bot will send daily at this time_',
                                                                    invalidTime: '❌ Invalid time format.\n\nPlease use HH:MM format (24-hour)\n\nExamples: 09:00, 14:30, 18:00',
                                                                        scheduleAdded: (name, count) => `✅ *Schedule Added!*\n\n${name} now has ${count} schedule(s).\n\nType *menu* to see options.`,
                                                                            selectToRemove: '*Select a schedule to remove:*\n\n',
                                                                                cannotRemoveLast: '❌ Cannot remove the last schedule. At least one schedule is required.',
                                                                                    invalidSelection: '❌ Invalid selection.',
                                                                                        scheduleRemoved: (time) => `✅ *Schedule Removed!*\n\nRemoved: ${time}\n\nType *menu* to see options.`,

                                                                                            // Status
                                                                                            paused: (name) => `⏸️ Paused *${name}*\n\nType *menu* to see options.`,
                                                                                                resumed: (name) => `✅ Resumed *${name}*\n\nType *menu* to see options.`,

                                                                                                    // Help
                                                                                                    help: '💡 *How to use this bot:*\n\n1. Add me to your WhatsApp group\n2. Send any message to see the menu\n3. Select "Link a new group"\n4. Enter your group name\n5. Configure settings\n\nNeed help? Just send any message!',

                                                                                                        // General
                                                                                                        invalidOption: (max) => `❌ Invalid option. Please reply with 1, 2, 3, 4, or ${max}.`,
                                                                                                            sessionExpired: '❌ Session expired. Type *menu* to start over.',
                                                                                                                page: 'Page',
                                                                                                                    active: 'Active',
                                                                                                                        paused_status: 'Paused'
    },

fr: {
    // Language selection
    selectLanguage: '🌍 *Sélectionnez votre langue*\n\n1️⃣ English (Anglais)\n2️⃣ Français\n3️⃣ العربية (Arabe)\n\n_Répondez avec un numéro_',
        languageSet: '✅ Langue définie sur Français',

            // Main menu
            menu: '📋 *Menu Bot Coran*\n\n1️⃣ Lier un nouveau groupe\n2️⃣ Voir mes groupes\n3️⃣ Aide\n4️⃣ Changer de langue\n\n_Répondez avec un numéro_',

                // Link group
                linkGroup: '📝 *Lier un groupe*\n\nEnvoyez le *nom exact* du groupe que vous voulez lier.\n\n_Assurez-vous que je suis déjà ajouté à ce groupe!_',
                    groupNotFound: (name) => `❌ *Groupe introuvable*\n\nJe n'ai pas trouvé de groupe nommé "${name}".\n\nAssurez-vous que:\n1. Le nom est exact\n2. Je suis ajouté au groupe\n\nRenvoyez le nom ou tapez *menu*.`,
                        groupLinked: (name) => `✅ *Succès!*\n\nGroupe *${name}* lié!\n\nParamètres par défaut:\n📄 Page 1\n⏰ Quotidien à 18:00\n\nTapez *menu*.`,
                            alreadyLinked: '⚠️ *Déjà lié*\n\nCe groupe est déjà lié.\n\nTapez *menu*.',
                                error: '❌ *Erreur*\n\nQuelque chose s\'est mal passé.',

                                    // My groups
                                    noGroups: '📭 *Aucun groupe lié*\n\nVous n\'avez lié aucun groupe.\n\nTapez *menu*!',
                                        yourGroups: (count) => `📚 *Vos groupes liés* (${count})\n\n`,
                                            selectGroup: (count) => `_Répondez avec un numéro (1-${count})_`,

                                                // Settings
                                                configure: (name) => `⚙️ *Configurer: ${name}*\n\n`,
                                                    currentPage: (page) => `📄 Page actuelle: *${page}*\n`,
                                                        schedules: (count) => `⏰ Horaires (${count}):\n`,
                                                            status: (active) => `Statut: ${active ? '✅ Actif' : '❌ En pause'}\n\n`,
                                                                whatToChange: '*Que voulez-vous changer?*\n\n1️⃣ Définir la page\n2️⃣ Ajouter un horaire\n3️⃣ Supprimer un horaire\n4️⃣ Pause/Reprendre\n5️⃣ Retour\n\n_Numéro_',

                                                                    // Page
                                                                    setPage: '📄 *Définir la page*\n\nEntrez le numéro (1-604):',
                                                                        invalidPage: '❌ Numéro invalide. (1-604)',
                                                                            pageUpdated: (name, page) => `✅ *Mis à jour!*\n\n${name} commencera à la page ${page}.\n\nTapez *menu*.`,

                                                                                // Schedule
                                                                                addSchedule: '⏰ *Ajouter un horaire*\n\nEntrez l\'heure (format 24h):\n\nExemples:\n• `09:00` - 9h\n• `12:30` - 12h30\n• `18:00` - 18h',
                                                                                    invalidTime: '❌ Format invalide.\n\nUtilisez HH:MM\n\nExemples: 09:00, 14:30, 18:00',
                                                                                        scheduleAdded: (name, count) => `✅ *Horaire ajouté!*\n\n${name} a ${count} horaire(s).\n\nTapez *menu*.`,
                                                                                            selectToRemove: '*Sélectionnez un horaire à supprimer:*\n\n',
                                                                                                cannotRemoveLast: '❌ Impossible de supprimer le dernier horaire.',
                                                                                                    invalidSelection: '❌ Sélection invalide.',
                                                                                                        scheduleRemoved: (time) => `✅ *Horaire supprimé!*\n\nSupprimé: ${time}\n\nTapez *menu*.`,

                                                                                                            // Status
                                                                                                            paused: (name) => `⏸️ En pause *${name}*\n\nTapez *menu*.`,
                                                                                                                resumed: (name) => `✅ Repris *${name}*\n\nTapez *menu*.`,

                                                                                                                    // Help
                                                                                                                    help: '💡 *Comment utiliser:*\n\n1. Ajoutez-moi au groupe\n2. Envoyez un message\n3. Sélectionnez "Lier un groupe"\n4. Entrez le nom\n5. Configurez\n\nBesoin d\'aide? Envoyez un message!',

                                                                                                                        // General
                                                                                                                        invalidOption: (max) => `❌ Option invalide. (1-${max})`,
                                                                                                                            sessionExpired: '❌ Session expirée. Tapez *menu*.',
                                                                                                                                page: 'Page',
                                                                                                                                    active: 'Actif',
                                                                                                                                        paused_status: 'En pause'
},

ar: {
    // Language selection
    selectLanguage: '🌍 *اختر لغتك*\n\n1️⃣ English (الإنجليزية)\n2️⃣ Français (الفرنسية)\n3️⃣ العربية\n\n_أجب برقم_',
        languageSet: '✅ تم تعيين اللغة إلى العربية',

            // Main menu
            menu: '📋 *قائمة بوت القرآن*\n\n1️⃣ ربط مجموعة جديدة\n2️⃣ عرض مجموعاتي\n3️⃣ مساعدة\n4️⃣ تغيير اللغة\n\n_أجب برقم_',

                // Link group
                linkGroup: '📝 *ربط مجموعة*\n\nأرسل *الاسم الدقيق* للمجموعة.\n\n_تأكد من إضافتي للمجموعة أولاً!_',
                    groupNotFound: (name) => `❌ *المجموعة غير موجودة*\n\nلم أجد مجموعة باسم "${name}".\n\nتأكد من:\n1. الاسم صحيح\n2. تمت إضافتي للمجموعة\n\nأرسل الاسم مرة أخرى أو اكتب *menu*.`,
                        groupLinked: (name) => `✅ *نجح!*\n\nتم ربط المجموعة *${name}*!\n\nالإعدادات الافتراضية:\n📄 البدء من الصفحة 1\n⏰ يومياً في 18:00\n\nاكتب *menu*.`,
                            alreadyLinked: '⚠️ *مربوطة بالفعل*\n\nهذه المجموعة مربوطة بالفعل.\n\nاكتب *menu*.',
                                error: '❌ *خطأ*\n\nحدث خطأ ما.',

                                    // My groups
                                    noGroups: '📭 *لا توجد مجموعات*\n\nلم تربط أي مجموعة بعد.\n\nاكتب *menu*!',
                                        yourGroups: (count) => `📚 *مجموعاتك المرتبطة* (${count})\n\n`,
                                            selectGroup: (count) => `_أجب برقم (1-${count})_`,

                                                // Settings
                                                configure: (name) => `⚙️ *تكوين: ${name}*\n\n`,
                                                    currentPage: (page) => `📄 الصفحة الحالية: *${page}*\n`,
                                                        schedules: (count) => `⏰ المواعيد (${count}):\n`,
                                                            status: (active) => `الحالة: ${active ? '✅ نشطة' : '❌ موقوفة'}\n\n`,
                                                                whatToChange: '*ماذا تريد تغيير؟*\n\n1️⃣ تعيين الصفحة\n2️⃣ إضافة موعد\n3️⃣ إزالة موعد\n4️⃣ إيقاف/استئناف\n5️⃣ رجوع\n\n_أجب برقم_',

                                                                    // Page
                                                                    setPage: '📄 *تعيين الصفحة*\n\nأدخل رقم الصفحة (1-604):',
                                                                        invalidPage: '❌ رقم غير صحيح. (1-604)',
                                                                            pageUpdated: (name, page) => `✅ *تم التحديث!*\n\n${name} ستبدأ من الصفحة ${page}.\n\nاكتب *menu*.`,

                                                                                // Schedule
                                                                                addSchedule: '⏰ *إضافة موعد*\n\nأدخل الوقت (24 ساعة):\n\nأمثلة:\n• `09:00` - 9 صباحاً\n• `12:30` - 12:30 ظهراً\n• `18:00` - 6 مساءً',
                                                                                    invalidTime: '❌ صيغة غير صحيحة.\n\nاستخدم HH:MM\n\nأمثلة: 09:00, 14:30, 18:00',
                                                                                        scheduleAdded: (name, count) => `✅ *تمت الإضافة!*\n\n${name} لديها ${count} موعد.\n\nاكتب *menu*.`,
                                                                                            selectToRemove: '*اختر موعداً للإزالة:*\n\n',
                                                                                                cannotRemoveLast: '❌ لا يمكن إزالة آخر موعد.',
                                                                                                    invalidSelection: '❌ اختيار غير صحيح.',
                                                                                                        scheduleRemoved: (time) => `✅ *تمت الإزالة!*\n\nتم إزالة: ${time}\n\nاكتب *menu*.`,

                                                                                                            // Status
                                                                                                            paused: (name) => `⏸️ تم إيقاف *${name}*\n\nاكتب *menu*.`,
                                                                                                                resumed: (name) => `✅ تم استئناف *${name}*\n\nاكتب *menu*.`,

                                                                                                                    // Help
                                                                                                                    help: '💡 *كيفية الاستخدام:*\n\n1. أضفني للمجموعة\n2. أرسل رسالة\n3. اختر "ربط مجموعة"\n4. أدخل الاسم\n5. قم بالتكوين\n\nتحتاج مساعدة? أرسل رسالة!',

                                                                                                                        // General
                                                                                                                        invalidOption: (max) => `❌ خيار غير صحيح. (1-${max})`,
                                                                                                                            sessionExpired: '❌ انتهت الجلسة. اكتب *menu*.',
                                                                                                                                page: 'صفحة',
                                                                                                                                    active: 'نشط',
                                                                                                                                        paused_status: 'موقوف'
}
};

// Get translation function
function t(lang, key, ...args) {
    const translation = translations[lang] || translations['en'];
    const text = translation[key];

    if (typeof text === 'function') {
        return text(...args);
    }
    return text || key;
}

module.exports = { translations, t };

async function getUserAccessibleGroups(client, userId) {
    try {
        const { getEffectiveUserId } = require('./phoneResolver');
        
        // Get the effective userId (uses stored phone if available)
        const effectiveUserId = await getEffectiveUserId(userId);
        const userPhone = effectiveUserId.split('@')[0];
        
        const chats = await client.getChats();
        const allGroups = chats.filter(chat => chat.isGroup);
        
        const userGroups = [];
        
        for (const group of allGroups) {
            try {
                // Fetch full group data to ensure participants are loaded
                const fullGroup = await client.getChatById(group.id._serialized);
                
                if (!fullGroup.participants || fullGroup.participants.length === 0) {
                    continue;
                }
                
                // Get all participant phone numbers
                const participantPhones = fullGroup.participants.map(p => p.id._serialized.split('@')[0]);
                
                // Check if user's phone is in participants
                const isMatch = participantPhones.some(phone => 
                    phone === userPhone ||
                    phone.endsWith(userPhone) ||
                    userPhone.endsWith(phone)
                );
                
                if (isMatch) {
                    userGroups.push({
                        id: fullGroup.id._serialized,
                        name: fullGroup.name,
                        participantCount: fullGroup.participants.length,
                        description: fullGroup.description || '',
                        createdAt: fullGroup.createdAt || null
                    });
                }
            } catch (error) {
                console.error(`Error checking group ${group.name}:`, error);
            }
        }
        
        return userGroups;
    } catch (error) {
        console.error('Error getting user accessible groups:', error);
        return [];
    }
}

async function isUserInGroup(client, groupId, userId) {
    try {
        const { getEffectiveUserId } = require('./phoneResolver');
        
        // Get the effective userId (uses stored phone if available)
        const effectiveUserId = await getEffectiveUserId(userId);
        const userPhone = effectiveUserId.split('@')[0];
        
        const chat = await client.getChatById(groupId);
        
        if (!chat.isGroup) {
            return false;
        }
        
        // Get all participant phone numbers
        const participantPhones = chat.participants.map(p => p.id._serialized.split('@')[0]);
        
        // Check if user's phone is in participants
        return participantPhones.some(phone => 
            phone === userPhone ||
            phone.endsWith(userPhone) ||
            userPhone.endsWith(phone)
        );
    } catch (error) {
        console.error(`Error checking if user is in group ${groupId}:`, error);
        return false;
    }
}

async function getGroupInfo(client, groupId) {
    try {
        const chat = await client.getChatById(groupId);
        
        if (!chat.isGroup) {
            return null;
        }
        
        return {
            id: chat.id._serialized,
            name: chat.name,
            participantCount: chat.participants.length,
            description: chat.description || '',
            createdAt: chat.createdAt || null
        };
    } catch (error) {
        console.error(`Error getting group info for ${groupId}:`, error);
        return null;
    }
}

module.exports = {
    getUserAccessibleGroups,
    isUserInGroup,
    getGroupInfo
};

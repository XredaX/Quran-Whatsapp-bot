async function getUserAccessibleGroups(client, userId) {
    try {
        const chats = await client.getChats();
        const allGroups = chats.filter(chat => chat.isGroup);
        
        const userGroups = [];
        
        for (const group of allGroups) {
            try {
                const participants = group.participants.map(p => p.id._serialized);
                
                if (participants.includes(userId)) {
                    userGroups.push({
                        id: group.id._serialized,
                        name: group.name,
                        participantCount: group.participants.length,
                        description: group.description || '',
                        createdAt: group.createdAt || null
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
        const chat = await client.getChatById(groupId);
        
        if (!chat.isGroup) {
            return false;
        }
        
        const participants = chat.participants.map(p => p.id._serialized);
        return participants.includes(userId);
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

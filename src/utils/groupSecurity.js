async function getUserAccessibleGroups(client, userId) {
    try {
        const chats = await client.getChats();
        const allGroups = chats.filter(chat => chat.isGroup);
        
        console.log(`Found ${allGroups.length} total groups`);
        
        const userGroups = [];
        
        for (const group of allGroups) {
            try {
                // Fetch full group data to ensure participants are loaded
                const fullGroup = await client.getChatById(group.id._serialized);
                
                if (!fullGroup.participants || fullGroup.participants.length === 0) {
                    console.log(`Group ${group.name} has no participants loaded, skipping`);
                    continue;
                }
                
                const participants = fullGroup.participants.map(p => p.id._serialized);
                
                // Debug: log userId format
                console.log(`Checking userId: ${userId}`);
                console.log(`Sample participant: ${participants[0]}`);
                
                // Try different matching strategies
                const isDirectMatch = participants.includes(userId);
                const isWithoutSuffix = participants.some(p => p.startsWith(userId.split('@')[0]));
                const userWithoutSuffix = userId.split('@')[0];
                const isMatch = participants.some(p => 
                    p === userId || 
                    p.startsWith(userWithoutSuffix) || 
                    p.includes(userWithoutSuffix)
                );
                
                if (isMatch) {
                    userGroups.push({
                        id: fullGroup.id._serialized,
                        name: fullGroup.name,
                        participantCount: fullGroup.participants.length,
                        description: fullGroup.description || '',
                        createdAt: fullGroup.createdAt || null
                    });
                    console.log(`✓ User is member of: ${fullGroup.name}`);
                } else {
                    console.log(`✗ User not in: ${fullGroup.name}`);
                }
            } catch (error) {
                console.error(`Error checking group ${group.name}:`, error);
            }
        }
        
        console.log(`User has access to ${userGroups.length} groups`);
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

async function getUserAccessibleGroups(client, userId) {
    try {
        const chats = await client.getChats();
        const allGroups = chats.filter(chat => chat.isGroup);
        
        console.log(`Found ${allGroups.length} total groups`);
        
        // Get the actual phone number from the contact
        let userPhone = userId.split('@')[0];
        
        // If userId is @lid format, try to get the real number from contact
        if (userId.includes('@lid')) {
            try {
                const contact = await client.getContactById(userId);
                if (contact && contact.number) {
                    userPhone = contact.number;
                    console.log(`Resolved @lid to phone: ${userPhone}`);
                }
            } catch (e) {
                console.log(`Could not resolve @lid contact, using raw: ${userPhone}`);
            }
        }
        
        console.log(`Looking for user phone: ${userPhone}`);
        
        const userGroups = [];
        
        for (const group of allGroups) {
            try {
                // Fetch full group data to ensure participants are loaded
                const fullGroup = await client.getChatById(group.id._serialized);
                
                if (!fullGroup.participants || fullGroup.participants.length === 0) {
                    console.log(`Group ${group.name} has no participants loaded, skipping`);
                    continue;
                }
                
                // Get all participant phone numbers
                const participantPhones = fullGroup.participants.map(p => p.id._serialized.split('@')[0]);
                
                // Check if user's phone is in participants (try multiple matching strategies)
                const isMatch = participantPhones.some(phone => 
                    phone === userPhone ||
                    phone.endsWith(userPhone) ||
                    userPhone.endsWith(phone) ||
                    phone.includes(userPhone) ||
                    userPhone.includes(phone)
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
                    console.log(`✗ User not in: ${fullGroup.name} (participants: ${participantPhones.slice(0, 3).join(', ')}...)`);
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

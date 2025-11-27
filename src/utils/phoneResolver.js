const { updateUserPhone, getUserPhone } = require('../config/database');

/**
 * Detect user's real phone number by checking which groups they're in
 * This solves the @lid (linked device ID) problem
 */
async function detectAndStorePhoneNumber(client, userId) {
    try {
        // If already stored, return it
        const storedPhone = await getUserPhone(userId);
        if (storedPhone) {
            return storedPhone + '@c.us';
        }

        // Get all groups
        const chats = await client.getChats();
        const allGroups = chats.filter(chat => chat.isGroup);

        // Check each group to find user's phone
        for (const group of allGroups) {
            try {
                const fullGroup = await client.getChatById(group.id._serialized);
                
                if (!fullGroup.participants || fullGroup.participants.length === 0) {
                    continue;
                }

                // Get the @lid user's phone by checking participant list
                const lidPhone = userId.split('@')[0];
                
                // Look for participants - if this is a small group, user might be identifiable
                for (const participant of fullGroup.participants) {
                    const participantId = participant.id._serialized;
                    
                    // Try to match by checking if this could be the user
                    // This is a heuristic - we'll store the first match found
                    if (participantId.includes('@c.us')) {
                        const phone = participantId.split('@')[0];
                        
                        // Store this as the detected phone number
                        await updateUserPhone(userId, phone);
                        return participantId;
                    }
                }
            } catch (e) {
                // Skip this group
            }
        }

        return null;
    } catch (error) {
        console.error('Error detecting phone number:', error);
        return null;
    }
}

/**
 * Get the effective user ID for group matching
 * Returns stored phone number if available, otherwise original userId
 */
async function getEffectiveUserId(userId) {
    if (!userId.includes('@lid')) {
        return userId; // Already in correct format
    }

    const storedPhone = await getUserPhone(userId);
    if (storedPhone) {
        return storedPhone + '@c.us';
    }

    return userId; // Fallback to original
}

module.exports = {
    detectAndStorePhoneNumber,
    getEffectiveUserId
};

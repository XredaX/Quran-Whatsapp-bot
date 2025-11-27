/**
 * Session Manager - Handles per-user message queuing and state isolation
 * Prevents race conditions and ensures messages are processed sequentially per user
 */

class UserSession {
    constructor(userId) {
        this.userId = userId;
        this.state = null;
        this.messageQueue = [];
        this.isProcessing = false;
        this.lastActivity = Date.now();
    }

    /**
     * Add a message to the user's queue and process if not already processing
     */
    async enqueueMessage(msg, client, handler) {
        this.lastActivity = Date.now();
        this.messageQueue.push({ msg, client, handler });

        // If not currently processing, start processing the queue
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    /**
     * Process all messages in the queue sequentially
     */
    async processQueue() {
        if (this.isProcessing) {
            return; // Already processing
        }

        this.isProcessing = true;

        try {
            while (this.messageQueue.length > 0) {
                const { msg, client, handler } = this.messageQueue.shift();
                
                try {
                    await handler(msg, client, this);
                } catch (error) {
                    console.error(`Error processing message for user ${this.userId}:`, error);
                    
                    // Try to notify the user about the error
                    try {
                        await msg.reply('❌ An error occurred. Please try again later.');
                    } catch (replyError) {
                        console.error(`Failed to send error message to user ${this.userId}:`, replyError);
                    }
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Get the current state for this user
     */
    getState() {
        return this.state;
    }

    /**
     * Set the state for this user
     */
    setState(state) {
        this.state = state;
        this.lastActivity = Date.now();
    }

    /**
     * Clear the state for this user
     */
    clearState() {
        this.state = null;
        this.lastActivity = Date.now();
    }

    /**
     * Check if the session has expired (inactive for more than 30 minutes)
     */
    isExpired(timeoutMs = 30 * 60 * 1000) {
        return Date.now() - this.lastActivity > timeoutMs;
    }
}

class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.cleanupInterval = null;
        this.startCleanup();
    }

    /**
     * Get or create a session for a user
     */
    getSession(userId) {
        if (!this.sessions.has(userId)) {
            this.sessions.set(userId, new UserSession(userId));
        }
        return this.sessions.get(userId);
    }

    /**
     * Enqueue a message for processing
     */
    async handleMessage(msg, client, handler) {
        const userId = msg.from;
        const session = this.getSession(userId);
        await session.enqueueMessage(msg, client, handler);
    }

    /**
     * Get user state (backward compatibility with old userStates object)
     */
    getUserState(userId) {
        const session = this.sessions.get(userId);
        return session ? session.getState() : null;
    }

    /**
     * Set user state (backward compatibility with old userStates object)
     */
    setUserState(userId, state) {
        const session = this.getSession(userId);
        session.setState(state);
    }

    /**
     * Clear user state (backward compatibility with old userStates object)
     */
    clearUserState(userId) {
        const session = this.sessions.get(userId);
        if (session) {
            session.clearState();
        }
    }

    /**
     * Delete a user session completely
     */
    deleteSession(userId) {
        this.sessions.delete(userId);
    }

    /**
     * Start periodic cleanup of expired sessions
     */
    startCleanup() {
        // Clean up expired sessions every 10 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 10 * 60 * 1000);
    }

    /**
     * Clean up sessions that have been inactive for more than 30 minutes
     */
    cleanupExpiredSessions() {
        const expiredUsers = [];
        
        for (const [userId, session] of this.sessions.entries()) {
            if (session.isExpired()) {
                expiredUsers.push(userId);
            }
        }

        expiredUsers.forEach(userId => {
            console.log(`Cleaning up expired session for user: ${userId}`);
            this.sessions.delete(userId);
        });

        if (expiredUsers.length > 0) {
            console.log(`Cleaned up ${expiredUsers.length} expired session(s)`);
        }
    }

    /**
     * Stop the cleanup interval
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

    /**
     * Get statistics about active sessions
     */
    getStats() {
        const stats = {
            totalSessions: this.sessions.size,
            activeSessions: 0,
            processingSessions: 0,
            queuedMessages: 0
        };

        for (const session of this.sessions.values()) {
            if (session.state !== null) {
                stats.activeSessions++;
            }
            if (session.isProcessing) {
                stats.processingSessions++;
            }
            stats.queuedMessages += session.messageQueue.length;
        }

        return stats;
    }
}

// Export singleton instance
const sessionManager = new SessionManager();

module.exports = {
    sessionManager,
    UserSession,
    SessionManager
};

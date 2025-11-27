const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                whatsapp_id VARCHAR(255) PRIMARY KEY,
                phone_number VARCHAR(20),
                language VARCHAR(10) DEFAULT 'en',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add phone_number column if it doesn't exist (migration)
        await client.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS groups (
                id SERIAL PRIMARY KEY,
                group_id VARCHAR(255) UNIQUE NOT NULL,
                user_id VARCHAR(255) REFERENCES users(whatsapp_id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                current_page INTEGER DEFAULT 1,
                cron_schedules TEXT DEFAULT '[\"0 18 * * *\"]',
                is_active BOOLEAN DEFAULT true,
                pages_per_send INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Private subscriptions table
        await client.query(`
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) UNIQUE REFERENCES users(whatsapp_id) ON DELETE CASCADE,
                current_page INTEGER DEFAULT 1,
                cron_schedules TEXT DEFAULT '[\"0 18 * * *\"]',
                is_active BOOLEAN DEFAULT true,
                pages_per_send INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Khatma completions tracking
        await client.query(`
            CREATE TABLE IF NOT EXISTS khatmas (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(whatsapp_id) ON DELETE CASCADE,
                group_id VARCHAR(255),
                is_private BOOLEAN DEFAULT false,
                started_at TIMESTAMP,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total_days INTEGER
            )
        `);

        console.log('Database schema initialized');
    } finally {
        client.release();
    }
}

async function getOrCreateUser(whatsappId) {
    const result = await pool.query(
        'INSERT INTO users (whatsapp_id) VALUES ($1) ON CONFLICT (whatsapp_id) DO NOTHING RETURNING *',
        [whatsappId]
    );
    return result.rows[0] || { whatsapp_id: whatsappId };
}

async function getUserGroups(whatsappId) {
    const result = await pool.query(
        'SELECT * FROM groups WHERE user_id = $1 ORDER BY created_at DESC',
        [whatsappId]
    );
    return result.rows;
}

async function linkGroup(whatsappId, groupId, groupName) {
    try {
        const result = await pool.query(
            'INSERT INTO groups (group_id, user_id, name) VALUES ($1, $2, $3) RETURNING *',
            [groupId, whatsappId, groupName]
        );
        return { success: true, group: result.rows[0] };
    } catch (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Group already linked' };
        }
        throw error;
    }
}

async function getAllActiveGroups() {
    const result = await pool.query(
        'SELECT * FROM groups WHERE is_active = true'
    );
    return result.rows;
}

async function updateGroupConfig(groupId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.current_page !== undefined) {
        fields.push(`current_page = $${paramCount++}`);
        values.push(updates.current_page);
    }
    if (updates.cron_schedules !== undefined) {
        fields.push(`cron_schedules = $${paramCount++}`);
        values.push(JSON.stringify(updates.cron_schedules));
    }
    if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updates.is_active);
    }
    if (updates.pages_per_send !== undefined) {
        fields.push(`pages_per_send = $${paramCount++}`);
        values.push(updates.pages_per_send);
    }

    if (fields.length === 0) return null;

    values.push(groupId);
    const result = await pool.query(
        `UPDATE groups SET ${fields.join(', ')} WHERE group_id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
}

async function getGroup(groupId) {
    const result = await pool.query(
        'SELECT * FROM groups WHERE group_id = $1',
        [groupId]
    );
    return result.rows[0];
}

async function deleteGroup(groupId) {
    await pool.query('DELETE FROM groups WHERE group_id = $1', [groupId]);
}

async function getUser(whatsappId) {
    const result = await pool.query(
        'SELECT * FROM users WHERE whatsapp_id = $1',
        [whatsappId]
    );
    return result.rows[0];
}

async function updateUserLanguage(whatsappId, language) {
    await pool.query(
        'UPDATE users SET language = $1 WHERE whatsapp_id = $2',
        [language, whatsappId]
    );
}

async function updateUserPhone(whatsappId, phoneNumber) {
    await pool.query(
        'UPDATE users SET phone_number = $1 WHERE whatsapp_id = $2',
        [phoneNumber, whatsappId]
    );
}

async function getUserPhone(whatsappId) {
    const result = await pool.query(
        'SELECT phone_number FROM users WHERE whatsapp_id = $1',
        [whatsappId]
    );
    return result.rows[0]?.phone_number;
}

// Subscription functions for private chat
async function getSubscription(userId) {
    const result = await pool.query(
        'SELECT * FROM subscriptions WHERE user_id = $1',
        [userId]
    );
    return result.rows[0];
}

async function createSubscription(userId) {
    try {
        const result = await pool.query(
            'INSERT INTO subscriptions (user_id) VALUES ($1) RETURNING *',
            [userId]
        );
        return { success: true, subscription: result.rows[0] };
    } catch (error) {
        if (error.code === '23505') {
            return { success: false, error: 'Already subscribed' };
        }
        throw error;
    }
}

async function updateSubscription(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.current_page !== undefined) {
        fields.push(`current_page = $${paramCount++}`);
        values.push(updates.current_page);
    }
    if (updates.cron_schedules !== undefined) {
        fields.push(`cron_schedules = $${paramCount++}`);
        values.push(JSON.stringify(updates.cron_schedules));
    }
    if (updates.is_active !== undefined) {
        fields.push(`is_active = $${paramCount++}`);
        values.push(updates.is_active);
    }
    if (updates.pages_per_send !== undefined) {
        fields.push(`pages_per_send = $${paramCount++}`);
        values.push(updates.pages_per_send);
    }

    if (fields.length === 0) return null;

    values.push(userId);
    const result = await pool.query(
        `UPDATE subscriptions SET ${fields.join(', ')} WHERE user_id = $${paramCount} RETURNING *`,
        values
    );
    return result.rows[0];
}

async function deleteSubscription(userId) {
    await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId]);
}

async function getAllActiveSubscriptions() {
    const result = await pool.query(
        'SELECT s.*, u.language FROM subscriptions s JOIN users u ON s.user_id = u.whatsapp_id WHERE s.is_active = true'
    );
    return result.rows;
}

// Khatma functions
async function recordKhatma(userId, groupId, isPrivate, startedAt) {
    const totalDays = startedAt ? Math.ceil((Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
    const result = await pool.query(
        'INSERT INTO khatmas (user_id, group_id, is_private, started_at, total_days) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, groupId, isPrivate, startedAt, totalDays]
    );
    return result.rows[0];
}

async function getKhatmaCount(userId, groupId, isPrivate) {
    let result;
    if (isPrivate) {
        result = await pool.query(
            'SELECT COUNT(*) as count FROM khatmas WHERE user_id = $1 AND is_private = true',
            [userId]
        );
    } else {
        result = await pool.query(
            'SELECT COUNT(*) as count FROM khatmas WHERE group_id = $1',
            [groupId]
        );
    }
    return parseInt(result.rows[0].count);
}

async function getKhatmaHistory(userId, groupId, isPrivate, limit = 5) {
    let result;
    if (isPrivate) {
        result = await pool.query(
            'SELECT * FROM khatmas WHERE user_id = $1 AND is_private = true ORDER BY completed_at DESC LIMIT $2',
            [userId, limit]
        );
    } else {
        result = await pool.query(
            'SELECT * FROM khatmas WHERE group_id = $1 ORDER BY completed_at DESC LIMIT $2',
            [groupId, limit]
        );
    }
    return result.rows;
}

async function clearKhatmaHistory(userId, groupId, isPrivate) {
    if (isPrivate) {
        await pool.query('DELETE FROM khatmas WHERE user_id = $1 AND is_private = true', [userId]);
    } else {
        await pool.query('DELETE FROM khatmas WHERE group_id = $1', [groupId]);
    }
}

module.exports = {
    initDatabase,
    getOrCreateUser,
    getUser,
    updateUserLanguage,
    updateUserPhone,
    getUserPhone,
    getUserGroups,
    linkGroup,
    getAllActiveGroups,
    updateGroupConfig,
    getGroup,
    deleteGroup,
    getSubscription,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    getAllActiveSubscriptions,
    recordKhatma,
    getKhatmaCount,
    getKhatmaHistory,
    clearKhatmaHistory
};

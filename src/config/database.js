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
                language VARCHAR(10) DEFAULT 'en',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

module.exports = {
    initDatabase,
    getOrCreateUser,
    getUser,
    updateUserLanguage,
    getUserGroups,
    linkGroup,
    getAllActiveGroups,
    updateGroupConfig,
    getGroup,
    deleteGroup
};

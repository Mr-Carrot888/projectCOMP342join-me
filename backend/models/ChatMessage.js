const db = require('../config/db');

class ChatMessage {
    // บันทึกข้อความใหม่
    static async create(messageData) {
        const { message_id, request_id, sender_id, receiver_id, content, is_location_sharing } = messageData;
        const sql = `INSERT INTO chat_message (message_id, request_id, sender_id, receiver_id, content, is_location_sharing)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return db.execute(sql, [message_id, request_id, sender_id, receiver_id, content, is_location_sharing || 0]);
    }

    // ดึงประวัติแชตของคำขอนั้นๆ
    static async findByRequestId(requestId) {
        const sql = `SELECT * FROM chat_message WHERE request_id = ? ORDER BY created_at ASC`;
        const [rows] = await db.execute(sql, [requestId]);
        return rows;
    }
}

module.exports = ChatMessage;
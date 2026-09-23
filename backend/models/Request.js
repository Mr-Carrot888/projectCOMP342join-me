const db = require('../config/db');

class Request {
    // ส่งคำขอเข้าร่วม
    static async create(requestData) {
        const { request_id, post_id, sender_id, receiver_id } = requestData;
        const sql = `INSERT INTO connection_request (request_id, post_id, sender_id, receiver_id)
                     VALUES (?, ?, ?, ?)`;
        return db.execute(sql, [request_id, post_id, sender_id, receiver_id]);
    }

    // อัปเดตสถานะ (เช่น Host กดอนุมัติหรือปฏิเสธ)
    static async updateStatus(requestId, status) {
        const sql = `UPDATE connection_request SET status = ? WHERE request_id = ?`;
        return db.execute(sql, [status, requestId]);
    }

    // ดูคำขอทั้งหมดของโพสต์นั้นๆ
    static async findByPostId(postId) {
        const sql = `SELECT * FROM connection_request WHERE post_id = ?`;
        const [rows] = await db.execute(sql, [postId]);
        return rows;
    }

    // ดึงคำขอตาม request_id
    static async findById(requestId) {
        const sql = `SELECT * FROM connection_request WHERE request_id = ?`;
        const [rows] = await db.execute(sql, [requestId]);
        return rows[0];
    }

    // ค้นหาว่าเคยส่งคำขอในโพสต์นี้ไปหรือยัง
    static async findByPostAndSender(postId, senderId) {
        const sql = `SELECT * FROM connection_request WHERE post_id = ? AND sender_id = ?`;
        const [rows] = await db.execute(sql, [postId, senderId]);
        return rows[0];
    }
}

module.exports = Request;
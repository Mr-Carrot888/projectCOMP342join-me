const db = require('../config/db');

class User {
    // 1. ดึงข้อมูลผู้ใช้ทั้งหมด
    static async findAll() {
        const sql = `SELECT user_id, email, name, is_verified, status, created_at FROM user`;
        const [rows] = await db.execute(sql);
        return rows;
    }

    // 2. สร้างผู้ใช้ใหม่ (สมัครสมาชิก)
    static async create(userData) {
        const { user_id, email, password_hash, name, is_verified, status, verification_token, token_expires_at } = userData;
        const sql = `INSERT INTO user (user_id, email, password_hash, name, is_verified, status, verification_token, token_expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.execute(sql, [
            user_id, 
            email, 
            password_hash, 
            name, 
            is_verified || 0, 
            status || 'Active',
            verification_token || null,
            token_expires_at || null
        ]);
        return result;
    }

    // 3. ค้นหาผู้ใช้ด้วยอีเมล (สำหรับ Login)
    static async findByEmail(email) {
        const sql = `SELECT * FROM user WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    }

    // 4. ค้นหาผู้ใช้ด้วย ID
    static async findById(userId) {
        const sql = `SELECT * FROM user WHERE user_id = ?`;
        const [rows] = await db.execute(sql, [userId]);
        return rows[0];
    }

    // 5. บันทึก Token ยืนยันอีเมลและวันหมดอายุ (15 นาที)
    static async setVerificationToken(userId, token, expiresAt) {
        const sql = `UPDATE user SET verification_token = ?, token_expires_at = ? WHERE user_id = ?`;
        const [result] = await db.execute(sql, [token, expiresAt, userId]);
        return result;
    }

    // 6. ค้นหาผู้ใช้ด้วย Token ยืนยันอีเมล (สำหรับ Verify Email)
    static async findByVerificationToken(token) {
        const sql = `SELECT * FROM user WHERE verification_token = ?`;
        const [rows] = await db.execute(sql, [token]);
        return rows[0];
    }

    // 7. ยืนยันอีเมลสำเร็จ (is_verified = 1 + บันทึกเวลาที่ยืนยันล่าสุด + ล้าง Token)
    static async setVerified(userId) {
        const sql = `UPDATE user SET is_verified = 1, verification_token = NULL, token_expires_at = NULL, last_verified_at = NOW() WHERE user_id = ?`;
        const [result] = await db.execute(sql, [userId]);
        return result;
    }

    // 8. รีเซ็ตสถานะสำหรับการยืนยันตัวตนซ้ำประจำปี (is_verified = 0 + token ชุดใหม่)
    static async revokeForReverification(userId, token, expiresAt) {
        const sql = `UPDATE user SET is_verified = 0, verification_token = ?, token_expires_at = ? WHERE user_id = ?`;
        const [result] = await db.execute(sql, [token, expiresAt, userId]);
        return result;
    }
}

module.exports = User;
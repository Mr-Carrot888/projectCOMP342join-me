const db = require('../config/db');

class User {
    // ----------------------------------------------------
    // เพิ่มฟังก์ชันใหม่ตรงนี้: สำหรับดึงข้อมูลผู้ใช้ทั้งหมด
    // ----------------------------------------------------
    static async findAll() {
        // นำคำสั่ง SQL มาไว้ที่นี่แทน
        const sql = `SELECT user_id, email, name, is_verified, status, created_at FROM user`;
        const [rows] = await db.execute(sql);
        return rows;
    }
}

class newUser {
    // สร้างผู้ใช้ใหม่
    static async create(userData) {
        const { user_id, email, password_hash, name, is_verified, status } = userData;
        const sql = `INSERT INTO user (user_id, email, password_hash, name, is_verified, status)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        return db.execute(sql, [user_id, email, password_hash, name, is_verified || 0, status || 'Active']);
    }

    // ค้นหาผู้ใช้ด้วยอีเมล (สำหรับตอน Login)
    static async findByEmail(email) {
        const sql = `SELECT * FROM user WHERE email = ?`;
        const [rows] = await db.execute(sql, [email]);
        return rows[0];
    }

    // ค้นหาผู้ใช้ด้วย ID
    static async findById(userId) {
        const sql = `SELECT * FROM user WHERE user_id = ?`;
        const [rows] = await db.execute(sql, [userId]);
        return rows[0];
    }
}

module.exports = User,newUser;
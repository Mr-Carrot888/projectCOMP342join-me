const db = require('../config/db');

class Post {
    static async create(postData) {
        const { post_id, host_id, title, category, location, date_time, max_participants } = postData;
        const sql = `INSERT INTO activity_post (post_id, host_id, title, category, location, date_time, max_participants)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        return db.execute(sql, [post_id, host_id, title, category, location, date_time, max_participants]);
    }

    // ดึงโพสต์ที่ยังเปิดรับอยู่ (หน้า Home Feed)
    static async findAllOpen() {
        const sql = `SELECT * FROM activity_post WHERE post_status = 'Open' ORDER BY created_at DESC`;
        const [rows] = await db.execute(sql);
        return rows;
    }

    static async findById(postId) {
        const sql = `SELECT * FROM activity_post WHERE post_id = ?`;
        const [rows] = await db.execute(sql, [postId]);
        return rows[0];
    }
}

module.exports = Post;
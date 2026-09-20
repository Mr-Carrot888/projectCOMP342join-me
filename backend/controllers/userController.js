// นำเข้า Model ที่เราเพิ่งสร้าง แทนการเรียกใช้ db โดยตรง
const User = require('../models/User'); 
const db = require('../config/db'); // เก็บไว้ชั่วคราวสำหรับ getAllUsers ถ้ายังไม่ได้ย้ายคำสั่งไป Model

// ดึงข้อมูลผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        // อนาคตแนะนำให้ย้ายคำสั่ง SQL นี้ไปสร้างเป็น static async findAll() ใน models/User.js ครับ
        const [rows] = await db.query('SELECT user_id, email, name, is_verified, status, created_at FROM user');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// เพิ่มผู้ใช้ใหม่
exports.createUser = async (req, res) => {
    try {
        // เรียกใช้เมธอด create จาก User Model ที่เราสร้างไว้
        await User.create(req.body);

        res.status(201).json({
            message: 'User Created Successfully',
            user_id: req.body.user_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
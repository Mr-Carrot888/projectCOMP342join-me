// นำเข้าเฉพาะ Model เท่านั้น ไม่ต้องนำเข้า '../config/db' แล้ว
const User = require('../models/User'); 

// ดึงข้อมูลผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        // เรียกใช้ฟังก์ชัน findAll() จาก Model ได้เลย โค้ดจะดูสะอาดขึ้นมาก
        const users = await User.findAll(); 
        
        // ส่งข้อมูลกลับไปให้ Frontend หรือ Postman
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// เพิ่มผู้ใช้ใหม่
exports.createUser = async (req, res) => {
    try {
        await User.create(req.body);

        res.status(201).json({
            message: 'User Created Successfully',
            user_id: req.body.user_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
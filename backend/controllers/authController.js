const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// อ้างอิง Path ถอย 1 ขั้นไปที่ models/User.js และ config/db.js
const User = require('../models/User'); 
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// 1. สมัครสมาชิก (Register)
exports.register = async (req, res) => {
    try {
        const { user_id, email, password, name } = req.body;

        if (!user_id || !email || !password || !name) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ตรวจสอบอีเมลสถาบัน (.ac.th หรือ .edu)
        const isUniEmail = email.endsWith('.ac.th');
        if (!isUniEmail) {
            return res.status(400).json({ message: 'ต้องใช้อีเมลมหาวิทยาลัยในการสมัครเท่านั้น' });
        }

        // เช็กอีเมลซ้ำ
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
        }

        // เข้ารหัสรหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // บันทึกลงฐานข้อมูล
        await User.create({
            user_id,
            email,
            password_hash,
            name,
            is_verified: isUniEmail ? 1 : 0,
            status: 'Active'
        });

        res.status(201).json({
            message: 'สมัครสมาชิกสำเร็จ',
            user_id,
            email
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ยืนยันอีเมลสถาบัน (Verify Email)
exports.verifyEmail = async (req, res) => {
    try {
        const { user_id } = req.body;

        const user = await User.findById(user_id);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        await db.execute('UPDATE user SET is_verified = 1 WHERE user_id = ?', [user_id]);

        res.status(200).json({ message: 'ยืนยันอีเมลสถาบันเรียบร้อยแล้ว' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. เข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        if (user.status !== 'Active') {
            return res.status(403).json({ message: `บัญชีของคุณถูกระงับหรือแช่แข็ง (${user.status})` });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // สร้าง JWT Token
        const token = jwt.sign(
            { 
                user_id: user.user_id, 
                email: user.email,
                is_verified: user.is_verified 
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'เข้าสู่ระบบสำเร็จ',
            token,
            user: {
                user_id: user.user_id,
                name: user.name,
                email: user.email,
                is_verified: user.is_verified,
                status: user.status
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
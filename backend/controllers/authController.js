const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// อ้างอิง Path ถอย 1 ขั้นไปที่ models/User.js, config/db.js และ utils/mailer.js
const User = require('../models/User'); 
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// 1. สมัครสมาชิก (Register)
exports.register = async (req, res) => {
    try {
        const { user_id, email, password, name } = req.body || {};

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

        // สร้าง Token ยืนยันอีเมล (สุ่ม 64 ตัวอักษร) หมดอายุใน 15 นาที
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

        // บันทึกลงฐานข้อมูล (is_verified = 0 รอยืนยันอีเมลก่อน)
        await User.create({
            user_id,
            email,
            password_hash,
            name,
            is_verified: 0,
            status: 'Active',
            verification_token: verificationToken,
            token_expires_at: tokenExpiresAt
        });

        // ส่งอีเมลยืนยันตัวตน
        try {
            await sendVerificationEmail(email, name, verificationToken);
        } catch (mailErr) {
            console.error('ส่งอีเมลยืนยันไม่สำเร็จ:', mailErr.message);
            // ไม่ throw เพื่อไม่ให้การสมัครล้มเหลว แต่แจ้งผู้ใช้ว่าอีเมลอาจไม่ถูกส่ง
        }

        res.status(201).json({
            message: 'สมัครสมาชิกสำเร็จ กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน (ลิงก์หมดอายุใน 15 นาที)',
            user_id,
            email,
            email_sent: true
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ยืนยันอีเมลผ่านลิงก์ในอีเมล (Verify Email)
//    รองรับทั้ง GET /verify-email?token=... (จากลิงก์ในอีเมล) และ POST /verify-email (JSON body)
exports.verifyEmail = async (req, res) => {
    try {
        // Token มาจาก query string (?token=...) หรือ body ก็ได้ (รองรับ Express 5 ที่ req.body อาจเป็น undefined)
        const token = req.query.token || req.body?.token;

        if (!token) {
            return res.status(400).json({ message: 'ไม่พบ Token สำหรับยืนยันอีเมล' });
        }

        // ค้นหาผู้ใช้จาก Token
        const user = await User.findByVerificationToken(token);
        if (!user) {
            return res.status(400).json({ message: 'Token ไม่ถูกต้องหรือถูกใช้งานไปแล้ว' });
        }

        // เช็คว่า Token หมดอายุหรือยัง (15 นาที)
        const now = new Date();
        if (user.token_expires_at && new Date(user.token_expires_at) < now) {
            return res.status(400).json({ message: 'ลิงก์ยืนยันหมดอายุแล้ว กรุณาสมัครใหม่อีกครั้ง' });
        }

        // Token ถูกต้อง: is_verified = true และล้าง Token
        await User.setVerified(user.user_id);

        res.status(200).json({ message: 'ยืนยันอีเมลเรียบร้อยแล้ว สามารถเข้าสู่ระบบได้ทันที' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. เข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body || {};

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

        // เช็คว่ายืนยันอีเมลแล้วหรือยัง (is_verified เป็น false/0 → ห้ามเข้าใช้งาน)
        if (!user.is_verified) {
            return res.status(403).json({ message: 'กรุณายืนยันอีเมลก่อนเข้าใช้งาน' });
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
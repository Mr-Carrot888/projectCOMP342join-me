const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// อ้างอิง Path ถอย 1 ขั้นไปที่ models/User.js, config/db.js และ utils/mailer.js
const User = require('../models/User'); 
const db = require('../config/db');
const { sendVerificationEmail } = require('../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

// อายุการยืนยันตัวตนประจำปี (Annual Re-verification) = 365 วัน
const REVERIFICATION_DAYS = 365;

// เช็คว่าการยืนยันตัวตนหมดอายุประจำปีหรือยัง (last_verified_at เกิน 365 วัน)
const isAnnualVerificationExpired = (user) => {
    if (!user.last_verified_at) return false; // ไม่มีข้อมูล (ผู้ใช้เก่า) → ไม่บังคับยืนยันซ้ำ
    const elapsedMs = Date.now() - new Date(user.last_verified_at).getTime();
    return elapsedMs > REVERIFICATION_DAYS * 24 * 60 * 60 * 1000;
};

// เช็คว่า Token ยืนยันชุดปัจจุบันยังใช้ได้อยู่ (ยังไม่หมดอายุ)
const hasValidVerificationToken = (user) => {
    return !!(user.verification_token && user.token_expires_at && new Date(user.token_expires_at) > new Date());
};

// เช็คว่าเป็น "สมัครใหม่ที่ไม่เคยยืนยันตัวตนเลย" และ Token หมดอายุแล้ว
// (ลิงก์ยืนยันหมดอายุหรือไม่มีข้อมูล = ถือว่าหมดอายุ) → ลบทิ้งได้เพื่อเปิดทางสมัครใหม่
// หมายเหตุ: ใช้เฉพาะใน register — การลบบัญชีผู้ใช้เก่าที่ครบกำหนดประจำปีเกิดเฉพาะตอน
// กดลิงก์หมดอายุใน verifyEmail เท่านั้น (กันคนอื่นแอบอ้างอีเมลเพื่อลบบัญชีผู้ใช้จริงทาง register)
const isStaleUnverifiedSignup = (user) => {
    if (!user) return false;
    const tokenExpired = !user.token_expires_at || new Date(user.token_expires_at) <= new Date();
    return !user.is_verified && !user.last_verified_at && tokenExpired;
};

// สร้าง Token ใหม่ + ส่งอีเมลยืนยันซ้ำประจำปี แล้วตอบ 403 กลับไป
// (ใช้ทั้งกรณีครบกำหนด 1 ปีพอดี และกรณีผู้ใช้กดลิงก์เดิมไม่ทันจน Token หมดอายุ)
const resendAnnualVerification = async (res, user) => {
    const newToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ชั่วโมง

    await User.revokeForReverification(user.user_id, newToken, tokenExpiresAt);

    try {
        await sendVerificationEmail(user.email, user.name, newToken, true); // true = อีเมลยืนยันซ้ำประจำปี
    } catch (mailErr) {
        console.error('ส่งอีเมลยืนยันซ้ำประจำปีไม่สำเร็จ:', mailErr.message);
    }

    return res.status(403).json({
        message: 'การยืนยันตัวตนประจำปีหมดอายุ ระบบได้ส่งลิงก์ยืนยันไปที่อีเมลของคุณอีกครั้งแล้ว',
        reason: 'annual_reverification'
    });
};

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
        // - บัญชีที่ไม่เคยยืนยันตัวตนเลย (is_verified = 0, last_verified_at = NULL) และ Token หมดอายุแล้ว
        //   → ลบข้อมูลสมัครเก่าทิ้งอัตโนมัติ แล้วเปิดทางให้สมัครใหม่ต่อได้เลย
        // - บัญชีที่ยืนยันแล้ว (is_verified = 1) → แจ้งเตือนตามปกติ
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            if (isStaleUnverifiedSignup(existingUser)) {
                await User.deleteById(existingUser.user_id); // ลบสมัครเก่าที่ไม่เคยยืนยัน เพื่อให้สมัครใหม่ได้
            } else {
                return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานในระบบแล้ว' });
            }
        }

        // เข้ารหัสรหัสผ่าน
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // สร้าง Token ยืนยันอีเมล (สุ่ม 64 ตัวอักษร) หมดอายุใน 15 นาที
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 นาที

        // บันทึกลงฐานข้อมูล (is_verified = 0 รอยืนยันอีเมลก่อน)
        // กรณีรหัสนักศึกษา (user_id) ซ้ำ เช่น สมัครผิดอีเมลแล้วกลับมาสมัครใหม่ด้วยรหัสเดิม:
        // - ถ้าเป็นสมัครเก่าที่ไม่เคยยืนยันและ Token หมดอายุ → ลบทิ้งแล้วสร้างใหม่ให้เลย
        // - ถ้าเป็นบัญชีที่ยืนยันแล้วหรือ Token ยังใช้ได้ → แจ้งเตือนตามปกติ
        const newUserData = {
            user_id,
            email,
            password_hash,
            name,
            is_verified: 0,
            status: 'Active',
            verification_token: verificationToken,
            token_expires_at: tokenExpiresAt
        };

        try {
            await User.create(newUserData);
        } catch (createErr) {
            if (createErr && createErr.code === 'ER_DUP_ENTRY') {
                const dupById = await User.findById(user_id);
                if (isStaleUnverifiedSignup(dupById)) {
                    await User.deleteById(dupById.user_id);
                    await User.create(newUserData);
                } else {
                    return res.status(400).json({ message: 'รหัสนักศึกษานี้ถูกใช้งานในระบบแล้ว' });
                }
            } else {
                throw createErr;
            }
        }

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
            // ลบบัญชีทันที "ทุกกรณี" ที่กดลิงก์ช้า ทั้งผู้สมัครใหม่
            // และผู้ใช้เก่าที่ถึงรอบ Re-verification ประจำปี (มี last_verified_at แล้ว)
            // หมายเหตุ: โพสต์/คำขอ/แชทที่ผูกกับบัญชีนี้จะถูกลบตามไปด้วย (ON DELETE CASCADE)
            await User.deleteById(user.user_id);
            return res.status(400).json({
                message: 'ลิงก์ยืนยันตัวตนหมดอายุแล้ว ระบบได้ทำการยกเลิกและลบบัญชีของคุณเรียบร้อยแล้ว หากต้องการใช้งานกรุณาสมัครใหม่อีกครั้ง'
            });
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
            // กรณียืนยันประจำปีหมดอายุแล้วผู้ใช้กดลิงก์ไม่ทัน (Token หมดอายุหรือไม่มี)
            // → ส่งลิงก์ใหม่ให้อัตโนมัติทุกครั้งที่พยายามล็อกอิน เพื่อไม่ให้ผู้ใช้ติดอยู่ (บัญชีไม่ถูกลบ)
            if (isAnnualVerificationExpired(user)) {
                if (!hasValidVerificationToken(user)) {
                    return await resendAnnualVerification(res, user);
                }
                // Token ยังใช้ได้อยู่ → ไม่ส่งเมลซ้ำ (กันสแปม) แต่แจ้งสาเหตุประจำปีให้ผู้ใช้ทราบ
                return res.status(403).json({
                    message: 'การยืนยันตัวตนประจำปีหมดอายุ กรุณากดลิงก์ยืนยันในอีเมลที่ระบบส่งให้ก่อนหน้านี้',
                    reason: 'annual_reverification'
                });
            }
            return res.status(403).json({ message: 'กรุณายืนยันอีเมลก่อนเข้าใช้งาน' });
        }

        // เช็คการยืนยันตัวตนประจำปี (Annual Re-verification)
        // ถ้า last_verified_at เกิน 365 วัน → ปรับ is_verified = 0, ส่ง token/ลิงก์ใหม่ทางอีเมลอัตโนมัติ
        if (isAnnualVerificationExpired(user)) {
            return await resendAnnualVerification(res, user);
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
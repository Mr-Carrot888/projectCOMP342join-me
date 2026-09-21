const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // รูปแบบ "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'ไม่พบ Access Token กรุณาเข้าสู่ระบบ' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
        }
        req.user = user; // เก็บข้อมูล user (user_id, email, is_verified) ไว้ใน req.user
        next();
    });
};
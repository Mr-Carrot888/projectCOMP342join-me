require('dotenv').config();
const nodemailer = require('nodemailer');

// ตั้งค่า SMTP Transport (ใช้ Gmail เป็นค่าเริ่มต้น)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 465,
    secure: Number(process.env.EMAIL_PORT || 465) === 465, // 465 = secure (TLS ทันที), 587 = STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// ส่งอีเมลยืนยันตัวตน (มีลิงก์ที่มี Token แนบไปทางอีเมลผู้สมัคร)
exports.sendVerificationEmail = async (toEmail, name, token) => {
    const verifyLink = `${FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from: `"MakeFriend.PSRU" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'ยืนยันอีเมลของคุณ — MakeFriend.PSRU',
        html: `
            <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; background: #f4f8f1; border-radius: 16px;">
                <h2 style="color: #0a3010;">สวัสดีคุณ ${name}</h2>
                <p style="font-size: 15px; color: #0f2412;">
                    ขอบคุณที่สมัครสมาชิก <b>MakeFriend.PSRU</b><br>
                    กรุณากดลิงก์ด้านล่างเพื่อยืนยันอีเมลมหาวิทยาลัยของคุณ
                </p>
                <p style="text-align: center; margin: 28px 0;">
                    <a href="${verifyLink}"
                       style="background: #0a3010; color: #ffffff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold;">
                        ยืนยันอีเมล
                    </a>
                </p>
                <p style="font-size: 13px; color: #555;">
                    ลิงก์นี้จะหมดอายุใน <b>15 นาที</b><br>
                    หากปุ่มไม่ทำงาน คัดลอกลิงก์นี้ไปเปิดในเบราว์เซอร์:<br>
                    <a href="${verifyLink}">${verifyLink}</a>
                </p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="font-size: 12px; color: #999;">
                    หากคุณไม่ได้สมัครสมาชิก กรุณาเมินเฉยต่ออีเมลฉบับนี้
                </p>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
};

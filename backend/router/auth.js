const express = require('express');
const router = express.Router();

// ถอย 1 ขั้นไปดึง authController ในโฟลเดอร์ controllers
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);   // ลิงก์จากอีเมล: ?token=...
router.post('/verify-email', authController.verifyEmail);  // ยืนยันผ่าน JSON body
router.post('/login', authController.login);

module.exports = router;
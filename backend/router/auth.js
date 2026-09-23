const express = require('express');
const router = express.Router();

// ถอย 1 ขั้นไปดึง authController ในโฟลเดอร์ controllers
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/login', authController.login);

module.exports = router;
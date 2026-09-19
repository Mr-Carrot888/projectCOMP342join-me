const express = require('express'); 
const router = express.Router(); 

// นำเข้า Controller ที่เขียนเชื่อมต่อกับ Database เอาไว้
const userController = require('../controllers/userController');

// เมื่อทำงานร่วมกับ app.use('/users', ...) URL จะกลายเป็น http://localhost:3000/users
router.get('/', userController.getAllUsers);

router.post('/', userController.createUser);

module.exports = router;
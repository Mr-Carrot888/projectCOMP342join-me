const express = require('express');
const app = express();

// ดึงไฟล์แผนผังย่อย (Router) ที่เราเขียนไว้มาเก็บในตัวแปร userRoute
const userRoute = require('../backend/router/user');
// บอกให้ App ใช้แผนผังย่อยนั้น โดยกําหนด "ชื่อกลุ่ม" (Prefix) เป็น /users
app.use('/users', userRoute);

app.listen(3000, () => {
console.log('Server running on port 3000');
});
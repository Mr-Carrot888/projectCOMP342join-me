const express = require('express');
const app = express();

// 1. เพิ่มบรรทัดนี้เพื่อให้ API สามารถรับข้อมูลแบบ JSON จาก req.body ได้
app.use(express.json());

// ดึงไฟล์แผนผังย่อย (Router) ที่เราเขียนไว้มาเก็บในตัวแปร userRoute
const userRoute = require('../backend/router/user'); // แก้ path ให้ตรงกับโครงสร้างจริง เช่น './router/user'
const authRoute = require('../backend/router/auth');

// บอกให้ App ใช้แผนผังย่อยนั้น โดยกําหนด "ชื่อกลุ่ม" (Prefix) เป็น /users
app.use('/users', userRoute);
app.use('/api/auth', authRoute);

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
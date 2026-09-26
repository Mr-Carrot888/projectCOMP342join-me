# โปรเจควิชา COMP342 วิศวกรรมซอฟต์แวร์เบื้องต้น 1/2569<br>
## หัวข้อ แอปหาเพื่อนทำกิจกรรม<br>
## 🌟 ฟีเจอร์หลัก (Key Features)<br>
### 1. 🔒 ระบบยืนยันตัวตนนักศึกษา (Student Verification & Security)
- **University Email Domain Only:** สมัครสมาชิกได้เฉพาะอีเมลมหาวิทยาลัย (`@...ac.th`) เท่านั้น
- **Email Verification via Nodemailer:** ส่งลิงก์ยืนยันตัวตนไปยัง Gmail สถาบัน (ลิงก์มีอายุ 24 ชั่วโมง)
- **Annual Re-verification:** บังคับยืนยันตัวตนซ้ำทุกๆ 365 วันเมื่อขึ้นปีการศึกษาใหม่ เพื่อคัดกรองคนที่พ้นสภาพนักศึกษาแล้วออกอัตโนมัติ
- **Auto-Cleanup Account:** หากไม่กดลิงก์ยืนยันตัวตนภายในเวลาที่กำหนด ระบบจะลบบัญชีทิ้งอัตโนมัติเพื่อให้ใช้อีเมลเดิมสมัครใหม่ได้

### 2. 📝 ระบบสร้างและเข้าร่วมกิจกรรม (Activity Posting & Joining)
- **Create Post:** นักศึกษาสามารถสร้างโพสต์กิจกรรม กำหนดหัวข้อ รายละเอียด วันเวลา สถานที่ และจำนวนคนที่ต้องการได้
- **Join Activity:** ผู้ใช้อื่นสามารถกดขอเข้าร่วมกิจกรรมได้จนกว่าจะครบตามจำนวนที่กำหนด

### 3. 💬 ระบบห้องแชทกลุ่มชั่วคราว (Dynamic Chat Room)
- **Auto Unlock Chat:** เมื่อมีผู้เข้าร่วมกิจกรรมครบตามจำนวนที่หัวห้องตั้งไว้ ระบบจะเปิดห้องแชทกลุ่มให้อัตโนมัติทันที เพื่อให้สมาชิกพูดคุยและนัดหมายกัน
- **Chat Lifecycle & Auto-Delete:** 
  - เมื่อหัวห้องกด **"ยืนยันเสร็จสิ้นกิจกรรม"** หรือ **"ยกเลิกกิจกรรม"** ระบบจะทำการ **ลบห้องแชทและข้อความทั้งหมดทิ้งทันที** เพื่อความเป็นส่วนตัวและไม่ค้างข้อมูลในระบบ
## 🛠️ สแต็กเทคโนโลยี (Tech Stack)<br>
- **Frontend:** HTML5, JavaScript (ES6+ SPA), Port `8081`
- **Backend:** Node.js, Express.js, Port `3000`
- **Database:** MySQL
- **Authentication & Security:** JSON Web Token (JWT), bcryptjs, Nodemailer (Gmail App Passwords)
## 📁 โครงสร้างโปรเจกต์ (Project Structure)<br>
```text
.
├── README.md
├── backend
│   ├── app.js
│   ├── config
│   │   ├── database.sql
│   │   └── db.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── postController.js
│   │   ├── requestController.js
│   │   └── userController.js
│   ├── middleware
│   │   └── authMiddleware.js
│   ├── models
│   │   ├── ChatMessage.js
│   │   ├── Post.js
│   │   ├── Request.js
│   │   └── User.js
│   ├── package-lock.json
│   ├── package.json
│   ├── router
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── post.js
│   │   ├── request.js
│   │   └── user.js
│   └── utils
│       └── mailer.js
└── frontend
    ├── app.js
    ├── assets
    ├── package-lock.json
    ├── package.json
    └── src
        ├── components
        ├── context
        ├── index.html
        ├── navigation
        ├── pages
        ├── services
        │   └── api.js
        └── utils
```

## 🚀 วิธีการติดตั้งและเริ่มต้นใช้งาน (Getting Started)<br>
### 1. การเตรียมฐานข้อมูล (Database Setup)
1. เปิดโปรแกรมจัดการ MySQL<br>
2. สร้างฐานข้อมูลใหม่<br>
3. นำไฟล์ SQL จาก `backend/config/database.sql` ไป Execute เพื่อสร้างตาราง `users` และดักสร้างคอลัมน์ `verification_token`, `token_expires_at`, และ `last_verified_at`<br>
### 2. ตั้งค่า Backend
1. เข้าไปที่โฟลเดอร์ backend
   ```bash
   cd backend
   npm install
   ```
2. สร้างไฟล์ `.env` โดยคัดลอกจาก `.env.example` แล้วกำหนดค่า:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=your_password
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret_key
   EMAIL_USER=your_university_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=http://localhost:8081
   ```
3. เริ่มต้นทำงาน Backend Server
   ```bash
   node app.js
   ```

### 3. ตั้งค่า Frontend
1. เปิด Terminal ใหม่แล้วเข้าไปที่โฟลเดอร์ frontend
   ```bash
   cd frontend
   npm install
   ```
2. เริ่มต้นทำงาน Frontend Server (Port 8081)
   ```bash
   node app.js
   ```
3. เข้าใช้งานผ่านเบราว์เซอร์ที่ `http://localhost:8081`

สมาชิก<br>
1.นายปัญญา จันทฆาต 6712231018<br>
2.นายภูริ มาภู 6712231035<br>
3.นายอรรนพ เพริดพริ้ง 6712231029<br>
4.นายศุภกิจ ทองสัมฤทธิ์ 6712231027<br>
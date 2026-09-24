const express = require('express');
const path = require('path');
const app = express();
const PORT = 8080;

// ให้ Express ให้บริการไฟล์สถิตจากโฟลเดอร์ src และ assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'src')));

// ทุก Request ให้ส่งหน้า index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Frontend กำลังทำงานที่ http://localhost:${PORT}`);
});
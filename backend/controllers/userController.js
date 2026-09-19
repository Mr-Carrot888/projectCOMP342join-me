/*const db = require('../config/db');
// ดึงข้อมูล Sensor ทั้งหมด
exports.getAllNodes = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM user');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// เพิ่ม Sensor ใหม่
exports.createNode = async (req, res) => {
    const { Node_Name, Installation_Date, Location_ID } = req.body;
    try {
        const sql = `INSERT INTO user (Node_Name, Installation_Date, Location_ID)
            VALUES (?, ?, ?)`;
        const [result] = await db.execute(sql, [Node_Name, Installation_Date, Location_ID]);

        res.status(201).json({
            message: 'Node Created',
            id: result.insertId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
        };
*/

const db = require('../config/db');

// ดึงข้อมูลผู้ใช้ทั้งหมด
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT user_id, email, name, is_verified, status, created_at FROM user');
        res.status(200).json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// เพิ่มผู้ใช้ใหม่
exports.createUser = async (req, res) => {
    const { user_id, email, password_hash, name, is_verified, status } = req.body;
    try {
        const sql = `INSERT INTO user (user_id, email, password_hash, name, is_verified, status)
                     VALUES (?, ?, ?, ?, ?, ?)`;
        
        await db.execute(sql, [
            user_id, 
            email, 
            password_hash, 
            name, 
            is_verified ?? 0, 
            status ?? 'Active'
        ]);

        res.status(201).json({
            message: 'User Created Successfully',
            user_id: user_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const Post = require('../models/Post');

// 1. สร้างโพสต์กิจกรรมใหม่
exports.createPost = async (req, res) => {
    try {
        const { title, category, location, date_time, max_participants } = req.body;
        const host_id = req.user.user_id; // ดึงจาก JWT Token

        if (!title || !category || !location || !date_time || !max_participants) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลกิจกรรมให้ครบถ้วน' });
        }

        const post_id = 'POST_' + Date.now();

        await Post.create({
            post_id,
            host_id,
            title,
            category,
            location,
            date_time,
            max_participants
        });

        res.status(201).json({
            message: 'สร้างโพสต์กิจกรรมสำเร็จ',
            post_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ดึงรายการกิจกรรมทั้งหมดที่เปิดอยู่ / ค้นหาตาม Keyword หรือ Category
exports.getPosts = async (req, res) => {
    try {
        const { keyword, category } = req.query;
        let posts;

        if (keyword || category) {
            posts = await Post.search(keyword, category);
        } else {
            posts = await Post.findAllOpen();
        }

        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. ดึงรายละเอียดกิจกรรมตาม post_id
exports.getPostById = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: 'ไม่พบโพสต์กิจกรรมนี้' });
        }

        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const Request = require('../models/Request');
const Post = require('../models/Post');

// 1. ส่งคำขอเข้าร่วมกิจกรรม
exports.sendRequest = async (req, res) => {
    try {
        const { post_id } = req.body;
        const sender_id = req.user.user_id;

        if (!post_id) {
            return res.status(400).json({ message: 'กรุณาระบุ post_id' });
        }

        const post = await Post.findById(post_id);
        if (!post) {
            return res.status(404).json({ message: 'ไม่พบโพสต์กิจกรรมนี้' });
        }

        if (post.host_id === sender_id) {
            return res.status(400).json({ message: 'คุณไม่สามารถส่งคำขอเข้าร่วมกิจกรรมของตนเองได้' });
        }

        if (post.post_status !== 'Open') {
            return res.status(400).json({ message: 'กิจกรรมนี้ปิดรับสมัครแล้ว' });
        }

        // เช็กคำขอซ้ำ
        const existingRequest = await Request.findByPostAndSender(post_id, sender_id);
        if (existingRequest) {
            return res.status(400).json({ message: 'คุณได้ส่งคำขอเข้าร่วมกิจกรรมนี้ไปแล้ว' });
        }

        const request_id = 'REQ_' + Date.now();
        const receiver_id = post.host_id;

        await Request.create({
            request_id,
            post_id,
            sender_id,
            receiver_id
        });

        res.status(201).json({
            message: 'ส่งคำขอเข้าร่วมกิจกรรมสำเร็จ',
            request_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ตอบรับ/ปฏิเสธ คำขอเข้าร่วม (เฉพาะ Host ของกิจกรรม)
exports.respondRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // 'Accepted' หรือ 'Rejected'
        const current_user_id = req.user.user_id;

        if (!['Accepted', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'สถานะต้องเป็น Accepted หรือ Rejected เท่านั้น' });
        }

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบคำขอนี้' });
        }

        if (request.receiver_id !== current_user_id) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์จัดการคำขอนี้' });
        }

        await Request.updateStatus(requestId, status);

        res.status(200).json({
            message: `อัปเดตสถานะคำขอเป็น ${status} เรียบร้อยแล้ว`,
            request_id: requestId,
            status
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. ดูคำขอทั้งหมดของกิจกรรม (สำหรับ Host)
exports.getRequestsByPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const requests = await Request.findByPostId(postId);
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
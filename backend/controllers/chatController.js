const ChatMessage = require('../models/ChatMessage');
const Request = require('../models/Request');

// 1. ส่งข้อความแชต
exports.sendMessage = async (req, res) => {
    try {
        const { request_id, receiver_id, content, is_location_sharing } = req.body;
        const sender_id = req.user.user_id;

        if (!request_id || !receiver_id || !content) {
            return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const request = await Request.findById(request_id);
        if (!request) {
            return res.status(404).json({ message: 'ไม่พบห้องแชตชั่วคราวนี้' });
        }

        // ตรวจสอบว่าเป็นผู้เกี่ยวข้องกับคำขอนี้หรือไม่
        if (request.sender_id !== sender_id && request.receiver_id !== sender_id) {
            return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงห้องแชตนี้' });
        }

        const message_id = 'MSG_' + Date.now();

        await ChatMessage.create({
            message_id,
            request_id,
            sender_id,
            receiver_id,
            content,
            is_location_sharing: is_location_sharing ? 1 : 0
        });

        res.status(201).json({
            message: 'ส่งข้อความสำเร็จ',
            message_id
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. ดึงประวัติข้อความแชตตาม request_id
exports.getMessages = async (req, res) => {
    try {
        const { requestId } = req.params;
        const messages = await ChatMessage.findByRequestId(requestId);
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
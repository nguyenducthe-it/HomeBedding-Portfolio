const express = require('express');
const router = express.Router();
const StaffFeedback = require('../models/StaffFeedback');
const User = require('../models/User');

// 1. Nhân viên gửi phản hồi mới
router.post('/submit', async (req, res) => {
    try {
        const { staffId, feedbackType, description } = req.body;

        if (!staffId || !feedbackType || !description) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
        }

        const staff = await User.findById(staffId);
        if (!staff) return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên' });

        const feedback = new StaffFeedback({
            staffId,
            staffName: staff.fullName,
            feedbackType,
            messages: [{
                senderRole: 'staff',
                senderName: staff.fullName,
                text: description
            }],
            priority: 'medium'
        });

        await feedback.save();
        res.status(201).json({ message: 'Đã gửi phản hồi thành công!', feedback });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi gửi phản hồi' });
    }
});

// 2. Phản hồi tiếp trong hội thoại
router.post('/reply/:id', async (req, res) => {
    try {
        const { senderId, senderRole, text, status } = req.body;
        const feedback = await StaffFeedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Không tìm thấy phản hồi' });

        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ message: 'Người gửi không hợp lệ' });

        // Thêm tin nhắn mới
        feedback.messages.push({
            senderRole,
            senderName: sender.fullName,
            text
        });

        // Cập nhật trạng thái nếu có gửi kèm (Thường do Admin cập nhật)
        if (status) feedback.status = status;
        
        // Nếu staff trả lời lại, chuyển trạng thái về processing nếu đã resolved hoặc pending
        if (senderRole === 'staff' && feedback.status === 'resolved') {
            feedback.status = 'processing';
        }

        await feedback.save();
        res.json({ message: 'Gửi tin nhắn thành công!', feedback });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Lấy danh sách phản hồi (Admin)
router.get('/all', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const feedbacks = await StaffFeedback.find(query).sort({ updatedAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Lấy chi tiết 1 phản hồi
router.get('/detail/:id', async (req, res) => {
    try {
        const feedback = await StaffFeedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(feedback);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

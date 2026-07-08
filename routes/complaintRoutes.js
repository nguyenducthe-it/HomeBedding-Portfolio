const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');

// 1. Khách hàng gửi khiếu nại mới (Khởi tạo hội thoại)
router.post('/submit', async (req, res) => {
    try {
        const { customerId, complaintType, description } = req.body;

        if (!customerId || !complaintType || !description) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
        }

        const customer = await User.findById(customerId);
        if (!customer) return res.status(404).json({ message: 'Không tìm thấy thông tin khách hàng' });

        const complaint = new Complaint({
            customerId,
            customerName: customer.fullName,
            customerPhone: customer.phone,
            complaintType,
            messages: [{
                senderRole: 'customer',
                senderName: customer.fullName,
                text: description
            }],
            priority: 'medium'
        });

        await complaint.save();
        res.status(201).json({ message: 'Cảm ơn bạn đã phản hồi! Chúng tôi sẽ xử lý sớm nhất.', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi gửi phản hồi' });
    }
});

// 2. Phản hồi tiếp trong hội thoại (Dùng cho cả Admin và Customer)
router.post('/reply/:id', async (req, res) => {
    try {
        const { senderId, senderRole, text, status } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ message: 'Người gửi không hợp lệ' });

        // Thêm tin nhắn mới
        complaint.messages.push({
            senderRole,
            senderName: sender.fullName,
            text
        });

        // Cập nhật trạng thái nếu có gửi kèm (Thường do Admin cập nhật)
        if (status) complaint.status = status;
        
        // Nếu customer trả lời lại, chuyển trạng thái về processing nếu đã resolved hoặc pending
        if (senderRole === 'customer' && complaint.status === 'resolved') {
            complaint.status = 'processing';
        }

        await complaint.save();
        res.json({ message: 'Gửi tin nhắn thành công!', complaint });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Lấy danh sách khiếu nại (Admin)
router.get('/all', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const complaints = await Complaint.find(query).sort({ updatedAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Lấy danh sách khiếu nại của 1 khách hàng
router.get('/my-history/:customerId', async (req, res) => {
    try {
        const history = await Complaint.find({ customerId: req.params.customerId }).sort({ updatedAt: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Lấy chi tiết 1 cuộc hội thoại
router.get('/detail/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) return res.status(404).json({ message: 'Không tìm thấy' });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6. Lấy các phản hồi/khiếu nại mới nhất (Dùng cho Dashboard Staff)
router.get('/latest', async (req, res) => {
    try {
        const latest = await Complaint.find().sort({ updatedAt: -1 }).limit(5);
        res.json(latest);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy phản hồi mới nhất' });
    }
});

// 7. Lấy số lượng khiếu nại khách hàng chưa xử lý
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Complaint.countDocuments({ status: 'pending' });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

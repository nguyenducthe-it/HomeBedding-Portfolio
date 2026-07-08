const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const Notification = require('../models/Notification');

// POST /api/support-requests - Create a support request
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        if (!name || !email || !phone || !message) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
        }

        // Validate email format (strict domains like .com, .vn, etc.)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Địa chỉ email không đúng định dạng hoặc tên miền không hỗ trợ (ví dụ: gmail.co là không hợp lệ).' });
        }

        // Validate phone format (Vietnamese mobile format: 10 digits starting with 03, 05, 07, 08, 09, or 84)
        const phoneRegex = /^(84|0[35789])\d{8}$/;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 hoặc 84 và có đúng 10 chữ số).' });
        }

        const supportRequest = new SupportRequest({
            name,
            email,
            phone,
            message
        });

        await supportRequest.save();

        // Tạo thông báo cho Admin
        try {
            const newNotification = new Notification({
                title: 'Yêu cầu hỗ trợ mới',
                content: `Khách vãng lai ${name} đã gửi một yêu cầu hỗ trợ.`,
                type: 'support_request',
                relatedId: supportRequest._id,
                isRead: false,
                metadata: {
                    requestId: supportRequest._id,
                    name,
                    email,
                    phone,
                    message
                }
            });
            await newNotification.save();
        } catch (notifErr) {
            console.error('Lỗi khi tạo thông báo yêu cầu hỗ trợ:', notifErr);
        }

        res.status(201).json({ message: 'Gửi yêu cầu thành công! Admin sẽ liên hệ lại với bạn sớm nhất.' });
    } catch (err) {
        console.error('Error creating support request:', err);
        res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.' });
    }
});

// GET /api/support-requests/all - Lấy danh sách tất cả yêu cầu hỗ trợ (Dành cho Admin)
router.get('/all', async (req, res) => {
    try {
        const requests = await SupportRequest.find().sort({ createdAt: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách yêu cầu hỗ trợ' });
    }
});

// GET /api/support-requests/detail/:id - Lấy chi tiết yêu cầu hỗ trợ
router.get('/detail/:id', async (req, res) => {
    try {
        const request = await SupportRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Không tìm thấy yêu cầu hỗ trợ' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

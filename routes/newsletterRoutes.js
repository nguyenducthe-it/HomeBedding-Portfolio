const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');
const Notification = require('../models/Notification');

// POST /api/newsletter/subscribe - Đăng ký nhận tin & ưu đãi
router.post('/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Vui lòng cung cấp địa chỉ email.' });
        }

        // Kiểm tra định dạng email hợp lệ
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Địa chỉ email không hợp lệ hoặc tên miền không hỗ trợ.' });
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existing = await Newsletter.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(200).json({ 
                message: 'Email này đã đăng ký nhận tin từ trước! Cảm ơn bạn.',
                alreadyRegistered: true 
            });
        }

        // Lưu email mới vào DB
        const subscription = new Newsletter({
            email: email.toLowerCase()
        });
        await subscription.save();

        // Tạo thông báo mới cho Admin
        try {
            const newNotification = new Notification({
                title: 'Đăng ký nhận tin mới',
                content: `Email ${email} đã đăng ký nhận tin & ưu đãi từ Home Bedding.`,
                type: 'newsletter_subscribe',
                relatedId: subscription._id,
                isRead: false,
                metadata: {
                    subscriptionId: subscription._id,
                    email: email.toLowerCase()
                }
            });
            await newNotification.save();
        } catch (notifErr) {
            console.error('Lỗi khi tạo thông báo nhận tin:', notifErr);
        }

        res.status(201).json({ message: 'Đăng ký nhận tin thành công! Cảm ơn bạn.' });
    } catch (err) {
        console.error('Lỗi khi đăng ký nhận tin:', err);
        res.status(500).json({ message: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.' });
    }
});

// GET /api/newsletter/all - Lấy danh sách email nhận tin (Dành cho Admin)
router.get('/all', async (req, res) => {
    try {
        const list = await Newsletter.find().sort({ createdAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách email nhận tin' });
    }
});

module.exports = router;

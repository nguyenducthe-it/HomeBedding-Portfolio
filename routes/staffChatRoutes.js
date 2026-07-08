const express = require('express');
const router = express.Router();
const StaffChat = require('../models/StaffChat');
const User = require('../models/User');
const { uploadChat } = require('../utils/cloudinaryUpload');
const upload = uploadChat;

// API Upload file đính kèm
router.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ fileUrl: req.file.path }); // Cloudinary URL
});

// 1. Lấy danh sách tất cả các đoạn chat của nhân viên (Cho Admin)
router.get('/admin/all-staffs', async (req, res) => {
    try {
        const chats = await StaffChat.find().sort({ lastMessageAt: -1 });
        res.json(chats);
    } catch (err) {
        console.error('Lỗi lấy danh sách chat:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Lấy chi tiết đoạn chat của 1 nhân viên (Cho Admin & Staff)
router.get('/thread/:staffId', async (req, res) => {
    try {
        let chat = await StaffChat.findOne({ staffId: req.params.staffId });
        
        // Nếu chưa có đoạn chat nào, tạo mới
        if (!chat) {
            const staff = await User.findById(req.params.staffId);
            if (!staff) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
            
            chat = new StaffChat({
                staffId: staff._id,
                staffName: staff.fullName,
                messages: []
            });
            await chat.save();
        }

        res.json(chat);
    } catch (err) {
        console.error('Lỗi lấy chi tiết chat:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Reset unread count khi người dùng đọc tin nhắn
router.post('/read/:staffId', async (req, res) => {
    try {
        const { role } = req.body; // 'admin' hoặc 'staff'
        const chat = await StaffChat.findOne({ staffId: req.params.staffId });
        if (!chat) return res.status(404).json({ message: 'Không tìm thấy đoạn chat' });

        if (role === 'admin') {
            chat.unreadCountAdmin = 0;
        } else if (role === 'staff') {
            chat.unreadCountStaff = 0;
        }

        await chat.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Gửi tin nhắn mới
router.post('/send', async (req, res) => {
    try {
        const { staffId, senderId, senderRole, text, attachmentUrl, attachedOrderId, attachedOrderCode } = req.body;

        if (!staffId || !senderId || !senderRole) {
            return res.status(400).json({ message: 'Vui lòng điền đủ thông tin' });
        }
        
        if (!text && !attachmentUrl && !attachedOrderId) {
             return res.status(400).json({ message: 'Tin nhắn không thể trống' });
        }

        let chat = await StaffChat.findOne({ staffId });
        if (!chat) {
            const staff = await User.findById(staffId);
            if (!staff) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
            chat = new StaffChat({
                staffId: staff._id,
                staffName: staff.fullName,
                messages: []
            });
        }

        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ message: 'Người gửi không hợp lệ' });

        const newMessage = {
            senderRole,
            senderName: sender.fullName,
            text: text || '',
            attachmentUrl: attachmentUrl || '',
            attachedOrderId: attachedOrderId || null,
            attachedOrderCode: attachedOrderCode || '',
            createdAt: new Date()
        };

        chat.messages.push(newMessage);
        chat.lastMessageAt = new Date();

        // Tăng unread count cho bên nhận
        if (senderRole === 'admin') {
            chat.unreadCountStaff += 1;
        } else {
            chat.unreadCountAdmin += 1;
        }

        await chat.save();
        res.json({ message: 'Đã gửi tin nhắn', chat });
    } catch (err) {
        console.error('Lỗi gửi tin nhắn:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Lấy tổng số tin nhắn chưa đọc của admin (từ tất cả nhân viên)
router.get('/admin/unread-count', async (req, res) => {
    try {
        const chats = await StaffChat.find();
        const count = chats.reduce((sum, chat) => sum + (chat.unreadCountAdmin || 0), 0);
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6. Lấy số tin nhắn chưa đọc của 1 nhân viên
router.get('/staff/unread-count/:staffId', async (req, res) => {
    try {
        const chat = await StaffChat.findOne({ staffId: req.params.staffId });
        res.json({ count: chat ? (chat.unreadCountStaff || 0) : 0 });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

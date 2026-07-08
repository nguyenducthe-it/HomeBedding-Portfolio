const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const { uploadConsult } = require('../utils/cloudinaryUpload');
const upload = uploadConsult;

// API Upload file đính kèm
router.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    res.json({ fileUrl: req.file.path }); // Cloudinary URL
});

// 1. Khách hàng bắt đầu tư vấn
router.post('/start', async (req, res) => {
    try {
        const { customerId, customerName, text, attachmentUrl, attachedOrderId, attachedOrderCode } = req.body;
        const consultation = new Consultation({
            customerId,
            customerName,
            messages: [{
                senderRole: 'customer',
                senderName: customerName,
                text,
                attachmentUrl,
                attachedOrderId,
                attachedOrderCode
            }]
        });
        await consultation.save();
        res.status(201).json(consultation);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Phản hồi trong chat (Customer/Staff)
router.post('/reply/:id', async (req, res) => {
    try {
        const { senderId, senderRole, text, attachmentUrl, attachedOrderId, attachedOrderCode } = req.body;
        const cons = await Consultation.findById(req.params.id);
        if (!cons) return res.status(404).json({ message: 'Không tìm thấy hội thoại' });

        const sender = await User.findById(senderId);
        if (!sender) return res.status(404).json({ message: 'Người gửi không hợp lệ' });

        cons.messages.push({
            senderRole,
            senderName: sender.fullName,
            text,
            attachmentUrl,
            attachedOrderId,
            attachedOrderCode
        });
        await cons.save();
        res.json(cons);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Lấy tất cả hội thoại (Staff)
router.get('/all', async (req, res) => {
    try {
        const list = await Consultation.find().sort({ updatedAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy số lượng hội thoại chưa phản hồi (tin cuối từ customer)
router.get('/unread-count', async (req, res) => {
    try {
        const list = await Consultation.find({});
        let unreadCount = 0;
        list.forEach(cons => {
            if (cons.messages && cons.messages.length > 0) {
                const lastMsg = cons.messages[cons.messages.length - 1];
                if (lastMsg.senderRole === 'customer') {
                    unreadCount++;
                }
            }
        });
        res.json({ count: unreadCount });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Lấy hội thoại của 1 khách hàng
router.get('/my/:customerId', async (req, res) => {
    try {
        const list = await Consultation.find({ customerId: req.params.customerId }).sort({ updatedAt: -1 });
        res.json(list);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Xóa hội thoại
router.delete('/:id', async (req, res) => {
    try {
        await Consultation.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

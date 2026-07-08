const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// POST /api/payment/confirm-transfer
router.post('/confirm-transfer', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ message: 'Thiếu thông tin mã đơn hàng' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        // Tạo thông báo cho Admin/Staff
        const shortCode = order._id.toString().slice(-6).toUpperCase();
        const notification = new Notification({
            title: 'Khách xác nhận thanh toán',
            content: `Khách hàng ${order.customerName} báo đã chuyển khoản online cho đơn hàng #${shortCode}.`,
            type: 'new_order', // Sử dụng type new_order để kích hoạt chuông đơn hàng
            relatedId: order._id,
            isRead: false,
            metadata: {
                orderId: order._id,
                shortCode: shortCode,
                action: 'payment_confirmed',
                customerName: order.customerName,
                finalAmount: order.finalAmount
            }
        });

        await notification.save();

        res.status(200).json({ message: 'Xác nhận đã chuyển khoản thành công! Hệ thống đang chờ nhân viên kiểm tra số dư và duyệt đơn.' });
    } catch (err) {
        console.error('Lỗi khi khách xác nhận chuyển khoản:', err);
        res.status(500).json({ message: 'Lỗi server khi gửi yêu cầu xác nhận chuyển khoản' });
    }
});

module.exports = router;

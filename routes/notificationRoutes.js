const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Hàm tự động quét chấm công trễ / không điểm danh
async function scanMissedCheckins() {
    try {
        const offset = new Date().getTimezoneOffset() * 60000;
        const nowLocal = new Date(Date.now() - offset);
        const todayStr = nowLocal.toISOString().split('T')[0];
        
        const yesterdayDate = new Date(Date.now() - offset - 24 * 60 * 60 * 1000);
        const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

        const currentLocalHour = new Date().getHours();

        // Lấy tất cả lịch làm việc hôm nay và hôm qua
        const attendances = await Attendance.find({ 
            date: { $in: [todayStr, yesterdayStr] } 
        }).populate('userId', 'fullName');

        for (const att of attendances) {
            if (!att.userId) continue; // Bỏ qua nếu user bị xóa
            
            for (const shift of att.shifts) {
                const status = att.status ? att.status[shift] : 'none';
                if (status === 'none') {
                    let isMissed = false;
                    
                    if (att.date === yesterdayStr) {
                        isMissed = true; // Ngày hôm qua chưa điểm danh chắc chắn là bỏ lỡ
                    } else if (att.date === todayStr) {
                        // So sánh giờ hiện tại để xác định xem đã trễ giờ điểm danh chưa
                        // Ca sáng bắt đầu từ 08:00 -> quá 09:00 được coi là không điểm danh
                        // Ca chiều từ 13:00 -> quá 14:00
                        // Ca tối từ 18:00 -> quá 19:00
                        if (shift === 'morning' && currentLocalHour >= 9) {
                            isMissed = true;
                        } else if (shift === 'afternoon' && currentLocalHour >= 14) {
                            isMissed = true;
                        } else if (shift === 'evening' && currentLocalHour >= 19) {
                            isMissed = true;
                        }
                    }

                    if (isMissed) {
                        // Kiểm tra xem đã tạo thông báo chưa
                        const exists = await Notification.findOne({
                            type: 'attendance',
                            relatedId: att._id,
                            'metadata.shift': shift,
                            'metadata.isMissed': true
                        });

                        if (!exists) {
                            const shiftName = shift === 'morning' ? 'Sáng' : shift === 'afternoon' ? 'Chiều' : 'Tối';
                            const timeStr = shift === 'morning' ? '09:00:00' : shift === 'afternoon' ? '14:00:00' : '19:00:00';
                            const logicalCreatedAt = new Date(`${att.date}T${timeStr}`);
                            const notification = new Notification({
                                title: 'Nhân viên không điểm danh',
                                content: `Nhân viên ${att.userId.fullName} chưa điểm danh ca ${shiftName} ngày ${att.date}.`,
                                type: 'attendance',
                                relatedId: att._id,
                                isRead: false,
                                metadata: {
                                    userId: att.userId._id,
                                    date: att.date,
                                    shift: shift,
                                    isMissed: true
                                },
                                createdAt: logicalCreatedAt
                            });
                            await notification.save();
                        }
                    }
                }
            }
        }
    } catch (err) {
        console.error('Lỗi khi quét điểm danh trễ:', err);
    }
}

let lastMissedCheckinScan = 0;
const SCAN_INTERVAL = 60 * 1000; // 1 phút

// 1. Lấy danh sách thông báo
router.get('/', async (req, res) => {
    try {
        // Tự động quét điểm danh trễ tối đa 1 lần mỗi phút để tránh làm quá tải Database khi poll nhanh
        if (Date.now() - lastMissedCheckinScan > SCAN_INTERVAL) {
            lastMissedCheckinScan = Date.now();
            await scanMissedCheckins();
        }

        // Lấy thông báo mới nhất
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(50);
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy thông báo' });
    }
});

// 2. Lấy số lượng thông báo chưa đọc
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Notification.countDocuments({ isRead: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Đánh dấu đã đọc một thông báo
router.put('/mark-read/:id', async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.json({ message: 'Đã đánh dấu đã đọc', notification });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Đánh dấu đã đọc tất cả thông báo
router.put('/mark-all-read', async (req, res) => {
    try {
        await Notification.updateMany({ isRead: false }, { isRead: true });
        res.json({ message: 'Đã đánh dấu đã đọc tất cả thông báo' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Xóa một thông báo
router.delete('/:id', async (req, res) => {
    try {
        const result = await Notification.findByIdAndDelete(req.params.id);
        if (!result) return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        res.json({ message: 'Đã xóa thông báo' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

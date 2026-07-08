const express = require('express');
const router = express.Router();
const ShiftRequest = require('../models/ShiftRequest');
const Attendance = require('../models/Attendance');
const jwt = require('jsonwebtoken');

// Middleware xác thực
const auth = (req, res, next) => {
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Không có token, quyền truy cập bị từ chối' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

// 1. Nhân viên đăng ký ca làm cho tuần tới
router.post('/register', auth, async (req, res) => {
    try {
        const { weekStartDate, requestedShifts } = req.body;
        const userId = req.user.id;

        if (!weekStartDate || !requestedShifts) {
            return res.status(400).json({ message: 'Thiếu thông tin đăng ký' });
        }

        // Xóa đăng ký cũ của tuần đó (nếu có) để cập nhật mới
        await ShiftRequest.findOneAndDelete({ userId, weekStartDate });

        const newRequest = new ShiftRequest({
            userId,
            weekStartDate,
            requestedShifts,
            status: 'pending'
        });

        await newRequest.save();
        res.json({ message: 'Đăng ký lịch làm thành công! Vui lòng chờ Admin duyệt.', request: newRequest });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi đăng ký ca làm' });
    }
});

// 2. Lấy danh sách ca đã có người đăng ký (để hiển thị mờ/khóa)
router.get('/week-availability', async (req, res) => {
    try {
        const { weekStartDate } = req.query;
        if (!weekStartDate) return res.status(400).json({ message: 'Thiếu ngày bắt đầu tuần' });

        // Lấy tất cả các đăng ký của tuần này mà không bị từ chối
        const requests = await ShiftRequest.find({ weekStartDate, status: { $ne: 'rejected' } });
        
        // Chuyển đổi sang định dạng dễ dùng ở frontend: { "YYYY-MM-DD": ["morning", "afternoon"] }
        const availabilityMap = {};
        requests.forEach(r => {
            r.requestedShifts.forEach(s => {
                if (!availabilityMap[s.date]) availabilityMap[s.date] = [];
                availabilityMap[s.date].push(s.shiftType);
            });
        });

        res.json(availabilityMap);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy tình trạng ca làm' });
    }
});

// 3. Lấy lịch làm việc đã duyệt của cá nhân (Tuần này)
router.get('/my-schedule', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query; // YYYY-MM-DD
        const userId = req.user.id;

        if (!startDate || !endDate) return res.status(400).json({ message: 'Thiếu ngày bắt đầu/kết thúc' });

        const schedule = await Attendance.find({
            userId,
            date: { $gte: startDate, $lte: endDate }
        });

        res.json(schedule);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch cá nhân' });
    }
});

module.exports = router;

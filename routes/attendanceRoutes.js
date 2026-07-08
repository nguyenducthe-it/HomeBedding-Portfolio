const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WeekConfig = require('../models/WeekConfig');
const ShiftRequest = require('../models/ShiftRequest');
const Notification = require('../models/Notification');
const { autoAssignAndLock } = require('../utils/scheduleHelper');

// 1. Lấy lịch làm việc của tất cả nhân viên trong 1 tuần (từ startDate đến endDate)
router.get('/week', async (req, res) => {
    try {
        const startDate = req.query.startDate ? req.query.startDate.trim() : null;
        const endDate = req.query.endDate ? req.query.endDate.trim() : null;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Thiếu ngày bắt đầu hoặc kết thúc tuần' });
        }

        const staffs = await User.find({ role: 'staff' }).select('fullName email phone staffId baseSalary');
        
        // Lấy lịch của tuần (Đã duyệt)
        const attendances = await Attendance.find({ 
            date: { $gte: startDate, $lte: endDate } 
        });

        // Lấy các yêu cầu đăng ký (Pending)
        console.log(`Searching ShiftRequest for weekStartDate: "${startDate}"`);
        const shiftRequests = await ShiftRequest.find({
            weekStartDate: startDate,
            status: 'pending'
        });

        // Group dữ liệu Attendance
        const scheduleMap = {};
        attendances.forEach(att => {
            if (!scheduleMap[att.userId.toString()]) {
                scheduleMap[att.userId.toString()] = {};
            }
            scheduleMap[att.userId.toString()][att.date] = {
                shifts: att.shifts,
                status: att.status
            };
        });

        // Group dữ liệu ShiftRequest
        const pendingMap = {};
        console.log(`Found ${shiftRequests.length} pending requests for ${startDate}`);
        shiftRequests.forEach(req => {
            const uId = req.userId.toString();
            console.log(`Mapping request for user ${uId}:`, req.requestedShifts);
            if (!pendingMap[uId]) pendingMap[uId] = {};
            req.requestedShifts.forEach(s => {
                if (!pendingMap[uId][s.date]) pendingMap[uId][s.date] = [];
                pendingMap[uId][s.date].push(s.shiftType);
            });
        });

        const result = staffs.map(staff => {
            return {
                _id: staff._id,
                fullName: staff.fullName,
                staffId: staff.staffId,
                baseSalary: staff.baseSalary,
                schedule: scheduleMap[staff._id.toString()] || {},
                pendingShifts: pendingMap[staff._id.toString()] || {}
            };
        });

        const weekConfig = await WeekConfig.findOne({ weekStartDate: startDate });
        const isLocked = weekConfig ? weekConfig.isLocked : false;

        res.json({ staffs: result, isLocked });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy lịch làm việc' });
    }
});

// 1.5. Staff đăng ký ca làm (Chờ duyệt)
router.post('/request-schedule', async (req, res) => {
    try {
        const { userId, date, shifts, weekStartDate } = req.body;
        
        if (!userId || !date || !weekStartDate) {
            return res.status(400).json({ message: 'Thiếu thông tin người dùng, ngày hoặc tuần' });
        }

        if (shifts && shifts.length > 2) {
            return res.status(400).json({ message: 'Một nhân viên chỉ được đăng ký tối đa 2 ca/ngày' });
        }

        // Kiểm tra ca này đã có người trực hoặc đang chờ duyệt chưa
        const otherAttendances = await Attendance.find({ date, userId: { $ne: userId } });
        let assignedToOthers = [];
        otherAttendances.forEach(att => assignedToOthers.push(...att.shifts));
        
        const otherRequests = await ShiftRequest.find({ weekStartDate, userId: { $ne: userId }, status: 'pending' });
        otherRequests.forEach(req => {
            req.requestedShifts.forEach(s => {
                if (s.date === date) {
                    assignedToOthers.push(s.shiftType);
                }
            });
        });

        const conflict = shifts.find(shift => assignedToOthers.includes(shift));
        if (conflict) {
            return res.status(400).json({ message: `Ca này đã có nhân viên khác đăng ký hoặc đang trực!` });
        }

        let shiftReq = await ShiftRequest.findOne({ userId, weekStartDate });
        if (!shiftReq) {
            shiftReq = new ShiftRequest({
                userId,
                weekStartDate,
                requestedShifts: [],
                status: 'pending'
            });
        }

        // Xóa các ca cũ của ngày này trong pending list (để cập nhật lại)
        shiftReq.requestedShifts = shiftReq.requestedShifts.filter(s => s.date !== date);
        
        // Thêm các ca mới
        shifts.forEach(shiftType => {
            shiftReq.requestedShifts.push({ date, shiftType });
        });

        // Đảm bảo status là pending để admin có thể duyệt
        shiftReq.status = 'pending';
        
        await shiftReq.save();
        
        res.json({ message: 'Đã lưu yêu cầu đăng ký ca' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi đăng ký ca' });
    }
});

// 2. Phân ca cho nhân viên (Admin dùng)
router.post('/schedule', async (req, res) => {
    try {
        const { userId, date, shifts } = req.body; // shifts là mảng: ['morning', 'afternoon']
        
        if (!userId || !date) {
            return res.status(400).json({ message: 'Thiếu thông tin người dùng hoặc ngày' });
        }

        if (shifts && shifts.length > 2) {
            return res.status(400).json({ message: 'Một nhân viên chỉ được làm tối đa 2 ca/ngày' });
        }

        // Kiểm tra xem ca đã có người trực chưa (Mỗi ca chỉ 1 người)
        const otherAttendances = await Attendance.find({ date, userId: { $ne: userId } });
        let assignedToOthers = [];
        otherAttendances.forEach(att => {
            assignedToOthers = assignedToOthers.concat(att.shifts);
        });

        // Kiểm tra xem có ca nào trong `shifts` mà đã được gán cho người khác không
        const conflict = shifts.find(shift => assignedToOthers.includes(shift));
        if (conflict) {
            const shiftNameMap = { 'morning': 'Ca sáng', 'afternoon': 'Ca chiều', 'evening': 'Ca tối' };
            return res.status(400).json({ message: `${shiftNameMap[conflict]} đã có người khác trực!` });
        }

        let attendance = await Attendance.findOne({ userId, date });
        if (attendance) {
            attendance.shifts = shifts;
            await attendance.save();
        } else {
            attendance = new Attendance({ userId, date, shifts });
            await attendance.save();
        }

        res.json({ message: 'Phân ca thành công', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi phân ca' });
    }
});

// 3. Chấm công cho 1 ca cụ thể
router.post('/check-in', async (req, res) => {
    try {
        const { userId, date, shift, statusValue, byAdmin } = req.body;
        if (!userId || !date || !shift || !statusValue) {
            return res.status(400).json({ message: 'Thiếu thông tin chấm công' });
        }

        let attendance = await Attendance.findOne({ userId, date });
        if (!attendance) {
            return res.status(404).json({ message: 'Không tìm thấy lịch làm việc ngày này để chấm công' });
        }

        if (!attendance.shifts.includes(shift)) {
            return res.status(400).json({ message: 'Nhân viên không có ca làm việc này trong lịch' });
        }

        let finalStatusValue = statusValue;

        // Tự động xác định đi muộn > 30 phút đối với nhân viên tự điểm danh
        if (!byAdmin && statusValue === 'present') {
            const offset = new Date().getTimezoneOffset() * 60000;
            const todayStr = new Date(Date.now() - offset).toISOString().split('T')[0];
            
            if (date === todayStr) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                const currentTotalMins = currentHour * 60 + currentMin;

                let shiftStartMins = 0;
                if (shift === 'morning') shiftStartMins = 8 * 60; // 08:00
                else if (shift === 'afternoon') shiftStartMins = 13 * 60; // 13:00
                else if (shift === 'evening') shiftStartMins = 18 * 60; // 18:00

                // Muộn quá 30 phút thì chuyển thành trạng thái 'late'
                if (currentTotalMins > shiftStartMins + 30) {
                    finalStatusValue = 'late';
                }
            }
        }

        // Cố gắng cập nhật từng field của object status
        try {
            await Attendance.updateOne(
                { _id: attendance._id },
                { $set: { [`status.${shift}`]: finalStatusValue } }
            );
        } catch (err) {
            // Rơi vào đây tức là bản ghi bị lỗi cấu trúc dữ liệu cũ (VD: status đang là string)
            // Ta xoá trắng và khởi tạo lại đúng cấu trúc Object
            const defaultStatus = { morning: 'none', afternoon: 'none', evening: 'none' };
            defaultStatus[shift] = finalStatusValue;
            await Attendance.updateOne(
                { _id: attendance._id },
                { $set: { status: defaultStatus } }
            );
        }

        // Lấy lại dữ liệu mới nhất để trả về
        attendance = await Attendance.findById(attendance._id);

        // Tạo thông báo cho Admin
        try {
            const user = await User.findById(userId);
            const userName = user ? user.fullName : 'Nhân viên';
            const shiftName = shift === 'morning' ? 'Sáng' : shift === 'afternoon' ? 'Chiều' : 'Tối';
            let statusLabel = 'điểm danh';
            let title = 'Nhân viên điểm danh';
            if (finalStatusValue === 'present') {
                statusLabel = 'điểm danh';
                title = 'Nhân viên điểm danh';
            } else if (finalStatusValue === 'late') {
                statusLabel = 'đi muộn';
                title = 'Nhân viên đi muộn';
            } else if (finalStatusValue === 'absent') {
                statusLabel = 'báo vắng mặt';
                title = 'Nhân viên vắng mặt';
            }

            const newNotification = new Notification({
                title: title,
                content: `Nhân viên ${userName} đã ${statusLabel} ca ${shiftName} ngày ${date}.`,
                type: 'attendance',
                relatedId: attendance._id,
                isRead: false,
                metadata: {
                    userId,
                    date,
                    shift,
                    statusValue: finalStatusValue,
                    userName
                }
            });
            await newNotification.save();
        } catch (notifErr) {
            console.error('Lỗi khi tạo thông báo điểm danh:', notifErr);
        }

        res.json({ message: 'Chấm công thành công', attendance });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi chấm công' });
    }
});

// 4. Cập nhật lương cơ bản cho nhân viên
router.put('/salary/:id', async (req, res) => {
    try {
        const { baseSalary } = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user || user.role !== 'staff') {
            return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
        }

        user.baseSalary = baseSalary;
        await user.save();

        res.json({ message: 'Cập nhật lương thành công', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật lương' });
    }
});

// 5. Chốt lịch thủ công (Dành cho Admin)
router.post('/auto-fill-and-lock', async (req, res) => {
    try {
        const { weekStartDate } = req.body;
        if (!weekStartDate) return res.status(400).json({ message: 'Thiếu ngày bắt đầu tuần' });
        
        const result = await autoAssignAndLock(weekStartDate);
        if (result.success) res.json(result);
        else res.status(500).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi chốt lịch' });
    }
});

// 6. Mở chốt lịch (Dành cho Admin)
router.post('/unlock', async (req, res) => {
    try {
        const { weekStartDate } = req.body;
        if (!weekStartDate) return res.status(400).json({ message: 'Thiếu ngày bắt đầu tuần' });
        
        await WeekConfig.findOneAndUpdate(
            { weekStartDate },
            { isLocked: false },
            { upsert: true }
        );
        res.json({ success: true, message: 'Đã mở chốt lịch tuần này!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi mở chốt lịch' });
    }
});

// 7. Lấy báo cáo lương theo tháng
router.get('/salary-report', async (req, res) => {
    try {
        const { month } = req.query; // format: YYYY-MM
        if (!month) return res.status(400).json({ message: 'Thiếu tham số month' });

        // Lấy thông tin nhân viên
        const staffs = await User.find({ role: 'staff' });

        // Tìm tất cả điểm danh trong tháng đó
        const attendances = await Attendance.find({ date: { $regex: `^${month}-` } });
        
        const staffWorkedShifts = {};
        const staffTotalSalary = {};

        staffs.forEach(s => {
            staffWorkedShifts[s._id.toString()] = 0;
            staffTotalSalary[s._id.toString()] = 0;
        });

        attendances.forEach(att => {
            const uid = att.userId.toString();
            if (staffWorkedShifts[uid] === undefined) {
                staffWorkedShifts[uid] = 0;
                staffTotalSalary[uid] = 0;
            }
            
            const staff = staffs.find(s => s._id.toString() === uid);
            const salaryPerShift = staff ? (staff.baseSalary || 500000) : 500000;

            att.shifts.forEach(shift => {
                if (att.status) {
                    const status = att.status[shift];
                    if (status === 'present') {
                        staffWorkedShifts[uid]++;
                        staffTotalSalary[uid] += salaryPerShift;
                    } else if (status === 'late') {
                        staffWorkedShifts[uid]++;
                        staffTotalSalary[uid] += salaryPerShift * 0.5; // Trừ 50% lương nếu đi muộn > 30p
                    }
                }
            });
        });
        
        const report = staffs.map(staff => {
            const uid = staff._id.toString();
            const workedShifts = staffWorkedShifts[uid] || 0;
            const salaryPerShift = staff.baseSalary || 500000;
            const totalSalary = staffTotalSalary[uid] || 0;
            return {
                _id: staff._id,
                staffId: staff.staffId,
                fullName: staff.fullName,
                email: staff.email,
                salaryPerShift,
                workedShifts,
                totalSalary
            };
        });

        res.json(report);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tính lương' });
    }
});

// 8. Lấy chi tiết lịch đi làm để in PDF
router.get('/salary-details/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { month } = req.query;
        if (!month) return res.status(400).json({ message: 'Thiếu tham số month' });

        const staff = await User.findById(userId);
        if (!staff || staff.role !== 'staff') return res.status(404).json({ message: 'Không tìm thấy nhân viên' });

        const attendances = await Attendance.find({ 
            userId, 
            date: { $regex: `^${month}-` } 
        }).sort({ date: 1 });

        const shiftsDetail = [];
        const shiftLabels = { morning: 'Sáng', afternoon: 'Chiều', evening: 'Tối' };

        attendances.forEach(att => {
            att.shifts.forEach(shift => {
                if (att.status && (att.status[shift] === 'present' || att.status[shift] === 'late')) {
                    shiftsDetail.push({
                        date: att.date,
                        shiftId: shift,
                        shiftLabel: shiftLabels[shift] || shift,
                        status: att.status[shift]
                    });
                }
            });
        });

        const salaryPerShift = staff.baseSalary || 500000;
        let totalSalary = 0;
        shiftsDetail.forEach(item => {
            if (item.status === 'late') {
                totalSalary += salaryPerShift * 0.5;
            } else {
                totalSalary += salaryPerShift;
            }
        });

        res.json({
            staffId: staff.staffId,
            fullName: staff.fullName,
            salaryPerShift,
            workedShifts: shiftsDetail.length,
            totalSalary,
            details: shiftsDetail
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 9. API Thống kê tổng hợp (Dashboard)
router.get('/stats', async (req, res) => {
    try {
        const { month } = req.query; // format: YYYY-MM
        const Product = require('../models/Product');
        const Order   = require('../models/Order');

        // Xác định tháng cần thống kê
        const now = new Date();
        const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // Khoảng thời gian của tháng
        const start = new Date(`${targetMonth}-01T00:00:00.000Z`);
        const end   = new Date(start);
        end.setMonth(end.getMonth() + 1);

        // --- 1. Sản phẩm bán chạy nhất: aggregate từ đơn hàng COMPLETED ---
        const topProducts = await Order.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lt: end } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    productName:  { $first: '$items.productName' },
                    productImage: { $first: '$items.productImage' },
                    price:        { $first: '$items.price' },
                    totalSold:    { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // --- 2. Nhân viên xuất sắc: số ca trực trong tháng ---
        const attendances = await Attendance.find({ date: { $regex: `^${targetMonth}-` } });

        const shiftCounts = {};
        attendances.forEach(att => {
            const uid = att.userId.toString();
            if (!shiftCounts[uid]) shiftCounts[uid] = 0;
            att.shifts.forEach(shift => {
                if (att.status && (att.status[shift] === 'present' || att.status[shift] === 'late')) {
                    shiftCounts[uid]++;
                }
            });
        });

        const staffs = await User.find({ role: 'staff' }).select('fullName staffId avatar');
        const staffStats = staffs.map(staff => ({
            _id: staff._id,
            fullName: staff.fullName,
            staffId: staff.staffId || 'N/A',
            avatar: staff.avatar || '',
            workedShifts: shiftCounts[staff._id.toString()] || 0
        })).sort((a, b) => b.workedShifts - a.workedShifts).slice(0, 5);

        // --- 3. Tổng quan ---
        const totalProducts      = await Product.countDocuments();
        const totalStaff         = await User.countDocuments({ role: 'staff' });
        const totalCustomers     = await User.countDocuments({ role: 'customer' });
        const totalShiftsThisMonth = Object.values(shiftCounts).reduce((a, b) => a + b, 0);

        // Tổng đơn hoàn thành & doanh thu tháng
        const completedOrders = await Order.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lt: end } } },
            { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$finalAmount' } } }
        ]);
        const orderSummary = completedOrders[0] || { count: 0, revenue: 0 };

        // --- 4. Khách hàng tiềm năng ---
        const topCustomers = await Order.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lt: end } } },
            { 
                $group: {
                    _id: '$customerPhone',
                    customerName: { $first: '$customerName' },
                    customerPhone: { $first: '$customerPhone' },
                    customerId: { $first: '$customerId' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$finalAmount' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customerUser'
                }
            },
            {
                $addFields: {
                    avatar: { $arrayElemAt: ['$customerUser.avatar', 0] }
                }
            },
            {
                $project: {
                    customerUser: 0
                }
            }
        ]);

        res.json({
            month: targetMonth,
            overview: {
                totalProducts,
                totalStaff,
                totalCustomers,
                totalShiftsThisMonth,
                completedOrders: orderSummary.count,
                totalRevenue: orderSummary.revenue
            },
            topProducts,
            topStaff: staffStats,
            topCustomers
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy thống kê' });
    }
});

module.exports = router;


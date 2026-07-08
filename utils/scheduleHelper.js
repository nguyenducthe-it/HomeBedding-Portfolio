const User = require('../models/User');
const Attendance = require('../models/Attendance');
const WeekConfig = require('../models/WeekConfig');
const ShiftRequest = require('../models/ShiftRequest');

const autoAssignAndLock = async (weekStartDate) => {
    try {
        // 1. Lấy tất cả nhân viên
        const staffs = await User.find({ role: 'staff' });
        if (staffs.length === 0) return { success: false, message: 'Không có nhân viên nào' };

        // 2. Tạo mảng 7 ngày của tuần
        const start = new Date(weekStartDate);
        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            weekDates.push(d.toISOString().split('T')[0]);
        }

        // 3. Lấy tất cả lịch của tuần
        const attendances = await Attendance.find({ date: { $in: weekDates } });

        // 4. Đếm số ca của mỗi nhân viên trong tuần này và map dữ liệu
        const staffTally = {};
        staffs.forEach(s => staffTally[s._id.toString()] = 0);

        const dailySchedules = {};
        weekDates.forEach(date => dailySchedules[date] = { morning: null, afternoon: null, evening: null });

        attendances.forEach(att => {
            const uid = att.userId.toString();
            if (staffTally[uid] !== undefined) {
                staffTally[uid] += att.shifts.length;
            }
            att.shifts.forEach(shift => {
                dailySchedules[att.date][shift] = uid;
            });
        });

        const shiftsDef = ['morning', 'afternoon', 'evening'];

        // 4.5. Duyệt ưu tiên các ca đăng ký (pending) của nhân viên trước
        const shiftRequests = await ShiftRequest.find({ weekStartDate, status: 'pending' });
        
        for (const req of shiftRequests) {
            const uid = req.userId.toString();
            if (staffTally[uid] === undefined) continue; // Nhân viên không tồn tại

            for (const s of req.requestedShifts) {
                const shiftDate = s.date;
                const shiftType = s.shiftType;

                // Nếu ca này hợp lệ và hiện tại đang trống
                if (dailySchedules[shiftDate] && !dailySchedules[shiftDate][shiftType]) {
                    
                    // Tính số ca của nhân viên uid trong ngày này
                    let dailyCount = 0;
                    shiftsDef.forEach(sh => {
                        if (dailySchedules[shiftDate][sh] === uid) dailyCount++;
                    });

                    // Một người chỉ làm tối đa 2 ca/ngày
                    if (dailyCount < 2) {
                        // Gán ca cho nhân viên này
                        dailySchedules[shiftDate][shiftType] = uid;
                        staffTally[uid]++;
                        
                        let att = await Attendance.findOne({ userId: uid, date: shiftDate });
                        if (att) {
                            if (!att.shifts.includes(shiftType)) {
                                att.shifts.push(shiftType);
                                await att.save();
                            }
                        } else {
                            await Attendance.create({ userId: uid, date: shiftDate, shifts: [shiftType] });
                        }
                    }
                }
            }
            // Đổi trạng thái request sau khi đã duyệt xong những ca hợp lệ
            req.status = 'approved'; 
            await req.save();
        }

        // 5. Tìm các ca trống còn lại và tự động gán ngẫu nhiên
        for (const date of weekDates) {
            const dailyStaffTally = {};
            staffs.forEach(s => dailyStaffTally[s._id.toString()] = 0);
            
            shiftsDef.forEach(shift => {
                const uid = dailySchedules[date][shift];
                if (uid) dailyStaffTally[uid]++;
            });

            for (const shift of shiftsDef) {
                if (!dailySchedules[date][shift]) {
                    let selectedStaffId = null;
                    let minWeekShifts = Infinity;

                    // Trộn ngẫu nhiên danh sách để công bằng nếu có nhiều người cùng số ca
                    const shuffledStaffs = [...staffs].sort(() => 0.5 - Math.random());

                    for (const staff of shuffledStaffs) {
                        const uid = staff._id.toString();
                        if (dailyStaffTally[uid] < 2) {
                            if (staffTally[uid] < minWeekShifts) {
                                minWeekShifts = staffTally[uid];
                                selectedStaffId = uid;
                            }
                        }
                    }

                    if (selectedStaffId) {
                        dailySchedules[date][shift] = selectedStaffId;
                        staffTally[selectedStaffId]++;
                        dailyStaffTally[selectedStaffId]++;

                        let att = await Attendance.findOne({ userId: selectedStaffId, date });
                        if (att) {
                            att.shifts.push(shift);
                            await att.save();
                        } else {
                            await Attendance.create({ userId: selectedStaffId, date, shifts: [shift] });
                        }
                    }
                }
            }
        }

        // 6. Đánh dấu đã chốt
        await WeekConfig.findOneAndUpdate(
            { weekStartDate },
            { isLocked: true },
            { upsert: true, new: true }
        );

        return { success: true, message: 'Đã tự động điền lịch trống và chốt lịch tuần!' };
    } catch (err) {
        console.error('Auto Assign Error:', err);
        return { success: false, message: 'Lỗi khi tự động gán lịch' };
    }
};

module.exports = { autoAssignAndLock };

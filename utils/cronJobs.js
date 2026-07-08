const cron = require('node-cron');
const { autoAssignAndLock } = require('./scheduleHelper');
const WeekConfig = require('../models/WeekConfig');

const initCronJobs = () => {
    // 1. Startup Check: Tự động kiểm tra và chốt lịch tuần HIỆN TẠI nếu chưa chốt
    // (Phòng trường hợp server bị tắt vào lúc 23:59 Chủ Nhật)
    (async () => {
        try {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const currentMonday = new Date(today);
            currentMonday.setDate(diff);
            currentMonday.setHours(0,0,0,0);
            
            const weekStartDate = new Date(currentMonday.getTime() - (currentMonday.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            
            const weekConfig = await WeekConfig.findOne({ weekStartDate });
            if (!weekConfig || !weekConfig.isLocked) {
                console.log(`--- STARTUP CHECK: Tuần ${weekStartDate} chưa được chốt. Đang tự động chốt... ---`);
                const result = await autoAssignAndLock(weekStartDate);
                console.log(result.message);
            }
        } catch (err) {
            console.error('Lỗi khi kiểm tra chốt lịch lúc khởi động:', err);
        }
    })();

    // 2. Cron Job: Chạy vào lúc 23:59 Chủ Nhật hàng tuần để chốt lịch TUẦN TỚI
    cron.schedule('59 23 * * 0', async () => {
        console.log('--- CRON: Tự động điền lịch trống và chốt lịch ---');
        // Tìm ngày Thứ 2 của tuần tiếp theo
        const today = new Date();
        const diffToNextMonday = 1; // Vì hôm nay là Chủ nhật (0) -> Thứ 2 là +1 ngày
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + diffToNextMonday);
        nextMonday.setHours(0,0,0,0);
        
        // Cần đảm bảo múi giờ đúng, ta lấy chuỗi YYYY-MM-DD
        const weekStartDate = new Date(nextMonday.getTime() - (nextMonday.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        
        const result = await autoAssignAndLock(weekStartDate);
        console.log(result.message);
    });
};

module.exports = initCronJobs;

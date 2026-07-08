const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    date: { 
        type: String, 
        required: true 
    }, // Format: YYYY-MM-DD
    shifts: [{ 
        type: String, 
        enum: ['morning', 'afternoon', 'evening'] 
    }], // Ca được phân công
    status: {
        morning: { type: String, enum: ['none', 'present', 'absent', 'late'], default: 'none' },
        afternoon: { type: String, enum: ['none', 'present', 'absent', 'late'], default: 'none' },
        evening: { type: String, enum: ['none', 'present', 'absent', 'late'], default: 'none' }
    } // Trạng thái điểm danh từng ca
}, { timestamps: true });

// Mỗi nhân viên chỉ có 1 bản ghi lịch/chấm công mỗi ngày
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

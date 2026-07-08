const mongoose = require('mongoose');

const shiftRequestSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    weekStartDate: { 
        type: String, 
        required: true 
    }, // YYYY-MM-DD (Luôn là Thứ 2)
    requestedShifts: [{
        date: { type: String, required: true }, // YYYY-MM-DD
        shiftType: { type: String, enum: ['morning', 'afternoon', 'evening'], required: true }
    }],
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });

// Mỗi nhân viên chỉ đăng ký 1 lần cho 1 tuần cụ thể
shiftRequestSchema.index({ userId: 1, weekStartDate: 1 }, { unique: true });

module.exports = mongoose.model('ShiftRequest', shiftRequestSchema);

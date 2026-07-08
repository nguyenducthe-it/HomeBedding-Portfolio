const mongoose = require('mongoose');

const staffFeedbackSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    staffName: { type: String, required: true },
    feedbackType: {
        type: String,
        enum: ['schedule_issue', 'salary_issue', 'work_environment', 'other'],
        required: true
    },
    messages: [{
        senderRole: { type: String, enum: ['staff', 'admin'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'resolved'],
        default: 'pending'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    }
}, { timestamps: true });

module.exports = mongoose.model('StaffFeedback', staffFeedbackSchema);

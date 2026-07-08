const mongoose = require('mongoose');

const staffChatSchema = new mongoose.Schema({
    staffId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    staffName: { type: String, required: true },
    messages: [{
        senderRole: { type: String, enum: ['staff', 'admin'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, default: '' },
        attachmentUrl: { type: String, default: '' },
        attachedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        attachedOrderCode: { type: String, default: '' },
        createdAt: { type: Date, default: Date.now }
    }],
    lastMessageAt: { type: Date, default: Date.now },
    unreadCountAdmin: { type: Number, default: 0 },
    unreadCountStaff: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('StaffChat', staffChatSchema);

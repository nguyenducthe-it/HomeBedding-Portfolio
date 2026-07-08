const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customerName: { type: String, required: true },
    messages: [{
        senderRole: { type: String, enum: ['customer', 'staff'], required: true },
        senderName: { type: String, required: true },
        text: { type: String, required: false },
        attachmentUrl: { type: String }, // Hỗ trợ gửi file
        attachedOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        attachedOrderCode: { type: String },
        createdAt: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);

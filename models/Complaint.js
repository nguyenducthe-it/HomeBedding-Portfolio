const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    complaintType: {
        type: String,
        enum: ['attitude', 'product_issue', 'payment_issue', 'other'],
        required: true
    },
    messages: [{
        senderRole: { type: String, enum: ['customer', 'admin'], required: true },
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

module.exports = mongoose.model('Complaint', complaintSchema);

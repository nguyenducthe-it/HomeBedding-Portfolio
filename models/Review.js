const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: { type: String, required: true },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    orderId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    images: [{ type: String }],
    editCount: { type: Number, default: 0 },
    staffReply: { type: String }, // Nhân viên phản hồi đánh giá này
    staffName: { type: String }, // Tên nhân viên phản hồi
    replyDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: { type: String, required: true },
    productImage: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    customerName: { type: String },
    customerPhone: { type: String },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    promotionCode: { type: String, default: null },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    shippingAddress: {
        province: { type: String, required: true },
        district: { type: String, required: true },
        ward: { type: String, required: true },
        detail: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['online', 'cod'],
        default: 'cod'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipping', 'completed', 'cancelled'],
        default: 'pending'
    },
    note: { type: String },
    cancelledBy: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

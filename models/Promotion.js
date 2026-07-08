const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountAmount: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    applicableProducts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['4 mùa', 'mùa xuân', 'mùa hạ', 'mùa thu', 'mùa đông']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    sold: {
        type: Number,
        default: 0,
        min: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    images: [{
        type: String // Đường dẫn đến file ảnh (e.g., /uploads/image.jpg)
    }],
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Product', productSchema);

const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { uploadReview } = require('../utils/cloudinaryUpload');
const upload = uploadReview;

// 1. Gửi đánh giá (Customer)
router.post('/submit', upload.array('images', 3), async (req, res) => {
    try {
        const { productId, customerId, customerName, rating, comment, orderId } = req.body;
        
        // Kiểm tra xem đã đánh giá chưa (nếu yêu cầu 1 đơn chỉ đánh giá 1 lần)
        const existingReview = await Review.findOne({ orderId, productId });
        if (existingReview) {
            return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này trong đơn hàng này rồi' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Sản phẩm không tồn tại' });

        const images = req.files ? req.files.map(f => f.path) : []; // Cloudinary URL

        const review = new Review({
            productId,
            productName: product.name,
            customerId,
            customerName,
            rating,
            comment,
            orderId,
            images
        });

        await review.save();

        // Cập nhật lại điểm trung bình cho Sản phẩm
        const allReviews = await Review.find({ productId });
        const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        product.averageRating = avg;
        product.reviewCount = allReviews.length;
        await product.save();

        res.status(201).json({ message: 'Đánh giá đã được gửi!', review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy danh sách đánh giá của 1 user
router.get('/user/:customerId', async (req, res) => {
    try {
        const reviews = await Review.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Sửa đánh giá (chỉ sửa 1 lần)
router.put('/edit/:id', upload.array('images', 3), async (req, res) => {
    try {
        const { rating, comment, keepImages } = req.body;
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

        if (review.editCount >= 1) {
            return res.status(400).json({ message: 'Bạn đã hết lượt sửa đánh giá này' });
        }

        review.rating = rating;
        review.comment = comment;
        review.editCount += 1;

        // Xử lý ảnh (giữ ảnh cũ và thêm ảnh mới)
        let updatedImages = [];
        if (keepImages) {
            // keepImages có thể là string hoặc array do FormData gửi lên
            if (Array.isArray(keepImages)) {
                updatedImages = keepImages;
            } else {
                updatedImages = [keepImages];
            }
        }

        const newImages = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
        review.images = [...updatedImages, ...newImages].slice(0, 3); // Tối đa 3 ảnh

        await review.save();

        // Cập nhật lại điểm trung bình
        const product = await Product.findById(review.productId);
        if (product) {
            const allReviews = await Review.find({ productId: review.productId });
            const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
            product.averageRating = avg;
            product.reviewCount = allReviews.length;
            await product.save();
        }

        res.json({ message: 'Sửa đánh giá thành công!', review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2. Lấy tất cả đánh giá (Staff)
router.get('/all', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy số lượng đánh giá chưa phản hồi
router.get('/unread-count', async (req, res) => {
    try {
        const count = await Review.countDocuments({
            $or: [
                { staffReply: { $exists: false } },
                { staffReply: null },
                { staffReply: "" }
            ]
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 3. Nhân viên phản hồi đánh giá
router.put('/reply/:id', async (req, res) => {
    try {
        const { staffReply, staffName } = req.body;
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });

        review.staffReply = staffReply;
        review.staffName = staffName;
        review.replyDate = new Date();
        await review.save();

        res.json({ message: 'Đã gửi phản hồi!', review });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Lấy đánh giá của một sản phẩm cụ thể
router.get('/product/:productId', async (req, res) => {
    try {
        const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy đánh giá sản phẩm' });
    }
});

module.exports = router;

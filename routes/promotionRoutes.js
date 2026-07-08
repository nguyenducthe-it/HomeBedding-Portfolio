const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');

// 1. Lấy tất cả khuyến mãi
router.get('/all', async (req, res) => {
    try {
        const promotions = await Promotion.find().populate('applicableProducts', 'name').sort({ createdAt: -1 });
        res.json(promotions);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách khuyến mãi' });
    }
});

// 2. Thêm khuyến mãi mới
router.post('/add', async (req, res) => {
    try {
        const { name, code, discountAmount, quantity, applicableProducts } = req.body;

        // Kiểm tra mã code đã tồn tại chưa
        const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
        if (existingPromo) {
            return res.status(400).json({ message: 'Mã giảm giá này đã tồn tại!' });
        }

        const newPromo = new Promotion({
            name,
            code: code.toUpperCase(),
            discountAmount,
            quantity,
            applicableProducts: Array.isArray(applicableProducts) ? applicableProducts : [],
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });

        await newPromo.save();
        res.status(201).json({ message: 'Tạo khuyến mãi thành công!', promotion: newPromo });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tạo khuyến mãi' });
    }
});

// 3. Cập nhật khuyến mãi
router.put('/update/:id', async (req, res) => {
    try {
        const { name, code, discountAmount, quantity, applicableProducts, isActive } = req.body;
        
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code.toUpperCase();
        if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
        if (quantity !== undefined) updateData.quantity = quantity;
        if (applicableProducts !== undefined) updateData.applicableProducts = Array.isArray(applicableProducts) ? applicableProducts : [];
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedPromo = await Promotion.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedPromo) {
            return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
        }

        res.json({ message: 'Cập nhật khuyến mãi thành công!', promotion: updatedPromo });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật khuyến mãi' });
    }
});

// 4. Xóa khuyến mãi
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedPromo = await Promotion.findByIdAndDelete(req.params.id);
        if (!deletedPromo) {
            return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
        }
        res.json({ message: 'Xóa khuyến mãi thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xóa khuyến mãi' });
    }
});

module.exports = router;

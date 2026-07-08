const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 1. Lấy giỏ hàng của user
router.get('/:userId', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, items: [] });
            await cart.save();
        }
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy giỏ hàng' });
    }
});

// 2. Thêm sản phẩm vào giỏ
router.post('/add', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        let newQty = Number(quantity);
        if (itemIndex > -1) {
            newQty += cart.items[itemIndex].quantity;
        }

        if (newQty > product.quantity) {
            return res.status(400).json({ message: `Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${product.quantity} sản phẩm!` });
        }

        if (itemIndex > -1) {
            // Sản phẩm đã có trong giỏ, cộng dồn số lượng
            cart.items[itemIndex].quantity = newQty;
        } else {
            // Thêm mới
            cart.items.push({ productId, quantity: Number(quantity) });
        }

        await cart.save();
        await cart.populate('items.productId');
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi thêm vào giỏ hàng' });
    }
});

// 3. Cập nhật số lượng
router.put('/update', async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            const newQty = Number(quantity);
            if (newQty > product.quantity) {
                return res.status(400).json({ message: `Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${product.quantity} sản phẩm!` });
            }
            if (newQty <= 0) {
                cart.items.splice(itemIndex, 1);
            } else {
                cart.items[itemIndex].quantity = newQty;
            }
            await cart.save();
            await cart.populate('items.productId');
            res.json(cart);
        } else {
            res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật giỏ hàng' });
    }
});

// 4. Xóa sản phẩm khỏi giỏ
router.delete('/remove', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Không tìm thấy giỏ hàng' });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();
        await cart.populate('items.productId');
        res.json(cart);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi xóa khỏi giỏ hàng' });
    }
});

module.exports = router;

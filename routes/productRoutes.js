const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { uploadProduct } = require('../utils/cloudinaryUpload');
const upload = uploadProduct;

// 1. Thêm sản phẩm mới
router.post('/add', upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, price, quantity, description } = req.body;
        const images = req.files.map(file => file.path); // Cloudinary URL

        const newProduct = new Product({
            name,
            category,
            price,
            quantity,
            images,
            description
        });

        await newProduct.save();
        res.status(201).json({ message: 'Thêm sản phẩm thành công', product: newProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi thêm sản phẩm' });
    }
});

// Lấy danh sách sản phẩm bán chạy nhất
router.get('/bestsellers', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4;

        // Tính toán thực tế từ các đơn hàng thành công
        const topProducts = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: limit }
        ]);

        let products = [];
        if (topProducts.length > 0) {
            const productIds = topProducts.map(p => p._id);
            const foundProducts = await Product.find({ _id: { $in: productIds } });
            // Sắp xếp lại đúng thứ tự best sellers
            products = productIds.map(id => foundProducts.find(p => p._id.toString() === id.toString())).filter(p => p);
        }

        // Nếu không đủ sản phẩm bán chạy thực tế, bổ sung thêm sản phẩm mới nhất
        if (products.length < limit) {
            const excludeIds = products.map(p => p._id);
            const moreProducts = await Product.find({ _id: { $nin: excludeIds } })
                .sort({ createdAt: -1 })
                .limit(limit - products.length);
            products = [...products, ...moreProducts];
        }

        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm bán chạy' });
    }
});

// 2. Lấy danh sách sản phẩm (có tìm kiếm)
router.get('/all', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};
        if (search) {
            const getVietnameseRegexPattern = (str) => {
                const map = {
                    'a': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'à': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'á': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ả': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ã': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ạ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ă': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ằ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ắ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ẳ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ẵ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ặ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'â': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ầ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ấ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ẩ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ẫ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]', 'ậ': '[aàáảãạăằắẳẵặâầấẩẫậAÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ]',
                    'd': '[dđDĐ]', 'đ': '[dđDĐ]',
                    'e': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'è': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'é': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ẻ': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ẽ': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ẹ': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ê': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ề': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ế': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ể': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ễ': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]', 'ệ': '[eèéẻẽẹêềếểễệEÈÉẺẼẸÊỀẾỂỄỆ]',
                    'i': '[iìíỉĩịIÌÍỈĨỊ]', 'ì': '[iìíỉĩịIÌÍỈĨỊ]', 'í': '[iìíỉĩịIÌÍỈĨỊ]', 'ỉ': '[iìíỉĩịIÌÍỈĨỊ]', 'ĩ': '[iìíỉĩịIÌÍỈĨỊ]', 'ị': '[iìíỉĩịIÌÍỈĨỊ]',
                    'o': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ò': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ó': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ỏ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'õ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ọ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ô': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ồ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ố': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ổ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ỗ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ộ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ơ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ờ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ớ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ở': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ỡ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]', 'ợ': '[oòóỏõọôồốổỗộơờớởỡợOÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢ]',
                    'u': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ù': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ú': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ủ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ũ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ụ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ư': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ừ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ứ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ử': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ữ': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]', 'ự': '[uùúủũụưừứửữựUÙÚỦŨỤƯỪỨỬỮỰ]',
                    'y': '[yỳýỷỹỵYỲÝỶỸỴ]', 'ỳ': '[yỳýỷỹỵYỲÝỶỸỴ]', 'ý': '[yỳýỷỹỵYỲÝỶỸỴ]', 'ỷ': '[yỳýỷỹỵYỲÝỶỸỴ]', 'ỹ': '[yỳýỷỹỵYỲÝỶỸỴ]', 'ỵ': '[yỳýỷỹỵYỲÝỶỸỴ]'
                };
                let result = '';
                for (let char of str.toLowerCase()) {
                    if (map[char]) {
                        result += map[char];
                    } else {
                        if (['-', '/', '\\', '^', '$', '*', '+', '?', '.', '(', ')', '|', '[', ']', '{', '}'].includes(char)) {
                            result += '\\' + char;
                        } else {
                            result += char;
                        }
                    }
                }
                return result;
            };

            const words = search.trim().split(/\s+/).map(w => getVietnameseRegexPattern(w));
            const regexString = words.map(w => `(?=.*${w})`).join('');
            query.name = { $regex: regexString, $options: 'i' };
        }
        if (category && category !== 'all') {
            query.category = category;
        }
        const products = await Product.find(query).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách sản phẩm' });
    }
});

// Lấy chi tiết 1 sản phẩm
router.get('/:id', async (req, res) => {
    try {
        if (req.params.id === 'all' || req.params.id === 'bestsellers' || req.params.id === 'add' || req.params.id === 'update' || req.params.id === 'delete') {
            return res.status(400).json({ message: 'Invalid ID' });
        }
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết sản phẩm' });
    }
});

// Lấy danh sách sản phẩm liên quan
router.get('/related/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

        const related = await Product.find({
            category: product.category,
            _id: { $ne: product._id }
        }).sort({ sold: -1 }).limit(5);

        res.json(related);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy sản phẩm liên quan' });
    }
});

// 3. Sửa sản phẩm
router.put('/update/:id', upload.array('images', 5), async (req, res) => {
    try {
        const { name, category, price, quantity, description, existingImages } = req.body;
        let images = [];

        // Giữ lại các ảnh cũ nếu có
        if (existingImages) {
            images = Array.isArray(existingImages) ? existingImages : [existingImages];
        }

        // Thêm ảnh mới nếu có
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path); // Cloudinary URL
            images = [...images, ...newImages].slice(0, 5); // Tối đa 5 ảnh
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name, category, price, quantity, description, images },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ message: 'Cập nhật thành công', product: updatedProduct });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm' });
    }
});

// 4. Xóa sản phẩm
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm' });
    }
});

module.exports = router;

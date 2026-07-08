const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');

// 1. Đặt hàng (Customer)
router.post('/place', async (req, res) => {
    try {
        const { customerId, customerName, customerPhone, items, promotionCode, note, shippingAddress, paymentMethod } = req.body;

        if (!customerId || !items || items.length === 0 || !shippingAddress) {
            return res.status(400).json({ message: 'Thiếu thông tin đặt hàng hoặc địa chỉ giao hàng' });
        }

        // Tính tổng tiền & kiểm tra tồn kho
        let totalAmount = 0;
        const resolvedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${item.productId}` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({ message: `Sản phẩm "${product.name}" không đủ số lượng trong kho!` });
            }

            totalAmount += product.price * item.quantity;
            resolvedItems.push({
                productId: product._id,
                productName: product.name,
                productImage: product.images && product.images[0] ? product.images[0] : null,
                price: product.price,
                quantity: item.quantity
            });
        }

        // Áp dụng mã khuyến mãi nếu có
        let discountAmount = 0;
        let usedPromoCode = null;

        if (promotionCode) {
            const promo = await Promotion.findOne({ code: promotionCode.toUpperCase(), isActive: true });
            if (!promo) {
                return res.status(400).json({ message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn!' });
            }
            if (promo.quantity <= 0) {
                return res.status(400).json({ message: 'Mã khuyến mãi đã hết lượt sử dụng!' });
            }
            // Kiểm tra sản phẩm có trong danh sách áp dụng không
            const applicableProductIds = promo.applicableProducts.map(id => id.toString());
            const hasApplicable = resolvedItems.some(item => applicableProductIds.includes(item.productId.toString()));
            if (applicableProductIds.length > 0 && !hasApplicable) {
                return res.status(400).json({ message: 'Mã khuyến mãi không áp dụng cho sản phẩm trong giỏ hàng!' });
            }

            discountAmount = promo.discountAmount;
            usedPromoCode = promo.code;

            // Giảm số lượng mã
            promo.quantity -= 1;
            await promo.save();
        }

        const finalAmount = Math.max(0, totalAmount - discountAmount);

        // Tạo đơn hàng
        const order = new Order({
            customerId,
            customerName,
            customerPhone,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            paymentStatus: 'pending',
            items: resolvedItems,
            totalAmount,
            promotionCode: usedPromoCode,
            discountAmount,
            finalAmount,
            status: 'pending',
            note
        });

        await order.save();

        // Tạo thông báo đơn hàng mới cho Admin
        try {
            const shortCode = order._id.toString().substring(order._id.toString().length - 6).toUpperCase();
            const newNotification = new Notification({
                title: 'Đơn hàng mới nhận',
                content: `Khách hàng ${customerName} vừa đặt đơn hàng #${shortCode} trị giá ${finalAmount.toLocaleString('vi-VN')}đ.`,
                type: 'new_order',
                relatedId: order._id,
                isRead: false,
                metadata: {
                    orderId: order._id,
                    orderCode: shortCode,
                    customerName,
                    customerPhone,
                    finalAmount
                }
            });
            await newNotification.save();
        } catch (notifErr) {
            console.error('Lỗi khi tạo thông báo đơn hàng mới:', notifErr);
        }

        // Trừ tồn kho
        for (const item of resolvedItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Dọn giỏ hàng (xoá các item đã đặt)
        const cart = await Cart.findOne({ userId: customerId });
        if (cart) {
            const orderedProductIds = resolvedItems.map(item => item.productId.toString());
            cart.items = cart.items.filter(item => !orderedProductIds.includes(item.productId.toString()));
            await cart.save();
        }

        res.status(201).json({ message: 'Đặt hàng thành công!', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi đặt hàng' });
    }
});

// 1.5. Đặt hàng (Admin/Staff tạo đơn)
router.post('/admin-place', async (req, res) => {
    try {
        const { customerName, customerPhone, items, shippingAddress, paymentMethod, paymentStatus, status, note, createdBy } = req.body;

        if (!items || items.length === 0 || !shippingAddress) {
            return res.status(400).json({ message: 'Thiếu thông tin đặt hàng hoặc địa chỉ giao hàng' });
        }

        // Tính tổng tiền & kiểm tra tồn kho
        let totalAmount = 0;
        const resolvedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Không tìm thấy sản phẩm: ${item.productId}` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({ message: `Sản phẩm "${product.name}" không đủ số lượng trong kho!` });
            }

            totalAmount += product.price * item.quantity;
            resolvedItems.push({
                productId: product._id,
                productName: product.name,
                productImage: product.images && product.images[0] ? product.images[0] : null,
                price: product.price,
                quantity: item.quantity
            });
        }

        const finalAmount = totalAmount; // Không có mã khuyến mãi trong form tạo đơn admin

        const orderData = {
            customerName,
            customerPhone,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            paymentStatus: paymentStatus || 'pending',
            items: resolvedItems,
            totalAmount,
            discountAmount: 0,
            finalAmount,
            status: status || 'pending',
            note
        };

        if (status === 'completed') {
            orderData.completedAt = new Date();
        }

        const order = new Order(orderData);
        await order.save();

        // Trừ tồn kho
        for (const item of resolvedItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: -item.quantity }
            });
        }

        res.status(201).json({ message: 'Tạo đơn hàng thành công!', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
    }
});

// 2. Lấy đơn hàng của 1 khách hàng
router.get('/my-orders/:customerId', async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 2.1 Huỷ đơn hàng (Customer) - Chỉ khi pending
router.put('/:orderId/cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Chỉ có thể huỷ đơn hàng đang chờ xác nhận!' });
        }

        // Hoàn lại tồn kho
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: item.quantity }
            });
        }

        order.status = 'cancelled';
        order.cancelledBy = (req.body && req.body.cancelledBy) ? req.body.cancelledBy : 'Khách hàng';
        order.cancelledAt = new Date();
        await order.save();

        res.json({ message: 'Huỷ đơn hàng thành công!', order });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi huỷ đơn' });
    }
});

// 2.2 Cập nhật địa chỉ (Customer) - Chỉ khi pending
router.put('/:orderId/address', async (req, res) => {
    try {
        const { shippingAddress, customerName, customerPhone } = req.body;
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        
        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'Chỉ có thể sửa thông tin khi đơn hàng đang chờ xác nhận!' });
        }

        if (shippingAddress) order.shippingAddress = shippingAddress;
        if (customerName) order.customerName = customerName;
        if (customerPhone) order.customerPhone = customerPhone;
        await order.save();

        res.json({ message: 'Cập nhật địa chỉ thành công!', order });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi sửa địa chỉ' });
    }
});

// 3. Lấy TẤT CẢ đơn hàng (Admin/Staff)
router.get('/all', async (req, res) => {
    try {
        const { status } = req.query;
        const query = status ? { status } : {};
        const orders = await Order.find(query).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 4. Cập nhật trạng thái đơn hàng (Admin/Staff)
router.put('/status/:orderId', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipping', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

        // Nếu huỷ đơn → hoàn trả tồn kho
        if (status === 'cancelled' && order.status !== 'cancelled') {
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { quantity: item.quantity }
                });
            }
            order.cancelledBy = 'Người bán';
            order.cancelledAt = new Date();
        }

        if (status === 'completed' && order.status !== 'completed') {
            order.completedAt = new Date();
        }

        order.status = status;
        await order.save();

        res.json({ message: 'Cập nhật trạng thái đơn hàng thành công!', order });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 5. Thống kê sản phẩm bán chạy dựa trên đơn COMPLETED
router.get('/top-products', async (req, res) => {
    try {
        const { month } = req.query; // YYYY-MM, tuỳ chọn

        const matchQuery = { status: 'completed' };
        if (month) {
            const start = new Date(`${month}-01T00:00:00.000Z`);
            const end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            matchQuery.createdAt = { $gte: start, $lt: end };
        }

        const topProducts = await Order.aggregate([
            { $match: matchQuery },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    productName: { $first: '$items.productName' },
                    productImage: { $first: '$items.productImage' },
                    price: { $first: '$items.price' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        res.json(topProducts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6. Báo cáo doanh thu thực tế (Admin)
// Doanh thu thực = Tổng đơn hoàn thành - Tổng lương nhân viên đến thời điểm hiện tại
router.get('/revenue-report', async (req, res) => {
    try {
        const User       = require('../models/User');
        const Attendance = require('../models/Attendance');

        const now = new Date();
        const filter = req.query.filterType || 'month';

        let start, end;

        if (filter === 'date') {
            const sStr = req.query.startDate;
            const eStr = req.query.endDate;
            start = new Date(`${sStr}T00:00:00.000Z`);
            end = new Date(`${eStr}T23:59:59.999Z`);
        } else if (filter === 'quarter') {
            const y = parseInt(req.query.quarterYear) || now.getFullYear();
            const q = parseInt(req.query.quarterVal) || 1;
            if (q === 1) {
                start = new Date(`${y}-01-01T00:00:00.000Z`);
                end = new Date(`${y}-03-31T23:59:59.999Z`);
            } else if (q === 2) {
                start = new Date(`${y}-04-01T00:00:00.000Z`);
                end = new Date(`${y}-06-30T23:59:59.999Z`);
            } else if (q === 3) {
                start = new Date(`${y}-07-01T00:00:00.000Z`);
                end = new Date(`${y}-09-30T23:59:59.999Z`);
            } else {
                start = new Date(`${y}-10-01T00:00:00.000Z`);
                end = new Date(`${y}-12-31T23:59:59.999Z`);
            }
        } else if (filter === 'year') {
            const y = parseInt(req.query.year) || now.getFullYear();
            start = new Date(`${y}-01-01T00:00:00.000Z`);
            end = new Date(`${y}-12-31T23:59:59.999Z`);
        } else {
            // month
            const targetMonth = req.query.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            start = new Date(`${targetMonth}-01T00:00:00.000Z`);
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);
            end = new Date(end.getTime() - 1);
        }

        // --- 1. Tổng doanh thu từ đơn COMPLETED ---
        const revenueAgg = await Order.aggregate([
            { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
            { $group: {
                _id: null,
                totalRevenue:  { $sum: '$finalAmount' },
                totalDiscount: { $sum: '$discountAmount' },
                orderCount:    { $sum: 1 }
            }}
        ]);
        const revData = revenueAgg[0] || { totalRevenue: 0, totalDiscount: 0, orderCount: 0 };

        // Đơn huỷ
        const cancelledCount = await Order.countDocuments({
            status: 'cancelled',
            createdAt: { $gte: start, $lte: end }
        });
        // Đơn đang xử lý
        const pendingCount = await Order.countDocuments({
            status: { $in: ['pending', 'processing'] },
            createdAt: { $gte: start, $lte: end }
        });

        // --- 2. Tổng chi phí lương nhân viên trong tháng & Chi tiết hàng ngày ---
        const sStrStr = start.toISOString().split('T')[0];
        const eStrStr = end.toISOString().split('T')[0];
        const attendances = await Attendance.find({ date: { $gte: sStrStr, $lte: eStrStr } });
        const staffs = await User.find({ role: 'staff' });
        
        // Bản đồ lương cơ bản của nhân viên
        const staffSalaryMap = {};
        staffs.forEach(s => {
            staffSalaryMap[s._id.toString()] = {
                salaryPerShift: s.baseSalary || 500000,
                fullName: s.fullName,
                staffId: s.staffId || 'N/A'
            };
        });

        const dailySalaryMap = {};
        const monthlySalaryMap = {}; // Thêm map lương theo tháng
        const staffWorkedShifts = {};
        const staffTotalSalary = {};

        staffs.forEach(s => {
            staffWorkedShifts[s._id.toString()] = 0;
            staffTotalSalary[s._id.toString()] = 0;
        });

        attendances.forEach(att => {
            const dateStr = att.date; // YYYY-MM-DD
            const monthStr = dateStr.substring(0, 7); // YYYY-MM
            if (!dailySalaryMap[dateStr]) dailySalaryMap[dateStr] = 0;
            if (!monthlySalaryMap[monthStr]) monthlySalaryMap[monthStr] = 0;

            const uid = att.userId.toString();
            if (staffWorkedShifts[uid] === undefined) {
                staffWorkedShifts[uid] = 0;
                staffTotalSalary[uid] = 0;
            }

            const staffInfo = staffSalaryMap[uid];
            if (staffInfo) {
                att.shifts.forEach(shift => {
                    if (att.status) {
                        const status = att.status[shift];
                        if (status === 'present') {
                            staffWorkedShifts[uid]++;
                            staffTotalSalary[uid] += staffInfo.salaryPerShift;
                            dailySalaryMap[dateStr] += staffInfo.salaryPerShift;
                            monthlySalaryMap[monthStr] += staffInfo.salaryPerShift;
                        } else if (status === 'late') {
                            staffWorkedShifts[uid]++;
                            staffTotalSalary[uid] += staffInfo.salaryPerShift * 0.5; // Trừ 50% lương nếu đi muộn > 30p
                            dailySalaryMap[dateStr] += staffInfo.salaryPerShift * 0.5;
                            monthlySalaryMap[monthStr] += staffInfo.salaryPerShift * 0.5;
                        }
                    }
                });
            }
        });

        let totalSalaryCost = 0;
        const staffSalaryDetail = staffs.map(staff => {
            const uid = staff._id.toString();
            const workedShifts  = staffWorkedShifts[uid] || 0;
            const salaryPerShift = staff.baseSalary || 500000;
            const totalSalary    = staffTotalSalary[uid] || 0;
            totalSalaryCost += totalSalary;
            return {
                staffId: staff.staffId || 'N/A',
                fullName: staff.fullName,
                workedShifts,
                salaryPerShift,
                totalSalary
            };
        });

        // --- 3. Doanh thu thực = Doanh thu - Chi phí lương ---
        const actualRevenue = revData.totalRevenue - totalSalaryCost;

        // --- 4. Doanh thu theo ngày/tháng (cho biểu đồ cột) ---
        let dailyRevenue;
        if (filter === 'year') {
            dailyRevenue = await Order.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$finalAmount' },
                    orders:  { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]);
        } else {
            dailyRevenue = await Order.aggregate([
                { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
                { $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$finalAmount' },
                    orders:  { $sum: 1 }
                }},
                { $sort: { _id: 1 } }
            ]);
        }

        // --- 5. Tổng hợp xu hướng hàng ngày/hàng tháng ---
        const dailyTrends = [];
        if (filter === 'year') {
            const revenueMap = {};
            dailyRevenue.forEach(item => {
                revenueMap[item._id] = item.revenue;
            });

            for (let m = 1; m <= 12; m++) {
                const mm = String(m).padStart(2, '0');
                const monthStr = `${start.getUTCFullYear()}-${mm}`;
                dailyTrends.push({
                    date: monthStr,
                    day: m,
                    label: `Th. ${m}`,
                    revenue: revenueMap[monthStr] || 0,
                    salary: monthlySalaryMap[monthStr] || 0
                });
            }
        } else {
            const revenueMap = {};
            dailyRevenue.forEach(item => {
                revenueMap[item._id] = item.revenue;
            });

            // Tạo chuỗi ngày lặp qua để vẽ biểu đồ
            let curr = new Date(start);
            while (curr <= end) {
                const yyyy = curr.getUTCFullYear();
                const mm = String(curr.getUTCMonth() + 1).padStart(2, '0');
                const dd = String(curr.getUTCDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                dailyTrends.push({
                    date: dateStr,
                    day: dailyTrends.length + 1,
                    label: `${dd}/${mm}`,
                    revenue: revenueMap[dateStr] || 0,
                    salary: dailySalaryMap[dateStr] || 0
                });
                curr.setUTCDate(curr.getUTCDate() + 1);
            }
        }

        res.json({
            filterType: filter,
            revenue: {
                total:    revData.totalRevenue,
                discount: revData.totalDiscount,
                orders:   revData.orderCount,
                cancelled: cancelledCount,
                pending:   pendingCount
            },
            salary: {
                total:  totalSalaryCost,
                detail: staffSalaryDetail
            },
            actualRevenue,
            dailyRevenue,
            dailyTrends
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy báo cáo doanh thu' });
    }
});


// 7. Thống kê số lượng đơn hàng theo trạng thái (Staff/Admin)
router.get('/stats/counts', async (req, res) => {
    try {
        const counts = {
            pending: await Order.countDocuments({ status: 'pending' }),
            confirmed: await Order.countDocuments({ status: 'processing' }), // 'processing' mapped to 'Đã xác nhận'
            shipping: await Order.countDocuments({ status: 'shipping' }),
            completed: await Order.countDocuments({ status: 'completed' }),
            cancelled: await Order.countDocuments({ status: 'cancelled' })
        };
        res.json(counts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi thống kê.' });
    }
});

// Lấy chi tiết một đơn hàng theo ID (quan trọng cho trang thanh toán)
router.get('/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng' });
    }
});

module.exports = router;

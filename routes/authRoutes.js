const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');

// API Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;

        // 1. Kiểm tra định dạng Email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Định dạng email không hợp lệ hoặc tên miền không hỗ trợ.' });
        }

        // 2. Kiểm tra định dạng Số điện thoại (Việt Nam - 10 số)
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/g;
        if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
        }

        // 3. Kiểm tra độ mạnh mật khẩu (Ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt)
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&)' 
            });
        }

        // 4. Kiểm tra email đã tồn tại chưa
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // 4.5 Kiểm tra số điện thoại đã tồn tại chưa
        let existingPhone = await User.findOne({ phone });
        if (existingPhone) {
            return res.status(400).json({ message: 'Số điện thoại đã được sử dụng' });
        }

        // 5. Logic phân quyền đặc biệt:
        // Chỉ email này được làm admin, tất cả các đăng ký từ form đều là customer
        let finalRole = 'customer';
        if (email === 'the5678999@gmail.com') {
            finalRole = 'admin';
        }

        // Tạo user mới
        user = new User({
            fullName,
            email,
            phone,
            password,
            role: finalRole
        });

        await user.save();

        // Tạo thông báo khi khách hàng đăng ký mới
        if (finalRole === 'customer') {
            try {
                const newNotification = new Notification({
                    title: 'Khách hàng mới đăng ký',
                    content: `Khách hàng ${fullName} (${email}) đã đăng ký tài khoản thành công.`,
                    type: 'new_customer',
                    relatedId: user._id,
                    isRead: false,
                    metadata: {
                        userId: user._id,
                        fullName,
                        email,
                        phone
                    }
                });
                await newNotification.save();
            } catch (notifErr) {
                console.error('Lỗi khi tạo thông báo đăng ký mới:', notifErr);
            }
        }

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Tìm user theo email HOẶC fullName
        const user = await User.findOne({
            $or: [
                { email: email },
                { fullName: email } // Trường hợp người dùng nhập tên vào ô Email
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Thông tin tài khoản hoặc mật khẩu không chính xác' });
        }

        // Kiểm tra mật khẩu
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không chính xác' });
        }

        // Tạo JWT Token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                fullName: user.fullName
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secretKey',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    userId: user.id,
                    role: user.role,
                    fullName: user.fullName,
                    message: 'Đăng nhập thành công'
                });
            }
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API Kiểm tra Role dựa trên Email hoặc Tên (Dùng cho giao diện)
router.get('/check-role/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase() },
                { fullName: identifier }
            ]
        });
        if (user) {
            return res.json({ role: user.role });
        }
        res.json({ role: 'guest' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API Đổi mật khẩu
router.post('/change-password', async (req, res) => {
    try {
        const { userId, oldPassword, newPassword } = req.body;
        if (!userId || !oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Kiểm tra độ mạnh mật khẩu mới
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({
                message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt (@$!%*?&)'
            });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Kiểm tra mật khẩu cũ
        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });

        user.password = newPassword; // pre-save hook sẽ hash
        await user.save();
        res.json({ message: 'Đổi mật khẩu thành công!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu' });
    }
});

module.exports = router;


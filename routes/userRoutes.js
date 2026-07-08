const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { uploadAvatar } = require('../utils/cloudinaryUpload');
const upload = uploadAvatar;

// 1. Lấy tất cả người dùng
router.get('/all', async (req, res) => {
    try {
        // Không hiển thị tài khoản admin
        const users = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách người dùng' });
    }
});

// 2. Thêm người dùng mới
router.post('/add', async (req, res) => {
    try {
        const { fullName, email, phone, password, role } = req.body;
        
        // Kiểm tra định dạng số điện thoại Việt Nam
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (phone && !phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Số điện thoại không đúng định dạng Việt Nam!' });
        }

        // Kiểm tra định dạng email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Địa chỉ email không đúng định dạng hoặc tên miền không hỗ trợ.' });
        }

        // Kiểm tra email tồn tại
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được sử dụng!' });
        }

        // Kiểm tra số điện thoại tồn tại
        if (phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng!' });
            }
        }

        let staffId = null;
        if (role === 'staff') {
            // Kiểm tra giới hạn 10 nhân viên
            const staffCount = await User.countDocuments({ role: 'staff' });
            if (staffCount >= 10) {
                return res.status(400).json({ message: 'Hệ thống đã đạt giới hạn tối đa 10 tài khoản nhân viên!' });
            }

            // Tự động tạo mã nhân viên duy nhất (NV001, NV002, ...)
            const lastStaff = await User.findOne({ role: 'staff' }).sort({ staffId: -1 });
            let lastIdNum = 0;
            if (lastStaff && lastStaff.staffId) {
                lastIdNum = parseInt(lastStaff.staffId.replace('NV', ''));
            }
            staffId = `NV${String(lastIdNum + 1).padStart(3, '0')}`;
        }

        const newUser = new User({
            fullName,
            email,
            phone,
            password,
            role,
            staffId
        });

        await newUser.save();
        res.status(201).json({ message: 'Tạo tài khoản thành công!', user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi tạo người dùng' });
    }
});

// 3. Cập nhật người dùng
router.put('/update/:id', async (req, res) => {
    try {
        const { fullName, email, phone, role, password } = req.body;

        // Kiểm tra định dạng số điện thoại Việt Nam
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (phone && !phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Số điện thoại không đúng định dạng Việt Nam!' });
        }

        // Kiểm tra định dạng email
        if (email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Địa chỉ email không đúng định dạng hoặc tên miền không hỗ trợ.' });
            }
        }

        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra số điện thoại bị trùng với người khác
        if (phone && phone !== user.phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) {
                return res.status(400).json({ message: 'Số điện thoại này đã được sử dụng bởi tài khoản khác!' });
            }
        }

        // Nếu chuyển từ role khác sang staff, kiểm tra giới hạn
        if (role === 'staff' && user.role !== 'staff') {
            const staffCount = await User.countDocuments({ role: 'staff' });
            if (staffCount >= 10) {
                return res.status(400).json({ message: 'Hệ thống đã đạt giới hạn tối đa 10 tài khoản nhân viên!' });
            }
            
            // Tạo staffId mới nếu chưa có
            if (!user.staffId) {
                const lastStaff = await User.findOne({ role: 'staff' }).sort({ staffId: -1 });
                let lastIdNum = 0;
                if (lastStaff && lastStaff.staffId) {
                    lastIdNum = parseInt(lastStaff.staffId.replace('NV', ''));
                }
                user.staffId = `NV${String(lastIdNum + 1).padStart(3, '0')}`;
            }
        } 
        // Nếu chuyển từ staff sang role khác, xóa staffId
        else if (role !== 'staff' && user.role === 'staff') {
            user.staffId = undefined;
        }

        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.phone = phone || user.phone;
        user.role = role || user.role;
        
        if (password) {
            user.password = password; // Sẽ được hash bởi pre-save hook
        }

        await user.save();
        res.json({ message: 'Cập nhật tài khoản thành công!', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server khi cập nhật người dùng' });
    }
});

// 4. Xóa người dùng
router.delete('/delete/:id', async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Không cho phép xóa tài khoản admin
        if (userToDelete.role === 'admin') {
            return res.status(403).json({ message: 'Không thể xóa tài khoản Quản trị viên!' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Xóa tài khoản thành công!' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xóa người dùng' });
    }
});

// 5. Lấy thông tin cá nhân (Profile)
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6. Cập nhật thông tin cá nhân
router.put('/profile/:id', async (req, res) => {
    try {
        const { fullName, intro, location, birthDate, gender, education, skills, password } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        if (fullName !== undefined) user.fullName = fullName;
        if (intro !== undefined) user.intro = intro;
        if (location !== undefined) user.location = location;
        if (birthDate !== undefined) user.birthDate = birthDate;
        if (gender !== undefined) user.gender = gender;
        if (education) user.education = education;
        if (skills) user.skills = skills;
        
        if (password) {
            user.password = password; // Sẽ được hash bởi pre-save hook
        }

        await user.save();
        res.json({ message: 'Cập nhật thông tin thành công!', user });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// 6a. Thêm địa chỉ mới
router.post('/addresses/:id', async (req, res) => {
    try {
        const { label, fullName, phone, province, district, ward, detail, isDefault } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Nếu đặt làm mặc định, bỏ mặc định của địa chỉ khác
        if (isDefault) {
            user.addresses.forEach(addr => addr.isDefault = false);
        }
        // Nếu chưa có địa chỉ nào, tự động đặt làm mặc định
        const shouldBeDefault = isDefault || user.addresses.length === 0;

        user.addresses.push({ label, fullName, phone, province, district, ward, detail, isDefault: shouldBeDefault });
        await user.save();
        res.json({ message: 'Thêm địa chỉ thành công!', addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi thêm địa chỉ' });
    }
});

// 6b. Cập nhật địa chỉ
router.put('/addresses/:id/:addressId', async (req, res) => {
    try {
        const { label, fullName, phone, province, district, ward, detail, isDefault } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const addr = user.addresses.id(req.params.addressId);
        if (!addr) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

        if (isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }

        addr.label = label || addr.label;
        addr.fullName = fullName || addr.fullName;
        addr.phone = phone || addr.phone;
        addr.province = province || addr.province;
        addr.district = district || addr.district;
        addr.ward = ward || addr.ward;
        addr.detail = detail || addr.detail;
        if (isDefault !== undefined) addr.isDefault = isDefault;

        await user.save();
        res.json({ message: 'Cập nhật địa chỉ thành công!', addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật địa chỉ' });
    }
});

// 6c. Xoá địa chỉ
router.delete('/addresses/:id/:addressId', async (req, res) => {
    try {

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const addrIndex = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);
        if (addrIndex === -1) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

        const wasDefault = user.addresses[addrIndex].isDefault;
        user.addresses.splice(addrIndex, 1);

        // Nếu địa chỉ xoá là mặc định, tự động set địa chỉ đầu tiên làm mặc định
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json({ message: 'Xoá địa chỉ thành công!', addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi xoá địa chỉ' });
    }
});

// 6d. Đặt địa chỉ mặc định
router.patch('/addresses/:id/:addressId/default', async (req, res) => {
    try {

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.addressId; });
        await user.save();
        res.json({ message: 'Đã đặt địa chỉ mặc định!', addresses: user.addresses });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi đặt địa chỉ mặc định' });
    }
});

// 7. Upload Avatar
router.post('/upload-avatar/:id', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Không có file nào được tải lên' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const avatarUrl = req.file.path; // Cloudinary URL
        user.avatar = avatarUrl;
        await user.save();

        res.json({ message: 'Cập nhật ảnh đại diện thành công!', avatarUrl });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi upload ảnh' });
    }
});

// 8. Lấy danh sách Wishlist
router.get('/wishlist/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('wishlist');
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        res.json(user.wishlist);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi lấy wishlist' });
    }
});

// 9. Bật/Tắt Wishlist
router.post('/wishlist/toggle', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        const index = user.wishlist.indexOf(productId);
        if (index > -1) {
            user.wishlist.splice(index, 1); // Xóa khỏi wishlist
        } else {
            user.wishlist.push(productId); // Thêm vào wishlist
        }

        await user.save();
        res.json({ message: 'Cập nhật wishlist thành công', wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật wishlist' });
    }
});

module.exports = router;

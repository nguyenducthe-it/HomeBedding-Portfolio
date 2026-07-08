const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'staff', 'admin'],
        default: 'customer'
    },
    staffId: {
        type: String,
        unique: true,
        sparse: true // Cho phép null cho khách hàng nhưng unique cho nhân viên
    },
    baseSalary: {
        type: Number,
        default: 500000
    },
    // Các trường dùng cho Trang Cá Nhân (Profile)
    avatar: { type: String, default: '' },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    birthDate: { type: String, default: '' },
    location: { type: String, default: '' },
    addresses: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        label: { type: String, default: 'Nhà' },        // VD: "Nhà", "Văn phòng"
        fullName: { type: String, default: '' },
        phone: { type: String, default: '' },
        province: { type: String, default: '' },
        district: { type: String, default: '' },
        ward: { type: String, default: '' },
        detail: { type: String, default: '' },
        isDefault: { type: Boolean, default: false }
    }],
    intro: { type: String, default: '' },
    education: {
        university: { type: String, default: '' },
        years: { type: String, default: '' },
        major: { type: String, default: '' },
        grade: { type: String, default: '' }
    },
    skills: { type: [String], default: [] },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Phương thức kiểm tra mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

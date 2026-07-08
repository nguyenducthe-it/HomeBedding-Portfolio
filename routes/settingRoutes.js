const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadBanner } = require('../utils/cloudinaryUpload');

// Models
const Setting = require('../models/Setting');
const Attendance = require('../models/Attendance');
const Cart = require('../models/Cart');
const Complaint = require('../models/Complaint');
const Consultation = require('../models/Consultation');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Promotion = require('../models/Promotion');
const Review = require('../models/Review');
const ShiftRequest = require('../models/ShiftRequest');
const StaffChat = require('../models/StaffChat');
const StaffFeedback = require('../models/StaffFeedback');
const User = require('../models/User');
const WeekConfig = require('../models/WeekConfig');

// Setup Multer for JSON file upload
const upload = multer({ 
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file JSON'));
        }
    }
});

const MODELS = {
    Attendance, Cart, Complaint, Consultation, Order, Product, 
    Promotion, Review, Setting, ShiftRequest, StaffChat, 
    StaffFeedback, User, WeekConfig
};

// ==========================================
// 1. SPECIFIC ROUTES (Định nghĩa trước để tránh lỗi đè route)
// ==========================================

// Upload banner dùng Cloudinary
const uploadBannerMiddleware = uploadBanner;

const bannerUploadFields = uploadBanner.fields([
    { name: 'banner1', maxCount: 1 },
    { name: 'banner2', maxCount: 1 },
    { name: 'banner3', maxCount: 1 },
    { name: 'banner4', maxCount: 1 },
    { name: 'banner5', maxCount: 1 }
]);

// POST: Tải lên các ảnh banner theo màu nền
router.post('/upload-banners', (req, res, next) => {
    bannerUploadFields(req, res, (err) => {
        if (err) {
            console.error('Multer upload error:', err);
            return res.status(400).json({ message: 'Lỗi tải ảnh lên: ' + err.message });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { themeColor } = req.body;
        if (!themeColor) {
            return res.status(400).json({ message: 'Thiếu thông tin màu nền (themeColor)' });
        }

        // Tìm hoặc khởi tạo cài đặt banner_images
        let setting = await Setting.findOne({ key: 'banner_images' });
        let bannerMap = setting ? setting.value : {};
        if (typeof bannerMap !== 'object' || bannerMap === null) {
            bannerMap = {};
        }

        if (!bannerMap[themeColor]) {
            bannerMap[themeColor] = [null, null, null, null, null];
        }

        // Lưu thông tin ảnh đã tải lên
        for (let i = 1; i <= 5; i++) {
            const field = `banner${i}`;
            if (req.files && req.files[field] && req.files[field][0]) {
                bannerMap[themeColor][i - 1] = req.files[field][0].path; // Cloudinary URL
            }
        }

        setting = await Setting.findOneAndUpdate(
            { key: 'banner_images' },
            { value: bannerMap, updatedAt: new Date() },
            { new: true, upsert: true }
        );

        res.json({ message: 'Tải lên ảnh banner thành công!', banner_images: bannerMap });
    } catch (err) {
        console.error('Lỗi upload banner:', err);
        res.status(500).json({ message: 'Lỗi máy chủ khi tải ảnh banner lên: ' + err.message });
    }
});

// GET: Tải file backup JSON
router.get('/data/backup', async (req, res) => {
    try {
        const exportData = {};
        for (const [modelName, Model] of Object.entries(MODELS)) {
            exportData[modelName] = await Model.find({});
        }

        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `homebedding_backup_${dateStr}.json`;
        const filepath = path.join(__dirname, '..', 'uploads', filename);

        // Viết ra file tạm
        fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

        // Cập nhật Setting lastBackupAt
        await Setting.findOneAndUpdate(
            { key: 'lastBackupAt' },
            { value: new Date().toISOString(), updatedAt: new Date() },
            { upsert: true }
        );

        res.download(filepath, filename, (err) => {
            if (err) console.error(err);
            // Xóa file sau khi gửi thành công
            fs.unlinkSync(filepath);
        });

    } catch (err) {
        console.error('Lỗi backup:', err);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST: Restore từ file JSON
router.post('/data/restore', upload.single('backupFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Vui lòng chọn file backup JSON' });
        }

        const fileContent = req.file.buffer.toString('utf-8');
        let importData;
        try {
            importData = JSON.parse(fileContent);
        } catch (e) {
            return res.status(400).json({ message: 'File JSON không hợp lệ' });
        }

        // Drop all data & insert new
        for (const [modelName, Model] of Object.entries(MODELS)) {
            if (importData[modelName] && Array.isArray(importData[modelName])) {
                await Model.deleteMany({});
                if (importData[modelName].length > 0) {
                    await Model.insertMany(importData[modelName]);
                }
            }
        }

        res.json({ message: 'Khôi phục dữ liệu thành công' });
    } catch (err) {
        console.error('Lỗi restore:', err);
        res.status(500).json({ message: 'Lỗi khi khôi phục dữ liệu: ' + err.message });
    }
});

// ==========================================
// 2. GENERIC KEY-VALUE ROUTES (Định nghĩa ở cuối cùng)
// ==========================================

// GET: Lấy cấu hình theo key
router.get('/:key', async (req, res) => {
    try {
        if (req.params.key === 'backup' || req.params.key === 'restore') return;
        const setting = await Setting.findOne({ key: req.params.key });
        if (!setting) {
            return res.json({ value: null });
        }
        res.json({ value: setting.value });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// POST: Cập nhật cấu hình theo key
router.post('/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const setting = await Setting.findOneAndUpdate(
            { key: req.params.key },
            { value, updatedAt: new Date() },
            { new: true, upsert: true }
        );
        res.json({ message: 'Đã cập nhật', setting });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;

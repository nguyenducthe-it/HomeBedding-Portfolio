const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo cấu hình lưu trữ local thay cho Cloudinary đang bị lỗi Secret
const createLocalUpload = (folder) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadPath = path.join(__dirname, '../uploads');
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({ storage: storage });

    // Hàm bọc để chuyển đổi req.file.path thành URL tương tự Cloudinary
    const patchPath = (req) => {
        if (req.file) {
            req.file.path = '/uploads/' + req.file.filename;
        }
        if (req.files) {
            if (Array.isArray(req.files)) {
                req.files.forEach(f => f.path = '/uploads/' + f.filename);
            } else {
                Object.values(req.files).forEach(arr => {
                    arr.forEach(f => f.path = '/uploads/' + f.filename);
                });
            }
        }
    };

    return {
        single: (fieldName) => (req, res, next) => {
            upload.single(fieldName)(req, res, (err) => {
                if (err) return next(err);
                patchPath(req);
                next();
            });
        },
        array: (fieldName, maxCount) => (req, res, next) => {
            upload.array(fieldName, maxCount)(req, res, (err) => {
                if (err) return next(err);
                patchPath(req);
                next();
            });
        },
        fields: (fields) => (req, res, next) => {
            upload.fields(fields)(req, res, (err) => {
                if (err) return next(err);
                patchPath(req);
                next();
            });
        }
    };
};

const uploadAvatar    = createLocalUpload('avatars');
const uploadProduct   = createLocalUpload('products');
const uploadReview    = createLocalUpload('reviews');
const uploadBanner    = createLocalUpload('banners');
const uploadChat      = createLocalUpload('chats');
const uploadConsult   = createLocalUpload('consultations');

module.exports = {
    // Không dùng cloudinary nữa, nhưng vẫn export để không vỡ cấu trúc
    cloudinary: {}, 
    uploadAvatar,
    uploadProduct,
    uploadReview,
    uploadBanner,
    uploadChat,
    uploadConsult,
};

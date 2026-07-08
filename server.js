require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Phục vụ các file tĩnh trong thư mục public và public/pages
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public', 'pages')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Kết nối MongoDB
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/homebedding';

mongoose.connect(MONGO_URI)
.then(() => {
    console.log('✅ Connected to MongoDB successfully!');
    const initCronJobs = require('./utils/cronJobs');
    initCronJobs();
    
    // Bắt đầu chạy server sau khi kết nối DB thành công
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err.message);
});

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const promotionRoutes = require('./routes/promotionRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const orderRoutes = require('./routes/orderRoutes');
const settingRoutes = require('./routes/settingRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const cartRoutes = require('./routes/cartRoutes');
const staffFeedbackRoutes = require('./routes/staffFeedbackRoutes');
const staffChatRoutes = require('./routes/staffChatRoutes');
const supportRequestRoutes = require('./routes/supportRequestRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/staff-feedback', staffFeedbackRoutes);
app.use('/api/staff-chat', staffChatRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/support-requests', supportRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/payment', paymentRoutes);

// API test cơ bản
app.get('/api/status', (req, res) => {
    res.json({ status: 'OK', message: 'Backend is running' });
});

// Xử lý các route không tồn tại bằng cách trả về index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', require('util').inspect(err, {depth: null}));
    res.status(500).json({ message: 'Internal Server Error' });
});

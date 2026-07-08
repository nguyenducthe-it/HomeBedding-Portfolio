require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Product = require('./models/Product');

const categories = [
    { 
        prefix: 'muaxuan', name: 'mùa xuân', label: 'Mùa Xuân', 
        basePriceMin: 600000, basePriceMax: 1200000,
        names: ['Bộ chăn ga gối mùa xuân mềm mại', 'Chăn đắp nhẹ mùa xuân', 'Ga trải giường mùa xuân tinh tế', 'Bộ chăn ga lụa mùa xuân', 'Chăn xuân thu cao cấp']
    },
    { 
        prefix: 'muahe', name: 'mùa hạ', label: 'Mùa Hè', 
        basePriceMin: 400000, basePriceMax: 900000,
        names: ['Bộ chăn ga gối mùa hè thoáng mát', 'Chăn hè lanh mát lạnh', 'Chiếu điều hòa mùa hè', 'Ga giường mùa hè sợi tre', 'Chăn hè thu mỏng nhẹ']
    },
    { 
        prefix: 'muathu', name: 'mùa thu', label: 'Mùa Thu', 
        basePriceMin: 700000, basePriceMax: 1300000,
        names: ['Bộ chăn ga gối mùa thu lãng mạn', 'Chăn thu đông chần gòn', 'Bộ ga gối mùa thu họa tiết', 'Chăn đắp mùa thu ấm áp', 'Ga giường cotton mùa thu']
    },
    { 
        prefix: 'muadong', name: 'mùa đông', label: 'Mùa Đông', 
        basePriceMin: 1200000, basePriceMax: 2800000,
        names: ['Bộ chăn ga gối nỉ nhung mùa đông', 'Chăn bông siêu ấm mùa đông', 'Bộ chăn ga gối lông cừu mùa đông', 'Ruột chăn bông dày dặn mùa đông', 'Bộ ga giường nỉ tuyết mùa đông']
    },
    { 
        prefix: '4mua', name: '4 mùa', label: '4 Mùa', 
        basePriceMin: 900000, basePriceMax: 1800000,
        names: ['Bộ chăn ga gối 4 mùa cao cấp', 'Chăn chần gòn 4 mùa đa năng', 'Bộ ga gối lụa tencel 4 mùa', 'Chăn đa năng sử dụng 4 mùa', 'Bộ ga giường cotton 4 mùa']
    }
];

const seedFolder = path.join(__dirname, 'public', 'img');

async function seedProducts() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Đã kết nối MongoDB');

        if (!fs.existsSync(seedFolder)) {
            console.log(`Thư mục không tồn tại: ${seedFolder}`);
            process.exit(1);
        }

        const files = fs.readdirSync(seedFolder);
        if (files.length === 0) {
            console.log(`Thư mục ${seedFolder} đang trống.`);
            process.exit(1);
        }

        let addedCount = 0;

        for (const cat of categories) {
            for (let i = 1; i <= 10; i++) {
                const baseName = `${cat.prefix}${i}`;
                const file = files.find(f => {
                    const ext = path.extname(f).toLowerCase();
                    const nameWithoutExt = path.basename(f, ext);
                    return nameWithoutExt === baseName && ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
                });

                if (file) {
                    console.log(`Đang xử lý ảnh: ${file} ...`);
                    try {
                        // Bỏ qua Cloudinary, sử dụng luôn đường dẫn local
                        const imageUrl = `/img/${file}`;

                        // Lựa chọn ngẫu nhiên 1 tên trong mảng
                        const randomNameIndex = Math.floor(Math.random() * cat.names.length);
                        let productName = `${cat.names[randomNameIndex]} - Mẫu ${i}`;
                        
                        // Xác định giá tiền
                        let price = cat.basePriceMin + Math.floor(Math.random() * (cat.basePriceMax - cat.basePriceMin));
                        
                        // Nếu tên chứa "Bộ chăn ga gối" -> Đắt hơn các sản phẩm lẻ
                        const isSet = productName.toLowerCase().includes('bộ');
                        if (isSet) {
                            price = price + 500000;
                        }

                        // Làm tròn giá tiền đến hàng nghìn
                        price = Math.round(price / 1000) * 1000;

                        const quantity = 20 + Math.floor(Math.random() * 80);

                        // Tạo mô tả
                        let desc = `Sản phẩm ${productName} mang đến trải nghiệm tuyệt vời cho không gian ngủ của bạn. `;
                        desc += `Thiết kế chuẩn dành riêng cho ${cat.label}, sử dụng chất liệu vải cao cấp, an toàn tuyệt đối cho làn da. `;
                        if (isSet) {
                            desc += `Sản phẩm là một bộ hoàn chỉnh bao gồm chăn, ga và vỏ gối, thiết kế đồng bộ và sang trọng. `;
                        } else {
                            desc += `Sản phẩm lẻ dễ dàng phối hợp với các đồ dùng nội thất khác trong phòng ngủ. `;
                        }
                        if (cat.prefix === 'muadong') {
                            desc += `Đặc biệt, lớp vải dày dặn và giữ nhiệt cực tốt, giúp bạn vượt qua những đêm đông lạnh giá một cách ấm áp nhất.`;
                        } else if (cat.prefix === 'muahe') {
                            desc += `Chất liệu thấm hút mồ hôi, bề mặt siêu mát mẻ, xua tan cái nóng bức của ngày hè.`;
                        }

                        const newProduct = new Product({
                            name: productName,
                            category: cat.name,
                            price: price,
                            quantity: quantity,
                            images: [imageUrl],
                            description: desc,
                        });

                        await newProduct.save();
                        console.log(`=> Đã tạo: ${newProduct.name} - Giá: ${price.toLocaleString('vi-VN')}đ`);
                        addedCount++;
                    } catch (err) {
                        console.error(`=> Lỗi khi tạo SP ${baseName}:`, err.message);
                    }
                } else {
                    console.log(`(Không tìm thấy ảnh cho: ${baseName})`);
                }
            }
        }

        console.log(`\nHoàn tất! Đã thêm thành công ${addedCount} sản phẩm.`);
        process.exit(0);

    } catch (err) {
        console.error('Lỗi tổng thể:', err);
        process.exit(1);
    }
}

seedProducts();

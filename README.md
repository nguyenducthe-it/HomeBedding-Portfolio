# HomeBedding - Premium Bedding Store

HomeBedding là một ứng dụng web thương mại điện tử hiện đại, chuyên cung cấp các sản phẩm chăn, ga, gối cao cấp. Dự án được thiết kế nhằm mang lại trải nghiệm mua sắm mượt mà cho khách hàng và cung cấp hệ thống quản trị (Admin/Staff) toàn diện để quản lý sản phẩm, đơn hàng, ca làm việc của nhân viên và các phản hồi từ khách hàng.

## Tính năng nổi bật
- **Giao diện người dùng hiện đại:** Hỗ trợ đa ngôn ngữ (Tiếng Việt/Tiếng Anh), giao diện chia ô sang trọng cho trang đăng ký/đăng nhập, và thay đổi banner động theo màu nền mùa/tông màu được thiết lập từ Admin.
- **Quản lý giỏ hàng & tồn kho thông minh:** Hệ thống tự động làm mờ các sản phẩm hết hàng, sắp xếp đưa xuống dưới cùng, và kiểm tra giới hạn số lượng tồn kho thực tế cả ở phía Client lẫn Server.
- **Hệ thống Quản lý Phân quyền:** Phân quyền rõ ràng giữa Khách hàng (Customer), Nhân viên (Staff), và Quản trị viên (Admin).
- **Hỗ trợ khách hàng:** Tích hợp tính năng chat giữa nhân viên và quản trị viên, gửi khiếu nại, và tư vấn trực tuyến.

## Công nghệ sử dụng
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (sử dụng Mongoose ORM)
- **Frontend:** HTML5, CSS3 (Vanilla CSS), Javascript (ES6)
- **Quản lý file:** Multer (Lưu trữ ảnh tải lên tại local)
- **Các thư viện bổ trợ:** bcryptjs (mã hóa mật khẩu), jsonwebtoken (xác thực token), node-cron (tác vụ tự động)

## Hướng dẫn cài đặt và chạy local

### Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (khuyến nghị phiên bản LTS).
- Đã cài đặt [MongoDB](https://www.mongodb.com/try/download/community) và đang chạy dịch vụ cơ sở dữ liệu trên máy tính.

### Các bước cài đặt

1. **Tải mã nguồn về máy:**
   ```bash
   git clone https://github.com/nguyenducthe-it/HomeBedding-Portfolio.git
   cd HomeBedding-Portfolio
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies):**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường:**
   Tạo một file `.env` ở thư mục gốc của dự án và điền các thông tin sau:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/homebedding_new
   JWT_SECRET=HomeBedding_Secret_Key_2024
   ```

4. **Khởi chạy ứng dụng:**
   Chạy lệnh sau để khởi động server:
   ```bash
   npm start
   ```
   Sau khi khởi động thành công, bạn sẽ thấy thông báo:
   ```text
   ✅ Connected to MongoDB successfully!
   🚀 Server is running on http://localhost:3000
   ```

5. **Truy cập ứng dụng:**
   Mở trình duyệt và truy cập: [http://localhost:3000](http://localhost:3000)

## Hình ảnh minh họa dự án (Screenshots)

*Dưới đây là một số hình ảnh thực tế của ứng dụng:*

### 1. Trang chủ cửa hàng
<!-- Bỏ ảnh chụp màn hình vào đây -->
*(Chưa có hình ảnh)*

### 2. Giao diện Đăng Nhập / Đăng Ký chia ô
<!-- Bỏ ảnh chụp màn hình vào đây -->
*(Chưa có hình ảnh)*

### 3. Trang Quản trị (Admin Dashboard)
<!-- Bỏ ảnh chụp màn hình vào đây -->
*(Chưa có hình ảnh)*

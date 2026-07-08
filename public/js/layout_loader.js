(function () {
    // Xác định xem trang hiện tại có phải trang chủ (index.html) không
    const isIndexPage = window.location.pathname.endsWith('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname === '/pages/' ||
        window.location.pathname.endsWith('/');

    const homePrefix = isIndexPage ? '' : 'index.html';

    const headerHTML = `
    <!-- TOP PROMOTION BAR -->
    <div class="top-bar">
        <div class="top-bar-container">
            <div class="top-bar-left">
                <i class="fa-solid fa-truck-fast"></i> <span data-translate="free_shipping">Miễn phí giao hàng đơn từ 0đ trên toàn quốc</span>
            </div>
            <div class="top-bar-right">
                <a href="#" onclick="openModal('customerCareModal'); event.preventDefault();"><i class="fa-regular fa-comments"></i> <span data-translate="customer_care">Chăm sóc khách hàng</span></a>
                <a href="#" onclick="openModal('storeFinderModal'); event.preventDefault();"><i class="fa-solid fa-map-pin"></i> <span data-translate="store_finder">Tìm cửa hàng</span></a>
                <span class="lang-selector">
                    <a href="#" id="lang-vn-btn" onclick="changeLanguage('vi', event)" style="color: inherit; text-decoration: none;">VN</a> | 
                    <a href="#" id="lang-en-btn" onclick="changeLanguage('en', event)" style="color: inherit; text-decoration: none;">EN</a>
                </span>
                <div class="top-bar-actions">
                    <a href="#" onclick="openModal('loginModal')" title="Yêu thích"><i class="fa-regular fa-heart"></i></a>
                    <a href="#" onclick="openModal('loginModal')" title="Tài khoản"><i class="fa-regular fa-user"></i></a>
                    <a href="#" onclick="openModal('loginModal')" title="Giỏ hàng" class="cart-icon-wrapper">
                        <i class="fa-solid fa-bag-shopping"></i>
                        <span class="cart-badge">0</span>
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- HEADER / NAVIGATION -->
    <header class="main-header">
        <div class="header-container">
            <div class="logo-area">
                <a href="${homePrefix}#" class="logo-link">
                    <img src="../images/logo.png" alt="Home Bedding Logo" class="brand-logo" onerror="this.src='../images/1.png';">
                </a>
            </div>

            <nav class="main-nav">
                <ul>
                    <li><a href="${homePrefix}#" class="nav-link" data-translate="nav_home">TRANG CHỦ</a></li>
                    <li><a href="${homePrefix}#section-about" class="nav-link" data-translate="nav_about">GIỚI THIỆU</a></li>
                    <li><a href="${homePrefix}#section-products" class="nav-link" data-translate="nav_products">SẢN PHẨM NỔI BẬT</a></li>
                    <li><a href="${homePrefix}#section-promotions" class="nav-link" data-translate="nav_promotions">KHUYẾN MÃI</a></li>
                    <li><a href="${homePrefix}#section-blog" class="nav-link" data-translate="nav_blog">BLOG</a></li>
                    <li><a href="#" onclick="${isIndexPage ? "openModal('revenueModal'); loadRevenueChart();" : "window.location.href='index.html?show=revenue';"}" class="nav-link" data-translate="nav_revenue">DOANH THU</a></li>
                </ul>
            </nav>

            <div class="header-search">
                <form class="search-form" onsubmit="handleHeaderSearch(event)">
                    <input type="text" placeholder="Tìm kiếm sản phẩm..." class="search-input" id="headerSearchInput" data-translate-placeholder="search_placeholder">
                    <button type="submit" class="search-btn"><i class="fa-solid fa-magnifying-glass"></i></button>
                </form>
            </div>
        </div>
    </header>
    `;

    const footerHTML = `
    <footer class="site-footer" id="section-contact">
        <div class="footer-container">
            <div class="footer-column">
                <h3 data-translate="footer_about">Về Chúng Tôi</h3>
                <ul>
                    <li><a href="gioi-thieu.html" data-translate="link_about">Giới thiệu</a></li>
                    <li><a href="he-thong-cua-hang.html" data-translate="link_stores">Hệ thống cửa hàng</a></li>
                    <li><a href="tuyen-dung.html" data-translate="link_careers">Tuyển dụng</a></li>
                    <li><a href="tin-tuc.html" data-translate="link_news">Tin tức</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3 data-translate="footer_support">Hỗ Trợ Khách Hàng</h3>
                <ul>
                    <li><a href="huong-dan-mua-hang.html" data-translate="link_buy_guide">Hướng dẫn mua hàng</a></li>
                    <li><a href="chinh-sach-van-chuyen.html" data-translate="link_shipping">Chính sách vận chuyển</a></li>
                    <li><a href="chinh-sach-doi-tra.html" data-translate="link_return">Chính sách đổi trả</a></li>
                    <li><a href="cau-hoi-thuong-gap.html" data-translate="link_faq">Câu hỏi thường gặp</a></li>
                </ul>
            </div>
            <div class="footer-column">
                <h3 data-translate="footer_policies">Chính Sách</h3>
                <ul>
                    <li><a href="chinh-sach-bao-mat.html" data-translate="link_privacy">Chính sách bảo mật</a></li>
                    <li><a href="dieu-khoan-su-dung.html" data-translate="link_terms">Điều khoản sử dụng</a></li>
                    <li><a href="chinh-sach-bao-hanh.html" data-translate="link_warranty">Chính sách bảo hành</a></li>
                </ul>
            </div>
            <div class="footer-column align-left">
                <h3 data-translate="footer_contact">Liên Hệ</h3>
                <p><i class="fa-solid fa-phone"></i> <span><span data-translate="hotline">Hotline</span>: 0866 853 758</span></p>
                <p><i class="fa-regular fa-envelope"></i> <span><span data-translate="email">Email</span>: camtu5678999@gmail.com</span></p>
                <p><i class="fa-solid fa-globe"></i> <span><span data-translate="web">Web</span>: www.homebedding.vn</span></p>
                <div class="social-icons">
                    <a href="https://www.facebook.com/share/1D1cgJZAKu/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-facebook"></i></a>
                    <a href="https://www.instagram.com/_duc.the_?igsh=d2F0bmlyY3Y1enVk&utm_source=qr" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#"><i class="fa-brands fa-youtube"></i></a>
                    <a href="https://www.tiktok.com/@_duc.the_?_r=1&_t=ZS-97STS6ZUs0z" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-tiktok"></i></a>
                </div>
            </div>
            <div class="footer-column footer-payment">
                <h3 data-translate="footer_payment">Phương Thức Thanh Toán</h3>
                <div class="payment-grid">
                    <span class="payment-badge"><i class="fa-brands fa-cc-visa"></i> VISA</span>
                    <span class="payment-badge"><i class="fa-brands fa-cc-mastercard"></i> MC</span>
                    <span class="payment-badge"><i class="fa-brands fa-cc-jcb"></i> JCB</span>
                    <span class="payment-badge"><i class="fa-solid fa-credit-card"></i> NAPAS</span>
                    <span class="payment-badge"><i class="fa-solid fa-wallet"></i> MOMO</span>
                    <span class="payment-badge"><i class="fa-solid fa-money-bill-transfer"></i> ZALOPAY</span>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 Home Bedding. All rights reserved.</p>
        </div>
    </footer>
    `;

    const modalsHTML = `
    <!-- Modal Đăng Ký -->
    <div id="signupModal" class="modal">
        <div class="modal-content modal-split-layout">
            <div class="modal-left-banner" style="background-image: var(--banner-img-5);">
                <div class="banner-overlay">
                    <div class="banner-logo">
                        <span class="banner-logo-title">HomeBedding</span>
                        <span class="banner-logo-subtitle">PREMIUM BEDDING</span>
                    </div>
                    <div class="banner-text-group">
                        <div class="banner-tag">HOME BEDDING</div>
                        <h1 class="banner-main-title">LÀM MỚI PHÒNG NGỦ VỚI CHĂN GA GỐI</h1>
                        <p class="banner-sub-text">Biến đổi không gian sống của bạn trong tích tắc với các chất liệu tự nhiên cao cấp và mềm mại vượt trội.</p>
                    </div>
                </div>
            </div>
            <div class="modal-right-form">
                <span class="close-btn" onclick="closeModal('signupModal')">&times;</span>
                <h2 class="form-title">Đăng Ký Tài Khoản</h2>
                <form id="signupForm">
                    <div class="form-group">
                        <label>Họ và Tên</label>
                        <div class="input-wrapper">
                            <i class="fa-regular fa-user input-icon"></i>
                            <input type="text" id="signupFullName" placeholder="Nhập họ và tên của bạn" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <div class="input-wrapper">
                            <i class="fa-regular fa-envelope input-icon"></i>
                            <input type="email" id="signupEmail" placeholder="Nhập email của bạn" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Số Điện Thoại</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-phone input-icon"></i>
                            <input type="tel" id="signupPhone" placeholder="Nhập số điện thoại của bạn" required>
                        </div>
                    </div>
                    <div class="form-group password-group">
                        <label>Mật Khẩu</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-lock input-icon"></i>
                            <input type="password" id="signupPassword" placeholder="Nhập mật khẩu của bạn" required style="padding-right: 40px;">
                            <i class="fa-regular fa-eye toggle-password" onclick="togglePassword('signupPassword', this)"></i>
                        </div>
                        <small style="color: #888; font-size: 11px; margin-top: 5px; display: block; line-height: 1.3;">
                            * Ít nhất 8 ký tự, 1 chữ hoa, 1 số, 1 ký tự đặc biệt
                        </small>
                    </div>
                    <button type="submit" class="submit-btn" style="margin-top: 15px;">Đăng Ký Ngay</button>
                </form>
                <div class="form-switch-prompt" style="text-align: center; margin-top: 20px; font-size: 13px; color: #666;">
                    Đã có tài khoản? <a href="#" onclick="closeModal('signupModal'); openModal('loginModal');"
                        style="color: var(--primary-olive); font-weight: bold; text-decoration: none;">Đăng nhập ngay</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Đăng Nhập -->
    <div id="loginModal" class="modal">
        <div class="modal-content modal-split-layout">
            <div class="modal-left-banner" style="background-image: var(--banner-img-5);">
                <div class="banner-overlay">
                    <div class="banner-logo">
                        <span class="banner-logo-title">HomeBedding</span>
                        <span class="banner-logo-subtitle">PREMIUM BEDDING</span>
                    </div>
                    <div class="banner-text-group">
                        <div class="banner-tag">Không cần người ấy nhắc</div>
                        <h1 class="banner-main-title">Ngủ ngoannn mơ đẹp cùng HomeBedding ngay</h1>
                    </div>
                </div>
            </div>
            <div class="modal-right-form">
                <span class="close-btn" onclick="closeModal('loginModal')">&times;</span>
                <h2 class="form-title">Đăng Nhập</h2>
                <form id="loginForm">
                    <div class="form-group">
                        <label>Email hoặc Tên đăng nhập</label>
                        <div class="input-wrapper">
                            <i class="fa-regular fa-envelope input-icon"></i>
                            <input type="text" id="loginEmail" placeholder="Nhập email hoặc tên của bạn"
                                onblur="detectUserRole(this.value)">
                        </div>
                        <div id="roleIndicator" style="margin-top: 5px; font-size: 12px; font-weight: bold; display: none;">
                            Vai trò: <span id="detectedRoleText" style="color: var(--primary-olive);">...</span>
                        </div>
                    </div>
                    <div class="form-group password-group">
                        <label>Mật Khẩu</label>
                        <div class="input-wrapper">
                            <i class="fa-solid fa-lock input-icon"></i>
                            <input type="password" id="loginPassword" placeholder="Nhập mật khẩu của bạn" style="padding-right: 40px;">
                            <i class="fa-regular fa-eye toggle-password" onclick="togglePassword('loginPassword', this)"></i>
                        </div>
                    </div>
                    <button type="submit" class="submit-btn" style="margin-top: 20px;">Đăng Nhập</button>
                </form>
                <div class="form-switch-prompt" style="text-align: center; margin-top: 25px; font-size: 13px; color: #666;">
                    Chưa có tài khoản? <a href="#" onclick="closeModal('loginModal'); openModal('signupModal');"
                        style="color: var(--primary-olive); font-weight: bold; text-decoration: none;">Đăng ký ngay</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Doanh Thu -->
    <div id="revenueModal" class="modal">
        <div class="modal-content" style="max-width: 850px; width: 95%;">
            <span class="close-btn" onclick="closeModal('revenueModal')">&times;</span>
            <h2 style="font-family: var(--font-serif); margin-bottom: 10px; color: #3E4B37; text-align: center;">
                <span class="lang-vi">Doanh Thu Hệ Thống (Dữ liệu Admin)</span>
                <span class="lang-en">System Revenue (Admin Data)</span>
            </h2>
            <p style="font-size: 14px; color: #6E685E; text-align: center; margin-bottom: 20px;">
                <span class="lang-vi">Biểu đồ xu hướng tài chính hàng ngày: Doanh thu đơn hàng vs Chi phí lương nhân viên.</span>
                <span class="lang-en">Daily financial trend chart: Order Revenue vs Staff Salary Costs.</span>
            </p>

            <!-- Bộ lọc doanh thu -->
            <div style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
                <select id="landingRevenueFilterType" onchange="toggleLandingRevenueFilters()"
                    style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none; background: white; cursor: pointer;">
                    <option value="month">Lọc theo tháng</option>
                    <option value="date">Lọc theo khoảng ngày</option>
                    <option value="quarter">Lọc theo quý</option>
                </select>
                
                <input type="month" id="landingRevenueMonthPicker" onchange="loadRevenueChart()"
                    style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; outline: none; font-family: var(--font-main); font-size: 14px;">
                    
                <div id="landingRevenueDatePickerWrapper" style="display: none; align-items: center; gap: 8px;">
                    <input type="date" id="landingRevenueStartDatePicker" onchange="loadRevenueChart()"
                        style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none;">
                    <span style="font-size: 13px; color: #666; font-weight: 600;">đến</span>
                    <input type="date" id="landingRevenueEndDatePicker" onchange="loadRevenueChart()"
                        style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none;">
                </div>
                
                <div id="landingRevenueQuarterPickerWrapper" style="display: none; align-items: center; gap: 8px;">
                    <select id="landingRevenueQuarterYear" onchange="loadRevenueChart()"
                        style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none; background: white; cursor: pointer;">
                        <option value="2026">Năm 2026</option>
                        <option value="2025">Năm 2025</option>
                    </select>
                    <select id="landingRevenueQuarterVal" onchange="loadRevenueChart()"
                        style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none; background: white; cursor: pointer;">
                        <option value="1">Quý I</option>
                        <option value="2">Quý II</option>
                        <option value="3">Quý III</option>
                        <option value="4">Quý IV</option>
                    </select>
                </div>
            </div>

            <div id="landingLineChartContainer"
                style="height: 320px; position: relative; background-color: #fafafa; border-radius: 8px; border: 1px solid #f0f0f0; padding: 10px; overflow: visible;">
                <div style="width:100%; text-align:center; color:#999; padding-top:100px;">
                    <span class="lang-vi">Đang tải biểu đồ doanh thu...</span>
                    <span class="lang-en">Loading revenue chart...</span>
                </div>
            </div>

            <div
                style="margin-top: 20px; display: flex; justify-content: center; gap: 30px; font-size: 13px; font-weight: 600;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                        style="display: inline-block; width: 12px; height: 12px; background-color: #3498db; border-radius: 50%;"></span>
                    <span>
                        <span class="lang-vi">Doanh thu đơn hoàn thành</span>
                        <span class="lang-en">Completed Order Revenue</span>
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span
                        style="display: inline-block; width: 12px; height: 12px; background-color: #e74c3c; border-radius: 50%;"></span>
                    <span>
                        <span class="lang-vi">Chi phí lương nhân viên</span>
                        <span class="lang-en">Staff Salary Cost</span>
                    </span>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Chăm Sóc Khách Hàng -->
    <div id="customerCareModal" class="modal">
        <div class="modal-content" style="max-width: 550px; width: 95%;">
            <span class="close-btn" onclick="closeModal('customerCareModal')">&times;</span>
            <h2 style="font-family: var(--font-serif); margin-bottom: 15px; color: #3E4B37; text-align: center;" data-translate="care_title">Chăm Sóc Khách Hàng</h2>
            <p style="font-size: 14px; color: #6E685E; text-align: center; margin-bottom: 20px;" data-translate="care_desc">
                Vui lòng điền thông tin bên dưới, nhân viên Home Bedding sẽ liên hệ tư vấn cho bạn sớm nhất.
            </p>
            <form id="customerCareForm" onsubmit="submitCustomerCareForm(event)">
                <div class="form-group">
                    <label data-translate="care_name_label">Họ và Tên</label>
                    <input type="text" id="careFullName" placeholder="Nhập họ và tên của bạn" data-translate-placeholder="care_name_placeholder" required>
                </div>
                <div class="form-group">
                    <label data-translate="care_email_label">Địa chỉ Email</label>
                    <input type="email" id="careEmail" placeholder="Nhập địa chỉ email để nhận phản hồi" data-translate-placeholder="care_email_placeholder" required>
                </div>
                <div class="form-group">
                    <label data-translate="care_phone_label">Số Điện Thoại</label>
                    <input type="tel" id="carePhone" placeholder="Nhập số điện thoại của bạn" data-translate-placeholder="care_phone_placeholder" required>
                </div>
                <div class="form-group">
                    <label data-translate="care_msg_label">Nội dung cần tư vấn</label>
                    <textarea id="careMessage" placeholder="Nhập câu hỏi hoặc nội dung bạn cần hỗ trợ..." data-translate-placeholder="care_msg_placeholder" rows="4" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 6px; font-family: var(--font-main); font-size: 14px; outline: none; resize: vertical;" required></textarea>
                </div>
                <button type="submit" class="submit-btn" style="margin-top: 15px;" data-translate="care_submit">Gửi Yêu Cầu</button>
            </form>
        </div>
    </div>

    <!-- Modal Tìm Cửa Hàng -->
    <div id="storeFinderModal" class="modal">
        <div class="modal-content" style="max-width: 500px; width: 95%;">
            <span class="close-btn" onclick="closeModal('storeFinderModal')">&times;</span>
            <h2 style="font-family: var(--font-serif); margin-bottom: 20px; color: #3E4B37; text-align: center;" data-translate="store_title">Tìm Cửa Hàng</h2>
            <div style="font-size: 15px; color: #2C2C2C; line-height: 1.6;">
                <p style="margin-bottom: 15px;">
                    <strong data-translate="store_address_label">📍 Địa chỉ showroom chính thức:</strong><br>
                    <span data-translate="store_address_val">Đội 7, thôn Trát Cầu, xã Tiền Phong, huyện Thường Tín, TP. Hà Nội.</span>
                </p>
                <p style="margin-bottom: 15px;">
                    <strong data-translate="store_time_label">⏰ Giờ mở cửa:</strong><br>
                    <span data-translate="store_time_val">Từ 8:00 – 18:00 các ngày trong tuần (trừ các ngày lễ, Tết).</span>
                </p>
                <p style="margin-bottom: 8px;"><strong data-translate="store_map_label">🗺️ Bản đồ & Tọa độ:</strong></p>
                <div style="background-color: #F5EFEB; padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-olive); display: flex; align-items: center; justify-content: space-between; gap: 15px;">
                    <div>
                        <span style="font-size: 13px; color: #6E685E; display: block; margin-bottom: 4px;" data-translate="store_coord_label">Tọa độ định vị:</span>
                        <strong style="color: #3E4B37; font-size: 14px;">20,86072° B, 105,82988° Đ</strong>
                    </div>
                    <a href="https://www.google.com/maps/place/20.86072,105.82988" target="_blank" style="background-color: #B85C4C; color: white; padding: 8px 15px; border-radius: 20px; text-decoration: none; font-size: 13px; font-weight: bold; display: inline-flex; align-items: center; gap: 6px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#9E4738'" onmouseout="this.style.backgroundColor='#B85C4C'">
                        <i class="fa-solid fa-map-location-dot"></i> Google Maps
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- ================= MODAL CHI TIẾT SẢN PHẨM ================= -->
    <div id="productDetailModal" class="modal product-detail-modal-container"
        style="display:none; position:fixed; z-index:10000; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.55); overflow-y:auto; backdrop-filter:blur(5px);" onclick="if(event.target===this) closeProductDetailModal()">
        <div class="modal-content product-detail-modal-content"
            style="background:#fff; margin:40px auto 0 auto; padding:0; border-radius:15px; width:90%; max-width:1100px; position:relative; box-shadow: 0 10px 40px rgba(0,0,0,0.2); overflow:hidden; display:flex; flex-direction:row; flex-shrink: 0;">
            <span class="close-btn" onclick="closeProductDetailModal()"
                style="position:absolute; right:15px; top:10px; font-size:28px; cursor:pointer; color:#999; z-index: 2;">&times;</span>

            <div class="product-detail-left-col"
                style="width: 450px; flex-shrink: 0; padding: 30px; background: #fafafa; border-right: 1px solid #eee; display: flex; flex-direction: column;">
                <div
                    style="width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; margin-bottom: 15px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">
                    <img id="detailMainImg" src="" style="width: 100%; height: 100%; object-fit: contain;" alt="Product">
                    <i class="fa-solid fa-expand" onclick="openLightbox()"
                        style="position: absolute; bottom: 15px; right: 15px; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 50%; cursor: pointer; color: #555; z-index: 10; font-size: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></i>
                </div>
                <div id="detailThumbnails"
                    style="display: flex; gap: 10px; overflow-x: auto; padding-bottom: 5px;">
                    <!-- Thumbnails go here -->
                </div>
            </div>

            <div class="product-detail-right-col"
                style="flex: 1; padding: 30px; display: flex; flex-direction: column; max-height: 80vh; overflow-y: auto;">
                <div style="margin-bottom: 10px;">
                    <span id="detailTag"
                        style="background: var(--primary-olive-light,#F0F4EC); color: var(--primary-olive-dark,#3E4B37); padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;">Hạ</span>
                </div>
                <h2 id="detailTitle" style="font-size: 26px; color: #333; margin-bottom: 10px; font-family:'Playfair Display',serif;">Chăn hè cotton</h2>
                <div id="detailPrice"
                    style="font-size: 22px; color: #222; font-weight: 700; margin-bottom: 15px;">100.009 đ</div>
                <div id="detailDesc"
                    style="color: #666; font-size: 14px; margin-bottom: 25px; line-height: 1.5;">chăn hè siêu xinh</div>

                <div
                    style="position: sticky; top: -5px; background: #fff; z-index: 10; padding: 15px 0; margin-bottom: 10px; border-bottom: 1px solid #eee;">
                    <div style="display: flex; gap: 15px; margin-bottom: 20px; align-items: center;">
                        <div
                            style="display: flex; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; width: 120px;">
                            <button onclick="updateQuantity(-1)"
                                style="width: 35px; height: 35px; background: #fff; border: none; cursor: pointer; font-size: 18px; color: #555;">-</button>
                            <input type="number" id="detailQty" value="1" min="1"
                                style="width: 50px; border: none; text-align: center; border-left: 1px solid #ddd; border-right: 1px solid #ddd; font-weight: 600; color: #333; outline: none; -moz-appearance: textfield;">
                            <button onclick="updateQuantity(1)"
                                style="width: 35px; height: 35px; background: #fff; border: none; cursor: pointer; font-size: 18px; color: #555;">+</button>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <button onclick="addDetailToCart()"
                            style="flex: 1; padding: 12px; background: var(--primary-olive-dark,#58674E); color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s;"><i
                                class="fa-solid fa-cart-shopping"></i> <span class="lang-vi">Thêm vào giỏ</span><span class="lang-en">Add to Cart</span></button>
                        <button onclick="buyNow()"
                            style="flex: 1; padding: 12px; background: #f25c3a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s;"><i
                                class="fa-solid fa-bolt"></i> <span class="lang-vi">Mua ngay</span><span class="lang-en">Buy Now</span></button>
                        <button id="btnDetailWishlist" onclick="toggleWishlistDetail()"
                            style="padding: 12px; background: #fdf2f0; color: #e74c3c; border: 1px solid #fadbd8; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; width: 48px; display: flex; justify-content: center; align-items: center;"><i
                                class="fa-regular fa-heart"></i></button>
                    </div>
                </div>

                <div style="border-top: 1px solid #eee; padding-top: 20px;">
                    <h3 style="font-size: 16px; color: #333; margin-bottom: 15px;">
                        <span class="lang-vi">Đánh giá từ khách hàng</span>
                        <span class="lang-en">Customer Reviews</span>
                    </h3>
                    <div id="detailReviewsList" style="display: flex; flex-direction: column; gap: 15px;">
                        <!-- Reviews go here -->
                    </div>
                </div>
            </div>
        </div>

        <!-- Tiêu đề Gợi ý sản phẩm (ẩn mặc định) -->
        <h3 id="relatedProductsTitle"
            style="color: #fff; font-size: 18px; margin-top: 30px; margin-bottom: 10px; font-weight: 600; text-align: center; display: none; flex-shrink: 0;">
            <span class="lang-vi">Gợi ý sản phẩm</span>
            <span class="lang-en">Suggested Products</span>
        </h3>

        <!-- Sản phẩm liên quan (Gợi ý) -->
        <div id="relatedProductsContainer"
            style="display: flex; gap: 20px; justify-content: center; margin-top: 10px; flex-wrap: wrap; padding-bottom: 60px; padding-top: 10px; flex-shrink: 0;">
            <!-- JS sẽ gen các ô sản phẩm vào đây -->
        </div>
    </div>

    <!-- ================= MODAL BLOG CHI TIẾT ================= -->
    <div id="blogDetailModal" style="display:none; position:fixed; z-index:10001; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.65); overflow-y:auto; backdrop-filter:blur(4px);" onclick="if(event.target===this) closeBlogDetailModal()">
        <div class="blog-detail-content-box" style="background:#fff; border-radius:18px; max-width:820px; width:90%; position:relative; box-shadow:0 20px 60px rgba(0,0,0,0.3); overflow:hidden; margin:40px auto 60px auto;">
            <button onclick="closeBlogDetailModal()" style="position:absolute; right:18px; top:18px; background:rgba(0,0,0,0.4); border:none; border-radius:50%; width:36px; height:36px; cursor:pointer; font-size:20px; color:#fff; display:flex; align-items:center; justify-content:center; z-index:10; line-height:1;">&times;</button>
            <img id="blogDetailMainImg" src="" alt="Ảnh bài viết" style="width:100%; height:280px; object-fit:cover; display:block;">
            <div class="blog-detail-padding-box" style="padding:30px 35px 40px;">
                <span id="blogDetailCategory" style="display:inline-block; background:var(--primary-olive,#7f866e); color:#fff; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:700; margin-bottom:14px;"></span>
                <h2 id="blogDetailTitle" style="font-family:'Playfair Display',serif; font-size:24px; color:#2c2c2c; margin-bottom:18px; line-height:1.4;"></h2>
                <div id="blogDetailContent" style="color:#444; line-height:1.9; font-size:15px;"></div>
            </div>
        </div>
    </div>

    <!-- ================= LIGHTBOX MODAL ================= -->
    <div id="lightboxModal" style="display:none; position:fixed; z-index:99999; left:0; top:0; width:100%; height:100%; background:rgba(0,0,0,0.92);" onclick="if(event.target===this) closeLightbox()">
        <span onclick="closeLightbox()" style="position:absolute; top:20px; right:30px; color:#fff; font-size:42px; font-weight:bold; cursor:pointer; line-height:1; z-index:2;">&times;</span>
        <div style="display:flex; align-items:center; justify-content:center; height:100%; position:relative;">
            <i class="fa-solid fa-chevron-left" onclick="changeLightboxImage(-1)" style="position:absolute; left:30px; color:#fff; font-size:38px; cursor:pointer; padding:20px; z-index:2;"></i>
            <img id="lightboxImg" src="" style="max-height:90vh; max-width:85vw; object-fit:contain; border-radius:8px;">
            <i class="fa-solid fa-chevron-right" onclick="changeLightboxImage(1)" style="position:absolute; right:30px; color:#fff; font-size:38px; cursor:pointer; padding:20px; z-index:2;"></i>
        </div>
    </div>
    `;

    // Dictionary dịch thuật song ngữ (Vietnamese & English)
    const dictionary = {
        vi: {
            "free_shipping": "Miễn phí giao hàng đơn từ 0đ trên toàn quốc",
            "customer_care": "Chăm sóc khách hàng",
            "store_finder": "Tìm cửa hàng",
            "nav_home": "TRANG CHỦ",
            "nav_about": "GIỚI THIỆU",
            "nav_products": "SẢN PHẨM NỔI BẬT",
            "nav_promotions": "KHUYẾN MÃI",
            "nav_blog": "BLOG",
            "nav_revenue": "DOANH THU",
            "search_placeholder": "Tìm kiếm sản phẩm...",
            "footer_about": "Về Chúng Tôi",
            "footer_support": "Hỗ Trợ Khách Hàng",
            "footer_policies": "Chính Sách",
            "footer_contact": "Liên Hệ",
            "footer_payment": "Phương Thức Thanh Toán",
            "link_about": "Giới thiệu",
            "link_stores": "Hệ thống cửa hàng",
            "link_careers": "Tuyển dụng",
            "link_news": "Tin tức",
            "link_buy_guide": "Hướng dẫn mua hàng",
            "link_shipping": "Chính sách vận chuyển",
            "link_return": "Chính sách đổi trả",
            "link_faq": "Câu hỏi thường gặp",
            "link_privacy": "Chính sách bảo mật",
            "link_terms": "Điều khoản sử dụng",
            "link_warranty": "Chính sách bảo hành",
            "hotline": "Hotline",
            "email": "Email",
            "web": "Web",
            "hero_sub1": "Không cần người ấy nhắc",
            "hero_sub2": "Ngủ ngoannn mơ đẹp cùng HomeBedding ngay",
            "hero_title": "LÀM MỚI PHÒNG NGỦ<br>VỚI CHĂN GA GỐI",
            "hero_desc": "Biến đổi không gian sống của bạn trong tích tắc với các chất liệu tự nhiên cao cấp và mềm mại vượt trội.",
            "hero_cta": "MUA NGAY",
            "about_title": "Hành Trình Kiến Tạo Giấc Ngủ Vàng",
            "about_desc1": "Được thành lập với sứ mệnh mang lại những trải nghiệm giấc ngủ tuyệt vời nhất, <strong>Home Bedding</strong> tự hào cung cấp các bộ sưu tập chăn ga gối nệm cao cấp từ các chất liệu tự nhiên chọn lọc như Egyptian Cotton, Tencel, Bamboo và Silk.",
            "about_desc2": "Mỗi sản phẩm của Home Bedding là sự kết tinh giữa nghệ thuật thiết kế tinh tế và quy trình sản xuất nghiêm ngặt, mang đến sự mát mịn, êm ái tối đa cùng tính năng kháng khuẩn vượt trội, bảo vệ toàn diện làn da và sức khỏe cho gia đình bạn.",
            "about_btn": "TÌM HIỂU THÊM",
            "badge_premium_title": "CHẤT LIỆU CAO CẤP",
            "badge_premium_desc": "Sợi tự nhiên chọn lọc",
            "badge_shipping_title": "MIỄN PHÍ GIAO HÀNG",
            "badge_shipping_desc": "Toàn quốc, nhanh chóng",
            "badge_return_title": "ĐỔI TRẢ 30 NGÀY",
            "badge_return_desc": "Dễ dàng, không rủi ro",
            "badge_warranty_title": "BẢO HÀNH TRỌN ĐỜI",
            "badge_warranty_desc": "An tâm tuyệt đối",
            "filter_all": "Tất cả",
            "filter_4seasons": "4 Mùa",
            "filter_spring": "Mùa Xuân",
            "filter_summer": "Mùa Hạ",
            "filter_autumn": "Mùa Thu",
            "filter_winter": "Mùa Đông",
            "filter_title": "Bộ lọc sản phẩm",
            "filter_price": "Mức giá",
            "filter_sort": "Sắp xếp",
            "filter_clear": "Bỏ lọc",
            "price_all": "Mọi mức giá",
            "price_under_1m": "Dưới 1 triệu",
            "price_1m_3m": "1 triệu - 3 triệu",
            "price_3m_5m": "3 triệu - 5 triệu",
            "price_over_5m": "Trên 5 triệu",
            "sort_default": "Sắp xếp: Mặc định",
            "sort_asc": "Giá: Thấp đến Cao",
            "sort_desc": "Giá: Cao đến Thấp",
            "best_sellers_header": "Sản Phẩm Bán Chạy",
            "best_sellers_subtitle": "Chất liệu sinh học cao cấp, nâng niu giấc ngủ của bạn",
            "promotions_header": "Chương Trình Khuyến Mãi",
            "promotions_subtitle": "Đừng bỏ lỡ các ưu đãi mua sắm độc quyền trong tháng",
            "blog_header": "Cẩm Nang Ngủ Ngon & Vệ Sinh",
            "blog_subtitle": "Chia sẻ kiến thức từ các chuyên gia để bảo vệ sức khỏe giấc ngủ của bạn và gia đình",
            "care_title": "Chăm Sóc Khách Hàng",
            "care_desc": "Vui lòng điền thông tin bên dưới, nhân viên Home Bedding sẽ liên hệ tư vấn cho bạn sớm nhất.",
            "care_name_label": "Họ và Tên",
            "care_name_placeholder": "Nhập họ và tên của bạn",
            "care_email_label": "Địa chỉ Email",
            "care_email_placeholder": "Nhập địa chỉ email để nhận phản hồi",
            "care_phone_label": "Số Điện Thoại",
            "care_phone_placeholder": "Nhập số điện thoại của bạn",
            "care_msg_label": "Nội dung cần tư vấn",
            "care_msg_placeholder": "Nhập câu hỏi hoặc nội dung bạn cần hỗ trợ...",
            "care_submit": "Gửi Yêu Cầu",
            "store_title": "Tìm Cửa Hàng",
            "store_address_label": "📍 Địa chỉ showroom chính thức:",
            "store_address_val": "Đội 7, thôn Trát Cầu, xã Tiền Phong, huyện Thường Tín, TP. Hà Nội.",
            "store_time_label": "⏰ Giờ mở cửa:",
            "store_time_val": "Từ 8:00 – 18:00 các ngày trong tuần (trừ các ngày lễ, Tết).",
            "store_map_label": "🗺️ Bản đồ & Tọa độ:",
            "store_coord_label": "Tọa độ định vị:",
            "btn_show_more": "Hiển thị thêm",
            "btn_view_detail": "Xem chi tiết",
            "alert_success": "Gửi yêu cầu thành công! Admin sẽ liên hệ lại với bạn sớm nhất.",
            "widget_flash_sale": "ƯU ĐÃI ĐẶC BIỆT - GIỚI HẠN",
            "label_hours": "GIỜ",
            "label_minutes": "PHÚT",
            "label_seconds": "GIÂY",
            "widget_reviews": "Đánh giá khách hàng",
            "widget_newsletter": "Đăng Ký Nhận Tin & Ưu Đãi",
            "newsletter_desc": "Đăng ký nhận tin để nhận ưu đãi và thông tin mới nhất từ Home Bedding.",
            "newsletter_placeholder": "Nhập email của bạn",
            "newsletter_btn_text": "ĐĂNG KÝ",
            "newsletter_privacy": "Chúng tôi cam kết bảo mật thông tin của bạn.",
            "coupon_discount_lbl": "GIẢM",
            "coupon_code_lbl": "Mã: ",
            "coupon_remaining": "Còn lại:",
            "coupon_times": "lượt",
            "coupon_copy_btn": "SAO CHÉP MÃ",
            "loading_promotions": "Đang tải khuyến mãi...",
            "loading_reviews": "Đang tải đánh giá...",
            "reviews_empty": "Chưa có đánh giá nào."
        },
        en: {
            "free_shipping": "Free shipping for orders from 0 VND nationwide",
            "customer_care": "Customer Care",
            "store_finder": "Store Finder",
            "nav_home": "HOME",
            "nav_about": "ABOUT US",
            "nav_products": "FEATURED PRODUCTS",
            "nav_promotions": "PROMOTIONS",
            "nav_blog": "BLOG",
            "nav_revenue": "REVENUE",
            "search_placeholder": "Search products...",
            "footer_about": "About Us",
            "footer_support": "Customer Support",
            "footer_policies": "Policies",
            "footer_contact": "Contact Us",
            "footer_payment": "Payment Methods",
            "link_about": "About Us",
            "link_stores": "Store Locator",
            "link_careers": "Careers",
            "link_news": "News",
            "link_buy_guide": "Buying Guide",
            "link_shipping": "Shipping Policy",
            "link_return": "Return Policy",
            "link_faq": "FAQ",
            "link_privacy": "Privacy Policy",
            "link_terms": "Terms of Use",
            "link_warranty": "Warranty Policy",
            "hotline": "Hotline",
            "email": "Email",
            "web": "Web",
            "hero_sub1": "No need for them to remind you",
            "hero_sub2": "Sleep tight and dream sweet with HomeBedding now",
            "hero_title": "REFRESH YOUR BEDROOM<br>WITH BEDDING SETS",
            "hero_desc": "Transform your living space in an instant with premium, exceptionally soft natural materials.",
            "hero_cta": "SHOP NOW",
            "about_title": "Journey to Create the Golden Sleep",
            "about_desc1": "Founded with the mission to bring the best sleep experiences, <strong>Home Bedding</strong> is proud to provide premium bedding collections made from selected natural materials such as Egyptian Cotton, Tencel, Bamboo, and Silk.",
            "about_desc2": "Each product of Home Bedding is the crystallization of exquisite design and strict manufacturing process, bringing maximum coolness, softness, and outstanding antibacterial properties, protecting the skin and health of your family.",
            "about_btn": "LEARN MORE",
            "badge_premium_title": "PREMIUM MATERIALS",
            "badge_premium_desc": "Selected natural fibers",
            "badge_shipping_title": "FREE SHIPPING",
            "badge_shipping_desc": "Nationwide, fast delivery",
            "badge_return_title": "30-DAY RETURN",
            "badge_return_desc": "Easy, risk-free returns",
            "badge_warranty_title": "LIFETIME WARRANTY",
            "badge_warranty_desc": "Absolute peace of mind",
            "filter_all": "All",
            "filter_4seasons": "4 Seasons",
            "filter_spring": "Spring",
            "filter_summer": "Summer",
            "filter_autumn": "Autumn",
            "filter_winter": "Winter",
            "filter_title": "Product Filter",
            "filter_price": "Price Range",
            "filter_sort": "Sort By",
            "filter_clear": "Clear Filter",
            "price_all": "All Prices",
            "price_under_1m": "Under 1M VND",
            "price_1m_3m": "1M - 3M VND",
            "price_3m_5m": "3M - 5M VND",
            "price_over_5m": "Over 5M VND",
            "sort_default": "Default",
            "sort_asc": "Price: Low to High",
            "sort_desc": "Price: High to Low",
            "best_sellers_header": "Best Sellers",
            "best_sellers_subtitle": "Premium organic materials, nurturing your sleep",
            "promotions_header": "Promotional Programs",
            "promotions_subtitle": "Don't miss out on exclusive shopping deals of the month",
            "blog_header": "Good Sleep & Hygiene Guide",
            "blog_subtitle": "Expert knowledge to protect the sleep health of you and your family",
            "care_title": "Customer Care",
            "care_desc": "Please fill in the information below, Home Bedding staff will contact you for advice as soon as possible.",
            "care_name_label": "Full Name",
            "care_name_placeholder": "Enter your full name",
            "care_email_label": "Email Address",
            "care_email_placeholder": "Enter your email address for response",
            "care_phone_label": "Phone Number",
            "care_phone_placeholder": "Enter your phone number",
            "care_msg_label": "Consultation Content",
            "care_msg_placeholder": "Enter your questions or content you need help with...",
            "care_submit": "Submit Request",
            "store_title": "Store Finder",
            "store_address_label": "📍 Official Showroom Address:",
            "store_address_val": "Team 7, Trat Cau Village, Tien Phong Commune, Thuong Tin District, Hanoi.",
            "store_time_label": "⏰ Opening Hours:",
            "store_time_val": "From 8:00 to 18:00 every day of the week (except holidays).",
            "store_map_label": "🗺️ Map & Coordinates:",
            "store_coord_label": "Coordinates:",
            "btn_show_more": "Show more",
            "btn_view_detail": "View Details",
            "alert_success": "Request sent successfully! Admin will contact you as soon as possible.",
            "widget_flash_sale": "SPECIAL OFFERS - LIMITED",
            "label_hours": "HRS",
            "label_minutes": "MINS",
            "label_seconds": "SECS",
            "widget_reviews": "Customer Reviews",
            "widget_newsletter": "Subscribe for News & Offers",
            "newsletter_desc": "Subscribe to receive updates, special offers, and the latest news from Home Bedding.",
            "newsletter_placeholder": "Enter your email address",
            "newsletter_btn_text": "SUBSCRIBE",
            "newsletter_privacy": "We commit to keeping your information secure.",
            "coupon_discount_lbl": "OFF",
            "coupon_code_lbl": "Code: ",
            "coupon_remaining": "Remaining:",
            "coupon_times": "times",
            "coupon_copy_btn": "COPY CODE",
            "loading_promotions": "Loading promotions...",
            "loading_reviews": "Loading reviews...",
            "reviews_empty": "No reviews yet."
        }
    };

    // Hàm áp dụng dịch thuật
    window.applyTranslations = function () {
        const lang = localStorage.getItem('lang') || 'vi';
        const dict = dictionary[lang];
        if (!dict) return;

        // Dịch nội dung text
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Dịch placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        // Cập nhật giao diện nút chọn ngôn ngữ
        const vnBtn = document.getElementById('lang-vn-btn');
        const enBtn = document.getElementById('lang-en-btn');
        if (vnBtn && enBtn) {
            if (lang === 'vi') {
                vnBtn.style.fontWeight = 'bold';
                vnBtn.style.textDecoration = 'underline';
                enBtn.style.fontWeight = 'normal';
                enBtn.style.textDecoration = 'none';
            } else {
                enBtn.style.fontWeight = 'bold';
                enBtn.style.textDecoration = 'underline';
                vnBtn.style.fontWeight = 'normal';
                vnBtn.style.textDecoration = 'none';
            }
        }
        
        // Cập nhật lại thuộc tính lang cho html nếu nó chưa đúng khi mới load
        if (document.documentElement.lang !== lang) {
            document.documentElement.lang = lang;
        }
    };

    // Hàm đổi ngôn ngữ
    window.changeLanguage = function (lang, event) {
        if (event) event.preventDefault();
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang; // Cập nhật thẻ html
        window.applyTranslations();
    };

    // Handler tìm kiếm ở header
    window.handleHeaderSearch = function (event) {
        event.preventDefault();
        const queryInput = document.getElementById('headerSearchInput');
        const query = queryInput ? queryInput.value.trim() : '';
        if (!query) return;

        if (typeof window.searchLandingProducts === 'function') {
            window.searchLandingProducts(query);
        } else {
            window.location.href = `${homePrefix}?search=${encodeURIComponent(query)}`;
        }
    };

    // Handler gửi form Chăm sóc khách hàng
    window.submitCustomerCareForm = async function (event) {
        event.preventDefault();
        const name = document.getElementById('careFullName').value.trim();
        const email = document.getElementById('careEmail').value.trim();
        const phone = document.getElementById('carePhone').value.trim();
        const message = document.getElementById('careMessage').value.trim();
        const lang = localStorage.getItem('lang') || 'vi';

        // Validate email format (strict domains like .com, .vn, etc.)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
        if (!emailRegex.test(email)) {
            const emailErrorMsg = lang === 'vi' ? 'Địa chỉ email không đúng định dạng hoặc tên miền không hỗ trợ (ví dụ: gmail.co là không hợp lệ).' : 'Invalid email format or unsupported domain (e.g., gmail.co is invalid).';
            alert(emailErrorMsg);
            document.getElementById('careEmail').focus();
            return;
        }

        // Validate phone format (Vietnamese mobile format: 10 digits starting with 03, 05, 07, 08, 09, or 84)
        const phoneRegex = /^(84|0[35789])\d{8}$/;
        if (!phoneRegex.test(phone)) {
            const phoneErrorMsg = lang === 'vi' ? 'Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 hoặc 84 và có đúng 10 chữ số).' : 'Invalid phone number (must start with 03, 05, 07, 08, 09 or 84 and have exactly 10 digits).';
            alert(phoneErrorMsg);
            document.getElementById('carePhone').focus();
            return;
        }

        // Tự động xác định base URL của API (nếu chạy qua file:// hoặc cổng khác thì hướng về cổng 3000)
        const apiOrigin = (window.location.port === '3000') ? '' : 'http://localhost:3000';
        const apiUrl = `${apiOrigin}/api/support-requests`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, phone, message })
            });

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Server returned HTML instead of JSON. Please restart the backend server.');
            }

            const data = await response.json();
            if (response.ok) {
                const successMsg = lang === 'vi' ? 'Gửi yêu cầu thành công! Admin sẽ liên hệ lại với bạn sớm nhất.' : 'Request sent successfully! Admin will contact you as soon as possible.';
                alert(successMsg);
                document.getElementById('customerCareForm').reset();
                closeModal('customerCareModal');
            } else {
                alert(data.message || 'Có lỗi xảy ra, vui lòng thử lại.');
            }
        } catch (err) {
            console.error('Error sending support request:', err);
            if (err.message && err.message.includes('Please restart the backend server')) {
                const errorMsg = lang === 'vi'
                    ? 'Không thể xử lý yêu cầu. Vui lòng tắt và khởi động lại Server Node.js của bạn (chạy npm start lại) để áp dụng các API mới.'
                    : 'Cannot process request. Please stop and restart your Node.js Server (run npm start again) to apply the new APIs.';
                alert(errorMsg);
            } else {
                const errorMsg = lang === 'vi' ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' : 'Failed to connect to server. Please try again later.';
                alert(errorMsg);
            }
        }
    };

    // Inject header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
        headerPlaceholder.outerHTML = headerHTML;
    }

    // Inject footer and modals
    function injectRemaining() {
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = footerHTML;
        }

        const modalsPlaceholder = document.getElementById('auth-modals-placeholder');
        if (modalsPlaceholder) {
            modalsPlaceholder.outerHTML = modalsHTML;
        }

        // Kích hoạt lại form listeners trong main.js
        if (typeof window.initAuthForms === 'function') {
            window.initAuthForms();
        }

        // Thực hiện áp dụng ngôn ngữ mặc định/lưu trữ sau khi inject layout xong
        window.applyTranslations();

        // Khởi tạo Chatbot tư vấn khách vãng lai
        initGuestChatbot();
    }

    function initGuestChatbot() {
        if (document.getElementById('guestChatLauncher')) return; // Tránh lặp lại

        // CSS cho Chatbot
        const style = document.createElement('style');
        style.innerHTML = `
            .guest-chat-launcher {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: var(--primary-olive, #7f866e);
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 26px;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                z-index: 999999;
            }
            .guest-chat-launcher:hover {
                transform: scale(1.1) rotate(5deg);
                background-color: var(--primary-olive-dark, #646b54);
            }
            .guest-chat-window {
                position: fixed;
                bottom: 105px;
                right: 30px;
                width: 380px;
                height: 520px;
                border-radius: 16px;
                background: #fff;
                box-shadow: 0 12px 40px rgba(0,0,0,0.15);
                border: 1px solid rgba(127, 134, 110, 0.15);
                display: none;
                flex-direction: column;
                overflow: hidden;
                font-family: 'Quicksand', sans-serif;
                z-index: 999999;
                transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                transform: translateY(20px) scale(0.95);
                opacity: 0;
            }
            .guest-chat-window.open {
                display: flex;
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            .guest-chat-header {
                background-color: var(--primary-olive, #7f866e);
                color: #fff;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .guest-chat-header-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .guest-chat-avatar {
                width: 35px;
                height: 35px;
                border-radius: 50%;
                background: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--primary-olive, #7f866e);
                font-size: 18px;
                font-weight: bold;
            }
            .guest-chat-title {
                font-weight: 700;
                font-size: 15px;
            }
            .guest-chat-status {
                font-size: 11px;
                opacity: 0.8;
            }
            .guest-chat-close {
                background: none;
                border: none;
                color: #fff;
                font-size: 22px;
                cursor: pointer;
                padding: 0 5px;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .guest-chat-close:hover {
                opacity: 1;
            }
            .guest-chat-messages {
                flex: 1;
                padding: 15px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background-color: #fcfbfa;
            }
            .guest-msg {
                max-width: 80%;
                padding: 10px 14px;
                border-radius: 14px;
                font-size: 13.5px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            .guest-msg-bot {
                align-self: flex-start;
                background-color: #f0ebe4;
                color: #333;
                border-bottom-left-radius: 4px;
            }
            .guest-msg-user {
                align-self: flex-end;
                background-color: var(--primary-olive, #7f866e);
                color: #fff;
                border-bottom-right-radius: 4px;
            }
            .guest-typing {
                display: none;
                align-self: flex-start;
                background-color: #f0ebe4;
                padding: 10px 14px;
                border-radius: 14px;
                border-bottom-left-radius: 4px;
                margin-left: 15px;
                margin-bottom: 12px;
            }
            .guest-typing span {
                height: 8px;
                width: 8px;
                float: left;
                margin: 0 2px;
                background-color: #999;
                border-radius: 50%;
            }
            .guest-typing span:nth-of-type(1) { animation: bounce 1s infinite; }
            .guest-typing span:nth-of-type(2) { animation: bounce 1s infinite 0.2s; }
            .guest-typing span:nth-of-type(3) { animation: bounce 1s infinite 0.4s; }
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            .guest-chat-suggestions {
                border-top: 1px solid #f0ebe4;
                padding: 10px;
                background: #fff;
                max-height: 140px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .guest-suggestion-btn {
                background-color: #faf8f5;
                border: 1px solid rgba(127, 134, 110, 0.2);
                color: var(--primary-olive-dark, #646b54);
                padding: 8px 12px;
                border-radius: 12px;
                font-size: 12px;
                text-align: left;
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Quicksand', sans-serif;
                font-weight: 500;
            }
            .guest-suggestion-btn:hover {
                background-color: var(--primary-olive-light, #ecefe8);
                border-color: var(--primary-olive, #7f866e);
            }
            .guest-chat-input-area {
                display: flex;
                padding: 10px;
                background-color: #fff;
                border-top: 1px solid #f0ebe4;
                gap: 8px;
                align-items: center;
            }
            .guest-chat-input {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: 13px;
                font-family: 'Quicksand', sans-serif;
            }
            .guest-chat-input:focus {
                border-color: var(--primary-olive, #7f866e);
            }
            .guest-chat-send {
                background-color: var(--primary-olive, #7f866e);
                color: #fff;
                border: none;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            .guest-chat-send:hover {
                background-color: var(--primary-olive-dark, #646b54);
            }
            @media (max-width: 480px) {
                .guest-chat-window {
                    width: calc(100% - 40px);
                    right: 20px;
                    left: 20px;
                    bottom: 95px;
                    height: 450px;
                }
            }
            .guest-chat-label {
                position: fixed;
                bottom: 42px;
                right: 100px;
                background-color: var(--primary-olive, #7f866e);
                color: #fff;
                padding: 8px 14px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 700;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 999998;
                font-family: 'Quicksand', sans-serif;
                white-space: nowrap;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateX(10px);
                pointer-events: none;
            }
            .guest-chat-label::after {
                content: '';
                position: absolute;
                right: -6px;
                top: 50%;
                transform: translateY(-50%);
                border-width: 6px 0 6px 6px;
                border-style: solid;
                border-color: transparent transparent transparent var(--primary-olive, #7f866e);
            }
            .guest-chat-label.visible {
                opacity: 1;
                transform: translateX(0);
            }
        `;
        document.head.appendChild(style);

        // Tạo nút Launcher
        const launcher = document.createElement('div');
        launcher.className = 'guest-chat-launcher';
        launcher.id = 'guestChatLauncher';
        launcher.innerHTML = '<i class="fa-solid fa-comments"></i>';
        document.body.appendChild(launcher);

        // Chỉ hiện nhãn chữ ở trang chủ (index.html) tại vị trí đầu trang (hero)
        if (isIndexPage) {
            const label = document.createElement('div');
            label.className = 'guest-chat-label visible';
            label.id = 'guestChatLabel';
            label.innerText = 'Chatbot HomeBedding';
            document.body.appendChild(label);

            window.addEventListener('scroll', () => {
                if (window.scrollY > 80) {
                    label.classList.remove('visible');
                } else {
                    label.classList.add('visible');
                }
            });
        }

        // Tạo khung chat Window
        const chatWin = document.createElement('div');
        chatWin.className = 'guest-chat-window';
        chatWin.id = 'guestChatWindow';
        chatWin.innerHTML = `
            <div class="guest-chat-header">
                <div class="guest-chat-header-info">
                    <div class="guest-chat-avatar"><i class="fa-solid fa-robot"></i></div>
                    <div>
                        <div class="guest-chat-title">Trợ lý ảo Home Bedding</div>
                        <div class="guest-chat-status"><span style="color:#2ecc71;">●</span> Đang online - Trả lời tự động</div>
                    </div>
                </div>
                <button class="guest-chat-close" id="guestChatClose">&times;</button>
            </div>
            <div class="guest-chat-messages" id="guestChatMessages">
                <div class="guest-msg guest-msg-bot">
                    Xin chào quý khách! Tôi là trợ lý ảo của Home Bedding. Quý khách cần tôi tư vấn về chủ đề nào dưới đây? Quý khách có thể bấm chọn câu hỏi gợi ý hoặc tự nhập câu hỏi nhé!
                </div>
            </div>
            <div class="guest-typing" id="guestTyping">
                <span></span><span></span><span></span>
            </div>
            <div class="guest-chat-suggestions" id="guestChatSuggestions"></div>
            <div class="guest-chat-input-area">
                <input type="text" class="guest-chat-input" id="guestChatInput" placeholder="Nhập câu hỏi của bạn...">
                <button class="guest-chat-send" id="guestChatSend"><i class="fa-solid fa-paper-plane"></i></button>
            </div>
        `;
        document.body.appendChild(chatWin);

        // Dữ liệu câu hỏi & câu trả lời theo chủ đề gợi ý
        const botData = {
            topics: [
                {
                    title: "🔑 Đăng ký / Đăng nhập tài khoản",
                    questions: [
                        {
                            q: "Làm thế nào để đăng ký tài khoản mới?",
                            a: "Để đăng ký tài khoản mới, quý khách nhấn biểu tượng <i class='fa-regular fa-user'></i> ở góc trên bên phải màn hình, chọn 'Đăng ký tài khoản', nhập Họ tên, Email, Số điện thoại và Mật khẩu (độ dài ít nhất 8 ký tự, có 1 chữ hoa, 1 số và 1 ký tự đặc biệt) rồi nhấn nút đăng ký là xong!"
                        },
                        {
                            q: "Tôi quên mật khẩu thì phải làm thế nào?",
                            a: "Nếu quên mật khẩu, quý khách vui lòng liên hệ Hotline 0866 853 758 hoặc Zalo CSKH để nhân viên kỹ thuật hỗ trợ đặt lại mật khẩu mới nhanh nhất cho mình nhé."
                        },
                        {
                            q: "Tại sao tôi không đăng nhập được?",
                            a: "Quý khách vui lòng kiểm tra xem email hoặc mật khẩu nhập vào đã chính xác chưa (chú ý tắt Caps Lock và gõ tiếng Việt). Nếu vẫn báo lỗi, có thể tài khoản của quý khách chưa được đăng ký hoặc đang bị khóa, hãy liên hệ CSKH qua Hotline để được hỗ trợ kiểm tra."
                        }
                    ]
                },
                {
                    title: "🛒 Hướng dẫn mua hàng & thanh toán",
                    questions: [
                        {
                            q: "Các bước mua hàng trên website như thế nào?",
                            a: "Quy trình mua hàng rất đơn giản: 1. Xem danh sách sản phẩm. 2. Nhấn vào sản phẩm, xem chi tiết và chọn 'Thêm vào giỏ hàng'. 3. Vào giỏ hàng kiểm tra, chọn các sản phẩm cần mua và bấm 'Thanh toán'. 4. Nhập thông tin nhận hàng, lựa chọn phương thức COD hoặc chuyển khoản qua VietQR rồi nhấn xác nhận đặt hàng."
                        },
                        {
                            q: "Cửa hàng có các hình thức thanh toán nào?",
                            a: "Home Bedding hỗ trợ 2 phương thức thanh toán chính: 1. Thanh toán khi nhận hàng (COD). 2. Chuyển khoản ngân hàng trực tuyến qua mã VietQR tự động điền sẵn thông tin số tiền và nội dung chuyển khoản cực kỳ nhanh chóng."
                        },
                        {
                            q: "Thời gian giao hàng mất bao lâu?",
                            a: "Thời gian giao hàng tiêu chuẩn: Nội thành Hà Nội/TP.HCM nhận trong vòng 1-2 ngày. Các khu vực tỉnh thành khác từ 3-5 ngày làm việc tùy thuộc vào địa điểm."
                        }
                    ]
                },
                {
                    title: "🚚 Vận chuyển & Giao nhận hàng",
                    questions: [
                        {
                            q: "Phí vận chuyển được tính như thế nào?",
                            a: "Home Bedding hỗ trợ **miễn phí giao hàng tiêu chuẩn toàn quốc** cho mọi đơn hàng từ 0đ. Đối với giao hàng hỏa tốc, phí vận chuyển sẽ tính dựa trên khoảng cách từ showroom gần nhất đến địa chỉ của bạn."
                        },
                        {
                            q: "Tôi có được kiểm tra hàng trước khi thanh toán không?",
                            a: "Có! Tất cả đơn hàng của Home Bedding đều được **áp dụng chính sách đồng kiểm**. Quý khách có quyền mở hộp kiểm tra chất lượng, màu sắc, mẫu mã sản phẩm trước khi thanh toán hoặc ký nhận."
                        },
                        {
                            q: "Làm sao để theo dõi hành trình đơn hàng?",
                            a: "Sau khi đơn hàng được gửi đi, quý khách có thể đăng nhập tài khoản và vào mục 'Đơn hàng của tôi' để theo dõi trạng thái giao hàng chi tiết, hoặc liên hệ Hotline/Zalo để nhân viên kiểm tra trực tiếp."
                        }
                    ]
                },
                {
                    title: "🎟️ Mã giảm giá & Khuyến mãi",
                    questions: [
                        {
                            q: "Lấy mã giảm giá của Home Bedding ở đâu?",
                            a: "Quý khách có thể lấy mã giảm giá ngay tại mục **'KHUYẾN MÃI'** trên trang chủ, các banner sự kiện trên web, hoặc theo dõi Fanpage của Home Bedding để cập nhật các mã giảm giá sốc hàng tuần."
                        },
                        {
                            q: "Cách sử dụng mã giảm giá khi đặt hàng?",
                            a: "Khi thanh toán (sau khi chọn sản phẩm trong giỏ), quý khách nhập mã coupon vào ô **'Nhập mã khuyến mãi'** và nhấn 'Áp dụng'. Hệ thống sẽ tự động trừ số tiền giảm giá trực tiếp vào hóa đơn của bạn."
                        },
                        {
                            q: "Hiện tại có chương trình khuyến mãi nào hot?",
                            a: "Home Bedding đang chạy chương trình **Chào Hè Rực Rỡ**: Giảm giá đến 30% cho bộ chăn ga Tencel cao cấp, mua chăn ga tặng kèm 2 ruột gối nằm. Xem chi tiết tại mục 'KHUYẾN MÃI'."
                        }
                    ]
                },
                {
                    title: "🛡️ Chính sách đổi trả & Bảo hành",
                    questions: [
                        {
                            q: "Quy định đổi trả sản phẩm ra sao?",
                            a: "Quý khách được **đổi trả sản phẩm miễn phí trong 7 ngày** kể từ ngày nhận nếu sản phẩm có lỗi từ nhà sản xuất hoặc bị giao sai mẫu. Yêu cầu sản phẩm còn nguyên tem mác, chưa qua giặt tẩy và chưa sử dụng."
                        },
                        {
                            q: "Sản phẩm được bảo hành bao lâu?",
                            a: "Tất cả các dòng chăn ga gối nệm chính hãng tại Home Bedding đều được **bảo hành khóa kéo, đường may từ 6 đến 12 tháng**. Các lỗi xẹp lún nệm bất thường cũng được đổi mới theo chính sách bảo hành."
                        },
                        {
                            q: "Tôi cần làm gì để yêu cầu bảo hành/đổi trả?",
                            a: "Quý khách có thể gọi trực tiếp Hotline **0866 853 758** cung cấp số điện thoại đặt hàng, hoặc mang sản phẩm trực tiếp đến bất kỳ chi nhánh showroom nào của Home Bedding để được hỗ trợ tức thì."
                        }
                    ]
                },
                {
                    title: "🍂 Tư vấn sản phẩm theo mùa",
                    questions: [
                        {
                            q: "Mùa hè nên dùng chăn ga gối chất liệu gì?",
                            a: "Vào mùa hè nóng bức, quý khách nên ưu tiên chọn chăn ga làm từ sợi Tencel (sợi gỗ tự nhiên từ cây khuynh diệp) hoặc Cotton lụa. Chất liệu Tencel có đặc tính mát lạnh khi chạm vào, hút ẩm tốt, cực kỳ thoáng khí và êm dịu cho da."
                        },
                        {
                            q: "Mùa đông nên dùng loại chăn nào để ấm áp nhất?",
                            a: "Mùa đông lạnh quý khách nên chọn dòng Chăn lông cừu cao cấp hoặc Chăn bông Microfiber của Home Bedding. Các dòng chăn này giữ nhiệt cực tốt, siêu nhẹ, tạo cảm giác bồng bềnh êm ái mà không gây ngột ngạt."
                        },
                        {
                            q: "Sản phẩm nào đang bán chạy nhất?",
                            a: "Hiện tại các dòng sản phẩm bán chạy nhất bao gồm: Bộ Chăn Ga Tencel 80s Thượng Uyển (mát mẻ sang trọng), Bộ Chăn Ga Cotton Satin Cát Tường và Ruột Gối Lông Vũ Kháng Khuẩn. Quý khách có thể tham khảo thêm tại mục 'Sản phẩm nổi bật'."
                        }
                    ]
                },
                {
                    title: "🧺 Vệ sinh & bảo quản sản phẩm",
                    questions: [
                        {
                            q: "Giặt chăn ga chất liệu Tencel thế nào đúng cách?",
                            a: "Khi giặt chất liệu cao cấp như Tencel: Nên dùng chế độ giặt nhẹ (Gentle/Wool), giặt nước lạnh (dưới 30°C), bỏ chăn ga vào túi giặt lớn, dùng nước giặt trung tính (không dùng chất tẩy rửa mạnh), không vắt quá khô và phơi ở nơi thoáng gió, tránh ánh nắng mặt trời chiếu trực tiếp."
                        },
                        {
                            q: "Bao lâu thì nên giặt chăn ga gối một lần?",
                            a: "Quý khách nên giặt vỏ gối và ga giường định kỳ 1 tuần/lần để tránh tích tụ mồ hôi và vi khuẩn. Đối với ruột chăn và ruột gối, nên phơi gió định kỳ và giặt khô từ 3-6 tháng/lần."
                        },
                        {
                            q: "Làm sao để bảo quản nệm không bị ẩm mốc?",
                            a: "Để nệm luôn bền sạch: 1. Sử dụng tấm bảo vệ nệm chống thấm. 2. Đặt nệm trên giường/giá đỡ thoáng khí, cách mặt đất ít nhất 10cm. 3. Định kỳ hút bụi bề mặt nệm và xoay chiều nệm 3 tháng/lần để nệm lún đều."
                        }
                    ]
                }
            ],
            keywords: {
                greetings: {
                    keys: ["chao", "hello", "hi", "xin chao", "chào", "kính chào", "alo", "ê", "oi", "ơi", "bot", "assistant", "tro ly"],
                    response: "Xin chào quý khách! Tôi là trợ lý ảo Home Bedding. Quý khách cần tôi tư vấn về chủ đề nào (đăng ký, mua hàng, bảo quản sản phẩm, chất liệu theo mùa, vận chuyển, mã giảm giá, chính sách đổi trả...)? Hoặc quý khách cứ đặt câu hỏi trực tiếp nhé!"
                },
                account_register: {
                    keys: ["dang ky", "tao tai khoan", "mo tai khoan", "dang ki", "lap tai khoan", "dangky", "dangki", "đăng ký", "tạo tài khoản", "mở tài khoản", "đăng kí", "lập tài khoản", "reg", "register", "signup"],
                    response: "Để đăng ký tài khoản mới, quý khách nhấn biểu tượng <i class='fa-regular fa-user'></i> ở góc trên bên phải màn hình, chọn 'Đăng ký tài khoản', nhập Họ tên, Email, Số điện thoại và Mật khẩu (độ dài ít nhất 8 ký tự, có 1 chữ hoa, 1 số và 1 ký tự đặc biệt) rồi nhấn nút đăng ký là xong!"
                },
                account_login: {
                    keys: ["dang nhap", "login", "khong vao duoc", "mat tai khoan", "dangnhap", "đăng nhập", "không vào được", "mất tài khoản", "sign in", "signin"],
                    response: "Quý khách vui lòng kiểm tra xem email hoặc mật khẩu nhập vào đã chính xác chưa (chú ý tắt Caps Lock và gõ tiếng Việt). Nếu vẫn báo lỗi, có thể tài khoản của quý khách chưa được đăng ký hoặc đang bị khóa, hãy liên hệ CSKH qua Hotline để được hỗ trợ kiểm tra."
                },
                account_password: {
                    keys: ["quen mat khau", "mat mat khau", "reset", "pass", "matkhau", "lay lai mat khau", "quen mk", "doi mat khau", "quên mật khẩu", "mất mật khẩu", "mật khẩu", "lấy lại mật khẩu", "quên mk", "đổi mật khẩu"],
                    response: "Nếu quên mật khẩu, quý khách vui lòng liên hệ Hotline 0866 853 758 hoặc Zalo CSKH để nhân viên kỹ thuật hỗ trợ đặt lại mật khẩu mới nhanh nhất cho mình nhé."
                },
                purchase_guide: {
                    keys: ["mua hang", "dat hang", "mua the nao", "huong dan mua", "muahang", "dathang", "huongdanmua", "mua hàng", "đặt hàng", "mua thế nào", "hướng dẫn mua", "cách mua", "mua sao", "order"],
                    response: "Quy trình mua hàng rất đơn giản: 1. Xem danh sách sản phẩm. 2. Nhấn vào sản phẩm, xem chi tiết và chọn 'Thêm vào giỏ hàng'. 3. Vào giỏ hàng kiểm tra, chọn các sản phẩm cần mua và bấm 'Thanh toán'. 4. Nhập thông tin nhận hàng, lựa chọn phương thức COD hoặc chuyển khoản qua VietQR rồi nhấn xác nhận đặt hàng."
                },
                payment_method: {
                    keys: ["thanh toan", "chuyen khoan", "banking", "vietqr", "cod", "tien mat", "tra tien", "atm", "ngan hang", "qr", "thanh toán", "chuyển khoản", "tiền mặt", "trả tiền", "ngân hàng", "momo", "zalopay"],
                    response: "Home Bedding hỗ trợ 2 phương thức thanh toán chính: 1. Thanh toán khi nhận hàng (COD). 2. Chuyển khoản ngân hàng trực tuyến qua mã VietQR tự động điền sẵn thông tin số tiền và nội dung chuyển khoản cực kỳ nhanh chóng."
                },
                shipping_delivery: {
                    keys: ["giao hang", "ship", "van chuyen", "bao lau", "may ngay", "nhan hang", "cuoc ship", "phi ship", "phi van chuyen", "mien phi ship", "free ship", "giao hàng", "vận chuyển", "bao lâu", "mấy ngày", "nhận hàng", "cước ship", "phí ship", "phí vận chuyển", "miễn phí ship", "freeship", "chuyển phát", "nhanh"],
                    response: "Home Bedding hỗ trợ **miễn phí giao hàng tiêu chuẩn toàn quốc** cho mọi đơn hàng từ 0đ. Thời gian nhận hàng nội thành HN/HCM là 1-2 ngày, khu vực tỉnh khác khoảng 3-5 ngày làm việc. Quý khách hoàn toàn được quyền **đồng kiểm** (mở hộp xem hàng trước khi thanh toán)."
                },
                discounts_promotions: {
                    keys: ["ma giam gia", "khuyen mai", "voucher", "coupon", "giam gia", "uong dai", "sale", "giamgia", "khuyenmai", "quatang", "tang kem", "mã giảm giá", "khuyến mãi", "giảm giá", "ưu đãi", "quà tặng", "tặng kèm", "khuyen mai", "giam gia", "km", "gg"],
                    response: "Hiện tại đang có chương trình khuyến mãi giảm giá đến 30% cho sản phẩm Tencel và tặng kèm 2 vỏ gối. Quý khách có thể xem và lấy mã giảm giá trực tiếp tại mục **'KHUYẾN MÃI'** trên trang chủ. Khi thanh toán, chỉ cần nhập mã giảm giá vào ô **'Nhập mã khuyến mãi'** để được áp dụng khấu trừ."
                },
                policies_warranty: {
                    keys: ["chinh sach", "bao hanh", "doi tra", "doi hang", "tra hang", "loi san pham", "rach", "hong", "baohanh", "doitra", "doi tra", "chính sách", "bảo hành", "đổi trả", "đổi hàng", "trả hàng", "lỗi sản phẩm", "rách", "hỏng", "hoàn tiền", "chất lượng", "bao hanh", "doi tra"],
                    response: "Home Bedding hỗ trợ **đổi trả miễn phí trong vòng 7 ngày** kể từ khi nhận hàng đối với sản phẩm còn nguyên tem mác và chưa qua sử dụng/giặt tẩy. Các sản phẩm chính hãng cũng được **bảo hành từ 6 đến 12 tháng** cho lỗi đường may, khóa kéo hoặc xẹp lún. Vui lòng liên hệ Hotline 0866 853 758 để được hỗ trợ bảo hành."
                },
                summer_bedding: {
                    keys: ["mua he", "he", "nong", "mat", "tencel", "cotton lua", "mat me", "thoang khi", "soi go", "mua he", "hè", "nóng", "mát", "mát mẻ", "thoáng khí", "sợi gỗ", "nóng bức"],
                    response: "Vào mùa hè nóng bức, quý khách nên ưu tiên chọn chăn ga làm từ sợi Tencel (sợi gỗ tự nhiên từ cây khuynh diệp) hoặc Cotton lụa. Chất liệu Tencel có đặc tính mát lạnh khi chạm vào, hút ẩm tốt, cực kỳ thoáng khí và êm dịu cho da."
                },
                winter_bedding: {
                    keys: ["mua dong", "dong", "lanh", "am", "chan bong", "long cuu", "giu nhiet", "mùa đông", "đông", "lạnh", "ấm", "chăn bông", "lông cừu", "giữ nhiệt", "rét"],
                    response: "Mùa đông lạnh quý khách nên chọn dòng Chăn lông cừu cao cấp hoặc Chăn bông Microfiber của Home Bedding. Các dòng chăn này giữ nhiệt cực tốt, siêu nhẹ, tạo cảm giác bồng bềnh êm ái mà không gây ngột ngạt."
                },
                product_prices: {
                    keys: ["gia", "bao nhieu", "tien", "bang gia", "giaca", "dat khong", "re khong", "giá", "bao nhiêu", "tiền", "bảng giá", "giá cả", "đắt không", "rẻ không", "nhiêu", "chi phí", "chiphi"],
                    response: "Các dòng sản phẩm của Home Bedding có giá dao động từ 150k (gối) đến 3-5 triệu đồng (các bộ chăn ga cao cấp). Quý khách có thể xem bảng giá chi tiết hiển thị trực tiếp dưới mỗi sản phẩm trên danh mục trang chủ."
                },
                washing_care: {
                    keys: ["giat", "ve sinh", "bao quan", "phoi", "nuoc giat", "giat tay", "giat may", "tay", "say", "giặt", "vệ sinh", "bảo quản", "phơi", "nước giặt", "giặt tay", "giặt máy", "tẩy", "sấy"],
                    response: "Khi giặt chất liệu cao cấp như Tencel: Nên dùng chế độ giặt nhẹ (Gentle/Wool), giặt nước lạnh (dưới 30°C), bỏ chăn ga vào túi giặt lớn, dùng nước giặt trung tính (không dùng chất tẩy rửa mạnh), không vắt quá khô và phơi ở nơi thoáng gió, tránh ánh nắng mặt trời chiếu trực tiếp."
                },
                mattress_care: {
                    keys: ["nem", "dem", "moc", "lun", "nệm", "đệm", "mốc", "lún"],
                    response: "Để nệm luôn bền sạch: 1. Sử dụng tấm bảo vệ nệm chống thấm. 2. Đặt nệm trên giường/giá đỡ thoáng khí, cách mặt đất ít nhất 10cm. 3. Định kỳ hút bụi bề mặt nệm và xoay chiều nệm 3 tháng/lần để nệm lún đều."
                },
                direct_contact: {
                    keys: ["lien he", "hotline", "gap nhan vien", "sdt", "dien thoai", "zalo", "cskh", "goi", "alo", "tong dai", "tu van", "liên hệ", "gặp nhân viên", "điện thoại", "tổng đài", "tư vấn", "chăm sóc"],
                    response: "Để gặp trực tiếp nhân viên tư vấn 24/7, quý khách vui lòng liên hệ Hotline/Zalo của Home Bedding: **0866 853 758**. Chúng tôi luôn sẵn sàng hỗ trợ quý khách!"
                },
                store_address: {
                    keys: ["cua hang", "dia chi", "showroom", "o dau", "chi nhanh", "cửa hàng", "địa chỉ", "ở đâu", "chi nhánh", "đường nào", "vị trí"],
                    response: "Quý khách có thể bấm vào nút 'Tìm cửa hàng' ở góc trên cùng của trang web để xem bản đồ chỉ đường và địa chỉ cụ thể các showroom của chúng tôi."
                }
            }
        };

        let activeTopic = null;

        const chatLauncherEl = document.getElementById('guestChatLauncher');
        const chatWindowEl = document.getElementById('guestChatWindow');
        const chatCloseEl = document.getElementById('guestChatClose');
        const chatMessagesEl = document.getElementById('guestChatMessages');
        const chatInputEl = document.getElementById('guestChatInput');
        const chatSendEl = document.getElementById('guestChatSend');
        const suggestionsEl = document.getElementById('guestChatSuggestions');
        const typingEl = document.getElementById('guestTyping');

        chatLauncherEl.addEventListener('click', () => {
            const isOpen = chatWindowEl.classList.toggle('open');
            if (isOpen) {
                chatWindowEl.style.display = 'flex';
                renderSuggestions();
                chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            } else {
                chatWindowEl.style.display = 'none';
            }
        });

        chatCloseEl.addEventListener('click', () => {
            chatWindowEl.classList.remove('open');
            chatWindowEl.style.display = 'none';
        });

        function renderSuggestions() {
            if (activeTopic === null) {
                let html = `<div style="font-size:11px; color:#888; font-weight:600; padding:2px 5px; font-family:'Quicksand', sans-serif;">CHỌN CHỦ ĐỀ CẦN TƯ VẤN:</div>`;
                botData.topics.forEach((t, index) => {
                    html += `<button class="guest-suggestion-btn" data-topic="${index}">${t.title}</button>`;
                });
                suggestionsEl.innerHTML = html;

                suggestionsEl.querySelectorAll('[data-topic]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.getAttribute('data-topic'));
                        selectTopic(idx);
                    });
                });
            } else {
                let html = `<div style="font-size:11px; color:#888; font-weight:600; padding:2px 5px; display:flex; justify-content:space-between; align-items:center; font-family:'Quicksand', sans-serif;">
                                <span>CÂU HỎI LIÊN QUAN:</span>
                                <span style="color:var(--primary-olive); cursor:pointer;" id="guestBackToTopics">← Quay lại</span>
                            </div>`;
                const topic = botData.topics[activeTopic];
                topic.questions.forEach((q, index) => {
                    html += `<button class="guest-suggestion-btn" data-question="${index}">${q.q}</button>`;
                });
                suggestionsEl.innerHTML = html;

                document.getElementById('guestBackToTopics').addEventListener('click', () => {
                    activeTopic = null;
                    renderSuggestions();
                });

                suggestionsEl.querySelectorAll('[data-question]').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const qIdx = parseInt(e.currentTarget.getAttribute('data-question'));
                        askPresetQuestion(qIdx);
                    });
                });
            }
        }

        function selectTopic(topicIndex) {
            activeTopic = topicIndex;
            const topic = botData.topics[topicIndex];
            
            addUserMessage(topic.title);
            showTyping();
            
            setTimeout(() => {
                hideTyping();
                addBotMessage(`Quý khách quan tâm đến <strong>${topic.title}</strong>, vui lòng chọn câu hỏi dưới đây hoặc đặt câu hỏi tự do nhé!`);
                renderSuggestions();
            }, 600);
        }

        function askPresetQuestion(qIndex) {
            const topic = botData.topics[activeTopic];
            const item = topic.questions[qIndex];
            
            addUserMessage(item.q);
            showTyping();
            
            setTimeout(() => {
                hideTyping();
                addBotMessage(item.a);
                renderSuggestions();
            }, 800);
        }

        function addUserMessage(text) {
            const msg = document.createElement('div');
            msg.className = 'guest-msg guest-msg-user';
            msg.innerText = text;
            chatMessagesEl.appendChild(msg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        }

        function addBotMessage(htmlText) {
            const msg = document.createElement('div');
            msg.className = 'guest-msg guest-msg-bot';
            msg.innerHTML = htmlText;
            chatMessagesEl.appendChild(msg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        }

        function showTyping() {
            chatMessagesEl.appendChild(typingEl);
            typingEl.style.display = 'block';
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        }

        function hideTyping() {
            typingEl.style.display = 'none';
            document.body.appendChild(typingEl);
        }

        chatSendEl.addEventListener('click', handleCustomInput);
        chatInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleCustomInput();
        });

        function handleCustomInput() {
            const text = chatInputEl.value.trim();
            if (!text) return;

            chatInputEl.value = '';
            addUserMessage(text);
            showTyping();

            setTimeout(() => {
                hideTyping();
                const response = processIntelligentResponse(text);
                addBotMessage(response);
            }, 1000);
        }

        function processIntelligentResponse(query) {
            const cleanQuery = removeVietnameseSigns(query.toLowerCase());
            
            const scores = {};
            for (const intent in botData.keywords) {
                scores[intent] = 0;
                const keys = botData.keywords[intent].keys;
                for (const key of keys) {
                    const cleanKey = removeVietnameseSigns(key);
                    
                    // Tránh lỗi regex với ký tự đặc biệt
                    const escapedKey = cleanKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                    
                    // Nếu từ khóa có khoảng trắng -> khớp nguyên cụm kèm khoảng trắng
                    // Nếu là 1 từ đơn -> bắt buộc khớp ranh giới từ (\b) để tránh "thế" khớp nhầm "hè" (he)
                    const regexStr = cleanKey.includes(' ') 
                        ? '(?:^|\\s)' + escapedKey + '(?:$|\\s)' 
                        : '\\b' + escapedKey + '\\b';
                    const regex = new RegExp(regexStr, 'i');
                    
                    if (regex.test(cleanQuery)) {
                        scores[intent] += 1;
                        if (cleanQuery === cleanKey) {
                            scores[intent] += 5;
                        } else if (cleanQuery.indexOf(cleanKey) === 0 || cleanQuery.indexOf(" " + cleanKey) !== -1) {
                            scores[intent] += 2;
                        }
                    }
                }
            }
            
            let bestIntent = null;
            let highestScore = 0;
            for (const intent in scores) {
                if (scores[intent] > highestScore) {
                    highestScore = scores[intent];
                    bestIntent = intent;
                }
            }
            
            if (highestScore > 0 && bestIntent) {
                return botData.keywords[bestIntent].response;
            }

            return "Xin lỗi, tôi chưa hiểu rõ ý của quý khách. Quý khách có thể nhập từ khóa ngắn gọn (ví dụ: 'vận chuyển', 'mã giảm giá', 'đổi trả'...) hoặc chọn câu hỏi gợi ý bên dưới. Ngoài ra, quý khách vui lòng **Đăng nhập** tài khoản để nhắn tin trực tiếp và nhận sự tư vấn trực tiếp từ nhân viên Home Bedding nhé!";
        }

        function removeVietnameseSigns(str) {
            return str
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/đ/g, "d")
                .replace(/Đ/g, "d");
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectRemaining);
    } else {
        injectRemaining();
    }
})();

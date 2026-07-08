document.addEventListener('DOMContentLoaded', () => {
    const fullName = localStorage.getItem('fullName');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname.toLowerCase();

    // Kiểm tra và khởi tạo chế độ Khách (Guest Mode) cho customer.html
    const isCustomerPage = currentPath.includes('customer.html');
    if (!token && isCustomerPage) {
        window.isGuest = true;
    }

    // Nếu không có token và không phải chế độ Khách của customer.html, chuyển về trang chủ
    if (!token && !window.isGuest) {
        window.location.href = 'index.html';
        return;
    }

    // Hàm thiết lập giao diện chế độ Khách (Guest Mode)
    function initGuestModeUI() {
        // 1. Ẩn các menu yêu cầu đăng nhập ở sidebar
        const loggedInMenuIds = [
            'menu-customer-wishlist', 'menu-customer-cart', 'menu-customer-orders',
            'menu-customer-reviews', 'menu-customer-consultation', 'menu-customer-complaints',
            'menu-customer-profile'
        ];
        loggedInMenuIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // 2. Ẩn các link sub-nav ngang
        const loggedInNavIds = [
            'nav-customer-wishlist', 'nav-customer-cart', 'nav-order-history',
            'nav-customer-reviews', 'nav-customer-consultation', 'nav-customer-complaints',
            'nav-customer-profile'
        ];
        loggedInNavIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.parentElement) el.parentElement.style.display = 'none';
        });

        // 3. Ẩn icon giỏ hàng ở Topbar
        const cartIcon = document.querySelector('.topbar-right .cart-icon');
        if (cartIcon) cartIcon.style.display = 'none';

        // 4. Đổi tên người dùng thành "Khách" và ảnh mặc định
        const userNameHeader = document.getElementById('user-name-header');
        if (userNameHeader) userNameHeader.textContent = 'Khách';
        const userImg = document.querySelector('.topbar-right .user-profile img');
        if (userImg) userImg.src = '/images/logo.png';

        // 5. Đổi nút "Đăng xuất" thành "Đăng nhập"
        const logoutLi = document.querySelector('.sidebar-bottom li');
        if (logoutLi) {
            logoutLi.innerHTML = `<a href="index.html?action=login"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</a>`;
        }
    }

    if (window.isGuest) {
        initGuestModeUI();
    }

    function showAuthErrorAndRedirect(message) {
        // Ẩn nội dung chính để tránh lộ UI
        document.body.style.display = 'none'; 
        
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = '#fdfdfd';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '999999';

        const msgBox = document.createElement('div');
        msgBox.style.backgroundColor = '#fff';
        msgBox.style.padding = '30px 40px';
        msgBox.style.borderRadius = '12px';
        msgBox.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
        msgBox.style.textAlign = 'center';
        msgBox.style.fontFamily = '"Quicksand", sans-serif';
        msgBox.style.border = '1px solid #ffcccc';

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        icon.style.fontSize = '50px';
        icon.style.color = '#e74c3c';
        icon.style.marginBottom = '15px';

        const text = document.createElement('h3');
        text.textContent = message;
        text.style.color = '#333';
        text.style.margin = '0 0 10px 0';
        text.style.fontSize = '20px';

        const subText = document.createElement('p');
        subText.textContent = 'Đang quay lại trang chủ...';
        subText.style.color = '#666';
        subText.style.fontSize = '15px';
        subText.style.margin = '0';

        msgBox.appendChild(icon);
        msgBox.appendChild(text);
        msgBox.appendChild(subText);
        overlay.appendChild(msgBox);
        document.documentElement.appendChild(overlay);

        setTimeout(() => {
            window.location.replace('index.html');
        }, 1000);
    }

    // Bảo mật: Role Guard - Kiểm tra quyền truy cập theo đường dẫn
    
    // Nếu vào trang admin mà role không phải admin -> Từ chối
    if (currentPath.includes('admin.html') && role !== 'admin') {
        showAuthErrorAndRedirect('Bạn không có quyền truy cập trang Quản trị!');
        return;
    }
    
    // Nếu vào trang staff mà role không phải staff -> Từ chối tuyệt đối
    if (currentPath.includes('staff.html') && role !== 'staff') {
        showAuthErrorAndRedirect('Bạn không có quyền truy cập trang Nhân viên!');
        return;
    }

    // Nếu vào trang customer mà role không phải customer -> Từ chối tuyệt đối trừ khi là Khách (chưa đăng nhập)
    if (currentPath.includes('customer.html') && !window.isGuest && role !== 'customer') {
        showAuthErrorAndRedirect('Bạn không có quyền truy cập trang Khách hàng!');
        return;
    }

    // Cập nhật tên người dùng trên giao diện và đồng bộ avatar khách hàng
    const userNameHeader = document.getElementById('user-name-header');
    const userImg = document.querySelector('.topbar-right .user-profile img');
    const userId = localStorage.getItem('userId');

    if (token && userId && isCustomerPage && !window.isGuest) {
        // Fetch thông tin cá nhân thời gian thực để đồng bộ avatar và họ tên
        fetch(`/api/users/profile/${userId}`)
            .then(res => {
                if (res.ok) return res.json();
                throw new Error('Profile fetch failed');
            })
            .then(data => {
                if (userNameHeader) {
                    userNameHeader.textContent = data.fullName || fullName;
                }
                if (userImg) {
                    if (data.avatar) {
                        userImg.src = data.avatar;
                    } else {
                        userImg.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.fullName || 'User') + '&background=7f866e&color=fff&size=100';
                    }
                }
            })
            .catch(err => {
                console.error('Lỗi đồng bộ thông tin header:', err);
                if (userNameHeader && fullName) {
                    userNameHeader.textContent = fullName;
                }
                if (userImg) {
                    userImg.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(fullName || 'User') + '&background=7f866e&color=fff&size=100';
                }
            });
    } else if (userNameHeader && fullName) {
        userNameHeader.textContent = fullName;
    }

    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage && fullName) {
        welcomeMessage.textContent = `Chào ${fullName}!`;
    }

    const staffUserName = document.getElementById('header-user-name');
    if (staffUserName && fullName) {
        staffUserName.textContent = fullName;
    }

    // Xử lý đăng xuất
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            localStorage.clear();
        });
    });

    if (role === 'admin') {
        if (typeof window.fetchAdminBadges === 'function') {
            window.fetchAdminBadges();
            setInterval(window.fetchAdminBadges, 5000); // Cập nhật mỗi 5 giây (real-time)
        }
        if (typeof window.fetchNotifications === 'function') {
            window.fetchNotifications();
            setInterval(window.fetchNotifications, 5000); // Cập nhật mỗi 5 giây (real-time)
        }
    }
});

window.fetchAdminBadges = async function() {
    try {
        const [staffChatRes, complaintRes] = await Promise.all([
            fetch('/api/staff-chat/admin/unread-count'),
            fetch('/api/complaints/unread-count')
        ]);
        
        let staffUnread = 0;
        let customerUnread = 0;
        
        if (staffChatRes.ok) {
            const data = await staffChatRes.json();
            staffUnread = data.count || 0;
        }
        if (complaintRes.ok) {
            const data = await complaintRes.json();
            customerUnread = data.count || 0;
        }
        
        const totalUnread = staffUnread + customerUnread;
        
        const mainBadge = document.getElementById('admin-complaint-badge');
        const customerBadge = document.getElementById('admin-customer-badge');
        const staffBadge = document.getElementById('admin-staff-badge');
        
        if (mainBadge) {
            if (totalUnread > 0) {
                mainBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                mainBadge.style.display = 'flex';
            } else {
                mainBadge.style.display = 'none';
            }
        }
        
        if (customerBadge) {
            if (customerUnread > 0) {
                customerBadge.textContent = customerUnread > 99 ? '99+' : customerUnread;
                customerBadge.style.display = 'inline-block';
            } else {
                customerBadge.style.display = 'none';
            }
        }
        
        if (staffBadge) {
            if (staffUnread > 0) {
                staffBadge.textContent = staffUnread > 99 ? '99+' : staffUnread;
                staffBadge.style.display = 'inline-block';
            } else {
                staffBadge.style.display = 'none';
            }
        }
        
    } catch (err) {
        console.error('Lỗi lấy badges admin:', err);
    }
};

// Map section → menu id tương ứng
const sectionMenuMap = {
    'dashboard-home': 'menu-home',
    'product-management': 'menu-products',
    'promotion-management': 'menu-promotions',
    'user-management': 'menu-users',
    'attendance-management': 'menu-attendance',
    'shift-management': 'menu-attendance',
    'salary-management': 'menu-attendance',
    'salary-view': 'menu-attendance',
    'stats-management': 'menu-reports-finance',
    'revenue-management': 'menu-reports-finance',
    'complaint-management': 'menu-complaints',
    'order-management': 'menu-orders',
    'customer-care': 'menu-customer',
    'customer-home': 'menu-customer-home',
    'customer-products': 'menu-customer-products',
    'customer-wishlist': 'menu-customer-wishlist',
    'customer-cart': 'menu-customer-cart',
    'order-history': 'menu-customer-orders',
    'customer-reviews': 'menu-customer-reviews',
    'consultation': 'menu-customer-consultation',
    'feedback-section': 'menu-customer-complaints',
    'customer-profile': 'menu-customer-profile',
    'report-admin': 'menu-report',
    'profile': 'menu-profile'
};

// Hàm chuyển section và highlight sidebar
window.showSection = function (sectionId, overrideMenuId = null) {
    // Ẩn tất cả section (admin hoặc staff)
    document.querySelectorAll('.admin-section, .staff-section, .customer-section').forEach(sec => sec.style.display = 'none');

    // Hiện section được chọn
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';

    // Highlight sidebar: bỏ active tất cả li chính
    document.querySelectorAll('.sidebar-menu li, .sidebar-bottom li').forEach(li => {
        li.classList.remove('active');
    });

    // Đóng tất cả submenu
    document.querySelectorAll('.has-submenu, .sub-menu, .submenu').forEach(el => el.classList.remove('open'));

    // Active dòng menu sidebar
    const menuId = overrideMenuId || sectionMenuMap[sectionId];
    if (menuId) {
        const menuEl = document.getElementById(menuId);
        if (menuEl) {
            menuEl.classList.add('active');
            // Nếu là menu có submenu, tự động mở
            if (menuEl.classList.contains('has-submenu') || menuEl.querySelector('.sub-menu, .submenu')) {
                menuEl.classList.add('open');
            }
            // Dành cho submenu của admin (.sub-menu)
            const subMenu = menuEl.querySelector('.sub-menu, .submenu');
            if (subMenu) {
                subMenu.classList.add('open');
            }
        }
    }

    // Active sub-menu item trong sidebar
    document.querySelectorAll('.sub-menu a, .submenu a').forEach(a => a.classList.remove('active-sub'));
    if (menuId) {
        const menuEl = document.getElementById(menuId);
        if (menuEl) {
            const subLinks = menuEl.querySelectorAll('.sub-menu a, .submenu a');
            subLinks.forEach(a => {
                const onclickVal = a.getAttribute('onclick') || '';
                if (onclickVal.includes(`'${sectionId}'`) || onclickVal.includes(`"${sectionId}"`)) {
                    a.classList.add('active-sub');
                }
            });
        }
    }

    // Active sub-nav (menu ngang)
    document.querySelectorAll('.sub-nav a').forEach(a => a.classList.remove('active'));
    const topNavId = 'nav-' + sectionId;
    const topNavEl = document.getElementById(topNavId);
    if (topNavEl) topNavEl.classList.add('active');

    // Cập nhật placeholder cho ô tìm kiếm
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        if (sectionId === 'customer-reviews') {
            searchBar.style.visibility = 'hidden';
        } else {
            searchBar.style.visibility = 'visible';
        }
    }
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        if (sectionId === 'order-history') {
            searchInput.placeholder = 'Tìm kiếm đơn hàng...';
        } else if (sectionId === 'customer-cart') {
            searchInput.placeholder = 'Tìm kiếm trong giỏ hàng...';
        } else if (sectionId === 'customer-wishlist') {
            searchInput.placeholder = 'Tìm kiếm yêu thích...';
        } else {
            searchInput.placeholder = 'Tìm kiếm sản phẩm...';
        }
    }


};

// Hàm toggle submenu (dành cho menu có mục con)
window.toggleSubmenu = function (event, menuId) {
    event.preventDefault();
    const menuEl = document.getElementById(menuId);
    if (menuEl) {
        menuEl.classList.add('open');
        // Khi mở submenu thì cũng highlight cha luôn
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        menuEl.classList.add('active');
    }
};

// ================= HỆ THỐNG THÔNG BÁO ADMIN =================

window.toggleNotificationDropdown = function (event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('adminNotificationDropdown');
    if (dropdown) {
        const isHidden = dropdown.style.display === 'none';
        dropdown.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            window.fetchNotifications();
        }
    }
};

// Đóng dropdown khi click ngoài
document.addEventListener('click', (event) => {
    const dropdown = document.getElementById('adminNotificationDropdown');
    const bell = document.getElementById('adminNotificationBell');
    if (dropdown && dropdown.style.display !== 'none') {
        if (!dropdown.contains(event.target) && !bell.contains(event.target)) {
            dropdown.style.display = 'none';
        }
    }
});

// Hàm định dạng thời gian
function formatNotificationTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Hàm lấy icon theo loại thông báo
function getNotificationIcon(type) {
    switch (type) {
        case 'attendance':
            return '<i class="fa-solid fa-user-clock"></i>';
        case 'new_customer':
            return '<i class="fa-solid fa-user-plus"></i>';
        case 'new_order':
            return '<i class="fa-solid fa-cart-shopping"></i>';
        case 'support_request':
            return '<i class="fa-solid fa-envelope-open-text"></i>';
        case 'newsletter_subscribe':
            return '<i class="fa-solid fa-paper-plane"></i>';
        default:
            return '<i class="fa-solid fa-bell"></i>';
    }
}

// Fetch danh sách thông báo
window.fetchNotifications = async function () {
    try {
        const res = await fetch('/api/notifications');
        if (!res.ok) throw new Error('Không thể lấy thông báo');
        const notifications = await res.json();
        
        // Sắp xếp thông báo mới nhất lên đầu
        notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Cập nhật số lượng chưa đọc
        const unreadCount = notifications.filter(n => !n.isRead).length;
        const badge = document.getElementById('adminNotificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // Render danh sách
        const listContainer = document.getElementById('adminNotificationList');
        if (listContainer) {
            if (notifications.length === 0) {
                listContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 25px 15px; font-size: 13px;">Không có thông báo nào</div>';
                return;
            }

            listContainer.innerHTML = notifications.map(n => {
                const unreadClass = n.isRead ? '' : 'unread';
                const iconClass = n.type || 'default';
                const timeStr = formatNotificationTime(n.createdAt);
                const dotHtml = n.isRead ? '' : '<div class="notification-unread-dot"></div>';
                
                // Tránh ký tự đặc biệt làm hỏng chuỗi JSON truyền vào onClick
                const safeNotifStr = JSON.stringify(n).replace(/'/g, "\\'").replace(/"/g, '&quot;');
                
                return `
                    <div class="notification-item ${unreadClass}" onclick="handleNotificationClick('${n._id}', ${safeNotifStr})">
                        <div class="notification-icon-wrapper ${iconClass}">
                            ${getNotificationIcon(n.type)}
                        </div>
                        <div class="notification-content-wrapper">
                            <h5 class="notification-item-title">${n.title}</h5>
                            <p class="notification-item-content">${n.content}</p>
                            <span class="notification-item-time">${timeStr}</span>
                        </div>
                        ${dotHtml}
                    </div>
                `;
            }).join('');
        }
    } catch (err) {
        console.error('Lỗi fetch notifications:', err);
    }
};

// Đánh dấu tất cả thông báo là đã đọc
window.markAllNotificationsAsRead = async function (event) {
    if (event) event.stopPropagation();
    try {
        const res = await fetch('/api/notifications/mark-all-read', { method: 'PUT' });
        if (res.ok) {
            window.fetchNotifications();
        }
    } catch (err) {
        console.error('Lỗi khi đánh dấu đọc tất cả:', err);
    }
};

// Xử lý khi click vào từng thông báo
window.handleNotificationClick = async function (id, notification) {
    try {
        // Đánh dấu đã đọc qua API
        await fetch(`/api/notifications/mark-read/${id}`, { method: 'PUT' });
        
        // Ẩn dropdown
        const dropdown = document.getElementById('adminNotificationDropdown');
        if (dropdown) dropdown.style.display = 'none';
        
        // Làm mới lại badge và danh sách
        window.fetchNotifications();

        // Điều hướng tùy thuộc vào loại thông báo
        const type = notification.type;
        const meta = notification.metadata || {};

        if (type === 'attendance') {
            // Chấm công & Lương
            showSection('attendance-management');
        } else if (type === 'new_customer') {
            // Quản lý tài khoản
            showSection('user-management');
        } else if (type === 'new_order') {
            // Đơn hàng
            showSection('order-management');
            if (meta.orderId && typeof openOrderModal === 'function') {
                openOrderModal(meta.orderId);
            }
        } else if (type === 'support_request') {
            // Khách vãng lai gửi yêu cầu hỗ trợ (chỉ xem, không xử lý)
            const modalContent = document.getElementById('adminSupportRequestContent');
            if (modalContent) {
                // Đảm bảo đổi lại tiêu đề modal cho đúng loại
                const modalTitle = document.querySelector('#adminSupportRequestDetailModal h3');
                if (modalTitle) {
                    modalTitle.innerHTML = `<i class="fa-solid fa-envelope-open-text"></i> Chi tiết yêu cầu hỗ trợ`;
                }
                modalContent.innerHTML = `
                    <div style="background: #fafbf9; padding: 12px; border-radius: 8px; border-left: 4px solid var(--primary-olive);">
                        <p style="margin: 4px 0;"><strong>Họ và tên:</strong> ${meta.name || 'Khách vãng lai'}</p>
                        <p style="margin: 4px 0;"><strong>Số điện thoại:</strong> ${meta.phone || 'N/A'}</p>
                        <p style="margin: 4px 0;"><strong>Email:</strong> ${meta.email || 'N/A'}</p>
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>Nội dung yêu cầu hỗ trợ:</strong>
                        <p style="background: #fdfdfd; border: 1px solid #eee; padding: 12px; border-radius: 8px; font-style: italic; white-space: pre-wrap; margin-top: 5px;">${meta.message || 'Không có nội dung'}</p>
                    </div>
                    <div style="margin-top: 15px; font-size: 12px; color: #999;">
                        <strong>Ngày gửi:</strong> ${new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </div>
                `;
                
                if (typeof openModal === 'function') {
                    openModal('adminSupportRequestDetailModal');
                } else {
                    document.getElementById('adminSupportRequestDetailModal').style.display = 'block';
                }
            }
        } else if (type === 'newsletter_subscribe') {
            // Đăng ký nhận tin & ưu đãi (chỉ xem, không xử lý)
            const modalContent = document.getElementById('adminSupportRequestContent');
            if (modalContent) {
                // Đổi tiêu đề modal
                const modalTitle = document.querySelector('#adminSupportRequestDetailModal h3');
                if (modalTitle) {
                    modalTitle.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Chi tiết đăng ký nhận tin`;
                }
                modalContent.innerHTML = `
                    <div style="background: #fafbf9; padding: 15px; border-radius: 8px; border-left: 4px solid var(--primary-olive); text-align: center;">
                        <p style="margin: 0; font-size: 15px;"><strong>Email đăng ký nhận tin:</strong></p>
                        <p style="margin: 10px 0 0 0; font-size: 16px; color: var(--primary-olive-dark); font-weight: bold; word-break: break-all;">${meta.email || 'N/A'}</p>
                    </div>
                    <div style="margin-top: 15px; font-size: 12px; color: #999;">
                        <strong>Ngày đăng ký:</strong> ${new Date(notification.createdAt).toLocaleString('vi-VN')}
                    </div>
                `;
                
                if (typeof openModal === 'function') {
                    openModal('adminSupportRequestDetailModal');
                } else {
                    document.getElementById('adminSupportRequestDetailModal').style.display = 'block';
                }
            }
        }
    } catch (err) {
        console.error('Lỗi khi click thông báo:', err);
    }
};

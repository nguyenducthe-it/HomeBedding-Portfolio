// Mở modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'block';
}

// Đóng modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Đóng modal khi click ra ngoài vùng form
window.onclick = function (event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
    }
}

// Hiện/Ẩn mật khẩu
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// Tự động nhận diện Role khi nhập email
async function detectUserRole(identifier) {
    if (!identifier) return;

    try {
        const res = await fetch(`/api/auth/check-role/${identifier}`);
        const data = await res.json();

        const roleIndicator = document.getElementById('roleIndicator');
        const detectedRoleText = document.getElementById('detectedRoleText');

        if (data.role && data.role !== 'guest') {
            roleIndicator.style.display = 'block';
            let roleName = '';
            let roleColor = '';

            if (data.role === 'admin') {
                roleName = 'QUẢN TRỊ VIÊN';
                roleColor = '#d9534f'; // Màu đỏ cho Admin
            } else if (data.role === 'staff') {
                roleName = 'NHÂN VIÊN';
                roleColor = '#f0ad4e'; // Màu vàng cho Staff
            } else {
                roleName = 'KHÁCH HÀNG';
                roleColor = '#5bc0de'; // Màu xanh cho Customer
            }

            detectedRoleText.textContent = roleName;
            detectedRoleText.style.color = roleColor;
        } else {
            roleIndicator.style.display = 'none';
        }
    } catch (err) {
        console.error('Error detecting role:', err);
    }
}

// Hiển thị thông báo Toast
function showToast(message, type = 'success') {
    // Tạo container nếu chưa có
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Tạo element toast
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;

    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Hiển thị (Animation)
    setTimeout(() => toast.classList.add('show'), 10);

    // Tự xóa sau 3 giây
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// Khởi tạo các sự kiện cho Form Đăng ký / Đăng nhập (dùng cho cả tĩnh và động)
window.initAuthForms = function () {
    // Xử lý Đăng ký
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        if (!signupForm.dataset.listenerAttached) {
            signupForm.dataset.listenerAttached = 'true';
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const fullName = document.getElementById('signupFullName').value;
                const email = document.getElementById('signupEmail').value;
                const phone = document.getElementById('signupPhone').value;
                const password = document.getElementById('signupPassword').value;

                // --- Frontend Validation ---

                // 0. Kiểm tra trống
                if (!fullName || !email || !phone || !password) {
                    showToast('Vui lòng điền đầy đủ các trường!', 'error');
                    return;
                }

                // 1. Kiểm tra Email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Email không đúng định dạng!', 'error');
                    return;
                }

                // 2. Kiểm tra Số điện thoại
                const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
                if (!phoneRegex.test(phone)) {
                    showToast('Số điện thoại không hợp lệ!', 'error');
                    return;
                }

                // 3. Kiểm tra Mật khẩu
                const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(password)) {
                    showToast('Mật khẩu chưa đủ mạnh!', 'error');
                    return;
                }

                try {
                    const res = await fetch('/api/auth/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ fullName, email, phone, password })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        showToast('Đăng ký thành công! Hãy đăng nhập.');
                        closeModal('signupModal');
                        openModal('loginModal');
                    } else {
                        showToast(data.message || 'Đăng ký thất bại', 'error');
                    }
                } catch (err) {
                    console.error('Error:', err);
                    showToast('Lỗi kết nối server', 'error');
                }
            });
        }
    }

    // Xử lý Đăng nhập
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        if (!loginForm.dataset.listenerAttached) {
            loginForm.dataset.listenerAttached = 'true';
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;

                if (!email || !password) {
                    showToast('Vui lòng nhập Email và Mật khẩu!', 'error');
                    return;
                }

                try {
                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email, password })
                    });

                    const data = await res.json();

                    if (res.ok) {
                        // Lưu token và thông tin vào localStorage
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('userId', data.userId);
                        localStorage.setItem('role', data.role);
                        localStorage.setItem('fullName', data.fullName);

                        showToast('Đăng nhập thành công! Đang chuyển hướng...');

                        // Đợi 1.5s để hiện toast rồi chuyển hướng
                        setTimeout(() => {
                            if (data.role === 'customer') window.location.href = 'customer.html';
                            else if (data.role === 'staff') window.location.href = 'staff.html';
                            else if (data.role === 'admin') window.location.href = 'admin.html';
                        }, 1500);
                    } else {
                        showToast(data.message || 'Đăng nhập thất bại', 'error');
                    }
                } catch (err) {
                    console.error('Error:', err);
                    showToast('Lỗi kết nối server', 'error');
                }
            });
        }
    }
};

// Đăng ký kích hoạt khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', window.initAuthForms);

const themeMap = {
    '#F0F4EC': { bg: '#F0F4EC', primary: '#5e8075', dark: '#446157', light: '#92b5a9' }, // Xanh ngọc
    '#FDF9F1': { bg: '#FDF9F1', primary: '#c49a6c', dark: '#a37b51', light: '#d8b998' }, // Kem sữa
    '#FDF5F6': { bg: '#FDF5F6', primary: '#d4889a', dark: '#b0697a', light: '#e3a8b4' }, // Hồng phớt
    '#F0F4F8': { bg: '#F0F4F8', primary: '#7fa4c7', dark: '#5b82a3', light: '#9bb7d4' }, // Xanh lơ
    '#F5F6F8': { bg: '#F5F6F8', primary: '#7f866e', dark: '#5a6b53', light: '#e8eee6' }  // Mặc định
};

function applyThemeVars(color) {
    const t = themeMap[color] || themeMap['#F5F6F8'];
    // Màu nền
    document.documentElement.style.setProperty('--bg-color', t.bg);
    document.documentElement.style.setProperty('--bg-main', t.bg);
    document.documentElement.style.setProperty('--bg-sidebar', t.bg);
    document.documentElement.style.setProperty('--background-color', t.bg);
    
    // Màu nhấn (nút, viền, text)
    document.documentElement.style.setProperty('--primary-olive', t.primary);
    document.documentElement.style.setProperty('--primary-olive-dark', t.dark);
    document.documentElement.style.setProperty('--primary-olive-light', t.light);
    document.documentElement.style.setProperty('--primary-color', t.primary);

    // Chuyển đổi mã màu Hex sang RGB để hỗ trợ màu bán trong suốt (rgba) trong CSS
    const hex = t.primary.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--primary-olive-rgb', `${r}, ${g}, ${b}`);

    // Áp dụng bộ ảnh banner tùy biến theo màu sắc (có nhiều lớp dự phòng nếu thiếu ảnh)
    let customBanners = {};
    try {
        const cached = localStorage.getItem('bannerImages');
        if (cached) customBanners = JSON.parse(cached);
    } catch(e) {}

    const defaultImages = {
        '#FDF9F1': [
            'url("../images/cream1.jpg")',
            'url("../images/cream2.jpg")',
            'url("../images/cream3.jpg")',
            'url("../images/cream1.jpg")',
            'url("../images/cream5.jpg")'
        ],
        '#FDF5F6': [
            'url("../images/pink1.jpg")',
            'url("../images/pink2.jpg")',
            'url("../images/pink3.jpg")',
            'url("../images/pink1.jpg")',
            'url("../images/pink5.jpg")'
        ],
        '#F0F4F8': [
            'url("../images/blue1.jpg")',
            'url("../images/blue2.jpg")',
            'url("../images/blue3.jpg")',
            'url("../images/blue1.jpg")',
            'url("../images/blue5.jpg")'
        ],
        'default': [
            'url("../images/Mau (1).jpg")',
            'url("../images/Mau (2).jpg")',
            'url("../images/Mau (3).jpg")',
            'url("../images/Mau (1).jpg")',
            'url("../images/Mau5.jpg")'
        ]
    };

    const bannerList = customBanners[color] || [];
    const defaults = defaultImages[color] || defaultImages['default'];
    const greenDefaults = defaultImages['default'];

    for (let i = 1; i <= 5; i++) {
        const idx = i - 1;
        const customUrl = bannerList[idx] ? `url("${bannerList[idx]}")` : null;
        const defUrl = defaults[idx];
        const greenUrl = greenDefaults[idx];

        let fallbacks = [];
        if (customUrl) fallbacks.push(customUrl);
        fallbacks.push(defUrl);
        if (defUrl !== greenUrl) fallbacks.push(greenUrl);
        fallbacks.push('url("../images/new_banner.png")'); // fallback cuối cùng nếu thiếu tất cả

        document.documentElement.style.setProperty(`--banner-img-${i}`, fallbacks.join(', '));
    }
}

// 1. Tải ngay lập tức từ Cache (chống chớp giật)
const savedTheme = localStorage.getItem('themeColor');
if (savedTheme) {
    applyThemeVars(savedTheme);
}

// Inject styles for custom dialogs matching the system theme colors
const customDialogStyle = document.createElement('style');
customDialogStyle.textContent = `
    .custom-dialog-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s ease-in-out;
        font-family: 'Quicksand', sans-serif;
    }
    .custom-dialog-overlay.show {
        opacity: 1;
    }
    .custom-dialog-box {
        background: white;
        padding: 30px;
        border-radius: 16px;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        width: 90%;
        max-width: 440px;
        text-align: center;
        transform: scale(0.85);
        transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: 3px solid var(--primary-color, #7f866e);
    }
    .custom-dialog-overlay.show .custom-dialog-box {
        transform: scale(1);
    }
    .custom-dialog-icon {
        font-size: 45px;
        color: var(--primary-color, #7f866e);
        margin-bottom: 15px;
    }
    .custom-dialog-icon.warning {
        color: #bc6c25;
    }
    .custom-dialog-icon.error {
        color: #e74c3c;
    }
    .custom-dialog-title {
        font-size: 20px;
        font-weight: 700;
        color: #333;
        margin-bottom: 10px;
    }
    .custom-dialog-msg {
        font-size: 15px;
        color: #555;
        margin-bottom: 22px;
        line-height: 1.6;
        word-break: break-word;
        white-space: pre-line;
    }
    .custom-dialog-btns {
        display: flex;
        justify-content: center;
        gap: 15px;
    }
    .custom-dialog-btn {
        padding: 10px 28px;
        border-radius: 25px;
        border: none;
        font-weight: 700;
        cursor: pointer;
        font-family: 'Quicksand', sans-serif;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    .custom-dialog-btn.btn-confirm {
        background-color: var(--primary-color, #7f866e);
        color: white;
    }
    .custom-dialog-btn.btn-confirm:hover {
        background-color: var(--primary-olive-dark, #5a6b53);
        transform: translateY(-2px);
    }
    .custom-dialog-btn.btn-cancel {
        background-color: #f1f2f6;
        color: #555;
        border: 1px solid #ddd;
    }
    .custom-dialog-btn.btn-cancel:hover {
        background-color: #e4e7eb;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(customDialogStyle);

// Beautiful Promise-based Alert and Confirm implementation
window.customAlert = function(message, type = 'info') {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
        let titleText = 'Thông Báo Hệ Thống';
        
        if (type === 'success') {
            iconHtml = '<i class="fa-solid fa-circle-check"></i>';
            titleText = 'Thành Công';
        } else if (type === 'warning') {
            iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
            titleText = 'Cảnh Báo';
        } else if (type === 'error') {
            iconHtml = '<i class="fa-solid fa-circle-xmark"></i>';
            titleText = 'Lỗi Hệ Thống';
        }
        
        overlay.innerHTML = `
            <div class="custom-dialog-box">
                <div class="custom-dialog-icon ${type}">${iconHtml}</div>
                <div class="custom-dialog-title">${titleText}</div>
                <div class="custom-dialog-msg">${message}</div>
                <div class="custom-dialog-btns">
                    <button class="custom-dialog-btn btn-confirm">Xác nhận</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 10);
        
        overlay.querySelector('.btn-confirm').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve();
            }, 200);
        };
    });
};

window.customConfirm = function(message) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-dialog-overlay';
        
        overlay.innerHTML = `
            <div class="custom-dialog-box">
                <div class="custom-dialog-icon warning"><i class="fa-solid fa-triangle-exclamation"></i></div>
                <div class="custom-dialog-title">Cảnh Báo Nguy Hiểm</div>
                <div class="custom-dialog-msg">${message}</div>
                <div class="custom-dialog-btns">
                    <button class="custom-dialog-btn btn-cancel">Hủy bỏ</button>
                    <button class="custom-dialog-btn btn-confirm">Xác nhận</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => overlay.classList.add('show'), 10);
        
        overlay.querySelector('.btn-confirm').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve(true);
            }, 200);
        };
        
        overlay.querySelector('.btn-cancel').onclick = () => {
            overlay.classList.remove('show');
            setTimeout(() => {
                overlay.remove();
                resolve(false);
            }, 200);
        };
    });
};

// Expose overrides if any old scripts use standard synchronous alerts
window.alert = function(msg) {
    window.customAlert(msg);
};
window.confirm = function(msg) {
    console.warn("Synchronous confirm not supported, please use customConfirm");
    return true; // fallback
};

// ─── Global Toast dùng CSS variable — theo màu theme ─────────────────────────
(function injectToastStyles() {
    const s = document.createElement('style');
    s.textContent = `
        #customToastContainer {
            position: fixed;
            bottom: 28px;
            right: 28px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 99999;
            pointer-events: none;
        }
        .custom-toast {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 13px 20px;
            border-radius: 12px;
            font-family: 'Quicksand', sans-serif;
            font-size: 14px;
            font-weight: 600;
            color: #fff;
            box-shadow: 0 6px 24px rgba(0,0,0,0.18);
            opacity: 0;
            transform: translateY(12px);
            transition: opacity 0.3s, transform 0.3s;
            pointer-events: auto;
            max-width: 340px;
            word-break: break-word;
        }
        .custom-toast.show {
            opacity: 1;
            transform: translateY(0);
        }
        .custom-toast.toast-success { background: var(--primary-color, #7f866e); }
        .custom-toast.toast-error   { background: #e53e3e; }
        .custom-toast.toast-warning { background: #d97706; }
        .custom-toast.toast-info    { background: #555; }
    `;
    document.head.appendChild(s);
})();

function getToastContainer() {
    let c = document.getElementById('customToastContainer');
    if (!c) {
        c = document.createElement('div');
        c.id = 'customToastContainer';
        document.body.appendChild(c);
    }
    return c;
}

window.customToast = function(message, type = 'success', duration = 3000) {
    const icons = {
        success: 'fa-circle-check',
        error:   'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info:    'fa-circle-info'
    };
    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i> ${message}`;
    getToastContainer().appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('show'));
    });

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 350);
    }, duration);
};

// 2. Tải nền tảng từ Database để đồng bộ mới nhất (Đồng bộ cả màu và bộ ảnh banner)
Promise.all([
    fetch('/api/settings/themeColor').then(res => res.json()).catch(() => null),
    fetch('/api/settings/banner_images').then(res => res.json()).catch(() => null)
]).then(([themeData, bannerData]) => {
    let changed = false;
    if (themeData && themeData.value && themeData.value !== savedTheme) {
        localStorage.setItem('themeColor', themeData.value);
        changed = true;
    }
    if (bannerData && bannerData.value) {
        const bannerStr = JSON.stringify(bannerData.value);
        if (bannerStr !== localStorage.getItem('bannerImages')) {
            localStorage.setItem('bannerImages', bannerStr);
            changed = true;
        }
    }
    if (changed) {
        const color = localStorage.getItem('themeColor') || '#F5F6F8';
        applyThemeVars(color);
    }
}).catch(err => console.log('Không tải được cấu hình giao diện', err));






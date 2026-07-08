// ===== THỐNG KÊ DASHBOARD =====

let currentTopCustomers = [];

async function fetchStats() {
    const picker = document.getElementById('statsMonthPicker');
    if (!picker) return;

    // Đặt tháng mặc định nếu chưa chọn
    if (!picker.value) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        picker.value = `${y}-${m}`;
    }

    const month = picker.value;

    // Hiện loading
    document.getElementById('topProductsList').innerHTML = '<div class="stats-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';
    document.getElementById('topStaffList').innerHTML    = '<div class="stats-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';
    document.getElementById('topCustomersList').innerHTML = '<div class="stats-loading"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';

    try {
        const res  = await fetch(`/api/attendance/stats?month=${month}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        renderOverview(data.overview);
        renderTopProducts(data.topProducts);
        renderTopStaff(data.topStaff);
        
        currentTopCustomers = data.topCustomers || [];
        renderTopCustomers();
    } catch (err) {
        console.error('Lỗi tải thống kê:', err);
        showToast('Không thể tải dữ liệu thống kê!', 'error');
    }
}

// --- Render cards tổng quan ---
function renderOverview(ov) {
    const animate = (el, target, prefix = '', suffix = '') => {
        if (!el) return;
        let cur = 0;
        const step = Math.max(1, Math.ceil(target / 40));
        const timer = setInterval(() => {
            cur = Math.min(cur + step, target);
            el.textContent = prefix + cur.toLocaleString('vi-VN') + suffix;
            if (cur >= target) clearInterval(timer);
        }, 25);
    };

    animate(document.getElementById('ov-products'),  ov.totalProducts);
    animate(document.getElementById('ov-staff'),      ov.totalStaff);
    animate(document.getElementById('ov-customers'),  ov.totalCustomers);
    animate(document.getElementById('ov-shifts'),     ov.totalShiftsThisMonth);
    animate(document.getElementById('ov-orders'),     ov.completedOrders);
    animate(document.getElementById('ov-revenue'),    Math.round((ov.totalRevenue || 0) / 1000), '', 'K đ');
}

// --- Render Top 5 sản phẩm bán chạy (từ đơn hoàn thành) ---
function renderTopProducts(products) {
    const container = document.getElementById('topProductsList');
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="stats-empty"><i class="fa-solid fa-box-open"></i><br>Chưa có đơn hàng hoàn thành trong tháng này</div>';
        return;
    }

    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
    const medals = ['🥇', '🥈', '🥉', '4', '5'];

    container.innerHTML = products.map((p, i) => {
        // Aggregate trả về _id, productName, productImage, totalSold, totalRevenue
        const imgSrc = p.productImage || 'https://placehold.co/42x42/e8e8e8/999?text=IMG';
        const revenue = (p.totalRevenue || 0).toLocaleString('vi-VN');

        return `
            <div class="stats-item">
                <div class="stats-rank ${rankClasses[i]}">${medals[i]}</div>
                <img class="stats-item-img" src="${imgSrc}" alt="${p.productName}"
                    onerror="this.src='https://placehold.co/42x42/e8e8e8/999?text=IMG'">
                <div class="stats-item-info">
                    <div class="stats-item-name">${p.productName}</div>
                    <div class="stats-item-sub" style="color:var(--primary-olive);">Doanh thu: ${revenue} đ</div>
                </div>
                <div class="stats-item-value">
                    <div style="font-size:15px; color:#d9534f; font-weight:800;">${p.totalSold}</div>
                    <div style="font-size:10px; color:#999; font-weight:500;">đã bán</div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Render Top 5 nhân viên xuất sắc ---
function renderTopStaff(staffList) {
    const container = document.getElementById('topStaffList');
    if (!staffList || staffList.length === 0) {
        container.innerHTML = '<div class="stats-empty"><i class="fa-solid fa-user-slash"></i><br>Chưa có dữ liệu chấm công tháng này</div>';
        return;
    }

    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    const shiftColors = ['#f0ad4e', '#17a2b8', 'var(--primary-olive)', '#aaa', '#aaa'];
    const avatarColors = ['var(--primary-olive)','#17a2b8','#f0ad4e','#d9534f','#6f42c1'];

    // Tính max ca tối đa trong tháng đang chọn (số ngày × 2 ca/ngày)
    const picker = document.getElementById('statsMonthPicker');
    const monthVal = picker ? picker.value : '';
    let maxShiftsInMonth = 62; // Mặc định: 31 ngày × 2 ca
    if (monthVal) {
        const [y, m] = monthVal.split('-').map(Number);
        const daysInMonth = new Date(y, m, 0).getDate();
        maxShiftsInMonth = daysInMonth * 2;
    }

    container.innerHTML = staffList.map((s, i) => {
        const initial = s.fullName ? s.fullName.trim().slice(-1).toUpperCase() : 'N';
        const avatarColor = avatarColors[i % avatarColors.length];

        // % so với tổng ca tối đa có thể làm trong tháng
        const progressPct = Math.min(100, Math.round((s.workedShifts / maxShiftsInMonth) * 100));

        const avatarHtml = s.avatar 
            ? `<img src="${s.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; flex-shrink:0;" onerror="this.outerHTML='<div style=&quot;width:42px; height:42px; border-radius:50%; background:${avatarColor}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0;&quot;>${initial}</div>'">`
            : `<div style="
                width:42px; height:42px; border-radius:50%;
                background:${avatarColor}; color:#fff;
                display:flex; align-items:center; justify-content:center;
                font-weight:800; font-size:16px; flex-shrink:0;">
                ${initial}
               </div>`;

        return `
            <div class="stats-item">
                <div class="stats-rank ${rankClasses[i]}">${medals[i]}</div>
                ${avatarHtml}
                <div class="stats-item-info">
                    <div class="stats-item-name">${s.fullName}</div>
                    <div class="stats-item-sub" style="margin-bottom:4px;">${s.staffId}</div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <div style="flex:1; height:5px; background:#eee; border-radius:5px; overflow:hidden;">
                            <div style="width:${progressPct}%; height:100%; background:${shiftColors[i]}; border-radius:5px; transition:width 0.8s ease;"></div>
                        </div>
                        <span style="font-size:11px; color:#aaa; min-width:28px; text-align:right;">${progressPct}%</span>
                    </div>
                </div>
                <div class="stats-item-value" style="color:${shiftColors[i]};">
                    <div style="font-size:15px; font-weight:800;">${s.workedShifts}</div>
                    <div style="font-size:10px; color:#999; font-weight:500;">/ ${maxShiftsInMonth} ca</div>
                </div>
            </div>
        `;
    }).join('');
}

// --- Render Top Khách hàng tiềm năng ---
function renderTopCustomers() {
    const container = document.getElementById('topCustomersList');
    if (!currentTopCustomers || currentTopCustomers.length === 0) {
        container.innerHTML = '<div class="stats-empty"><i class="fa-solid fa-user-slash"></i><br>Chưa có dữ liệu khách hàng</div>';
        return;
    }

    const filter = document.getElementById('topCustomerFilter').value;
    
    let sorted = [...currentTopCustomers];
    if (filter === 'orders') {
        sorted.sort((a, b) => b.totalOrders - a.totalOrders);
    } else {
        sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    }
    
    sorted = sorted.slice(0, 5);

    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-other', 'rank-other'];
    const medals = ['🥇', '🥈', '🥉', '4', '5'];
    const avatarColors = ['#9b59b6', '#3498db', '#e67e22', '#2ecc71', '#34495e'];

    container.innerHTML = sorted.map((c, i) => {
        const name = c.customerName || c._id || 'Khách vãng lai';
        const initial = name.trim().slice(0, 1).toUpperCase();
        const avatarColor = avatarColors[i % avatarColors.length];
        
        let valueHtml = '';
        if (filter === 'orders') {
            valueHtml = `<div style="font-size:15px; font-weight:800; color:#9b59b6;">${c.totalOrders}</div>
                         <div style="font-size:10px; color:#999; font-weight:500;">đơn hàng</div>`;
        } else {
            valueHtml = `<div style="font-size:13px; font-weight:800; color:#9b59b6;">${(c.totalSpent || 0).toLocaleString('vi-VN')}</div>
                         <div style="font-size:10px; color:#999; font-weight:500;">VNĐ</div>`;
        }

        const avatarHtml = c.avatar 
            ? `<img src="${c.avatar}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; flex-shrink:0;" onerror="this.outerHTML='<div style=&quot;width:42px; height:42px; border-radius:50%; background:${avatarColor}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0;&quot;>${initial}</div>'">`
            : `<div style="
                width:42px; height:42px; border-radius:50%;
                background:${avatarColor}; color:#fff;
                display:flex; align-items:center; justify-content:center;
                font-weight:800; font-size:16px; flex-shrink:0;">
                ${initial}
               </div>`;

        return `
            <div class="stats-item">
                <div class="stats-rank ${rankClasses[i]}">${medals[i]}</div>
                ${avatarHtml}
                <div class="stats-item-info">
                    <div class="stats-item-name">${name}</div>
                    <div class="stats-item-sub">${c._id || ''}</div>
                </div>
                <div class="stats-item-value" style="text-align: right;">
                    ${valueHtml}
                </div>
            </div>
        `;
    }).join('');
}

// Gắn vào showSection để tự load khi mở tab
const _origShowSectionStats = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (_origShowSectionStats) _origShowSectionStats(sectionId, overrideMenuId);
    if (sectionId === 'dashboard-home') {
        fetchStats();
        // Tự động load cả biểu đồ xu hướng tài chính tích hợp cho Trang chủ
        if (window.toggleHomeFilters) {
            const filterSelect = document.getElementById('homeFilterType');
            if (filterSelect) {
                filterSelect.value = 'month';
            }
            window.toggleHomeFilters();
        }
    }
};

// Gọi fetchStats khi load trang (do đã chuyển Trang chủ làm mặc định)
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
    if (window.toggleHomeFilters) {
        const filterSelect = document.getElementById('homeFilterType');
        if (filterSelect) {
            filterSelect.value = 'month';
        }
        window.toggleHomeFilters();
    }
});

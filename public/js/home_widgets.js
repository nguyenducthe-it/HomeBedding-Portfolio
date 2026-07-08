let currentWidgetTab = 'cart'; // default tab

window.switchWidgetTab = function (tab) {
    currentWidgetTab = tab;
    const cartTab = document.getElementById('widget-tab-cart');
    const wishlistTab = document.getElementById('widget-tab-wishlist');
    
    if (cartTab && wishlistTab) {
        if (tab === 'cart') {
            cartTab.style.color = 'var(--primary-olive)';
            cartTab.style.borderBottom = '2px solid var(--primary-olive)';
            wishlistTab.style.color = '#999';
            wishlistTab.style.borderBottom = 'none';
        } else {
            wishlistTab.style.color = 'var(--primary-olive)';
            wishlistTab.style.borderBottom = '2px solid var(--primary-olive)';
            cartTab.style.color = '#999';
            cartTab.style.borderBottom = 'none';
        }
    }
    loadWidgetCartOrWishlist();
};

async function loadWidgetCartOrWishlist() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const container = document.getElementById('widget-items-list');
    if (!container) return;
    
    // Smooth transition: Fade out first
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.15s ease-out';
    
    // Đợi 150ms để hoàn thành hiệu ứng mờ
    await new Promise(r => setTimeout(r, 150));
    
    try {
        if (currentWidgetTab === 'cart') {
            const res = await fetch(`/api/cart/${userId}`);
            if (!res.ok) throw new Error();
            const cart = await res.json();
            const items = cart.items || [];
            
            if (items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-style:italic;">Giỏ hàng của bạn đang trống.</div>';
                container.style.opacity = '1';
                return;
            }
            
            let html = '';
            items.forEach(item => {
                const p = item.productId;
                if (!p) return;
                const img = p.images && p.images[0] ? p.images[0] : 'https://placehold.co/100x100/f0ebd8/7f866e?text=No+Image';
                html += `
                    <div onclick="viewDetail('${p._id}')" class="home-widget-item" style="display: flex; align-items: center; gap: 15px; background: #fafafa; padding: 12px 15px; border-radius: 12px; border: 1px solid #f0f0f0; cursor: pointer; transition: all 0.2s;">
                        <img src="${img}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #fff;">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 14px; color: #333; margin-bottom: 4px;">${p.name}</div>
                            <div style="font-size: 13px; color: #666; font-weight: 600;">${p.price.toLocaleString()} đ</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            const res = await fetch(`/api/users/wishlist/${userId}`);
            if (!res.ok) throw new Error();
            const items = await res.json();
            
            if (items.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:#999; font-style:italic;">Chưa có sản phẩm yêu thích nào.</div>';
                container.style.opacity = '1';
                return;
            }
            
            let html = '';
            items.forEach(p => {
                const img = p.images && p.images[0] ? p.images[0] : 'https://placehold.co/100x100/f0ebd8/7f866e?text=No+Image';
                html += `
                    <div onclick="viewDetail('${p._id}')" class="home-widget-item" style="display: flex; align-items: center; gap: 15px; background: #fafafa; padding: 12px 15px; border-radius: 12px; border: 1px solid #f0f0f0; cursor: pointer; transition: all 0.2s;">
                        <img src="${img}" alt="${p.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #fff;">
                        <div style="flex: 1;">
                            <div style="font-weight: 700; font-size: 14px; color: #333; margin-bottom: 4px;">${p.name}</div>
                            <div style="font-size: 13px; color: #666; font-weight: 600;">${p.price.toLocaleString()} đ</div>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Lỗi tải dữ liệu</div>';
    }
    
    // Fade back in
    container.style.opacity = '1';
}

async function loadWidgetOrders() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    const container = document.getElementById('widget-orders-list');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#999;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</div>';
    
    try {
        const res = await fetch(`/api/orders/my-orders/${userId}`);
        if (!res.ok) throw new Error();
        const orders = await res.json();
        
        // Lọc bỏ các đơn hàng hoàn thành (completed) và hủy (cancelled)
        const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        
        if (activeOrders.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:40px; color:#999; font-style:italic;"><i class="fa-solid fa-clipboard-list" style="font-size:36px; margin-bottom:10px; color:#ddd;"></i><p>Không có đơn hàng nào đang hoạt động.</p></div>';
            return;
        }
        
        // Sắp xếp đơn hàng mới nhất lên đầu
        activeOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        let html = '';
        // Lấy tối đa 5 đơn hàng gần nhất
        activeOrders.slice(0, 5).forEach(o => {
            const dateObj = new Date(o.createdAt);
            const dateStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString('vi-VN');
            
            // Thiết lập style và text cho status
            let statusText = 'Chờ xác nhận';
            let statusBg = '#fff7ed'; // cam nhạt
            let statusColor = '#ea580c'; // cam đậm
            let iconClass = 'fa-tag';
            let iconBg = '#ffedd5';
            let iconColor = '#ea580c';
            
            if (o.status === 'processing') {
                statusText = 'Đang xử lý';
                statusBg = '#fef9c3'; // vàng nhạt
                statusColor = '#ca8a04'; // vàng đậm
                iconClass = 'fa-clock';
                iconBg = '#fef08a';
                iconColor = '#ca8a04';
            } else if (o.status === 'shipping') {
                statusText = 'Đang giao';
                statusBg = '#dbeafe'; // xanh dương nhạt
                statusColor = '#2563eb'; // xanh dương đậm
                iconClass = 'fa-truck';
                iconBg = '#bfdbfe';
                iconColor = '#2563eb';
            }
            
            html += `
                <div onclick="window.openOrderDetail('${o._id}')" class="home-widget-order-item" style="display: flex; align-items: center; justify-content: space-between; gap: 15px; background: #fafafa; padding: 15px 20px; border-radius: 12px; border: 1px solid #f0f0f0; cursor: pointer; transition: all 0.2s;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <div style="width: 44px; height: 44px; border-radius: 50%; background: ${iconBg}; display: flex; align-items: center; justify-content: center; color: ${iconColor}; font-size: 18px;">
                            <i class="fa-solid ${iconClass}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 700; font-size: 14px; color: #333; margin-bottom: 2px;">#${o._id.toString().substring(0, 7).toUpperCase()}</div>
                            <div style="font-size: 12px; color: #999; margin-bottom: 2px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${dateStr}</div>
                            <div style="font-size: 12px; color: #666;"><i class="fa-regular fa-user" style="margin-right: 4px;"></i>${o.customerName || 'Khách hàng'}</div>
                        </div>
                    </div>
                    <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <span style="font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: ${statusBg}; color: ${statusColor};">${statusText}</span>
                        <div style="font-size: 11px; color: #999;">Tổng tiền</div>
                        <div style="font-weight: 700; font-size: 14px; color: #333;">${o.finalAmount.toLocaleString()} đ</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Lỗi tải dữ liệu</div>';
    }
}

window.loadHomeWidgets = async function() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    
    loadWidgetCartOrWishlist();
    loadWidgetOrders();
};

// Hook vào showSection để reload khi quay lại trang chủ
const _origShowSectionWidgets = window.showSection;
window.showSection = function (sectionId) {
    if (_origShowSectionWidgets) _origShowSectionWidgets(sectionId);
    if (sectionId === 'customer-home') {
        window.loadHomeWidgets();
    }
};

// Chạy load khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.loadHomeWidgets();
    }
});

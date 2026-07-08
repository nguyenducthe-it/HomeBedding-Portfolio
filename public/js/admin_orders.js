// ===== QUẢN LÝ ĐƠN HÀNG DÀNH CHO ADMIN =====

window.currentAdminOrderFilter = 'active_all';

window.filterAdminOrders = function(status) {
    currentAdminOrderFilter = status;
    // Cập nhật giao diện tab active
    document.querySelectorAll('.admin-order-tabs .order-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) tab.classList.add('active');
    });
    fetchAdminOrders(status);
};

window.toggleAdminDateFilter = function() {
    const type = document.getElementById('adminOrderDateType').value;
    const rangeContainer = document.getElementById('adminOrderDateRangeContainer');
    const startInput = document.getElementById('adminOrderStartDateInput');
    const endInput = document.getElementById('adminOrderEndDateInput');
    if (type === 'date_range') {
        rangeContainer.style.display = 'flex';
        // Mặc định là khoảng 7 ngày gần đây nếu chưa chọn
        if (!startInput.value || !endInput.value) {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            startInput.value = sevenDaysAgo.toISOString().split('T')[0];
            endInput.value = today.toISOString().split('T')[0];
        }
    } else {
        rangeContainer.style.display = 'none';
        startInput.value = '';
        endInput.value = '';
    }
    fetchAdminOrders('active_all');
};

function formatVND(val) {
    return Number(val).toLocaleString('vi-VN') + ' đ';
}

function getAdminStatusOptionsHTML(currentStatus, orderId) {
    const statuses = [
        { val: 'pending', text: 'Chờ xác nhận' },
        { val: 'processing', text: 'Đã xác nhận' },
        { val: 'shipping', text: 'Đang giao hàng' },
        { val: 'completed', text: 'Đã hoàn thành' }
    ];
    
    // Tìm index của trạng thái hiện tại
    let currentIndex = statuses.findIndex(s => s.val === currentStatus);
    if (currentIndex === -1) currentIndex = 99; // Nếu là 'cancelled' thì vô hiệu hoá hết

    let options = '';
    statuses.forEach((s, idx) => {
        const disabled = (idx < currentIndex || currentStatus === 'cancelled') ? 'disabled' : '';
        const selected = (s.val === currentStatus) ? 'selected' : '';
        options += `<option value="${s.val}" ${disabled} ${selected}>${s.text}</option>`;
    });

    return `
        <select onchange="updateAdminOrderStatus('${orderId}', this.value)" style="padding: 6px 10px; border: 1px solid var(--primary-olive); border-radius: 5px; outline: none; background: #fdfdfd; cursor: pointer; font-family: 'Quicksand', sans-serif; font-weight: 600;">
            ${options}
        </select>
    `;
}

async function updateAdminOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/status/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Cập nhật trạng thái thành công', 'success');
            fetchAdminOrders(currentAdminOrderFilter);
        } else {
            showToast(data.message || 'Lỗi cập nhật', 'error');
            fetchAdminOrders(currentAdminOrderFilter);
        }
    } catch (err) {
        showToast('Lỗi mạng', 'error');
        fetchAdminOrders(currentAdminOrderFilter);
    }
}

async function fetchAdminOrders(filterStatus = 'active_all') {
    const container = document.getElementById('adminOrdersContainer');
    const filterDiv = document.getElementById('adminOrderDateFilter');
    if (!container) return;
    
    // Ẩn/hiện bộ lọc ngày khi ở tab Tất cả đơn
    if (filterStatus === 'active_all') {
        if(filterDiv) filterDiv.style.display = 'flex';
    } else {
        if(filterDiv) filterDiv.style.display = 'none';
    }

    container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px; background: #fff; border-radius: 12px; font-weight: 500;">Đang tải dữ liệu đơn hàng...</div>';

    try {
        const url = '/api/orders/all';
        const res = await fetch(url);
        let data = await res.json();
        
        // Logic lọc theo ngày và trạng thái
        if (filterStatus === 'active_all') {
            const dateType = document.getElementById('adminOrderDateType')?.value || 'realtime';

            if (dateType === 'date_range') {
                const startDateVal = document.getElementById('adminOrderStartDateInput')?.value;
                const endDateVal = document.getElementById('adminOrderEndDateInput')?.value;
                if (startDateVal && endDateVal) {
                    const startDate = new Date(startDateVal);
                    startDate.setHours(0, 0, 0, 0);
                    const endDate = new Date(endDateVal);
                    endDate.setHours(23, 59, 59, 999);
                    data = data.filter(o => {
                        const orderDate = new Date(o.createdAt);
                        return orderDate >= startDate && orderDate <= endDate;
                    });
                }
                const orderMap = { 'pending': 1, 'processing': 2, 'shipping': 3, 'completed': 4, 'cancelled': 5 };
                data.sort((a, b) => {
                    const diff = orderMap[a.status] - orderMap[b.status];
                    if (diff !== 0) return diff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            } else {
                // Realtime: Chỉ lấy đơn đang hoạt động (chờ duyệt -> xác nhận -> đang giao)
                data = data.filter(o => o.status !== 'cancelled' && o.status !== 'completed');
                const orderMap = { 'pending': 1, 'processing': 2, 'shipping': 3 };
                data.sort((a, b) => {
                    const diff = orderMap[a.status] - orderMap[b.status];
                    if (diff !== 0) return diff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            }
        } else if (filterStatus) {
            data = data.filter(o => o.status === filterStatus);
            if (filterStatus === 'cancelled') {
                data.sort((a, b) => {
                    const timeA = new Date(a.cancelledAt || a.updatedAt || a.createdAt);
                    const timeB = new Date(b.cancelledAt || b.updatedAt || b.createdAt);
                    return timeB - timeA;
                });
            } else if (filterStatus === 'completed') {
                data.sort((a, b) => {
                    const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt);
                    const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt);
                    return timeB - timeA;
                });
            } else {
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        if (data.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #888; padding: 40px; background: #fff; border-radius: 12px; font-weight: 500;">Không có đơn hàng nào trong danh sách.</div>`;
            return;
        }
        
        container.innerHTML = data.map(order => {
            const productCount = order.items.length;
            const mainImage = order.items[0]?.productImage ? `http://localhost:3000${order.items[0].productImage}` : '../images/placeholder.jpg';
            const mainProductName = order.items[0]?.productName || 'Sản phẩm';
            
            let paymentText = order.paymentMethod === 'online' ? 'VNPay/MoMo' : 'COD';
            let statusInfo = getOrderStatusDisplayAdmin(order.status);

            return `
            <div class="customer-order-card">
                <div class="customer-order-info" style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <img src="${mainImage}" alt="${mainProductName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #eee;">
                    <div style="flex: 2;">
                        <h4 style="margin-bottom: 5px; color: #333; font-size: 15px; font-family:'Quicksand', sans-serif;">${mainProductName} ${productCount > 1 ? `và ${productCount - 1} sản phẩm khác` : ''}</h4>
                    </div>
                    
                    <div class="customer-order-col" style="color: #666; font-size: 13px;">
                        Mã đơn: <br><span style="color:var(--primary-olive-dark); font-weight:bold; font-size:14px;">#${order._id.substring(order._id.length - 6).toUpperCase()}</span>
                    </div>
                    <div class="customer-order-col" style="color: #666; font-size: 13px;">
                        Người nhận: <br><span style="color:#333; font-weight:500; font-size:14px;">${order.customerName} - ${order.customerPhone}</span>
                    </div>
                    <div class="customer-order-col" style="color: #666; font-size: 13px;">
                        Tổng tiền: <br><span style="color:#f25c3a; font-weight:bold; font-size:15px;">${formatVND(order.finalAmount)}</span>
                    </div>
                    <div class="customer-order-col" style="color: #666; font-size: 13px;">
                        Thanh toán: <br><span style="color:#333; font-weight:600; font-size:14px;">${paymentText}</span>
                    </div>
                    <div class="customer-order-col" style="color: #666; font-size: 13px;">
                        Trạng thái: <br><span style="color:${statusInfo.color}; font-weight:bold; font-size:14px;">${statusInfo.text}</span><br>
                        <span style="color:#888; font-size:12px;">Ngày đặt: ${new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style="flex: 1.5; display: flex; flex-direction: column; gap: 10px; justify-content: center; align-items: flex-end;">
                        ${getAdminStatusOptionsHTML(order.status, order._id)}
                        <button onclick="showAdminOrderDetail('${order._id}')" style="padding: 6px 15px; border: 1px solid var(--primary-olive); background-color: transparent; color: var(--primary-olive); border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap; font-family:'Quicksand', sans-serif; font-weight: 700; font-size: 12px;">Xem chi tiết</button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div style="text-align:center; color:red; padding: 40px;">Lỗi kết nối tải danh sách đơn hàng</div>';
    }
}

window.fetchAdminOrders = fetchAdminOrders;

let activeAdminOrderId = null;

async function showAdminOrderDetail(id) {
    try {
        const res = await fetch(`/api/orders/all`);
        const orders = await res.json();
        const order = orders.find(o => o._id === id);
        if (!order) return showToast('Không tìm thấy thông tin đơn hàng', 'error');

        activeAdminOrderId = order._id;
        document.getElementById('adminModalOrderId').textContent = `#${order._id.substring(order._id.length - 8).toUpperCase()}`;

        const statusInfo = getOrderStatusDisplayAdmin(order.status);
        const addressStr = order.shippingAddress ? `${order.shippingAddress.detail}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}` : '';

        // Tạo danh sách sản phẩm trong modal
        let itemsHtml = order.items.map(item => {
            const itemImg = item.productImage ? `http://localhost:3000${item.productImage}` : '../images/placeholder.jpg';
            return `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <img src="${itemImg}" alt="${item.productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #f0f0f0;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 5px;">${item.productName}</div>
                        <div style="color: #666; font-size: 13px;">SL: ${item.quantity}</div>
                    </div>
                    <div style="font-weight: bold; color: #f25c3a;">
                        ${formatVND(item.price * item.quantity)}
                    </div>
                </div>
            `;
        }).join('');

        let cancelText = '';
        let cancelDateHtml = '';
        if (order.status === 'cancelled') {
            const byWho = order.cancelledBy || 'Khách hàng';
            cancelText = ` <i style="color: #e74c3c; font-weight: normal;">(Hủy bởi ${byWho})</i>`;
            const cancelTime = order.cancelledAt || order.updatedAt;
            if (cancelTime) {
                cancelDateHtml = `<p style="margin-bottom: 8px;"><strong>Ngày hủy:</strong> <span>${new Date(cancelTime).toLocaleString('vi-VN')}</span></p>`;
            }
        }

        let completedDateHtml = '';
        if (order.status === 'completed') {
            const completeTime = order.completedAt || order.updatedAt;
            if (completeTime) {
                completedDateHtml = `<p style="margin-bottom: 8px;"><strong>Ngày hoàn thành:</strong> <span>${new Date(completeTime).toLocaleString('vi-VN')}</span></p>`;
            }
        }

        let html = `
            <div style="display: flex; gap: 20px; border-bottom: 1px dashed #ddd; padding-bottom: 20px; margin-bottom: 20px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 250px;">
                    <h4 style="color:var(--primary-olive-dark); margin-bottom: 10px; font-family:'Playfair Display', serif; font-size:18px;">Thông tin khách hàng</h4>
                    <p style="margin-bottom: 8px;"><strong>Người nhận:</strong> <span>${order.customerName}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Điện thoại:</strong> <span>${order.customerPhone}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Địa chỉ nhận:</strong> <span>${addressStr}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Ghi chú đơn:</strong> <span>${order.note || 'Không có ghi chú'}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Hình thức:</strong> ${order.paymentMethod === 'online' ? 'Thanh toán trực tuyến' : 'Thanh toán COD'}</p>
                    <p style="margin-bottom: 8px;"><strong>Trạng thái:</strong> <span style="color:${statusInfo.color}; font-weight:bold;">${statusInfo.text}</span>${cancelText}</p>
                    <p style="margin-bottom: 8px;"><strong>Ngày đặt đơn:</strong> <span>${new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                    ${cancelDateHtml}
                    ${completedDateHtml}
                </div>
                <div style="flex: 1; min-width: 250px; background: #fafafa; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                    <h4 style="color:var(--primary-olive-dark); margin-bottom: 10px; font-family:'Playfair Display', serif; font-size:18px;">Tóm tắt thanh toán</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #666; font-size:14px;">
                        <span>Tổng tiền hàng:</span>
                        <span>${formatVND(order.totalAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #666; font-size:14px;">
                        <span>Chiết khấu mã:</span>
                        <span style="color: #f25c3a;">- ${formatVND(order.discountAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-weight: bold; font-size: 16px;">
                        <span>Khách phải trả:</span>
                        <span style="color: var(--primary-olive-dark);">${formatVND(order.finalAmount)}</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="color:var(--primary-olive-dark); margin-bottom: 15px; font-family:'Playfair Display', serif; font-size:18px;">Danh sách sản phẩm mua</h4>
                ${itemsHtml}
            </div>
        `;
        document.getElementById('adminOrderDetailContent').innerHTML = html;

        // Cập nhật trạng thái các nút cập nhật trong modal
        const selectStatus = document.getElementById('adminModalStatusUpdate');
        const statuses = ['pending', 'processing', 'shipping', 'completed'];
        let currentIndex = statuses.indexOf(order.status);
        if (currentIndex === -1) currentIndex = 99;

        Array.from(selectStatus.options).forEach((opt, idx) => {
            opt.disabled = (idx < currentIndex || order.status === 'cancelled');
            if (opt.value === order.status) opt.selected = true;
        });

        const updateStatusBtn = document.getElementById('adminModalUpdateStatusBtn');
        if (order.status === 'cancelled') {
            selectStatus.disabled = true;
            if (updateStatusBtn) {
                updateStatusBtn.style.opacity = '0.5';
                updateStatusBtn.style.cursor = 'not-allowed';
                updateStatusBtn.disabled = true;
            }
        } else {
            selectStatus.disabled = false;
            if (updateStatusBtn) {
                updateStatusBtn.style.opacity = '1';
                updateStatusBtn.style.cursor = 'pointer';
                updateStatusBtn.disabled = false;
            }
        }

        const cancelBtn = document.getElementById('adminModalCancelBtn');
        if (order.status !== 'pending') {
            cancelBtn.style.opacity = '0.5';
            cancelBtn.style.cursor = 'not-allowed';
            cancelBtn.disabled = true;
        } else {
            cancelBtn.style.opacity = '1';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.disabled = false;
        }

        openModal('adminOrderDetailModal');
    } catch (err) {
        showToast('Không thể hiển thị chi tiết đơn hàng', 'error');
    }
}

window.showAdminOrderDetail = showAdminOrderDetail;

async function updateAdminOrderStatusFromModal() {
    if (!activeAdminOrderId) return;
    const newStatus = document.getElementById('adminModalStatusUpdate').value;
    
    try {
        const res = await fetch(`/api/orders/status/${activeAdminOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast('Cập nhật trạng thái thành công', 'success');
            closeModal('adminOrderDetailModal');
            fetchAdminOrders(currentAdminOrderFilter);
        } else {
            const data = await res.json();
            showToast(data.message || 'Lỗi cập nhật', 'error');
        }
    } catch (err) {
        showToast('Lỗi mạng', 'error');
    }
}

window.updateAdminOrderStatusFromModal = updateAdminOrderStatusFromModal;

async function cancelAdminOrderFromModal() {
    if (!activeAdminOrderId) return;
    
    openModal('adminCancelConfirmModal');
    
    const yesBtn = document.getElementById('adminCancelConfirmYes');
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    newYesBtn.onclick = async function() {
        closeModal('adminCancelConfirmModal');
        try {
            const adminName = localStorage.getItem('fullName') || '';
            const byWhoStr = adminName ? adminName + ' (Quản trị viên)' : 'Quản trị viên';
            
            const res = await fetch(`/api/orders/${activeAdminOrderId}/cancel`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelledBy: byWhoStr })
            });
            if (res.ok) {
                showToast('Huỷ đơn hàng thành công', 'success');
                closeModal('adminOrderDetailModal');
                fetchAdminOrders(currentAdminOrderFilter);
            } else {
                const data = await res.json();
                showToast(data.message || 'Lỗi huỷ đơn', 'error');
            }
        } catch (err) {
            showToast('Lỗi mạng', 'error');
        }
    };
}

window.cancelAdminOrderFromModal = cancelAdminOrderFromModal;

function getOrderStatusDisplayAdmin(status) {
    switch (status) {
        case 'pending': return { text: 'Chờ xác nhận', color: '#e67e22' };
        case 'processing': return { text: 'Đã xác nhận', color: '#f1c40f' };
        case 'shipping': return { text: 'Đang giao', color: '#3498db' };
        case 'completed': return { text: 'Đã hoàn thành', color: 'var(--primary-olive-dark)' };
        case 'cancelled': return { text: 'Đã hủy', color: '#c94f38' };
        default: return { text: status, color: '#666' };
    }
}

// Gắn tự động load khi mở tab Đơn hàng
const _origShowSectionOrders = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (_origShowSectionOrders) _origShowSectionOrders(sectionId, overrideMenuId);
    if (sectionId === 'order-management') {
        filterAdminOrders('active_all');
    }
};

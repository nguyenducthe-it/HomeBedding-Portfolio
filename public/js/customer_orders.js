let allCustomerOrders = [];
let currentOrderTab = 'pending';
let currentSelectedOrderId = null;

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    // Gọi load ban đầu nếu đang ở trang này
    if (document.getElementById('order-history') && document.getElementById('order-history').style.display !== 'none') {
        loadCustomerOrders();
    }
    loadEditProvinces();
});

// Hook vào hàm showSection
const _origShowSectionOrders = window.showSection;
window.showSection = function (sectionId) {
    if (_origShowSectionOrders) _origShowSectionOrders(sectionId);
    if (sectionId === 'order-history') {
        loadCustomerOrders();
    }
};

// Hàm format tiền tệ
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
}

async function loadCustomerOrders() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const resReviews = await fetch(`/api/reviews/user/${userId}`);
        const reviews = await resReviews.json();

        const res = await fetch(`http://localhost:3000/api/orders/my-orders/${userId}`);
        const data = await res.json();

        data.forEach(o => {
            if (o.status === 'completed') {
                let unreviewedCount = 0;
                o.items.forEach(item => {
                    const productId = item.productId._id || item.productId;
                    const hasReview = reviews.some(r => r.orderId === o._id && r.productId === productId);
                    if (!hasReview) unreviewedCount++;
                });
                o.hasUnreviewedItems = unreviewedCount > 0;
            }
        });

        allCustomerOrders = data;
        filterCustomerOrders(currentOrderTab);
    } catch (err) {
        console.error('Lỗi tải đơn hàng', err);
    }
}

function filterCustomerOrders(status) {
    currentOrderTab = status;
    // Đổi active class
    const tabs = document.querySelectorAll('.order-tab');
    tabs.forEach(t => t.classList.remove('active'));
    const activeTab = document.querySelector(`.order-tab[data-status="${status}"]`);
    if (activeTab) activeTab.classList.add('active');

    const filtered = allCustomerOrders.filter(o => o.status === status);

    if (status === 'cancelled') {
        filtered.sort((a, b) => {
            const timeA = new Date(a.cancelledAt || a.updatedAt || a.createdAt);
            const timeB = new Date(b.cancelledAt || b.updatedAt || b.createdAt);
            return timeB - timeA;
        });
    } else if (status === 'completed') {
        filtered.sort((a, b) => {
            const timeA = new Date(a.completedAt || a.updatedAt || a.createdAt);
            const timeB = new Date(b.completedAt || b.updatedAt || b.createdAt);
            return timeB - timeA;
        });
    } else {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    renderCustomerOrders(filtered);
}

// ==========================
// HIỂN THỊ ĐƠN HÀNG
// ==========================
function getOrderStatusDisplay(status) {
    switch (status) {
        case 'pending': return { text: 'Chờ xác nhận', color: '#e67e22' }; // Cam
        case 'processing': return { text: 'Đã xác nhận', color: '#f1c40f' }; // Vàng
        case 'shipping': return { text: 'Đang vận chuyển', color: '#3498db' }; // Xanh nước biển
        case 'completed': return { text: 'Hoàn thành', color: 'var(--primary-olive-dark)' }; // Xanh rêu
        case 'cancelled': return { text: 'Đã huỷ', color: '#c94f38' }; // Đỏ
        default: return { text: status, color: '#333' };
    }
}

function renderCustomerOrders(orders) {
    const container = document.getElementById('customerOrdersContainer');
    const orderGrid = document.getElementById('customerOrderGrid');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: #888; padding: 40px; background: #fff; border-radius: 12px;">Không có đơn hàng nào.</div>`;
        return;
    }

    let html = '';
    orders.forEach(order => {
        const productCount = order.items.length;
        const mainImage = order.items[0]?.productImage ? `http://localhost:3000${order.items[0].productImage}` : '../images/placeholder.jpg';
        const mainProductName = order.items[0]?.productName || 'Sản phẩm';

        let paymentText = order.paymentMethod === 'online' ? 'VNPay/MoMo' : 'COD';
        let statusInfo = getOrderStatusDisplay(order.status);

        html += `
            <div class="customer-order-card">
                <div class="customer-order-info" style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <img src="${mainImage}" alt="${mainProductName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div style="flex: 2;">
                        <h4 style="margin-bottom: 5px; color: #333;">${mainProductName} ${productCount > 1 ? `và ${productCount - 1} sản phẩm khác` : ''}</h4>
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
                    <div style="flex: 1.5; display: flex; flex-direction: column; gap: 8px; justify-content: center; align-items: flex-end;">
                        <button onclick="openOrderDetail('${order._id}')" style="padding: 8px 15px; border: 1px solid var(--primary-olive); background-color: transparent; color: var(--primary-olive); border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap; width: 120px;">Xem chi tiết</button>
                        ${order.status === 'completed' ? (
                order.hasUnreviewedItems !== false
                    ? `<button onclick="goToReviews('${order._id}')" style="padding: 8px 15px; border: 1px solid var(--primary-olive-dark); background-color: var(--primary-olive-dark); color: #fff; border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap; width: 120px;">Đánh giá ngay</button>`
                    : `<button onclick="showSection('consultation')" style="padding: 8px 15px; border: 1px solid var(--primary-olive-dark); background-color: var(--primary-olive-dark); color: #fff; border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap; width: 120px;"><i class="fa-regular fa-comments"></i> Tư vấn</button>`
            ) : ''}
                        ${order.status === 'cancelled' ? `<button onclick="buyAgain('${order._id}')" style="padding: 8px 15px; border: 1px solid var(--primary-olive-dark); background-color: var(--primary-olive-dark); color: #fff; border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap; width: 120px;">Mua lại</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.goToReviews = function (orderId) {
    showSection('customer-reviews');
    if (typeof switchReviewTab === 'function') {
        switchReviewTab('pending');
    }

    if (orderId) {
        // Đợi dữ liệu load xong (loadCustomerReviews) rồi bật modal
        setTimeout(() => {
            if (window.pendingReviewItems && typeof openReviewModal === 'function') {
                const pendingItem = window.pendingReviewItems.find(p => p.orderId === orderId);
                if (pendingItem) {
                    const mainImg = pendingItem.productImage ? `http://localhost:3000${pendingItem.productImage}` : 'https://via.placeholder.com/100';
                    openReviewModal(pendingItem.orderId, pendingItem.productId, pendingItem.productName.replace(/'/g, "\\'"), mainImg);
                }
            }
        }, 500); // 500ms để API tải xong
    }
}

window.openOrderDetail = async function (orderId) {
    currentSelectedOrderId = orderId;
    let order = allCustomerOrders.find(o => o._id === orderId);
    if (!order) {
        try {
            const userId = localStorage.getItem('userId');
            const res = await fetch(`/api/orders/my-orders/${userId}`);
            if (res.ok) {
                allCustomerOrders = await res.json();
                order = allCustomerOrders.find(o => o._id === orderId);
            }
        } catch (e) {
            console.error('Lỗi tải đơn hàng chi tiết:', e);
        }
    }
    if (!order) return;

    document.getElementById('modalOrderId').innerText = '#' + order._id.slice(-6).toUpperCase();

    let itemsHtml = order.items.map(item => {
        let img = item.productImage ? `http://localhost:3000${item.productImage}` : '../images/placeholder.jpg';
        let reviewBtnHtml = '';
        if (order.status === 'completed') {
            let isReviewed = false;
            let editCount = 0;
            if (window.customerReviews) {
                const existingReview = window.customerReviews.find(r => r.orderId === order._id && r.productId === item.productId);
                if (existingReview) {
                    isReviewed = true;
                    editCount = existingReview.editCount;
                }
            }
            if (!isReviewed) {
                reviewBtnHtml = `<button onclick="closeOrderDetailModal(); showSection('customer-reviews'); switchReviewTab('pending'); openReviewModal('${order._id}', '${item.productId}', '${item.productName.replace(/'/g, "\\'")}', '${img}');" style="padding:5px 10px; background:#f25c3a; color:#fff; border:none; border-radius:4px; font-size:12px; cursor:pointer; margin-top:5px;">Đánh giá ngay</button>`;
            } else if (editCount < 1) {
                reviewBtnHtml = `<button onclick="closeOrderDetailModal(); showSection('customer-reviews'); switchReviewTab('done');" style="padding:5px 10px; background:var(--primary-olive-dark); color:#fff; border:none; border-radius:4px; font-size:12px; cursor:pointer; margin-top:5px;">Sửa đánh giá</button>`;
            } else {
                reviewBtnHtml = `<button onclick="closeOrderDetailModal(); showSection('consultation');" style="padding:5px 10px; background:var(--primary-olive); color:#fff; border:none; border-radius:4px; font-size:12px; cursor:pointer; margin-top:5px;">Tư vấn trực tuyến</button>`;
            }
        }
        return `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
                <div style="display: flex; gap: 10px; align-items: center;">
                    <img src="${img}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
                    <div>
                        <span>${item.productName} <strong style="color:var(--primary-olive);">x${item.quantity}</strong></span>
                        <div style="display:flex; gap:10px;">${reviewBtnHtml}</div>
                    </div>
                </div>
                <span style="font-weight:600;">${formatCurrency(item.price * item.quantity)}</span>
            </div>
        `;
    }).join('');

    let addressStr = '';
    if (order.shippingAddress) {
        addressStr = `${order.shippingAddress.detail}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}`;
    }

    let statusInfo = getOrderStatusDisplay(order.status);

    let cancelText = '';
    let cancelDateHtml = '';
    if (order.status === 'cancelled') {
        const byWho = order.cancelledBy || 'Khách hàng';
        cancelText = ` <i style="color: #e74c3c; font-weight: normal;">(Hủy do ${byWho})</i>`;

        const cancelTime = order.cancelledAt || order.updatedAt;
        if (cancelTime) {
            cancelDateHtml = `<p style="margin-bottom: 0; margin-top: 8px;"><strong>Ngày hủy:</strong> <span>${new Date(cancelTime).toLocaleString('vi-VN')}</span></p>`;
        }
    }

    let completedDateHtml = '';
    if (order.status === 'completed') {
        const completeTime = order.completedAt || order.updatedAt;
        if (completeTime) {
            completedDateHtml = `<p style="margin-bottom: 0; margin-top: 8px;"><strong>Ngày hoàn thành:</strong> <span>${new Date(completeTime).toLocaleString('vi-VN')}</span></p>`;
        }
    }

    let html = `
        <div style="display: flex; gap: 20px; border-bottom: 1px dashed #ddd; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="flex: 1;">
                <h4 style="color:var(--primary-olive-dark); margin-bottom: 10px;">Thông tin khách hàng</h4>
                <p style="margin-bottom: 8px;"><strong>Người nhận:</strong> <span id="currentNameDisplay">${order.customerName}</span></p>
                <p style="margin-bottom: 8px;"><strong>Điện thoại:</strong> <span id="currentPhoneDisplay">${order.customerPhone}</span></p>
                <p style="margin-bottom: 8px;"><strong>Địa chỉ:</strong> <span id="currentAddressDisplay">${addressStr}</span></p>
                <p style="margin-bottom: 8px;"><strong>Ghi chú:</strong> <span id="currentNoteDisplay">${order.note || 'Không có ghi chú'}</span></p>
                <p style="margin-bottom: 8px;"><strong>Thanh toán:</strong> ${order.paymentMethod === 'online' ? 'Trực tuyến' : 'Thanh toán khi nhận hàng'}</p>
                <p style="margin-bottom: 8px;"><strong>Trạng thái:</strong> <span style="color:${statusInfo.color}; font-weight:bold;">${statusInfo.text}</span>${cancelText}</p>
                <p style="margin-bottom: 0;"><strong>Ngày đặt:</strong> <span>${new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                ${cancelDateHtml}
                ${completedDateHtml}
            </div>
            <div style="flex: 1; background: #fafafa; padding: 15px; border-radius: 8px;">
                <h4 style="color:var(--primary-olive-dark); margin-bottom: 10px;">Tóm tắt đơn hàng</h4>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Tổng tiền hàng:</span> <span>${formatCurrency(order.totalAmount)}</span></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color:#f25c3a;"><span>Giảm giá ${order.promotionCode ? '(' + order.promotionCode + ')' : ''}:</span> <span>- ${formatCurrency(order.discountAmount)}</span></div>
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 10px;"><span>Tổng thanh toán:</span> <span style="color:var(--primary-olive-dark);">${formatCurrency(order.finalAmount)}</span></div>
            </div>
        </div>
        <h4 style="color:var(--primary-olive-dark); margin-bottom: 15px;">Sản phẩm</h4>
        <div>${itemsHtml}</div>
    `;

    document.getElementById('orderDetailContent').innerHTML = html;

    const actionsDiv = document.getElementById('orderDetailActions');
    if (order.status === 'pending') {
        actionsDiv.style.display = 'flex';
        document.getElementById('btnCancelOrder').style.display = 'inline-block';
        document.getElementById('btnEditAddress').style.display = 'inline-block';
        const btnBuyAgain = document.getElementById('btnBuyAgainModal');
        if (btnBuyAgain) btnBuyAgain.style.display = 'none';

        document.getElementById('btnCancelOrder').onclick = () => cancelOrder(order._id);
        document.getElementById('btnEditAddress').onclick = () => promptEditAddress(order._id);
    } else if (order.status === 'cancelled') {
        actionsDiv.style.display = 'flex';
        document.getElementById('btnCancelOrder').style.display = 'none';
        document.getElementById('btnEditAddress').style.display = 'none';

        let btnBuyAgain = document.getElementById('btnBuyAgainModal');
        if (!btnBuyAgain) {
            btnBuyAgain = document.createElement('button');
            btnBuyAgain.id = 'btnBuyAgainModal';
            btnBuyAgain.style = 'padding: 10px 20px; border: none; background-color: var(--primary-olive-dark); color: white; border-radius: 6px; cursor: pointer; font-weight: bold; margin-left: 15px;';
            btnBuyAgain.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Mua lại';
            actionsDiv.appendChild(btnBuyAgain);
        }
        btnBuyAgain.style.display = 'inline-block';
        btnBuyAgain.onclick = () => { closeOrderDetailModal(); buyAgain(order._id); };
    } else {
        actionsDiv.style.display = 'none';
    }

    document.getElementById('orderDetailModal').style.display = 'block';
}

function closeOrderDetailModal() {
    document.getElementById('orderDetailModal').style.display = 'none';
}

function closeCancelOrderModal() {
    document.getElementById('cancelOrderConfirmModal').style.display = 'none';
}

// ==========================
// MUA LẠI ĐƠN HÀNG ĐÃ HUỶ
// ==========================
window.buyAgain = async function (orderId) {
    const order = allCustomerOrders.find(o => o._id === orderId);
    if (!order) return;

    window.checkoutMode = 'repurchase';
    window.repurchaseItems = order.items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price,
        name: i.productName,
        image: i.productImage ? `http://localhost:3000${i.productImage}` : 'https://placehold.co/600x600/f0ebd8/7f866e?text=No+Image'
    }));

    document.getElementById('checkoutName').value = order.customerName || '';
    document.getElementById('checkoutPhone').value = order.customerPhone || '';
    document.getElementById('checkoutDetail').value = order.shippingAddress.detail || '';
    document.getElementById('checkoutNote').value = '';

    const pSelect = document.getElementById('checkoutProvince');
    const dSelect = document.getElementById('checkoutDistrict');
    const wSelect = document.getElementById('checkoutWard');

    // Mặc định reset dropdown
    dSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    wSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';

    if (order.shippingAddress.province) {
        const pOpt = Array.from(pSelect.options).find(opt => opt.text === order.shippingAddress.province);
        if (pOpt) {
            pSelect.value = pOpt.value;
            if (window.fetchDistricts) await window.fetchDistricts(pOpt.value);

            const dOpt = Array.from(dSelect.options).find(opt => opt.text === order.shippingAddress.district);
            if (dOpt) {
                dSelect.value = dOpt.value;
                if (window.fetchWards) await window.fetchWards(dOpt.value);

                const wOpt = Array.from(wSelect.options).find(opt => opt.text === order.shippingAddress.ward);
                if (wOpt) {
                    wSelect.value = wOpt.value;
                }
            }
        }
    }

    if (window.updateSummary) window.updateSummary();
    if (window.openCheckoutModal) window.openCheckoutModal();
};

let pendingCancelOrderId = null;
function cancelOrder(orderId) {
    pendingCancelOrderId = orderId;
    document.getElementById('cancelOrderConfirmModal').style.display = 'block';

    document.getElementById('btnConfirmCancelOrder').onclick = async () => {
        document.getElementById('cancelOrderConfirmModal').style.display = 'none';
        try {
            const res = await fetch(`http://localhost:3000/api/orders/${pendingCancelOrderId}/cancel`, {
                method: 'PUT'
            });
            const data = await res.json();
            if (res.ok) {
                closeOrderDetailModal();
                if (window.showAlertModal) {
                    showAlertModal('Huỷ đơn hàng thành công!');
                } else {
                    alert('Huỷ đơn hàng thành công!');
                }
                loadCustomerOrders(); // reload
            } else {
                if (window.showAlertModal) {
                    showAlertModal('Lỗi: ' + data.message, true);
                } else {
                    alert('Lỗi: ' + data.message);
                }
            }
        } catch (err) {
            if (window.showAlertModal) {
                showAlertModal('Lỗi kết nối!', true);
            } else {
                alert('Lỗi kết nối!');
            }
        }
    };
}

let pendingEditAddressOrderId = null;
let locationDataEdit = [];

async function loadEditProvinces() {
    try {
        const res = await fetch('https://provinces.open-api.vn/api/?depth=3');
        locationDataEdit = await res.json();
        const provinceSelect = document.getElementById('editProvince');
        provinceSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành</option>';
        locationDataEdit.forEach(p => {
            provinceSelect.innerHTML += `<option value="${p.code}">${p.name}</option>`;
        });

        provinceSelect.addEventListener('change', function () {
            const districtSelect = document.getElementById('editDistrict');
            const wardSelect = document.getElementById('editWard');
            districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            wardSelect.disabled = true;

            const selectedP = locationDataEdit.find(p => p.code == this.value);
            if (selectedP && selectedP.districts) {
                selectedP.districts.forEach(d => {
                    districtSelect.innerHTML += `<option value="${d.code}">${d.name}</option>`;
                });
                districtSelect.disabled = false;
            } else {
                districtSelect.disabled = true;
            }
        });

        document.getElementById('editDistrict').addEventListener('change', function () {
            const wardSelect = document.getElementById('editWard');
            wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
            const selectedP = locationDataEdit.find(p => p.code == document.getElementById('editProvince').value);
            if (selectedP) {
                const selectedD = selectedP.districts.find(d => d.code == this.value);
                if (selectedD && selectedD.wards) {
                    selectedD.wards.forEach(w => {
                        wardSelect.innerHTML += `<option value="${w.code}">${w.name}</option>`;
                    });
                    wardSelect.disabled = false;
                } else {
                    wardSelect.disabled = true;
                }
            }
        });
    } catch (e) {
        console.error('Lỗi load API tỉnh thành cho edit', e);
    }
}

function promptEditAddress(orderId) {
    const order = allCustomerOrders.find(o => o._id === orderId);
    if (!order) return;

    pendingEditAddressOrderId = orderId;

    const pSelect = document.getElementById('editProvince');
    const dSelect = document.getElementById('editDistrict');
    const wSelect = document.getElementById('editWard');
    const detail = document.getElementById('editAddressDetail');
    const nameInput = document.getElementById('editCustomerName');
    const phoneInput = document.getElementById('editCustomerPhone');

    // Mặc định xoá rỗng
    pSelect.value = '';
    dSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    dSelect.disabled = true;
    wSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    wSelect.disabled = true;
    detail.value = order.shippingAddress.detail || '';
    nameInput.value = order.customerName || '';
    phoneInput.value = order.customerPhone || '';

    // Cố gắng tự động chọn các ô cũ nếu có
    if (order.shippingAddress.province) {
        const pOpt = Array.from(pSelect.options).find(opt => opt.text === order.shippingAddress.province);
        if (pOpt) {
            pSelect.value = pOpt.value;
            pSelect.dispatchEvent(new Event('change'));

            setTimeout(() => {
                const dOpt = Array.from(dSelect.options).find(opt => opt.text === order.shippingAddress.district);
                if (dOpt) {
                    dSelect.value = dOpt.value;
                    dSelect.dispatchEvent(new Event('change'));

                    setTimeout(() => {
                        const wOpt = Array.from(wSelect.options).find(opt => opt.text === order.shippingAddress.ward);
                        if (wOpt) {
                            wSelect.value = wOpt.value;
                        }
                    }, 50);
                }
            }, 50);
        }
    }

    document.getElementById('editAddressModal').style.display = 'block';

    document.getElementById('btnSaveEditAddress').onclick = () => {
        const phoneVal = phoneInput.value.trim();
        const nameVal = nameInput.value.trim();

        if (!nameVal || !phoneVal || !pSelect.value || !dSelect.value || !wSelect.value || !detail.value.trim()) {
            if (window.showAlertModal) {
                showAlertModal('Vui lòng nhập đầy đủ thông tin nhận hàng!', true);
            } else {
                alert('Vui lòng nhập đầy đủ thông tin nhận hàng!');
            }
            return;
        }

        const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
        if (!phoneRegex.test(phoneVal)) {
            if (window.showAlertModal) {
                showAlertModal('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam (10 số).', true);
            } else {
                alert('Số điện thoại không hợp lệ!');
            }
            return;
        }

        const pName = pSelect.options[pSelect.selectedIndex].text;
        const dName = dSelect.options[dSelect.selectedIndex].text;
        const wName = wSelect.options[wSelect.selectedIndex].text;

        document.getElementById('editAddressModal').style.display = 'none';

        const addressObj = {
            province: pName,
            district: dName,
            ward: wName,
            detail: detail.value.trim()
        };
        updateOrderAddress(pendingEditAddressOrderId, {
            shippingAddress: addressObj,
            customerName: nameInput.value.trim(),
            customerPhone: phoneInput.value.trim()
        });
    };
}

async function updateOrderAddress(orderId, payload) {
    try {
        const res = await fetch(`http://localhost:3000/api/orders/${orderId}/address`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
            if (window.showAlertModal) {
                showAlertModal('Cập nhật địa chỉ thành công!');
            } else {
                alert('Cập nhật địa chỉ thành công!');
            }
            // Update UI immediately without reloading modal
            if (document.getElementById('currentNameDisplay')) {
                document.getElementById('currentNameDisplay').innerText = payload.customerName;
            }
            if (document.getElementById('currentPhoneDisplay')) {
                document.getElementById('currentPhoneDisplay').innerText = payload.customerPhone;
            }
            if (document.getElementById('currentAddressDisplay')) {
                const a = payload.shippingAddress;
                document.getElementById('currentAddressDisplay').innerText = `${a.detail}, ${a.ward}, ${a.district}, ${a.province}`;
            }
            loadCustomerOrders();
        } else {
            if (window.showAlertModal) {
                showAlertModal('Lỗi: ' + data.message, true);
            } else {
                alert('Lỗi: ' + data.message);
            }
        }
    } catch (err) {
        console.error(err);
        if (window.showAlertModal) {
            showAlertModal('Lỗi cập nhật dữ liệu!', true);
        } else {
            alert('Lỗi cập nhật dữ liệu!');
        }
    }
}

window.filterOrderItems = function (keyword) {
    const rows = document.querySelectorAll('.customer-order-card');
    rows.forEach(row => {
        const text = row.innerText;
        if (window.fuzzyMatch && window.fuzzyMatch(keyword, text)) {
            row.style.display = '';
        } else if (!window.fuzzyMatch && text.toLowerCase().includes(keyword.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
};

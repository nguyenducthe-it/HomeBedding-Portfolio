let cartItemsData = [];
let checkedItemIds = new Set();
let appliedPromo = null;

window.checkoutMode = 'cart'; // 'cart' or 'repurchase'
window.repurchaseItems = [];

// Helper: Format tiền tệ
function formatVND(amount) {
    return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' đ';
}

// 1. Fetch Tỉnh Thành VN
async function fetchProvinces() {
    try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const data = await res.json();
        const select = document.getElementById('checkoutProvince');
        select.innerHTML = '<option value="">Chọn Tỉnh/Thành</option>';
        data.forEach(p => {
            select.innerHTML += `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`;
        });
    } catch (e) {
        console.error('Lỗi lấy danh sách tỉnh thành:', e);
    }
}

async function fetchDistricts(provinceCode) {
    const wardSelect = document.getElementById('checkoutWard');
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    const districtSelect = document.getElementById('checkoutDistrict');
    districtSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    
    if (!provinceCode) return;
    
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        data.districts.forEach(d => {
            districtSelect.innerHTML += `<option value="${d.code}" data-name="${d.name}">${d.name}</option>`;
        });
    } catch (e) {
        console.error('Lỗi lấy quận huyện:', e);
    }
}

async function fetchWards(districtCode) {
    const wardSelect = document.getElementById('checkoutWard');
    wardSelect.innerHTML = '<option value="">Chọn Phường/Xã</option>';
    
    if (!districtCode) return;
    
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await res.json();
        data.wards.forEach(w => {
            wardSelect.innerHTML += `<option value="${w.code}" data-name="${w.name}">${w.name}</option>`;
        });
    } catch (e) {
        console.error('Lỗi lấy phường xã:', e);
    }
}

// 2. Fetch Giỏ hàng
async function fetchCart() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await fetch(`http://localhost:3000/api/cart/${userId}`);
        const cart = await res.json();
        // Lọc bỏ những sản phẩm đã bị xóa khỏi hệ thống (productId bị null)
        cartItemsData = (cart.items || []).filter(item => item.productId);
        
        // Mặc định chọn tất cả khi mới load
        const allIds = cartItemsData.map(i => i.productId._id);
        allIds.forEach(id => checkedItemIds.add(id));
        
        renderCart();
        updateCartBadge();
    } catch (e) {
        console.error(e);
    }
}

function updateCartBadge() {
    let totalQty = 0;
    cartItemsData.forEach(i => totalQty += i.quantity);
    document.getElementById('headerCartBadge').innerText = totalQty;
}

function renderCart() {
    const container = document.getElementById('cartItemList');
    if (cartItemsData.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color:#999;"><i class="fa-solid fa-cart-arrow-down" style="font-size: 40px; margin-bottom: 15px; color: #ddd;"></i><p>Giỏ hàng của bạn đang trống</p></div>`;
        updateSummary();
        return;
    }

    let html = '';
    cartItemsData.forEach(item => {
        const p = item.productId;
        const img = p.images && p.images[0] ? p.images[0] : '/images/placeholder.jpg';
        const isChecked = checkedItemIds.has(p._id) ? 'checked' : '';
        html += `
            <div class="cart-item-row" id="cart-item-${p._id}">
                <input type="checkbox" class="cart-item-cb" value="${p._id}" onchange="toggleCheck('${p._id}')" ${isChecked}>
                <div class="cart-item-info">
                    <img src="${img}" alt="${p.name}">
                    <div>
                        <div class="cart-item-title">${p.name}</div>
                        <div class="cart-item-price">${formatVND(p.price)}</div>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-spinner">
                        <button onclick="updateCartItemQty('${p._id}', -1)">-</button>
                        <input type="number" id="qty-${p._id}" value="${item.quantity}" readonly>
                        <button onclick="updateCartItemQty('${p._id}', 1)">+</button>
                    </div>
                    <div class="cart-item-delete" onclick="confirmRemoveCartItem('${p._id}')"><i class="fa-solid fa-trash-can"></i></div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    updateSummary();
}

async function updateCartItemQty(productId, change) {
    const userId = localStorage.getItem('userId');
    const item = cartItemsData.find(i => i.productId._id === productId);
    if (!item) return;
    const newQty = item.quantity + change;
    if (newQty < 1) {
        confirmRemoveCartItem(productId);
        return;
    }

    // Kiểm tra số lượng tồn kho trước khi gửi yêu cầu lên backend
    const maxQty = item.productId ? item.productId.quantity : 0;
    if (newQty > maxQty) {
        if (typeof showToast === 'function') {
            showToast(`Chỉ còn tối đa ${maxQty} sản phẩm trong kho!`, 'warning');
        } else {
            alert(`Chỉ còn tối đa ${maxQty} sản phẩm trong kho!`);
        }
        return;
    }

    // Tối ưu DOM update để không reset checked state
    item.quantity = newQty;
    document.getElementById(`qty-${productId}`).value = newQty;
    updateSummary();

    try {
        const res = await fetch(`http://localhost:3000/api/cart/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, productId, quantity: newQty })
        });
        if (res.ok) {
            updateCartBadge();
        } else {
            const errData = await res.json();
            if (typeof showToast === 'function') {
                showToast(errData.message || 'Lỗi khi cập nhật giỏ hàng!', 'error');
            } else {
                alert(errData.message || 'Lỗi khi cập nhật giỏ hàng!');
            }
            // Hoàn tác số lượng ở DOM/model nếu có lỗi từ phía backend
            item.quantity = item.quantity - change;
            document.getElementById(`qty-${productId}`).value = item.quantity;
            updateSummary();
        }
    } catch (e) {
        console.error(e);
        // Hoàn tác trong trường hợp lỗi mạng
        item.quantity = item.quantity - change;
        document.getElementById(`qty-${productId}`).value = item.quantity;
        updateSummary();
    }
}

let pendingRemoveId = null;

window.confirmRemoveCartItem = function(productId) {
    pendingRemoveId = productId;
    document.getElementById('confirmModal').style.display = 'block';
};

window.closeConfirmModal = function() {
    pendingRemoveId = null;
    document.getElementById('confirmModal').style.display = 'none';
};

window.executeRemoveCartItem = function() {
    if (pendingRemoveId) {
        performRemoveCartItem(pendingRemoveId);
    }
    closeConfirmModal();
};

window.showAlertModal = function(message, isError = false, onCloseCallback = null) {
    document.getElementById('alertMessage').innerText = message;
    const iconDiv = document.getElementById('alertIcon');
    if (isError) {
        iconDiv.style.color = '#f25c3a';
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    } else {
        iconDiv.style.color = 'var(--primary-olive-dark)';
        iconDiv.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    }
    const btn = document.getElementById('btnAlertClose');
    btn.onclick = function() {
        closeAlertModal();
        if (onCloseCallback) onCloseCallback();
    };
    document.getElementById('alertModal').style.display = 'block';
};

window.closeAlertModal = function() {
    document.getElementById('alertModal').style.display = 'none';
};

async function performRemoveCartItem(productId) {
    const userId = localStorage.getItem('userId');
    try {
        const res = await fetch(`http://localhost:3000/api/cart/remove`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, productId })
        });
        if (res.ok) {
            const data = await res.json();
            cartItemsData = (data.items || []).filter(item => item.productId);
            checkedItemIds.delete(productId);
            renderCart();
            updateCartBadge();
            if (typeof showToast === 'function') showToast('Đã xoá sản phẩm khỏi giỏ hàng!');
        }
    } catch (e) {
        console.error(e);
    }
}

window.filterCartItems = function(keyword) {
    const rows = document.querySelectorAll('.cart-item-row');
    rows.forEach(row => {
        const titleEl = row.querySelector('.cart-item-title');
        if (titleEl) {
            const text = titleEl.innerText;
            if (window.fuzzyMatch && window.fuzzyMatch(keyword, text)) {
                row.style.display = ''; 
            } else if (!window.fuzzyMatch && text.toLowerCase().includes(keyword.toLowerCase())) {
                row.style.display = ''; 
            } else {
                row.style.display = 'none';
            }
        }
    });
};

// Lấy sản phẩm đang tick chọn
function getSelectedItems() {
    return cartItemsData.filter(i => checkedItemIds.has(i.productId._id));
}

function toggleCheck(id) {
    const cb = document.querySelector(`input[value="${id}"]`);
    if (cb && cb.checked) {
        checkedItemIds.add(id);
    } else {
        checkedItemIds.delete(id);
    }
    updateSummary();
}

window.updateSummary = function() {
    let subtotal = 0;
    if (window.checkoutMode === 'cart') {
        const selected = getSelectedItems();
        selected.forEach(i => {
            subtotal += i.productId.price * i.quantity;
        });
    } else if (window.checkoutMode === 'repurchase') {
        window.repurchaseItems.forEach(i => {
            subtotal += i.price * i.quantity;
        });
    }

    let discount = 0;
    if (appliedPromo) {
        discount = appliedPromo.discountAmount;
    }

    const total = Math.max(0, subtotal - discount);

    document.getElementById('summarySubtotal').innerText = formatVND(subtotal);
    document.getElementById('summaryDiscount').innerText = '- ' + formatVND(discount);
    document.getElementById('summaryTotal').innerText = formatVND(total);
    const modalTotalElement = document.getElementById('summaryModalTotal');
    if (modalTotalElement) {
        modalTotalElement.innerText = formatVND(total);
    }
}

// 3. Tự động điền Form Checkout từ địa chỉ mặc định
async function autoFillCheckout() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await fetch(`http://localhost:3000/api/users/profile/${userId}`);
        const profile = await res.json();
        document.getElementById('checkoutName').value = profile.fullName || '';
        document.getElementById('checkoutPhone').value = profile.phone || '';
    } catch (e) {
        console.error(e);
    }
}

// Load danh sách địa chỉ đã lưu vào checkout
async function loadSavedAddressesForCheckout() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const container = document.getElementById('savedAddressesCheckout');
    if (!container) return;

    try {
        const res = await fetch(`http://localhost:3000/api/users/profile/${userId}`);
        const profile = await res.json();
        const addresses = profile.addresses || [];

        if (addresses.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        const listEl = document.getElementById('savedAddressList');
        listEl.innerHTML = addresses.map(addr => `
            <div class="checkout-saved-addr ${addr.isDefault ? 'selected' : ''}" 
                 data-id="${addr._id}"
                 onclick="selectSavedAddress(this, '${addr.fullName}', '${addr.phone}', '${addr.province}', '${addr.district}', '${addr.ward}', '${addr.detail}')"
            >
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <span style="font-weight:700; font-size:13px;">${addr.label || 'Nhà'}</span>
                    ${addr.isDefault ? '<span style="background:var(--primary-olive); color:#fff; font-size:10px; padding:2px 8px; border-radius:10px;">Mặc định</span>' : ''}
                </div>
                <div style="font-size:13px; color:#333; font-weight:600;">${addr.fullName} &nbsp;|&nbsp; ${addr.phone}</div>
                <div style="font-size:12px; color:#888; margin-top:2px;">${[addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}</div>
            </div>
        `).join('');

        // Tự động điền địa chỉ mặc định
        const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
        if (defaultAddr) {
            fillCheckoutFromAddress(defaultAddr.fullName, defaultAddr.phone, defaultAddr.province, defaultAddr.district, defaultAddr.ward, defaultAddr.detail);
        }
    } catch (e) {
        console.error('Lỗi load địa chỉ:', e);
        container.style.display = 'none';
    }
}

// Chọn địa chỉ đã lưu
window.selectSavedAddress = function(el, fullName, phone, province, district, ward, detail) {
    document.querySelectorAll('.checkout-saved-addr').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    fillCheckoutFromAddress(fullName, phone, province, district, ward, detail);
};

// Điền thông tin vào form từ địa chỉ đã chọn
function fillCheckoutFromAddress(fullName, phone, province, district, ward, detail) {
    document.getElementById('checkoutName').value = fullName || '';
    document.getElementById('checkoutPhone').value = phone || '';
    document.getElementById('checkoutDetail').value = detail || '';

    // Set tỉnh thành theo tên (dùng data-name)
    const provSelect = document.getElementById('checkoutProvince');
    const provOpt = [...provSelect.options].find(o => o.getAttribute('data-name') === province || o.text === province);
    if (provOpt) {
        provSelect.value = provOpt.value;
        // Load districts rồi set huyện
        fetchDistricts(provOpt.value).then(() => {
            const distSelect = document.getElementById('checkoutDistrict');
            const distOpt = [...distSelect.options].find(o => o.getAttribute('data-name') === district || o.text === district);
            if (distOpt) {
                distSelect.value = distOpt.value;
                fetchWards(distOpt.value).then(() => {
                    const wardSelect = document.getElementById('checkoutWard');
                    const wardOpt = [...wardSelect.options].find(o => o.getAttribute('data-name') === ward || o.text === ward);
                    if (wardOpt) wardSelect.value = wardOpt.value;
                });
            }
        });
    }
}

// 4. Áp dụng Promo Code
async function applyPromoCode() {
    const code = document.getElementById('checkoutPromoCode').value.trim();
    if (!code) return;

    try {
        const res = await fetch('http://localhost:3000/api/promotions/all');
        const promos = await res.json();
        const promo = promos.find(p => p.code === code.toUpperCase());
        if (promo && promo.isActive && (!promo.maxUses || promo.usedCount < promo.maxUses)) {
            let currentItems = [];
            if (window.checkoutMode === 'cart') {
                currentItems = getSelectedItems().map(i => i.productId._id);
            } else {
                currentItems = window.repurchaseItems.map(i => i.productId);
            }
            
            const applicableProductIds = promo.applicableProducts ? promo.applicableProducts.map(p => typeof p === 'object' ? p._id.toString() : p.toString()) : [];
            
            if (applicableProductIds.length > 0) {
                const hasApplicable = currentItems.some(id => applicableProductIds.includes(id.toString()));
                const allApplicable = currentItems.every(id => applicableProductIds.includes(id.toString()));
                
                if (!hasApplicable) {
                    showAlertModal('Mã giảm giá không áp dụng cho sản phẩm này!', true);
                    appliedPromo = null;
                    document.getElementById('checkoutPromoCode').value = '';
                    updateSummary();
                    return;
                } else if (!allApplicable) {
                    showAlertModal('Mã giảm giá đã được áp dụng, nhưng không khả dụng cho một số sản phẩm trong đơn!');
                    appliedPromo = promo;
                    updateSummary();
                    return;
                }
            }
            
            appliedPromo = promo;
            showAlertModal('Áp dụng mã giảm giá thành công!');
            updateSummary();
        } else {
            showAlertModal('Mã giảm giá không hợp lệ hoặc đã hết lượt!', true);
            appliedPromo = null;
            document.getElementById('checkoutPromoCode').value = '';
            updateSummary();
        }
    } catch (e) {
        console.error(e);
    }
}

// 5. Đặt hàng
document.getElementById('checkoutForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    let items = [];
    if (window.checkoutMode === 'cart') {
        const selected = getSelectedItems();
        if (selected.length === 0) {
            return showAlertModal('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng!', true);
        }
        items = selected.map(i => ({
            productId: i.productId._id,
            quantity: i.quantity
        }));
    } else {
        items = window.repurchaseItems.map(i => ({
            productId: i.productId,
            quantity: i.quantity
        }));
    }

    const userId = localStorage.getItem('userId');
    
    const provSelect = document.getElementById('checkoutProvince');
    const distSelect = document.getElementById('checkoutDistrict');
    const wardSelect = document.getElementById('checkoutWard');

    const province = provSelect.options[provSelect.selectedIndex].text;
    const district = distSelect.options[distSelect.selectedIndex].text;
    const ward = wardSelect.options[wardSelect.selectedIndex].text;
    const detail = document.getElementById('checkoutDetail').value;
    const customerPhone = document.getElementById('checkoutPhone').value.trim();

    const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
    if (!phoneRegex.test(customerPhone)) {
        return showAlertModal('Số điện thoại không hợp lệ! Vui lòng nhập số điện thoại Việt Nam (10 số).', true);
    }

    const shippingAddress = { province, district, ward, detail };
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    const orderData = {
        customerId: userId,
        customerName: document.getElementById('checkoutName').value,
        customerPhone: customerPhone,
        shippingAddress,
        paymentMethod,
        items,
        promotionCode: appliedPromo ? appliedPromo.code : null,
        note: document.getElementById('checkoutNote').value
    };

    try {
        const res = await fetch('http://localhost:3000/api/orders/place', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        if (res.ok) {
            const data = await res.json();
            // Update lại default address cho user
            await fetch(`http://localhost:3000/api/users/profile/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: shippingAddress })
            });

            showAlertModal('Đặt hàng thành công! ' + (paymentMethod === 'online' ? '(Đang chuyển hướng tới trang thanh toán...)' : ''), false, () => {
                appliedPromo = null;
                document.getElementById('checkoutPromoCode').value = '';
                document.getElementById('checkoutNote').value = '';
                closeCheckoutModal();
                
                // Xóa lại giỏ
                fetchCart(); 
                
                if (paymentMethod === 'online' && data.order) {
                    window.location.href = `payment.html?orderId=${data.order._id}`;
                } else {
                    // Chuyển sang tab Lịch sử đơn hàng
                    showSection('order-history');
                }
            });
        } else {
            const data = await res.json();
            showAlertModal('Lỗi: ' + data.message, true);
        }
    } catch (err) {
        showAlertModal('Lỗi kết nối khi đặt hàng', true);
    }
});

// 6. Checkout Modal
window.openCheckoutModal = function() {
    let itemsToRender = [];
    if (window.checkoutMode === 'cart') {
        const selected = getSelectedItems();
        if (selected.length === 0) {
            showAlertModal('Vui lòng chọn ít nhất 1 sản phẩm để đặt hàng!', true);
            return;
        }
        itemsToRender = selected.map(i => ({
            name: i.productId.name,
            image: (i.productId.images && i.productId.images.length > 0) ? i.productId.images[0] : '/images/placeholder.jpg',
            price: i.productId.price,
            quantity: i.quantity
        }));
    } else {
        itemsToRender = window.repurchaseItems.map(i => ({
            name: i.name || 'Sản phẩm',
            image: i.image || '/images/placeholder.jpg',
            price: i.price,
            quantity: i.quantity
        }));
    }

    const container = document.getElementById('checkoutItemsList');
    if (container) {
        let html = '<h4 style="margin-bottom: 15px; font-size: 16px; color: #333;"><i class="fa-solid fa-box-open" style="color: var(--primary-olive);"></i> Danh sách sản phẩm</h4>';
        itemsToRender.forEach(item => {
            html += `
                <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 10px; border: 1px solid #eee; padding: 10px; border-radius: 8px; background: #fafafa;">
                    <img src="${item.image}" alt="Product" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 14px; color: #333;">${item.name}</div>
                        <div style="font-size: 13px; color: #666;">Số lượng: ${item.quantity}</div>
                    </div>
                    <div style="font-weight: bold; color: #f25c3a; font-size: 14px;">${formatVND(item.price * item.quantity)}</div>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    document.getElementById('checkoutModal').style.display = 'block';
    loadSavedAddressesForCheckout();
}

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').style.display = 'none';
    window.checkoutMode = 'cart';
    window.updateSummary();
}

// Đóng modal khi bấm ra ngoài
window.addEventListener('click', function(event) {
    const checkoutModal = document.getElementById('checkoutModal');
    if (event.target === checkoutModal) {
        window.attemptCloseCheckoutModal();
    }
    const editAddressModal = document.getElementById('editAddressModal');
    if (event.target === editAddressModal) {
        window.attemptCloseEditAddressModal();
    }
});

// THOÁT FORM CONFIRMATION
window.promptExitForm = function(callbackToClose, continueText) {
    const modal = document.getElementById('exitConfirmModal');
    const btnContinue = document.getElementById('btnContinueEdit');
    const btnExit = document.getElementById('btnConfirmExit');
    
    if (continueText) btnContinue.innerText = continueText;
    
    btnContinue.onclick = function() {
        modal.style.display = 'none';
    };
    btnExit.onclick = function() {
        modal.style.display = 'none';
        if(callbackToClose) callbackToClose();
    };
    
    modal.style.display = 'block';
};

window.attemptCloseCheckoutModal = function() {
    promptExitForm(() => window.closeCheckoutModal(), 'Tiếp tục đặt hàng');
};

window.attemptCloseEditAddressModal = function() {
    promptExitForm(() => {
        document.getElementById('editAddressModal').style.display = 'none';
    }, 'Tiếp tục chỉnh sửa');
};

// INIT
window.addEventListener('DOMContentLoaded', () => {
    fetchProvinces();
    fetchCart();
    autoFillCheckout();
});

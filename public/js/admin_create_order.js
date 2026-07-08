let adminOrderItems = [];
let allProducts = [];

async function openCreateOrderModal() {
    adminOrderItems = [];
    document.getElementById('createOrderForm').reset();
    document.getElementById('adminOrderItemsContainer').innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">Chưa có sản phẩm nào được chọn</td></tr>';
    document.getElementById('adminOrderTotalAmount').textContent = '0 đ';
    
    // Load danh sách sản phẩm
    await loadAdminProducts();
    
    // Load tỉnh thành
    await loadAdminProvinces();
    
    const modal = document.getElementById('createOrderModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeCreateOrderModal() {
    const modal = document.getElementById('createOrderModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function openProductPickerModal() {
    const modal = document.getElementById('productPickerModal');
    modal.style.display = 'flex';
    // Clear search
    document.getElementById('adminProductSearch').value = '';
    renderAdminProductGrid(allProducts);
}

function closeProductPickerModal() {
    const modal = document.getElementById('productPickerModal');
    modal.style.display = 'none';
}

async function loadAdminProducts() {
    try {
        const res = await fetch('/api/products/all');
        allProducts = await res.json();
        renderAdminProductGrid(allProducts);
    } catch (err) {
        console.error('Lỗi tải sản phẩm', err);
    }
}

function filterAdminProducts() {
    const text = document.getElementById('adminProductSearch').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(text));
    renderAdminProductGrid(filtered);
}

function renderAdminProductGrid(products) {
    const grid = document.getElementById('adminProductGrid');
    if (!products || products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: #999; padding: 20px;">Không tìm thấy sản phẩm</div>';
        return;
    }
    
    let html = '';
    products.forEach(p => {
        const img = p.images && p.images.length > 0 ? p.images[0] : 'https://placehold.co/100x100?text=No+Image';
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 10px; text-align: center; cursor: pointer; transition: 0.2s; background: #fff;" 
                 onclick="addAdminOrderItem('${p._id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, ${p.quantity})"
                 onmouseover="this.style.borderColor='var(--primary-olive)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" 
                 onmouseout="this.style.borderColor='#ddd'; this.style.boxShadow='none';">
                <img src="${img}" style="width: 100%; height: 70px; object-fit: cover; border-radius: 6px; margin-bottom: 5px;">
                <div style="font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;" title="${p.name}">${p.name}</div>
                <div style="font-size: 13px; color: var(--primary-olive); font-weight: bold; margin-bottom: 2px;">${p.price.toLocaleString('vi-VN')} đ</div>
                <div style="font-size: 11px; color: #888;">Kho: ${p.quantity}</div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function addAdminOrderItem(productId, name, price, stock) {
    if (stock < 1) {
        showToast('Sản phẩm đã hết hàng!', 'error');
        return;
    }
    
    const existingItem = adminOrderItems.find(item => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity + 1 > stock) {
            showToast('Vượt quá số lượng tồn kho!', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        adminOrderItems.push({
            productId,
            name,
            price,
            stock,
            quantity: 1
        });
    }
    
    renderAdminOrderItems();
    showToast('Đã thêm vào đơn hàng', 'success');
}

function updateAdminOrderItemQty(productId, change) {
    const item = adminOrderItems.find(i => i.productId === productId);
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty < 1) {
        removeAdminOrderItem(productId);
        return;
    }
    
    if (newQty > item.stock) {
        showToast('Vượt quá số lượng tồn kho!', 'error');
        return;
    }
    
    item.quantity = newQty;
    renderAdminOrderItems();
}

function removeAdminOrderItem(productId) {
    adminOrderItems = adminOrderItems.filter(item => item.productId !== productId);
    renderAdminOrderItems();
}

function renderAdminOrderItems() {
    const container = document.getElementById('adminOrderItemsContainer');
    if (adminOrderItems.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; padding: 15px;">Chưa có sản phẩm nào được chọn</td></tr>';
        document.getElementById('adminOrderTotalAmount').textContent = '0 đ';
        return;
    }
    
    let html = '';
    let total = 0;
    adminOrderItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    <div style="font-weight: 500; font-size: 13px;">${item.name}</div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px;">${item.price.toLocaleString('vi-VN')} đ</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 4px; overflow: hidden; width: max-content; margin: 0 auto;">
                        <button type="button" onclick="updateAdminOrderItemQty('${item.productId}', -1)" style="border: none; background: #e0e0e0; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">-</button>
                        <span style="width: 30px; text-align: center; font-size: 13px; font-weight: 600;">${item.quantity}</span>
                        <button type="button" onclick="updateAdminOrderItemQty('${item.productId}', 1)" style="border: none; background: #e0e0e0; width: 24px; height: 24px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold;">+</button>
                    </div>
                </td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600; color: var(--primary-olive);">${itemTotal.toLocaleString('vi-VN')} đ</span>
                        <i class="fa-solid fa-trash" style="color: #e74c3c; cursor: pointer; padding: 5px;" onclick="removeAdminOrderItem('${item.productId}')" title="Xóa"></i>
                    </div>
                </td>
            </tr>
        `;
    });
    
    container.innerHTML = html;
    document.getElementById('adminOrderTotalAmount').textContent = total.toLocaleString('vi-VN') + ' đ';
}

// API Tỉnh thành
async function loadAdminProvinces() {
    try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const provinces = await res.json();
        const select = document.getElementById('adminProvince');
        select.innerHTML = '<option value="">-- Chọn Tỉnh/Thành phố --</option>';
        provinces.forEach(p => {
            select.innerHTML += `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadAdminDistricts() {
    const provinceCode = document.getElementById('adminProvince').value;
    const districtSelect = document.getElementById('adminDistrict');
    const wardSelect = document.getElementById('adminWard');
    
    districtSelect.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    
    if (!provinceCode) return;
    
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        data.districts.forEach(d => {
            districtSelect.innerHTML += `<option value="${d.code}" data-name="${d.name}">${d.name}</option>`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadAdminWards() {
    const districtCode = document.getElementById('adminDistrict').value;
    const wardSelect = document.getElementById('adminWard');
    
    wardSelect.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    
    if (!districtCode) return;
    
    try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await res.json();
        data.wards.forEach(w => {
            wardSelect.innerHTML += `<option value="${w.code}" data-name="${w.name}">${w.name}</option>`;
        });
    } catch (err) {
        console.error(err);
    }
}

// Gửi form
async function submitAdminCreateOrder(e) {
    e.preventDefault();
    
    if (adminOrderItems.length === 0) {
        alert('Vui lòng chọn ít nhất 1 sản phẩm!');
        return;
    }
    
    const customerName = document.getElementById('adminCustomerName').value.trim();
    const customerPhone = document.getElementById('adminCustomerPhone').value.trim();
    
    const phoneRegex = /^(84|0[35789])\d{8}$/;
    if (!phoneRegex.test(customerPhone)) {
        alert('Số điện thoại không hợp lệ!');
        return;
    }
    
    const provSelect = document.getElementById('adminProvince');
    const distSelect = document.getElementById('adminDistrict');
    const wardSelect = document.getElementById('adminWard');
    
    const province = provSelect.options[provSelect.selectedIndex]?.dataset?.name || '';
    const district = distSelect.options[distSelect.selectedIndex]?.dataset?.name || '';
    const ward = wardSelect.options[wardSelect.selectedIndex]?.dataset?.name || '';
    const detail = document.getElementById('adminAddressDetail').value.trim();
    
    if (!province || !district || !ward || !detail) {
        alert('Vui lòng điền đầy đủ địa chỉ giao hàng!');
        return;
    }
    
    const paymentMethod = document.getElementById('adminPaymentMethod').value;
    const status = document.getElementById('adminOrderStatus').value;
    let paymentStatus = 'pending';
    if (status === 'completed' || paymentMethod === 'online') {
        paymentStatus = 'paid';
    }
    
    const payload = {
        customerName,
        customerPhone,
        shippingAddress: {
            province,
            district,
            ward,
            detail
        },
        items: adminOrderItems.map(item => ({ productId: item.productId, quantity: item.quantity })),
        paymentMethod,
        paymentStatus,
        status,
        note: document.getElementById('adminOrderNote').value.trim()
    };
    
    try {
        const res = await fetch('/api/orders/admin-place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        if (res.ok) {
            alert('Tạo đơn hàng thành công!');
            closeCreateOrderModal();
            // Load lại danh sách đơn hàng tuỳ vào trang admin hay staff
            if (typeof fetchAdminOrders === 'function') {
                fetchAdminOrders();
            } else if (typeof fetchStaffOrders === 'function') {
                fetchStaffOrders();
            }
        } else {
            alert(data.message || 'Lỗi tạo đơn hàng');
        }
    } catch (err) {
        console.error(err);
        alert('Lỗi kết nối!');
    }
}

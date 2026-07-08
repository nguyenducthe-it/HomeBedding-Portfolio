let isEditingPromo = false;
let currentPromoId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchPromotions();
    loadProductCheckboxes();

    const promoForm = document.getElementById('promoForm');
    if (promoForm) {
        promoForm.addEventListener('submit', handlePromoSubmit);
    }

    // Xử lý tìm kiếm khuyến mãi
    const promoSearch = document.getElementById('promoSearch');
    if (promoSearch) {
        promoSearch.addEventListener('input', () => {
            fetchPromotions();
        });
    }
});

// 1. Lấy danh sách khuyến mãi
async function fetchPromotions() {
    try {
        const res = await fetch('/api/promotions/all');
        let promos = await res.json();
        
        const searchQuery = document.getElementById('promoSearch').value.toLowerCase();
        if (searchQuery) {
            promos = promos.filter(p => 
                p.name.toLowerCase().includes(searchQuery) || 
                p.code.toLowerCase().includes(searchQuery)
            );
        }

        renderPromoTable(promos);
    } catch (err) {
        console.error('Error fetching promos:', err);
    }
}

// 2. Hiển thị bảng khuyến mãi
function renderPromoTable(promos) {
    const tableBody = document.getElementById('promoTableBody');
    tableBody.innerHTML = '';

    promos.forEach(promo => {
        const productNames = promo.applicableProducts.map(p => p.name).join(', ') || 'Tất cả sản phẩm';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${promo.name}</strong></td>
            <td><span class="badge-category" style="background: #e8f5e9; color: #2e7d32;">${promo.code}</span></td>
            <td>${promo.discountAmount.toLocaleString()} đ</td>
            <td>${promo.quantity}</td>
            <td><small>${productNames}</small></td>
            <td>
                <span class="badge-status ${promo.isActive ? 'active' : 'inactive'}">
                    ${promo.isActive ? 'Đang chạy' : 'Đã dừng'}
                </span>
            </td>
            <td>
                <div class="td-actions">
                    <button class="btn-toggle" onclick="togglePromoStatus('${promo._id}', ${promo.isActive})" title="${promo.isActive ? 'Dừng' : 'Kích hoạt'}">
                        <i class="fa-solid ${promo.isActive ? 'fa-pause' : 'fa-play'}"></i>
                    </button>
                    <button class="btn-edit" onclick="editPromotion('${promo._id}')" title="Sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-delete" onclick="deletePromotion('${promo._id}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 3. Load danh sách sản phẩm vào Checkbox List
async function loadProductCheckboxes() {
    try {
        const res = await fetch('/api/products/all');
        const products = await res.json();
        const container = document.getElementById('promoProductsList');
        container.innerHTML = '';
        
        products.forEach(p => {
            const item = document.createElement('div');
            item.className = 'checkbox-item';
            item.innerHTML = `
                <input type="checkbox" id="p-${p._id}" value="${p._id}" name="promoProducts">
                <label for="p-${p._id}">${p.name}</label>
            `;
            container.appendChild(item);
        });
    } catch (err) {
        console.error('Error loading products for checkboxes:', err);
    }
}

// 4. Mở/Đóng Modal
function openPromoModal() {
    isEditingPromo = false;
    currentPromoId = null;
    document.getElementById('promoModalTitle').textContent = 'Tạo Khuyến Mãi Mới';
    document.getElementById('promoForm').reset();
    document.getElementById('promoIsActive').checked = true;
    
    // Bỏ tích tất cả checkbox
    document.querySelectorAll('input[name="promoProducts"]').forEach(cb => cb.checked = false);
    
    document.getElementById('promotionModal').style.display = 'block';
}

function toggleSelectAllProducts() {
    const checkboxes = document.querySelectorAll('input[name="promoProducts"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function closePromoModal() {
    document.getElementById('promotionModal').style.display = 'none';
}

// 5. Thêm/Sửa khuyến mãi
async function handlePromoSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('promoName').value;
    const code = document.getElementById('promoCode').value;
    const discountAmount = parseFloat(document.getElementById('promoAmount').value);
    const quantity = parseInt(document.getElementById('promoQuantity').value);
    const isActive = document.getElementById('promoIsActive').checked;
    
    // Lấy danh sách sản phẩm được tích chọn
    const selectedProducts = Array.from(document.querySelectorAll('input[name="promoProducts"]:checked')).map(cb => cb.value);

    const promoData = { name, code, discountAmount, quantity, applicableProducts: selectedProducts, isActive };

    try {
        let url = '/api/promotions/add';
        let method = 'POST';

        if (isEditingPromo) {
            url = `/api/promotions/update/${currentPromoId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promoData)
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            closePromoModal();
            fetchPromotions();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối server', 'error');
    }
}

// 6. Sửa khuyến mãi
async function editPromotion(id) {
    try {
        const res = await fetch('/api/promotions/all');
        const promos = await res.json();
        const promo = promos.find(p => p._id === id);

        if (promo) {
            isEditingPromo = true;
            currentPromoId = id;
            document.getElementById('promoModalTitle').textContent = 'Cập Nhật Khuyến Mãi';
            document.getElementById('promoName').value = promo.name;
            document.getElementById('promoCode').value = promo.code;
            document.getElementById('promoAmount').value = promo.discountAmount;
            document.getElementById('promoQuantity').value = promo.quantity;
            document.getElementById('promoIsActive').checked = promo.isActive;

            // Tích chọn các sản phẩm đã có
            document.querySelectorAll('input[name="promoProducts"]').forEach(cb => {
                cb.checked = promo.applicableProducts.some(p => p._id === cb.value);
            });

            document.getElementById('promotionModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Error editing promo:', err);
    }
}

// 7. Bật/Tắt trạng thái khuyến mãi nhanh
async function togglePromoStatus(id, currentStatus) {
    try {
        const res = await fetch(`/api/promotions/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !currentStatus })
        });

        if (res.ok) {
            showToast('Cập nhật trạng thái thành công!');
            fetchPromotions();
        } else {
            showToast('Lỗi khi cập nhật trạng thái', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối server', 'error');
    }
}

// 7. Xóa khuyến mãi
function deletePromotion(id) {
    const modal = document.getElementById('confirmModal');
    const btnConfirm = document.getElementById('btnConfirmDelete');
    
    document.getElementById('confirmMessage').textContent = 'Bạn có chắc chắn muốn xóa mã khuyến mãi này không?';
    modal.style.display = 'block';

    btnConfirm.onclick = async () => {
        try {
            const res = await fetch(`/api/promotions/delete/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast('Xóa khuyến mãi thành công!');
                closeConfirmModal();
                fetchPromotions();
            } else {
                const data = await res.json();
                showToast(data.message, 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối server', 'error');
        }
    };
}

// Gán ra global
window.openPromoModal = openPromoModal;
window.closePromoModal = closePromoModal;
window.editPromotion = editPromotion;
window.deletePromotion = deletePromotion;
window.togglePromoStatus = togglePromoStatus;
window.toggleSelectAllProducts = toggleSelectAllProducts;

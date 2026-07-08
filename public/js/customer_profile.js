/* =====================================================
   CUSTOMER PROFILE — customer_profile.js
   ===================================================== */

let currentAddresses = [];
let editingAddressId = null;

// ─── Load profile khi section hiển thị ───────────────
async function loadCustomerProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const res = await fetch(`/api/users/profile/${userId}`);
        const data = await res.json();
        if (!res.ok) return;

        // Điền thông tin cá nhân
        document.getElementById('profileFullName').value = data.fullName || '';
        document.getElementById('profileEmail').value = data.email || '';
        document.getElementById('profilePhone').value = data.phone || '';
        document.getElementById('profileBirthDate').value = data.birthDate || '';
        document.getElementById('profileGender').value = data.gender || '';
        document.getElementById('profileIntro').value = data.intro || '';

        // Avatar
        const avatarEl = document.getElementById('profileAvatarImg');
        const topbarAvatar = document.querySelector('.user-profile img');
        if (data.avatar) {
            avatarEl.src = data.avatar;
            if (topbarAvatar) topbarAvatar.src = data.avatar;
        } else {
            const fallbackUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.fullName || 'User') + '&background=7f866e&color=fff&size=128';
            avatarEl.src = fallbackUrl;
            if (topbarAvatar) topbarAvatar.src = fallbackUrl;
        }

        // Địa chỉ
        currentAddresses = data.addresses || [];
        renderAddressList();

    } catch (err) {
        console.error('Lỗi tải profile:', err);
    }
}

// ─── Lưu thông tin cá nhân ─────────────────────────────
async function saveCustomerProfile() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const btnSave = document.getElementById('btnSaveProfile');
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

    const body = {
        fullName: document.getElementById('profileFullName').value.trim(),
        birthDate: document.getElementById('profileBirthDate').value,
        gender: document.getElementById('profileGender').value,
        intro: document.getElementById('profileIntro').value.trim()
    };

    try {
        const res = await fetch(`/api/users/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            showProfileToast('Lưu thông tin thành công!', 'success');
            // Cập nhật tên ở header
            const nameEl = document.getElementById('user-name-header');
            if (nameEl) nameEl.textContent = body.fullName;
            localStorage.setItem('fullName', body.fullName);

            // Cập nhật topbar avatar fallback nếu không có ảnh đại diện thực tế (sử dụng ui-avatars theo tên mới)
            const profileAvatar = document.getElementById('profileAvatarImg');
            const topbarAvatar = document.querySelector('.user-profile img');
            if (profileAvatar && profileAvatar.src.includes('ui-avatars.com')) {
                const newFallback = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(body.fullName || 'User') + '&background=7f866e&color=fff&size=128';
                profileAvatar.src = newFallback;
                if (topbarAvatar) topbarAvatar.src = newFallback;
            }
        } else {
            showProfileToast(data.message || 'Lỗi khi lưu thông tin', 'error');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi';
    }
}

// ─── Upload Avatar ─────────────────────────────────────
function triggerAvatarUpload() {
    document.getElementById('profileAvatarInput').click();
}

async function handleAvatarUpload(event) {
    const userId = localStorage.getItem('userId');
    const file = event.target.files[0];
    if (!file || !userId) return;

    const formData = new FormData();
    formData.append('avatar', file);

    const avatarEl = document.getElementById('profileAvatarImg');
    avatarEl.style.opacity = '0.5';

    try {
        const res = await fetch(`/api/users/upload-avatar/${userId}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            avatarEl.src = data.avatarUrl;
            // Cập nhật avatar ở topbar nếu có
            const topbarAvatar = document.querySelector('.user-profile img');
            if (topbarAvatar) topbarAvatar.src = data.avatarUrl;
            showProfileToast('Cập nhật ảnh đại diện thành công!', 'success');
        } else {
            showProfileToast(data.message || 'Lỗi upload ảnh', 'error');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    } finally {
        avatarEl.style.opacity = '1';
    }
}

// ─── Đổi mật khẩu ─────────────────────────────────────
async function changeCustomerPassword() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const oldPw = document.getElementById('profileOldPassword').value;
    const newPw = document.getElementById('profileNewPassword').value;
    const confirmPw = document.getElementById('profileConfirmPassword').value;

    if (!oldPw || !newPw || !confirmPw) {
        showProfileToast('Vui lòng điền đầy đủ các ô mật khẩu', 'error');
        return;
    }
    if (newPw !== confirmPw) {
        showProfileToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }

    const btnChange = document.getElementById('btnChangePassword');
    btnChange.disabled = true;
    btnChange.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

    try {
        const res = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, oldPassword: oldPw, newPassword: newPw })
        });
        const data = await res.json();
        if (res.ok) {
            showProfileToast('Đổi mật khẩu thành công!', 'success');
            document.getElementById('profileOldPassword').value = '';
            document.getElementById('profileNewPassword').value = '';
            document.getElementById('profileConfirmPassword').value = '';
        } else {
            showProfileToast(data.message || 'Lỗi đổi mật khẩu', 'error');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    } finally {
        btnChange.disabled = false;
        btnChange.innerHTML = '<i class="fa-solid fa-lock"></i> Đổi mật khẩu';
    }
}

// ─── Quản lý Địa chỉ ───────────────────────────────────
function renderAddressList() {
    const container = document.getElementById('profileAddressList');
    if (!container) return;

    if (currentAddresses.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding: 30px 0; color: #aaa;">
                <i class="fa-solid fa-location-dot" style="font-size:32px; margin-bottom:10px; display:block;"></i>
                Chưa có địa chỉ nào. Hãy thêm địa chỉ đầu tiên!
            </div>`;
        return;
    }

    container.innerHTML = currentAddresses.map(addr => `
        <div class="profile-address-card ${addr.isDefault ? 'is-default' : ''}" data-id="${addr._id}">
            <div class="profile-address-header">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="profile-address-label">
                        <i class="fa-solid fa-${addr.label === 'Văn phòng' ? 'briefcase' : addr.label === 'Khác' ? 'map-pin' : 'house'}"></i>
                        ${addr.label || 'Nhà'}
                    </span>
                    ${addr.isDefault ? '<span class="profile-badge-default"><i class="fa-solid fa-star"></i> Mặc định</span>' : ''}
                </div>
                <div style="display:flex; gap:8px;">
                    ${!addr.isDefault ? `<button class="profile-addr-btn profile-addr-btn-ghost" onclick="setDefaultAddress('${addr._id}')"><i class="fa-regular fa-star"></i> Đặt mặc định</button>` : ''}
                    <button class="profile-addr-btn" onclick="openEditAddress('${addr._id}')"><i class="fa-solid fa-pen"></i> Sửa</button>
                    <button class="profile-addr-btn profile-addr-btn-danger" onclick="deleteAddress('${addr._id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="profile-address-body">
                <p><strong>${addr.fullName || ''}</strong> &nbsp;|&nbsp; ${addr.phone || ''}</p>
                <p style="color:#666; font-size:14px; margin-top:4px;">
                    ${[addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                </p>
            </div>
        </div>
    `).join('');
}

function openAddAddress() {
    editingAddressId = null;
    document.getElementById('addressModalTitle').textContent = 'Thêm địa chỉ mới';
    document.getElementById('addrFormLabel').value = 'Nhà';
    document.getElementById('addrFormFullName').value = localStorage.getItem('fullName') || '';
    document.getElementById('addrFormPhone').value = '';
    document.getElementById('addrFormDetail').value = '';
    document.getElementById('addrFormIsDefault').checked = currentAddresses.length === 0;

    // Reset dropdowns
    resetAddressDropdowns();
    document.getElementById('profileAddressModal').style.display = 'flex';
    loadProvincesForModal();
}

function openEditAddress(addressId) {
    const addr = currentAddresses.find(a => a._id === addressId);
    if (!addr) return;

    editingAddressId = addressId;
    document.getElementById('addressModalTitle').textContent = 'Chỉnh sửa địa chỉ';
    document.getElementById('addrFormLabel').value = addr.label || 'Nhà';
    document.getElementById('addrFormFullName').value = addr.fullName || '';
    document.getElementById('addrFormPhone').value = addr.phone || '';
    document.getElementById('addrFormDetail').value = addr.detail || '';
    document.getElementById('addrFormIsDefault').checked = addr.isDefault || false;

    resetAddressDropdowns();
    document.getElementById('profileAddressModal').style.display = 'flex';

    // Load provinces then pre-select
    loadProvincesForModal(addr.province, addr.district, addr.ward);
}

function closeAddressModal() {
    document.getElementById('profileAddressModal').style.display = 'none';
    editingAddressId = null;
}

async function saveAddress() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    const label = document.getElementById('addrFormLabel').value;
    const fullName = document.getElementById('addrFormFullName').value.trim();
    const phone = document.getElementById('addrFormPhone').value.trim();
    const provinceEl = document.getElementById('addrFormProvince');
    const districtEl = document.getElementById('addrFormDistrict');
    const wardEl = document.getElementById('addrFormWard');
    const detail = document.getElementById('addrFormDetail').value.trim();
    const isDefault = document.getElementById('addrFormIsDefault').checked;

    const province = provinceEl.options[provinceEl.selectedIndex]?.text || '';
    const district = districtEl.options[districtEl.selectedIndex]?.text || '';
    const ward = wardEl.options[wardEl.selectedIndex]?.text || '';

    if (!fullName || !phone || !province || !district || !ward || !detail) {
        showProfileToast('Vui lòng điền đầy đủ thông tin địa chỉ', 'error');
        return;
    }

    // Validate số điện thoại Việt Nam (10 số, bắt đầu 03/05/07/08/09)
    const phoneRegex = /^(0[35789])[0-9]{8}$/;
    if (!phoneRegex.test(phone)) {
        showProfileToast('Số điện thoại không hợp lệ! Phải là 10 số, bắt đầu 03/05/07/08/09', 'error');
        document.getElementById('addrFormPhone').focus();
        return;
    }

    const body = { label, fullName, phone, province, district, ward, detail, isDefault };
    const btnSave = document.getElementById('btnSaveAddress');
    btnSave.disabled = true;

    try {
        let res, data;
        if (editingAddressId) {
            res = await fetch(`/api/users/addresses/${userId}/${editingAddressId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
        } else {
            res = await fetch(`/api/users/addresses/${userId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
            });
        }
        data = await res.json();
        if (res.ok) {
            currentAddresses = data.addresses;
            renderAddressList();
            closeAddressModal();
            showProfileToast(data.message, 'success');
        } else {
            showProfileToast(data.message || 'Lỗi lưu địa chỉ', 'error');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    } finally {
        btnSave.disabled = false;
    }
}

async function deleteAddress(addressId) {
    if (!confirm('Bạn có chắc muốn xoá địa chỉ này?')) return;
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const res = await fetch(`/api/users/addresses/${userId}/${addressId}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok) {
            currentAddresses = data.addresses;
            renderAddressList();
            showProfileToast(data.message, 'success');
        } else {
            showProfileToast(data.message || 'Lỗi xoá địa chỉ', 'error');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    }
}

async function setDefaultAddress(addressId) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
        const res = await fetch(`/api/users/addresses/${userId}/${addressId}/default`, { method: 'PATCH' });
        const data = await res.json();
        if (res.ok) {
            currentAddresses = data.addresses;
            renderAddressList();
            showProfileToast('Đã đặt địa chỉ mặc định!', 'success');
        }
    } catch (err) {
        showProfileToast('Lỗi kết nối server', 'error');
    }
}

// ─── Dropdown tỉnh/huyện/xã cho modal address ──────────
function resetAddressDropdowns() {
    const prov = document.getElementById('addrFormProvince');
    const dist = document.getElementById('addrFormDistrict');
    const ward = document.getElementById('addrFormWard');
    prov.innerHTML = '<option value="">-- Chọn Tỉnh/Thành --</option>';
    dist.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    ward.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    dist.disabled = true;
    ward.disabled = true;
}

async function loadProvincesForModal(preProvince, preDistrict, preWard) {
    try {
        const res = await fetch('https://provinces.open-api.vn/api/p/');
        const provinces = await res.json();
        const select = document.getElementById('addrFormProvince');
        provinces.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.code;
            opt.textContent = p.name;
            if (p.name === preProvince) opt.selected = true;
            select.appendChild(opt);
        });
        // Pre-select nếu đang edit
        if (preProvince) {
            const selected = [...select.options].find(o => o.textContent === preProvince);
            if (selected) {
                select.value = selected.value;
                await loadDistrictsForModal(selected.value, preDistrict, preWard);
            }
        }
    } catch (err) {
        console.error('Lỗi load tỉnh/thành:', err);
    }
}

async function loadDistrictsForModal(provinceCode, preDistrict, preWard) {
    if (!provinceCode) return;
    const select = document.getElementById('addrFormDistrict');
    select.innerHTML = '<option value="">-- Chọn Quận/Huyện --</option>';
    select.disabled = true;
    document.getElementById('addrFormWard').innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    document.getElementById('addrFormWard').disabled = true;

    try {
        const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
        const data = await res.json();
        data.districts.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.code;
            opt.textContent = d.name;
            select.appendChild(opt);
        });
        select.disabled = false;
        if (preDistrict) {
            const selected = [...select.options].find(o => o.textContent === preDistrict);
            if (selected) {
                select.value = selected.value;
                await loadWardsForModal(selected.value, preWard);
            }
        }
    } catch (err) {
        console.error('Lỗi load quận/huyện:', err);
    }
}

async function loadWardsForModal(districtCode, preWard) {
    if (!districtCode) return;
    const select = document.getElementById('addrFormWard');
    select.innerHTML = '<option value="">-- Chọn Phường/Xã --</option>';
    select.disabled = true;

    try {
        const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
        const data = await res.json();
        data.wards.forEach(w => {
            const opt = document.createElement('option');
            opt.value = w.code;
            opt.textContent = w.name;
            select.appendChild(opt);
        });
        select.disabled = false;
        if (preWard) {
            const selected = [...select.options].find(o => o.textContent === preWard);
            if (selected) select.value = selected.value;
        }
    } catch (err) {
        console.error('Lỗi load phường/xã:', err);
    }
}

// ─── Toggle hiển thị mật khẩu ─────────────────────────
function togglePasswordVisibility(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconEl.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        iconEl.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ─── Toast thông báo riêng cho profile (dùng customToast để đồng nhất theme) ────────────────
function showProfileToast(message, type = 'success') {
    if (typeof window.customToast === 'function') {
        window.customToast(message, type);
    } else {
        // Fallback nếu theme_loader chưa load
        const toast = document.getElementById('profileToast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'profile-toast profile-toast-' + type + ' show';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

// ─── Init khi section được mở ─────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Lắng nghe sự kiện mở section
    const origShowSection = window.showSection;
    if (origShowSection) {
        window.showSection = function (sectionId, ...args) {
            origShowSection(sectionId, ...args);
            if (sectionId === 'customer-profile') {
                loadCustomerProfile();
            }
        };
    }
});

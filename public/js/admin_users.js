let isEditingUser = false;
let currentUserId = null;

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();

    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }

    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', () => {
            fetchUsers();
        });
    }
});

// 1. Lấy danh sách người dùng
async function fetchUsers() {
    try {
        const res = await fetch('/api/users/all');
        let users = await res.json();
        
        const searchQuery = document.getElementById('userSearch').value.toLowerCase();
        if (searchQuery) {
            users = users.filter(u => 
                u.fullName.toLowerCase().includes(searchQuery) || 
                u.email.toLowerCase().includes(searchQuery)
            );
        }

        renderUserTable(users);
    } catch (err) {
        console.error('Error fetching users:', err);
    }
}

// 2. Hiển thị bảng người dùng
function renderUserTable(users) {
    const tableBody = document.getElementById('userTableBody');
    tableBody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');
        
        let roleBadgeColor = '#5bc0de'; // Customer
        let roleName = 'Khách hàng';
        if (user.role === 'admin') {
            roleBadgeColor = '#d9534f';
            roleName = 'Admin';
        } else if (user.role === 'staff') {
            roleBadgeColor = '#f0ad4e';
            roleName = 'Nhân viên';
        }

        tr.innerHTML = `
            <td><strong>${user.fullName}</strong></td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td><span class="badge-category" style="background: ${roleBadgeColor}15; color: ${roleBadgeColor}; border: 1px solid ${roleBadgeColor}30;">${roleName}</span></td>
            <td>${user.staffId || '-'}</td>
            <td>
                <div class="td-actions">
                    <button class="btn-edit" onclick="editUser('${user._id}')" title="Sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteUser('${user._id}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// 3. Mở/Đóng Modal
function openUserModal() {
    isEditingUser = false;
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Thêm Tài Khoản Mới';
    document.getElementById('userForm').reset();
    document.getElementById('passwordLabel').innerHTML = 'Mật khẩu <span style="color: red;">*</span>';
    document.getElementById('uPassword').required = true;
    document.getElementById('staffIdNotice').style.display = 'none';
    
    document.getElementById('userModal').style.display = 'block';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

function handleRoleChange() {
    const role = document.getElementById('uRole').value;
    const notice = document.getElementById('staffIdNotice');
    notice.style.display = (role === 'staff') ? 'block' : 'none';
}

// 4. Thêm/Sửa tài khoản
async function handleUserSubmit(e) {
    e.preventDefault();

    const fullName = document.getElementById('uFullName').value;
    const email = document.getElementById('uEmail').value;
    const phone = document.getElementById('uPhone').value;
    const role = document.getElementById('uRole').value;
    const password = document.getElementById('uPassword').value;

    // Kiểm tra định dạng số điện thoại Việt Nam
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
        showToast('Số điện thoại không đúng định dạng Việt Nam!', 'error');
        return;
    }

    const userData = { fullName, email, phone, role };
    if (password) userData.password = password;

    try {
        let url = '/api/users/add';
        let method = 'POST';

        if (isEditingUser) {
            url = `/api/users/update/${currentUserId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        const data = await res.json();
        if (res.ok) {
            showToast(data.message);
            closeUserModal();
            fetchUsers();
        } else {
            showToast(data.message, 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối server', 'error');
    }
}

// 5. Sửa tài khoản (Load dữ liệu)
async function editUser(id) {
    try {
        const res = await fetch('/api/users/all');
        const users = await res.json();
        const user = users.find(u => u._id === id);

        if (user) {
            isEditingUser = true;
            currentUserId = id;
            document.getElementById('userModalTitle').textContent = 'Cập Nhật Tài Khoản';
            document.getElementById('uFullName').value = user.fullName;
            document.getElementById('uEmail').value = user.email;
            document.getElementById('uPhone').value = user.phone;
            document.getElementById('uRole').value = user.role;
            
            document.getElementById('passwordLabel').innerHTML = 'Mật khẩu mới (Để trống nếu không đổi)';
            document.getElementById('uPassword').required = false;
            document.getElementById('uPassword').value = '';
            
            handleRoleChange();
            document.getElementById('userModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Error editing user:', err);
    }
}

// 6. Xóa tài khoản
function deleteUser(id) {
    const modal = document.getElementById('confirmModal');
    const btnConfirm = document.getElementById('btnConfirmDelete');
    
    document.getElementById('confirmMessage').textContent = 'Bạn có chắc chắn muốn xóa tài khoản này không?';
    modal.style.display = 'block';

    btnConfirm.onclick = async () => {
        try {
            const res = await fetch(`/api/users/delete/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast('Xóa tài khoản thành công!');
                closeConfirmModal();
                fetchUsers();
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
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.handleRoleChange = handleRoleChange;
window.fetchUsers = fetchUsers;

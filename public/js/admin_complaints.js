// ===== QUẢN LÝ KHIẾU NẠI & PHẢN HỒI (HỘI THOẠI) =====

async function fetchComplaints() {
    const status = document.getElementById('filterComplaintStatus').value;
    const tableBody = document.getElementById('complaintTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999;">Đang tải dữ liệu...</td></tr>';

    try {
        const res = await fetch(`/api/complaints/all?status=${status}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        renderComplaints(data);
    } catch (err) {
        console.error('Lỗi tải khiếu nại:', err);
        showToast('Không thể tải danh sách khiếu nại!', 'error');
    }
}

function renderComplaints(complaints) {
    const tableBody = document.getElementById('complaintTableBody');
    if (complaints.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#999;">Không có phản hồi nào</td></tr>';
        return;
    }

    tableBody.innerHTML = complaints.map(c => {
        const date = new Date(c.updatedAt).toLocaleDateString('vi-VN');
        const statusBadge = getStatusBadge(c.status);
        const typeText = getComplaintTypeText(c.complaintType);
        
        // Bảo vệ nếu là dữ liệu cũ không có messages
        const lastMsg = (c.messages && c.messages.length > 0) 
            ? c.messages[c.messages.length - 1].text 
            : 'Không có nội dung';

        return `
            <tr>
                <td>${date}</td>
                <td><span style="font-weight:600;">${c.customerName || 'N/A'}</span></td>
                <td>${typeText}</td>
                <td title="${lastMsg}"><div style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${lastMsg}</div></td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn-action btn-edit" onclick="openHandleModal('${c._id}')" title="Trò chuyện">
                        <i class="fa-solid fa-comments"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getStatusBadge(status) {
    switch (status) {
        case 'pending': return '<span class="badge badge-pending">Chờ xử lý</span>';
        case 'processing': return '<span class="badge badge-info">Đang xử lý</span>';
        case 'resolved': return '<span class="badge badge-success">Đã giải quyết</span>';
        default: return status;
    }
}

function getPriorityBadge(priority) {
    switch (priority) {
        case 'high': return '<span style="color: #d9534f; font-weight:700;">Cao</span>';
        case 'medium': return '<span style="color: #f0ad4e; font-weight:700;">Trung bình</span>';
        case 'low': return '<span style="color: #5cb85c; font-weight:700;">Thấp</span>';
        default: return priority;
    }
}

function getComplaintTypeText(type) {
    const types = {
        'attitude': 'Thái độ nhân viên',
        'product_issue': 'Vấn đề sản phẩm',
        'payment_issue': 'Vấn đề thanh toán',
        'other': 'Vấn đề khác'
    };
    return types[type] || type;
}

async function openHandleModal(id) {
    try {
        const res = await fetch(`/api/complaints/detail/${id}`);
        const c = await res.json();
        if (!res.ok) throw new Error(c.message);

        document.getElementById('complaintModalTitle').textContent = `Hội thoại: ${c.customerName}`;
        document.getElementById('handleComplaintId').value = id;
        document.getElementById('handleStatus').value = c.status;
        document.getElementById('handleAdminReply').value = '';

        const threadEl = document.getElementById('complaintThread');
        if (c.messages && c.messages.length > 0) {
            threadEl.innerHTML = c.messages.map(m => {
                const isMe = m.senderRole === 'admin';
                return `
                    <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%; padding: 10px 15px; border-radius: 12px; background: ${isMe ? 'var(--primary-olive)' : '#f1f1f1'}; color: ${isMe ? '#fff' : '#333'}; position: relative;">
                        <div style="font-size: 10px; opacity: 0.7; margin-bottom: 4px;">${m.senderName} (${new Date(m.createdAt).toLocaleTimeString('vi-VN')})</div>
                        <div style="word-break: break-word;">${m.text}</div>
                    </div>
                `;
            }).join('');
        } else {
            threadEl.innerHTML = '<p style="text-align:center; color:#999;">Không có dữ liệu hội thoại.</p>';
        }

        // Reset cờ flag
        let typeInput = document.getElementById('handleFeedbackTypeFlag');
        if (typeInput) {
            typeInput.value = 'customer';
        }

        openModal('complaintModal');
    } catch (err) {
        showToast('Lỗi khi tải chi tiết hội thoại!', 'error');
    }
}

document.getElementById('handleComplaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('handleComplaintId').value;
    const status = 'resolved';
    const text = document.getElementById('handleAdminReply').value;
    const adminId = localStorage.getItem('userId');
    const typeFlag = document.getElementById('handleFeedbackTypeFlag') ? document.getElementById('handleFeedbackTypeFlag').value : 'customer';

    try {
        let endpoint = `/api/complaints/reply/${id}`;
        if (typeFlag === 'staff') {
            endpoint = `/api/staff-feedback/reply/${id}`;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: adminId, senderRole: 'admin', text, status })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        showToast('Đã gửi phản hồi thành công!');
        if (typeFlag === 'staff') {
            openStaffFeedbackModal(id);
            fetchStaffFeedbacks();
        } else {
            openHandleModal(id); // Reload lại thread trong modal
            fetchComplaints();   // Reload bảng bên ngoài
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Hook vào showSection
const _origShowSectionComplaints = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (_origShowSectionComplaints) _origShowSectionComplaints(sectionId, overrideMenuId);
    
    // Quản lý CSS active cho Submenu
    if (sectionId === 'complaint-management' || sectionId === 'staff-feedback-management') {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        const menuComplaints = document.getElementById('menu-complaints');
        menuComplaints.classList.add('active');
        
        const submenu = menuComplaints.querySelector('.sub-menu');
        if (submenu) submenu.classList.add('open');

        // Reset active-sub
        document.querySelectorAll('#menu-complaints .sub-menu li a').forEach(a => a.classList.remove('active-sub'));
        // Set active-sub
        if (sectionId === 'complaint-management') {
            document.querySelector('#menu-complaints .sub-menu li:nth-child(1) a').classList.add('active-sub');
            fetchComplaints();
        } else {
            document.querySelector('#menu-complaints .sub-menu li:nth-child(2) a').classList.add('active-sub');
            fetchStaffFeedbacks();
        }
    }
};

window.toggleComplaintMenu = function(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('menu-complaints');
    const submenu = menu.querySelector('.sub-menu');
    if (submenu) {
        submenu.classList.toggle('open');
    }
};

// ===== QUẢN LÝ PHẢN HỒI NHÂN VIÊN (CHAT) =====

let allStaffChats = [];
let currentAdminChatStaffId = null;

async function fetchStaffFeedbacks() {
    const listBody = document.getElementById('adminStaffChatList');
    if (!listBody) return;
    listBody.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải...</div>';

    try {
        const res = await fetch('/api/staff-chat/admin/all-staffs');
        allStaffChats = await res.json();
        
        listBody.innerHTML = allStaffChats.map(c => {
            const isActive = c.staffId === currentAdminChatStaffId;
            const msgColor = isActive ? '#fff' : '#666';
            const timeColor = isActive ? '#eee' : '#999';
            const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : null;
            let textDisplay = 'Chưa có tin nhắn';
            if (lastMsg) {
                const prefix = lastMsg.senderRole === 'admin' ? 'Bạn: ' : lastMsg.senderName + ': ';
                let msgContent = lastMsg.text || '';
                if (!msgContent && lastMsg.attachmentUrl) msgContent = '[Tệp đính kèm]';
                if (!msgContent && lastMsg.attachedOrderId) msgContent = '[Đơn hàng]';
                textDisplay = prefix + msgContent;
            }
            const timeDisplay = c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '';
            
            const dotDisplay = (!isActive && c.unreadCountAdmin > 0) ? 'block' : 'none'; 

            return `
                <div class="chat-customer-item ${isActive ? 'active' : ''}" style="position:relative; margin: 10px; padding: 15px; border-radius: 12px; border: 1px solid ${isActive ? 'var(--primary-olive)' : '#f0f0f0'}; background: ${isActive ? '#f4f6f3' : '#fff'}; cursor: pointer; transition: all 0.2s;" onclick="selectAdminStaffChat('${c.staffId}', '${c.staffName}')" data-name="${c.staffName.toLowerCase()}" onmouseover="this.style.background='#f4f6f3'" onmouseout="this.style.background='${isActive ? '#f4f6f3' : '#fff'}'">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; padding-right:5px;">
                        <span style="font-weight: 700; font-size: 14px; color: ${isActive ? 'var(--primary-olive-dark)' : '#333'};">${c.staffName}</span>
                        <div style="width: 8px; height: 8px; background: #e74c3c; border-radius: 50%; display: ${dotDisplay};"></div>
                    </div>
                    <div style="font-size: 13px; color: ${isActive ? 'var(--primary-olive)' : '#666'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right:5px;">${textDisplay}</div>
                    <div style="font-size: 11px; color: ${isActive ? '#a1a990' : '#999'}; margin-top: 6px;">${timeDisplay}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listBody.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Lỗi tải hội thoại</div>';
    }
}

function filterStaffChatList() {
    const query = document.getElementById('staffChatSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('#adminStaffChatList .chat-customer-item');
    items.forEach(item => {
        const name = item.getAttribute('data-name');
        if (name && name.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

async function selectAdminStaffChat(staffId, staffName) {
    currentAdminChatStaffId = staffId;
    document.getElementById('adminActiveStaffId').value = staffId;
    
    document.getElementById('adminStaffChatHeader').style.display = 'flex';
    document.getElementById('adminStaffChatInputArea').style.display = 'block';
    document.getElementById('adminStaffChatName').textContent = staffName;
    
    const emptyState = document.querySelector('#adminStaffChatArea .empty-chat-state');
    if(emptyState) emptyState.style.display = 'none';
    
    // Đánh dấu đã đọc
    await fetch(`/api/staff-chat/read/${staffId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
    });
    
    fetchStaffFeedbacks(); // Reload list to update active state and unread dot
    fetchStaffChatMessages(staffId);
}

async function fetchStaffChatMessages(staffId) {
    const area = document.getElementById('adminStaffChatArea');
    area.innerHTML = '<div style="text-align:center; padding:20px;">Đang tải...</div>';
    try {
        const res = await fetch(`/api/staff-chat/thread/${staffId}`);
        const chat = await res.json();
        if (!chat.messages || chat.messages.length === 0) {
            area.innerHTML = '<div class="empty-chat-state" style="color: #999; display: flex; align-items: center; justify-content: center; height: 100%;">Chưa có tin nhắn nào.</div>';
            return;
        }

        area.innerHTML = chat.messages.map(m => {
            const isMe = m.senderRole === 'admin';
            let mediaHtml = '';
            if (m.attachmentUrl) {
                if (m.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    mediaHtml = `<img src="${m.attachmentUrl}" style="max-width: 100%; max-height: 150px; border-radius: 8px; margin-top: 5px; cursor: pointer;" onclick="window.open('${m.attachmentUrl}')" />`;
                } else {
                    const fileName = m.attachmentUrl.split('/').pop();
                    mediaHtml = `<a href="${m.attachmentUrl}" target="_blank" style="color: ${isMe ? '#fff' : 'var(--primary-olive-dark)'}; text-decoration: underline; display: block; margin-top: 5px;"><i class="fa-solid fa-file"></i> ${fileName}</a>`;
                }
            }
            
            let orderHtml = '';
            if (m.attachedOrderId) {
                // Giả định admin có viewOrderDetail tương tự staff
                orderHtml = `<div style="margin-top: 5px; padding: 8px; background: rgba(255,255,255,0.2); border: 1px dashed ${isMe ? '#fff' : 'var(--primary-olive-dark)'}; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="if(typeof openOrderModal === 'function') openOrderModal('${m.attachedOrderId}')">
                    <i class="fa-solid fa-bag-shopping"></i> Đơn hàng #${m.attachedOrderCode}
                </div>`;
            }

            return `
                <div class="chat-msg ${isMe ? 'staff' : 'customer'}" style="margin-bottom: 15px; display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'};">
                    <div style="max-width: 75%; padding: 12px 16px; border-radius: 15px; background: ${isMe ? 'var(--primary-olive)' : '#f1f1f1'}; color: ${isMe ? '#fff' : '#333'}; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                        <div style="font-size: 14px; line-height: 1.4;">${m.text || ''}</div>
                        ${mediaHtml}
                        ${orderHtml}
                    </div>
                    <div style="font-size: 11px; margin-top: 5px; opacity: 0.6; padding: 0 5px;">${new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            `;
        }).join('');
        area.scrollTop = area.scrollHeight;
    } catch (err) {
        area.innerHTML = '<div style="text-align:center; padding:20px; color:red;">Lỗi tải tin nhắn</div>';
    }
}

let adminStaffChatSelectedFile = null;

function handleAdminStaffFileSelect(event) {
    adminStaffChatSelectedFile = event.target.files[0];
    if (adminStaffChatSelectedFile) {
        document.getElementById('adminStaffChatFileName').textContent = adminStaffChatSelectedFile.name;
        document.getElementById('adminStaffChatFilePreview').style.display = 'flex';
    }
}

function clearAdminStaffChatFile() {
    adminStaffChatSelectedFile = null;
    document.getElementById('adminStaffChatFileInput').value = '';
    document.getElementById('adminStaffChatFilePreview').style.display = 'none';
}

let allOrdersForSelect_admin = [];

function openAdminStaffOrderSelect() {
    document.getElementById('orderSelectSearchInput').value = '';
    document.getElementById('orderSelectModal').style.display = 'block';
    
    fetch('/api/orders/all')
    .then(res => res.json())
    .then(orders => {
        allOrdersForSelect_admin = orders;
        renderOrderSelectList_admin(orders);
    });
}

function renderOrderSelectList_admin(orders) {
    const list = document.getElementById('orderSelectList');
    if(!orders || orders.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Không tìm thấy đơn hàng</div>';
        return;
    }
    
    list.innerHTML = orders.map(o => {
        const shortCode = o._id.substring(o._id.length-6).toUpperCase();
        return `
            <div style="padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'" onclick="selectOrderForAdminStaffChat('${o._id}', '${shortCode}')">
                <div>
                    <strong style="color: #333;">#${shortCode}</strong>
                    <div style="font-size: 12px; color: #666;">${o.customerName || 'Khách hàng'} - ${o.totalAmount ? o.totalAmount.toLocaleString('vi-VN') : 0}đ</div>
                </div>
                <div style="font-size: 11px; padding: 3px 8px; background: #f0f0f0; border-radius: 4px;">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
        `;
    }).join('');
}

function filterOrderSelect() { // Function bound to keyup in admin.html
    const q = document.getElementById('orderSelectSearchInput').value.toLowerCase();
    const filtered = allOrdersForSelect_admin.filter(o => {
        const shortCode = o._id.substring(o._id.length-6).toLowerCase();
        const name = (o.customerName || '').toLowerCase();
        return shortCode.includes(q) || name.includes(q);
    });
    renderOrderSelectList_admin(filtered);
}

function selectOrderForAdminStaffChat(orderId, shortCode) {
    document.getElementById('adminStaffAttachedOrderId').value = orderId;
    document.getElementById('adminStaffAttachedOrderCode').value = shortCode;
    document.getElementById('adminStaffOrderCodeDisplay').textContent = shortCode;
    document.getElementById('adminStaffOrderPreview').style.display = 'flex';
    closeModal('orderSelectModal');
}

function clearAdminStaffAttachedOrder() {
    document.getElementById('adminStaffAttachedOrderId').value = '';
    document.getElementById('adminStaffAttachedOrderCode').value = '';
    document.getElementById('adminStaffOrderPreview').style.display = 'none';
}

async function sendAdminStaffChatMessage(e) {
    e.preventDefault();
    const staffId = document.getElementById('adminActiveStaffId').value;
    const input = document.getElementById('adminStaffChatInputText');
    const text = input.value;
    const adminId = localStorage.getItem('userId');
    
    const attachedOrderId = document.getElementById('adminStaffAttachedOrderId').value;
    const attachedOrderCode = document.getElementById('adminStaffAttachedOrderCode').value;
    
    if (!staffId) return;
    if (!text.trim() && !adminStaffChatSelectedFile && !attachedOrderId) return;
    
    let attachmentUrl = '';
    if (adminStaffChatSelectedFile) {
        const formData = new FormData();
        formData.append('file', adminStaffChatSelectedFile);
        try {
            const upRes = await fetch('/api/staff-chat/upload-file', {
                method: 'POST',
                body: formData
            });
            const upData = await upRes.json();
            attachmentUrl = upData.fileUrl;
        } catch (err) {
            showToast('Lỗi tải file', 'error');
            return;
        }
    }
    
    try {
        const res = await fetch(`/api/staff-chat/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                staffId,
                senderId: adminId,
                senderRole: 'admin',
                text,
                attachmentUrl,
                attachedOrderId: attachedOrderId || null,
                attachedOrderCode: attachedOrderCode || ''
            })
        });
        
        if (res.ok) {
            input.value = '';
            clearAdminStaffChatFile();
            clearAdminStaffAttachedOrder();
            fetchStaffChatMessages(staffId);
            fetchStaffFeedbacks(); // Update sidebar last message
        } else {
            showToast('Lỗi gửi tin nhắn', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối', 'error');
    }
}

// ================= ADMIN ORDER MODAL HELPER =================
if (typeof window.formatVND !== 'function') {
    window.formatVND = function(amount) {
        if (amount === undefined || amount === null) return '0đ';
        return amount.toLocaleString('vi-VN') + 'đ';
    }
}

function getOrderStatusDisplayAdmin(status) {
    switch (status) {
        case 'pending': return { text: 'Chờ xác nhận', color: '#f39c12' };
        case 'processing': return { text: 'Đã xác nhận', color: '#3498db' };
        case 'shipping': return { text: 'Đang giao hàng', color: '#9b59b6' };
        case 'completed': return { text: 'Đã hoàn thành', color: '#2ecc71' };
        case 'cancelled': return { text: 'Đã hủy', color: '#e74c3c' };
        default: return { text: 'Không rõ', color: '#999' };
    }
}

async function openOrderModal(id) {
    try {
        const res = await fetch(`/api/orders/all`);
        const orders = await res.json();
        const order = orders.find(o => o._id === id);
        if (!order) return showToast('Không tìm thấy đơn hàng', 'error');

        document.getElementById('adminModalOrderId').textContent = `#${order._id.substring(order._id.length - 8).toUpperCase()}`;

        const statusInfo = getOrderStatusDisplayAdmin(order.status);
        const addressStr = order.shippingAddress ? `${order.shippingAddress.detail}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}` : '';

        let itemsHtml = order.items.map(item => {
            const itemImg = item.productImage ? item.productImage : '../images/placeholder.jpg';
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
                    <p style="margin-bottom: 8px;"><strong>Người nhận:</strong> <span>${order.customerName}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Điện thoại:</strong> <span>${order.customerPhone}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Địa chỉ:</strong> <span>${addressStr}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Ghi chú:</strong> <span>${order.note || 'Không có ghi chú'}</span></p>
                    <p style="margin-bottom: 8px;"><strong>Thanh toán:</strong> ${order.paymentMethod === 'online' ? 'Trực tuyến' : 'Thanh toán khi nhận hàng'}</p>
                    <p style="margin-bottom: 8px;"><strong>Trạng thái:</strong> <span style="color:${statusInfo.color}; font-weight:bold;">${statusInfo.text}</span>${cancelText}</p>
                    <p style="margin-bottom: 0;"><strong>Ngày đặt:</strong> <span>${new Date(order.createdAt).toLocaleString('vi-VN')}</span></p>
                    ${cancelDateHtml}
                    ${completedDateHtml}
                </div>
                <div style="flex: 1; background: #fafafa; padding: 15px; border-radius: 8px;">
                    <h4 style="color:var(--primary-olive-dark); margin-bottom: 10px;">Tóm tắt đơn hàng</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #666;">
                        <span>Tạm tính:</span>
                        <span>${formatVND(order.totalAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #666;">
                        <span>Giảm giá:</span>
                        <span style="color: #f25c3a;">- ${formatVND(order.discountAmount)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd; font-weight: bold; font-size: 16px;">
                        <span>Tổng thanh toán:</span>
                        <span style="color: var(--primary-olive-dark);">${formatVND(order.finalAmount)}</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 style="color:var(--primary-olive-dark); margin-bottom: 15px;">Sản phẩm đã mua</h4>
                ${itemsHtml}
            </div>
        `;
        document.getElementById('adminOrderDetailContent').innerHTML = html;
        document.getElementById('adminOrderDetailModal').style.display = 'block';
    } catch (err) {
        showToast('Lỗi tải chi tiết đơn hàng', 'error');
    }
}

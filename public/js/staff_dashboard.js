// ===== STAFF DASHBOARD HOME PAGE LOGIC (CORRECTED) =====

async function initStaffDashboard() {
    await fetchOrderCounts();
    await fetchLatestCareData();
    fetchCareNotifications();
    fetchReportBadge();
    
    // Auto refresh badges every 30s
    setInterval(() => {
        fetchCareNotifications();
        fetchReportBadge();
    }, 30000);
}

// Hàm cập nhật số lượng thông báo "Chăm sóc khách hàng"
async function fetchCareNotifications() {
    try {
        const [revRes, consRes] = await Promise.all([
            fetch('/api/reviews/unread-count'),
            fetch('/api/consultations/unread-count')
        ]);
        
        let totalUnread = 0;
        if (revRes.ok) {
            const revData = await revRes.json();
            totalUnread += (revData.count || 0);
            const reviewCountEl = document.getElementById('count-unread-reviews');
            if (reviewCountEl) {
                reviewCountEl.textContent = revData.count || 0;
            }
        }
        if (consRes.ok) {
            const consData = await consRes.json();
            totalUnread += (consData.count || 0);
            const msgCountEl = document.getElementById('count-unread-messages');
            if (msgCountEl) {
                msgCountEl.textContent = consData.count || 0;
            }
        }

        const badge = document.getElementById('care-badge');
        if (badge) {
            if (totalUnread > 0) {
                badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (err) {
        console.error('Lỗi khi fetch notifications', err);
    }
}

// Cập nhật badge báo cáo (tin nhắn từ Admin)
window.fetchReportBadge = async function() {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        
        const res = await fetch(`/api/staff-chat/staff/unread-count/${userId}`);
        if (res.ok) {
            const data = await res.json();
            const badge = document.getElementById('report-badge');
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count > 99 ? '99+' : data.count;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        }
    } catch (err) {
        console.error('Lỗi lấy report badge:', err);
    }
}

// 1. Lấy số lượng đơn hàng theo trạng thái
async function fetchOrderCounts() {
    try {
        const res = await fetch('/api/orders/stats/counts');
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        document.getElementById('count-pending').textContent = data.pending || 0;
        document.getElementById('count-confirmed').textContent = data.confirmed || 0;
        document.getElementById('count-shipping').textContent = data.shipping || 0;
        document.getElementById('count-completed').textContent = data.completed || 0;
        document.getElementById('count-cancelled').textContent = data.cancelled || 0;
    } catch (err) {
        console.error('Lỗi tải số lượng đơn hàng:', err);
    }
}

// 2. Lấy dữ liệu Chăm sóc khách hàng (Chat & Đánh giá) cho Trang chủ
async function fetchLatestCareData() {
    try {
        // Lấy tin nhắn chat mới nhất
        const chatRes = await fetch('/api/consultations/all');
        const chats = await chatRes.json();
        renderLatestConsultations(chats);

        // Lấy đánh giá mới nhất
        const reviewRes = await fetch('/api/reviews/all');
        const reviews = await reviewRes.json();
        renderLatestReviews(reviews);
    } catch (err) {
        console.error('Lỗi tải dữ liệu chăm sóc khách hàng:', err);
    }
}

function renderLatestConsultations(chats) {
    const container = document.getElementById('message-preview');
    container.style.display = 'block'; // Tránh display:flex của empty-state
    if (!chats || chats.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px 0;">Chưa có tin nhắn nào</p>';
        return;
    }

    container.innerHTML = chats.slice(0, 3).map(c => {
        const lastMsg = c.messages[c.messages.length - 1];
        const time = new Date(c.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return `
            <div class="stats-item" style="cursor: pointer; display: flex; flex-direction: column; gap: 4px; align-items: stretch;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <strong style="color: var(--primary-olive-dark); font-size: 14px;">${c.customerName}</strong>
                    <span style="font-size: 11px; color: #999; font-weight: 500;">${time}</span>
                </div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #555; font-size: 13px; text-align: left; width: 100%;">${lastMsg.text}</div>
            </div>
        `;
    }).join('');
}

function renderLatestReviews(reviews) {
    const container = document.getElementById('review-preview');
    container.style.display = 'block'; // Tránh display:flex của empty-state
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; padding:20px 0;">Chưa có đánh giá nào</p>';
        return;
    }

    container.innerHTML = reviews.slice(0, 3).map(r => {
        return `
            <div class="stats-item" style="cursor: pointer; display: flex; flex-direction: column; gap: 4px; align-items: stretch;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <strong style="color: var(--primary-olive-dark); font-size: 14px;">${r.customerName || 'Khách hàng'}</strong>
                    <span style="font-size: 11px; color: #999; font-weight: 500;">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; width: 100%;">
                    <strong style="color: #f39c12; font-size: 11px; font-weight: 700;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</strong>
                    <span style="color: #888; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">${r.productName}</span>
                </div>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #555; font-size: 13px; text-align: left; width: 100%;">${r.comment}</div>
            </div>
        `;
    }).join('');
}

// 3. Tab switching trong Chăm sóc khách hàng
function switchCareTab(tab) {
    const revTab = document.getElementById('tab-reviews');
    const consTab = document.getElementById('tab-consult');
    const revContainer = document.getElementById('care-reviews-container');
    const consContainer = document.getElementById('care-consult-container');
    
    const subRev = document.getElementById('sub-reviews');
    const subCons = document.getElementById('sub-consult');
    const subShift = document.getElementById('sub-shift');
    const subSalary = document.getElementById('sub-salary');

    // Reset all sub-highlights in attendance group
    if(subShift) { subShift.style.color = '#666'; subShift.style.fontWeight = '500'; }
    if(subSalary) { subSalary.style.color = '#666'; subSalary.style.fontWeight = '500'; }

    if (tab === 'reviews') {
        // ... (existing review highlighting)
        revTab.style.color = 'var(--primary-olive)';
        revTab.style.fontWeight = 'bold';
        revTab.style.borderBottom = '3px solid var(--primary-olive)';
        consTab.style.color = '#999';
        consTab.style.fontWeight = 'normal';
        consTab.style.borderBottom = '3px solid transparent';
        if (subRev) { subRev.style.color = 'var(--primary-olive)'; subRev.style.fontWeight = 'bold'; }
        if (subCons) { subCons.style.color = '#666'; subCons.style.fontWeight = '500'; }
        revContainer.style.display = 'block';
        consContainer.style.display = 'none';
        fetchStaffReviews();
    } else {
        // ... (existing consult highlighting)
        consTab.style.color = 'var(--primary-olive)';
        consTab.style.fontWeight = 'bold';
        consTab.style.borderBottom = '3px solid var(--primary-olive)';
        revTab.style.color = '#999';
        revTab.style.fontWeight = 'normal';
        revTab.style.borderBottom = '3px solid transparent';
        if (subCons) { subCons.style.color = 'var(--primary-olive)'; subCons.style.fontWeight = 'bold'; }
        if (subRev) { subRev.style.color = '#666'; subRev.style.fontWeight = '500'; }
        consContainer.style.display = 'block';
        revContainer.style.display = 'none';
        fetchStaffConsultations();
    }
}

function switchShiftTab(tab) {
    const subShift = document.getElementById('sub-shift');
    const subSalary = document.getElementById('sub-salary');
    const subRev = document.getElementById('sub-reviews');
    const subCons = document.getElementById('sub-consult');

    // Reset other group sub-highlights
    if(subRev) { subRev.style.color = '#666'; subRev.style.fontWeight = '500'; }
    if(subCons) { subCons.style.color = '#666'; subCons.style.fontWeight = '500'; }

    if (tab === 'shift') {
        if (subShift) { subShift.style.color = 'var(--primary-olive)'; subShift.style.fontWeight = 'bold'; }
        if (subSalary) { subSalary.style.color = '#666'; subSalary.style.fontWeight = '500'; }
    } else {
        if (subSalary) { subSalary.style.color = 'var(--primary-olive)'; subSalary.style.fontWeight = 'bold'; }
        if (subShift) { subShift.style.color = '#666'; subShift.style.fontWeight = '500'; }
    }
}


// 4. Quản lý Đánh giá (Staff)
async function fetchStaffReviews() {
    const listBody = document.getElementById('staffReviewListBody');
    if (!listBody) return;
    
    const filterSelect = document.getElementById('reviewFilterSelect');
    const filterValue = filterSelect ? filterSelect.value : 'all';

    listBody.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải...</div>';

    try {
        const res = await fetch('/api/reviews/all');
        let data = await res.json();
        
        // Filter
        if (filterValue === 'replied') {
            data = data.filter(r => r.staffReply && r.staffReply.trim() !== '');
        } else if (filterValue === 'unreplied') {
            data = data.filter(r => !r.staffReply || r.staffReply.trim() === '');
        }
        
        if (data.length === 0) {
            listBody.innerHTML = '<div style="text-align:center; padding: 20px; color:#666;">Không có đánh giá nào.</div>';
            return;
        }
        
        listBody.innerHTML = data.map(r => {
            let imagesHtml = '';
            if (r.images && r.images.length > 0) {
                imagesHtml = `<div style="display:flex; gap:10px; margin-top:10px;">`;
                r.images.forEach(img => {
                    imagesHtml += `<img src="${img}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; border:1px solid #eee; cursor:pointer;" onclick="window.open('${img}', '_blank')">`;
                });
                imagesHtml += `</div>`;
            }

            let replyHtml = '';
            if (r.staffReply) {
                const replyTime = r.replyDate ? new Date(r.replyDate).toLocaleDateString('vi-VN') : '';
                const staffName = r.staffName || 'Nhân viên';
                replyHtml = `
                    <div style="margin-top: 15px; background: #f2f5f1; padding: 12px 15px; border-radius: 8px; border-left: 3px solid var(--primary-olive);">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <strong style="color: var(--primary-olive-dark); font-size: 13px;"><i class="fa-solid fa-reply"></i> ${staffName} phản hồi:</strong>
                            <span style="font-size: 11px; color: #888;">${replyTime}</span>
                        </div>
                        <p style="margin: 0; color: #444; font-size: 14px; font-style: italic;">${r.staffReply}</p>
                    </div>
                `;
            }

            return `
            <div class="review-card" style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; border-bottom: 1px solid #eee; background: #fff; margin-bottom: 15px; border-radius: 8px;">
                <div class="rev-col-left" style="flex: 0 0 150px;">
                    <div style="font-weight: 600;">${r.customerName}</div>
                    <div style="color:#bc6c25; font-size: 14px; margin-top: 4px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                    <div style="color:#999; font-size: 12px; margin-top: 4px;">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                </div>
                <div class="rev-col-mid" style="flex: 1; padding: 0 20px;">
                    <div style="font-weight: 600; color: var(--primary-olive-dark); margin-bottom: 5px;">${r.productName}</div>
                    <p style="margin:0; font-size: 14px; line-height: 1.5; color: #333;">${r.comment || 'Không có nội dung'}</p>
                    ${imagesHtml}
                    ${replyHtml}
                </div>
                <div class="rev-col-right" style="flex: 0 0 130px; text-align: right;">
                    <button style="padding: 8px 15px; background: ${r.staffReply ? '#e2dfd5' : 'var(--primary-olive)'}; color: ${r.staffReply ? '#333' : '#fff'}; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-family: inherit; width: 100%;" onclick="window.openReviewReplyModal('${r._id}', \`${(r.staffReply || '').replace(/`/g, "'")}\`)">
                        ${r.staffReply ? 'Sửa phản hồi' : 'Phản hồi'}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        listBody.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Lỗi tải đánh giá</div>';
    }
}

window.openReviewReplyModal = function(id, existingReply) {
    document.getElementById('replyReviewId').value = id;
    document.getElementById('staffReplyText').value = existingReply || '';
    if (typeof openModal === 'function') {
        openModal('reviewReplyModal');
    } else {
        document.getElementById('reviewReplyModal').style.display = 'block';
    }
}

// 5. Quản lý Tư vấn (Staff)
let allConsultations = [];

async function fetchStaffConsultations() {
    const listBody = document.getElementById('chatCustomerList');
    if (!listBody) return;
    listBody.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải...</div>';

    try {
        const res = await fetch('/api/consultations/all');
        allConsultations = await res.json();
        
        listBody.innerHTML = allConsultations.map(c => {
            const activeId = document.getElementById('chatActiveConsId').value;
            const lastMsg = c.messages && c.messages.length > 0 ? c.messages[c.messages.length - 1] : { text: '', createdAt: c.updatedAt };
            const timeStr = lastMsg.createdAt ? new Date(lastMsg.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
            const isActive = c._id === activeId;
            const msgColor = isActive ? '#fff' : '#666';
            const timeColor = isActive ? '#eee' : '#999';
            // Giả lập trạng thái chưa đọc (có thể đổi màu đỏ nếu cần)
            const dotDisplay = (!isActive && lastMsg.senderRole === 'customer') ? 'block' : 'none'; 
            
            const ageHours = (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60);
            const deleteIconHtml = ageHours >= 24
                ? `<i class="fa-solid fa-trash" style="position:absolute; right:10px; top:10px; color:${isActive ? '#fff' : '#e74c3c'}; opacity:0.8; cursor:pointer;" title="Xóa phiên" onclick="event.stopPropagation(); deleteStaffConsultation('${c._id}')"></i>`
                : '';

            return `
                <div class="chat-customer-item ${isActive ? 'active' : ''}" style="position:relative;" onclick="selectChatCustomer('${c._id}')" data-name="${c.customerName.toLowerCase()}">
                    ${deleteIconHtml}
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding-right:20px;">
                        <span style="font-weight: 700; font-size: 14px;">${c.customerName}</span>
                        <div style="width: 6px; height: 6px; background: #e74c3c; border-radius: 50%; display: ${dotDisplay};"></div>
                    </div>
                    <div style="font-size: 12px; color: ${msgColor}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right:20px;">${lastMsg.text || '...'}</div>
                    <div style="font-size: 11px; color: ${timeColor}; margin-top: 4px;">Tư vấn #${c._id.substring(c._id.length-6).toUpperCase()} - ${timeStr}</div>
                </div>
            `;
        }).join('');
    } catch (err) {
        listBody.innerHTML = '<div style="text-align:center; padding: 20px; color:red;">Lỗi tải hội thoại</div>';
    }
}

async function deleteStaffConsultation(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa phiên tư vấn này?')) return;
    try {
        const res = await fetch(`/api/consultations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Đã xóa phiên tư vấn.');
            const activeId = document.getElementById('chatActiveConsId').value;
            if (activeId === id) {
                document.getElementById('chatMainHeader').style.display = 'none';
                document.getElementById('chatInputArea').style.display = 'none';
                const threadEl = document.getElementById('chatThread');
                if (threadEl) threadEl.innerHTML = '';
            }
            fetchStaffConsultations();
        } else {
            showToast('Lỗi khi xóa!', 'error');
        }
    } catch(err) {
        showToast('Lỗi kết nối!', 'error');
    }
}

function filterStaffConsultations() {
    const query = document.getElementById('consultSearchInput').value.toLowerCase();
    const items = document.querySelectorAll('.chat-customer-item');
    items.forEach(item => {
        const name = item.getAttribute('data-name');
        if (name && name.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

function selectChatCustomer(id) {
    const cons = allConsultations.find(c => c._id === id);
    if (!cons) return;
    
    document.getElementById('chatActiveConsId').value = id;
    document.getElementById('chatMainHeader').style.display = 'flex';
    document.getElementById('chatInputArea').style.display = 'block';
    document.getElementById('chatActiveCustomerName').textContent = cons.customerName;
    
    // Check 24h rule for staff
    const ageHours = (new Date() - new Date(cons.createdAt)) / (1000 * 60 * 60);
    const formEl = document.getElementById('chatForm');
    const inputArea = document.getElementById('chatInputArea');
    const existingNotice = document.getElementById('staffChatClosedNotice');
    if (existingNotice) existingNotice.remove();

    const attachBtn = formEl ? formEl.querySelector('.btn-attach') : null;
    const inputText = document.getElementById('chatInputText');
    const sendBtn = formEl ? formEl.querySelector('.btn-send') : null;

    if (ageHours >= 24) {
        if (attachBtn) {
            attachBtn.disabled = true;
            attachBtn.style.opacity = '0.5';
            attachBtn.style.pointerEvents = 'none';
        }
        if (inputText) {
            inputText.disabled = true;
            inputText.style.opacity = '0.5';
            inputText.placeholder = 'Phiên chat đã quá 24h và đã đóng...';
        }
        if (sendBtn) {
            sendBtn.disabled = true;
            sendBtn.style.opacity = '0.5';
            sendBtn.style.pointerEvents = 'none';
        }

        const notice = document.createElement('div');
        notice.id = 'staffChatClosedNotice';
        notice.style.cssText = 'text-align: center; padding: 15px; background: #eee; color: #666; border-radius: 8px; font-style: italic; margin-top: 10px;';
        notice.innerText = 'Phiên chat này đã quá 24h và đã đóng (không thể gửi tin nhắn mới).';
        inputArea.appendChild(notice);
    } else {
        if (attachBtn) {
            attachBtn.disabled = false;
            attachBtn.style.opacity = '1';
            attachBtn.style.pointerEvents = 'auto';
        }
        if (inputText) {
            inputText.disabled = false;
            inputText.style.opacity = '1';
            inputText.placeholder = 'Viết tin nhắn...';
        }
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.style.opacity = '1';
            sendBtn.style.pointerEvents = 'auto';
        }
    }

    const emptyState = document.querySelector('.empty-chat-state');
    if(emptyState) emptyState.style.display = 'none';
    
    document.querySelectorAll('.chat-customer-item').forEach(el => el.classList.remove('active'));
    // Select element will be re-rendered via fetchStaffConsultations but let's do it directly first
    fetchStaffConsultations();

    loadChatMessages(cons.messages);
}

function loadChatMessages(messages) {
    const area = document.getElementById('chatMessagesArea');
    area.innerHTML = messages.map(m => {
        const isMe = m.senderRole === 'staff';
        let mediaHtml = '';
        if (m.attachmentUrl) {
            if (m.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                mediaHtml = `<img src="${m.attachmentUrl}" class="chat-msg-img" style="max-width: 100%; border-radius: 8px; margin-top: 5px;" />`;
            } else {
                const fileName = m.attachmentUrl.split('/').pop();
                mediaHtml = `<a href="${m.attachmentUrl}" target="_blank" class="chat-msg-file" style="color: ${isMe ? '#fff' : 'var(--primary-olive-dark)'}; text-decoration: underline;"><i class="fa-solid fa-file"></i> ${fileName}</a>`;
            }
        }
        
        let orderHtml = '';
        if (m.attachedOrderId) {
            orderHtml = `<div style="margin-top: 5px; padding: 8px; background: rgba(255,255,255,0.2); border: 1px dashed ${isMe ? '#fff' : 'var(--primary-olive-dark)'}; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="if(typeof showOrderDetail === 'function') showOrderDetail('${m.attachedOrderId}')">
                <i class="fa-solid fa-bag-shopping"></i> Đơn hàng #${m.attachedOrderCode}
            </div>`;
        }

        return `
            <div class="chat-msg ${isMe ? 'staff' : 'customer'}">
                <div style="font-size: 14px;">${m.text || ''}</div>
                ${mediaHtml}
                ${orderHtml}
                <div style="font-size: 11px; margin-top: 5px; opacity: 0.7; text-align: ${isMe ? 'right' : 'left'};">${new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
            </div>
        `;
    }).join('');
    area.scrollTop = area.scrollHeight;
}

let chatSelectedFile = null;

function handleFileSelect(event) {
    chatSelectedFile = event.target.files[0];
    if (chatSelectedFile) {
        document.getElementById('chatFileName').textContent = chatSelectedFile.name;
        document.getElementById('chatFilePreview').style.display = 'flex';
    }
}

function clearChatFile() {
    chatSelectedFile = null;
    document.getElementById('chatFileInput').value = '';
    document.getElementById('chatFilePreview').style.display = 'none';
}

async function sendChatMessage(e) {
    e.preventDefault();
    const id = document.getElementById('chatActiveConsId').value;
    const text = document.getElementById('chatInputText').value;
    const staffId = localStorage.getItem('userId');
    
    if (!id || (!text.trim() && !chatSelectedFile)) return;
    
    // 24h security guard
    const cons = allConsultations.find(c => c._id === id);
    if (cons) {
        const ageHours = (new Date() - new Date(cons.createdAt)) / (1000 * 60 * 60);
        if (ageHours >= 24) {
            showToast('Phiên chat đã quá 24h và đã đóng', 'error');
            return;
        }
    }
    
    let attachmentUrl = '';
    if (chatSelectedFile) {
        const formData = new FormData();
        formData.append('file', chatSelectedFile);
        try {
            const upRes = await fetch('/api/consultations/upload-file', {
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
        const res = await fetch(`/api/consultations/reply/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: staffId, senderRole: 'staff', text, attachmentUrl })
        });
        const updatedCons = await res.json();
        
        const idx = allConsultations.findIndex(c => c._id === id);
        if (idx > -1) allConsultations[idx] = updatedCons;
        
        document.getElementById('chatInputText').value = '';
        clearChatFile();
        loadChatMessages(updatedCons.messages);
    } catch (err) {
        showToast('Lỗi gửi tin nhắn', 'error');
    }
}

// 6. Quản lý Đơn hàng (Staff)
window.currentStaffOrderFilter = 'active_all';

window.filterStaffOrders = function(status) {
    currentStaffOrderFilter = status;
    // Update active tab UI
    document.querySelectorAll('.staff-order-tabs .order-tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.status === status) tab.classList.add('active');
    });
    fetchStaffOrders(status);
};

window.toggleStaffDateFilter = function() {
    const type = document.getElementById('staffOrderDateType').value;
    const rangeContainer = document.getElementById('staffOrderDateRangeContainer');
    const startInput = document.getElementById('staffOrderStartDateInput');
    const endInput = document.getElementById('staffOrderEndDateInput');
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
    fetchStaffOrders('active_all');
};

function formatVND(val) {
    return Number(val).toLocaleString('vi-VN') + ' đ';
}

function getStatusOptionsHTML(currentStatus, orderId) {
    const statuses = [
        { val: 'pending', text: 'Chờ xác nhận' },
        { val: 'processing', text: 'Đã xác nhận' },
        { val: 'shipping', text: 'Đang giao hàng' },
        { val: 'completed', text: 'Đã hoàn thành' }
    ];
    
    // Determine the index of current status
    let currentIndex = statuses.findIndex(s => s.val === currentStatus);
    if (currentIndex === -1) currentIndex = 99; // if cancelled, disable all

    let options = '';
    statuses.forEach((s, idx) => {
        const disabled = (idx < currentIndex || currentStatus === 'cancelled') ? 'disabled' : '';
        const selected = (s.val === currentStatus) ? 'selected' : '';
        options += `<option value="${s.val}" ${disabled} ${selected}>${s.text}</option>`;
    });

    return `
        <select onchange="updateOrderStatus('${orderId}', this.value)" style="padding: 6px 10px; border: 1px solid var(--primary-olive); border-radius: 5px; outline: none; background: #fdfdfd; cursor: pointer;">
            ${options}
        </select>
    `;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const res = await fetch(`/api/orders/status/${orderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Cập nhật trạng thái thành công', 'success');
            fetchStaffOrders(currentStaffOrderFilter);
        } else {
            showToast(data.message || 'Lỗi cập nhật', 'error');
            fetchStaffOrders(currentStaffOrderFilter);
        }
    } catch (err) {
        showToast('Lỗi mạng', 'error');
        fetchStaffOrders(currentStaffOrderFilter);
    }
}

async function fetchStaffOrders(filterStatus = 'active_all') {
    const container = document.getElementById('staffOrdersContainer');
    const filterDiv = document.getElementById('staffOrderDateFilter');
    if (!container) return;
    
    // Toggle date filter visibility
    if (filterStatus === 'active_all') {
        if(filterDiv) filterDiv.style.display = 'flex';
    } else {
        if(filterDiv) filterDiv.style.display = 'none';
    }

    container.innerHTML = '<div style="text-align: center; color: #888; padding: 40px; background: #fff; border-radius: 12px;">Đang tải...</div>';

    try {
        const url = '/api/orders/all';
        const res = await fetch(url);
        let data = await res.json();
        
        // Date filtering logic
        if (filterStatus === 'active_all') {
            const dateType = document.getElementById('staffOrderDateType')?.value || 'realtime';

            if (dateType === 'date_range') {
                const startDateVal = document.getElementById('staffOrderStartDateInput')?.value;
                const endDateVal = document.getElementById('staffOrderEndDateInput')?.value;
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
                // Sort order: pending -> processing -> shipping -> completed -> cancelled
                const orderMap = { 'pending': 1, 'processing': 2, 'shipping': 3, 'completed': 4, 'cancelled': 5 };
                data.sort((a, b) => {
                    const diff = orderMap[a.status] - orderMap[b.status];
                    if (diff !== 0) return diff;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
            } else {
                // Realtime: Active only, pending -> processing -> shipping
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
                // Đảm bảo luôn mới nhất lên đầu trong từng mục
                data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }
        }

        if (data.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: #888; padding: 40px; background: #fff; border-radius: 12px;">Không có đơn hàng nào.</div>`;
            return;
        }
        
        container.innerHTML = data.map(order => {
            const productCount = order.items.length;
            const mainImage = order.items[0]?.productImage ? `http://localhost:3000${order.items[0].productImage}` : '../images/placeholder.jpg';
            const mainProductName = order.items[0]?.productName || 'Sản phẩm';
            
            let paymentText = order.paymentMethod === 'online' ? 'VNPay/MoMo' : 'COD';
            let statusInfo = getOrderStatusDisplayStaff(order.status);

            return `
            <div class="customer-order-card staff-order-card">
                <div class="customer-order-info" style="display: flex; align-items: center; gap: 15px; width: 100%;">
                    <img src="${mainImage}" alt="${mainProductName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                    <div style="flex: 2;">
                        <h4 style="margin-bottom: 5px; color: #333; font-size: 15px;">${mainProductName} ${productCount > 1 ? `và ${productCount - 1} sản phẩm khác` : ''}</h4>
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
                        ${getStatusOptionsHTML(order.status, order._id)}
                        <button onclick="showOrderDetail('${order._id}')" style="padding: 6px 15px; border: 1px solid var(--primary-olive); background-color: transparent; color: var(--primary-olive); border-radius: 5px; cursor: pointer; transition: all 0.3s; white-space: nowrap;">Xem chi tiết</button>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        container.innerHTML = '<div style="text-align:center; color:red; padding: 40px;">Lỗi tải đơn hàng</div>';
    }
}

let activeStaffOrderId = null;

async function showOrderDetail(id) {
    try {
        const res = await fetch(`/api/orders/all`);
        const orders = await res.json();
        const order = orders.find(o => o._id === id);
        if (!order) return showToast('Không tìm thấy đơn hàng', 'error');

        activeStaffOrderId = order._id;
        document.getElementById('staffModalOrderId').textContent = `#${order._id.substring(order._id.length - 8).toUpperCase()}`;

        const statusInfo = getOrderStatusDisplayStaff(order.status);
        const addressStr = order.shippingAddress ? `${order.shippingAddress.detail}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.province}` : '';

        // Generate Item HTML
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
            cancelText = ` <i style="color: #e74c3c; font-weight: normal;">(Hủy do ${byWho})</i>`;
            
            // Nếu không có cancelledAt trong DB (đơn cũ), dùng updatedAt
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
        document.getElementById('staffOrderDetailContent').innerHTML = html;

        // Configure Status Update Select in Modal
        const selectStatus = document.getElementById('staffModalStatusUpdate');
        const statuses = ['pending', 'processing', 'shipping', 'completed'];
        let currentIndex = statuses.indexOf(order.status);
        if (currentIndex === -1) currentIndex = 99;

        Array.from(selectStatus.options).forEach((opt, idx) => {
            opt.disabled = (idx < currentIndex || order.status === 'cancelled');
            if (opt.value === order.status) opt.selected = true;
        });

        const updateStatusBtn = document.getElementById('staffModalUpdateStatusBtn');
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

        // Configure Cancel Button
        const cancelBtn = document.getElementById('staffModalCancelBtn');
        if (order.status !== 'pending') {
            cancelBtn.style.opacity = '0.5';
            cancelBtn.style.cursor = 'not-allowed';
            cancelBtn.disabled = true;
        } else {
            cancelBtn.style.opacity = '1';
            cancelBtn.style.cursor = 'pointer';
            cancelBtn.disabled = false;
        }

        openModal('staffOrderDetailModal');
    } catch (err) {
        showToast('Lỗi tải chi tiết đơn hàng', 'error');
    }
}

async function updateOrderStatusFromModal() {
    if (!activeStaffOrderId) return;
    const newStatus = document.getElementById('staffModalStatusUpdate').value;
    
    try {
        const res = await fetch(`/api/orders/status/${activeStaffOrderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
            showToast('Cập nhật trạng thái thành công', 'success');
            closeModal('staffOrderDetailModal');
            fetchStaffOrders(currentStaffOrderFilter);
        } else {
            const data = await res.json();
            showToast(data.message || 'Lỗi cập nhật', 'error');
        }
    } catch (err) {
        showToast('Lỗi mạng', 'error');
    }
}

async function cancelOrderFromModal() {
    if (!activeStaffOrderId) return;
    
    // Mở modal xác nhận
    openModal('staffCancelConfirmModal');
    
    const yesBtn = document.getElementById('staffCancelConfirmYes');
    
    // Xóa event listener cũ nếu có để tránh gọi API nhiều lần
    const newYesBtn = yesBtn.cloneNode(true);
    yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
    
    newYesBtn.onclick = async function() {
        closeModal('staffCancelConfirmModal');
        try {
            const staffName = localStorage.getItem('fullName') || '';
            const byWhoStr = staffName ? staffName : 'Nhân viên';
            
            const res = await fetch(`/api/orders/${activeStaffOrderId}/cancel`, { 
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cancelledBy: byWhoStr })
            });
            if (res.ok) {
                showToast('Huỷ đơn hàng thành công', 'success');
                closeModal('staffOrderDetailModal');
                fetchStaffOrders(currentStaffOrderFilter);
            } else {
                const data = await res.json();
                showToast(data.message || 'Lỗi huỷ đơn', 'error');
            }
        } catch (err) {
            showToast('Lỗi mạng', 'error');
        }
    };
}

function getOrderStatusDisplayStaff(status) {
    switch (status) {
        case 'pending': return { text: 'Chờ xác nhận', color: '#e67e22' };
        case 'processing': return { text: 'Đã xác nhận', color: '#f1c40f' };
        case 'shipping': return { text: 'Đang giao', color: '#3498db' };
        case 'completed': return { text: 'Đã hoàn thành', color: 'var(--primary-olive-dark)' };
        case 'cancelled': return { text: 'Đã hủy', color: '#c94f38' };
        default: return { text: status, color: '#666' };
    }
}

// Event Listeners
document.getElementById('reviewReplyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('replyReviewId').value;
    const staffReply = document.getElementById('staffReplyText').value;
    const staffName = localStorage.getItem('fullName') || 'Nhân viên';
    try {
        await fetch(`/api/reviews/reply/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ staffReply, staffName })
        });
        showToast('Đã gửi phản hồi đánh giá!');
        closeModal('reviewReplyModal');
        fetchStaffReviews();
        fetchCareNotifications(); // Cập nhật lại số thông báo
    } catch (err) {}
});

// Removed old consultReplyForm handler

// === QUẢN LÝ LỊCH LÀM VIỆC (THỐNG NHẤT VỚI ADMIN) ===
let currentStartDateStaff = new Date();
let weekDatesStaff = [];
let todayWeekStartStaff = new Date();
let currentStaffUserId = localStorage.getItem('userId');

function initWeekStaff() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    currentStartDateStaff = new Date(today.setDate(diff));
    currentStartDateStaff.setHours(0,0,0,0);
    todayWeekStartStaff = new Date(currentStartDateStaff);

    updateWeekUIStaff();
    fetchWeeklyScheduleStaff();
}

function changeWeekStaff(offset) {
    const newStartDate = new Date(currentStartDateStaff);
    newStartDate.setDate(newStartDate.getDate() + (offset * 7));

    // Tính mốc "Tuần sau" (Giới hạn tối đa giống admin)
    const nextWeekStart = new Date(todayWeekStartStaff);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    if (newStartDate > nextWeekStart) {
        showToast('Chỉ được xem/đăng ký lịch tối đa 1 tuần tiếp theo!', 'warning');
        return;
    }

    currentStartDateStaff = newStartDate;
    updateWeekUIStaff();
    fetchWeeklyScheduleStaff();
}

function updateWeekUIStaff() {
    weekDatesStaff = [];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    let endDate = new Date(currentStartDateStaff);
    endDate.setDate(endDate.getDate() + 6);

    const label = document.getElementById('currentWeekLabelStaff');
    if (label) label.innerText = `${formatDate(currentStartDateStaff)} - ${formatDate(endDate)}`;

    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDateStaff);
        d.setDate(d.getDate() + i);
        
        const dateStr = formatDate(d); // YYYY-MM-DD
        weekDatesStaff.push(dateStr);
        
        const el = document.getElementById(`date-${days[i]}-staff`);
        if (el) el.innerText = `${d.getDate()}/${d.getMonth() + 1}`;
    }
}

async function fetchWeeklyScheduleStaff() {
    const startDate = weekDatesStaff[0];
    const endDate = weekDatesStaff[6];

    try {
        const response = await fetch(`http://localhost:3000/api/attendance/week?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        renderScheduleTableStaff(data.staffs || [], data.isLocked || false);
    } catch (err) {
        console.error('Lỗi lấy lịch tuần:', err);
    }
}

function renderScheduleTableStaff(staffs, isLocked) {
    const tbody = document.getElementById('scheduleTableBodyStaff');
    if (!tbody) return;

    tbody.innerHTML = '';
    const lockIndicator = document.getElementById('lockStatusIndicator');
    if (lockIndicator) {
        if (isLocked) {
            lockIndicator.innerHTML = '<i class="fa-solid fa-lock"></i> Lịch đã chốt';
            lockIndicator.style.color = '#dc3545';
        } else {
            lockIndicator.innerHTML = '<i class="fa-solid fa-lock-open"></i> Lịch đang mở';
            lockIndicator.style.color = '#28a745';
        }
    }

    // Lấy danh sách các ca đã được gán (để đánh dấu ca đã có người)
    const takenShifts = {};
    weekDatesStaff.forEach(date => {
        takenShifts[date] = [];
        staffs.forEach(staff => {
            if (staff.schedule && staff.schedule[date] && staff.schedule[date].shifts) {
                takenShifts[date].push(...staff.schedule[date].shifts);
            }
            if (staff.pendingShifts && staff.pendingShifts[date]) {
                takenShifts[date].push(...staff.pendingShifts[date]);
            }
        });
    });

    staffs.forEach(staff => {
        const isMe = staff._id === currentStaffUserId;
        const tr = document.createElement('tr');
        if (isMe) tr.style.backgroundColor = '#f0f4ef'; // Highlight row của mình

        let html = `
            <td>
                <strong>${staff.fullName} ${isMe ? '(Bạn)' : ''}</strong><br>
                <small style="color: #888;">${staff.staffId || 'N/A'}</small>
            </td>
        `;

        weekDatesStaff.forEach(date => {
            const dayData = staff.schedule && staff.schedule[date] ? staff.schedule[date] : { shifts: [], status: {} };
            html += `<td style="vertical-align: top; text-align: left; padding: 10px;">`;
            
            const shiftDefs = [
                { id: 'morning', label: 'Sáng' },
                { id: 'afternoon', label: 'Chiều' },
                { id: 'evening', label: 'Tối' }
            ];

            shiftDefs.forEach(shiftDef => {
                const isScheduled = dayData.shifts && dayData.shifts.includes(shiftDef.id);
                const isPending = staff.pendingShifts && staff.pendingShifts[date] && staff.pendingShifts[date].includes(shiftDef.id);
                const isTakenByOther = !isScheduled && takenShifts[date].includes(shiftDef.id);
                
                const todayObj = new Date(); todayObj.setHours(0,0,0,0);
                const dParts = date.split('-');
                const dObj = new Date(dParts[0], dParts[1]-1, dParts[2]); dObj.setHours(0,0,0,0);
                const isPast = dObj < todayObj;

                let style = 'font-size: 11px; padding: 5px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #ddd; ';
                let onClick = '';
                let icon = '';

                if (isScheduled) {
                    const status = dayData.status && dayData.status[shiftDef.id] ? dayData.status[shiftDef.id] : 'none';
                    
                    // Logic tính thời gian thực
                    const now = new Date();
                    const currentTotalHours = now.getHours() + now.getMinutes() / 60;
                    
                    let isShiftPast = false;
                    let isShiftActive = false;

                    if (isPast) {
                        isShiftPast = true;
                    } else if (dObj.getTime() === todayObj.getTime()) {
                        if (shiftDef.id === 'morning') {
                            if (currentTotalHours > 12) isShiftPast = true;
                            else if (currentTotalHours >= 6 && currentTotalHours <= 12) isShiftActive = true;
                        } else if (shiftDef.id === 'afternoon') {
                            if (currentTotalHours > 17) isShiftPast = true;
                            else if (currentTotalHours >= 11.5 && currentTotalHours <= 17) isShiftActive = true;
                        } else if (shiftDef.id === 'evening') {
                            // Tối kết thúc lúc 23h45, cho phép điểm danh đến 23h59
                            if (currentTotalHours >= 16.5) isShiftActive = true;
                        }
                    }

                    if (status === 'present' || status === 'late') {
                        style += 'background-color: var(--primary-olive); color: white; border-color: var(--primary-olive); cursor: default;';
                        icon = '<i class="fa-solid fa-check-double" style="margin-left:5px;" title="Đã điểm danh"></i>';
                    } else if (status === 'absent') {
                        style += 'background-color: #dc3545; color: white; border-color: #dc3545; cursor: default;';
                        icon = '<i class="fa-solid fa-xmark" style="margin-left:5px;" title="Vắng mặt"></i>';
                    } else { // status === 'none'
                        if (isShiftPast) {
                            style += 'background-color: #dc3545; color: white; border-color: #dc3545; cursor: default;';
                            icon = '<i class="fa-solid fa-circle-exclamation" style="margin-left:5px;" title="Chưa điểm danh (Quá hạn)"></i>';
                        } else if (isShiftActive && isMe) {
                            // Chỉ mở điểm danh nếu ĐÚNG GIỜ và LÀ CA CỦA MÌNH
                            style += 'background-color: #f39c12; color: white; border-color: #f39c12; cursor: pointer; box-shadow: 0 0 5px rgba(243, 156, 18, 0.5);';
                            icon = '<i class="fa-solid fa-hand-pointer" style="margin-left:5px;" title="Nhấn để điểm danh"></i>';
                            onClick = `onclick="checkInStaff('${staff._id}', '${date}', '${shiftDef.id}')"`;
                        } else {
                            // Tương lai, hoặc ca của người khác đang diễn ra -> Hiển thị bình thường
                            style += 'background-color: var(--primary-olive); color: white; border-color: var(--primary-olive); cursor: default; opacity: 0.8;';
                            icon = '<i class="fa-solid fa-calendar-check" style="margin-left:5px;" title="Đã xếp lịch"></i>';
                        }
                    }
                } else if (isPending) {
                    if (isMe) {
                        style += 'background-color: #fff; color: var(--primary-olive); border: 2px dashed var(--primary-olive); cursor: pointer;';
                        onClick = `onclick="toggleShiftStaff('${staff._id}', '${date}', '${shiftDef.id}', true)"`;
                        icon = '<i class="fa-solid fa-hourglass-start" style="margin-left:5px;" title="Đang chờ duyệt"></i>';
                    } else {
                        style += 'background-color: #fdfdfd; color: #f2f2f2; border-color: #f5f5f5; cursor: default;';
                    }
                } else {
                    if (isMe) {
                        if (isTakenByOther) {
                            style += 'background-color: #f8f9fa; color: #ccc; opacity: 0.5; cursor: not-allowed;';
                        } else if (!isLocked && !isPast) {
                            style += 'background-color: #fff; color: #666; cursor: pointer;';
                            onClick = `onclick="toggleShiftStaff('${staff._id}', '${date}', '${shiftDef.id}', false)"`;
                        } else {
                            style += 'background-color: #f8f9fa; color: #eee; cursor: not-allowed;';
                        }
                    } else {
                        // Đồng nhất hiển thị cho lịch trống của người khác (tránh bị chỗ đậm chỗ nhạt)
                        style += 'background-color: #fdfdfd; color: #f2f2f2; border-color: #f5f5f5; cursor: default;';
                    }
                }

                html += `<div class="shift-box" ${onClick} style="${style}">${shiftDef.label} ${icon}</div>`;
            });
            html += `</td>`;
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

async function toggleShiftStaff(userId, date, shiftId, isCurrentlyPending) {
    if (userId !== currentStaffUserId) return;

    try {
        // Lấy lại data hiện tại của mình trong tuần đó để biết chính xác các ca đang chờ duyệt
        const startDate = weekDatesStaff[0];
        const endDate = weekDatesStaff[6];
        const res = await fetch(`http://localhost:3000/api/attendance/week?startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        const me = data.staffs.find(s => s._id === userId);
        
        let currentPending = (me && me.pendingShifts && me.pendingShifts[date]) ? me.pendingShifts[date] : [];
        let newPending = [...currentPending];

        if (isCurrentlyPending) {
            newPending = newPending.filter(s => s !== shiftId);
        } else {
            // Kiểm tra tổng số ca (đã duyệt + pending) không quá 2
            let currentApproved = (me && me.schedule && me.schedule[date] && me.schedule[date].shifts) ? me.schedule[date].shifts : [];
            if (currentApproved.length + newPending.length >= 2) {
                showToast('Bạn chỉ được đăng ký tối đa 2 ca/ngày!', 'warning');
                return;
            }
            newPending.push(shiftId);
        }

        const weekStartDate = weekDatesStaff[0]; // Truyền thêm ngày đầu tuần
        const saveRes = await fetch('http://localhost:3000/api/attendance/request-schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date, shifts: newPending, weekStartDate })
        });

        if (saveRes.ok) {
            showToast(isCurrentlyPending ? 'Đã hủy đăng ký ca!' : 'Đã đăng ký ca (chờ duyệt)!');
            fetchWeeklyScheduleStaff();
        } else {
            const errData = await saveRes.json();
            showToast(errData.message || 'Lỗi khi cập nhật lịch', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
    }
}

let pendingAttendance = null;
function checkInStaff(userId, date, shiftId) {
    if (userId !== currentStaffUserId) return;
    
    pendingAttendance = { userId, date, shiftId };
    document.getElementById('attendanceConfirmModal').style.display = 'block';
}

async function confirmAttendance() {
    if (!pendingAttendance) return;
    const { userId, date, shiftId } = pendingAttendance;
    closeModal('attendanceConfirmModal');

    try {
        const res = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date, shift: shiftId, statusValue: 'present' })
        });
        const data = await res.json();
        if (res.ok) {
            showToast('Điểm danh thành công!', 'success');
            fetchWeeklyScheduleStaff(); // Tải lại bảng để cập nhật màu sắc
        } else {
            showToast(data.message || 'Lỗi khi điểm danh', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối máy chủ', 'error');
    }
}

// ==================== THÔNG TIN CÁ NHÂN ====================
async function fetchStaffProfile() {
    try {
        const res = await fetch(`/api/users/profile/${currentStaffUserId}`);
        if (!res.ok) return;
        const user = await res.json();
        
        // Cập nhật UI
        document.getElementById('profileNameDisplay').textContent = user.fullName || 'Tên Nhân Viên';
        document.getElementById('profileEmailDisplay').textContent = user.email || '';
        document.getElementById('profileLocationDisplay').textContent = user.location || 'Hà Nội';
        
        // Hiển thị ngày tham gia lấy từ createdAt
        if (user.createdAt) {
            const cd = new Date(user.createdAt);
            document.getElementById('profileJoinDateDisplay').innerHTML = `Tham gia: ${cd.toLocaleDateString('vi-VN')} <br><span style="font-size: 14px; color: #888;">Sinh nhật: ${user.birthDate ? new Date(user.birthDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</span>`;
        } else {
            document.getElementById('profileJoinDateDisplay').textContent = 'Chưa cập nhật';
        }
        
        document.getElementById('profileIntroDisplay').textContent = user.intro || 'Chưa có giới thiệu bản thân...';
        
        if (user.avatar) {
            document.getElementById('profileAvatarDisplay').src = user.avatar;
        }

        // Edu
        if (user.education) {
            document.getElementById('profileUniDisplay').textContent = user.education.university || 'Đại Học ...';
            document.getElementById('profileYearsDisplay').innerHTML = user.education.years ? `<b>Khóa:</b> ${user.education.years}` : '';
            document.getElementById('profileMajorDisplay').innerHTML = user.education.major ? `<b>Chuyên ngành:</b> ${user.education.major}` : '';
            document.getElementById('profileGradeDisplay').innerHTML = user.education.grade ? `<b>Xếp loại:</b> ${user.education.grade}` : '';
        }

        // Skills
        const skillsUl = document.getElementById('profileSkillsDisplay');
        skillsUl.innerHTML = '';
        if (user.skills && user.skills.length > 0) {
            user.skills.forEach(sk => {
                if(!sk.trim()) return;
                const li = document.createElement('li');
                li.style.position = 'relative';
                li.style.marginBottom = '8px';
                li.innerHTML = `<span style="color:var(--primary-olive);position:absolute;left:-15px;">•</span> ${sk.trim()}`;
                skillsUl.appendChild(li);
            });
        } else {
            skillsUl.innerHTML = '<li>Chưa cập nhật kỹ năng</li>';
        }

        // Fill form
        document.getElementById('editProfileName').value = user.fullName || '';
        // Format date for date input
        if (user.birthDate) {
            const bd = new Date(user.birthDate);
            document.getElementById('editProfileBirthDate').value = bd.toISOString().split('T')[0];
        } else {
            document.getElementById('editProfileBirthDate').value = '';
        }
        document.getElementById('editProfileLocation').value = user.location || '';
        document.getElementById('editProfileIntro').value = user.intro || '';
        if (user.education) {
            document.getElementById('editProfileUni').value = user.education.university || '';
            document.getElementById('editProfileYears').value = user.education.years || '';
            document.getElementById('editProfileMajor').value = user.education.major || '';
            document.getElementById('editProfileGrade').value = user.education.grade || '';
        }
        document.getElementById('editProfileSkills').value = user.skills ? user.skills.join(', ') : '';

    } catch (err) {
        console.error(err);
    }
}

function openProfileEditModal() {
    document.getElementById('profileEditModal').style.display = 'block';
}

function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'block';
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const res = await fetch(`/api/users/upload-avatar/${currentStaffUserId}`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('profileAvatarDisplay').src = data.avatarUrl;
            showToast('Đã cập nhật ảnh đại diện');
        } else {
            showToast(data.message || 'Lỗi khi tải ảnh lên', 'error');
        }
    } catch (err) {
        showToast('Lỗi khi tải ảnh lên', 'error');
    }
}

document.getElementById('profileEditForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const skillsArr = document.getElementById('editProfileSkills').value.split(',').map(s => s.trim()).filter(s => s);
    const body = {
        fullName: document.getElementById('editProfileName').value,
        birthDate: document.getElementById('editProfileBirthDate').value,
        location: document.getElementById('editProfileLocation').value,
        intro: document.getElementById('editProfileIntro').value,
        education: {
            university: document.getElementById('editProfileUni').value,
            years: document.getElementById('editProfileYears').value,
            major: document.getElementById('editProfileMajor').value,
            grade: document.getElementById('editProfileGrade').value
        },
        skills: skillsArr
    };

    try {
        const res = await fetch(`/api/users/profile/${currentStaffUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            showToast('Đã lưu thông tin cá nhân');
            closeModal('profileEditModal');
            fetchStaffProfile();
            document.getElementById('header-user-name').textContent = body.fullName;
        } else {
            showToast('Lỗi cập nhật', 'error');
        }
    } catch (err) {
        showToast('Lỗi cập nhật', 'error');
    }
});

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp!', 'error');
        return;
    }

    try {
        const res = await fetch(`/api/users/profile/${currentStaffUserId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        if (res.ok) {
            showToast('Đổi mật khẩu thành công');
            closeModal('passwordModal');
            document.getElementById('passwordForm').reset();
        } else {
            showToast('Lỗi đổi mật khẩu', 'error');
        }
    } catch (err) {
        showToast('Lỗi đổi mật khẩu', 'error');
    }
});

// Khởi tạo
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('staff.html')) {
        initStaffDashboard();
        initWeekStaff();
        setInterval(fetchWeeklyScheduleStaff, 30000);
        setInterval(fetchCareNotifications, 10000); // Polling mỗi 10 giây
    }
});

const _origShowSectionStaff = window.showSection;
window.showSection = function(sectionId) {
    if (_origShowSectionStaff) _origShowSectionStaff(sectionId);
    
    // Explicitly manage active highlight class for support and profile items
    if (sectionId === 'report-admin' || sectionId === 'profile') {
        document.querySelectorAll('.sidebar-menu li, .sidebar-bottom li').forEach(li => {
            li.classList.remove('active');
        });
        const activeMenuId = sectionId === 'report-admin' ? 'menu-report' : 'menu-profile';
        const activeMenuEl = document.getElementById(activeMenuId);
        if (activeMenuEl) {
            activeMenuEl.classList.add('active');
        }
    }

    if (sectionId === 'dashboard-home') initStaffDashboard();
    else if (sectionId === 'order-management') fetchStaffOrders();
    else if (sectionId === 'customer-care') switchCareTab('reviews');
    else if (sectionId === 'shift-management') {
        initWeekStaff();
    }
    else if (sectionId === 'salary-view') {
        fetchStaffSalary();
    }
    else if (sectionId === 'profile') {
        fetchStaffProfile();
    }
    else if (sectionId === 'report-admin') {
        fetchStaffAdminChat();
    }
};

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function formatDate(date) {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
}

// 7. Lấy dữ liệu Lương cá nhân (Staff)
async function fetchStaffSalary() {
    try {
        let monthPicker = document.getElementById('staffSalaryMonthPicker');
        if (!monthPicker.value) {
            const now = new Date();
            const y = now.getFullYear();
            const m = (now.getMonth() + 1).toString().padStart(2, '0');
            monthPicker.value = `${y}-${m}`;
        }
        const monthStr = monthPicker.value;

        const response = await fetch(`/api/attendance/salary-details/${currentStaffUserId}?month=${monthStr}`);
        const data = await response.json();
        
        const tbody = document.getElementById('staffSalaryTableBody');
        
        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: red;">${data.message || 'Lỗi tải dữ liệu'}</td></tr>`;
            return;
        }

        // Cập nhật thông tin tổng quan
        document.getElementById('staffBaseSalaryDisplay').textContent = `${(data.salaryPerShift || 0).toLocaleString('vi-VN')} đ`;
        document.getElementById('staffWorkedShiftsDisplay').textContent = `${data.workedShifts || 0} ca`;
        document.getElementById('staffTotalSalaryDisplay').textContent = `${(data.totalSalary || 0).toLocaleString('vi-VN')} VNĐ`;

        // Render bảng chi tiết
        tbody.innerHTML = '';
        if (!data.details || data.details.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Không có dữ liệu ca làm việc trong tháng này.</td></tr>';
            return;
        }

        data.details.forEach((item, index) => {
            const parts = item.date.split('-');
            const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
            
            let statusHtml = '';
            if (item.status === 'present') {
                statusHtml = '<span style="color: var(--primary-olive); font-weight: 600;"><i class="fa-solid fa-circle-check"></i> Có mặt</span>';
            } else if (item.status === 'late') {
                statusHtml = '<span style="color: #f39c12; font-weight: 600;"><i class="fa-solid fa-clock"></i> Đi trễ</span>';
            } else {
                statusHtml = '<span style="color: #dc3545; font-weight: 600;"><i class="fa-solid fa-circle-xmark"></i> Vắng mặt</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align: center; padding: 12px; border: 1px solid #eee;">${index + 1}</td>
                <td style="text-align: center; font-weight: 500; padding: 12px; border: 1px solid #eee;">${formattedDate}</td>
                <td style="text-align: center; padding: 12px; border: 1px solid #eee;">Ca ${item.shiftLabel}</td>
                <td style="text-align: center; padding: 12px; border: 1px solid #eee;">${statusHtml}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error('Lỗi khi tải lương:', err);
    }
}

// 8. Quản lý Báo cáo & Hỗ trợ (Staff-Admin Chat)
async function fetchStaffAdminChat() {
    const area = document.getElementById('staffAdminChatArea');
    if (!area) return;
    
    try {
        const res = await fetch(`/api/staff-chat/thread/${currentStaffUserId}`);
        const chat = await res.json();
        
        if (!res.ok) throw new Error(chat.message);
        
        // Reset unread count
        await fetch(`/api/staff-chat/read/${currentStaffUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'staff' })
        });
        
        if (!chat.messages || chat.messages.length === 0) {
            area.innerHTML = '<div class="empty-chat-state" style="color: #999; display: flex; align-items: center; justify-content: center; height: 100%;">Chưa có tin nhắn nào. Bắt đầu báo cáo ngay!</div>';
            return;
        }

        area.innerHTML = chat.messages.map(m => {
            const isMe = m.senderRole === 'staff';
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
                orderHtml = `<div style="margin-top: 5px; padding: 8px; background: rgba(255,255,255,0.2); border: 1px dashed ${isMe ? '#fff' : 'var(--primary-olive-dark)'}; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="showOrderDetail('${m.attachedOrderId}')">
                    <i class="fa-solid fa-bag-shopping"></i> Đơn hàng #${m.attachedOrderCode}
                </div>`;
            }

            return `
                <div class="chat-msg ${isMe ? 'staff' : 'customer'}">
                    <div style="font-size: 14px;">${m.text || ''}</div>
                    ${mediaHtml}
                    ${orderHtml}
                    <div style="font-size: 11px; margin-top: 5px; opacity: 0.7; text-align: ${isMe ? 'right' : 'left'};">${new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            `;
        }).join('');
        
        area.scrollTop = area.scrollHeight;
    } catch (err) {
        area.innerHTML = '<div style="text-align:center; color:red; padding: 20px;">Lỗi tải hội thoại</div>';
    }
}

let staffAdminChatSelectedFile = null;

function handleStaffAdminFileSelect(event) {
    staffAdminChatSelectedFile = event.target.files[0];
    if (staffAdminChatSelectedFile) {
        document.getElementById('staffAdminChatFileName').textContent = staffAdminChatSelectedFile.name;
        document.getElementById('staffAdminChatFilePreview').style.display = 'flex';
    }
}

function clearStaffAdminChatFile() {
    staffAdminChatSelectedFile = null;
    document.getElementById('staffAdminChatFileInput').value = '';
    document.getElementById('staffAdminChatFilePreview').style.display = 'none';
}

let allOrdersForSelect_staff = [];

function openStaffAdminOrderSelect() {
    document.getElementById('orderSelectSearchInput').value = '';
    document.getElementById('orderSelectModal').style.display = 'block';
    
    fetch('/api/orders/all')
    .then(res => res.json())
    .then(orders => {
        allOrdersForSelect_staff = orders;
        renderOrderSelectList_staff(orders);
    });
}

function renderOrderSelectList_staff(orders) {
    const list = document.getElementById('orderSelectList');
    if(!orders || orders.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">Không tìm thấy đơn hàng</div>';
        return;
    }
    
    list.innerHTML = orders.map(o => {
        const shortCode = o._id.substring(o._id.length-6).toUpperCase();
        return `
            <div style="padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='transparent'" onclick="selectOrderForStaffAdminChat('${o._id}', '${shortCode}')">
                <div>
                    <strong style="color: #333;">#${shortCode}</strong>
                    <div style="font-size: 12px; color: #666;">${o.customerName || 'Khách hàng'} - ${o.totalAmount ? o.totalAmount.toLocaleString('vi-VN') : 0}đ</div>
                </div>
                <div style="font-size: 11px; padding: 3px 8px; background: #f0f0f0; border-radius: 4px;">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
        `;
    }).join('');
}

function filterOrderSelect() { // Function bound to keyup in staff.html
    const q = document.getElementById('orderSelectSearchInput').value.toLowerCase();
    const filtered = allOrdersForSelect_staff.filter(o => {
        const shortCode = o._id.substring(o._id.length-6).toLowerCase();
        const name = (o.customerName || '').toLowerCase();
        return shortCode.includes(q) || name.includes(q);
    });
    renderOrderSelectList_staff(filtered);
}

function selectOrderForStaffAdminChat(orderId, shortCode) {
    document.getElementById('staffAdminAttachedOrderId').value = orderId;
    document.getElementById('staffAdminAttachedOrderCode').value = shortCode;
    document.getElementById('staffAdminOrderCodeDisplay').textContent = shortCode;
    document.getElementById('staffAdminOrderPreview').style.display = 'flex';
    closeModal('orderSelectModal');
}

function clearStaffAdminAttachedOrder() {
    document.getElementById('staffAdminAttachedOrderId').value = '';
    document.getElementById('staffAdminAttachedOrderCode').value = '';
    document.getElementById('staffAdminOrderPreview').style.display = 'none';
}

async function sendStaffAdminChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById('staffAdminChatInput');
    const text = input.value;
    
    const attachedOrderId = document.getElementById('staffAdminAttachedOrderId').value;
    const attachedOrderCode = document.getElementById('staffAdminAttachedOrderCode').value;
    
    if (!text.trim() && !staffAdminChatSelectedFile && !attachedOrderId) return;
    
    let attachmentUrl = '';
    if (staffAdminChatSelectedFile) {
        const formData = new FormData();
        formData.append('file', staffAdminChatSelectedFile);
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
                staffId: currentStaffUserId,
                senderId: currentStaffUserId,
                senderRole: 'staff',
                text,
                attachmentUrl,
                attachedOrderId: attachedOrderId || null,
                attachedOrderCode: attachedOrderCode || ''
            })
        });
        
        if (res.ok) {
            input.value = '';
            clearStaffAdminChatFile();
            clearStaffAdminAttachedOrder();
            fetchStaffAdminChat();
        } else {
            showToast('Lỗi gửi tin nhắn', 'error');
        }
    } catch (err) {
        showToast('Lỗi kết nối', 'error');
    }
}


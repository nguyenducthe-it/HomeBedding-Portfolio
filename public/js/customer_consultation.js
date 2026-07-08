// ===== CUSTOMER CONSULTATION LOGIC =====

let allConsultations = [];

async function initConsultation() {
    await fetchConsultationHistory();
}

async function fetchConsultationHistory() {
    const customerId = localStorage.getItem('userId');
    const container = document.getElementById('consult-history-list');
    
    try {
        const res = await fetch(`/api/consultations/my/${customerId}`);
        const list = await res.json();
        // Hiển thị lại tất cả các phiên chat
        allConsultations = list;
        
        if (allConsultations.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">Chưa có lịch sử tư vấn nào.</p>';
            return;
        }

        container.innerHTML = list.map(c => {
            const lastMsg = c.messages[c.messages.length - 1];
            const ageHours = (new Date() - new Date(c.createdAt)) / (1000 * 60 * 60);
            const deleteIconHtml = ageHours >= 24 
                ? `<i class="fa-solid fa-trash" style="position: absolute; right: 15px; top: 15px; color: #e74c3c; font-size: 14px; padding: 5px; cursor: pointer; z-index: 2;" title="Xóa phiên chat" onclick="event.stopPropagation(); deleteConsultation('${c._id}')"></i>` 
                : '';
                
            return `
                <div onclick="openConsultChat('${c._id}')" style="background: #fff; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); cursor: pointer; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; position: relative;">
                    ${deleteIconHtml}
                    <div style="padding-right: 30px;">
                        <div style="font-weight: 600; color: var(--primary-olive); margin-bottom: 5px;">Tư vấn #${c._id.substring(c._id.length-6).toUpperCase()}</div>
                        <div style="font-size: 13px; color: #666; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${lastMsg.senderRole === 'staff' ? 'NV: ' : 'Bạn: '}${lastMsg.text}
                        </div>
                    </div>
                    <div style="font-size: 11px; color: #999;">${new Date(c.updatedAt).toLocaleDateString('vi-VN')}</div>
                </div>
            `;
        }).join('');
    } catch (err) {}
}

async function deleteConsultation(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa phiên trò chuyện này?')) return;
    try {
        const res = await fetch(`/api/consultations/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showCustomAlert('Đã xóa phiên trò chuyện.');
            const currentChatId = document.getElementById('consultReplyId').value;
            if (currentChatId === id) {
                document.getElementById('consult-chat-view').style.display = 'none';
                document.getElementById('consult-start-view').style.display = 'block';
            }
            fetchConsultationHistory();
        } else {
            showCustomAlert('Lỗi khi xóa!');
        }
    } catch(err) {
        showCustomAlert('Lỗi kết nối!');
    }
}

let consultSelectedFile = null;
let consultSelectedOrder = null;

function handleConsultFileSelect(event) {
    consultSelectedFile = event.target.files[0];
    updateConsultPreview();
}

async function openConsultOrderModal() {
    const customerId = localStorage.getItem('userId');
    try {
        const res = await fetch(`/api/orders/my-orders/${customerId}`);
        let orders = await res.json();
        // Sắp xếp đơn hàng mới nhất lên đầu
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const listEl = document.getElementById('consultOrderList');
        if (orders.length === 0) {
            listEl.innerHTML = '<div style="text-align: center; color: #999;">Bạn chưa có đơn hàng nào.</div>';
        } else {
            listEl.innerHTML = orders.map(o => {
                const firstImg = (o.items && o.items.length > 0 && o.items[0].productImage) ? o.items[0].productImage : '/images/placeholder.jpg';
                return `
                <div style="padding: 10px; border: 1px solid #eee; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 15px;" onclick="selectConsultOrder('${o._id}', '${o._id.substring(o._id.length-6).toUpperCase()}')">
                    <img src="${firstImg}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; color: #333;">Đơn hàng #${o._id.substring(o._id.length-6).toUpperCase()}</div>
                        <div style="color: #666; font-size: 12px;">${new Date(o.createdAt).toLocaleDateString('vi-VN')} - <span style="color: var(--primary-olive); font-weight: bold;">${o.finalAmount.toLocaleString()}đ</span></div>
                    </div>
                </div>
                `;
            }).join('');
        }
        document.getElementById('consultOrderModal').style.display = 'block';
    } catch (err) {}
}

function selectConsultOrder(id, code) {
    consultSelectedOrder = { id, code };
    closeModal('consultOrderModal');
    updateConsultPreview();
}

function clearConsultAttachment(type) {
    if (type === 'file') {
        consultSelectedFile = null;
        document.getElementById('consultReplyFile').value = '';
    }
    if (type === 'order') consultSelectedOrder = null;
    updateConsultPreview();
}

function updateConsultPreview() {
    const previewEl = document.getElementById('consultPreviewArea');
    let html = '';
    if (consultSelectedFile) {
        html += `<span style="margin-right: 15px;">Đính kèm file: ${consultSelectedFile.name} <i class="fa-solid fa-xmark" style="cursor: pointer; color: red;" onclick="clearConsultAttachment('file')"></i></span>`;
    }
    if (consultSelectedOrder) {
        html += `<span>Đính kèm đơn hàng: #${consultSelectedOrder.code} <i class="fa-solid fa-xmark" style="cursor: pointer; color: red;" onclick="clearConsultAttachment('order')"></i></span>`;
    }
    previewEl.innerHTML = html;
}

function showCustomAlert(msg) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';
    const box = document.createElement('div');
    box.style.cssText = 'background:#fff;padding:30px;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.2);max-width:400px;text-align:center;';
    box.innerHTML = `<h3 style="color:var(--primary-olive);margin-bottom:15px;font-family:'Playfair Display',serif;font-size:22px;">Thông báo</h3><p style="color:#333;margin-bottom:20px;line-height:1.5;">${msg}</p><button style="padding:10px 30px;background:var(--primary-olive);color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Đã hiểu</button>`;
    box.querySelector('button').onclick = () => overlay.remove();
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

async function startNewConsultation() {
    if (allConsultations && allConsultations.length > 0) {
        // Tìm phiên mới nhất
        const latestCons = allConsultations[0];
        const ageHours = (new Date() - new Date(latestCons.createdAt)) / (1000 * 60 * 60);
        if (ageHours < 24) {
            showCustomAlert('Bạn đang có một phiên trò chuyện trong ngày hôm nay. Vui lòng tiếp tục trò chuyện ở phiên đó!');
            openConsultChat(latestCons._id);
            return;
        }
    }

    document.getElementById('consult-start-view').style.display = 'none';
    document.getElementById('consult-chat-view').style.display = 'block';
    document.getElementById('consultReplyId').value = '';
    document.getElementById('consultReplyText').value = '';
    document.getElementById('consult-chat-thread').innerHTML = '';
    clearConsultAttachment('file');
    clearConsultAttachment('order');
    document.getElementById('consultReplyForm').style.display = 'flex';
    document.getElementById('consultClosedNotice')?.remove();
}

function openConsultChat(id) {
    const cons = allConsultations.find(c => c._id === id);
    if (!cons) return;
    document.getElementById('consult-start-view').style.display = 'none';
    document.getElementById('consult-chat-view').style.display = 'block';
    document.getElementById('consultReplyId').value = id;
    
    // Check 24h rule
    const ageHours = (new Date() - new Date(cons.createdAt)) / (1000 * 60 * 60);
    const form = document.getElementById('consultReplyForm');
    const existingNotice = document.getElementById('consultClosedNotice');
    if (existingNotice) existingNotice.remove();
    
    if (ageHours >= 24) {
        form.style.display = 'none';
        const notice = document.createElement('div');
        notice.id = 'consultClosedNotice';
        notice.style.cssText = 'text-align: center; padding: 15px; background: #eee; color: #666; border-radius: 8px; font-style: italic;';
        notice.innerText = 'Phiên chat này đã quá 24h và đã bị đóng. Vui lòng mở phiên chat mới để được hỗ trợ.';
        form.parentNode.insertBefore(notice, form);
    } else {
        form.style.display = 'flex';
    }
    
    refreshConsultChat();
}

async function refreshConsultChat() {
    const id = document.getElementById('consultReplyId').value;
    const customerId = localStorage.getItem('userId');
    try {
        const res = await fetch(`/api/consultations/my/${customerId}`);
        const list = await res.json();
        const cons = list.find(item => item._id === id);
        
        const threadEl = document.getElementById('consult-chat-thread');
        threadEl.innerHTML = cons.messages.map(m => {
            const isMe = m.senderRole === 'customer';
            
            let mediaHtml = '';
            if (m.attachmentUrl) {
                if (m.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    mediaHtml = `<img src="${m.attachmentUrl}" style="max-width: 100%; border-radius: 8px; margin-top: 5px;" />`;
                } else {
                    const fileName = m.attachmentUrl.split('/').pop();
                    mediaHtml = `<a href="${m.attachmentUrl}" target="_blank" style="color: ${isMe ? '#fff' : 'var(--primary-olive)'}; text-decoration: underline;"><i class="fa-solid fa-file"></i> ${fileName}</a>`;
                }
            }
            
            let orderHtml = '';
            if (m.attachedOrderId) {
                orderHtml = `<div style="margin-top: 5px; padding: 8px; background: rgba(255,255,255,0.2); border: 1px dashed ${isMe ? '#fff' : 'var(--primary-olive)'}; border-radius: 6px; font-size: 12px; cursor: pointer;" onclick="if(typeof openOrderDetailsModal === 'function') openOrderDetailsModal('${m.attachedOrderId}')">
                    <i class="fa-solid fa-bag-shopping"></i> Đơn hàng #${m.attachedOrderCode}
                </div>`;
            }

            return `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 80%; padding: 12px 18px; border-radius: 20px; ${isMe ? 'border-bottom-right-radius: 5px;' : 'border-bottom-left-radius: 5px;'} background: ${isMe ? 'var(--primary-olive-dark)' : '#e0e0e0'}; color: ${isMe ? '#fff' : '#333'}; font-size: 14px;">
                    <div style="word-break: break-word;">${m.text || ''}</div>
                    ${mediaHtml}
                    ${orderHtml}
                    <div style="font-size: 11px; margin-top: 5px; opacity: 0.7; text-align: ${isMe ? 'right' : 'left'};">${new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
                </div>
            `;
        }).join('');
        threadEl.scrollTop = threadEl.scrollHeight;
    } catch (err) {}
}

function backToConsultList() {
    document.getElementById('consult-start-view').style.display = 'block';
    document.getElementById('consult-chat-view').style.display = 'none';
    fetchConsultationHistory();
}

document.getElementById('consultReplyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('consultReplyId').value;
    const text = document.getElementById('consultReplyText').value;
    const senderId = localStorage.getItem('userId');
    const customerName = localStorage.getItem('fullName');

    if (!text && !consultSelectedFile && !consultSelectedOrder) return;
    
    let attachmentUrl = '';
    if (consultSelectedFile) {
        const formData = new FormData();
        formData.append('file', consultSelectedFile);
        try {
            const upRes = await fetch('/api/consultations/upload-file', {
                method: 'POST',
                body: formData
            });
            const upData = await upRes.json();
            attachmentUrl = upData.fileUrl;
        } catch (err) {
            alert("Lỗi upload file");
            return;
        }
    }

    const payload = {
        senderId,
        customerName,
        text,
        attachmentUrl,
        attachedOrderId: consultSelectedOrder ? consultSelectedOrder.id : null,
        attachedOrderCode: consultSelectedOrder ? consultSelectedOrder.code : null,
        senderRole: 'customer'
    };

    try {
        if (!id) {
            const res = await fetch('/api/consultations/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customerId: senderId, ...payload })
            });
            const data = await res.json();
            document.getElementById('consultReplyId').value = data._id;
        } else {
            await fetch(`/api/consultations/reply/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        document.getElementById('consultReplyText').value = '';
        clearConsultAttachment('file');
        clearConsultAttachment('order');
        refreshConsultChat();
        fetchConsultationHistory();
    } catch (err) {}
});

// --- Order History & Reviews ---
async function fetchOrderHistory() {
    const customerId = localStorage.getItem('userId');
    const tableBody = document.getElementById('customerOrderTableBody');
    if (!tableBody) return;

    try {
        const res = await fetch(`/api/orders/my-orders/${customerId}`);
        const orders = await res.json();

        tableBody.innerHTML = orders.map(o => {
            const date = new Date(o.createdAt).toLocaleDateString('vi-VN');
            const canReview = o.status === 'completed';
            return `
                <tr>
                    <td>#${o._id.substring(o._id.length-6).toUpperCase()}</td>
                    <td>${date}</td>
                    <td style="font-weight:700;">${o.finalAmount.toLocaleString()}đ</td>
                    <td>${getStatusBadge(o.status)}</td>
                      <td>
                          ${canReview ? `
                              <button class="btn-action" onclick="if(typeof goToReviews === 'function') goToReviews('${o._id}');" style="background:var(--primary-olive); color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">
                                  <i class="fa-solid fa-star"></i> Đánh giá
                              </button>
                          ` : '<span style="color:#999; font-size:12px;">N/A</span>'}
                      </td>
                </tr>
            `;
        }).join('');
    } catch (err) {}
}

function getStatusBadge(status) {
    const map = {
        'pending': '<span class="badge badge-pending">Chờ xác nhận</span>',
        'processing': '<span class="badge badge-info">Đang xử lý</span>',
        'shipping': '<span class="badge badge-info">Đang giao</span>',
        'completed': '<span class="badge badge-success">Hoàn thành</span>',
        'cancelled': '<span class="badge badge-danger">Đã hủy</span>'
    };
    return map[status] || status;
}

// Review Logic đã được chuyển sang customer_reviews.js và goToReviews

function resetStars() {
    const stars = document.querySelectorAll('#star-rating i');
    stars.forEach(s => s.style.color = '#ddd');
    updateStars(5);
}

function updateStars(val) {
    document.getElementById('ratingValue').value = val;
    const stars = document.querySelectorAll('#star-rating i');
    stars.forEach(s => {
        if (parseInt(s.dataset.value) <= val) s.style.color = '#f39c12';
        else s.style.color = '#ddd';
    });
}

document.querySelectorAll('#star-rating i').forEach(star => {
    star.addEventListener('click', () => updateStars(parseInt(star.dataset.value)));
});

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productId = document.getElementById('revProductId').value;
    const customerId = localStorage.getItem('userId');
    const customerName = localStorage.getItem('fullName');
    const rating = document.getElementById('ratingValue').value;
    const comment = document.getElementById('reviewComment').value;

    try {
        const res = await fetch('/api/reviews/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, customerId, customerName, rating, comment })
        });
        if (res.ok) {
            showToast('Cảm ơn bạn đã đánh giá sản phẩm!');
            closeModal('reviewModal');
        }
    } catch (err) {}
});

// Update showSection hook
const _origShowSectionCons = window.showSection;
window.showSection = function(sectionId) {
    if (_origShowSectionCons) _origShowSectionCons(sectionId);
    
    // Ẩn tất cả section customer
    document.querySelectorAll('.customer-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';

    if (sectionId === 'consultation') initConsultation();
    else if (sectionId === 'order-history') fetchOrderHistory();
};

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

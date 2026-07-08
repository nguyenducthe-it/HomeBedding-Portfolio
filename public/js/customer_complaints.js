// ===== QUẢN LÝ PHẢN HỒI KHÁCH HÀNG (HỘI THOẠI) =====

function switchFbTab(tab) {
    const newTab = document.getElementById('tab-new-fb');
    const historyTab = document.getElementById('tab-history-fb');
    const newContainer = document.getElementById('fb-new-container');
    const historyContainer = document.getElementById('fb-history-container');

    if (tab === 'new') {
        newTab.style.color = 'var(--primary-olive)';
        newTab.style.borderBottomColor = 'var(--primary-olive)';
        historyTab.style.color = '#999';
        historyTab.style.borderBottomColor = 'transparent';
        newContainer.style.display = 'block';
        historyContainer.style.display = 'none';
    } else {
        historyTab.style.color = 'var(--primary-olive)';
        historyTab.style.borderBottomColor = 'var(--primary-olive)';
        newTab.style.color = '#999';
        newTab.style.borderBottomColor = 'transparent';
        newContainer.style.display = 'none';
        historyContainer.style.display = 'block';
        fetchFeedbackHistory();
    }
}

async function fetchFeedbackHistory() {
    const customerId = localStorage.getItem('userId');
    const historyList = document.getElementById('fb-history-list');
    const chatView = document.getElementById('fb-chat-view');

    historyList.style.display = 'flex';
    chatView.style.display = 'none';
    historyList.innerHTML = '<p style="text-align:center; color:#999;">Đang tải...</p>';

    try {
        const res = await fetch(`/api/complaints/my-history/${customerId}`);
        const data = await res.json();

        if (data.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:#999; padding: 20px;">Bạn chưa có phản hồi nào.</p>';
            return;
        }

        historyList.innerHTML = data.map(h => {
            const lastMsg = h.messages[h.messages.length - 1].text;
            const statusText = getStatusVN(h.status);
            return `
                <div onclick="openChat('${h._id}')" style="padding: 15px; border: 1px solid #eee; border-radius: 10px; cursor: pointer; transition: background 0.2s; position: relative;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <strong style="color: var(--primary-olive);">${getComplaintTypeText(h.complaintType)}</strong>
                        <span style="font-size: 12px; color: #999;">${new Date(h.updatedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <p style="font-size: 14px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 5px;">${lastMsg}</p>
                    <span style="font-size: 11px; padding: 2px 8px; border-radius: 10px; background: ${getStatusColor(h.status)}; color: #fff;">${statusText}</span>
                </div>
            `;
        }).join('');
    } catch (err) {
        historyList.innerHTML = '<p style="color:red;">Lỗi tải lịch sử.</p>';
    }
}

function getStatusVN(status) {
    const map = { 'pending': 'Chờ xử lý', 'processing': 'Đang xử lý', 'resolved': 'Đã giải quyết' };
    return map[status] || status;
}

function getStatusColor(status) {
    const map = { 'pending': '#f0ad4e', 'processing': '#5bc0de', 'resolved': '#5cb85c' };
    return map[status] || '#999';
}

function getComplaintTypeText(type) {
    const types = { 'attitude': 'Thái độ phục vụ', 'product_issue': 'Chất lượng sản phẩm', 'payment_issue': 'Thanh toán/Hoàn tiền', 'other': 'Góp ý khác' };
    return types[type] || type;
}

async function openChat(id) {
    const historyList = document.getElementById('fb-history-list');
    const chatView = document.getElementById('fb-chat-view');
    const threadEl = document.getElementById('fb-chat-thread');

    historyList.style.display = 'none';
    chatView.style.display = 'block';
    threadEl.innerHTML = '<p style="text-align:center;">Đang tải hội thoại...</p>';
    document.getElementById('fbReplyId').value = id;

    try {
        const res = await fetch(`/api/complaints/detail/${id}`);
        const c = await res.json();

        threadEl.innerHTML = c.messages.map(m => {
            const isMe = m.senderRole === 'customer';
            return `
                <div style="align-self: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 85%; padding: 10px 15px; border-radius: 12px; background: ${isMe ? 'var(--primary-olive)' : '#e9e9e9'}; color: ${isMe ? '#fff' : '#333'};">
                    <div style="font-size: 10px; opacity: 0.7; margin-bottom: 3px;">${m.senderName}</div>
                    <div style="word-break: break-word; font-size: 14px;">${m.text}</div>
                </div>
            `;
        }).join('');

        setTimeout(() => { threadEl.scrollTop = threadEl.scrollHeight; }, 50);
    } catch (err) {
        threadEl.innerHTML = '<p style="color:red;">Lỗi tải hội thoại.</p>';
    }
}

function backToHistory() {
    document.getElementById('fb-history-list').style.display = 'flex';
    document.getElementById('fb-chat-view').style.display = 'none';
}

// Xử lý gửi phản hồi mới
document.getElementById('customerFeedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const customerId = localStorage.getItem('userId');
    const formData = {
        customerId,
        complaintType: document.getElementById('fbType').value,
        description: document.getElementById('fbDescription').value
    };

    try {
        const res = await fetch('/api/complaints/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        showToast('Đã gửi phản hồi thành công!');
        document.getElementById('customerFeedbackForm').reset();
        switchFbTab('history');
    } catch (err) {
        showToast(err.message, 'error');
    }
});

// Xử lý trả lời trong chat
document.getElementById('fbReplyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('fbReplyId').value;
    const text = document.getElementById('fbReplyText').value;
    const customerId = localStorage.getItem('userId');

    try {
        const res = await fetch(`/api/complaints/reply/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: customerId, senderRole: 'customer', text })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        document.getElementById('fbReplyText').value = '';
        openChat(id); // Reload thread
    } catch (err) {
        showToast(err.message, 'error');
    }
});

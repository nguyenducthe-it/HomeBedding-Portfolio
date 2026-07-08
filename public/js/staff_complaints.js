// ===== GỬI PHẢN HỒI TỪ STAFF =====

function openFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'block';
}

function closeFeedbackModal() {
    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('feedbackForm').reset();
}

// Đóng modal khi click ra ngoài
window.onclick = function(event) {
    const modal = document.getElementById('feedbackModal');
    if (event.target == modal) {
        closeFeedbackModal();
    }
}

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const reporterId = localStorage.getItem('userId');
    if (!reporterId) {
        showToast('Không tìm thấy mã nhân viên. Vui lòng Đăng xuất và Đăng nhập lại!', 'error');
        return;
    }

    const formData = {
        reporterId,
        complaintType: document.getElementById('fbType').value,
        priority: document.getElementById('fbPriority').value,
        customerName: document.getElementById('fbCustName').value,
        customerPhone: document.getElementById('fbCustPhone').value,
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

        showToast('Cảm ơn bạn! Phản hồi đã được gửi tới Admin.');
        closeFeedbackModal();
    } catch (err) {
        showToast('Lỗi: ' + err.message, 'error');
    }
});

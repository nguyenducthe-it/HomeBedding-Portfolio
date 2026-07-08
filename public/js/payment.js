// payment.js - Handle VietQR payment and customer confirmation
const apiOrigin = (window.location.port === '3000') ? '' : 'http://localhost:3000';
let currentOrderId = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentOrderId = urlParams.get('orderId');

    if (!currentOrderId) {
        showAlert('Lỗi: Không tìm thấy thông tin đơn hàng.', true, () => {
            window.location.href = 'customer.html';
        });
        return;
    }

    loadOrderDetails();
});

async function loadOrderDetails() {
    try {
        const res = await fetch(`${apiOrigin}/api/orders/${currentOrderId}`);
        if (!res.ok) throw new Error('Không thể tải thông tin đơn hàng.');
        const order = await res.json();

        // 1. Cập nhật giao diện thông tin chuyển khoản
        const shortCode = currentOrderId.slice(-6).toUpperCase();
        const paymentDesc = `HBD ${shortCode}`;
        
        document.getElementById('payment-amount').innerText = Number(order.finalAmount).toLocaleString('vi-VN') + ' đ';
        document.getElementById('payment-amount-raw').innerText = order.finalAmount;
        document.getElementById('payment-desc').innerText = paymentDesc;

        // 2. Tạo mã QR động qua cổng VietQR
        const qrContainer = document.getElementById('qr-container');
        const bankId = 'MB'; // MB Bank
        const bankAcc = '081020052001'; // Số tài khoản
        const accountName = encodeURIComponent('Nguyen Duc The');
        const amount = order.finalAmount;
        const addInfo = encodeURIComponent(paymentDesc);

        // Sinh link QR VietQR
        const qrUrl = `https://img.vietqr.io/image/${bankId}-${bankAcc}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
        
        qrContainer.innerHTML = `<img src="${qrUrl}" alt="Mã QR thanh toán VietQR" style="max-width: 100%; border-radius: 8px;">`;

    } catch (err) {
        console.error(err);
        showAlert('Không thể tải thông tin thanh toán. Vui lòng quay lại sau.', true);
    }
}

// Hàm copy text và hiển thị toast
function copyText(elementId, labelName) {
    const text = document.getElementById(elementId).innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Đã sao chép ${labelName} thành công!`);
    }).catch(err => {
        console.error('Không thể sao chép:', err);
    });
}

function showToast(message) {
    const toast = document.getElementById('toast-msg');
    const toastText = document.getElementById('toast-text');
    toastText.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Xác nhận đã chuyển khoản
async function confirmPayment() {
    if (!currentOrderId) return;
    const btn = document.getElementById('btn-confirm');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';

    try {
        const res = await fetch(`${apiOrigin}/api/payment/confirm-transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: currentOrderId })
        });

        const data = await res.json();
        if (res.ok) {
            showAlert(data.message, false, () => {
                window.location.href = 'customer.html?show=orders';
            });
        } else {
            showAlert(data.message || 'Có lỗi xảy ra khi gửi xác nhận.', true);
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tôi đã chuyển khoản thành công';
        }
    } catch (err) {
        console.error(err);
        showAlert('Lỗi kết nối server khi gửi xác nhận.', true);
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Tôi đã chuyển khoản thành công';
    }
}

// Custom alert modal helpers
function showAlert(message, isError = false, callback = null) {
    const modal = document.getElementById('customAlertModal');
    const text = document.getElementById('alertModalText');
    const title = document.getElementById('alertModalTitle');
    const btn = document.getElementById('alertModalBtn');

    title.innerText = isError ? 'Có lỗi xảy ra' : 'Thông báo';
    title.style.color = isError ? '#d9534f' : 'var(--primary-olive-dark)';
    text.innerText = message;
    
    modal.style.display = 'flex';
    
    btn.onclick = () => {
        modal.style.display = 'none';
        if (callback) callback();
    };
}

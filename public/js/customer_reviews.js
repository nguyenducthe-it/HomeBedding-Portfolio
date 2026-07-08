// ================= SWITCH TAB =================
function switchReviewTab(tab) {
    document.querySelectorAll('.order-tab[data-rev]').forEach(el => el.classList.remove('active'));
    document.querySelector(`.order-tab[data-rev="${tab}"]`).classList.add('active');
    
    if (tab === 'pending') {
        document.getElementById('review-pending-list').style.display = 'flex';
        document.getElementById('review-done-list').style.display = 'none';
    } else {
        document.getElementById('review-pending-list').style.display = 'none';
        document.getElementById('review-done-list').style.display = 'flex';
    }
}

window.customerReviews = [];
window.pendingReviewItems = []; // Danh sách các sản phẩm chờ đánh giá
let reviewImagesToKeep = [];

async function loadCustomerReviews() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('fullName') || 'Khách hàng';
    if (!userId) return;
    
    try {
        // 1. Lấy tất cả đánh giá của user
        const resReviews = await fetch(`/api/reviews/user/${userId}`);
        window.customerReviews = await resReviews.json();
        
        // 2. Lấy tất cả đơn hàng completed của user
        const resOrders = await fetch(`/api/orders/my-orders/${userId}`);
        const orders = await resOrders.json();
        const completedOrders = orders.filter(o => o.status === 'completed');
        
        window.pendingReviewItems = [];
        
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                // Kiểm tra xem item này trong order này đã được đánh giá chưa
                const isReviewed = window.customerReviews.find(r => r.orderId === order._id && r.productId === (item.productId._id || item.productId));
                if (!isReviewed) {
                    window.pendingReviewItems.push({
                        orderId: order._id,
                        orderDate: order.createdAt,
                        deliveryDate: order.completedAt || order.updatedAt,
                        productId: item.productId._id || item.productId,
                        productName: item.productName || 'Sản phẩm',
                        productImage: item.productImage
                    });
                }
            });
        });

        renderPendingReviews();
        renderDoneReviews();

    } catch (err) {
        console.error("Lỗi khi tải đánh giá:", err);
    }
}

function renderPendingReviews() {
    const list = document.getElementById('review-pending-list');
    if (!list) return;

    if (window.pendingReviewItems.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#999; padding: 20px;">Bạn không có sản phẩm nào chờ đánh giá.</p>`;
        return;
    }

    let html = '';
    window.pendingReviewItems.forEach(item => {
        const mainImage = item.productImage ? `http://localhost:3000${item.productImage}` : 'https://via.placeholder.com/100';
        
        html += `
            <div style="display:flex; background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05); align-items:center; gap:20px;">
                <img src="${mainImage}" alt="${item.productName}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px 0; color:#333;">${item.productName}</h4>
                    <p style="margin:0 0 3px 0; color:#666; font-size:13px;">Mã đơn: #${item.orderId.substring(item.orderId.length - 6).toUpperCase()} - Ngày mua: ${new Date(item.orderDate).toLocaleDateString('vi-VN')}</p>
                    <p style="margin:0; color:#28a745; font-size:13px; font-weight:500;">Ngày giao thành công: ${item.deliveryDate ? new Date(item.deliveryDate).toLocaleDateString('vi-VN') : new Date(item.orderDate).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                    <button onclick="openReviewModal('${item.orderId}', '${item.productId}', '${item.productName.replace(/'/g, "\\'")}', '${mainImage}')" style="background:var(--primary-olive-dark); color:#fff; border:none; padding:10px 20px; border-radius:6px; font-weight:600; cursor:pointer;">Đánh giá ngay</button>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

function renderDoneReviews() {
    const list = document.getElementById('review-done-list');
    if (!list) return;

    if (window.customerReviews.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#999; padding: 20px;">Bạn chưa có đánh giá nào.</p>`;
        return;
    }

    let html = '';
    window.customerReviews.forEach(review => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i class="fa-solid fa-star" style="color: ${i <= review.rating ? '#ffc107' : '#ddd'};"></i> `;
        }

        let imagesHtml = '';
        if (review.images && review.images.length > 0) {
            imagesHtml = `<div style="display:flex; gap:10px; margin-top:15px;">`;
            review.images.forEach(img => {
                imagesHtml += `<img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #eee;">`;
            });
            imagesHtml += `</div>`;
        }

        let staffReplyHtml = '';
        if (review.staffReply) {
            const replierName = review.staffName || 'Người bán';
            staffReplyHtml = `
                <div style="margin-top: 15px; background: #f2f5f1; padding: 15px 20px; border-radius: 12px; border-left: 4px solid var(--primary-olive); position: relative;">
                    <p style="margin:0 0 6px 0; font-weight:600; color:var(--primary-olive-dark); font-size:14px; display: flex; align-items: center; gap: 6px;">
                        <i class="fa-solid fa-reply"></i> Phản hồi từ ${replierName}:
                    </p>
                    <p style="margin:0; color:#444; font-size:14px; line-height:1.6; font-style: italic;">${review.staffReply}</p>
                </div>
            `;
        }

        let editButtonHtml = '';
        if (review.editCount < 1) {
            editButtonHtml = `<button onclick="openEditReviewModal('${review._id}')" style="background:#fff; color:var(--primary-olive-dark); border:1px solid var(--primary-olive-dark); padding:6px 15px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;"><i class="fa-solid fa-pen"></i> Sửa đánh giá</button>`;
        } else {
            editButtonHtml = `<button onclick="showSection('consultation')" style="background:var(--primary-olive-dark); color:#fff; border:none; padding:6px 15px; border-radius:6px; font-weight:600; cursor:pointer; font-size:13px;"><i class="fa-regular fa-comments"></i> Tư vấn trực tuyến</button>`;
        }

        html += `
            <div style="background:#fff; padding:20px; border-radius:12px; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                    <div>
                        <h4 style="margin:0 0 5px 0; color:#333;">${review.productName}</h4>
                        <div style="font-size:14px; margin-bottom:10px;">${stars}</div>
                        <p style="margin:0; color:#555; font-size:15px; line-height:1.6;">${review.comment}</p>
                        ${imagesHtml}
                        ${staffReplyHtml}
                    </div>
                    <div>
                        ${editButtonHtml}
                    </div>
                </div>
                <p style="margin:0; font-size:12px; color:#999; text-align:right;">Mã đơn: #${review.orderId.substring(review.orderId.length - 6).toUpperCase()} - ${new Date(review.createdAt).toLocaleDateString('vi-VN')}</p>
            </div>
        `;
    });
    list.innerHTML = html;
}

window.openReviewModal = function(orderId, productId, productName, productImage) {
    try {
        document.getElementById('reviewOrderId').value = orderId;
        document.getElementById('reviewProductId').value = productId;
        document.getElementById('reviewId').value = '';
        document.getElementById('reviewComment').value = '';
        document.getElementById('reviewImages').value = '';
        document.getElementById('reviewImagePreview').innerHTML = '';
        reviewImagesToKeep = [];
        
        setRating(5);
        
        document.getElementById('reviewModal').style.display = 'block';
    } catch (err) {
        console.error("Lỗi openReviewModal: ", err);
        alert("Lỗi: " + err.message);
    }
}

window.openEditReviewModal = function(reviewId) {
    const review = window.customerReviews.find(r => r._id === reviewId);
    if (!review) return;

    document.getElementById('reviewId').value = review._id;
    document.getElementById('reviewOrderId').value = review.orderId;
    document.getElementById('reviewProductId').value = review.productId;
    document.getElementById('reviewComment').value = review.comment;
    document.getElementById('reviewImages').value = '';
    
    setRating(review.rating);
    
    // Hiển thị ảnh cũ
    reviewImagesToKeep = review.images || [];
    renderReviewImagePreview();

    document.getElementById('reviewModal').style.display = 'block';
}

function renderReviewImagePreview() {
    const preview = document.getElementById('reviewImagePreview');
    let html = '';
    reviewImagesToKeep.forEach((img, idx) => {
        html += `
            <div style="position:relative; display:inline-block;">
                <img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:6px;">
                <span onclick="removeKeepImage(${idx})" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border-radius:50%; width:20px; height:20px; text-align:center; line-height:18px; cursor:pointer; font-size:12px;">&times;</span>
            </div>
        `;
    });
    
    // Hiển thị ảnh mới chọn từ input
    const fileInput = document.getElementById('reviewImages');
    if (fileInput && fileInput.files) {
        Array.from(fileInput.files).forEach((file, idx) => {
            const tempUrl = URL.createObjectURL(file);
            html += `
                <div style="position:relative; display:inline-block;">
                    <img src="${tempUrl}" style="width:70px; height:70px; object-fit:cover; border-radius:6px; opacity:0.8; border: 2px dashed var(--primary-olive);">
                </div>
            `;
        });
    }
    
    preview.innerHTML = html;
}

function removeKeepImage(idx) {
    reviewImagesToKeep.splice(idx, 1);
    renderReviewImagePreview();
}

function setRating(val) {
    document.getElementById('ratingValue').value = val;
    document.querySelectorAll('#star-rating i').forEach(star => {
        if (parseInt(star.getAttribute('data-value')) <= val) {
            star.style.color = '#ffc107';
        } else {
            star.style.color = '#ddd';
        }
    });
}

function closeReviewModal() {
    document.getElementById('reviewModal').style.display = 'none';
}

// Logic đánh sao
document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('#star-rating i');
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            setRating(parseInt(e.target.getAttribute('data-value')));
        });
    });

    const reviewForm = document.getElementById('reviewForm');
    // Lắng nghe sự kiện chọn ảnh để preview
    const reviewImagesInput = document.getElementById('reviewImages');
    if (reviewImagesInput) {
        reviewImagesInput.addEventListener('change', () => {
            renderReviewImagePreview();
        });
    }

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = reviewForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerText = 'Đang xử lý...';

            const orderId = document.getElementById('reviewOrderId').value;
            const productId = document.getElementById('reviewProductId').value;
            const reviewId = document.getElementById('reviewId').value;
            const rating = document.getElementById('ratingValue').value;
            const comment = document.getElementById('reviewComment').value;
            const fileInput = document.getElementById('reviewImages');

            const formData = new FormData();
            formData.append('rating', rating);
            formData.append('comment', comment);
            
            if (reviewId) {
                // Edit
                reviewImagesToKeep.forEach(img => {
                    formData.append('keepImages', img);
                });
                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('images', fileInput.files[i]);
                }

                try {
                    const res = await fetch(`/api/reviews/edit/${reviewId}`, {
                        method: 'PUT',
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showToast('Đã sửa đánh giá thành công!', 'success');
                        closeReviewModal();
                        loadCustomerReviews(); 
                    } else {
                        showToast(data.message || 'Lỗi', 'error');
                    }
                } catch (err) {
                    showToast('Lỗi máy chủ', 'error');
                }
            } else {
                // New
                const userId = localStorage.getItem('userId');
                const userName = localStorage.getItem('fullName') || 'Khách hàng';
                formData.append('orderId', orderId);
                formData.append('productId', productId);
                formData.append('customerId', userId);
                formData.append('customerName', userName);

                for (let i = 0; i < fileInput.files.length; i++) {
                    formData.append('images', fileInput.files[i]);
                }

                try {
                    const res = await fetch(`/api/reviews/submit`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await res.json();
                    if (res.ok) {
                        showToast('Gửi đánh giá thành công!', 'success');
                        closeReviewModal();
                        loadCustomerReviews(); 
                        if (typeof filterCustomerOrders === 'function') {
                            filterCustomerOrders('completed');
                        }
                    } else {
                        showToast(data.message || 'Lỗi', 'error');
                    }
                } catch (err) {
                    showToast('Lỗi máy chủ', 'error');
                }
            }

            btn.disabled = false;
            btn.innerText = 'Gửi đánh giá';
        });
    }

    // Initialize
    const userId = localStorage.getItem('userId');
    if (userId) {
        loadCustomerReviews();
    }
});

// Intercept showSection để tải dữ liệu khi vào tab
const _origShowSectionReviews = window.showSection;
window.showSection = function(sectionId) {
    if (_origShowSectionReviews) _origShowSectionReviews(sectionId);
    if (sectionId === 'customer-reviews') {
        loadCustomerReviews();
    }
};

const fs = require('fs');
const path = require('path');

// 1. UPDATE HTML
const htmlPath = path.join(__dirname, 'public/pages/customer.html');
let html = fs.readFileSync(htmlPath, 'utf8');

html = html.replace(
    '<div style="width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; margin-bottom: 15px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">',
    '<div style="width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; margin-bottom: 15px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; position: relative;">'
);

html = html.replace(
    '<img id="detailMainImg" src="" style="width: 100%; height: 100%; object-fit: contain;" alt="Product">',
    '<img id="detailMainImg" src="" style="width: 100%; height: 100%; object-fit: contain;" alt="Product">\n                    <i class="fa-solid fa-expand" onclick="openLightbox()" style="position: absolute; bottom: 15px; right: 15px; background: rgba(255,255,255,0.8); padding: 10px; border-radius: 50%; cursor: pointer; color: #555; z-index: 10; font-size: 18px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></i>'
);

html = html.replace(
    '<button onclick="buyNow()" style="flex: 1; padding: 12px; background: #f25c3a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-bolt"></i> Mua ngay</button>',
    '<button onclick="buyNow()" style="flex: 1; padding: 12px; background: #f25c3a; color: #fff; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s;"><i class="fa-solid fa-bolt"></i> Mua ngay</button>\n                    <button id="btnDetailWishlist" onclick="toggleWishlistDetail()" style="padding: 12px; background: #fdf2f0; color: #e74c3c; border: 1px solid #fadbd8; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.3s; width: 48px; display: flex; justify-content: center; align-items: center;"><i class="fa-regular fa-heart"></i></button>'
);

fs.writeFileSync(htmlPath, html, 'utf8');

// 2. UPDATE JS
const jsPath = path.join(__dirname, 'public/js/customer_products.js');
let js = fs.readFileSync(jsPath, 'utf8');

js = js.replace(
    '<div class="product-img-new" onclick="viewDetail(\'${product._id}\')" style="cursor:pointer;">',
    `
        <div onclick="toggleWishlist('\${product._id}', event)" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            <i class="\${(window.customerWishlist || []).includes(product._id) ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
        </div>
        <div class="product-img-new" onclick="viewDetail('\${product._id}')" style="cursor:pointer;">
    `
);

js = js.replace(
    'card.className = \'product-card-new\';',
    'card.className = \'product-card-new\';\n        card.style.position = \'relative\';'
);

js = js.replace(
    'currentDetailProductId = id;',
    'currentDetailProductId = id;\n        currentLightboxImages = product.images || [];\n        currentLightboxIndex = 0;\n        updateDetailWishlistIcon();'
);

const extraJs = `
// ================= WISHLIST LOGIC =================
window.customerWishlist = [];

async function fetchWishlist() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    try {
        const res = await fetch(\`/api/users/wishlist/\${user._id}\`);
        if (res.ok) {
            const data = await res.json();
            window.customerWishlist = data.map(p => p._id || p);
            renderWishlist(data);
            if (typeof loadProducts === 'function') loadProducts(); // Re-render the main grid so hearts are updated
        }
    } catch (err) {
        console.error('Lỗi lấy wishlist:', err);
    }
}

async function toggleWishlist(productId, event) {
    if (event) event.stopPropagation(); // Ngăn click vào thẻ SP
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Vui lòng đăng nhập để sử dụng tính năng Yêu thích!');
        return;
    }
    
    try {
        const res = await fetch('/api/users/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user._id, productId })
        });
        const data = await res.json();
        if (res.ok) {
            window.customerWishlist = data.wishlist;
            // Re-render UI
            fetchWishlist(); 
            
            if (currentDetailProductId === productId) {
                updateDetailWishlistIcon();
            }
        }
    } catch (err) {
        console.error(err);
    }
}

async function toggleWishlistDetail() {
    if (!currentDetailProductId) return;
    await toggleWishlist(currentDetailProductId, null);
}

function updateDetailWishlistIcon() {
    const btn = document.getElementById('btnDetailWishlist');
    if (!btn) return;
    const isWished = window.customerWishlist.includes(currentDetailProductId);
    btn.innerHTML = \`<i class="\${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>\`;
}

function renderWishlist(products) {
    const grid = document.getElementById('customerWishlistGrid');
    if (!grid) return;

    grid.innerHTML = '';
    if (!products || products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">Chưa có sản phẩm yêu thích nào.</div>';
        return;
    }

    products.forEach(product => {
        const firstImg = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/600x600/f0ebd8/7f866e?text=No+Image';
        let tagText = 'Mới';
        if (product.category === '4 mùa') tagText = '4 Mùa';
        else if (product.category === 'mùa xuân') tagText = 'Xuân';
        else if (product.category === 'mùa hạ') tagText = 'Hạ';
        else if (product.category === 'mùa thu') tagText = 'Thu';
        else if (product.category === 'mùa đông') tagText = 'Đông';

        const avg = product.averageRating || 0;
        const count = product.reviewCount || 0;
        let starsHtml = '';
        if (count > 0) {
            for(let i=1; i<=5; i++) {
                if (i <= Math.round(avg)) {
                    starsHtml += \`<i class="fa-solid fa-star" style="color: #ffc107; font-size: 12px;"></i>\`;
                } else {
                    starsHtml += \`<i class="fa-solid fa-star" style="color: #eee; font-size: 12px;"></i>\`;
                }
            }
            starsHtml += \`<span style="font-size: 12px; color: #999; margin-left: 5px;">(\${count})</span>\`;
        } else {
            starsHtml = \`<span style="font-size: 12px; color: #999; font-style: italic;">Chưa có đánh giá</span>\`;
        }

        const card = document.createElement('div');
        card.className = 'product-card-new';
        card.style.position = 'relative';
        
        const isWished = window.customerWishlist.includes(product._id);
        
        card.innerHTML = \`
            <div onclick="toggleWishlist('\${product._id}', event)" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="\${isWished ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
            </div>
            <div class="product-img-new" onclick="viewDetail('\${product._id}')" style="cursor:pointer;">
                <img src="\${firstImg}" alt="\${product.name}">
            </div>
            <div class="product-content-new">
                <span class="product-tag">\${tagText}</span>
                <div class="product-title-new" onclick="viewDetail('\${product._id}')" style="cursor:pointer;">\${product.name}</div>
                <div style="margin-bottom: 8px;">\${starsHtml}</div>
                <div class="product-desc-new">\${product.description || 'Sản phẩm tuyệt vời từ Home Bedding'}</div>
                <div class="product-footer-new">
                    <div class="product-price-new">\${product.price.toLocaleString()} đ</div>
                    <button class="btn-add-new" onclick="addToCart('\${product._id}')">
                        <i class="fa-solid fa-cart-shopping"></i> Thêm
                    </button>
                </div>
            </div>
        \`;
        grid.appendChild(card);
    });
}

// ================= LIGHTBOX LOGIC =================
let currentLightboxImages = [];
let currentLightboxIndex = 0;

function openLightbox() {
    if (currentLightboxImages.length === 0) return;
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    img.src = currentLightboxImages[currentLightboxIndex];
    modal.style.display = 'block';
}

function closeLightbox() {
    document.getElementById('lightboxModal').style.display = 'none';
}

function changeLightboxImage(dir) {
    if (currentLightboxImages.length === 0) return;
    currentLightboxIndex += dir;
    if (currentLightboxIndex < 0) currentLightboxIndex = currentLightboxImages.length - 1;
    if (currentLightboxIndex >= currentLightboxImages.length) currentLightboxIndex = 0;
    
    document.getElementById('lightboxImg').src = currentLightboxImages[currentLightboxIndex];
}

// Fetch wishlist khi load trang
document.addEventListener('DOMContentLoaded', () => {
    fetchWishlist();
});
`;

js += '\n' + extraJs;
fs.writeFileSync(jsPath, js, 'utf8');

console.log('Done script');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
        filterByCategory(categoryParam);
    } else {
        fetchProducts();
    }
    fetchBestSellers();

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const cartSection = document.getElementById('customer-cart');
            const wishlistSection = document.getElementById('customer-wishlist');
            const ordersSection = document.getElementById('order-history');

            if (cartSection && cartSection.style.display === 'block') {
                if (typeof filterCartItems === 'function') filterCartItems(searchInput.value);
            } else if (wishlistSection && wishlistSection.style.display === 'block') {
                if (typeof filterWishlistItems === 'function') filterWishlistItems(searchInput.value);
            } else if (ordersSection && ordersSection.style.display === 'block') {
                if (typeof filterOrderItems === 'function') filterOrderItems(searchInput.value);
            } else {
                if (typeof showSection === 'function') showSection('customer-products');
                if (typeof fetchProducts === 'function') fetchProducts(searchInput.value, currentCategory);
            }
        });
    }

    // Gán sự kiện cho các filter pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            const category = pill.getAttribute('data-category');
            if (typeof filterByCategory === 'function') {
                filterByCategory(category);
            }
        });
    });
});
let currentCategory = 'all';
let customerPriceFilter = 'all';
let customerPriceSort = 'default';

window.onCustomerPriceFilterChange = function () {
    customerPriceFilter = document.getElementById('customerPriceFilter').value;
    const searchInput = document.querySelector('.search-bar input');
    fetchProducts(searchInput ? searchInput.value : '', currentCategory);
};

window.onCustomerPriceSortChange = function () {
    customerPriceSort = document.getElementById('customerPriceSort').value;
    const searchInput = document.querySelector('.search-bar input');
    fetchProducts(searchInput ? searchInput.value : '', currentCategory);
};

window.clearAllCustomerFilters = function () {
    currentCategory = 'all';
    customerPriceFilter = 'all';
    customerPriceSort = 'default';

    const pFilter = document.getElementById('customerPriceFilter');
    if (pFilter) pFilter.value = 'all';
    const pSort = document.getElementById('customerPriceSort');
    if (pSort) pSort.value = 'default';

    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) searchInput.value = '';

    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(p => p.classList.remove('active'));
    const activePill = Array.from(filterPills).find(p => p.getAttribute('data-category') === 'all');
    if (activePill) {
        activePill.classList.add('active');
    }

    fetchProducts('', 'all');
};

window.filterByCategory = function (category) {
    if (typeof showSection === 'function') showSection('customer-products');
    currentCategory = category;

    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(p => p.classList.remove('active'));

    const activePill = Array.from(filterPills).find(p => p.getAttribute('data-category') === category);
    if (activePill) {
        activePill.classList.add('active');
    }

    // Đổi active cho sidebar submenu
    const sidebarLinks = document.querySelectorAll('#menu-customer-products .submenu li a');
    sidebarLinks.forEach(link => {
        link.classList.remove('active-submenu-item');
        const onclickAttr = link.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${category}'`)) {
            link.classList.add('active-submenu-item');
        }
    });

    const searchInput = document.querySelector('.search-bar input');
    fetchProducts(searchInput ? searchInput.value : '', currentCategory);

    // Kích hoạt hiệu ứng rơi 4 mùa (mỏng)
    if (typeof updateCustomerSeasonalEffect === 'function') {
        updateCustomerSeasonalEffect(currentCategory);
    }
};

// Hàm tạo hiệu ứng rơi mỏng theo mùa
function updateCustomerSeasonalEffect(category) {
    const container = document.getElementById('customer-effect-container');
    if (!container) return;

    container.innerHTML = ''; // Xóa hiệu ứng cũ

    let particleClass = '';
    let particleCount = 0;
    let symbols = [];
    let particleColor = ''; // Thêm biến màu sắc

    const cat = category.toLowerCase();

    if (cat.includes('xuân')) {
        particleClass = 'petal';
        particleCount = 10;
        symbols = ['🌸', '🌺', '🍃'];
    } else if (cat.includes('hạ')) {
        particleClass = 'sparkle';
        particleCount = 12;
        symbols = ['✨', '☀️'];
    } else if (cat.includes('thu')) {
        particleClass = 'leaf';
        particleCount = 8;
        symbols = ['🍂', '🍁'];
    } else if (cat.includes('đông')) {
        particleClass = 'snowflake';
        particleCount = 15;
        symbols = ['❄', '❅', '❆'];
        particleColor = '#74b9ff'; // Xanh dương nhạt cho tuyết
    } else {
        // Tất cả hoặc 4 Mùa -> Hiệu ứng trộn lẫn
        particleClass = 'mix-season';
        particleCount = 15; // Mỏng thôi
        symbols = ['🌸', '☀️', '🍂', '❄', '✨', '🍃'];
    }

    if (particleCount > 0) {
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');

            let currentSymbol = '';
            if (symbols.length > 0) {
                currentSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                particle.textContent = currentSymbol;
            }
            particle.className = particleClass;

            // Set màu riêng nếu có (hoặc nếu là mix và trúng icon tuyết)
            if (particleColor) {
                particle.style.color = particleColor;
            } else if (particleClass === 'mix-season' && ['❄', '❅', '❆'].includes(currentSymbol)) {
                particle.style.color = '#74b9ff';
            }

            // CSS trực tiếp thay vì class để đảm bảo hoạt động độc lập
            particle.style.position = 'absolute';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '-50px';
            particle.style.pointerEvents = 'none';
            particle.style.setProperty('--max-op', Math.random() * 0.4 + 0.2);
            particle.style.fontSize = (Math.random() * 10 + 12) + 'px'; // Nhỏ nhắn

            // Tạo một inline animation cho mỗi hạt rơi
            const duration = Math.random() * 5 + 5; // 5 - 10 giây (Rơi chậm)
            const delay = Math.random() * 3;

            particle.style.animation = `customerFall ${duration}s linear ${delay}s infinite`;

            container.appendChild(particle);
        }
    }
}

async function fetchProducts(search = '', category = 'all') {
    try {
        const res = await fetch(`/api/products/all?search=${search}&category=${category}`);
        let products = await res.json();

        // Lọc theo khoảng giá
        if (customerPriceFilter !== 'all') {
            products = products.filter(p => {
                const price = p.price;
                if (customerPriceFilter === 'under-1m') return price < 1000000;
                if (customerPriceFilter === '1m-3m') return price >= 1000000 && price <= 3000000;
                if (customerPriceFilter === '3m-5m') return price >= 3000000 && price <= 5000000;
                if (customerPriceFilter === 'over-5m') return price > 5000000;
                return true;
            });
        }

        // Sắp xếp theo giá
        if (customerPriceSort === 'asc') {
            products = [...products].sort((a, b) => a.price - b.price);
        } else if (customerPriceSort === 'desc') {
            products = [...products].sort((a, b) => b.price - a.price);
        }

        // Đẩy sản phẩm hết hàng xuống cuối
        products = [...products].sort((a, b) => {
            const aOut = a.quantity <= 0 ? 1 : 0;
            const bOut = b.quantity <= 0 ? 1 : 0;
            return aOut - bOut;
        });

        renderProducts(products);
    } catch (err) {
        console.error('Error fetching products:', err);
    }
}

function renderProducts(products) {
    const grid = document.getElementById('customerProductGridNew');
    if (!grid) return;

    grid.innerHTML = '';

    // Tạo thẻ bộ lọc động làm ô đầu tiên trong grid sản phẩm
    const filterCard = document.createElement('div');
    filterCard.className = 'filter-card-item';
    filterCard.innerHTML = `
        <div class="filter-sidebar-title" style="margin-bottom: 0; font-size: 15px; font-weight: 700; color: #3E4B37; font-family: var(--font-serif); border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-filter"></i> <span>Bộ lọc</span>
        </div>
        
        <div class="filter-sidebar-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
            <div class="filter-sidebar-label" style="font-size: 13px; font-weight: 700; color: #555; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-tags" style="color:var(--primary-olive);"></i> <span>Mức giá</span>
            </div>
            <select id="customerPriceFilter" onchange="onCustomerPriceFilterChange()" class="filter-sidebar-select" style="padding: 8px 12px; border: 1px solid #e5dfd7; border-radius: 10px; font-size: 12px; font-family: inherit; outline: none; background: #fff; cursor: pointer; color: #555; width: 100%; transition: border-color 0.2s;">
                <option value="all">Mọi mức giá</option>
                <option value="under-1m">Dưới 1 triệu</option>
                <option value="1m-3m">1 triệu - 3 triệu</option>
                <option value="3m-5m">3 triệu - 5 triệu</option>
                <option value="over-5m">Trên 5 triệu</option>
            </select>
        </div>
        
        <div class="filter-sidebar-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
            <div class="filter-sidebar-label" style="font-size: 13px; font-weight: 700; color: #555; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-sort" style="color:var(--primary-olive);"></i> <span>Sắp xếp</span>
            </div>
            <select id="customerPriceSort" onchange="onCustomerPriceSortChange()" class="filter-sidebar-select" style="padding: 8px 12px; border: 1px solid #e5dfd7; border-radius: 10px; font-size: 12px; font-family: inherit; outline: none; background: #fff; cursor: pointer; color: #555; width: 100%; transition: border-color 0.2s;">
                <option value="default">Sắp xếp: Mặc định</option>
                <option value="asc">Giá: Thấp đến Cao</option>
                <option value="desc">Giá: Cao đến Thấp</option>
            </select>
        </div>

        <button onclick="clearAllCustomerFilters()" class="filter-sidebar-btn" style="padding: 8px 12px; border: 1px solid var(--discount-red,#B85C4C); color: var(--discount-red,#B85C4C); background: #fff; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; font-family: inherit; width: 100%; margin-top: auto;">
            <i class="fa-solid fa-filter-circle-xmark"></i> <span>Bỏ lọc</span>
        </button>
    `;

    if (products.length === 0) {
        grid.appendChild(filterCard);
        
        const placeholder = document.createElement('div');
        placeholder.style.cssText = 'grid-column: 1/-1; text-align: center; padding: 50px; color: #666; font-style: italic;';
        placeholder.innerHTML = 'Không tìm thấy sản phẩm nào.';
        grid.appendChild(placeholder);

        // Đồng bộ lại giá trị các dropdown
        const pf = document.getElementById('customerPriceFilter');
        const ps = document.getElementById('customerPriceSort');
        if (pf) pf.value = customerPriceFilter;
        if (ps) ps.value = customerPriceSort;
        return;
    }

    grid.appendChild(filterCard);

    products.forEach(product => {
        const firstImg = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/600x600/f0ebd8/7f866e?text=No+Image';

        let tagText = 'Mới';
        if (product.category === '4 mùa') tagText = '4 Mùa';
        else if (product.category === 'mùa xuân') tagText = 'Xuân';
        else if (product.category === 'mùa hạ') tagText = 'Hạ';
        else if (product.category === 'mùa thu') tagText = 'Thu';
        else if (product.category === 'mùa đông') tagText = 'Đông';

        // Tính toán sao hiển thị
        const avg = product.averageRating || 0;
        const count = product.reviewCount || 0;
        let starsHtml = '';
        if (count > 0) {
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.round(avg)) {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #ffc107; font-size: 12px;"></i>`;
                } else {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #eee; font-size: 12px;"></i>`;
                }
            }
            starsHtml += `<span style="font-size: 12px; color: #999; margin-left: 5px;">(${count})</span>`;
        } else {
            starsHtml = `<span style="font-size: 12px; color: #999; font-style: italic;">Chưa có đánh giá</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card-new';
        card.style.position = 'relative';

        const isOutOfStock = product.quantity <= 0;
        if (isOutOfStock) {
            card.style.opacity = '0.6';
            card.style.filter = 'grayscale(30%)';
        }

        const addButtonHtml = isOutOfStock
            ? `<button class="btn-add-new" disabled style="background-color: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; pointer-events: none;">Hết hàng</button>`
            : `<button class="btn-add-new" onclick="addToCart('${product._id}')"><i class="fa-solid fa-cart-shopping"></i> Thêm</button>`;

        card.innerHTML = `
            <div onclick="toggleWishlist('${product._id}', event)" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="${(window.customerWishlist || []).includes(product._id) ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
            </div>
            <div class="product-img-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">
                <img src="${firstImg}" alt="${product.name}">
            </div>
            <div class="product-content-new">
                <span class="product-tag">${tagText}</span>
                <div class="product-title-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">${product.name}</div>
                <div style="margin-bottom: 8px;">${starsHtml}</div>
                <div class="product-desc-new">${product.description || 'Sản phẩm tuyệt vời từ Home Bedding'}</div>
                <div class="product-footer-new">
                    <div class="product-price-new">${product.price.toLocaleString()} đ</div>
                    ${addButtonHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Đồng bộ lại giá trị các dropdown sau khi thêm vào DOM
    const pf = document.getElementById('customerPriceFilter');
    const ps = document.getElementById('customerPriceSort');
    if (pf) pf.value = customerPriceFilter;
    if (ps) ps.value = customerPriceSort;
}

let currentDetailProductId = null;
let currentDetailProductPrice = 0;
let currentDetailProductStock = 0;

async function viewDetail(id) {
    try {
        const [prodRes, revRes, relatedRes] = await Promise.all([
            fetch(`/api/products/${id}`),
            fetch(`/api/reviews/product/${id}`),
            fetch(`/api/products/related/${id}`)
        ]);

        if (!prodRes.ok) throw new Error('Không thể tải sản phẩm');

        const product = await prodRes.json();
        const reviews = await revRes.json();
        const related = await relatedRes.json();

        currentDetailProductId = id;
        currentLightboxImages = product.images || [];
        currentLightboxIndex = 0;
        updateDetailWishlistIcon();
        currentDetailProductPrice = product.price;
        currentDetailProductStock = product.quantity;

        document.getElementById('detailTitle').textContent = product.name;
        document.getElementById('detailPrice').textContent = product.price.toLocaleString() + ' đ';
        document.getElementById('detailDesc').textContent = product.description || '';

        const isOutOfStock = product.quantity <= 0;
        const qtyInput = document.getElementById('detailQty');
        qtyInput.value = isOutOfStock ? 0 : 1;
        qtyInput.min = isOutOfStock ? 0 : 1;
        qtyInput.max = product.quantity;
        qtyInput.disabled = isOutOfStock;

        // Tự động kiểm tra giới hạn tồn kho khi khách hàng nhập số lượng thủ công
        qtyInput.oninput = function () {
            let val = parseInt(this.value) || 0;
            if (val < 1 && !isOutOfStock) {
                this.value = 1;
                val = 1;
            }
            const maxVal = parseInt(this.max);
            if (maxVal && val > maxVal) {
                this.value = maxVal;
                if (typeof showToast === 'function') {
                    showToast(`Chỉ còn tối đa ${maxVal} sản phẩm trong kho!`, 'warning');
                }
            }
        };

        // Tìm các nút cộng trừ số lượng
        const qtyContainer = qtyInput.parentElement;
        if (qtyContainer) {
            const qtyButtons = qtyContainer.querySelectorAll('button');
            qtyButtons.forEach(btn => {
                btn.disabled = isOutOfStock;
                btn.style.cursor = isOutOfStock ? 'not-allowed' : 'pointer';
                btn.style.opacity = isOutOfStock ? '0.5' : '1';
            });
        }

        // Vô hiệu hóa hoặc kích hoạt các nút mua hàng/thêm vào giỏ
        const addCartBtn = document.querySelector('button[onclick="addDetailToCart()"]');
        const buyNowBtn = document.querySelector('button[onclick="buyNow()"]');

        if (addCartBtn) {
            addCartBtn.disabled = isOutOfStock;
            if (isOutOfStock) {
                addCartBtn.style.backgroundColor = '#ccc';
                addCartBtn.style.cursor = 'not-allowed';
                addCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Hết hàng`;
            } else {
                addCartBtn.style.backgroundColor = 'var(--primary-olive-dark, #58674E)';
                addCartBtn.style.cursor = 'pointer';
                addCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> Thêm vào giỏ`;
            }
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = isOutOfStock;
            if (isOutOfStock) {
                buyNowBtn.style.backgroundColor = '#aaa';
                buyNowBtn.style.cursor = 'not-allowed';
                buyNowBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Hết hàng`;
            } else {
                buyNowBtn.style.backgroundColor = '#f25c3a';
                buyNowBtn.style.cursor = 'pointer';
                buyNowBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> Mua ngay`;
            }
        }

        let tagText = '4 Mùa';
        if (product.category === 'mùa xuân') tagText = 'Xuân';
        else if (product.category === 'mùa hạ') tagText = 'Hạ';
        else if (product.category === 'mùa thu') tagText = 'Thu';
        else if (product.category === 'mùa đông') tagText = 'Đông';
        document.getElementById('detailTag').textContent = tagText;

        const mainImg = document.getElementById('detailMainImg');
        const firstImg = (product.images && product.images.length > 0) ? product.images[0] : '/images/placeholder.jpg';
        mainImg.src = firstImg;

        const thumbsContainer = document.getElementById('detailThumbnails');
        thumbsContainer.innerHTML = '';
        if (product.images && product.images.length > 0) {
            product.images.forEach(img => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.style = "width:60px; height:60px; object-fit:cover; border-radius:8px; cursor:pointer; border: 2px solid transparent;";
                thumb.onclick = () => { mainImg.src = img; };
                thumbsContainer.appendChild(thumb);
            });
        }

        const reviewsList = document.getElementById('detailReviewsList');
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p style="color:#999; font-style:italic;">Chưa có đánh giá nào.</p>';
        } else {
            reviews.forEach(r => {
                let starsHtml = '';
                for (let i = 1; i <= 5; i++) {
                    starsHtml += `<i class="fa-solid fa-star" style="color: ${i <= r.rating ? '#ffc107' : '#eee'}"></i>`;
                }

                let replyHtml = '';
                if (r.staffReply) {
                    replyHtml = `
                    <div style="background: var(--primary-olive-light); padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <div style="color: var(--primary-olive-dark); font-weight: bold; margin-bottom: 5px;"><i class="fa-solid fa-reply"></i> Phản hồi từ Shop:</div>
                        <div style="color: #444; font-size: 13px;">${r.staffReply}</div>
                    </div>`;
                }

                let imagesHtml = '';
                if (r.images && r.images.length > 0) {
                    imagesHtml = `<div style="display:flex; gap:10px; margin-top:10px;">`;
                    r.images.forEach(img => {
                        imagesHtml += `<img src="${img}" style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #eee; cursor:pointer;" onclick="window.open('${img}', '_blank')">`;
                    });
                    imagesHtml += `</div>`;
                }

                const dateStr = new Date(r.createdAt).toLocaleDateString('vi-VN');

                reviewsList.innerHTML += `
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong style="color:var(--primary-olive-dark);"><i class="fa-solid fa-circle-user"></i> ${r.customerName}</strong>
                            <div style="font-size:12px;">${starsHtml}</div>
                        </div>
                        <div style="font-size: 14px; color: #444; margin-bottom: 5px;">${r.comment}</div>
                        ${imagesHtml}
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">${dateStr}</div>
                        ${replyHtml}
                    </div>
                `;
            });
        }

        // Render related products
        const relatedContainer = document.getElementById('relatedProductsContainer');
        const relatedTitle = document.getElementById('relatedProductsTitle');
        relatedContainer.innerHTML = '';
        if (related && related.length > 0) {
            if (relatedTitle) relatedTitle.style.display = 'block';
            related.forEach(relProd => {
                const imgUrl = (relProd.images && relProd.images.length > 0) ? relProd.images[0] : '/images/placeholder.jpg';
                const square = document.createElement('div');
                square.style = "width: 100px; height: 100px; background: #fff; border-radius: 16px; overflow: hidden; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 15px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center;";
                if (relProd.quantity <= 0) {
                    square.style.opacity = '0.6';
                    square.style.filter = 'grayscale(30%)';
                }
                square.innerHTML = `<img src="${imgUrl}" alt="${relProd.name}" style="width: 100%; height: 100%; object-fit: cover;" title="${relProd.name}">`;
                square.onmouseover = () => square.style.transform = 'scale(1.08)';
                square.onmouseout = () => square.style.transform = 'scale(1)';
                square.onclick = () => viewDetail(relProd._id);
                relatedContainer.appendChild(square);
            });
        } else {
            if (relatedTitle) relatedTitle.style.display = 'none';
        }

        // Show modal and flex to center items (including related products)
        document.getElementById('productDetailModal').style.display = 'flex';
        document.getElementById('productDetailModal').style.flexDirection = 'column';
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') showToast('Có lỗi xảy ra!', 'error');
    }
}

function closeProductDetailModal() {
    document.getElementById('productDetailModal').style.display = 'none';
    document.body.style.overflow = '';
}

function updateQuantity(change) {
    const input = document.getElementById('detailQty');
    if (input.disabled) return;
    let val = parseInt(input.value) || 1;
    val += change;
    if (val < 1) val = 1;

    const maxVal = parseInt(input.max);
    if (maxVal && val > maxVal) {
        val = maxVal;
        if (typeof showToast === 'function') {
            showToast(`Chỉ còn tối đa ${maxVal} sản phẩm trong kho!`, 'warning');
        }
    }
    input.value = val;
}

function addToCart(id) {
    const userId = localStorage.getItem('userId');
    if (window.isGuest || !userId) {
        if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để mua hàng!', 'error');
        else alert('Vui lòng đăng nhập để mua hàng!');
        setTimeout(() => { window.location.href = 'index.html?action=login'; }, 1500);
        return;
    }

    fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, productId: id, quantity: 1 })
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(data => { throw new Error(data.message || 'Lỗi khi thêm vào giỏ hàng!'); });
            }
            return res.json();
        })
        .then(data => {
            if (typeof showToast === 'function') showToast('Đã thêm sản phẩm vào giỏ hàng!');
            if (typeof fetchCart === 'function') fetchCart(); // Cập nhật lại giỏ hàng và badge
        })
        .catch(err => {
            if (typeof showToast === 'function') showToast(err.message, 'error');
            else alert(err.message);
        });
}

window.viewDetail = viewDetail;
window.closeProductDetailModal = closeProductDetailModal;
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.addDetailToCart = function () {
    const userId = localStorage.getItem('userId');
    if (window.isGuest || !userId) {
        if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để mua hàng!', 'error');
        else alert('Vui lòng đăng nhập để mua hàng!');
        setTimeout(() => { window.location.href = 'index.html?action=login'; }, 1500);
        return;
    }
    if (!currentDetailProductId) return;

    const qty = parseInt(document.getElementById('detailQty').value) || 1;

    // Kiểm tra số lượng tồn kho trước khi gửi yêu cầu lên backend
    if (qty > currentDetailProductStock) {
        if (typeof showToast === 'function') {
            showToast(`Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${currentDetailProductStock} sản phẩm!`, 'error');
        } else {
            alert(`Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${currentDetailProductStock} sản phẩm!`);
        }
        return;
    }

    fetch('http://localhost:3000/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId, productId: currentDetailProductId, quantity: qty })
    })
        .then(res => {
            if (!res.ok) {
                return res.json().then(data => { throw new Error(data.message || 'Lỗi khi thêm vào giỏ hàng!'); });
            }
            return res.json();
        })
        .then(data => {
            if (typeof showToast === 'function') showToast('Đã thêm sản phẩm vào giỏ hàng!');
            if (typeof fetchCart === 'function') fetchCart();
            closeProductDetailModal();
        })
        .catch(err => {
            if (typeof showToast === 'function') showToast(err.message, 'error');
            else alert(err.message);
        });
};

window.buyNow = function () {
    const userId = localStorage.getItem('userId');
    if (window.isGuest || !userId) {
        if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để mua hàng!', 'error');
        else alert('Vui lòng đăng nhập để mua hàng!');
        setTimeout(() => { window.location.href = 'index.html?action=login'; }, 1500);
        return;
    }
    if (!currentDetailProductId) return;

    const qty = parseInt(document.getElementById('detailQty').value) || 1;

    // Kiểm tra số lượng tồn kho
    if (qty > currentDetailProductStock) {
        if (typeof showToast === 'function') {
            showToast(`Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${currentDetailProductStock} sản phẩm!`, 'error');
        } else {
            alert(`Số lượng vượt quá giới hạn tồn kho. Kho chỉ còn ${currentDetailProductStock} sản phẩm!`);
        }
        return;
    }

    window.checkoutMode = 'repurchase';
    window.repurchaseItems = [{
        productId: currentDetailProductId,
        quantity: qty,
        price: currentDetailProductPrice,
        name: document.getElementById('detailTitle').textContent,
        image: document.getElementById('detailMainImg').src
    }];

    closeProductDetailModal();

    if (typeof openCheckoutModal === 'function') {
        window.updateSummary();
        openCheckoutModal();
    }
};

async function fetchBestSellers() {
    try {
        const res = await fetch(`/api/products/bestsellers?limit=5`);
        const products = await res.json();
        renderBestSellers(products);
    } catch (err) {
        console.error('Error fetching bestsellers:', err);
    }
}

function renderBestSellers(products) {
    const grid = document.getElementById('customer-bestsellers-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (products.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;">Chưa có sản phẩm nào.</div>';
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

        // Tính toán sao hiển thị
        const avg = product.averageRating || 0;
        const count = product.reviewCount || 0;
        let starsHtml = '';
        if (count > 0) {
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.round(avg)) {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #ffc107; font-size: 12px;"></i>`;
                } else {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #eee; font-size: 12px;"></i>`;
                }
            }
            starsHtml += `<span style="font-size: 12px; color: #999; margin-left: 5px;">(${count})</span>`;
        } else {
            starsHtml = `<span style="font-size: 12px; color: #999; font-style: italic;">Chưa có đánh giá</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card-new';

        const isOutOfStock = product.quantity <= 0;
        if (isOutOfStock) {
            card.style.opacity = '0.6';
            card.style.filter = 'grayscale(30%)';
        }

        const addButtonHtml = isOutOfStock
            ? `<button class="btn-add-new" disabled style="background-color: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; pointer-events: none;">Hết hàng</button>`
            : `<button class="btn-add-new" onclick="addToCart('${product._id}')"><i class="fa-solid fa-cart-shopping"></i> Thêm</button>`;

        card.innerHTML = `
            <div class="product-img-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">
                <img src="${firstImg}" alt="${product.name}">
            </div>
            <div class="product-content-new">
                <span class="product-tag">${tagText}</span>
                <div class="product-title-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">${product.name}</div>
                <div style="margin-bottom: 8px;">${starsHtml}</div>
                <div class="product-desc-new">${product.description || 'Sản phẩm tuyệt vời từ Home Bedding'}</div>
                <div class="product-footer-new">
                    <div class="product-price-new">${product.price.toLocaleString()} đ</div>
                    ${addButtonHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}


// ================= WISHLIST LOGIC =================
window.customerWishlist = [];

async function fetchWishlist() {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
        const res = await fetch(`/api/users/wishlist/${userId}`);
        if (res.ok) {
            const data = await res.json();
            window.customerWishlist = data.map(p => p._id || p);
            renderWishlist(data);
            updateAllHeartIcons();
        }
    } catch (err) {
        console.error('Lỗi lấy wishlist:', err);
    }
}

async function toggleWishlist(productId, event) {
    if (event) event.stopPropagation(); // Ngăn click vào thẻ SP
    const userId = localStorage.getItem('userId');
    if (window.isGuest || !userId) {
        if (typeof showToast === 'function') showToast('Vui lòng đăng nhập để yêu thích sản phẩm!', 'error');
        else alert('Vui lòng đăng nhập để sử dụng tính năng Yêu thích!');
        setTimeout(() => { window.location.href = 'index.html?action=login'; }, 1500);
        return;
    }

    try {
        const res = await fetch('/api/users/wishlist/toggle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: userId, productId })
        });
        const data = await res.json();
        if (res.ok) {
            const isAdded = data.wishlist.includes(productId);
            if (isAdded) {
                if (typeof showToast === 'function') showToast('Đã thêm vào danh sách Yêu thích!');
            } else {
                if (typeof showToast === 'function') showToast('Đã bỏ khỏi danh sách Yêu thích!');
            }
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
    btn.innerHTML = `<i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart"></i>`;
}

function updateAllHeartIcons() {
    const heartBtns = document.querySelectorAll('.product-card-new > div[onclick^="toggleWishlist"]');
    heartBtns.forEach(btn => {
        const onclickStr = btn.getAttribute('onclick');
        const match = onclickStr.match(/toggleWishlist\('([^']+)'/);
        if (match && match[1]) {
            const pId = match[1];
            const icon = btn.querySelector('i.fa-heart');
            if (icon) {
                if ((window.customerWishlist || []).includes(pId)) {
                    icon.classList.remove('fa-regular');
                    icon.classList.add('fa-solid');
                } else {
                    icon.classList.remove('fa-solid');
                    icon.classList.add('fa-regular');
                }
            }
        }
    });
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
        // ... (phần render y nguyên)
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
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.round(avg)) {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #ffc107; font-size: 12px;"></i>`;
                } else {
                    starsHtml += `<i class="fa-solid fa-star" style="color: #eee; font-size: 12px;"></i>`;
                }
            }
            starsHtml += `<span style="font-size: 12px; color: #999; margin-left: 5px;">(${count})</span>`;
        } else {
            starsHtml = `<span style="font-size: 12px; color: #999; font-style: italic;">Chưa có đánh giá</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card-new';
        card.style.position = 'relative';

        const isOutOfStock = product.quantity <= 0;
        if (isOutOfStock) {
            card.style.opacity = '0.6';
            card.style.filter = 'grayscale(30%)';
        }

        const isWished = window.customerWishlist.includes(product._id);

        const addButtonHtml = isOutOfStock
            ? `<button class="btn-add-new" disabled style="background-color: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; pointer-events: none;">Hết hàng</button>`
            : `<button class="btn-add-new" onclick="addToCart('${product._id}')"><i class="fa-solid fa-cart-shopping"></i> Thêm</button>`;

        card.innerHTML = `
            <div onclick="toggleWishlist('${product._id}', event)" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                <i class="${isWished ? 'fa-solid' : 'fa-regular'} fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
            </div>
            <div class="product-img-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">
                <img src="${firstImg}" alt="${product.name}">
            </div>
            <div class="product-content-new">
                <span class="product-tag">${tagText}</span>
                <div class="product-title-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">${product.name}</div>
                <div style="margin-bottom: 8px;">${starsHtml}</div>
                <div class="product-desc-new">${product.description || 'Sản phẩm tuyệt vời từ Home Bedding'}</div>
                <div class="product-footer-new">
                    <div class="product-price-new">${product.price.toLocaleString()} đ</div>
                    ${addButtonHtml}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

window.filterWishlistItems = function (keyword) {
    const grid = document.getElementById('customerWishlistGrid');
    if (!grid) return;
    const cards = grid.querySelectorAll('.product-card-new');
    cards.forEach(card => {
        const titleEl = card.querySelector('.product-title-new');
        if (titleEl) {
            const text = titleEl.innerText;
            if (window.fuzzyMatch && window.fuzzyMatch(keyword, text)) {
                card.style.display = '';
            } else if (!window.fuzzyMatch && text.toLowerCase().includes(keyword.toLowerCase())) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        }
    });
}

window.removeVietnameseTones = function (str) {
    if (!str) return "";
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
}

window.fuzzyMatch = function (keyword, text) {
    const kw = window.removeVietnameseTones(keyword.toLowerCase()).trim();
    const txt = window.removeVietnameseTones(text.toLowerCase());
    if (!kw) return true;
    const terms = kw.split(/\s+/);
    return terms.every(term => txt.includes(term));
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

/**
 * Home Bedding - Landing Page Script
 * Handles dynamic data fetching, tab switching, countdown timers, and sliders.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Global state
    let allProducts = [];
    let bestSellers = [];
    let discountProducts = [];
    let currentTab = 'bestsellers';
    let currentSeason = 'all';
    let landingLimit = 5;
    let currentReviewPage = 0;
    const reviewsPerPage = 3;
    let reviewsList = [];
    let promotionsList = [];
    let searchQuery = '';
    let currentPriceFilter = 'all';
    let currentPriceSort = 'default';

    // Dom Elements
    const productsContainer = document.getElementById('products-container');
    const saleProductsContainer = document.getElementById('sale-products-container');
    const reviewsContainer = document.getElementById('reviews-container');
    const blogSliderContainer = document.getElementById('blog-slider-container');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const landingFilterPills = document.querySelectorAll('#landingFilterPills .filter-pill');

    // Initialize Page
    initCountdownTimers();
    fetchInitialData();
    setupHeaderScroll();
    setupTabListeners();
    setupSeasonalFilterListeners();
    setupScrollSpy();

    // Check if the URL has ?action=login and open the modal
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'login') {
        if (typeof openModal === 'function') {
            openModal('loginModal');
            // Clean up the URL query parameter so it doesn't reopen on manual page refresh/reload
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    } else if (urlParams.get('show') === 'revenue') {
        if (typeof openModal === 'function') {
            openModal('revenueModal');
            if (typeof loadRevenueChart === 'function') {
                loadRevenueChart();
            }
            // Clean up the URL query parameter
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }
    }

    const initialSearch = urlParams.get('search');
    if (initialSearch) {
        searchQuery = initialSearch;
        // Clean up URL query parameters
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        setTimeout(() => {
            const searchInput = document.getElementById('headerSearchInput');
            if (searchInput) {
                searchInput.value = initialSearch;
            }
            const section = document.getElementById('section-products');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }, 600);
    }

    // Expose global landing search function
    window.searchLandingProducts = (query) => {
        searchQuery = query;
        const searchInput = document.getElementById('headerSearchInput');
        if (searchInput) {
            searchInput.value = query;
        }
        renderProductGrid();
        const section = document.getElementById('section-products');
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Setup seasonal filter pills on landing page
    function setupSeasonalFilterListeners() {
        landingFilterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                landingFilterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                // Clear active tab since we are filtering by season
                tabButtons.forEach(btn => btn.classList.remove('active'));

                currentSeason = pill.getAttribute('data-category');
                landingLimit = 5; // Reset limit back to 1 row
                renderProductGrid();
            });
        });
    }

    window.onLandingPriceFilterChange = function () {
        currentPriceFilter = document.getElementById('landingPriceFilter').value;
        landingLimit = 5;
        renderProductGrid();
    };

    window.onLandingPriceSortChange = function () {
        currentPriceSort = document.getElementById('landingPriceSort').value;
        landingLimit = 5;
        renderProductGrid();
    };

    window.clearAllLandingFilters = function () {
        currentSeason = 'all';
        currentPriceFilter = 'all';
        currentPriceSort = 'default';
        searchQuery = '';
        landingLimit = 5;

        const pFilter = document.getElementById('landingPriceFilter');
        if (pFilter) pFilter.value = 'all';
        const pSort = document.getElementById('landingPriceSort');
        if (pSort) pSort.value = 'default';

        const searchInput = document.getElementById('search-input') || document.querySelector('.search-input');
        if (searchInput) searchInput.value = '';

        landingFilterPills.forEach(p => p.classList.remove('active'));
        const allPill = Array.from(landingFilterPills).find(p => p.getAttribute('data-category') === 'all');
        if (allPill) allPill.classList.add('active');

        renderProductGrid();
    };

    // 1. Fetch Products, Promotions and Reviews
    async function fetchInitialData() {
        try {
            // Fetch Products
            const prodRes = await fetch('/api/products/all');
            if (prodRes.ok) {
                allProducts = await prodRes.json();
            }
        } catch (err) {
            console.error('Error fetching products:', err);
        }

        try {
            // Fetch Promotions
            const promoRes = await fetch('/api/promotions/all');
            if (promoRes.ok) {
                promotionsList = await promoRes.json();
            }
        } catch (err) {
            console.error('Error fetching promotions:', err);
        }

        try {
            // Fetch Bestsellers
            const bestRes = await fetch('/api/products/bestsellers');
            if (bestRes.ok) {
                bestSellers = await bestRes.json();
            }
        } catch (err) {
            console.error('Error fetching bestsellers:', err);
        }

        try {
            // Fetch Reviews
            const reviewRes = await fetch('/api/reviews/all');
            if (reviewRes.ok) {
                reviewsList = await reviewRes.json();
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }

        // If no products fetched, use premium mock data as fallback to ensure the landing page is gorgeous
        if (!allProducts || allProducts.length === 0) {
            allProducts = getMockProducts();
        }
        if (!bestSellers || bestSellers.length === 0) {
            bestSellers = allProducts.slice(0, 4);
        }
        if (!reviewsList || reviewsList.length === 0) {
            reviewsList = getMockReviews();
        }

        // Prepare discount products
        discountProducts = allProducts.filter(p => p.price < 5000000); // MOCK discount criteria or use promotions
        if (discountProducts.length === 0) {
            discountProducts = allProducts.slice();
        }

        // Initial Renders
        renderProductGrid();
        renderPromotionsWidget();
        renderReviewsWidget();
        renderBlogGrid();
    }

    // 2. Render Product Grid based on Season
    function renderProductGrid() {
        if (!productsContainer) return;
        productsContainer.innerHTML = '';

        let displayList = [];
        if (currentSeason === 'all') {
            displayList = allProducts;
        } else {
            // Lọc toàn bộ sản phẩm theo mùa được chọn
            displayList = allProducts.filter(p => p.category === currentSeason);
        }

        // Lọc theo khoảng giá
        if (currentPriceFilter !== 'all') {
            displayList = displayList.filter(p => {
                const price = p.price;
                if (currentPriceFilter === 'under-1m') return price < 1000000;
                if (currentPriceFilter === '1m-3m') return price >= 1000000 && price <= 3000000;
                if (currentPriceFilter === '3m-5m') return price >= 3000000 && price <= 5000000;
                if (currentPriceFilter === 'over-5m') return price > 5000000;
                return true;
            });
        }

        if (searchQuery) {
            const removeTones = (str) => {
                if (!str) return "";
                return str.normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd')
                    .replace(/Đ/g, 'D');
            };
            const terms = removeTones(searchQuery.toLowerCase()).trim().split(/\s+/);
            displayList = displayList.filter(p => {
                const nameTonesRemoved = removeTones(p.name.toLowerCase());
                return terms.every(term => nameTonesRemoved.includes(term));
            });
        }

        // Sắp xếp theo giá
        if (currentPriceSort === 'asc') {
            displayList = [...displayList].sort((a, b) => a.price - b.price);
        } else if (currentPriceSort === 'desc') {
            displayList = [...displayList].sort((a, b) => b.price - a.price);
        }

        // Đẩy sản phẩm hết hàng xuống cuối
        displayList = [...displayList].sort((a, b) => {
            const aOut = a.quantity <= 0 ? 1 : 0;
            const bOut = b.quantity <= 0 ? 1 : 0;
            return aOut - bOut;
        });

        // Tạo thẻ bộ lọc động làm ô đầu tiên trong grid sản phẩm
        const filterCard = document.createElement('div');
        filterCard.className = 'filter-card-item';
        filterCard.innerHTML = `
            <div class="filter-sidebar-title" style="margin-bottom: 0; font-size: 15px; font-weight: 700; color: #3E4B37; font-family: var(--font-serif); border-bottom: 1px solid #eee; padding-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                <i class="fa-solid fa-filter"></i> <span data-translate="filter_title">Bộ lọc</span>
            </div>
            
            <div class="filter-sidebar-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
                <div class="filter-sidebar-label" style="font-size: 13px; font-weight: 700; color: #555; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-tags" style="color:var(--primary-olive);"></i> <span data-translate="filter_price">Mức giá</span>
                </div>
                <select id="landingPriceFilter" onchange="onLandingPriceFilterChange()" class="filter-sidebar-select" style="padding: 8px 12px; border: 1px solid #e5dfd7; border-radius: 10px; font-size: 12px; font-family: inherit; outline: none; background: #fff; cursor: pointer; color: #555; width: 100%; transition: border-color 0.2s;">
                    <option value="all" data-translate="price_all">Mọi mức giá</option>
                    <option value="under-1m" data-translate="price_under_1m">Dưới 1 triệu</option>
                    <option value="1m-3m" data-translate="price_1m_3m">1 triệu - 3 triệu</option>
                    <option value="3m-5m" data-translate="price_3m_5m">3 triệu - 5 triệu</option>
                    <option value="over-5m" data-translate="price_over_5m">Trên 5 triệu</option>
                </select>
            </div>
            
            <div class="filter-sidebar-group" style="display: flex; flex-direction: column; gap: 6px; margin-top: 10px;">
                <div class="filter-sidebar-label" style="font-size: 13px; font-weight: 700; color: #555; display: flex; align-items: center; gap: 6px;">
                    <i class="fa-solid fa-sort" style="color:var(--primary-olive);"></i> <span data-translate="filter_sort">Sắp xếp</span>
                </div>
                <select id="landingPriceSort" onchange="onLandingPriceSortChange()" class="filter-sidebar-select" style="padding: 8px 12px; border: 1px solid #e5dfd7; border-radius: 10px; font-size: 12px; font-family: inherit; outline: none; background: #fff; cursor: pointer; color: #555; width: 100%; transition: border-color 0.2s;">
                    <option value="default" data-translate="sort_default">Sắp xếp: Mặc định</option>
                    <option value="asc" data-translate="sort_asc">Giá: Thấp đến Cao</option>
                    <option value="desc" data-translate="sort_desc">Giá: Cao đến Thấp</option>
                </select>
            </div>

            <button onclick="clearAllLandingFilters()" class="filter-sidebar-btn" style="padding: 8px 12px; border: 1px solid var(--discount-red,#B85C4C); color: var(--discount-red,#B85C4C); background: #fff; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: 0.2s; font-family: inherit; width: 100%; margin-top: auto;">
                <i class="fa-solid fa-filter-circle-xmark"></i> <span data-translate="filter_clear">Bỏ lọc</span>
            </button>
        `;

        // Tính toán giới hạn sản phẩm để giữ số ô chẵn theo hàng grid (ô đầu tiên là bộ lọc)
        const countToDisplay = landingLimit - 1;
        const itemsToDisplay = displayList.slice(0, countToDisplay);

        if (itemsToDisplay.length === 0) {
            productsContainer.appendChild(filterCard);
            
            const placeholder = document.createElement('div');
            placeholder.className = 'grid-placeholder';
            placeholder.innerHTML = 'Không có sản phẩm nào để hiển thị.';
            productsContainer.appendChild(placeholder);

            // Đồng bộ lại giá trị các dropdown
            const pf = document.getElementById('landingPriceFilter');
            const ps = document.getElementById('landingPriceSort');
            if (pf) pf.value = currentPriceFilter;
            if (ps) ps.value = currentPriceSort;

            if (window.applyTranslations) window.applyTranslations();

            const showMoreContainer = document.getElementById('landingShowMoreContainer');
            if (showMoreContainer) showMoreContainer.style.display = 'none';
            return;
        }

        // Đưa ô bộ lọc vào vị trí đầu tiên
        productsContainer.appendChild(filterCard);

        itemsToDisplay.forEach(product => {
            const firstImg = (product.images && product.images.length > 0) ? product.images[0] : '/images/placeholder.jpg';

            let tagText = '<span class="lang-vi">Mới</span><span class="lang-en">New</span>';
            if (product.category === '4 mùa') tagText = '<span class="lang-vi">4 Mùa</span><span class="lang-en">4 Seasons</span>';
            else if (product.category === 'mùa xuân') tagText = '<span class="lang-vi">Xuân</span><span class="lang-en">Spring</span>';
            else if (product.category === 'mùa hạ') tagText = '<span class="lang-vi">Hạ</span><span class="lang-en">Summer</span>';
            else if (product.category === 'mùa thu') tagText = '<span class="lang-vi">Thu</span><span class="lang-en">Autumn</span>';
            else if (product.category === 'mùa đông') tagText = '<span class="lang-vi">Đông</span><span class="lang-en">Winter</span>';

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
                starsHtml = `<span style="font-size: 12px; color: #999; font-style: italic;"><span class="lang-vi">Chưa có đánh giá</span><span class="lang-en">No reviews</span></span>`;
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
                ? `<button class="btn-add-new" disabled style="background-color: #ccc; border-color: #ccc; color: #666; cursor: not-allowed; pointer-events: none;">
                       <span class="lang-vi">Hết hàng</span><span class="lang-en">Out of stock</span>
                   </button>`
                : `<button class="btn-add-new" onclick="promptGuestShopping()">
                       <i class="fa-solid fa-cart-shopping"></i> <span class="lang-vi">Thêm</span><span class="lang-en">Add</span>
                   </button>`;

            card.innerHTML = `
                <div onclick="promptGuestShopping()" style="position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.8); border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 10; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                    <i class="fa-regular fa-heart" style="color: #e74c3c; font-size: 16px;"></i>
                </div>
                <div class="product-img-new" onclick="viewDetail('${product._id}')" style="cursor:pointer;">
                    <img src="${firstImg}" alt="${product.name}" onerror="this.src='/images/placeholder.jpg'">
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
            productsContainer.appendChild(card);
        });

        // Đồng bộ lại giá trị các dropdown sau khi thêm vào DOM
        const pf = document.getElementById('landingPriceFilter');
        const ps = document.getElementById('landingPriceSort');
        if (pf) pf.value = currentPriceFilter;
        if (ps) ps.value = currentPriceSort;

        if (window.applyTranslations) window.applyTranslations();

        // Xử lý nút Hiển thị thêm
        const showMoreContainer = document.getElementById('landingShowMoreContainer');
        const showMoreBtn = document.getElementById('btnLandingShowMore');
        if (showMoreContainer && showMoreBtn) {
            if (displayList.length > countToDisplay) {
                showMoreContainer.style.display = 'block';
                showMoreBtn.onclick = () => {
                    landingLimit += 5;
                    renderProductGrid();
                };
            } else {
                showMoreContainer.style.display = 'none';
            }
        }
    }

    // 3. Render Promotions (Mã giảm giá) Sidebar Widget từ DB
    function renderPromotionsWidget() {
        if (!saleProductsContainer) return;
        saleProductsContainer.innerHTML = '';

        // Lọc các khuyến mãi đang hoạt động (isActive)
        const activePromos = promotionsList.filter(p => p.isActive);

        if (activePromos.length === 0) {
            saleProductsContainer.innerHTML = `
                <div style="text-align: center; color: #999; padding: 30px 0; font-style: italic; font-size: 14px;">
                    Hiện chưa có mã giảm giá nào đang áp dụng.
                </div>`;
            return;
        }

        // Tạo container cuộn cho các Coupon để hiển thị vừa vặn trong widget
        const couponWrapper = document.createElement('div');
        couponWrapper.style = "display: flex; flex-direction: column; gap: 15px; width: 100%; max-height: 250px; overflow-y: auto; padding-right: 5px;";

        activePromos.forEach(promo => {
            const card = document.createElement('div');
            card.className = 'promo-coupon-card';
            card.innerHTML = `
                <div class="coupon-left-section">
                    <div class="coupon-discount-val">${formatDiscountAmount(promo.discountAmount)}</div>
                    <div class="coupon-discount-lbl" data-translate="coupon_discount_lbl">GIẢM</div>
                </div>
                <div class="coupon-right-section">
                    <h4 class="coupon-name">${promo.name}</h4>
                    <div class="coupon-code-wrapper">
                        <span class="coupon-code-label" data-translate="coupon_code_lbl">Mã: </span>
                        <strong class="coupon-code-text">${promo.code}</strong>
                    </div>
                    <div class="coupon-details">
                        <span><span data-translate="coupon_remaining">Còn lại:</span> <strong style="color:var(--primary-olive);">${promo.quantity} <span data-translate="coupon_times">lượt</span></strong></span>
                    </div>
                    <button class="coupon-copy-btn" onclick="copyCouponCode('${promo.code}')">
                        <i class="fa-regular fa-copy"></i> <span data-translate="coupon_copy_btn">SAO CHÉP MÃ</span>
                    </button>
                </div>
            `;
            couponWrapper.appendChild(card);
        });

        saleProductsContainer.appendChild(couponWrapper);
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations();
        }
    }

    function formatDiscountAmount(amount) {
        if (amount >= 1000) {
            return (amount / 1000).toLocaleString() + 'k';
        }
        return amount + 'đ';
    }

    window.copyCouponCode = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            if (typeof showToast === 'function') {
                showToast(`Đã sao chép mã giảm giá: ${code}`, 'success');
            } else {
                alert(`Đã sao chép mã giảm giá: ${code}`);
            }
        }).catch(err => {
            console.error('Lỗi sao chép mã:', err);
            if (typeof showToast === 'function') {
                showToast('Không thể sao chép mã!', 'error');
            }
        });
    };

    // 4. Render Customer Reviews Widget (Phân trang: 3 review/trang, tự động lướt trang)
    function renderReviewsWidget() {
        if (!reviewsContainer) return;
        reviewsContainer.innerHTML = '';

        if (!reviewsList || reviewsList.length === 0) {
            reviewsContainer.innerHTML = '<div class="grid-placeholder" data-translate="reviews_empty">Chưa có đánh giá nào.</div>';
            return;
        }

        const totalPages = Math.ceil(reviewsList.length / reviewsPerPage);

        // Đảm bảo page index không vượt quá giới hạn nếu reviewsList thay đổi
        if (currentReviewPage >= totalPages) {
            currentReviewPage = 0;
        }

        const startIndex = currentReviewPage * reviewsPerPage;
        const endIndex = Math.min(startIndex + reviewsPerPage, reviewsList.length);
        const pageItems = reviewsList.slice(startIndex, endIndex);

        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'reviews-page-wrapper';
        pageWrapper.style = "display: flex; flex-direction: column; gap: 15px; width: 100%;";

        pageItems.forEach((review, idx) => {
            const avatars = [
                'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop'
            ];
            const avatarUrl = avatars[(startIndex + idx) % avatars.length];

            const card = document.createElement('div');
            card.className = 'review-card-item';
            card.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${avatarUrl}" alt="${review.customerName}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
                        <span style="font-weight: 700; color: #3E4B37; font-size: 14px;">${review.customerName}</span>
                    </div>
                    <div class="review-rating" style="color: #ffc107; font-size: 11px;">${renderStars(review.rating)}</div>
                </div>
                <div class="review-comment-text">"${review.comment}"</div>
            `;
            pageWrapper.appendChild(card);
        });

        reviewsContainer.appendChild(pageWrapper);
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations();
        }

        // Render Dots cho các trang đánh giá
        const dotsContainer = document.getElementById('reviews-carousel-dots');
        if (dotsContainer) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('span');
                dot.className = `dot ${i === currentReviewPage ? 'active' : ''}`;
                dot.onclick = () => {
                    currentReviewPage = i;
                    renderReviewsWidget();
                };
                dotsContainer.appendChild(dot);
            }
        }
    }

    // Auto rotate reviews page every 5 seconds
    setInterval(() => {
        if (reviewsList && reviewsList.length > reviewsPerPage) {
            const totalPages = Math.ceil(reviewsList.length / reviewsPerPage);
            currentReviewPage = (currentReviewPage + 1) % totalPages;
            renderReviewsWidget();
        }
    }, 5000);

    // 5. Render Blog & Hướng dẫn chăn ga gối
    const blogData = [
        {
            title: '<span class="lang-vi">Vệ sinh chăn ga gối đúng cách</span><span class="lang-en">Properly cleaning bedding sets</span>',
            category: '<span class="lang-vi">Chăm Sóc & Vệ Sinh</span><span class="lang-en">Care & Cleaning</span>',
            image: "../images/blog/vesinh_chan_ga.png",
            content: `
                <div class="lang-vi">
                    <p>Để bộ chăn ga gối đệm luôn sạch sẽ, thơm tho và giữ được độ bền tối ưu, việc vệ sinh đúng cách đóng vai trò vô cùng quan trọng. Dưới đây là quy trình chuẩn từ chuyên gia Home Bedding:</p>
                    
                    <h3>1. Phân loại chất liệu trước khi giặt</h3>
                    <p>Mỗi loại chất liệu vải có những đặc tính sợi khác nhau, do đó yêu cầu chế độ giặt riêng:</p>
                    <ul>
                        <li><strong>Cotton Ai Cập & Bamboo:</strong> Nên chọn chế độ giặt nhẹ nhàng, nước ấm nhẹ (dưới 40°C), hạn chế chất tẩy mạnh.</li>
                        <li><strong>Tencel & Silk (Lụa):</strong> Đây là những chất liệu cực kỳ nhạy cảm. Bạn nên giặt bằng tay hoặc chọn chế độ giặt lụa chuyên biệt của máy giặt. Tuyệt đối không giặt chung với quần áo có móc khóa hoặc khóa kéo sắt.</li>
                    </ul>

                    <h3>2. Lựa chọn nước giặt phù hợp</h3>
                    <p>Khuyến khích sử dụng các loại nước giặt dịu nhẹ, trung tính. Không đổ trực tiếp nước giặt hoặc nước xả vải lên bề mặt chăn ga vì có thể gây loang màu hoặc làm giòn sợi vải.</p>

                    <h3>3. Quy trình phơi phóng, sấy khô</h3>
                    <p>Nên phơi chăn ga ở nơi thoáng gió, có nắng nhẹ. Tránh ánh nắng mặt trời chiếu trực tiếp quá gay gắt vì sẽ làm phai màu và co rút sợi. Nếu dùng máy sấy, hãy chọn nhiệt độ sấy thấp nhất (chế độ Gentle hoặc Air Dry).</p>
                </div>
                <div class="lang-en">
                    <p>To keep your bedding clean, fragrant, and maintain optimal durability, proper cleaning plays a crucial role. Here is the standard procedure from Home Bedding experts:</p>
                    
                    <h3>1. Sort materials before washing</h3>
                    <p>Each type of fabric has different fiber characteristics, therefore requiring a specific wash cycle:</p>
                    <ul>
                        <li><strong>Egyptian Cotton & Bamboo:</strong> Choose a gentle wash cycle, slightly warm water (under 40°C), and limit strong detergents.</li>
                        <li><strong>Tencel & Silk:</strong> These are extremely sensitive materials. You should hand wash or choose a specific silk wash cycle on your washing machine. Never wash together with clothes that have hooks or iron zippers.</li>
                    </ul>

                    <h3>2. Choose the right detergent</h3>
                    <p>It is recommended to use mild, neutral detergents. Do not pour detergent or fabric softener directly onto the bedding surface as it can cause color bleeding or make the fibers brittle.</p>

                    <h3>3. Drying process</h3>
                    <p>You should dry bedding in a well-ventilated area with mild sunlight. Avoid excessively harsh direct sunlight as it will fade colors and shrink fibers. If using a dryer, select the lowest heat setting (Gentle or Air Dry mode).</p>
                </div>
            `
        },
        {
            title: '<span class="lang-vi">Hướng dẫn nhận mã giảm giá của shop</span><span class="lang-en">Guide to get our discount codes</span>',
            category: '<span class="lang-vi">Ưu Đãi Mua Sắm</span><span class="lang-en">Shopping Offers</span>',
            image: "../images/blog/nhan_ma_giam_gia.png",
            content: `
                <div class="lang-vi">
                    <p>Home Bedding luôn dành tặng những chương trình ưu đãi hấp dẫn dành cho khách hàng. Làm theo các bước dưới đây để không bỏ lỡ bất kỳ mã giảm giá nào:</p>
                    
                    <h3>1. Lấy mã trực tiếp tại trang chủ</h3>
                    <p>Các mã giảm giá đang hoạt động (như GIẢM 50k, 100k, 200k...) được hiển thị đầy đủ ngay trong mục <strong>Khuyến mãi</strong> của trang chủ. Bạn chỉ cần click trực tiếp vào nút <strong>"SAO CHÉP MÃ"</strong> trên coupon, hệ thống sẽ tự động sao chép mã voucher vào khay nhớ tạm.</p>

                    <h3>2. Theo dõi tin nhắn và Email đăng ký</h3>
                    <p>Khi bạn đăng ký nhận tin bản tin ở cuối trang, hệ thống sẽ tự động gửi các mã giảm giá đặc quyền chào mừng thành viên mới trực tiếp về hòm thư Email của bạn.</p>

                    <h3>3. Cách áp dụng mã tại giỏ hàng</h3>
                    <p>Trong màn hình thanh toán đơn hàng, hãy dán (Paste) mã giảm giá bạn đã sao chép vào ô <em>"Mã giảm giá/Mã quà tặng"</em> rồi bấm áp dụng. Số tiền giảm trừ sẽ được hiển thị ngay lập tức trước khi bạn hoàn tất đơn hàng.</p>
                </div>
                <div class="lang-en">
                    <p>Home Bedding always offers attractive promotional programs for customers. Follow the steps below so you don't miss any discount codes:</p>
                    
                    <h3>1. Get codes directly on the homepage</h3>
                    <p>Active discount codes (such as 50k, 100k, 200k OFF...) are fully displayed in the <strong>Promotions</strong> section of the homepage. You just need to click directly on the <strong>"COPY CODE"</strong> button on the coupon, and the system will automatically copy the voucher code to your clipboard.</p>

                    <h3>2. Monitor your registered Email and messages</h3>
                    <p>When you subscribe to the newsletter at the bottom of the page, the system will automatically send exclusive welcome discount codes directly to your Email inbox.</p>

                    <h3>3. How to apply codes at checkout</h3>
                    <p>In the order payment screen, paste the discount code you copied into the <em>"Discount/Gift code"</em> box and click apply. The discounted amount will be displayed immediately before you complete the order.</p>
                </div>
            `
        },
        {
            title: '<span class="lang-vi">Hướng dẫn đăng ký đăng nhập tài khoản</span><span class="lang-en">Account registration and login guide</span>',
            category: '<span class="lang-vi">Hướng Dẫn Hệ Thống</span><span class="lang-en">System Guide</span>',
            image: "../images/blog/dang_ky_dang_nhap.png",
            content: `
                <div class="lang-vi">
                    <p>Trở thành thành viên của Home Bedding giúp bạn quản lý đơn hàng tốt hơn và nhận nhiều đặc quyền VIP tích điểm. Dưới đây là hướng dẫn chi tiết:</p>
                    
                    <h3>1. Các bước đăng ký tài khoản mới</h3>
                    <ol>
                        <li>Bấm vào biểu tượng <strong>Tài khoản</strong> (hình người) trên Header hoặc nút Đăng ký ngay trong hộp thoại.</li>
                        <li>Điền đầy đủ thông tin: Họ tên, Email, Số điện thoại và mật khẩu của bạn.</li>
                        <li>Lưu ý mật khẩu cần dài tối thiểu 8 ký tự, bao gồm ít nhất 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt để đảm bảo an toàn bảo mật.</li>
                        <li>Bấm nút <strong>"Đăng Ký Ngay"</strong> để hoàn tất.</li>
                    </ol>

                    <h3>2. Đăng nhập hệ thống</h3>
                    <p>Nhập email (hoặc tên đăng nhập) và mật khẩu đã đăng ký của bạn. Hệ thống sẽ tự động phân quyền vai trò (Khách hàng, Nhân viên, Admin) và đưa bạn đến giao diện quản lý mua sắm cá nhân hóa.</p>
                </div>
                <div class="lang-en">
                    <p>Becoming a Home Bedding member helps you manage orders better and receive many VIP point accumulation privileges. Below are the detailed instructions:</p>
                    
                    <h3>1. Steps to register a new account</h3>
                    <ol>
                        <li>Click the <strong>Account</strong> icon (person figure) on the Header or the Register Now button in the dialog.</li>
                        <li>Fill in your full information: Full name, Email, Phone number, and your password.</li>
                        <li>Note that the password must be at least 8 characters long, including at least 1 uppercase letter, 1 number, and 1 special character to ensure security.</li>
                        <li>Click the <strong>"Register Now"</strong> button to complete.</li>
                    </ol>

                    <h3>2. System login</h3>
                    <p>Enter your registered email (or username) and password. The system will automatically assign roles (Customer, Staff, Admin) and take you to a personalized shopping management interface.</p>
                </div>
            `
        },
        {
            title: '<span class="lang-vi">Hướng dẫn mua sắm thông minh hiện đại</span><span class="lang-en">Modern smart shopping guide</span>',
            category: '<span class="lang-vi">Cẩm Nang Mua Sắm</span><span class="lang-en">Shopping Manual</span>',
            image: "../images/blog/mua_sam_thong_minh.png",
            content: `
                <div class="lang-vi">
                    <p>Làm thế nào để lựa chọn được bộ chăn ga gối đệm ưng ý, vừa vặn và tiết kiệm chi phí nhất? Hãy bỏ túi ngay các mẹo mua sắm thông minh sau:</p>
                    
                    <h3>1. Xác định chính xác kích thước đệm</h3>
                    <p>Trước khi đặt mua ga giường, bạn cần đo chính xác 3 chỉ số của đệm giường: Chiều dài, Chiều rộng và Chiều cao (độ dày đệm). Ga giường bọc của Home Bedding hỗ trợ độ dày đệm lên đến 25cm. Nếu đệm của bạn dày hơn, hãy nhắn tin trực tiếp để nhân viên hỗ trợ may đo riêng.</p>

                    <h3>2. Lựa chọn chất liệu dựa trên nhu cầu thời tiết</h3>
                    <ul>
                        <li><strong>Mùa Hè & Mùa Xuân:</strong> Nên ưu tiên vải Tencel hoặc Sợi tre (Bamboo) nhờ đặc tính thấm hút mồ hôi siêu nhanh và mang lại cảm giác mát lạnh tức thì khi chạm vào da.</li>
                        <li><strong>Mùa Đông & Mùa Thu:</strong> Cotton Ai Cập hoặc gấm dệt dày dặn sẽ giữ ấm tốt hơn mà vẫn duy trì được độ thông thoáng cho cơ thể.</li>
                    </ul>

                    <h3>3. Phối màu theo phong thủy và nội thất phòng ngủ</h3>
                    <p>Nên chọn các tone màu trung tính ấm áp (beige, trắng kem, xanh olive nhạt) để tạo cảm giác thư giãn tuyệt đối cho hệ thần kinh trước khi đi vào giấc ngủ.</p>
                </div>
                <div class="lang-en">
                    <p>How to choose the most satisfactory, perfectly fitting, and cost-effective bedding set? Keep these smart shopping tips in mind:</p>
                    
                    <h3>1. Accurately determine mattress dimensions</h3>
                    <p>Before ordering fitted sheets, you need to accurately measure 3 indicators of your mattress: Length, Width, and Height (mattress thickness). Home Bedding's fitted sheets support mattress thicknesses up to 25cm. If your mattress is thicker, please message us directly so our staff can assist with custom tailoring.</p>

                    <h3>2. Choose materials based on weather needs</h3>
                    <ul>
                        <li><strong>Summer & Spring:</strong> Prioritize Tencel or Bamboo fabrics due to their super-fast sweat absorption properties and immediate cooling sensation when touching the skin.</li>
                        <li><strong>Winter & Autumn:</strong> Egyptian Cotton or thick brocade will keep you warmer while maintaining body ventilation.</li>
                    </ul>

                    <h3>3. Color coordination according to feng shui and bedroom interior</h3>
                    <p>You should choose warm neutral tones (beige, creamy white, light olive green) to create an absolute sense of relaxation for the nervous system before falling asleep.</p>
                </div>
            `
        },
        {
            title: '<span class="lang-vi">Hướng dẫn cất chăn ga gối đúng cách</span><span class="lang-en">Guide to properly storing bedding</span>',
            category: '<span class="lang-vi">Chăm Sóc & Vệ Sinh</span><span class="lang-en">Care & Cleaning</span>',
            image: "../images/blog/cat_chan_ga.png",
            content: `
                <div class="lang-vi">
                    <p>Khi thay đổi thời tiết hoặc khi chưa có nhu cầu sử dụng, việc cất trữ chăn ga gối đúng cách sẽ giúp ngăn ngừa tình trạng ẩm mốc, côn trùng tấn công và giữ hương thơm lâu dài:</p>
                    
                    <h3>1. Đảm bảo chăn ga khô hoàn toàn</h3>
                    <p>Tuyệt đối không cất chăn ga gối khi vải còn hơi ẩm. Độ ẩm dù là nhỏ nhất cũng là tác nhân lý tưởng để nấm mốc phát triển, gây ố vàng và mùi hôi khó chịu.</p>

                    <h3>2. Sử dụng túi đựng vải thoáng khí</h3>
                    <p>Nên dùng các loại túi đựng chuyên dụng bằng vải không dệt thoáng khí thay vì túi nilon kín mít. Túi nilon kín có thể khóa chặt hơi ẩm bên trong và gây bí khí đối với sợi tự nhiên.</p>

                    <h3>3. Vị trí lưu trữ lý tưởng</h3>
                    <p>Lưu trữ chăn ga gối ở tủ gỗ khô ráo, cao ráo, tránh áp sát tường ẩm. Bạn có thể đặt vào tủ một vài túi hoa oải hương (lavender) khô hoặc thanh gỗ tuyết tùng để xua đuổi côn trùng tự nhiên và tạo mùi hương thư thái.</p>
                </div>
                <div class="lang-en">
                    <p>When the weather changes or when not in use, properly storing bedding will help prevent mold, insect attacks, and maintain a long-lasting fragrance:</p>
                    
                    <h3>1. Ensure bedding is completely dry</h3>
                    <p>Never store bedding when the fabric is still slightly damp. Even the slightest moisture is an ideal agent for mold growth, causing yellowing and unpleasant odors.</p>

                    <h3>2. Use breathable fabric storage bags</h3>
                    <p>You should use specialized breathable non-woven fabric bags instead of airtight plastic bags. Airtight plastic bags can lock moisture inside and cause stuffiness for natural fibers.</p>

                    <h3>3. Ideal storage location</h3>
                    <p>Store bedding in a dry, elevated wooden cabinet, avoiding pressing against damp walls. You can place a few dry lavender bags or cedar wood blocks in the closet to naturally repel insects and create a relaxing scent.</p>
                </div>
            `
        },
        {
            title: '<span class="lang-vi">Bí quyết chọn chất liệu chăn ga gối theo mùa</span><span class="lang-en">Tips for choosing seasonal bedding materials</span>',
            category: '<span class="lang-vi">Cẩm Nang Giấc Ngủ</span><span class="lang-en">Sleep Manual</span>',
            image: "../images/blog/chon_chat_lieu.png",
            content: `
                <div class="lang-vi">
                    <p>Thời tiết thay đổi có ảnh hưởng trực tiếp đến chất lượng giấc ngủ. Việc thấu hiểu và thay đổi chất liệu chăn ga gối phù hợp cho từng mùa sẽ giúp nâng niu trọn vẹn giấc ngủ vàng của gia đình bạn:</p>
                    
                    <h3>1. Mùa Xuân dịu nhẹ - Ưu tiên Cotton Ai Cập</h3>
                    <p>Mùa xuân có độ ẩm không khí khá cao và nhiệt độ mát mẻ. Sợi bông Egyptian Cotton dẻo dai dài gấp đôi sợi cotton thường sẽ đem lại khả năng điều hòa độ ẩm tối ưu, giữ cho giường ngủ luôn khô ráo và êm ái.</p>

                    <h3>2. Mùa Hạ oi bức - Mát mịn cùng Tencel và Bamboo</h3>
                    <p>Chất liệu Tencel (làm từ bột gỗ khuynh diệp) và Bamboo (sợi tre) nổi tiếng với công nghệ dệt mát lạnh, thấm hút mồ hôi cực mạnh. Khả năng kháng khuẩn tự nhiên của sợi tre còn giúp ngăn ngừa tối đa vi khuẩn tích tụ trong những ngày hè nắng nóng.</p>

                    <h3>3. Mùa Thu & Mùa Đông ấm áp - Lựa chọn bông tự nhiên dày dặn</h3>
                    <p>Khi trời se lạnh, các bộ chăn ga chần bông Cotton cao cấp hoặc chăn ga gấm sang trọng sẽ giúp giữ ấm tốt, tạo cảm giác ấm cúng bao bọc lấy cơ thể để bạn nhanh chóng đi vào giấc ngủ ngon lành.</p>
                </div>
                <div class="lang-en">
                    <p>Weather changes directly affect sleep quality. Understanding and changing to appropriate bedding materials for each season will help fully nurture your family's golden sleep:</p>
                    
                    <h3>1. Mild Spring - Prioritize Egyptian Cotton</h3>
                    <p>Spring has quite high humidity and cool temperatures. Egyptian Cotton fibers, which are twice as long and flexible as regular cotton, provide optimal moisture regulation, keeping your bed always dry and smooth.</p>

                    <h3>2. Sweltering Summer - Cool and smooth with Tencel and Bamboo</h3>
                    <p>Tencel material (made from eucalyptus wood pulp) and Bamboo fibers are famous for their cooling weaving technology and extremely strong sweat absorption. The natural antibacterial ability of bamboo fibers also helps maximally prevent bacteria accumulation during hot summer days.</p>

                    <h3>3. Warm Autumn & Winter - Choose thick natural cotton</h3>
                    <p>When it gets chilly, premium cotton quilted bedding sets or luxurious brocade bedding will help keep you warm, creating a cozy feeling wrapping around your body so you can quickly fall into a sound sleep.</p>
                </div>
            `
        }
    ];

    let blogSliderIndex = 0;

    function renderBlogGrid() {
        if (!blogSliderContainer) return;
        blogSliderContainer.innerHTML = '';

        blogData.forEach((blog, index) => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.onclick = () => viewBlogDetail(index);
            card.innerHTML = `
                <img src="${blog.image}" alt="Blog Image" class="blog-card-img" onerror="this.src='../images/1.png'">
                <div class="blog-card-overlay">
                    <span class="blog-card-category">${blog.category}</span>
                    <h3 class="blog-card-title">${blog.title}</h3>
                    <div class="blog-card-readmore">
                        <span class="lang-vi">ĐỌC BÀI VIẾT</span><span class="lang-en">READ ARTICLE</span> <i class="fa-solid fa-arrow-right"></i>
                    </div>
                </div>
            `;
            blogSliderContainer.appendChild(card);
        });
        if (typeof window.applyTranslations === 'function') {
            window.applyTranslations();
        }
    }

    let blogAutoPlayInterval = null;

    window.slideBlog = (direction) => {
        if (!blogSliderContainer) return;

        // Dừng auto-play khi người dùng bấm nút thủ công
        if (blogAutoPlayInterval) {
            clearInterval(blogAutoPlayInterval);
        }

        const card = blogSliderContainer.querySelector('.blog-card');
        if (!card) return;
        const cardWidth = card.offsetWidth + 30; // 30px gap
        const visibleWidth = blogSliderContainer.parentElement.offsetWidth;
        const totalWidth = blogSliderContainer.scrollWidth;
        const maxScroll = totalWidth - visibleWidth;

        if (direction === 1) {
            blogSliderIndex += cardWidth;
            if (blogSliderIndex > maxScroll) blogSliderIndex = maxScroll;
        } else {
            blogSliderIndex -= cardWidth;
            if (blogSliderIndex < 0) blogSliderIndex = 0;
        }

        blogSliderContainer.style.transform = `translateX(-${blogSliderIndex}px)`;

        // Khởi động lại auto-play sau khi dừng thủ công
        startBlogAutoPlay();
    };

    function startBlogAutoPlay() {
        if (blogAutoPlayInterval) clearInterval(blogAutoPlayInterval);

        blogAutoPlayInterval = setInterval(() => {
            if (!blogSliderContainer) return;
            const card = blogSliderContainer.querySelector('.blog-card');
            if (!card) return;

            const cardWidth = card.offsetWidth + 30; // 30px gap
            const visibleWidth = blogSliderContainer.parentElement.offsetWidth;
            const totalWidth = blogSliderContainer.scrollWidth;
            const maxScroll = totalWidth - visibleWidth;

            blogSliderIndex += cardWidth;
            if (blogSliderIndex > maxScroll) {
                blogSliderIndex = 0; // Quay về đầu khi cuộn hết
            }
            blogSliderContainer.style.transform = `translateX(-${blogSliderIndex}px)`;
        }, 5000); // Tự động trượt mỗi 5 giây
    }

    // Khởi tạo auto-play khi tải xong
    startBlogAutoPlay();

    // Dừng auto-play khi người dùng rê chuột (hover) vào vùng Blog và tiếp tục khi rê chuột ra ngoài
    if (blogSliderContainer) {
        const sliderWrapper = blogSliderContainer.closest('.blog-slider-wrapper');
        if (sliderWrapper) {
            sliderWrapper.addEventListener('mouseenter', () => {
                if (blogAutoPlayInterval) {
                    clearInterval(blogAutoPlayInterval);
                    blogAutoPlayInterval = null;
                }
            });
            sliderWrapper.addEventListener('mouseleave', () => {
                startBlogAutoPlay();
            });
        }
    }

    window.viewBlogDetail = function (index) {
        const blog = blogData[index];
        if (!blog) return;

        document.getElementById('blogDetailMainImg').src = blog.image;
        document.getElementById('blogDetailCategory').innerHTML = blog.category;
        document.getElementById('blogDetailTitle').innerHTML = blog.title;
        document.getElementById('blogDetailContent').innerHTML = blog.content;

        document.getElementById('blogDetailModal').style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    window.closeBlogDetailModal = function () {
        document.getElementById('blogDetailModal').style.display = 'none';
        document.body.style.overflow = '';
    };

    // 6. Setup season category filter fallback
    window.filterBySeason = (seasonName) => {
        if (typeof landingFilterPills !== 'undefined') {
            const targetPill = Array.from(landingFilterPills).find(p => p.getAttribute('data-category') === seasonName);
            if (targetPill) targetPill.click();
        }
    };

    // Helper functions
    function renderStars(rating) {
        let stars = '';
        const count = Math.round(rating || 5);
        for (let i = 1; i <= 5; i++) {
            if (i <= count) {
                stars += '<i class="fa-solid fa-star"></i>';
            } else {
                stars += '<i class="fa-regular fa-star"></i>';
            }
        }
        return stars;
    }

    function formatVND(amount) {
        return amount.toLocaleString('vi-VN') + ' VND';
    }

    window.promptGuestShopping = () => {
        showToast('Vui lòng Đăng Nhập để xem chi tiết và mua hàng!', 'warning');
        openModal('loginModal');
    };

    // Countdown Timers logic
    function initCountdownTimers() {
        function updateTimers() {
            const now = new Date();
            // Count down to end of today
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            const diff = endOfDay - now;
            if (diff <= 0) {
                // Reset to tomorrow
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            const format = (num) => String(num).padStart(2, '0');

            const hDom = document.getElementById('cd-hours');
            const mDom = document.getElementById('cd-minutes');
            const sDom = document.getElementById('cd-seconds');
            if (hDom) hDom.textContent = format(hours);
            if (mDom) mDom.textContent = format(minutes);
            if (sDom) sDom.textContent = format(seconds);

            const hDom2 = document.getElementById('cd-hours2');
            const mDom2 = document.getElementById('cd-minutes2');
            const sDom2 = document.getElementById('cd-seconds2');
            if (hDom2) hDom2.textContent = format(hours);
            if (mDom2) mDom2.textContent = format(minutes);
            if (sDom2) sDom2.textContent = format(seconds);
        }

        updateTimers();
        setInterval(updateTimers, 1000);
    }

    // Header scroll background shadows
    function setupHeaderScroll() {
        const header = document.querySelector('.main-header');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Scroll Spy: Highlighting header links on scroll
    function setupScrollSpy() {
        const navLinks = document.querySelectorAll('.main-nav .nav-link');
        const sections = [
            { id: null, link: navLinks[0] }, // TRANG CHỦ (mặc định / đầu trang)
            { id: 'section-about', link: navLinks[1] }, // GIỚI THIỆU
            { id: 'section-products', link: navLinks[2] }, // SẢN PHẨM NỔI BẬT
            { id: 'section-promotions', link: navLinks[3] }, // KHUYẾN MÃI
            { id: 'section-blog', link: navLinks[4] } // BLOG
        ];

        function makeActive() {
            let currentActive = sections[0];
            const scrollPos = window.scrollY + 160; // Offset cho sticky header + padding

            // Kiểm tra xem vị trí cuộn hiện tại đang ở phần nào
            for (let i = 1; i < sections.length; i++) {
                const el = document.getElementById(sections[i].id);
                if (el) {
                    const top = el.offsetTop;
                    if (scrollPos >= top) {
                        currentActive = sections[i];
                    }
                }
            }

            // Xóa active khỏi tất cả các links và thêm vào link hiện tại
            navLinks.forEach(link => {
                if (link) link.classList.remove('active');
            });
            if (currentActive && currentActive.link) {
                currentActive.link.classList.add('active');
            }
        }

        window.addEventListener('scroll', makeActive);
        makeActive(); // Chạy ngay lần đầu tiên
    }

    // Tab buttons click listeners
    function setupTabListeners() {
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Đặt lại active cho pill "Tất cả" của bộ lọc mùa
                if (typeof landingFilterPills !== 'undefined') {
                    landingFilterPills.forEach(p => p.classList.remove('active'));
                    const allPill = Array.from(landingFilterPills).find(p => p.getAttribute('data-category') === 'all');
                    if (allPill) allPill.classList.add('active');
                }
                currentSeason = 'all';

                currentTab = btn.getAttribute('data-tab');
                renderProductGrid();
            });
        });
    }

    // Premium Mock Fallback Products (Matching reference image names & categories)
    function getMockProducts() {
        return [
            {
                name: "Bộ Ga Gối Premium Cotton Ai Cập",
                category: "mùa xuân",
                price: 5512000,
                description: "Mềm mại vượt trội từ bông Ai Cập thiên nhiên chọn lọc.",
                images: ["../images/new_banner.png"],
                averageRating: 5,
                reviewCount: 24,
                createdAt: new Date("2026-05-01")
            },
            {
                name: "Bộ Ga Gối Premium Tencel 60s",
                category: "mùa hạ",
                price: 5512000,
                description: "Mát mịn tự nhiên, kháng khuẩn, bảo vệ làn da của bạn.",
                images: ["../images/new_banner2.png"],
                averageRating: 5,
                reviewCount: 18,
                createdAt: new Date("2026-05-02")
            },
            {
                name: "Bộ Ga Gối Lụa Tencel Cao Cấp",
                category: "mùa thu",
                price: 6512000,
                description: "Sang trọng và đẳng cấp tuyệt đối cho không gian phòng ngủ.",
                images: ["../images/new_banner3.png"],
                averageRating: 4.8,
                reviewCount: 15,
                createdAt: new Date("2026-05-03")
            },
            {
                name: "Bộ Ga Gối Bamboo Luxury",
                category: "mùa đông",
                price: 5512000,
                description: "Vải sợi tre kháng khuẩn tự nhiên, thoáng mát mùa hè, ấm áp mùa đông.",
                images: ["../images/new_banner4.png"],
                averageRating: 5,
                reviewCount: 30,
                createdAt: new Date("2026-05-04")
            }
        ];
    }

    // Premium Mock Fallback Reviews
    function getMockReviews() {
        return [
            {
                customerName: "Nguyễn Thủy Linh",
                rating: 5,
                comment: "Chất lượng sản phẩm tuyệt vời, vải rất mềm mại và thoáng mát. Sẽ tiếp tục ủng hộ Home Bedding!"
            },
            {
                customerName: "Trần Minh Anh",
                rating: 5,
                comment: "Giao hàng nhanh, đóng gói đẹp và cẩn thận. Nhân viên tư vấn cực kỳ nhiệt tình và chuyên nghiệp."
            },
            {
                customerName: "Phạm Hoàng Nam",
                rating: 5,
                comment: "Thiết kế tinh tế, sang trọng, rất phù hợp với phòng ngủ hiện đại. Đáng tiền từng đồng!"
            }
        ];
    }

    window.toggleLandingRevenueFilters = function() {
        const filterType = document.getElementById('landingRevenueFilterType').value;
        const monthPicker = document.getElementById('landingRevenueMonthPicker');
        const datePickerWrapper = document.getElementById('landingRevenueDatePickerWrapper');
        const quarterWrapper = document.getElementById('landingRevenueQuarterPickerWrapper');

        monthPicker.style.display = 'none';
        datePickerWrapper.style.display = 'none';
        quarterWrapper.style.display = 'none';

        if (filterType === 'month') {
            monthPicker.style.display = 'block';
        } else if (filterType === 'date') {
            datePickerWrapper.style.display = 'flex';
            const now = new Date();
            const startInput = document.getElementById('landingRevenueStartDatePicker');
            const endInput = document.getElementById('landingRevenueEndDatePicker');
            if (!startInput.value || !endInput.value) {
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                startInput.value = `${y}-${m}-01`;
                const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
                endInput.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
            }
        } else if (filterType === 'quarter') {
            quarterWrapper.style.display = 'flex';
        }
        
        loadRevenueChart();
    };

    // 7. Load & Render Revenue Chart from Admin Data
    window.loadRevenueChart = async function () {
        const container = document.getElementById('landingLineChartContainer');
        const filterTypeSelect = document.getElementById('landingRevenueFilterType');
        
        if (!filterTypeSelect) return;
        const filterType = filterTypeSelect.value;
        let url = `/api/orders/revenue-report?filterType=${filterType}`;

        if (filterType === 'month') {
            const picker = document.getElementById('landingRevenueMonthPicker');
            if (!picker.value) {
                const now = new Date();
                picker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }
            url += `&month=${picker.value}`;
        } else if (filterType === 'date') {
            const startInput = document.getElementById('landingRevenueStartDatePicker');
            const endInput = document.getElementById('landingRevenueEndDatePicker');
            if(startInput.value && endInput.value) {
                url += `&startDate=${startInput.value}&endDate=${endInput.value}`;
            }
        } else if (filterType === 'quarter') {
            const yearSelect = document.getElementById('landingRevenueQuarterYear');
            const quarterSelect = document.getElementById('landingRevenueQuarterVal');
            url += `&quarterYear=${yearSelect.value}&quarterVal=${quarterSelect.value}`;
        }

        if (container) {
            container.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-top:100px;"><span class="lang-vi">Đang tải biểu đồ doanh thu...</span><span class="lang-en">Loading revenue chart...</span></div>';
        }

        try {
            const res = await fetch(url);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            renderLandingLineChart(data.dailyTrends);
        } catch (err) {
            console.error('Lỗi tải doanh thu:', err);
            if (container) {
                container.innerHTML = '<div style="width:100%; text-align:center; color:#d9534f; padding-top:100px;"><span class="lang-vi">Không thể tải dữ liệu báo cáo doanh thu.</span><span class="lang-en">Failed to load revenue report data.</span></div>';
            }
        }
    };

    function renderLandingLineChart(dailyTrends) {
        const container = document.getElementById('landingLineChartContainer');
        if (!container) return;

        if (!dailyTrends || dailyTrends.length === 0) {
            container.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-top:100px;"><span class="lang-vi">Không có dữ liệu xu hướng trong kỳ</span><span class="lang-en">No trend data available for this period</span></div>';
            return;
        }

        const totalDays = dailyTrends.length;
        const maxVal = Math.max(...dailyTrends.map(d => Math.max(d.revenue, d.salary)), 100000);

        const svgWidth = 800;
        const svgHeight = 300;
        const paddingLeft = 70;
        const paddingRight = 20;
        const paddingTop = 25;
        const paddingBottom = 40;

        const chartWidth = svgWidth - paddingLeft - paddingRight;
        const chartHeight = svgHeight - paddingTop - paddingBottom;

        // 1. Vẽ lưới dọc ngang
        let gridHtml = '';
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const yVal = (maxVal / gridSteps) * i;
            const yPos = svgHeight - paddingBottom - (yVal / maxVal) * chartHeight;
            gridHtml += `<line x1="${paddingLeft}" y1="${yPos}" x2="${svgWidth - paddingRight}" y2="${yPos}" stroke="#eee" stroke-dasharray="4" />`;

            let labelText = '';
            if (yVal >= 1000000) {
                labelText = (yVal / 1000000).toFixed(1) + 'M';
            } else {
                labelText = (yVal / 1000).toFixed(0) + 'k';
            }
            gridHtml += `<text x="${paddingLeft - 12}" y="${yPos + 4}" font-size="11" font-weight="600" fill="#999" text-anchor="end">${labelText}</text>`;
        }

        // 2. Tính toán điểm
        const revenuePoints = [];
        const salaryPoints = [];

        dailyTrends.forEach(d => {
            const x = paddingLeft + ((d.day - 1) / (totalDays - 1)) * chartWidth;
            const yRev = svgHeight - paddingBottom - (d.revenue / maxVal) * chartHeight;
            const ySal = svgHeight - paddingBottom - (d.salary / maxVal) * chartHeight;

            revenuePoints.push({ x, y: yRev, value: d.revenue, date: d.date });
            salaryPoints.push({ x, y: ySal, value: d.salary, date: d.date });
        });

        const revenuePointsStr = revenuePoints.map(p => `${p.x},${p.y}`).join(' ');
        const salaryPointsStr = salaryPoints.map(p => `${p.x},${p.y}`).join(' ');

        const revenueAreaStr = `${paddingLeft},${svgHeight - paddingBottom} ${revenuePointsStr} ${svgWidth - paddingRight},${svgHeight - paddingBottom}`;
        const salaryAreaStr = `${paddingLeft},${svgHeight - paddingBottom} ${salaryPointsStr} ${svgWidth - paddingRight},${svgHeight - paddingBottom}`;

        // 3. Trục X
        let xAxisHtml = '';
        const labelInterval = Math.max(1, Math.ceil(totalDays / 12));
        dailyTrends.forEach((d, index) => {
            if (d.day === 1 || (d.day - 1) % labelInterval === 0 || d.day === totalDays) {
                const x = paddingLeft + (index / (totalDays - 1)) * chartWidth;
                xAxisHtml += `
                    <line x1="${x}" y1="${svgHeight - paddingBottom}" x2="${x}" y2="${svgHeight - paddingBottom + 5}" stroke="#ddd" />
                    <text x="${x}" y="${svgHeight - paddingBottom + 20}" font-size="11" font-weight="600" fill="#777" text-anchor="middle">${d.label || d.day}</text>
                `;
            }
        });

        // 4. Điểm tròn
        let dotsHtml = '';
        revenuePoints.forEach((p, index) => {
            const salP = salaryPoints[index];
            dotsHtml += `
                <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#3498db" stroke="white" stroke-width="1" />
                <circle cx="${salP.x}" cy="${salP.y}" r="3.5" fill="#e74c3c" stroke="white" stroke-width="1" />
            `;
        });

        container.innerHTML = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" style="overflow: visible; cursor: crosshair;">
                <!-- Nền và lưới -->
                ${gridHtml}
                <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="#ddd" stroke-width="1.5" />
                ${xAxisHtml}
                <polygon points="${revenueAreaStr}" fill="rgba(52, 152, 219, 0.07)" />
                <polygon points="${salaryAreaStr}" fill="rgba(231, 76, 60, 0.04)" />
                <polyline points="${revenuePointsStr}" fill="none" stroke="#3498db" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                <polyline points="${salaryPointsStr}" fill="none" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
                ${dotsHtml}

                <!-- Tracker hướng dọc -->
                <rect id="svgLandingHoverBand" y="${paddingTop}" width="${Math.max(10, chartWidth / (totalDays - 1 || 1))}" height="${chartHeight}" fill="rgba(52, 152, 219, 0.05)" style="display: none; pointer-events: none;" />
                <line id="svgLandingHoverLine" x1="0" y1="${paddingTop}" x2="0" y2="${svgHeight - paddingBottom}" stroke="#7f8c8d" stroke-width="1.5" stroke-dasharray="3,3" style="display: none; pointer-events: none;" />
                <circle id="svgLandingHoverCircleRev" r="6" fill="#3498db" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
                <circle id="svgLandingHoverCircleSal" r="6" fill="#e74c3c" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
            </svg>
        `;

        const svg = container.querySelector('svg');
        let tooltip = document.getElementById('landingLineChartTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'landingLineChartTooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            tooltip.style.border = '1px solid #e0e0e0';
            tooltip.style.borderRadius = '8px';
            tooltip.style.padding = '12px';
            tooltip.style.fontSize = '12px';
            tooltip.style.fontFamily = '"Quicksand", sans-serif';
            tooltip.style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.display = 'none';
            tooltip.style.zIndex = '3000';
            tooltip.style.minWidth = '180px';
            tooltip.style.transition = 'opacity 0.1s ease, transform 0.1s ease';
            container.appendChild(tooltip);
        }

        let lockedIdx = -1;

        function drawTracker(idx, clientX, clientY) {
            const hoverBand = svg.getElementById('svgLandingHoverBand');
            const hoverLine = svg.getElementById('svgLandingHoverLine');
            const hoverCircleRev = svg.getElementById('svgLandingHoverCircleRev');
            const hoverCircleSal = svg.getElementById('svgLandingHoverCircleSal');

            if (idx === -1) {
                if (hoverBand) hoverBand.style.display = 'none';
                if (hoverLine) hoverLine.style.display = 'none';
                if (hoverCircleRev) hoverCircleRev.style.display = 'none';
                if (hoverCircleSal) hoverCircleSal.style.display = 'none';
                tooltip.style.display = 'none';
                return;
            }

            const p = revenuePoints[idx];
            const salP = salaryPoints[idx];
            const trend = dailyTrends[idx];

            if (hoverBand) {
                const bandWidth = Math.max(10, chartWidth / (totalDays - 1 || 1));
                hoverBand.setAttribute('x', p.x - bandWidth / 2);
                hoverBand.setAttribute('width', bandWidth);
                hoverBand.style.display = 'block';
            }
            if (hoverLine) {
                hoverLine.setAttribute('x1', p.x);
                hoverLine.setAttribute('x2', p.x);
                hoverLine.style.display = 'block';
            }
            if (hoverCircleRev && hoverCircleSal) {
                hoverCircleRev.setAttribute('cx', p.x);
                hoverCircleRev.setAttribute('cy', p.y);
                hoverCircleRev.style.display = 'block';
                hoverCircleSal.setAttribute('cx', salP.x);
                hoverCircleSal.setAttribute('cy', salP.y);
                hoverCircleSal.style.display = 'block';
            }

            const profit = trend.revenue - trend.salary;
            const profitSign = profit >= 0 ? '+' : '';
            const profitColor = profit >= 0 ? '#2ecc71' : '#e74c3c';

            tooltip.innerHTML = `
                <div style="font-weight: 700; color: #555; margin-bottom: 6px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                    <span><span class="lang-vi">Kỳ:</span><span class="lang-en">Period:</span> ${trend.date.split('-').reverse().join('/')}</span>
                    ${lockedIdx === idx ? '<span style="font-size: 9px; font-weight: 700; color: var(--primary-olive); background: rgba(122, 133, 103, 0.15); padding: 1px 5px; border-radius: 4px;"><span class="lang-vi">Đã ghim</span><span class="lang-en">Pinned</span></span>' : ''}
                </div>
                <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 3px;">
                    <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#3498db; border-radius:50%; margin-right:5px;"></span><span class="lang-vi">Doanh thu:</span><span class="lang-en">Revenue:</span></span>
                    <strong style="color: #3498db;">${trend.revenue.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 6px;">
                    <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#e74c3c; border-radius:50%; margin-right:5px;"></span><span class="lang-vi">Lương NV:</span><span class="lang-en">Staff Salary:</span></span>
                    <strong style="color: #e74c3c;">${trend.salary.toLocaleString('vi-VN')} đ</strong>
                </div>
                <div style="display: flex; justify-content: space-between; gap: 15px; border-top: 1px dashed #eee; padding-top: 4px; font-weight: 700;">
                    <span style="color: #333;"><span class="lang-vi">Lợi nhuận ròng:</span><span class="lang-en">Net Profit:</span></span>
                    <span style="color: ${profitColor};">${profitSign}${profit.toLocaleString('vi-VN')} đ</span>
                </div>
            `;

            const rect = svg.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();

            let leftPos, topPos;
            if (clientX !== undefined && clientY !== undefined) {
                leftPos = clientX - rect.left + 15;
                topPos = clientY - rect.top - tooltipRect.height / 2;
            } else {
                leftPos = (p.x / svgWidth) * rect.width + 15;
                topPos = (p.y / svgHeight) * rect.height - tooltipRect.height / 2;
            }

            if (leftPos + tooltipRect.width > rect.width) {
                leftPos = leftPos - tooltipRect.width - 30;
                if (leftPos < 0) leftPos = 10;
            }
            if (topPos < 0) topPos = 10;
            if (topPos + tooltipRect.height > rect.height) {
                topPos = rect.height - tooltipRect.height - 10;
            }

            tooltip.style.left = `${leftPos}px`;
            tooltip.style.top = `${topPos}px`;
            tooltip.style.display = 'block';
        }

        svg.addEventListener('mousemove', (e) => {
            const rect = svg.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

            let closestPt = null;
            let minDiff = Infinity;
            let closestIdx = -1;

            revenuePoints.forEach((p, idx) => {
                const diff = Math.abs(p.x - mouseX);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPt = p;
                    closestIdx = idx;
                }
            });

            if (closestPt && minDiff < (chartWidth / totalDays) * 2.5) {
                drawTracker(closestIdx, e.clientX, e.clientY);
            } else if (lockedIdx !== -1) {
                drawTracker(lockedIdx);
            } else {
                drawTracker(-1);
            }
        });

        svg.addEventListener('click', (e) => {
            const rect = svg.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

            let closestPt = null;
            let minDiff = Infinity;
            let closestIdx = -1;

            revenuePoints.forEach((p, idx) => {
                const diff = Math.abs(p.x - mouseX);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPt = p;
                    closestIdx = idx;
                }
            });

            if (closestPt && minDiff < (chartWidth / totalDays) * 2.5) {
                if (lockedIdx === closestIdx) {
                    lockedIdx = -1;
                    drawTracker(closestIdx, e.clientX, e.clientY);
                } else {
                    lockedIdx = closestIdx;
                    drawTracker(closestIdx);
                }
            } else {
                lockedIdx = -1;
                drawTracker(-1);
            }
        });

        svg.addEventListener('mouseleave', () => {
            if (lockedIdx !== -1) {
                drawTracker(lockedIdx);
            } else {
                drawTracker(-1);
            }
        });
    }
});

/* ================= GUEST PRODUCT DETAIL MODAL LOGIC ================= */
let currentDetailProductId = null;
let currentDetailProductPrice = 0;
let currentDetailProductStock = 0;
let currentLightboxImages = [];
let currentLightboxIndex = 0;

window.viewDetail = async function (id) {
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
                addCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> <span class="lang-vi">Hết hàng</span><span class="lang-en">Out of Stock</span>`;
            } else {
                addCartBtn.style.backgroundColor = 'var(--primary-olive-dark, #58674E)';
                addCartBtn.style.cursor = 'pointer';
                addCartBtn.innerHTML = `<i class="fa-solid fa-cart-shopping"></i> <span class="lang-vi">Thêm vào giỏ</span><span class="lang-en">Add to Cart</span>`;
            }
        }

        if (buyNowBtn) {
            buyNowBtn.disabled = isOutOfStock;
            if (isOutOfStock) {
                buyNowBtn.style.backgroundColor = '#aaa';
                buyNowBtn.style.cursor = 'not-allowed';
                buyNowBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span class="lang-vi">Hết hàng</span><span class="lang-en">Out of Stock</span>`;
            } else {
                buyNowBtn.style.backgroundColor = '#f25c3a';
                buyNowBtn.style.cursor = 'pointer';
                buyNowBtn.innerHTML = `<i class="fa-solid fa-bolt"></i> <span class="lang-vi">Mua ngay</span><span class="lang-en">Buy Now</span>`;
            }
        }

        if (window.applyTranslations) window.applyTranslations();

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
                    <div style="background: #f0f4ec; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <div style="color: var(--primary-olive); font-weight: bold; margin-bottom: 5px;"><i class="fa-solid fa-reply"></i> Phản hồi từ Shop:</div>
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
                            <strong style="color:var(--primary-olive);"><i class="fa-solid fa-circle-user"></i> ${r.customerName}</strong>
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

        document.getElementById('productDetailModal').style.display = 'flex';
        document.getElementById('productDetailModal').style.flexDirection = 'column';
        document.body.style.overflow = 'hidden';
    } catch (err) {
        console.error(err);
        if (typeof showToast === 'function') {
            showToast('Có lỗi xảy ra khi tải chi tiết sản phẩm!', 'error');
        } else {
            alert('Có lỗi xảy ra khi tải chi tiết sản phẩm!');
        }
    }
};

window.closeProductDetailModal = function () {
    document.getElementById('productDetailModal').style.display = 'none';
    document.body.style.overflow = '';
};

window.updateQuantity = function (change) {
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
};

// Lightbox functions
window.openLightbox = function () {
    if (currentLightboxImages.length === 0) return;
    const modal = document.getElementById('lightboxModal');
    const img = document.getElementById('lightboxImg');
    img.src = currentLightboxImages[currentLightboxIndex];
    modal.style.display = 'block';
};

window.closeLightbox = function () {
    document.getElementById('lightboxModal').style.display = 'none';
};

window.changeLightboxImage = function (dir) {
    if (currentLightboxImages.length === 0) return;
    currentLightboxIndex += dir;
    if (currentLightboxIndex < 0) currentLightboxIndex = currentLightboxImages.length - 1;
    if (currentLightboxIndex >= currentLightboxImages.length) currentLightboxIndex = 0;

    document.getElementById('lightboxImg').src = currentLightboxImages[currentLightboxIndex];
};

window.addDetailToCart = function () {
    if (typeof window.promptGuestShopping === 'function') {
        window.promptGuestShopping();
    }
};

window.buyNow = function () {
    if (typeof window.promptGuestShopping === 'function') {
        window.promptGuestShopping();
    }
};

window.toggleWishlistDetail = function () {
    if (typeof window.promptGuestShopping === 'function') {
        window.promptGuestShopping();
    }
};

window.submitNewsletterForm = async function (event, form) {
    if (event) event.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    if (!emailInput) return;
    const email = emailInput.value.trim();
    const lang = localStorage.getItem('lang') || 'vi';

    // Validate email format (strict domains like .com, .vn, etc.)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|vn|net|org|edu|gov)(?:\.[a-zA-Z]{2})?$/i;
    if (!emailRegex.test(email)) {
        const emailErrorMsg = lang === 'vi' ? 'Địa chỉ email không đúng định dạng hoặc tên miền không hỗ trợ (ví dụ: gmail.co là không hợp lệ).' : 'Invalid email format or unsupported domain (e.g., gmail.co is invalid).';
        showToast(emailErrorMsg);
        emailInput.focus();
        return;
    }

    // Xác định base URL của API (nếu chạy qua file:// hoặc cổng khác thì hướng về cổng 3000)
    const apiOrigin = (window.location.port === '3000') ? '' : 'http://localhost:3000';
    const apiUrl = `${apiOrigin}/api/newsletter/subscribe`;

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (response.ok) {
            if (lang === 'vi') {
                showToast(data.message || 'Đăng ký nhận tin thành công! Cảm ơn bạn.');
            } else {
                showToast('Newsletter subscribed successfully! Thank you.');
            }
            if (form) form.reset();
        } else {
            showToast(data.message || 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
        }
    } catch (err) {
        console.error('Error in newsletter subscription:', err);
        const errorMsg = lang === 'vi' 
            ? 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' 
            : 'Failed to connect to server. Please try again later.';
        showToast(errorMsg, 'error');
    }
};

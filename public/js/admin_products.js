let isEditing = false;
let currentProductId = null;
let selectedFiles = []; // Mảng chứa các File ảnh mới được chọn
let existingImages = []; // Mảng chứa các đường dẫn ảnh cũ của sản phẩm đang sửa
let currentCategory = 'all'; // Biến lưu trữ danh mục đang xem

// Khi trang load
document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    updateBannerEffect('4 mùa');
    
    // Xử lý submit form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Xử lý tìm kiếm (giữ nguyên danh mục hiện tại)
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            fetchProducts(currentCategory);
        });
    }

    // Đóng modal khi click ra ngoài
    window.onclick = function(event) {
        const modal = document.getElementById('productModal');
        if (event.target === modal) {
            closeProductModal();
        }
    }
});

// Đưa các hàm ra phạm vi global để HTML gọi được
const _origShowSectionProducts = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (_origShowSectionProducts) _origShowSectionProducts(sectionId, overrideMenuId);
    
    if (sectionId === 'product-management') {
        currentCategory = 'all'; // Reset danh mục
        fetchProducts('all'); 
        updateBannerEffect('4 mùa'); // Áp dụng hiệu ứng mặc định
    } else if (sectionId === 'promotion-management') {
        fetchPromotions(); // Tải danh sách khuyến mãi
        updateBannerEffect('4 mùa'); // Áp dụng hiệu ứng mặc định
    } else if (sectionId === 'user-management') {
        fetchUsers(); // Tải danh sách người dùng
        updateBannerEffect('4 mùa');
    } else if (sectionId === 'dashboard-home') {
        updateBannerEffect('4 mùa'); // Áp dụng hiệu ứng mặc định cho Home
    }
};

window.fetchProducts = fetchProducts;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.previewImages = previewImages;
window.removeImage = removeImage;

// 1. Lấy danh sách sản phẩm (Hỗ trợ lọc theo danh mục)
async function fetchProducts(category = 'all') {
    const searchQuery = document.getElementById('productSearch').value;
    try {
        const res = await fetch(`/api/products/all?search=${searchQuery}&category=${category}`);
        const products = await res.json();
        renderProductTable(products);
        
        // Hiện/Ẩn nút thêm sản phẩm dựa trên việc có đang lọc danh mục hay không
        const btnAdd = document.querySelector('.btn-add-product');
        if (btnAdd) {
            btnAdd.style.display = (category === 'all') ? 'flex' : 'none';
        }
    } catch (err) {
        console.error('Error fetching products:', err);
    }
}

// Hàm cập nhật hiệu ứng Banner theo mùa
function updateBannerEffect(category) {
    const container = document.getElementById('banner-effect-container');
    const banner = document.querySelector('.bg-banner');
    const bannerText = document.getElementById('banner-text-dynamic');
    
    container.innerHTML = ''; // Xóa hiệu ứng cũ
    
    let color = 'var(--primary-olive-light)'; // Mặc định (4 mùa)
    let particleClass = '';
    let particleCount = 0;
    let symbols = [];
    let text = 'Home Bedding';

    const cat = category.toLowerCase();
    
    if (cat.includes('xuân')) {
        color = '#b8c9a9'; // Xanh lá nhạt
        particleClass = 'petal';
        particleCount = 20;
        text = 'Mùa Xuân';
    } else if (cat.includes('hạ')) {
        color = 'var(--primary-olive)'; // Xanh rêu đậm
        particleClass = 'sparkle';
        particleCount = 25;
        symbols = ['✨', '☀️'];
        text = 'Mùa Hạ';
    } else if (cat.includes('thu')) {
        color = '#c9b08a'; // Vàng đất
        particleClass = 'leaf';
        particleCount = 15;
        symbols = ['🍂', '🍁'];
        text = 'Mùa Thu';
    } else if (cat.includes('đông')) {
        color = '#9dadb5'; // Xanh xám lạnh
        particleClass = 'snowflake';
        particleCount = 30;
        symbols = ['❄', '❅', '❆'];
        text = 'Mùa Đông';
    } else {
        // 4 Mùa - Trộn lẫn
        color = 'var(--primary-olive-light)';
        text = 'Home Bedding';
        particleCount = 30;
        symbols = ['🌸', '☀️', '🍂', '❄'];
        particleClass = 'mix-season';
    }

    banner.style.backgroundColor = color;
    bannerText.textContent = text;

    // Tạo các hạt hiệu ứng
    if (particleCount > 0) {
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            // Gán class hiệu ứng (nếu là mix thì gán class ngẫu nhiên dựa trên symbol)
            if (particleClass === 'mix-season') {
                const s = symbols[Math.floor(Math.random() * symbols.length)];
                particle.textContent = s;
                if (s === '🌸') particle.className = 'petal';
                else if (s === '☀️') particle.className = 'sparkle';
                else if (s === '🍂') particle.className = 'leaf';
                else if (s === '❄') particle.className = 'snowflake';
            } else {
                particle.className = particleClass;
                if (symbols.length > 0) {
                    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                }
            }
            
            // Ngẫu nhiên vị trí và thời gian
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
            particle.style.animationDelay = Math.random() * 5 + 's';
            particle.style.opacity = Math.random() * 0.5 + 0.5;
            particle.style.fontSize = (Math.random() * 10 + 15) + 'px';
            
            container.appendChild(particle);
        }
    }
}

// Hàm lọc theo danh mục từ Sidebar
function filterByCategory(category) {
    showSection('product-management'); 
    currentCategory = category; // Ghi nhớ danh mục đang lọc
    
    // Highlight category submenu
    document.querySelectorAll('.sub-menu a, .submenu a').forEach(a => a.classList.remove('active-sub'));
    const categoryLink = document.querySelector(`.sub-menu a[onclick*="filterByCategory('${category}')"], .submenu a[onclick*="filterByCategory('${category}')"]`);
    if (categoryLink) {
        categoryLink.classList.add('active-sub');
    }



    fetchProducts(category);
    updateBannerEffect(category); // Cập nhật hiệu ứng banner
}

window.filterByCategory = filterByCategory;

// 2. Render bảng sản phẩm
function renderProductTable(products) {
    const tableBody = document.getElementById('productTableBody');
    tableBody.innerHTML = '';

    products.forEach(product => {
        const tr = document.createElement('tr');
        const firstImg = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/600x600/7f866e/white?text=No+Image';
        tr.innerHTML = `
            <td>
                <img src="${firstImg}" alt="${product.name}" class="product-img-td">
            </td>
            <td><strong>${product.name}</strong></td>
            <td><span class="badge-category">${product.category}</span></td>
            <td>${product.price.toLocaleString()} đ</td>
            <td>${product.quantity}</td>
            <td>
                <div class="td-actions">
                    <button class="btn-edit" onclick="editProduct('${product._id}')" title="Sửa">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="btn-delete" onclick="deleteProduct('${product._id}')" title="Xóa">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// 3. Mở Modal Thêm mới
function openProductModal() {
    isEditing = false;
    currentProductId = null;
    selectedFiles = []; 
    existingImages = []; // Reset mảng ảnh cũ
    document.getElementById('modalTitle').textContent = 'Thêm Sản Phẩm Mới';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreviewContainer').innerHTML = '';
    document.getElementById('productModal').style.display = 'block';
}

// Hàm render lại danh sách ảnh preview (Cả ảnh cũ và ảnh mới)
function renderImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    container.innerHTML = '';

    // 1. Hiển thị ảnh cũ (nếu đang sửa)
    existingImages.forEach((imgUrl, index) => {
        const box = document.createElement('div');
        box.className = 'img-preview-box';
        box.innerHTML = `
            <img src="${imgUrl}">
            <button type="button" class="remove-img" onclick="removeImage(${index}, 'existing')">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;
        container.appendChild(box);
    });

    // 2. Hiển thị ảnh mới chọn
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const box = document.createElement('div');
            box.className = 'img-preview-box';
            box.innerHTML = `
                <img src="${e.target.result}">
                <button type="button" class="remove-img" onclick="removeImage(${index}, 'new')">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            container.appendChild(box);
        };
        reader.readAsDataURL(file);
    });
}

// Xóa ảnh khỏi danh sách (Hỗ trợ cả ảnh cũ và mới)
function removeImage(index, type) {
    if (type === 'existing') {
        existingImages.splice(index, 1);
    } else {
        selectedFiles.splice(index, 1);
    }
    renderImagePreviews();
}

// 5. Preview ảnh khi chọn file mới
function previewImages(event) {
    const files = Array.from(event.target.files);
    
    if (existingImages.length + selectedFiles.length + files.length > 5) {
        showToast('Tổng cộng tối đa chỉ được 5 ảnh!', 'error');
        event.target.value = '';
        return;
    }

    files.forEach(file => {
        selectedFiles.push(file);
    });

    renderImagePreviews();
    event.target.value = '';
}

// 6. Xử lý Thêm/Sửa sản phẩm
async function handleProductSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('pName').value;
    const category = document.getElementById('pCategory').value;
    const price = parseFloat(document.getElementById('pPrice').value);
    const quantity = parseInt(document.getElementById('pQuantity').value);
    const description = document.getElementById('pDescription').value;

    if (!name || !category || isNaN(price) || isNaN(quantity)) {
        showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
        return;
    }

    if (price < 0 || quantity < 0) {
        showToast('Giá và số lượng không được nhỏ hơn 0!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('description', description);

    // Gửi danh sách các ảnh cũ vẫn còn giữ lại
    existingImages.forEach(img => {
        formData.append('existingImages', img);
    });

    // Gửi mảng File ảnh mới
    selectedFiles.forEach(file => {
        formData.append('images', file);
    });

    try {
        let url = '/api/products/add';
        let method = 'POST';

        if (isEditing) {
            url = `/api/products/update/${currentProductId}`;
            method = 'PUT';
        }

        const res = await fetch(url, {
            method: method,
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.message);
            closeProductModal();
            fetchProducts();
        } else {
            showToast(data.message || 'Có lỗi xảy ra', 'error');
        }
    } catch (err) {
        console.error('Error:', err);
        showToast('Lỗi kết nối server', 'error');
    }
}

// 7. Xử lý Sửa (Load dữ liệu lên modal)
async function editProduct(id) {
    try {
        const res = await fetch(`/api/products/all`);
        const products = await res.json();
        const product = products.find(p => p._id === id);

        if (product) {
            isEditing = true;
            currentProductId = id;
            selectedFiles = []; // Reset file mới
            existingImages = [...product.images]; // Copy ảnh cũ từ DB

            document.getElementById('modalTitle').textContent = 'Cập Nhật Sản Phẩm';
            document.getElementById('pName').value = product.name;
            document.getElementById('pCategory').value = product.category;
            document.getElementById('pPrice').value = product.price;
            document.getElementById('pQuantity').value = product.quantity;
            document.getElementById('pDescription').value = product.description;

            renderImagePreviews();
            document.getElementById('productModal').style.display = 'block';
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

// 8. Xóa sản phẩm (Sử dụng Modal xác nhận tùy chỉnh)
function deleteProduct(id) {
    const modal = document.getElementById('confirmModal');
    const btnConfirm = document.getElementById('btnConfirmDelete');
    
    modal.style.display = 'block';

    // Xử lý khi bấm nút xác nhận xóa
    btnConfirm.onclick = async () => {
        try {
            const res = await fetch(`/api/products/delete/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast('Xóa sản phẩm thành công!');
                closeConfirmModal();
                fetchProducts(currentCategory);
            } else {
                const data = await res.json();
                showToast(data.message || 'Lỗi khi xóa', 'error');
            }
        } catch (err) {
            showToast('Lỗi kết nối server', 'error');
        }
    };
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
}

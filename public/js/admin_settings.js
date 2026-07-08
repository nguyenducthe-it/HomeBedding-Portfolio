// --- Admin Settings JS ---

document.addEventListener('DOMContentLoaded', () => {
    // Load last backup time
    loadLastBackupTime();
    // Load banner image previews
    loadBannerPreviews();
});

async function loadLastBackupTime() {
    try {
        const res = await fetch('/api/settings/lastBackupAt');
        const data = await res.json();
        if (data && data.value) {
            const date = new Date(data.value);
            document.getElementById('lastBackupTime').textContent = date.toLocaleString('vi-VN');
        }
    } catch (err) {
        console.error('Lỗi tải thời gian backup:', err);
    }
}

async function applyTheme(color) {
    try {
        // Cập nhật giao diện tạm thời
        if (typeof applyThemeVars === 'function') {
            applyThemeVars(color);
        }
        localStorage.setItem('themeColor', color);

        // Lưu vào server
        const res = await fetch('/api/settings/themeColor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: color })
        });
        
        if (res.ok) {
            await customAlert('Đã áp dụng màu nền mới thành công!', 'success');
        } else {
            await customAlert('Có lỗi khi lưu màu nền vào máy chủ!', 'error');
        }
    } catch (err) {
        console.error('Lỗi lưu theme:', err);
        await customAlert('Có lỗi xảy ra, vui lòng thử lại.', 'error');
    }
}

function downloadBackup() {
    window.location.href = '/api/settings/data/backup';
    // Đợi 2s rồi reload thời gian
    setTimeout(loadLastBackupTime, 2000);
}

async function uploadRestore() {
    const fileInput = document.getElementById('restoreFileInput');
    if (!fileInput.files || fileInput.files.length === 0) {
        return await customAlert('Vui lòng chọn file JSON để khôi phục.', 'warning');
    }

    const confirmed = await customConfirm('CẢNH BÁO NGUY HIỂM: Hành động này sẽ XÓA SẠCH toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu trong file. Trang web có thể bị gián đoạn.\n\nBạn có chắc chắn muốn tiếp tục?');
    if (!confirmed) {
        return;
    }

    const formData = new FormData();
    formData.append('backupFile', fileInput.files[0]);

    try {
        const res = await fetch('/api/settings/data/restore', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            await customAlert('Khôi phục dữ liệu thành công! Hệ thống sẽ tải lại.', 'success');
            window.location.reload();
        } else {
            await customAlert('Lỗi: ' + data.message, 'error');
        }
    } catch (err) {
        console.error('Lỗi khôi phục:', err);
        await customAlert('Lỗi hệ thống khi khôi phục dữ liệu.', 'error');
    }
}

// --- Dynamic Theme Banners ---
function previewBannerInput(input, previewId) {
    const preview = document.getElementById(previewId);
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.style.backgroundImage = `url('${e.target.result}')`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function loadBannerPreviews() {
    const selectedColor = document.getElementById('bannerThemeSelect').value;
    
    // Clear inputs and previews first
    for (let i = 1; i <= 5; i++) {
        document.getElementById(`input-banner${i}`).value = '';
        const preview = document.getElementById(`preview-banner${i}`);
        preview.style.backgroundImage = 'none';
    }

    try {
        const res = await fetch('/api/settings/banner_images');
        const data = await res.json();
        
        const bannerMap = data.value || {};
        const bannerList = bannerMap[selectedColor] || [];
        
        // Default images mapping to match landing page fallback
        const defaultImages = {
            '#FDF9F1': [
                '../images/cream1.jpg',
                '../images/cream2.jpg',
                '../images/cream3.jpg',
                '../images/cream1.jpg',
                '../images/cream5.jpg'
            ],
            '#FDF5F6': [
                '../images/pink1.jpg',
                '../images/pink2.jpg',
                '../images/pink3.jpg',
                '../images/pink1.jpg',
                '../images/pink5.jpg'
            ],
            '#F0F4F8': [
                '../images/blue1.jpg',
                '../images/blue2.jpg',
                '../images/blue3.jpg',
                '../images/blue1.jpg',
                '../images/blue5.jpg'
            ],
            'default': [
                '../images/Mau (1).jpg',
                '../images/Mau (2).jpg',
                '../images/Mau (3).jpg',
                '../images/Mau (1).jpg',
                '../images/Mau5.jpg'
            ]
        };

        const defaults = defaultImages[selectedColor] || defaultImages['default'];

        for (let i = 1; i <= 5; i++) {
            const idx = i - 1;
            const preview = document.getElementById(`preview-banner${i}`);
            
            if (bannerList[idx]) {
                preview.style.backgroundImage = `url('${bannerList[idx]}')`;
            } else {
                preview.style.backgroundImage = `url('${defaults[idx]}')`;
            }
        }
    } catch (err) {
        console.error('Lỗi tải ảnh banner:', err);
    }
}

async function uploadBannerImages(event) {
    event.preventDefault();
    const selectedColor = document.getElementById('bannerThemeSelect').value;
    
    const formData = new FormData();
    formData.append('themeColor', selectedColor);

    let hasFile = false;
    for (let i = 1; i <= 5; i++) {
        const fileInput = document.getElementById(`input-banner${i}`);
        if (fileInput.files && fileInput.files[0]) {
            formData.append(`banner${i}`, fileInput.files[0]);
            hasFile = true;
        }
    }

    if (!hasFile) {
        return await customAlert('Vui lòng chọn ít nhất một file ảnh để tải lên!', 'warning');
    }

    try {
        const res = await fetch('/api/settings/upload-banners', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            await customAlert('Tải lên bộ ảnh banner thành công!', 'success');
            
            // Update localStorage to apply changes instantly
            const bannerRes = await fetch('/api/settings/banner_images');
            const bannerData = await bannerRes.json();
            if (bannerData && bannerData.value) {
                localStorage.setItem('bannerImages', JSON.stringify(bannerData.value));
            }
            
            // Reload previews
            loadBannerPreviews();
            
            // Apply immediately if active
            const currentTheme = localStorage.getItem('themeColor') || '#F5F6F8';
            if (typeof applyThemeVars === 'function') {
                applyThemeVars(currentTheme);
            }
        } else {
            await customAlert('Lỗi: ' + data.message, 'error');
        }
    } catch (err) {
        console.error('Lỗi upload banner:', err);
        await customAlert('Có lỗi xảy ra khi tải ảnh lên.', 'error');
    }
}

// ===== QUẢN LÝ DOANH THU THỰC TẾ =====

// Hàm toggle các trường nhập bộ lọc
function toggleRevenueFilters() {
    const filterType = document.getElementById('revenueFilterType').value;
    const monthPicker = document.getElementById('revenueMonthPicker');
    const dateRangeWrapper = document.getElementById('revenueDatePickerWrapper');
    const quarterWrapper = document.getElementById('revenueQuarterPickerWrapper');
    const yearWrapper = document.getElementById('revenueYearPickerWrapper');

    // Ẩn tất cả
    monthPicker.style.display = 'none';
    dateRangeWrapper.style.display = 'none';
    quarterWrapper.style.display = 'none';
    if (yearWrapper) yearWrapper.style.display = 'none';

    // Hiện loại tương ứng
    if (filterType === 'month') {
        monthPicker.style.display = 'block';
    } else if (filterType === 'date') {
        dateRangeWrapper.style.display = 'flex';
        // Thiết lập ngày mặc định nếu trống
        const startInput = document.getElementById('revenueStartDatePicker');
        const endInput = document.getElementById('revenueEndDatePicker');
        if (!startInput.value || !endInput.value) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            startInput.value = `${y}-${m}-01`;
            
            const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
            endInput.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        }
    } else if (filterType === 'quarter') {
        quarterWrapper.style.display = 'flex';
    } else if (filterType === 'year') {
        if (yearWrapper) yearWrapper.style.display = 'flex';
    }

    fetchRevenue();
}

window.toggleRevenueFilters = toggleRevenueFilters;

async function fetchRevenue() {
    const filterTypeSelect = document.getElementById('revenueFilterType');
    if (!filterTypeSelect) return;

    const filterType = filterTypeSelect.value;
    let url = `/api/orders/revenue-report?filterType=${filterType}`;

    if (filterType === 'month') {
        const picker = document.getElementById('revenueMonthPicker');
        if (!picker.value) {
            const now = new Date();
            picker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        url += `&month=${picker.value}`;
    } else if (filterType === 'date') {
        const startInput = document.getElementById('revenueStartDatePicker');
        const endInput = document.getElementById('revenueEndDatePicker');
        url += `&startDate=${startInput.value}&endDate=${endInput.value}`;
    } else if (filterType === 'quarter') {
        const yearSelect = document.getElementById('revenueQuarterYear');
        const quarterSelect = document.getElementById('revenueQuarterVal');
        url += `&quarterYear=${yearSelect.value}&quarterVal=${quarterSelect.value}`;
    } else if (filterType === 'year') {
        const yearSelect = document.getElementById('revenueYearVal');
        url += `&year=${yearSelect.value}`;
    }

    // Trạng thái chờ
    document.getElementById('rv-total').textContent = '...';
    document.getElementById('rv-salary').textContent = '...';
    document.getElementById('rv-net').textContent = '...';
    document.getElementById('rvSalaryBody').innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Đang tải dữ liệu...</td></tr>';
    document.getElementById('rvDailyChart').innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-bottom:100px;">Đang tính toán biểu đồ...</div>';

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        renderRevenueStats(data);
    } catch (err) {
        console.error('Lỗi tải doanh thu:', err);
        showToast('Không thể tải báo cáo doanh thu!', 'error');
    }
}

function renderRevenueStats(data) {
    const { revenue, salary, actualRevenue, dailyRevenue, dailyTrends } = data;

    // 1. Cập nhật các card tổng quan
    document.getElementById('rv-total').textContent = revenue.total.toLocaleString('vi-VN') + ' đ';
    document.getElementById('rv-salary').textContent = '-' + salary.total.toLocaleString('vi-VN') + ' đ';
    
    const netEl = document.getElementById('rv-net');
    const netCard = document.getElementById('rv-net-card');
    netEl.textContent = actualRevenue.toLocaleString('vi-VN') + ' đ';

    // Đổi màu card dựa trên lãi/lỗ
    if (actualRevenue < 0) {
        netEl.style.color = '#d9534f';
        netCard.style.borderColor = '#d9534f';
    } else {
        netEl.style.color = 'var(--primary-olive)';
        netCard.style.borderColor = 'var(--primary-olive)';
    }

    // 2. Render bảng chi tiết lương
    const salaryBody = document.getElementById('rvSalaryBody');
    if (salary.detail.length === 0) {
        salaryBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999;">Không có dữ liệu lương nhân viên</td></tr>';
    } else {
        salaryBody.innerHTML = salary.detail.map(s => `
            <tr>
                <td><span style="font-weight:700; color:var(--primary-olive);">${s.staffId}</span></td>
                <td>${s.fullName}</td>
                <td style="text-align:center;">${s.workedShifts}</td>
                <td style="text-align:right; font-weight:700;">${s.totalSalary.toLocaleString('vi-VN')} đ</td>
            </tr>
        `).join('');
    }

    // 3. Render biểu đồ cột đơn giản (Daily Revenue)
    renderDailyChart(dailyRevenue);

    // 4. Render biểu đồ đường xu hướng Tài chính (Revenue vs Salary)
    renderLineChart(dailyTrends);
}

function renderDailyChart(dailyData) {
    const chartContainer = document.getElementById('rvDailyChart');
    if (dailyData.length === 0) {
        chartContainer.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-bottom:100px;">Chưa có doanh thu ngày nào trong kỳ</div>';
        return;
    }

    const maxRevenue = Math.max(...dailyData.map(d => d.revenue));
    
    chartContainer.innerHTML = dailyData.map(d => {
        const height = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
        
        // Đổi nhãn hiển thị nếu là lọc theo năm (YYYY-MM) thay vì YYYY-MM-DD
        const parts = d._id.split('-');
        const label = parts[2] ? parts[2] : `T${parseInt(parts[1])}`;
        
        return `
            <div class="chart-bar-wrapper" style="flex:1; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:5px;">
                <div class="chart-bar-value" style="font-size:9px; color:#aaa; writing-mode: vertical-rl; transform: rotate(180deg);">${(d.revenue / 1000).toFixed(0)}k</div>
                <div class="chart-bar" title="${d._id}: ${d.revenue.toLocaleString('vi-VN')} đ" 
                     style="width: 100%; max-width: 20px; height: ${height}%; background: linear-gradient(to top, #17a2b8, #5bc0de); border-radius: 3px 3px 0 0; transition: height 0.5s ease;">
                </div>
                <div class="chart-bar-label" style="font-size:10px; color:#666;">${label}</div>
            </div>
        `;
    }).join('');
}

function renderLineChart(dailyTrends) {
    const container = document.getElementById('rvLineChartContainer');
    if (!container) return;

    if (!dailyTrends || dailyTrends.length === 0) {
        container.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-bottom:50px;">Không có dữ liệu xu hướng trong kỳ</div>';
        return;
    }

    const totalDays = dailyTrends.length;
    const maxVal = Math.max(...dailyTrends.map(d => Math.max(d.revenue, d.salary)), 100000);

    const svgWidth = 1000;
    const svgHeight = 300;
    const paddingLeft = 70;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;

    // 1. Vẽ các đường lưới phụ trợ ngang và dán nhãn trục Y
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

    // 2. Tính toán tọa độ x, y cho doanh thu và lương
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

    // 3. Tạo nhãn các ngày ở trục X (giảm số nhãn hiển thị nếu có quá nhiều ngày, như trường hợp Lọc theo Quý)
    let xAxisHtml = '';
    const labelInterval = Math.max(1, Math.ceil(totalDays / 12)); // Đảm bảo tối đa khoảng 12 nhãn trục X
    dailyTrends.forEach((d, index) => {
        if (d.day === 1 || (d.day - 1) % labelInterval === 0 || d.day === totalDays) {
            const x = paddingLeft + (index / (totalDays - 1)) * chartWidth;
            xAxisHtml += `
                <line x1="${x}" y1="${svgHeight - paddingBottom}" x2="${x}" y2="${svgHeight - paddingBottom + 5}" stroke="#ddd" />
                <text x="${x}" y="${svgHeight - paddingBottom + 20}" font-size="11" font-weight="600" fill="#777" text-anchor="middle">${d.label || d.day}</text>
            `;
        }
    });

    // 4. Các điểm dữ liệu tròn nhỏ
    let dotsHtml = '';
    revenuePoints.forEach((p, index) => {
        const salP = salaryPoints[index];
        dotsHtml += `
            <circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#3498db" stroke="white" stroke-width="1" />
            <circle cx="${salP.x}" cy="${salP.y}" r="3.5" fill="#e74c3c" stroke="white" stroke-width="1" />
        `;
    });

    // Xuất chuỗi SVG hoàn chỉnh với các thành phần hover tracker
    container.innerHTML = `
        <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" style="overflow: visible; cursor: crosshair;">
            <!-- Đường lưới nền -->
            ${gridHtml}
            
            <!-- Trục ngang X -->
            <line x1="${paddingLeft}" y1="${svgHeight - paddingBottom}" x2="${svgWidth - paddingRight}" y2="${svgHeight - paddingBottom}" stroke="#ddd" stroke-width="1.5" />
            ${xAxisHtml}

            <!-- Bóng mờ Doanh thu (Màu xanh dương) -->
            <polygon points="${revenueAreaStr}" fill="rgba(52, 152, 219, 0.07)" />
            
            <!-- Bóng mờ Chi phí Lương (Màu đỏ) -->
            <polygon points="${salaryAreaStr}" fill="rgba(231, 76, 60, 0.04)" />

            <!-- Đường kẻ Doanh thu từ Đơn hàng (Xanh dương) -->
            <polyline points="${revenuePointsStr}" fill="none" stroke="#3498db" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- Đường kẻ Chi phí Lương nhân viên (Đỏ) -->
            <polyline points="${salaryPointsStr}" fill="none" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            
            <!-- Các chấm dữ liệu tròn -->
            ${dotsHtml}

            <!-- CÁC THÀNH PHẦN HOVER TRACKER ĐỘNG -->
            <!-- Bóng dọc (Translucent Column) -->
            <rect id="svgHoverBand" y="${paddingTop}" width="${Math.max(10, chartWidth / (totalDays - 1 || 1))}" height="${chartHeight}" fill="rgba(52, 152, 219, 0.05)" style="display: none; pointer-events: none;" />
            <!-- Đường dọc nét đứt -->
            <line id="svgHoverLine" x1="0" y1="${paddingTop}" x2="0" y2="${svgHeight - paddingBottom}" stroke="#7f8c8d" stroke-width="1.5" stroke-dasharray="3,3" style="display: none; pointer-events: none;" />
            <!-- Chấm tròn doanh thu nổi bật -->
            <circle id="svgHoverCircleRev" r="6" fill="#3498db" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
            <!-- Chấm tròn lương nổi bật -->
            <circle id="svgHoverCircleSal" r="6" fill="#e74c3c" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
        </svg>
    `;

    // 5. Cấu hình tính năng Hover & Click tương tác
    const svg = container.querySelector('svg');
    
    let tooltip = document.getElementById('rvLineChartTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'rvLineChartTooltip';
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
        tooltip.style.zIndex = '1000';
        tooltip.style.minWidth = '180px';
        tooltip.style.transition = 'opacity 0.1s ease, transform 0.1s ease';
        container.appendChild(tooltip);
    }

    let lockedIdx = -1;

    function drawTracker(idx, clientX, clientY) {
        const hoverBand = svg.getElementById('svgHoverBand');
        const hoverLine = svg.getElementById('svgHoverLine');
        const hoverCircleRev = svg.getElementById('svgHoverCircleRev');
        const hoverCircleSal = svg.getElementById('svgHoverCircleSal');

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

        // 0. Update vertical band
        if (hoverBand) {
            const bandWidth = Math.max(10, chartWidth / (totalDays - 1 || 1));
            hoverBand.setAttribute('x', p.x - bandWidth / 2);
            hoverBand.setAttribute('width', bandWidth);
            hoverBand.style.display = 'block';
        }

        // 1. Hiển thị đường dọc
        if (hoverLine) {
            hoverLine.setAttribute('x1', p.x);
            hoverLine.setAttribute('x2', p.x);
            hoverLine.style.display = 'block';
        }

        // 2. Hiển thị 2 chấm tròn
        if (hoverCircleRev && hoverCircleSal) {
            hoverCircleRev.setAttribute('cx', p.x);
            hoverCircleRev.setAttribute('cy', p.y);
            hoverCircleRev.style.display = 'block';

            hoverCircleSal.setAttribute('cx', salP.x);
            hoverCircleSal.setAttribute('cy', salP.y);
            hoverCircleSal.style.display = 'block';
        }

        // 3. Cập nhật Tooltip
        const profit = trend.revenue - trend.salary;
        const profitSign = profit >= 0 ? '+' : '';
        const profitColor = profit >= 0 ? '#2ecc71' : '#e74c3c';
        
        tooltip.innerHTML = `
            <div style="font-weight: 700; color: #555; margin-bottom: 6px; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span>Kỳ: ${trend.date.split('-').reverse().join('/')}</span>
                ${lockedIdx === idx ? '<span style="font-size: 9px; font-weight: 700; color: var(--primary-olive); background: rgba(122, 133, 103, 0.15); padding: 1px 5px; border-radius: 4px;">Đã ghim</span>' : ''}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 3px;">
                <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#3498db; border-radius:50%; margin-right:5px;"></span>Doanh thu:</span>
                <strong style="color: #3498db;">${trend.revenue.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 6px;">
                <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#e74c3c; border-radius:50%; margin-right:5px;"></span>Lương NV:</span>
                <strong style="color: #e74c3c;">${trend.salary.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; border-top: 1px dashed #eee; padding-top: 4px; font-weight: 700;">
                <span style="color: #333;">Lợi nhuận ròng:</span>
                <span style="color: ${profitColor};">${profitSign}${profit.toLocaleString('vi-VN')} đ</span>
            </div>
        `;

        // Tính vị trí tương đối cho tooltip
        const rect = svg.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let leftPos, topPos;
        if (clientX !== undefined && clientY !== undefined) {
            leftPos = clientX - rect.left + 15;
            topPos = clientY - rect.top - tooltipRect.height / 2;
        } else {
            // Định vị chính xác theo điểm dữ liệu trên SVG khi bị ghim
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
            // Tạm thời hiển thị tooltip ở vị trí con trỏ khi di qua điểm dữ liệu
            drawTracker(closestIdx, e.clientX, e.clientY);
        } else if (lockedIdx !== -1) {
            // Rời xa điểm bất kỳ nhưng đang có điểm ghim => giữ ghim
            drawTracker(lockedIdx);
        } else {
            // Không ghim và không hover sát điểm nào => ẩn
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
                // Click lại điểm đang ghim => Bỏ ghim
                lockedIdx = -1;
                drawTracker(closestIdx, e.clientX, e.clientY);
            } else {
                // Ghim điểm mới
                lockedIdx = closestIdx;
                drawTracker(closestIdx);
            }
        } else {
            // Click ra khoảng trống ngoài đồ thị => Bỏ ghim hoàn toàn
            lockedIdx = -1;
            drawTracker(-1);
        }
    });

    svg.addEventListener('mouseleave', () => {
        if (lockedIdx !== -1) {
            // Giữ hiển thị ghim khi rời chuột
            drawTracker(lockedIdx);
        } else {
            drawTracker(-1);
        }
    });
}

// Hook vào hàm showSection để tự động load khi mở tab Doanh thu
const _origShowSectionRev = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (_origShowSectionRev) _origShowSectionRev(sectionId, overrideMenuId);
    if (sectionId === 'revenue-management') {
        // Thiết lập giao diện bộ lọc mặc định khi mở
        const filterTypeSelect = document.getElementById('revenueFilterType');
        if (filterTypeSelect) {
            filterTypeSelect.value = 'month';
            toggleRevenueFilters();
        }
    }
};

// ===== BỘ LỌC TÀI CHÍNH TRÊN TRANG CHỦ / THỐNG KÊ =====
function toggleHomeFilters() {
    const filterTypeSelect = document.getElementById('homeFilterType');
    if (!filterTypeSelect) return;

    const filterType = filterTypeSelect.value;
    const monthPicker = document.getElementById('homeMonthPicker');
    const dateRangeWrapper = document.getElementById('homeDatePickerWrapper');
    const quarterWrapper = document.getElementById('homeQuarterPickerWrapper');
    const yearWrapper = document.getElementById('homeYearPickerWrapper');

    // Ẩn tất cả
    monthPicker.style.display = 'none';
    dateRangeWrapper.style.display = 'none';
    quarterWrapper.style.display = 'none';
    if (yearWrapper) yearWrapper.style.display = 'none';

    // Hiện loại tương ứng
    if (filterType === 'month') {
        monthPicker.style.display = 'block';
    } else if (filterType === 'date') {
        dateRangeWrapper.style.display = 'flex';
        const startInput = document.getElementById('homeStartDatePicker');
        const endInput = document.getElementById('homeEndDatePicker');
        if (!startInput.value || !endInput.value) {
            const now = new Date();
            const y = now.getFullYear();
            const m = String(now.getMonth() + 1).padStart(2, '0');
            startInput.value = `${y}-${m}-01`;
            
            const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
            endInput.value = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
        }
    } else if (filterType === 'quarter') {
        quarterWrapper.style.display = 'flex';
    } else if (filterType === 'year') {
        if (yearWrapper) yearWrapper.style.display = 'flex';
    }

    fetchHomeRevenue();
}

window.toggleHomeFilters = toggleHomeFilters;

async function fetchHomeRevenue() {
    const filterTypeSelect = document.getElementById('homeFilterType');
    if (!filterTypeSelect) return;

    const filterType = filterTypeSelect.value;
    let url = `/api/orders/revenue-report?filterType=${filterType}`;

    if (filterType === 'month') {
        const picker = document.getElementById('homeMonthPicker');
        if (!picker.value) {
            const now = new Date();
            picker.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }
        url += `&month=${picker.value}`;
    } else if (filterType === 'date') {
        const startInput = document.getElementById('homeStartDatePicker');
        const endInput = document.getElementById('homeEndDatePicker');
        url += `&startDate=${startInput.value}&endDate=${endInput.value}`;
    } else if (filterType === 'quarter') {
        const yearSelect = document.getElementById('homeQuarterYear');
        const quarterSelect = document.getElementById('homeQuarterVal');
        url += `&quarterYear=${yearSelect.value}&quarterVal=${quarterSelect.value}`;
    } else if (filterType === 'year') {
        const yearSelect = document.getElementById('homeYearVal');
        url += `&year=${yearSelect.value}`;
    }

    const container = document.getElementById('homeLineChartContainer');
    if (container) {
        container.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-bottom:50px;">Đang tính toán xu hướng tài chính...</div>';
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        renderHomeLineChart(data.dailyTrends);
    } catch (err) {
        console.error('Lỗi tải doanh thu Trang chủ:', err);
    }
}

window.fetchHomeRevenue = fetchHomeRevenue;

function renderHomeLineChart(dailyTrends) {
    const container = document.getElementById('homeLineChartContainer');
    if (!container) return;

    if (!dailyTrends || dailyTrends.length === 0) {
        container.innerHTML = '<div style="width:100%; text-align:center; color:#999; padding-bottom:50px;">Không có dữ liệu xu hướng trong kỳ</div>';
        return;
    }

    const totalDays = dailyTrends.length;
    const maxVal = Math.max(...dailyTrends.map(d => Math.max(d.revenue, d.salary)), 100000);

    const svgWidth = 1000;
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
            <rect id="svgHomeHoverBand" y="${paddingTop}" width="${Math.max(10, chartWidth / (totalDays - 1 || 1))}" height="${chartHeight}" fill="rgba(52, 152, 219, 0.05)" style="display: none; pointer-events: none;" />
            <line id="svgHomeHoverLine" x1="0" y1="${paddingTop}" x2="0" y2="${svgHeight - paddingBottom}" stroke="#7f8c8d" stroke-width="1.5" stroke-dasharray="3,3" style="display: none; pointer-events: none;" />
            <circle id="svgHomeHoverCircleRev" r="6" fill="#3498db" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
            <circle id="svgHomeHoverCircleSal" r="6" fill="#e74c3c" stroke="white" stroke-width="2" style="display: none; pointer-events: none;" />
        </svg>
    `;

    const svg = container.querySelector('svg');
    let tooltip = document.getElementById('homeLineChartTooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'homeLineChartTooltip';
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
        tooltip.style.zIndex = '1000';
        tooltip.style.minWidth = '180px';
        tooltip.style.transition = 'opacity 0.1s ease, transform 0.1s ease';
        container.appendChild(tooltip);
    }

    let lockedIdx = -1;

    function drawTracker(idx, clientX, clientY) {
        const hoverBand = svg.getElementById('svgHomeHoverBand');
        const hoverLine = svg.getElementById('svgHomeHoverLine');
        const hoverCircleRev = svg.getElementById('svgHomeHoverCircleRev');
        const hoverCircleSal = svg.getElementById('svgHomeHoverCircleSal');

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
                <span>Kỳ: ${trend.date.split('-').reverse().join('/')}</span>
                ${lockedIdx === idx ? '<span style="font-size: 9px; font-weight: 700; color: var(--primary-olive); background: rgba(122, 133, 103, 0.15); padding: 1px 5px; border-radius: 4px;">Đã ghim</span>' : ''}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 3px;">
                <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#3498db; border-radius:50%; margin-right:5px;"></span>Doanh thu:</span>
                <strong style="color: #3498db;">${trend.revenue.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 6px;">
                <span style="color: #666;"><span style="display:inline-block; width:8px; height:8px; background:#e74c3c; border-radius:50%; margin-right:5px;"></span>Lương NV:</span>
                <strong style="color: #e74c3c;">${trend.salary.toLocaleString('vi-VN')} đ</strong>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 15px; border-top: 1px dashed #eee; padding-top: 4px; font-weight: 700;">
                <span style="color: #333;">Lợi nhuận ròng:</span>
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
window.renderHomeLineChart = renderHomeLineChart;


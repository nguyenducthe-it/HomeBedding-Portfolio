// === QUẢN LÝ LỊCH TUẦN & CHẤM CÔNG ===

let currentStartDate = new Date(); // Sẽ điều chỉnh để luôn là Thứ 2 của tuần hiện tại
let weekDates = [];
let todayWeekStart = new Date(); // Mốc Thứ 2 của tuần hiện tại

document.addEventListener('DOMContentLoaded', () => {
    initWeek();

    // Lắng nghe form cập nhật lương
    const salaryForm = document.getElementById('salaryForm');
    if (salaryForm) {
        salaryForm.addEventListener('submit', handleUpdateSalary);
    }
});

// Khởi tạo ngày đầu tuần (Thứ 2)
function initWeek() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh nếu hôm nay là CN
    currentStartDate = new Date(today.setDate(diff));
    currentStartDate.setHours(0,0,0,0);

    // Lưu lại mốc của tuần hiện tại
    todayWeekStart = new Date(currentStartDate);

    updateWeekUI();
    fetchWeeklySchedule();
}

function changeWeek(offset) {
    const newStartDate = new Date(currentStartDate);
    newStartDate.setDate(newStartDate.getDate() + (offset * 7));

    // Tính mốc "Tuần sau" (Giới hạn tối đa)
    const nextWeekStart = new Date(todayWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    // Nếu cố tình vượt quá tuần sau thì chặn lại
    if (newStartDate > nextWeekStart) {
        showToast('Chỉ được xếp lịch tối đa 1 tuần tiếp theo!', 'warning');
        return;
    }

    currentStartDate = newStartDate;
    updateWeekUI();
    fetchWeeklySchedule();
}

function updateWeekUI() {
    weekDates = [];
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    let endDate = new Date(currentStartDate);
    endDate.setDate(endDate.getDate() + 6);

    document.getElementById('currentWeekLabel').innerText = 
        `${formatDateStr(currentStartDate)} - ${formatDateStr(endDate)}`;

    for (let i = 0; i < 7; i++) {
        let d = new Date(currentStartDate);
        d.setDate(d.getDate() + i);
        
        const y = d.getFullYear();
        const m = (d.getMonth() + 1).toString().padStart(2, '0');
        const dayStr = d.getDate().toString().padStart(2, '0');
        weekDates.push(`${y}-${m}-${dayStr}`);
        
        document.getElementById(`date-${days[i]}`).innerText = `${d.getDate()}/${d.getMonth() + 1}`;
    }

    // Vô hiệu hóa nút Tới nếu đã đạt giới hạn (Tuần sau)
    const btnNext = document.querySelectorAll('.week-picker-controls button')[1];
    const nextWeekStart = new Date(todayWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);

    if (btnNext) {
        if (currentStartDate >= nextWeekStart) {
            btnNext.style.opacity = '0.3';
            btnNext.style.cursor = 'not-allowed';
            btnNext.disabled = true;
        } else {
            btnNext.style.opacity = '1';
            btnNext.style.cursor = 'pointer';
            btnNext.disabled = false;
        }
    }
}

function formatDateStr(dateObj) {
    const d = dateObj.getDate().toString().padStart(2, '0');
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
}

// Fetch Dữ liệu
async function fetchWeeklySchedule() {
    const startDate = weekDates[0];
    const endDate = weekDates[6];

    try {
        const response = await fetch(`/api/attendance/week?startDate=${startDate}&endDate=${endDate}`);
        const data = await response.json();
        const staffs = data.staffs || [];
        const isLocked = data.isLocked || false;

        // Cập nhật giao diện nút chốt lịch
        const btnLock = document.getElementById('btnLockSchedule');
        if (btnLock) {
            if (isLocked) {
                btnLock.innerHTML = '<i class="fa-solid fa-unlock"></i> Mở Chốt Lịch';
                btnLock.style.backgroundColor = '#d9534f';
                btnLock.style.cursor = 'pointer';
                btnLock.disabled = false;
                btnLock.onclick = unlockSchedule;
            } else {
                btnLock.innerHTML = '<i class="fa-solid fa-lock-open"></i> Chốt Lịch Tự Động';
                btnLock.style.backgroundColor = 'var(--primary-olive)';
                btnLock.style.cursor = 'pointer';
                btnLock.disabled = false;
                btnLock.onclick = lockSchedule;
            }
        }

        renderScheduleTable(staffs);
    } catch (err) {
        console.error('Lỗi lấy lịch tuần:', err);
    }
}

function renderScheduleTable(staffs) {
    const tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (staffs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Không có nhân viên nào.</td></tr>';
        return;
    }

    // Lấy danh sách các ca đã được gán cho bất kỳ nhân viên nào trong tuần
    const takenShifts = {};
    weekDates.forEach(date => {
        takenShifts[date] = [];
        staffs.forEach(staff => {
            if (staff.schedule && staff.schedule[date] && staff.schedule[date].shifts) {
                takenShifts[date].push(...staff.schedule[date].shifts);
            }
            if (staff.pendingShifts && staff.pendingShifts[date]) {
                takenShifts[date].push(...staff.pendingShifts[date]);
            }
        });
    });

    staffs.forEach(staff => {
        const tr = document.createElement('tr');
        
        let html = `
            <td>
                <strong>${staff.fullName}</strong><br>
                <small style="color: #888;">${staff.staffId || 'N/A'}</small>
            </td>
        `;

        // Render 7 ngày
        weekDates.forEach(date => {
            const dayData = staff.schedule && staff.schedule[date] ? staff.schedule[date] : { shifts: [], status: {} };
            
            html += `<td style="vertical-align: top; text-align: left; padding: 10px;">`;
            
            const shiftDefs = [
                { id: 'morning', label: 'Sáng (7h-11h45)' },
                { id: 'afternoon', label: 'Chiều (12h-16h45)' },
                { id: 'evening', label: 'Tối (17h-23h45)' }
            ];

            shiftDefs.forEach(shiftDef => {
                const isScheduled = dayData.shifts && dayData.shifts.includes(shiftDef.id);
                const isPending = staff.pendingShifts && staff.pendingShifts[date] && staff.pendingShifts[date].includes(shiftDef.id);
                const isTakenByOther = !isScheduled && takenShifts[date].includes(shiftDef.id);
                
                const todayObj = new Date();
                todayObj.setHours(0,0,0,0);
                const shiftDateParts = date.split('-');
                const shiftDateObj = new Date(shiftDateParts[0], shiftDateParts[1] - 1, shiftDateParts[2]);
                shiftDateObj.setHours(0,0,0,0);
                
                // Logic tính thời gian thực giống Staff
                const now = new Date();
                const currentTotalHours = now.getHours() + now.getMinutes() / 60;
                
                let isShiftPast = false;
                if (shiftDateObj < todayObj) {
                    isShiftPast = true;
                } else if (shiftDateObj.getTime() === todayObj.getTime()) {
                    if (shiftDef.id === 'morning' && currentTotalHours > 12) isShiftPast = true;
                    else if (shiftDef.id === 'afternoon' && currentTotalHours > 17) isShiftPast = true;
                    // Ca tối không bao giờ quá hạn trong ngày hôm đó cho đến khi sang ngày mới
                }

                let badgeClass = 'shift-badge';
                let style = 'font-size: 11px; padding: 4px; margin-bottom: 4px; border-radius: 4px; border: 1px solid #ddd; position: relative; ';
                
                let onClickAttr = '';
                let statusIcon = '';

                if (isScheduled) {
                    badgeClass += ' active';
                    const st = dayData.status ? dayData.status[shiftDef.id] : 'none';

                    // Nếu đã điểm danh (bất kể quá hạn hay chưa) -> Màu Xanh Dương, Không cho sửa
                    if (st === 'present' || st === 'late') {
                        style += 'background-color: #007bff; color: white; border-color: #007bff; cursor: default;';
                        onClickAttr = `onclick="showToast('Nhân viên đã điểm danh, không thể hủy ca!', 'warning')"`;
                    } 
                    // Nếu vắng mặt hoặc đã quá hạn mà chưa điểm danh -> Màu Đỏ, Không cho sửa
                    else if (st === 'absent' || (isShiftPast && st === 'none')) {
                        style += 'background-color: #dc3545; color: white; border-color: #dc3545; cursor: default;';
                        onClickAttr = `onclick="showToast('Ca này đã qua hạn, không thể thay đổi!', 'warning')"`;
                    } 
                    // Còn lại: Chưa quá hạn và chưa điểm danh -> Màu Xanh Lá, Cho phép sửa
                    else {
                        style += 'background-color: var(--primary-olive); color: white; border-color: var(--primary-olive); cursor: pointer;';
                        onClickAttr = `onclick="toggleShift('${staff._id}', '${date}', '${shiftDef.id}', ${isScheduled})"`;
                    }

                    // Status icon for scheduled
                    if (st === 'present') statusIcon = '<i class="fa-solid fa-circle-check" style="color: #fff; margin-left: 5px;" title="Đã điểm danh"></i>';
                    else if (st === 'absent') statusIcon = '<i class="fa-solid fa-circle-xmark" style="color: #fff; margin-left: 5px;" title="Vắng mặt"></i>';
                    else if (st === 'late') statusIcon = '<i class="fa-solid fa-clock" style="color: #fff; margin-left: 5px;" title="Đi trễ"></i>';
                    else if (isShiftPast && st === 'none') statusIcon = '<i class="fa-solid fa-circle-exclamation" style="color: #fff; margin-left: 5px;" title="Chưa điểm danh (Quá hạn)"></i>';
                    else statusIcon = `<i class="fa-solid fa-check" style="color: #fff; margin-left: 5px; opacity: 0.7;"></i>`;

                } else if (isPending) {
                    style += 'background-color: #fff; color: var(--primary-olive); border: 2px dashed var(--primary-olive); cursor: pointer;';
                    statusIcon = '<i class="fa-solid fa-hourglass-start" style="margin-left:5px; color:var(--primary-olive);" title="Đang chờ duyệt"></i>';
                    onClickAttr = `onclick="approveShift('${staff._id}', '${date}', '${shiftDef.id}')"`;
                } else if (isTakenByOther) {
                    style += 'background-color: #f8f9fa; color: #aaa; opacity: 0.5; cursor: not-allowed;';
                    onClickAttr = `onclick="showToast('Ca này đã có nhân viên khác trực!', 'warning')"`;
                } else {
                    if (isShiftPast) {
                        style += 'background-color: #f8f9fa; color: #ccc; opacity: 0.6; cursor: not-allowed;';
                        onClickAttr = `onclick="showToast('Ca này đã qua, không thể xếp thêm!', 'warning')"`;
                    } else {
                        style += 'background-color: #f8f9fa; color: #666; cursor: pointer;';
                        onClickAttr = `onclick="toggleShift('${staff._id}', '${date}', '${shiftDef.id}', ${isScheduled})"`;
                    }
                }
                
                html += `
                    <div class="${badgeClass}" ${onClickAttr} style="${style}">
                        ${shiftDef.label}
                        ${statusIcon}
                    </div>
                `;
            });

            html += `</td>`;
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

// Thêm/Bớt ca (Click vào badge)
async function toggleShift(userId, date, shiftId, isCurrentlyScheduled) {
    // Nếu thêm ca, cần kiểm tra xem ngày đó đã có mấy ca rồi
    // Tuy nhiên, việc lấy lại toàn bộ shifts của ngày hôm đó từ UI hơi khó, ta gọi API check luôn
    // Tạm thời, giả sử ta gọi fetch lại để lấy data mới nhất, nhưng để nhanh ta lấy từ DOM
    // Cách tốt nhất: fetch data của userId + date, update và save
    
    try {
        // Lấy lại schedule hiện tại của tuần để biết ngày đó đang có ca nào
        const response = await fetch(`/api/attendance/week?startDate=${date}&endDate=${date}`);
        const data = await response.json();
        const staffs = data.staffs || [];
        const staff = staffs.find(s => s._id === userId);
        
        let currentShifts = [];
        if (staff && staff.schedule && staff.schedule[date]) {
            currentShifts = staff.schedule[date].shifts || [];
        }

        let newShifts = [...currentShifts];
        
        if (isCurrentlyScheduled) {
            // Hủy ca
            newShifts = newShifts.filter(s => s !== shiftId);
        } else {
            // Thêm ca
            if (newShifts.length >= 2) {
                showToast('Nhân viên này đã làm đủ 2 ca trong ngày này!', 'error');
                return;
            }
            newShifts.push(shiftId);
        }

        const updateRes = await fetch('/api/attendance/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date, shifts: newShifts })
        });
        
        if (updateRes.ok) {
            fetchWeeklySchedule(); // Reload
        } else {
            const errData = await updateRes.json();
            showToast(errData.message || 'Lỗi phân ca!', 'error');
        }

    } catch (err) {
        console.error(err);
        showToast('Có lỗi xảy ra!', 'error');
    }
}

// Chấm công trực tiếp trên lịch (Dành cho Admin)
async function markShiftAttendance(userId, date, shift, statusValue) {
    try {
        // Kiểm tra xem đã qua thời gian kết thúc ca chưa
        const now = new Date();
        const parts = date.split('-');
        const shiftYear = parseInt(parts[0], 10);
        const shiftMonth = parseInt(parts[1], 10) - 1;
        const shiftDay = parseInt(parts[2], 10);
        
        let endHour = 0, endMinute = 0;
        if (shift === 'morning') { endHour = 11; endMinute = 45; }
        else if (shift === 'afternoon') { endHour = 16; endMinute = 45; }
        else if (shift === 'evening') { endHour = 23; endMinute = 45; }
        
        const shiftEndTime = new Date(shiftYear, shiftMonth, shiftDay, endHour, endMinute, 0);
        
        if (now < shiftEndTime) {
            showToast('Chỉ được duyệt chấm công sau khi ca làm việc đã kết thúc!', 'warning');
            return;
        }

        const response = await fetch('/api/attendance/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date, shift, statusValue, byAdmin: true })
        });
        const data = await response.json();
        if (response.ok) {
            showToast('Chấm công thành công!', 'success');
            fetchWeeklySchedule();
        } else {
            showToast(data.message || 'Lỗi chấm công!', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Có lỗi xảy ra!', 'error');
    }
}

// Chốt lịch tự động (Admin)
function lockSchedule() {
    const startDate = weekDates[0]; // Ngày Thứ 2 của tuần đang hiển thị
    const modal = document.getElementById('confirmLockModal');
    const btnConfirm = document.getElementById('btnConfirmLock');

    // Đổi giao diện Modal cho hợp với Chốt lịch (trường hợp dùng chung modal)
    const title = modal.querySelector('h3');
    const msg = modal.querySelector('p');
    const icon = modal.querySelector('.confirm-header i');
    
    title.innerText = 'Xác nhận chốt lịch';
    msg.innerText = 'Bạn có chắc chắn muốn chốt lịch tuần này? Hệ thống sẽ tự động xếp nhân viên có ít ca nhất vào các ô còn trống.';
    icon.className = 'fa-solid fa-lock';
    icon.style.color = 'var(--primary-olive)';
    btnConfirm.style.backgroundColor = 'var(--primary-olive)';
    btnConfirm.innerText = 'Chốt Lịch';

    if (modal) modal.style.display = 'block';

    btnConfirm.onclick = async () => {
        if (modal) modal.style.display = 'none';
        try {
            const response = await fetch('/api/attendance/auto-fill-and-lock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekStartDate: startDate })
            });
            const data = await response.json();
            
            if (response.ok) {
                showToast(data.message, 'success');
                fetchWeeklySchedule(); // Tải lại lịch
            } else {
                showToast(data.message || 'Lỗi khi chốt lịch', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Có lỗi xảy ra', 'error');
        }
    };
}

// Mở chốt lịch (Admin)
function unlockSchedule() {
    const startDate = weekDates[0];
    const modal = document.getElementById('confirmLockModal');
    const btnConfirm = document.getElementById('btnConfirmLock');
    
    // Đổi giao diện Modal cho hợp với Mở chốt
    const title = modal.querySelector('h3');
    const msg = modal.querySelector('p');
    const icon = modal.querySelector('.confirm-header i');
    
    title.innerText = 'Mở chốt lịch tuần';
    msg.innerText = 'Bạn có chắc chắn muốn mở chốt lịch tuần này? Nhân viên sẽ có thể tiếp tục tự đăng ký hoặc sửa lịch.';
    icon.className = 'fa-solid fa-unlock';
    icon.style.color = '#d9534f';
    btnConfirm.style.backgroundColor = '#d9534f';
    btnConfirm.innerText = 'Mở Chốt';

    if (modal) modal.style.display = 'block';

    btnConfirm.onclick = async () => {
        if (modal) modal.style.display = 'none';
        try {
            const response = await fetch('/api/attendance/unlock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weekStartDate: startDate })
            });
            const data = await response.json();
            if (response.ok) {
                showToast(data.message, 'success');
                fetchWeeklySchedule();
            } else {
                showToast(data.message || 'Lỗi khi mở chốt', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Có lỗi xảy ra', 'error');
        }
    };
}

// ================= MODAL LƯƠNG =================
function openSalaryModal(userId, currentSalary) {
    document.getElementById('salaryUserId').value = userId;
    document.getElementById('baseSalaryInput').value = currentSalary;
    document.getElementById('salaryModal').style.display = 'flex';
}

function closeSalaryModal() {
    document.getElementById('salaryModal').style.display = 'none';
}

async function handleUpdateSalary(e) {
    e.preventDefault();
    const userId = document.getElementById('salaryUserId').value;
    const baseSalary = document.getElementById('baseSalaryInput').value;

    try {
        const response = await fetch(`/api/attendance/salary/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ baseSalary: Number(baseSalary) })
        });
        const data = await response.json();
        
        if (response.ok) {
            showToast('Cập nhật lương thành công!', 'success');
            closeSalaryModal();
            fetchSalaryList(); // Reload salary table
            fetchWeeklySchedule(); // Reload schedule table in case it was modified
        } else {
            showToast(data.message || 'Lỗi cập nhật lương!', 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Có lỗi xảy ra!', 'error');
    }
}

// FETCH VÀ RENDER BẢNG LƯƠNG
async function fetchSalaryList() {
    try {
        let monthPicker = document.getElementById('salaryMonthPicker');
        if (!monthPicker.value) {
            const now = new Date();
            const y = now.getFullYear();
            const m = (now.getMonth() + 1).toString().padStart(2, '0');
            monthPicker.value = `${y}-${m}`;
        }
        const monthStr = monthPicker.value;

        const response = await fetch(`/api/attendance/salary-report?month=${monthStr}`);
        const staffs = await response.json();
        
        const tbody = document.getElementById('salaryTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        if (staffs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Không có dữ liệu trong tháng này.</td></tr>';
            return;
        }

        staffs.forEach(staff => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${staff.staffId || 'N/A'}</strong></td>
                <td>
                    <strong>${staff.fullName}</strong><br>
                    <small style="color: #888;">${staff.email}</small>
                </td>
                <td style="color: #666; font-weight: 500;">${staff.salaryPerShift.toLocaleString('vi-VN')} đ</td>
                <td style="font-weight: 600; color: #17a2b8;">${staff.workedShifts} ca</td>
                <td style="color: #d9534f; font-weight: bold; font-size: 15px;">${staff.totalSalary.toLocaleString('vi-VN')} VNĐ</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn-action" onclick="openSalaryModal('${staff._id}', ${staff.salaryPerShift})" title="Cập nhật mức lương / ca" style="background-color: var(--primary-olive); border-radius: 4px; border: none; padding: 6px 12px; color: white;"><i class="fa-solid fa-pen-to-square"></i> Cập nhật</button>
                        <button class="btn-action" onclick="exportSalaryPDF('${staff._id}', '${monthStr}')" title="Xuất file lương (PDF)" style="background-color: #d9534f; border-radius: 4px; border: none; padding: 6px 12px; color: white;"><i class="fa-solid fa-file-pdf"></i> Xuất PDF</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Lỗi khi tải danh sách lương:', err);
    }
}

// Xử lý mở submenu Quản lý chấm công & Lương
window.toggleAttendanceMenu = function(e) {
    if (e) e.preventDefault();
    const menu = document.getElementById('menu-attendance');
    const submenu = menu.querySelector('.sub-menu');
    if (submenu) {
        submenu.classList.toggle('open');
    }
};

// Gắn lại hàm khi đổi tab
const originalShowSectionAttendance = window.showSection;
window.showSection = function(sectionId, overrideMenuId) {
    if (originalShowSectionAttendance) {
        originalShowSectionAttendance(sectionId, overrideMenuId);
    }
    
    // Quản lý CSS active cho Submenu
    if (sectionId === 'attendance-management' || sectionId === 'salary-management') {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        const menuAttendance = document.getElementById('menu-attendance');
        menuAttendance.classList.add('active');
        
        const submenu = menuAttendance.querySelector('.sub-menu');
        if (submenu) submenu.classList.add('open');

        // Reset active-sub
        document.querySelectorAll('#menu-attendance .sub-menu li a').forEach(a => a.classList.remove('active-sub'));
        // Set active-sub
        if (sectionId === 'attendance-management') {
            document.querySelector('#menu-attendance .sub-menu li:nth-child(1) a').classList.add('active-sub');
        } else {
            document.querySelector('#menu-attendance .sub-menu li:nth-child(2) a').classList.add('active-sub');
        }
    }

    if (sectionId === 'attendance-management') {
        initWeek(); // Load lịch của tuần hiện tại khi mở tab
    } else if (sectionId === 'salary-management') {
        fetchSalaryList();
    }
};

// ================= XUẤT PDF =================
async function exportSalaryPDF(userId, month) {
    try {
        showToast('Đang tạo PDF...', 'info');

        const response = await fetch(`/api/attendance/salary-details/${userId}?month=${month}`);
        const data = await response.json();
        
        if (!response.ok) {
            return showToast(data.message || 'Lỗi lấy dữ liệu', 'error');
        }

        const formattedMonth = month.split('-').reverse().join('/');
        
        let detailsHtml = '';
        if (data.details.length === 0) {
            detailsHtml = '<tr><td colspan="4" style="text-align: center; padding: 10px; border-bottom: 1px solid #000; border-right: 1px solid #000;">Không có ca làm việc nào</td></tr>';
        } else {
            data.details.forEach((item, index) => {
                const parts = item.date.split('-');
                const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
                const statusStr = item.status === 'present' ? 'Có mặt' : 'Đi trễ';
                
                detailsHtml += `
                    <tr>
                        <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; text-align: center;">${index + 1}</td>
                        <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; text-align: center;">${formattedDate}</td>
                        <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; text-align: center;">Ca ${item.shiftLabel}</td>
                        <td style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 8px; text-align: center;">${statusStr}</td>
                    </tr>
                `;
            });
        }

        const htmlContent = `
            <div style="width: 100%; box-sizing: border-box; padding: 10px; font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5; background: #fff;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Phiếu nhận lương</h1>
                    <p style="font-size: 18px; margin: 10px 0;">Tổng Công Ty Chăn Ga Gối Đệm Cao Cấp HomeBedding</p>
                </div>
                
                <div style="margin-bottom: 25px; font-size: 16px;">
                    <div>Giám đốc: Nguyễn Đức Thế</div>
                    <div>Số điện thoại: 0866835758</div>
                    <div>Địa chỉ: Trát Cầu - Tiền Phong - Thường Tín - Hà Nội</div>
                    <div style="margin-top: 15px;">Nhân viên: <strong>${data.fullName}</strong></div>
                    <div>Mã nhân viên: ${data.staffId || 'N/A'}</div>
                    <div>Kỳ lương tháng: ${formattedMonth}</div>
                    
                    <div style="margin-top: 15px; display: flex; justify-content: space-between;">
                        <span>Mức lương / Ca: <strong>${data.salaryPerShift.toLocaleString('vi-VN')} VNĐ</strong></span>
                        <span>Tổng số ca đã làm: <strong>${data.workedShifts} ca</strong></span>
                    </div>
                </div>

                <h3 style="margin-bottom: 10px; font-size: 18px; font-weight: bold;">Chi tiết lịch đi làm:</h3>
                <table style="width: 100%; border-spacing: 0; border-top: 1px solid #000; border-left: 1px solid #000; margin-bottom: 30px; font-size: 15px;">
                    <thead>
                        <tr>
                            <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; background-color: #f0f0f0; padding: 8px; text-align: center; color: #000;">STT</th>
                            <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; background-color: #f0f0f0; padding: 8px; text-align: center; color: #000;">Ngày Làm Việc</th>
                            <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; background-color: #f0f0f0; padding: 8px; text-align: center; color: #000;">Ca Làm</th>
                            <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; background-color: #f0f0f0; padding: 8px; text-align: center; color: #000;">Trạng Thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailsHtml}
                    </tbody>
                </table>

                <div style="text-align: right; font-size: 18px; padding: 10px 0 30px 0;">
                    <strong>TỔNG TIỀN LƯƠNG: ${data.totalSalary.toLocaleString('vi-VN')} VNĐ</strong>
                </div>

                <table style="width: 100%; font-size: 16px; page-break-inside: avoid;">
                    <tr>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding-top: 10px;">
                            <strong>Chữ ký bên sử dụng lao động</strong>
                            <br><br><br><br>
                            <span>............................................</span>
                        </td>
                        <td style="width: 50%; text-align: center; vertical-align: top; padding-top: 10px;">
                            <strong>Chữ ký người lao động</strong>
                            <br><br><br><br>
                            <span>............................................</span>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        const opt = {
            margin:       [10, 10, 10, 10],
            filename:     `Bang_Luong_${data.staffId || 'NV'}_${month}.pdf`,
            image:        { type: 'jpeg', quality: 1 },
            html2canvas:  {
                scale: 2,
                useCORS: true,
                scrollY: 0,
                // Đặt windowHeight = toàn bộ trang để html2canvas không bị clip theo viewport
                windowHeight: document.documentElement.scrollHeight
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: ['css', 'legacy'] }
        };

        html2pdf().set(opt).from(htmlContent).save().then(() => {
            showToast('Xuất PDF thành công!', 'success');
        }).catch(err => {
            console.error('Lỗi tạo PDF:', err);
            showToast('Lỗi khi tạo file PDF', 'error');
        });

    } catch (err) {
        console.error(err);
        showToast('Có lỗi xảy ra khi gọi API', 'error');
    }
}
async function approveShift(userId, date, shiftId) {
    const modal = document.getElementById('confirmLockModal');
    const btnConfirm = document.getElementById('btnConfirmLock');

    const title = modal.querySelector('h3');
    const msg = modal.querySelector('p');
    const icon = modal.querySelector('.confirm-header i');

    title.innerText = 'Duyệt ca trực';
    msg.innerText = 'Duyệt ca trực này cho nhân viên?';
    icon.className = 'fa-solid fa-check-circle';
    icon.style.color = 'var(--primary-olive)';
    btnConfirm.style.backgroundColor = 'var(--primary-olive)';
    btnConfirm.innerText = 'Xác Nhận';

    if (modal) modal.style.display = 'block';

    btnConfirm.onclick = async () => {
        if (modal) modal.style.display = 'none';
        try {
            // Duyệt ca thực chất là tạo một bản ghi Attendance chính thức
            // Chúng ta gọi toggleShift với isCurrentlyScheduled = false để thêm ca
            await toggleShift(userId, date, shiftId, false);
            showToast('Đã duyệt ca làm việc thành công!');
        } catch (err) {
            console.error('Lỗi duyệt ca:', err);
            showToast('Lỗi khi duyệt ca', 'error');
        }
    };
}

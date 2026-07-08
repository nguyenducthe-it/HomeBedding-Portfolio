# BÁO CÁO THIẾT KẾ CHI TIẾT - TÁC NHÂN NHÂN VIÊN (STAFF)

Tài liệu này chứa toàn bộ các biểu đồ thiết kế phân tích hệ thống cho các ca sử dụng thuộc tác nhân **Nhân viên** của website **Home Bedding**.
Các biểu đồ tuần tự được xây dựng nghiêm ngặt theo mô hình **Boundary - Controller - Entity (BCE)**, và các biểu đồ hoạt động mô tả chi tiết logic rẽ nhánh nghiệp vụ.

---

## 1. ĐĂNG NHẬP (LOGIN)

### 1.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant LoginUI as : Giao diện Đăng Nhập
    participant LoginCtrl as : Điều khiển Đăng Nhập
    participant DB as : CSDL

    Staff ->> LoginUI: Truy cập trang đăng nhập, nhập Email & Mật khẩu
    activate LoginUI
    LoginUI ->> LoginCtrl: Gửi yêu cầu đăng nhập (email, password)
    activate LoginCtrl
    LoginCtrl ->> DB: Tìm người dùng theo email
    activate DB
    DB -->> LoginCtrl: Trả về thông tin người dùng (User)
    deactivate DB

    alt Tài khoản không tồn tại
        LoginCtrl -->> LoginUI: Phản hồi lỗi 400 (Tài khoản không tồn tại)
        LoginUI ->> Staff: Hiển thị Toast thông báo lỗi đăng nhập
    else Tài khoản tồn tại
        LoginCtrl ->> LoginCtrl: So khớp mật khẩu: comparePassword()
        alt Mật khẩu không khớp
            LoginCtrl -->> LoginUI: Phản hồi lỗi 400 (Mật khẩu không chính xác)
            LoginUI ->> Staff: Hiển thị Toast thông báo sai mật khẩu
        else Mật khẩu trùng khớp
            LoginCtrl ->> LoginCtrl: Kiểm tra vai trò người dùng (role)
            alt Vai trò không hợp lệ (Không phải staff hoặc admin)
                LoginCtrl -->> LoginUI: Phản hồi lỗi 403 (Không có quyền truy cập)
                LoginUI ->> Staff: Hiển thị Toast thông báo không có quyền truy cập
            else Vai trò hợp lệ (staff hoặc admin)
                LoginCtrl ->> LoginCtrl: Tạo mã JWT Token
                LoginCtrl -->> LoginUI: Phản hồi 200 { token, userId, role, fullName }
                deactivate LoginCtrl
                LoginUI ->> LoginUI: Lưu token & thông tin cá nhân vào LocalStorage
                LoginUI ->> Staff: Điều hướng sang trang quản trị nhân viên (staff.html) và hiển thị Toast thành công
                deactivate LoginUI
            end
        end
    end
```

### 1.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start1([Bắt đầu]) --> OpenLogin[Truy cập trang đăng nhập]
        OpenLogin --> EnterCredentials[Nhập Email và Mật khẩu]
        EnterCredentials --> ClickLogin[Nhấn nút Đăng Nhập]
    end
    subgraph Hệ thống
        ClickLogin --> SendLoginReq[Gửi yêu cầu đăng nhập lên Server]
        SendLoginReq --> QueryUser[Tìm kiếm tài khoản theo email trong CSDL]
        QueryUser --> UserExist{Tìm thấy tài khoản?}
        UserExist -- Không --> ReturnErrNoUser[Trả về lỗi 400] --> ShowErrNoUser[Hiển thị Toast báo lỗi đăng nhập]
        UserExist -- Có --> MatchPW[So khớp mật khẩu bằng bcrypt]
        MatchPW --> PWCorrect{Mật khẩu trùng khớp?}
        PWCorrect -- Không --> ReturnErrPW[Trả về lỗi 400] --> ShowErrPW[Hiển thị Toast báo sai mật khẩu]
        PWCorrect -- Có --> CheckRole[Kiểm tra vai trò người dùng]
        CheckRole --> RoleValid{Là staff hoặc admin?}
        RoleValid -- Không --> ReturnForbidden[Trả về lỗi 403] --> ShowErrRole[Hiển thị Toast báo không có quyền]
        RoleValid -- Có --> GenerateJWT[Tạo JWT Token]
        GenerateJWT --> ReturnToken[Trả về Token và thông tin user]
        ReturnToken --> SaveLocal[Lưu Token vào LocalStorage]
        SaveLocal --> RedirectStaff[Điều hướng sang trang quản trị staff.html]
        RedirectStaff --> ShowSuccess[Hiển thị thông báo đăng nhập thành công]
    end
    ShowErrNoUser --> EndFail1([Kết thúc thất bại])
    ShowErrPW --> EndFail1
    ShowErrRole --> EndFail1
    ShowSuccess --> EndSuccess1([Kết thúc thành công])
```

---

## 2. THEO DÕI LỊCH TRỰC (SHIFT TRACKING)

### 2.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant ShiftUI as : Giao diện Lịch Trực
    participant ShiftCtrl as : Điều khiển Lịch Trực
    participant DB as : CSDL

    Staff ->> ShiftUI: Truy cập trang quản lý lịch trực
    activate ShiftUI
    ShiftUI ->> ShiftCtrl: Yêu cầu lấy danh sách lịch trực (userId, weekStartDate)
    activate ShiftCtrl
    ShiftCtrl ->> DB: Lấy dữ liệu điểm danh (Attendance) & Đăng ký ca trực (ShiftRequest)
    activate DB
    DB -->> ShiftCtrl: Trả về danh sách lịch trực & trạng thái đăng ký ca
    deactivate DB
    ShiftCtrl -->> ShiftUI: Phản hồi danh sách lịch trực
    deactivate ShiftCtrl
    ShiftUI ->> Staff: Hiển thị lịch trực trên bảng điều khiển

    opt Đăng ký ca trực mới / Yêu cầu đổi ca trực
        Staff ->> ShiftUI: Chọn các ca trực (morning/afternoon/evening) cho tuần tới
        Staff ->> ShiftUI: Nhấn nút "Đăng Ký Ca Trực"
        ShiftUI ->> ShiftCtrl: Gửi yêu cầu đăng ký ca (userId, weekStartDate, requestedShifts)
        activate ShiftCtrl
        ShiftCtrl ->> DB: Tìm kiếm đăng ký trùng lặp hoặc đã duyệt
        activate DB
        DB -->> ShiftCtrl: Trả về kết quả kiểm tra
        deactivate DB
        
        alt Đã tồn tại đăng ký được duyệt
            ShiftCtrl -->> ShiftUI: Phản hồi lỗi 400 (Lịch trực tuần này đã được duyệt, không thể thay đổi)
            ShiftUI ->> Staff: Hiển thị Toast thông báo lỗi đăng ký
        else Chưa đăng ký hoặc ở trạng thái chờ duyệt
            ShiftCtrl ->> DB: Lưu/Cập nhật yêu cầu vào bảng ShiftRequest
            activate DB
            DB -->> ShiftCtrl: Xác nhận lưu thành công
            deactivate DB
            ShiftCtrl -->> ShiftUI: Phản hồi 200 (Đăng ký ca trực thành công)
            deactivate ShiftCtrl
            ShiftUI ->> Staff: Hiển thị Toast thông báo đăng ký thành công & cập nhật trạng thái lịch trực
        end
    end
    deactivate ShiftUI
```

### 2.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start2([Bắt đầu]) --> OpenShift[Truy cập trang Lịch Trực]
    end
    subgraph Hệ thống
        OpenShift --> RequestShifts[Gửi yêu cầu tải lịch trực và trạng thái đăng ký]
        RequestShifts --> QueryShifts[Tìm kiếm dữ liệu trong bảng Attendance & ShiftRequest]
        QueryShifts --> RenderCalendar[Trả về danh sách ca trực & Hiển thị trên giao diện]
    end
    subgraph Nhân viên
        RenderCalendar --> ChooseAction{Muốn đăng ký ca trực mới?}
        ChooseAction -- Không --> EndNoRegister([Kết thúc])
        ChooseAction -- Có --> SelectShifts[Chọn các ngày và ca trực mong muốn]
        SelectShifts --> SubmitRegister[Nhấn nút Gửi Yêu Cầu Đăng Ký]
    end
    subgraph Hệ thống
        SubmitRegister --> SendRegisterReq[Gửi yêu cầu đăng ký ca trực lên Server]
        SendRegisterReq --> CheckApproved{Lịch của tuần đã được duyệt?}
        CheckApproved -- Có --> ReturnApproveErr[Trả về lỗi không thể thay đổi] --> ShowApproveErr[Hiển thị Toast báo lỗi]
        CheckApproved -- Không --> SaveShiftRequest[Lưu hoặc cập nhật yêu cầu đăng ký vào ShiftRequest]
        SaveShiftRequest --> ReturnSuccess[Trả về kết quả đăng ký thành công 200]
        ReturnSuccess --> UpdateUI[Cập nhật lại giao diện và hiển thị Toast thành công]
    end
    ShowApproveErr --> EndFail2([Kết thúc thất bại])
    UpdateUI --> EndSuccess2([Kết thúc thành công])
```

---

## 3. THEO DÕI LƯƠNG (SALARY TRACKING)

### 3.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant SalaryUI as : Giao diện Bảng Lương
    participant SalaryCtrl as : Điều khiển Bảng Lương
    participant DB as : CSDL

    Staff ->> SalaryUI: Truy cập trang quản lý lương, chọn Tháng/Năm cần tra cứu
    activate SalaryUI
    SalaryUI ->> SalaryCtrl: Yêu cầu lấy thông tin lương (userId, month, year)
    activate SalaryCtrl
    SalaryCtrl ->> DB: Lấy lương cơ bản của nhân viên (User)
    activate DB
    DB -->> SalaryCtrl: Trả về thông tin User (baseSalary)
    deactivate DB

    SalaryCtrl ->> DB: Lấy lịch sử chấm công trong tháng (Attendance)
    activate DB
    DB -->> SalaryCtrl: Trả về danh sách chấm công các ca trực
    deactivate DB

    SalaryCtrl ->> SalaryCtrl: Tính toán lương: <br>- Tổng ca làm thực tế (present)<br>- Tổng ca trễ (late) và vắng (absent)<br>- Thực nhận = Lương cơ bản * ca làm - phạt trễ/vắng + phụ cấp
    SalaryCtrl -->> SalaryUI: Phản hồi bảng lương chi tiết (lương cơ bản, số ca, phạt, thực nhận)
    deactivate SalaryCtrl
    SalaryUI ->> Staff: Hiển thị bảng lương chi tiết lên màn hình

    opt Gửi phản hồi / khiếu nại về bảng lương
        Staff ->> SalaryUI: Nhấp chọn nút "Khiếu Nại Lương"
        SalaryUI ->> Staff: Điều hướng sang Giao diện Báo cáo trợ giúp và điền sẵn thông tin khiếu nại lương
    end
    deactivate SalaryUI
```

### 3.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start3([Bắt đầu]) --> OpenSalary[Truy cập trang Bảng Lương]
        OpenSalary --> SelectMonthYear[Chọn Tháng và Năm cần tra cứu]
        SelectMonthYear --> ClickViewSalary[Nhấn nút Xem Bảng Lương]
    end
    subgraph Hệ thống
        ClickViewSalary --> SendSalaryReq[Gửi yêu cầu truy vấn thông tin lương lên Server]
        SendSalaryReq --> QueryBaseSalary[Truy vấn lương cơ bản từ bảng User trong CSDL]
        QueryBaseSalary --> QueryAttendance[Truy vấn danh sách chấm công Attendance trong tháng từ CSDL]
        QueryAttendance --> CalculateNet[Tính toán tổng ca hiện diện, trễ, vắng & tính toán lương thực nhận]
        CalculateNet --> RenderSalary[Trả về kết quả bảng lương chi tiết & hiển thị lên màn hình]
    end
    subgraph Nhân viên
        RenderSalary --> ConfirmSalary{Có sai sót trong bảng lương?}
        ConfirmSalary -- Không --> EndOk([Kết thúc])
        ConfirmSalary -- Có --> ClickDispute[Nhấp nút Khiếu Nại Lương]
    end
    subgraph Hệ thống
        ClickDispute --> RedirectHelp[Điều hướng sang trang Báo cáo Trợ giúp]
        RedirectHelp --> PrefillSubject[Tự động điền chủ đề Khiếu nại lương tháng tương ứng]
    end
    PrefillSubject --> EndDispute([Kết thúc - Tiếp tục gửi phản hồi])
```

---

## 4. PHẢN HỒI ĐÁNH GIÁ (REPLY TO REVIEWS)

### 4.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant ReviewUI as : Giao diện Đánh Giá
    participant ReviewCtrl as : Điều khiển Đánh Giá
    participant DB as : CSDL

    Staff ->> ReviewUI: Truy cập trang quản lý đánh giá của khách hàng
    activate ReviewUI
    ReviewUI ->> ReviewCtrl: Yêu cầu danh sách đánh giá sản phẩm
    activate ReviewCtrl
    ReviewCtrl ->> DB: Lấy danh sách đánh giá (Review)
    activate DB
    DB -->> ReviewCtrl: Trả về danh sách đánh giá
    deactivate DB
    ReviewCtrl -->> ReviewUI: Phản hồi danh sách đánh giá
    deactivate ReviewCtrl
    ReviewUI ->> Staff: Hiển thị danh sách đánh giá lên màn hình

    opt Viết phản hồi cho một đánh giá
        Staff ->> ReviewUI: Chọn một đánh giá cụ thể
        Staff ->> ReviewUI: Nhập nội dung phản hồi của cửa hàng
        Staff ->> ReviewUI: Nhấn nút "Gửi Phản Hồi"
        ReviewUI ->> ReviewCtrl: Gửi yêu cầu phản hồi (reviewId, replyText, staffId)
        activate ReviewCtrl
        
        alt Nội dung phản hồi trống
            ReviewCtrl -->> ReviewUI: Phản hồi lỗi 400 (Nội dung phản hồi không được để trống)
            ReviewUI ->> Staff: Hiển thị Toast thông báo lỗi nhập liệu
        else Nội dung hợp lệ
            ReviewCtrl ->> DB: Cập nhật trường reply & replyCreatedAt vào tài liệu Review
            activate DB
            DB -->> ReviewCtrl: Trả về thông tin đánh giá đã cập nhật
            deactivate DB
            ReviewCtrl -->> ReviewUI: Phản hồi 200 (Gửi phản hồi thành công)
            deactivate ReviewCtrl
            ReviewUI ->> Staff: Cập nhật giao diện (hiển thị phản hồi) & hiển thị Toast thành công
        end
    end
    deactivate ReviewUI
```

### 4.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start4([Bắt đầu]) --> OpenReview[Truy cập trang Quản Lý Đánh Giá]
    end
    subgraph Hệ thống
        OpenReview --> RequestReviews[Gửi yêu cầu tải danh sách đánh giá lên Server]
        RequestReviews --> QueryReviews[Truy vấn danh sách đánh giá từ bảng Review trong CSDL]
        QueryReviews --> ShowReviews[Hiển thị danh sách đánh giá lên giao diện]
    end
    subgraph Nhân viên
        ShowReviews --> WantReply{Muốn phản hồi đánh giá?}
        WantReply -- Không --> EndNoReply([Kết thúc])
        WantReply -- Có --> SelectReview[Chọn đánh giá cần phản hồi]
        SelectReview --> InputReply[Nhập nội dung phản hồi]
        InputReply --> SubmitReply[Nhấn nút Gửi Phản Hồi]
    end
    subgraph Hệ thống
        SubmitReply --> SendReplyReq[Gửi yêu cầu lưu phản hồi lên Server]
        SendReplyReq --> CheckEmptyReply{Nội dung phản hồi trống?}
        CheckEmptyReply -- Có --> ReturnErrEmpty[Trả về lỗi nội dung trống 400] --> ShowErrEmpty[Hiển thị Toast báo lỗi]
        CheckEmptyReply -- Không --> SaveReply[Cập nhật nội dung phản hồi vào bản ghi Review trong CSDL]
        SaveReply --> ReturnSuccessReply[Trả về kết quả cập nhật thành công 200]
        ReturnSuccessReply --> RefreshReviewUI[Cập nhật giao diện hiển thị phản hồi và thông báo thành công]
    end
    ShowErrEmpty --> EndFail4([Kết thúc thất bại])
    RefreshReviewUI --> EndSuccess4([Kết thúc thành công])
```

---

## 5. TƯ VẤN TRỰC TUYẾN (ONLINE CONSULTATION)

### 5.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant ChatUI as : Giao diện Tư Vấn
    participant ChatCtrl as : Điều khiển Tư Vấn
    participant DB as : CSDL

    Staff ->> ChatUI: Truy cập trang tư vấn trực tuyến (Danh sách phòng chat)
    activate ChatUI
    ChatUI ->> ChatCtrl: Yêu cầu lấy danh sách phiên tư vấn đang mở (status: 'open')
    activate ChatCtrl
    ChatCtrl ->> DB: Truy vấn danh sách phiên tư vấn (Consultation)
    activate DB
    DB -->> ChatCtrl: Trả về danh sách phiên tư vấn đang hoạt động
    deactivate DB
    ChatCtrl -->> ChatUI: Phản hồi danh sách phiên tư vấn
    deactivate ChatCtrl
    ChatUI ->> Staff: Hiển thị danh sách khách hàng đang chờ tư vấn

    Staff ->> ChatUI: Chọn một khách hàng để bắt đầu tư vấn
    ChatUI ->> ChatCtrl: Yêu cầu kết nối phòng chat (consultationId) & lấy lịch sử tin nhắn
    activate ChatCtrl
    ChatCtrl ->> DB: Lấy lịch sử tin nhắn của phiên tư vấn
    activate DB
    DB -->> ChatCtrl: Trả về danh sách tin nhắn cũ
    deactivate DB
    ChatCtrl -->> ChatUI: Phản hồi lịch sử tin nhắn & thiết lập kết nối Socket.io
    deactivate ChatCtrl
    ChatUI ->> Staff: Hiển thị khung chat với khách hàng và lịch sử tin nhắn

    opt Nhập và gửi tin nhắn mới
        Staff ->> ChatUI: Nhập nội dung tin nhắn và nhấn "Gửi"
        ChatUI ->> ChatCtrl: Gửi tin nhắn qua Socket.io / API (consultationId, text, staffName)
        activate ChatCtrl
        ChatCtrl ->> DB: Lưu tin nhắn mới vào mảng messages trong Consultation
        activate DB
        DB -->> ChatCtrl: Xác nhận lưu tin nhắn thành công
        deactivate DB
        ChatCtrl ->> ChatCtrl: Phát sự kiện Socket.io 'new_message_to_customer' tới Khách hàng
        ChatCtrl -->> ChatUI: Trả về trạng thái đã gửi thành công
        deactivate ChatCtrl
        ChatUI ->> Staff: Cập nhật tin nhắn mới lên khung chat
    end

    opt Đóng phiên tư vấn
        Staff ->> ChatUI: Nhấn nút "Đóng Phiên Tư Vấn"
        ChatUI ->> ChatCtrl: Gửi yêu cầu đóng phiên (consultationId)
        activate ChatCtrl
        ChatCtrl ->> DB: Cập nhật status thành 'closed' trong Consultation
        activate DB
        DB -->> ChatCtrl: Xác nhận cập nhật thành công
        deactivate DB
        ChatCtrl ->> ChatCtrl: Phát sự kiện Socket.io 'consultation_closed' báo cho Khách hàng
        ChatCtrl -->> ChatUI: Phản hồi kết quả đóng phiên thành công (200)
        deactivate ChatCtrl
        ChatUI ->> ChatUI: Làm mới danh sách phòng chat, đóng khung chat hiện tại
        ChatUI -> staff: Hiển thị Toast thông báo đã đóng phiên tư vấn thành công
    end
    deactivate ChatUI
```

### 5.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start5([Bắt đầu]) --> OpenChat[Truy cập trang Tư Vấn Trực Tuyến]
    end
    subgraph Hệ thống
        OpenChat --> LoadOpenSessions[Tải danh sách phiên tư vấn có trạng thái 'open' từ CSDL]
        LoadOpenSessions --> DisplaySessions[Hiển thị danh sách khách hàng đang chờ tư vấn]
    end
    subgraph Nhân viên
        DisplaySessions --> SelectSession[Chọn một phiên tư vấn từ danh sách]
    end
    subgraph Hệ thống
        SelectSession --> ConnectWS[Kết nối Socket.io và tải lịch sử tin nhắn từ CSDL]
        ConnectWS --> OpenChatWindow[Hiển thị khung chat và lịch sử tin nhắn]
    end
    subgraph Nhân viên
        OpenChatWindow --> DecideChatAction{Chọn hành động tiếp theo?}
        DecideChatAction -- Gửi tin nhắn --> InputMessage[Nhập nội dung tin nhắn và nhấn Gửi]
        DecideChatAction -- Đóng phiên tư vấn --> CloseSession[Nhấn nút Đóng Phiên]
    end
    subgraph Hệ thống
        InputMessage --> SaveMessage[Lưu tin nhắn vào CSDL bảng Consultation]
        SaveMessage --> BroadcastWS[Phát tin nhắn qua Socket.io tới Khách hàng]
        BroadcastWS --> UpdateChatUI[Hiển thị tin nhắn mới trên khung chat của Nhân viên]
        UpdateChatUI --> OpenChatWindow
        
        CloseSession --> UpdateStatusClosed[Cập nhật trạng thái thành 'closed' trong CSDL]
        UpdateStatusClosed --> BroadcastClosed[Phát sự kiện đóng phiên qua Socket.io tới Khách hàng]
        BroadcastClosed --> RefreshChatList[Làm mới danh sách phiên chat & đóng khung chat hiện tại]
        RefreshChatList --> ShowClosedToast[Hiển thị Toast báo đóng phiên thành công]
    end
    ShowClosedToast --> EndSuccess5([Kết thúc thành công])
```

---

## 6. BÁO CÁO TRỢ GIÚP (HELP / SUPPORT REPORT)

### 6.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant SupportUI as : Giao diện Trợ Giúp
    participant SupportCtrl as : Điều khiển Trợ Giúp
    participant DB as : CSDL

    Staff ->> SupportUI: Truy cập mục Báo Cáo Trợ Giúp (Phản hồi nội bộ)
    activate SupportUI
    SupportUI ->> SupportCtrl: Yêu cầu lịch sử báo cáo trợ giúp (staffId)
    activate SupportCtrl
    SupportCtrl ->> DB: Lấy danh sách báo cáo trợ giúp của nhân viên (StaffFeedback)
    activate DB
    DB -->> SupportCtrl: Trả về danh sách báo cáo trợ giúp
    deactivate DB
    SupportCtrl -->> SupportUI: Phản hồi danh sách báo cáo trợ giúp
    deactivate SupportCtrl
    SupportUI ->> Staff: Hiển thị danh sách báo cáo cũ & trạng thái xử lý

    opt Tạo báo cáo trợ giúp mới
        Staff ->> SupportUI: Nhấp chọn nút "Tạo Báo Cáo Mới"
        SupportUI ->> Staff: Hiển thị form điền báo cáo (Loại báo cáo, Độ ưu tiên, Nội dung)
        Staff ->> SupportUI: Chọn Loại (feedbackType), Độ ưu tiên (priority) & Nhập nội dung (text)
        Staff ->> SupportUI: Nhấn nút "Gửi Báo Cáo"
        SupportUI ->> SupportCtrl: Gửi yêu cầu lưu báo cáo (staffId, staffName, feedbackType, priority, text)
        activate SupportCtrl
        
        alt Thông tin nhập liệu không hợp lệ (Trống nội dung)
            SupportCtrl -->> SupportUI: Phản hồi lỗi 400 (Vui lòng điền đầy đủ thông tin)
            SupportUI ->> Staff: Hiển thị Toast thông báo lỗi dữ liệu
        else Thông tin hợp lệ
            SupportCtrl ->> DB: Tạo bản ghi StaffFeedback mới với status: 'pending'
            activate DB
            DB -->> SupportCtrl: Xác nhận lưu thành công
            deactivate DB
            SupportCtrl -->> SupportUI: Phản hồi 200 (Gửi báo cáo trợ giúp thành công)
            deactivate SupportCtrl
            SupportUI ->> Staff: Hiển thị Toast thành công, làm mới danh sách báo cáo
        end
    end
    deactivate SupportUI
```

### 6.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start6([Bắt đầu]) --> OpenSupport[Truy cập mục Báo cáo Trợ giúp]
    end
    subgraph Hệ thống
        OpenSupport --> LoadFeedbacks[Gửi yêu cầu tải lịch sử báo cáo nội bộ lên Server]
        LoadFeedbacks --> QueryFeedbacks[Truy vấn danh sách phản hồi từ bảng StaffFeedback trong CSDL]
        QueryFeedbacks --> DisplayFeedbacks[Hiển thị lịch sử báo cáo và trạng thái tương ứng]
    end
    subgraph Nhân viên
        DisplayFeedbacks --> WantNewReport{Muốn gửi báo cáo trợ giúp mới?}
        WantNewReport -- Không --> EndNoReport([Kết thúc])
        WantNewReport -- Có --> ClickNewReport[Nhấn nút Tạo Báo Cáo Mới]
    end
    subgraph Hệ thống
        ClickNewReport --> ShowSupportForm[Hiển thị form nhập báo cáo trợ giúp]
    end
    subgraph Nhân viên
        ShowSupportForm --> FillReportForm[Chọn Loại báo cáo, Độ ưu tiên & Nhập nội dung]
        FillReportForm --> SubmitReport[Nhấn nút Gửi Báo Cáo]
    end
    subgraph Hệ thống
        SubmitReport --> SendReportData[Gửi dữ liệu báo cáo lên Server]
        SendReportData --> ValidateInputs{Nội dung nhập trống?}
        ValidateInputs -- Có --> ReturnValidateErr[Trả về lỗi thiếu thông tin 400] --> ShowValidateErr[Hiển thị Toast báo lỗi]
        ValidateInputs -- Không --> SaveFeedback[Lưu bản ghi mới vào StaffFeedback trong CSDL với status pending]
        SaveFeedback --> NotifyAdmin[Thông báo cho Quản trị viên Admin biết có phản hồi mới]
        NotifyAdmin --> ReturnReportOk[Trả về kết quả gửi thành công 200]
        ReturnReportOk --> RefreshReportUI[Làm mới danh sách báo cáo trợ giúp và hiển thị Toast thành công]
    end
    ShowValidateErr --> EndFail6([Kết thúc thất bại])
    RefreshReportUI --> EndSuccess6([Kết thúc thành công])
```

---

## 7. QUẢN LÝ ĐƠN HÀNG (ORDER MANAGEMENT)

### 7.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant OrderUI as : Giao diện Quản Lý Đơn Hàng
    participant OrderCtrl as : Điều khiển Đơn Hàng
    participant DB as : CSDL

    Staff ->> OrderUI: Truy cập mục Quản Lý Đơn Hàng
    activate OrderUI
    OrderUI ->> OrderCtrl: Yêu cầu lấy danh sách đơn hàng (filters: status, searchCode)
    activate OrderCtrl
    OrderCtrl ->> DB: Lấy danh sách đơn hàng (Order)
    activate DB
    DB -->> OrderCtrl: Trả về danh sách đơn hàng tương ứng
    deactivate DB
    OrderCtrl -->> OrderUI: Phản hồi danh sách đơn hàng
    deactivate OrderCtrl
    OrderUI ->> Staff: Hiển thị danh sách đơn hàng lên màn hình

    Staff ->> OrderUI: Chọn một đơn hàng để xem chi tiết
    OrderUI ->> OrderCtrl: Yêu cầu thông tin chi tiết đơn hàng (orderId)
    activate OrderCtrl
    OrderCtrl ->> DB: Truy vấn chi tiết đơn hàng & thông tin khách hàng liên kết
    activate DB
    DB -->> OrderCtrl: Trả về thông tin chi tiết đơn hàng
    deactivate DB
    OrderCtrl -->> OrderUI: Phản hồi chi tiết đơn hàng
    deactivate OrderCtrl
    OrderUI ->> Staff: Hiển thị thông tin chi tiết (sản phẩm, số lượng, địa chỉ giao hàng)

    opt Cập nhật trạng thái đơn hàng
        Staff ->> OrderUI: Chọn trạng thái mới (Ví dụ: Đã xác nhận / Đang giao / Đã giao / Đã hủy)
        Staff ->> OrderUI: Nhấn nút "Cập Nhật Trạng Thái"
        OrderUI ->> OrderCtrl: Gửi yêu cầu cập nhật trạng thái (orderId, newStatus)
        activate OrderCtrl
        
        alt Yêu cầu hủy đơn hàng (newStatus: 'cancelled')
            OrderCtrl ->> DB: Cập nhật trạng thái đơn hàng thành 'cancelled'
            activate DB
            DB -->> OrderCtrl: Xác nhận cập nhật
            deactivate DB
            OrderCtrl ->> DB: Hoàn trả số lượng sản phẩm vào kho hàng (Product)
            activate DB
            DB -->> OrderCtrl: Xác nhận cập nhật kho
            deactivate DB
        else Cập nhật trạng thái thông thường (confirmed / shipping / completed)
            OrderCtrl ->> DB: Cập nhật trạng thái đơn hàng (Order)
            activate DB
            DB -->> OrderCtrl: Xác nhận cập nhật
            deactivate DB
        end
        
        OrderCtrl -->> OrderUI: Phản hồi 200 (Cập nhật đơn hàng thành công)
        deactivate OrderCtrl
        OrderUI ->> Staff: Hiển thị Toast thông báo cập nhật thành công & làm mới giao diện chi tiết đơn hàng
    end
    deactivate OrderUI
```

### 7.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start7([Bắt đầu]) --> OpenOrders[Truy cập trang Quản Lý Đơn Hàng]
    end
    subgraph Hệ thống
        OpenOrders --> RequestOrders[Gửi yêu cầu tải danh sách đơn hàng lên Server]
        RequestOrders --> QueryOrders[Truy vấn danh sách đơn hàng từ bảng Order trong CSDL]
        QueryOrders --> DisplayOrders[Hiển thị danh sách đơn hàng trên giao diện]
    end
    subgraph Nhân viên
        DisplayOrders --> SelectOrder[Chọn một đơn hàng để xem chi tiết]
    end
    subgraph Hệ thống
        SelectOrder --> QueryOrderDetail[Truy vấn thông tin chi tiết đơn hàng & khách hàng từ CSDL]
        QueryOrderDetail --> ShowOrderDetail[Hiển thị chi tiết đơn hàng]
    end
    subgraph Nhân viên
        ShowOrderDetail --> WantUpdateOrder{Muốn cập nhật trạng thái đơn hàng?}
        WantUpdateOrder -- Không --> EndNoUpdate([Kết thúc])
        WantUpdateOrder -- Có --> SelectNewStatus[Chọn trạng thái mới Confirmed / Shipping / Completed / Cancelled]
        SelectNewStatus --> ClickUpdateOrder[Nhấn nút Cập Nhật Trạng Thái]
    end
    subgraph Hệ thống
        ClickUpdateOrder --> SendUpdateOrder[Gửi yêu cầu cập nhật lên Server]
        SendUpdateOrder --> CheckStatusCancelled{Trạng thái mới là Cancelled?}
        CheckStatusCancelled -- Có --> CancelOrderDB[Cập nhật trạng thái đơn hàng thành Cancelled trong CSDL]
        CancelOrderDB --> RestockProducts[Hoàn trả số lượng sản phẩm trong đơn hàng vào kho Product]
        CheckStatusCancelled -- Không --> UpdateOrderStatusDB[Cập nhật trạng thái đơn hàng tương ứng trong CSDL]
        RestockProducts --> ReturnUpdateSuccess[Trả về phản hồi cập nhật thành công 200]
        UpdateOrderStatusDB --> ReturnUpdateSuccess
        ReturnUpdateSuccess --> RefreshOrderDetailUI[Làm mới giao diện và hiển thị Toast thành công]
    end
    RefreshOrderDetailUI --> EndSuccess7([Kết thúc thành công])
```

---

## 8. QUẢN LÝ THÔNG TIN CÁ NHÂN (PROFILE MANAGEMENT)

### 8.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân viên
    participant ProfileUI as : Giao diện Hồ Sơ
    participant ProfileCtrl as : Điều khiển Hồ Sơ
    participant DB as : CSDL

    Staff ->> ProfileUI: Truy cập trang cá nhân (Hồ sơ nhân viên)
    activate ProfileUI
    ProfileUI ->> ProfileCtrl: Yêu cầu lấy thông tin cá nhân (userId)
    activate ProfileCtrl
    ProfileCtrl ->> DB: Lấy thông tin chi tiết nhân viên (User)
    activate DB
    DB -->> ProfileCtrl: Trả về thông tin tài khoản nhân viên
    deactivate DB
    ProfileCtrl -->> ProfileUI: Phản hồi thông tin tài khoản
    deactivate ProfileCtrl
    ProfileUI ->> Staff: Hiển thị thông tin cá nhân lên form (Họ tên, SĐT, Email, Học vấn, Kỹ năng)

    opt Cập nhật thông tin cá nhân
        Staff ->> ProfileUI: Thay đổi các trường thông tin (fullName, phone, education, skills, avatar)
        Staff ->> ProfileUI: Nhấn nút "Lưu Thay Đổi"
        ProfileUI ->> ProfileCtrl: Gửi thông tin cập nhật (userId, updateData)
        activate ProfileCtrl
        
        alt Dữ liệu đầu vào không hợp lệ (Ví dụ: Họ tên hoặc SĐT trống)
            ProfileCtrl -->> ProfileUI: Phản hồi lỗi 400 (Dữ liệu không hợp lệ)
            ProfileUI ->> Staff: Hiển thị Toast thông báo lỗi cập nhật
        else Dữ liệu hợp lệ
            ProfileCtrl ->> DB: Cập nhật thông tin mới vào bảng User
            activate DB
            DB -->> ProfileCtrl: Trả về tài liệu User đã cập nhật
            deactivate DB
            ProfileCtrl -->> ProfileUI: Phản hồi 200 (Cập nhật thông tin thành công)
            deactivate ProfileCtrl
            ProfileUI ->> Staff: Hiển thị Toast thông báo thành công & cập nhật thông tin hiển thị mới
        end
    end
    deactivate ProfileUI
```

### 8.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Nhân viên
        Start8([Bắt đầu]) --> OpenProfile[Truy cập mục Thông tin cá nhân]
    end
    subgraph Hệ thống
        OpenProfile --> RequestProfile[Gửi yêu cầu lấy thông tin cá nhân lên Server]
        RequestProfile --> QueryProfileDB[Truy vấn thông tin người dùng từ bảng User trong CSDL]
        QueryProfileDB --> RenderProfileForm[Trả về dữ liệu tài khoản & Hiển thị thông tin lên Form]
    end
    subgraph Nhân viên
        RenderProfileForm --> WantUpdateProfile{Muốn cập nhật thông tin?}
        WantUpdateProfile -- Không --> EndNoProfileUpdate([Kết thúc])
        WantUpdateProfile -- Có --> EditProfileFields[Chỉnh sửa các trường thông tin]
        EditProfileFields --> ClickSaveProfile[Nhấn nút Lưu Thay Đổi]
    end
    subgraph Hệ thống
        ClickSaveProfile --> SendProfileUpdate[Gửi dữ liệu cập nhật lên Server]
        SendProfileUpdate --> CheckInputs{Họ tên hoặc Số điện thoại trống?}
        CheckInputs -- Có --> ReturnProfileErr[Trả về lỗi dữ liệu không hợp lệ 400] --> ShowProfileErr[Hiển thị Toast báo lỗi]
        CheckInputs -- Không --> UpdateProfileDB[Cập nhật các trường dữ liệu vào bảng User trong CSDL]
        UpdateProfileDB --> ReturnProfileOk[Trả về kết quả cập nhật thành công 200]
        ReturnProfileOk --> RefreshProfileUI[Hiển thị Toast thông báo thành công và cập nhật thông tin mới]
    end
    ShowProfileErr --> EndFail8([Kết thúc thất bại])
    RefreshProfileUI --> EndSuccess8([Kết thúc thành công])
```

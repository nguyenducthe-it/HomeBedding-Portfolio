# BÁO CÁO THIẾT KẾ CHI TIẾT - TÁC NHÂN KHÁCH HÀNG (CUSTOMER)

Tài liệu này chứa toàn bộ các biểu đồ thiết kế phân tích hệ thống cho các ca sử dụng thuộc tác nhân **Khách hàng** của website **Home Bedding**.
Các biểu đồ tuần tự được xây dựng nghiêm ngặt theo mô hình **Boundary - Controller - Entity (BCE)**, và các biểu đồ hoạt động mô tả chi tiết logic rẽ nhánh nghiệp vụ.

---

## 1. ĐĂNG KÝ TÀI KHOẢN (REGISTER)

### 1.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant HomeUI as : Giao diện Trang Chủ
    participant RegisterUI as : Giao diện Đăng Ký (Modal)
    participant RegisterCtrl as : Điều khiển Đăng Ký
    participant DB as : CSDL

    Customer ->> HomeUI: Truy cập trang chủ
    activate HomeUI
    HomeUI ->> Customer: Hiển thị giao diện trang chủ
    Customer ->> HomeUI: Nhấp chọn nút "Đăng Ký"
    HomeUI ->> RegisterUI: Mở Modal Đăng Ký
    activate RegisterUI
    RegisterUI ->> Customer: Hiển thị form Đăng Ký
    Customer ->> RegisterUI: Nhập Họ tên, Email, SĐT, Mật khẩu & nhấn "Đăng ký"
    RegisterUI ->> RegisterUI: Validate định dạng Email, SĐT, độ mạnh Mật khẩu
    alt Validate Client Thất bại
        RegisterUI ->> Customer: Hiển thị Toast thông báo lỗi định dạng dữ liệu
    else Validate Client Thành công
        RegisterUI ->> RegisterCtrl: Gửi yêu cầu đăng ký (fullName, email, phone, password)
        activate RegisterCtrl
        RegisterCtrl ->> DB: Truy vấn tìm tài khoản theo email hoặc phone
        activate DB
        DB -->> RegisterCtrl: Trả về thông tin tài khoản (nếu tồn tại)
        deactivate DB
        alt Tài khoản (Email hoặc SĐT) đã tồn tại
            RegisterCtrl -->> RegisterUI: Phản hồi 400 (Email hoặc số điện thoại đã sử dụng)
            RegisterUI ->> Customer: Hiển thị Toast thông báo lỗi trùng lặp tài khoản
        else Tài khoản chưa tồn tại
            RegisterCtrl ->> RegisterCtrl: Mã hóa mật khẩu bằng bcryptjs
            RegisterCtrl ->> DB: Lưu thông tin người dùng mới (role: 'customer')
            activate DB
            DB -->> RegisterCtrl: Lưu thành công
            deactivate DB
            RegisterCtrl -->> RegisterUI: Phản hồi 201 (Đăng ký tài khoản thành công)
            deactivate RegisterCtrl
            RegisterUI ->> HomeUI: Đóng modal Đăng ký, hiển thị modal Đăng nhập
            deactivate RegisterUI
            HomeUI ->> Customer: Hiển thị Toast thông báo đăng ký thành công
        end
    end
    deactivate HomeUI
```

### 1.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start1([Bắt đầu]) --> OpenRegister[Mở Modal Đăng Ký]
        OpenRegister --> EnterInfo[Nhập Họ tên, Email, SĐT, Mật khẩu]
        EnterInfo --> ClickSubmit[Nhấn nút Đăng Ký]
    end
    subgraph Hệ thống
        ClickSubmit --> ClientCheck{Validate ở Client?}
        ClientCheck -- Không hợp lệ --> ShowError[Hiển thị Toast lỗi định dạng]
        ClientCheck -- Hợp lệ --> SendRequest[Gửi yêu cầu đăng ký lên Server]
        SendRequest --> CheckDB[Kiểm tra trùng lặp Email/SĐT]
        CheckDB --> UserExist{Tài khoản đã tồn tại?}
        UserExist -- Có --> ReturnConflict[Trả về lỗi 400] --> ShowConflict[Hiển thị Toast báo lỗi tồn tại]
        UserExist -- Không --> HashPW[Mã hóa mật khẩu bằng bcryptjs]
        HashPW --> SaveDB[Lưu tài khoản mới vào CSDL]
        SaveDB --> SuccessRes[Trả về phản hồi 201]
        SuccessRes --> SwitchModal[Đóng Modal Đăng ký, hiển thị Modal Đăng nhập]
        SwitchModal --> ShowToast[Hiển thị Toast đăng ký thành công]
    end
    ShowError --> EndFail1([Kết thúc thất bại])
    ShowConflict --> EndFail1
    ShowToast --> EndSuccess1([Kết thúc thành công])
```

---

## 2. ĐĂNG NHẬP HỆ THỐNG (LOGIN)

### 2.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant HomeUI as : Giao diện Trang Chủ
    participant LoginUI as : Giao diện Đăng Nhập (Modal)
    participant LoginCtrl as : Điều khiển Đăng Nhập
    participant DB as : CSDL

    Customer ->> HomeUI: Truy cập trang chủ
    activate HomeUI
    HomeUI ->> Customer: Hiển thị giao diện trang chủ
    Customer ->> HomeUI: Nhấp chọn nút "Đăng Nhập"
    HomeUI ->> LoginUI: Mở Modal Đăng Nhập
    activate LoginUI
    LoginUI ->> Customer: Hiển thị form Đăng Nhập
    Customer ->> LoginUI: Nhập Email (hoặc fullName) & Mật khẩu
    LoginUI ->> LoginCtrl: Gửi yêu cầu đăng nhập (email, password)
    activate LoginCtrl
    LoginCtrl ->> DB: Tìm người dùng theo email hoặc fullName
    activate DB
    DB -->> LoginCtrl: Trả về thông tin tài khoản (nếu tồn tại)
    deactivate DB
    alt Tài khoản không tồn tại
        LoginCtrl -->> LoginUI: Phản hồi 400 (Tài khoản không chính xác)
        LoginUI ->> Customer: Hiển thị Toast thông báo lỗi thông tin đăng nhập
    else Tài khoản tồn tại
        LoginCtrl ->> LoginCtrl: So khớp mật khẩu: comparePassword()
        alt Sai mật khẩu
            LoginCtrl -->> LoginUI: Phản hồi 400 (Mật khẩu không chính xác)
            LoginUI ->> Customer: Hiển thị Toast thông báo sai mật khẩu
        else Mật khẩu trùng khớp
            LoginCtrl ->> LoginCtrl: Tạo mã JWT Token (hạn 24 giờ)
            LoginCtrl -->> LoginUI: Phản hồi 200 { token, userId, role, fullName }
            deactivate LoginCtrl
            LoginUI ->> LoginUI: Lưu token & thông tin cơ bản vào LocalStorage
            LoginUI ->> HomeUI: Đóng modal Đăng nhập, tải thông tin user lên Header
            deactivate LoginUI
            HomeUI ->> Customer: Hiển thị Toast thành công & điều hướng sang giao diện Khách hàng (customer.html)
        end
    end
    deactivate HomeUI
```

### 2.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start2([Bắt đầu]) --> OpenLogin[Mở Modal Đăng Nhập]
        OpenLogin --> EnterCredentials[Nhập Email/SĐT và Mật khẩu]
        EnterCredentials --> ClickLogin[Nhấn nút Đăng Nhập]
    end
    subgraph Hệ thống
        ClickLogin --> SendLoginReq[Gửi yêu cầu đăng nhập lên Server]
        SendLoginReq --> QueryDB[Tìm kiếm người dùng trong CSDL]
        QueryDB --> UserFound{Tìm thấy người dùng?}
        UserFound -- Không --> ReturnUserErr[Trả về lỗi 400] --> ShowUserErr[Hiển thị Toast báo tài khoản không đúng]
        UserFound -- Có --> MatchPW[So khớp mật khẩu bằng bcrypt]
        MatchPW --> PWCorrect{Mật khẩu đúng?}
        PWCorrect -- Không --> ReturnPWErr[Trả về lỗi 400] --> ShowPWErr[Hiển thị Toast báo sai mật khẩu]
        PWCorrect -- Có --> GenerateJWT[Tạo JWT Token]
        GenerateJWT --> SendToken[Trả về token và thông tin user]
        SendToken --> StoreLocal[Lưu token vào LocalStorage]
        StoreLocal --> UpdateUI[Đóng Modal Đăng nhập, cập nhật Header]
        UpdateUI --> RedirectCustomer[Điều hướng sang trang customer.html]
        RedirectCustomer --> ShowSuccessToast[Hiển thị Toast đăng nhập thành công]
    end
    ShowUserErr --> EndFail2([Kết thúc thất bại])
    ShowPWErr --> EndFail2
    ShowSuccessToast --> EndSuccess2([Kết thúc thành công])
```

---

## 3. TÌM KIẾM SẢN PHẨM (SEARCH PRODUCT)

### 3.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ProductUI as : Giao diện Sản Phẩm
    participant ProductCtrl as : Điều khiển Sản Phẩm
    participant DB as : CSDL

    Customer ->> ProductUI: Truy cập trang sản phẩm
    activate ProductUI
    ProductUI ->> ProductCtrl: Gửi yêu cầu lấy tất cả sản phẩm
    activate ProductCtrl
    ProductCtrl ->> DB: Tìm kiếm tất cả sản phẩm (Product.find({}))
    activate DB
    DB -->> ProductCtrl: Trả về danh sách tất cả sản phẩm
    deactivate DB
    ProductCtrl -->> ProductUI: Trả về danh sách sản phẩm
    deactivate ProductCtrl
    ProductUI -->> Customer: Hiển thị danh sách sản phẩm ban đầu

    Customer ->> ProductUI: Nhập từ khóa tìm kiếm và chọn danh mục
    ProductUI ->> ProductCtrl: Gọi API tìm kiếm: GET /api/products/all?search=[keyword]&category=[mùa]
    activate ProductCtrl
    ProductCtrl ->> DB: Tìm kiếm sản phẩm theo điều kiện regex tên và danh mục
    activate DB
    DB -->> ProductCtrl: Trả về danh sách sản phẩm thỏa mãn điều kiện
    deactivate DB
    alt Không tìm thấy sản phẩm nào
        ProductCtrl -->> ProductUI: Phản hồi 200 kèm danh sách rỗng
        ProductUI -->> Customer: Hiển thị thông báo "Không tìm thấy sản phẩm phù hợp"
    else Có tìm thấy sản phẩm
        ProductCtrl -->> ProductUI: Phản hồi 200 kèm danh sách sản phẩm
        ProductUI -->> Customer: Hiển thị danh sách sản phẩm tìm được lên màn hình
    end
    deactivate ProductCtrl
    deactivate ProductUI
```

### 3.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start3([Bắt đầu]) --> VisitPage[Truy cập trang sản phẩm]
        VisitPage --> EnterKeyword[Nhập từ khóa tìm kiếm]
        EnterKeyword --> SelectCategory[Chọn danh mục sản phẩm]
    end
    subgraph Hệ thống
        SelectCategory --> CallSearchAPI[Gọi API tìm kiếm sản phẩm]
        CallSearchAPI --> DBQuery[Server thực hiện truy vấn CSDL]
        DBQuery --> DBResult[CSDL trả về danh sách sản phẩm]
        DBResult --> CheckEmpty{Danh sách rỗng?}
        CheckEmpty -- Có --> ShowEmptyMsg[Hiển thị thông báo không tìm thấy]
        CheckEmpty -- Không --> RenderProducts[Render danh sách sản phẩm lên màn hình]
    end
    ShowEmptyMsg --> End3([Kết thúc])
    RenderProducts --> End3
```

---

## 4. XEM CHI TIẾT SẢN PHẨM (VIEW PRODUCT DETAILS)

### 4.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ProductUI as : Giao diện Sản Phẩm
    participant DetailUI as : Giao diện Chi Tiết Sản Phẩm (Modal/Detail)
    participant ProductCtrl as : Điều khiển Sản Phẩm
    participant ReviewCtrl as : Điều khiển Đánh Giá
    participant DB as : CSDL

    Customer ->> ProductUI: Nhấp chọn một sản phẩm cụ thể
    activate ProductUI
    ProductUI ->> DetailUI: Mở giao diện hiển thị chi tiết sản phẩm
    activate DetailUI
    DetailUI ->> ProductCtrl: Gửi yêu cầu lấy chi tiết sản phẩm theo ID (GET /api/products/:id)
    activate ProductCtrl
    ProductCtrl ->> DB: Tìm sản phẩm bằng ID
    activate DB
    DB -->> ProductCtrl: Trả về thông tin chi tiết sản phẩm
    deactivate DB
    ProductCtrl -->> DetailUI: Trả về chi tiết sản phẩm
    deactivate ProductCtrl

    DetailUI ->> ProductCtrl: Gửi yêu cầu lấy sản phẩm liên quan (GET /api/products/related/:id)
    activate ProductCtrl
    ProductCtrl ->> DB: Tìm sản phẩm cùng danh mục loại trừ sản phẩm hiện tại
    activate DB
    DB -->> ProductCtrl: Trả về danh sách sản phẩm liên quan
    deactivate DB
    ProductCtrl -->> DetailUI: Trả về danh sách liên quan
    deactivate ProductCtrl

    DetailUI ->> ReviewCtrl: Gửi yêu cầu lấy đánh giá sản phẩm (GET /api/reviews/product/:productId)
    activate ReviewCtrl
    ReviewCtrl ->> DB: Tìm tất cả đánh giá của sản phẩm này
    activate DB
    DB -->> ReviewCtrl: Trả về mảng đánh giá
    deactivate DB
    ReviewCtrl -->> DetailUI: Trả về danh sách đánh giá của sản phẩm
    deactivate ReviewCtrl

    DetailUI ->> DetailUI: Render thông tin sản phẩm, ảnh gallery, điểm đánh giá, bình luận và danh sách liên quan
    DetailUI -->> Customer: Hiển thị giao diện chi tiết sản phẩm đầy đủ thông tin
    deactivate DetailUI
    deactivate ProductUI
```

### 4.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start4([Bắt đầu]) --> ClickProduct[Nhấp vào sản phẩm cụ thể]
    end
    subgraph Hệ thống
        ClickProduct --> OpenDetail[Mở giao diện chi tiết sản phẩm]
        OpenDetail --> LoadAPIs[Gọi đồng thời 3 APIs lấy thông tin]
        subgraph ParallelTasks [Truy vấn dữ liệu song song]
            direction TB
            Task1[Lấy chi tiết sản phẩm từ CSDL]
            Task2[Lấy sản phẩm liên quan cùng danh mục]
            Task3[Lấy danh sách đánh giá & bình luận]
        end
        LoadAPIs --> ParallelTasks
        ParallelTasks --> ReceiveData[Nhận tất cả dữ liệu trả về]
        ReceiveData --> RenderGallery[Render hình ảnh, giá cả, tồn kho và mô tả]
        RenderGallery --> RenderReviews[Render rating và các nhận xét]
        RenderReviews --> RenderRelated[Render sản phẩm liên quan dưới chân trang]
        RenderRelated --> ShowDetailUI[Hiển thị giao diện chi tiết hoàn chỉnh]
    end
    ShowDetailUI --> End4([Kết thúc])
```

---

## 5. THÊM SẢN PHẨM VÀO GIỎ HÀNG (ADD TO CART)

### 5.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant DetailUI as : Giao diện Chi Tiết Sản Phẩm
    participant CartCtrl as : Điều khiển Giỏ Hàng
    participant DB as : CSDL

    Customer ->> DetailUI: Nhập số lượng & Nhấp nút "Thêm vào giỏ hàng"
    activate DetailUI
    DetailUI ->> CartCtrl: Gửi yêu cầu thêm sản phẩm (POST /api/cart/add {userId, productId, quantity})
    activate CartCtrl
    CartCtrl ->> DB: Tìm giỏ hàng hiện tại của người dùng (Cart.findOne({ userId }))
    activate DB
    DB -->> CartCtrl: Trả về giỏ hàng (nếu có)
    deactivate DB
    alt Giỏ hàng chưa tồn tại
        CartCtrl ->> DB: Khởi tạo giỏ hàng mới cho người dùng
        activate DB
        DB -->> CartCtrl: Đã tạo giỏ hàng trống
        deactivate DB
    end

    CartCtrl ->> CartCtrl: Kiểm tra xem sản phẩm đã tồn tại trong giỏ hàng chưa
    alt Sản phẩm đã có trong giỏ hàng
        CartCtrl ->> CartCtrl: Cộng dồn số lượng mới vào số lượng cũ
    else Sản phẩm chưa có trong giỏ hàng
        CartCtrl ->> CartCtrl: Thêm mới phần tử sản phẩm và số lượng vào danh sách
    end

    CartCtrl ->> DB: Lưu lại thông tin giỏ hàng (cart.save())
    activate DB
    DB -->> CartCtrl: Lưu thành công
    deactivate DB
    CartCtrl ->> DB: Nạp thông tin sản phẩm (cart.populate('items.productId'))
    activate DB
    DB -->> CartCtrl: Trả về chi tiết giỏ hàng đầy đủ
    deactivate DB
    CartCtrl -->> DetailUI: Trả về đối tượng giỏ hàng mới cập nhật
    deactivate CartCtrl
    DetailUI ->> DetailUI: Cập nhật số lượng hiển thị trên Badge giỏ hàng ở Header
    DetailUI -->> Customer: Hiển thị Toast thông báo thêm sản phẩm thành công
    deactivate DetailUI
```

### 5.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start5([Bắt đầu]) --> InputQty[Nhập số lượng & Nhấn Thêm vào giỏ]
    end
    subgraph Hệ thống
        InputQty --> CallAddCartAPI[Gửi yêu cầu API thêm vào giỏ]
        CallAddCartAPI --> FindCart[Tìm giỏ hàng của người dùng trong CSDL]
        FindCart --> CartExist{Giỏ hàng đã tồn tại?}
        CartExist -- Chưa --> InitCart[Khởi tạo bản ghi Giỏ hàng mới] --> ItemCheck
        CartExist -- Đã có --> ItemCheck{Sản phẩm đã có trong giỏ?}
        ItemCheck -- Có --> UpdateQty[Cộng dồn số lượng đặt thêm] --> SaveCart
        ItemCheck -- Chưa --> AddNewItem[Thêm sản phẩm mới vào giỏ] --> SaveCart
        SaveCart[Lưu giỏ hàng vào CSDL] --> PopulateCart[Populate thông tin sản phẩm]
        PopulateCart --> ReturnCart[Trả về giỏ hàng mới cho Client]
        ReturnCart --> UpdateBadge[Cập nhật số lượng Badge trên Header]
        UpdateBadge --> ShowToast[Hiển thị Toast báo thêm thành công]
    end
    ShowToast --> End5([Kết thúc])
```

---

## 6. XÓA SẢN PHẨM KHỎI GIỎ HÀNG (DELETE FROM CART)

### 6.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant CartUI as : Giao diện Giỏ Hàng
    participant CartCtrl as : Điều khiển Giỏ Hàng
    participant DB as : CSDL

    Customer ->> CartUI: Mở trang Giỏ hàng
    activate CartUI
    Customer ->> CartUI: Nhấp chọn biểu tượng "Thùng rác" (Xóa) của một sản phẩm
    CartUI ->> CartUI: Hiển thị Custom Dialog hỏi xác nhận xóa sản phẩm
    alt Chọn "Hủy"
        CartUI -->> Customer: Đóng hộp thoại xác nhận, giữ nguyên giỏ hàng
    else Chọn "Đồng ý"
        CartUI ->> CartCtrl: Gọi API xóa sản phẩm: DELETE /api/cart/remove {userId, productId}
        activate CartCtrl
        CartCtrl ->> DB: Tìm giỏ hàng hiện tại của người dùng (Cart.findOne({ userId }))
        activate DB
        DB -->> CartCtrl: Trả về thông tin giỏ hàng
        deactivate DB
        alt Không tìm thấy giỏ hàng
            CartCtrl -->> CartUI: Phản hồi 404 (Không tìm thấy giỏ hàng)
            CartUI ->> Customer: Hiển thị Toast thông báo lỗi
        else Tìm thấy giỏ hàng
            CartCtrl ->> CartCtrl: Loại bỏ phần tử trùng productId khỏi danh sách items
            CartCtrl ->> DB: Lưu giỏ hàng đã cập nhật (cart.save())
            activate DB
            DB -->> CartCtrl: Lưu thành công
            deactivate DB
            CartCtrl ->> DB: Nạp thông tin sản phẩm (cart.populate('items.productId'))
            activate DB
            DB -->> CartCtrl: Trả về giỏ hàng mới
            deactivate DB
            CartCtrl -->> CartUI: Phản hồi 200 kèm giỏ hàng đã cập nhật
            deactivate CartCtrl
            CartUI ->> CartUI: Render lại danh sách sản phẩm còn lại và tổng tiền hàng<br>Cập nhật lại Badge số lượng giỏ hàng trên Header
            CartUI -->> Customer: Hiển thị Toast thông báo xóa sản phẩm thành công
        end
    end
    deactivate CartUI
```

### 6.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start6([Bắt đầu]) --> ViewCart[Xem giỏ hàng]
        ViewCart --> ClickDelete[Nhấp biểu tượng xóa trên sản phẩm]
    end
    subgraph Hệ thống
        ClickDelete --> ConfirmDialog[Hiển thị Custom Dialog xác nhận]
        subgraph Lựa chọn
            direction TB
            OptNo[Chọn Hủy] --> CloseDialog[Đóng hộp thoại, giữ nguyên giỏ]
            OptYes[Chọn Đồng ý] --> CallRemoveAPI[Gửi yêu cầu API xóa sản phẩm]
        end
        ConfirmDialog --> Lựa chọn
        CallRemoveAPI --> FindCart[Tìm giỏ hàng trong CSDL]
        FindCart --> CartExist{Giỏ hàng tồn tại?}
        CartExist -- Không --> Return404[Trả về lỗi 404] --> ShowErrToast[Hiển thị Toast thông báo lỗi]
        CartExist -- Có --> FilterItem[Lọc bỏ sản phẩm khỏi danh sách items]
        FilterItem --> SaveDB[Lưu giỏ hàng mới vào CSDL]
        SaveDB --> PopulateDB[Populate lại thông tin sản phẩm]
        PopulateDB --> ReturnDB[Trả về giỏ hàng đã cập nhật]
        ReturnDB --> RenderCart[Client vẽ lại giỏ hàng và Badge ở Header]
        RenderCart --> ShowSuccessToast[Hiển thị Toast xóa thành công]
    end
    CloseDialog --> EndFail6([Kết thúc])
    ShowErrToast  --> EndFail6
    ShowSuccessToast --> EndSuccess6([Kết thúc thành công])
```

---

## 7. TÌM KIẾM TRONG GIỎ HÀNG (SEARCH IN CART)

### 7.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant CartUI as : Giao diện Giỏ Hàng
    participant CartCtrl as : Điều khiển Giỏ Hàng
    participant CartEntity as : Danh sách sản phẩm Giỏ Hàng

    Customer ->> CartUI: Mở trang Giỏ hàng
    activate CartUI
    CartUI ->> CartCtrl: Yêu cầu tải danh sách sản phẩm trong giỏ hàng
    activate CartCtrl
    CartCtrl ->> CartEntity: Lấy mảng sản phẩm trong giỏ hàng
    activate CartEntity
    CartEntity -->> CartCtrl: Trả về mảng sản phẩm
    deactivate CartEntity
    CartCtrl -->> CartUI: Hiển thị toàn bộ giỏ hàng ban đầu
    deactivate CartCtrl

    Customer ->> CartUI: Nhập từ khóa tìm kiếm vào ô lọc giỏ hàng
    CartUI ->> CartCtrl: Gọi hàm lọc sản phẩm local: filterCartItems(keyword)
    activate CartCtrl
    CartCtrl ->> CartEntity: Quét danh sách các item lọc theo tên sản phẩm chứa từ khóa
    activate CartEntity
    CartEntity -->> CartCtrl: Trả về mảng các sản phẩm khớp từ khóa
    deactivate CartEntity
    CartCtrl -->> CartUI: Trả về danh sách đã lọc
    deactivate CartCtrl
    alt Không tìm thấy sản phẩm nào khớp
        CartUI -->> Customer: Hiển thị thông báo "Không tìm thấy sản phẩm nào trong giỏ"
    else Tìm thấy sản phẩm
        CartUI -->> Customer: Render lại các thẻ sản phẩm thỏa mãn điều kiện tìm kiếm lên màn hình
    end
    deactivate CartUI
```

### 7.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start7([Bắt đầu]) --> OpenCart[Mở giao diện giỏ hàng]
        OpenCart --> InputFilter[Nhập từ khóa tìm kiếm vào ô lọc]
    end
    subgraph Hệ thống
        InputFilter --> TriggerInput[Bắt sự kiện nhập liệu input event]
        TriggerInput --> GetCartList[Lấy danh sách sản phẩm trong giỏ]
        GetCartList --> FilterItems[Lọc các phần tử khớp từ khóa]
        FilterItems --> CheckEmpty{Mảng kết quả rỗng?}
        CheckEmpty -- Có --> ShowNoMatch[Hiển thị thông báo không tìm thấy] --> HideAll[Ẩn danh sách sản phẩm hiển thị]
        CheckEmpty -- Không --> RenderMatched[Render danh sách sản phẩm khớp] --> HideUnmatched[Ẩn các sản phẩm không khớp]
    end
    HideAll --> End7([Kết thúc])
    HideUnmatched --> End7
```

---

## 8. THÊM SẢN PHẨM VÀO YÊU THÍCH (ADD TO WISHLIST)

### 8.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ProductUI as : Giao diện Sản Phẩm
    participant WishlistCtrl as : Điều khiển Yêu Thích
    participant DB as : CSDL

    Customer ->> ProductUI: Nhấp biểu tượng "Trái tim" (chưa tô màu) của một sản phẩm
    activate ProductUI
    ProductUI ->> WishlistCtrl: Gửi yêu cầu cập nhật yêu thích (POST /api/users/wishlist/toggle {userId, productId})
    activate WishlistCtrl
    WishlistCtrl ->> DB: Tìm người dùng theo ID (User.findById(userId))
    activate DB
    DB -->> WishlistCtrl: Trả về thông tin người dùng
    deactivate DB
    WishlistCtrl ->> WishlistCtrl: Kiểm tra xem productId có trong mảng wishlist chưa
    alt Sản phẩm đã có trong wishlist (Lỗi logic)
        WishlistCtrl -->> ProductUI: Trả về lỗi hoặc xóa khỏi wishlist
    else Sản phẩm chưa có trong wishlist
        WishlistCtrl ->> DB: Đẩy productId vào mảng user.wishlist & lưu (user.save())
        activate DB
        DB -->> WishlistCtrl: Lưu thành công
        deactivate DB
        WishlistCtrl -->> ProductUI: Phản hồi 200 { message: 'Cập nhật wishlist thành công', wishlist }
        deactivate WishlistCtrl
        ProductUI ->> ProductUI: Tô màu đỏ biểu tượng "Trái tim" của sản phẩm trên UI
        ProductUI -->> Customer: Hiển thị Toast thông báo đã thêm vào sản phẩm yêu thích
    end
    deactivate ProductUI
```

### 8.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start8([Bắt đầu]) --> ViewProduct[Xem danh sách sản phẩm]
        ViewProduct --> ClickHeart[Nhấp chọn biểu tượng trái tim chưa tô màu]
    end
    subgraph Hệ thống
        ClickHeart --> CallToggleAPI[Gửi yêu cầu API toggle yêu thích lên server]
        CallToggleAPI --> FindUser[Tìm người dùng trong CSDL bằng ID]
        FindUser --> CheckWishlist{Sản phẩm có trong wishlist?}
        CheckWishlist -- Có --> RemoveItem[Xóa sản phẩm khỏi wishlist] --> ReturnNewList[Trả về danh sách mới] --> UncolorHeart[Client bỏ tô màu trái tim]
        CheckWishlist -- Không --> AddItem[Thêm productId vào user.wishlist] --> SaveDB[Lưu thay đổi người dùng vào CSDL] --> SuccessRes[Trả về phản hồi cập nhật thành công] --> ColorHeart[Client tô màu đỏ cho trái tim] --> ShowSuccessToast[Hiển thị Toast báo đã thêm vào yêu thích]
    end
    UncolorHeart --> End8([Kết thúc])
    ShowSuccessToast --> End8
```

---

## 9. BỎ SẢN PHẨM KHỎI DANH SÁCH YÊU THÍCH (REMOVE FROM WISHLIST)

### 9.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant WishlistUI as : Giao diện Sản Phẩm Yêu Thích
    participant WishlistCtrl as : Điều khiển Yêu Thích
    participant DB as : CSDL

    Customer ->> WishlistUI: Mở danh sách sản phẩm yêu thích
    activate WishlistUI
    Customer ->> WishlistUI: Nhấp chọn biểu tượng "Trái tim" (đang tô đỏ) để bỏ yêu thích
    WishlistUI ->> WishlistCtrl: Gửi yêu cầu cập nhật yêu thích (POST /api/users/wishlist/toggle {userId, productId})
    activate WishlistCtrl
    WishlistCtrl ->> DB: Tìm người dùng theo ID (User.findById(userId))
    activate DB
    DB -->> WishlistCtrl: Trả về thông tin người dùng
    deactivate DB
    WishlistCtrl ->> WishlistCtrl: Tìm vị trí của productId trong mảng user.wishlist
    alt Sản phẩm không có trong wishlist (Lỗi logic)
        WishlistCtrl -->> WishlistUI: Trả về trạng thái lỗi
    else Sản phẩm tồn tại trong wishlist
        WishlistCtrl ->> DB: Xóa productId khỏi mảng user.wishlist & lưu (user.save())
        activate DB
        DB -->> WishlistCtrl: Lưu thành công
        deactivate DB
        WishlistCtrl -->> WishlistUI: Phản hồi 200 { message: 'Cập nhật wishlist thành công', wishlist }
        deactivate WishlistCtrl
        WishlistUI ->> WishlistUI: Xóa sản phẩm đó khỏi danh sách hiển thị trên giao diện
        WishlistUI -->> Customer: Hiển thị Toast thông báo đã bỏ sản phẩm yêu thích
    end
    deactivate WishlistUI
```

### 9.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start9([Bắt đầu]) --> OpenWishlist[Mở trang sản phẩm yêu thích]
        OpenWishlist --> ClickHeartRed[Nhấp biểu tượng trái tim đỏ muốn bỏ]
    end
    subgraph Hệ thống
        ClickHeartRed --> CallToggleAPI[Gửi yêu cầu API toggle yêu thích lên server]
        CallToggleAPI --> FindUserDB[Tìm người dùng trong CSDL bằng ID]
        FindUserDB --> CheckExist{Sản phẩm có trong wishlist?}
        CheckExist -- Không --> ShowErr[Báo lỗi không tìm thấy]
        CheckExist -- Có --> RemoveItem[Xóa sản phẩm khỏi user.wishlist] --> SaveUserDB[Lưu thay đổi vào CSDL] --> SuccessRes[Trả về phản hồi cập nhật thành công] --> RenderUI[Xóa thẻ sản phẩm đó khỏi màn hình] --> ShowToast[Hiển thị Toast báo đã bỏ yêu thích]
    end
    ShowErr --> End9([Kết thúc])
    ShowToast --> End9
```

---

## 10. ĐẶT HÀNG (PLACE ORDER)

### 10.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant CartUI as : Giao diện Giỏ hàng
    participant CheckoutUI as : Giao diện Thanh toán
    participant OrderCtrl as : Điều khiển Đơn hàng
    participant DB as : CSDL

    Customer ->> CartUI: Nhấp nút "Thanh toán đơn hàng"
    activate CartUI
    CartUI ->> CheckoutUI: Chuyển sang giao diện điền thông tin đặt hàng
    activate CheckoutUI
    CheckoutUI ->> Customer: Yêu cầu điền địa chỉ giao hàng, phương thức thanh toán, ghi chú và mã giảm giá (nếu có)
    deactivate CartUI

    Customer ->> CheckoutUI: Chọn địa chỉ giao hàng (hoặc nhập địa chỉ mới) và nhấn "Đặt hàng"
    CheckoutUI ->> OrderCtrl: Gọi API đặt hàng (POST /api/orders/place)
    activate OrderCtrl

    loop Duyệt qua từng sản phẩm trong đơn đặt hàng
        OrderCtrl ->> DB: Truy vấn kiểm tra thông tin và số lượng tồn kho
        activate DB
        DB -->> OrderCtrl: Trả về thông tin sản phẩm và số lượng tồn kho hiện tại
        deactivate DB
        alt Số lượng tồn kho nhỏ hơn số lượng đặt mua
            OrderCtrl -->> CheckoutUI: Phản hồi 400 (Sản phẩm không đủ số lượng trong kho)
            CheckoutUI ->> Customer: Hiển thị Toast thông báo lỗi sản phẩm X không đủ hàng
        end
    end

    alt Có áp dụng mã giảm giá (promotionCode)
        OrderCtrl ->> DB: Tìm kiếm mã giảm giá (Promotion.findOne({ code, isActive: true }))
        activate DB
        DB -->> OrderCtrl: Trả về thông tin mã giảm giá
        deactivate DB
        alt Mã không hợp lệ hoặc đã hết lượt sử dụng / hết hạn
            OrderCtrl -->> CheckoutUI: Phản hồi 400 (Mã không hợp lệ hoặc đã hết lượt)
            CheckoutUI ->> Customer: Hiển thị Toast thông báo lỗi mã giảm giá
        else Mã hợp lệ
            OrderCtrl ->> OrderCtrl: Tính toán số tiền được giảm giá (discountAmount)
            OrderCtrl ->> DB: Cập nhật giảm số lượng mã sử dụng (promo.quantity -= 1)
            activate DB
            DB -->> OrderCtrl: Cập nhật mã giảm giá thành công
            deactivate DB
        end
    end

    OrderCtrl ->> OrderCtrl: Tính tổng tiền hàng & số tiền thực trả (finalAmount)
    OrderCtrl ->> DB: Tạo và lưu đơn hàng mới (Order.save(), status='pending')
    activate DB
    DB -->> OrderCtrl: Lưu đơn hàng thành công
    deactivate DB

    loop Cập nhật lại tồn kho sản phẩm trong CSDL
        OrderCtrl ->> DB: Trừ số lượng tồn kho sản phẩm tương ứng
    end

    OrderCtrl ->> DB: Tìm giỏ hàng của user và xóa các sản phẩm đã đặt
    activate DB
    DB -->> OrderCtrl: Cập nhật giỏ hàng thành công
    deactivate DB

    OrderCtrl -->> CheckoutUI: Phản hồi 201 (Đặt hàng thành công kèm thông tin đơn)
    deactivate OrderCtrl
    CheckoutUI ->> CheckoutUI: Xóa giỏ hàng hiển thị local
    CheckoutUI ->> Customer: Hiển thị Toast đặt hàng thành công & điều hướng về Lịch sử đơn hàng
    deactivate CheckoutUI
```

### 10.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start10([Bắt đầu]) --> ViewCart[Xem giỏ hàng]
        ViewCart --> ClickCheckout[Nhấn nút Thanh toán]
        ClickCheckout --> ShowCheckoutUI[Hiển thị giao diện Checkout]
        ShowCheckoutUI --> FillDetails[Nhập thông tin nhận hàng, chọn địa chỉ và áp mã coupon]
        FillDetails --> ClickPlaceOrder[Nhấn nút Đặt hàng]
    end
    subgraph Hệ thống
        ClickPlaceOrder --> SendOrderReq[Gửi yêu cầu đặt hàng lên server]
        SendOrderReq --> CheckStock[Server kiểm tra tồn kho từng sản phẩm]
        CheckStock --> StockEnough{Đủ tồn kho tất cả?}
        StockEnough -- Không --> ReturnStockErr[Trả về lỗi 400] --> ShowStockErr[Hiển thị Toast báo thiếu hàng]
        StockEnough -- Có --> PromoCheck{Có nhập mã giảm giá?}
        PromoCheck -- Có --> CheckPromo[Kiểm tra tính hợp lệ của mã]
        CheckPromo --> PromoValid{Mã giảm giá hợp lệ?}
        PromoValid -- Không --> ReturnPromoErr[Trả về lỗi 400] --> ShowPromoErr[Hiển thị thông báo mã không hợp lệ]
        PromoValid -- Có --> ApplyPromo[Tính tiền giảm và trừ 1 lượt mã] --> CalculateTotal
        PromoCheck -- Không --> CalculateTotal[Tính tổng tiền và tiền thực trả]
        CalculateTotal --> CreateOrder[Tạo đơn hàng mới status pending vào CSDL]
        CreateOrder --> DecStock[Cập nhật giảm tồn kho sản phẩm trong CSDL]
        DecStock --> ClearCartDB[Xóa các sản phẩm đã đặt khỏi giỏ hàng CSDL]
        ClearCartDB --> ReturnSuccess[Trả về phản hồi 201 thành công]
        ReturnSuccess --> ClearLocalCart[Client xóa giỏ hàng local]
        ClearLocalCart --> RedirectOrders[Hiển thị Toast thành công và chuyển sang Lịch sử đơn]
    end
    ShowStockErr --> EndFail10([Kết thúc thất bại])
    ShowPromoErr --> EndFail10
    RedirectOrders --> EndSuccess10([Kết thúc thành công])
```

---

## 11. HỦY ĐƠN HÀNG (CANCEL ORDER)

### 11.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant OrdersUI as : Giao diện Lịch Sử Đơn Hàng
    participant OrderCtrl as : Điều khiển Đơn hàng
    participant DB as : CSDL

    Customer ->> OrdersUI: Truy cập trang Lịch sử đơn hàng
    activate OrdersUI
    Customer ->> OrdersUI: Nhấp chọn nút "Hủy đơn" trên một đơn hàng đang chờ xác nhận (pending)
    OrdersUI ->> OrdersUI: Hiển thị Custom Dialog xác nhận hủy đơn
    alt Chọn "Hủy"
        OrdersUI -->> Customer: Đóng hộp thoại xác nhận, giữ nguyên đơn hàng
    else Chọn "Đồng ý"
        OrdersUI ->> OrderCtrl: Gọi API hủy đơn hàng: PUT /api/orders/:orderId/cancel
        activate OrderCtrl
        OrderCtrl ->> DB: Tìm đơn hàng theo ID (Order.findById(orderId))
        activate DB
        DB -->> OrderCtrl: Trả về thông tin đơn hàng
        deactivate DB
        alt Không tìm thấy đơn hàng
            OrderCtrl -->> OrdersUI: Phản hồi 404 (Không tìm thấy đơn hàng)
            OrdersUI ->> Customer: Hiển thị Toast thông báo lỗi
        else Tìm thấy đơn hàng
            alt Trạng thái đơn hàng khác 'pending'
                OrderCtrl -->> OrdersUI: Phản hồi 400 (Chỉ có thể hủy đơn hàng đang chờ xác nhận)
                OrdersUI ->> Customer: Hiển thị Toast báo lỗi không thể hủy đơn
            else Trạng thái đơn hàng là 'pending'
                loop Hoàn lại tồn kho cho từng sản phẩm trong đơn hàng
                    OrderCtrl ->> DB: Cộng lại số lượng tồn kho sản phẩm (quantity + item.quantity)
                end
                OrderCtrl ->> DB: Cập nhật status='cancelled', cancelledBy='Khách hàng', cancelledAt=now
                activate DB
                DB -->> OrderCtrl: Lưu đơn hàng thành công
                deactivate DB
                OrderCtrl -->> OrdersUI: Phản hồi 200 kèm đơn hàng đã cập nhật
                deactivate OrderCtrl
                OrdersUI ->> OrdersUI: Render lại danh sách đơn hàng và trạng thái mới trên UI
                OrdersUI -->> Customer: Hiển thị Toast thông báo hủy đơn hàng thành công
            end
        end
    end
    deactivate OrdersUI
```

### 11.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start11([Bắt đầu]) --> ViewOrders[Xem danh sách đơn hàng đã mua]
        ViewOrders --> ClickCancel[Nhấn nút Hủy đơn trên đơn hàng mong muốn]
    end
    subgraph Hệ thống
        ClickCancel --> ShowConfirm[Hiển thị Custom Dialog xác nhận]
        subgraph XacNhan
            direction TB
            OptNo[Hủy] --> CloseDialog[Đóng hộp thoại, giữ nguyên đơn]
            OptYes[Đồng ý] --> CallCancelAPI[Gửi yêu cầu hủy đơn lên server]
        end
        ShowConfirm --> XacNhan
        CallCancelAPI --> FindOrder[Tìm kiếm đơn hàng trong CSDL]
        FindOrder --> OrderExist{Tìm thấy đơn hàng?}
        OrderExist -- Không --> Return404[Trả về lỗi 404] --> Show404Err[Hiển thị Toast báo lỗi không tìm thấy]
        OrderExist -- Có --> StatusCheck{Trạng thái là pending?}
        StatusCheck -- Không --> ReturnStatusErr[Trả về lỗi 400] --> ShowStatusErr[Hiển thị Toast báo chỉ được hủy đơn pending]
        StatusCheck -- Có --> RestoreStock[Duyệt cộng lại số lượng vào kho CSDL]
        RestoreStock --> UpdateStatus[Cập nhật trạng thái thành cancelled, lưu người hủy]
        UpdateStatus --> SaveDB[Lưu thông tin đơn hàng vào CSDL]
        SaveDB --> SuccessRes[Trả về phản hồi 200 thành công]
        SuccessRes --> RenderUI[Client vẽ lại danh sách và trạng thái mới]
        RenderUI --> ShowSuccessToast[Hiển thị Toast báo hủy thành công]
    end
    CloseDialog --> EndFail11([Kết thúc])
    Show404Err --> EndFail11
    ShowStatusErr --> EndFail11
    ShowSuccessToast --> EndSuccess11([Kết thúc thành công])
```

---

## 12. QUẢN LÝ / THEO DÕI ĐƠN HÀNG (MANAGE/TRACK ORDERS)

### 12.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách Hàng
    participant HomeUI as : Giao Diện Trang Chủ
    participant TrackingUI as : Giao diện theo dõi đơn hàng
    participant TrackingCtrl as : Điều khiển theo dõi ĐHang
    participant DB as : CSDL

    Customer ->> HomeUI: Truy cập trang chủ
    activate HomeUI
    Customer ->> HomeUI: chọn "Đơn Hàng Của Tôi"
    HomeUI ->> TrackingUI: yêu cầu gửi danh sách đơn hàng
    activate TrackingUI
    TrackingUI --> Customer: Hiển thị Danh sách đơn hàng đã mua
    deactivate HomeUI

    Customer ->> TrackingUI: chọn đơn hàng cần theo dõi
    TrackingUI ->> TrackingCtrl: yêu cầu lấy thông tin vận chuyển
    activate TrackingCtrl
    TrackingCtrl ->> TrackingCtrl: kiểm tra tính hợp lệ của MDH
    TrackingCtrl ->> DB: Truy vấn trạng thái đơn hàng
    activate DB
    DB -->> TrackingCtrl: trả về trạng thái(lịch sử, lịch sử GH)
    deactivate DB

    alt Hợp Lệ
        TrackingCtrl -->> TrackingUI: Gửi thông tin chi tiết VChuyen
        TrackingUI --> Customer: Hiển thị lộ trình Đơn Hàng
    else không tìm thấy/ lỗi hệ thống
        TrackingCtrl -->> TrackingUI: thông báo lỗi
        deactivate TrackingCtrl
        TrackingUI --> Customer: Hiển thị "Khong thể tải TT lúc này"
    end
    deactivate TrackingUI
```

### 12.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start12([Bắt đầu]) --> VisitHome[Truy cập trang chủ]
        VisitHome --> ClickMyOrders[Nhấp chọn Đơn Hàng Của Tôi]
    end
    subgraph Hệ thống
        ClickMyOrders --> ShowList[Hiển thị danh sách đơn hàng đã mua]
        ShowList --> SelectOrder[Chọn một đơn hàng cần theo dõi]
        SelectOrder --> SendTrackReq[Gửi yêu cầu lấy thông tin vận chuyển]
        SendTrackReq --> CheckMDH[Kiểm tra tính hợp lệ của mã đơn hàng MDH]
        CheckMDH --> QueryDB[Truy vấn trạng thái đơn hàng từ CSDL]
        QueryDB --> DBReturn[CSDL trả về trạng thái và lịch sử giao hàng]
        DBReturn --> CheckValid{Thông tin hợp lệ và tìm thấy?}
        CheckValid -- Có --> SendDetails[Gửi thông tin chi tiết vận chuyển về UI] --> RenderPath[Hiển thị lộ trình chi tiết của đơn hàng]
        CheckValid -- Không / Lỗi --> SendErr[Phản hồi thông báo lỗi về UI] --> ShowErrUI[Hiển thị thông báo không thể tải thông tin]
    end
    RenderPath --> EndSuccess12([Kết thúc])
    ShowErrUI  --> EndFail12([Kết thúc thất bại])
```

---

## 13. ĐÁNH GIÁ SẢN PHẨM (REVIEW PRODUCT)

### 13.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant OrdersUI as : Giao diện Lịch sử đơn hàng
    participant ReviewUI as : Giao diện Đánh giá (Modal)
    participant ReviewCtrl as : Điều khiển Đánh giá
    participant DB as : CSDL
    participant Disk as Thư mục Uploads

    Customer ->> OrdersUI: Nhấp nút "Viết đánh giá" trên đơn hàng đã hoàn thành (completed)
    activate OrdersUI
    OrdersUI ->> ReviewUI: Mở Modal Đánh giá sản phẩm
    activate ReviewUI
    ReviewUI ->> Customer: Hiển thị form đánh giá (chọn số sao 1-5, nhập bình luận, chọn ảnh tải lên)
    deactivate OrdersUI

    Customer ->> ReviewUI: Chọn số sao, nhập ý kiến & chọn các tệp ảnh -> Gửi
    alt Có chọn tải lên ảnh
        ReviewUI ->> ReviewCtrl: Tải lên các tệp ảnh đánh giá
        activate ReviewCtrl
        ReviewCtrl ->> Disk: Lưu các tệp ảnh vào thư mục /uploads/
        Disk -->> ReviewCtrl: Lưu thành công, trả về danh sách tên file
        ReviewCtrl -->> ReviewUI: Phản hồi 200 kèm các đường dẫn ảnh
        deactivate ReviewCtrl
    end

    ReviewUI ->> ReviewCtrl: Gửi yêu cầu lưu đánh giá (POST /api/reviews/submit)
    activate ReviewCtrl
    ReviewCtrl ->> DB: Kiểm tra xem đã có đánh giá cho sản phẩm thuộc đơn hàng này chưa
    activate DB
    DB -->> ReviewCtrl: Trả về đánh giá cũ (nếu có)
    deactivate DB
    alt Đã tồn tại đánh giá cũ
        ReviewCtrl -->> ReviewUI: Phản hồi 400 (Bạn đã đánh giá sản phẩm này rồi)
        ReviewUI ->> Customer: Hiển thị Toast thông báo lỗi đánh giá trùng
    else Chưa có đánh giá nào trước đó
        ReviewCtrl ->> DB: Tạo mới & lưu Review document
        activate DB
        DB -->> ReviewCtrl: Lưu đánh giá thành công
        deactivate DB
        ReviewCtrl ->> DB: Tính toán lại điểm số trung bình (averageRating) & số lượng review
        activate DB
        DB -->> ReviewCtrl: Trả về điểm trung bình mới
        deactivate DB
        ReviewCtrl ->> DB: Cập nhật averageRating và reviewCount cho Product
        activate DB
        DB -->> ReviewCtrl: Cập nhật sản phẩm thành công
        deactivate DB
        ReviewCtrl -->> ReviewUI: Phản hồi 201 (Đánh giá thành công)
        deactivate ReviewCtrl
        ReviewUI ->> ReviewUI: Đóng modal Đánh giá
        ReviewUI -->> Customer: Hiển thị Toast thông báo gửi đánh giá thành công
    end
    deactivate ReviewUI
```

### 13.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start13([Bắt đầu]) --> ViewOrders[Xem danh sách đơn hàng đã mua]
        ViewOrders --> ClickReview[Nhấp chọn Viết đánh giá trên đơn hàng completed]
        ClickReview --> OpenReviewModal[Mở Modal Đánh giá]
        OpenReviewModal --> FillReview[Chọn số sao, viết bình luận, chọn ảnh tải lên]
        FillReview --> ClickSend[Nhấn nút Gửi đánh giá]
    end
    subgraph Hệ thống
        ClickSend --> SendReviewReq[Gửi yêu cầu gửi đánh giá lên server]
        SendReviewReq --> CheckExists[Kiểm tra xem đơn hàng đã được đánh giá chưa]
        CheckExists --> AlreadyReviewed{Đã được đánh giá?}
        AlreadyReviewed -- Có --> ReturnReviewErr[Trả về lỗi 400] --> ShowReviewErr[Hiển thị Toast báo đã đánh giá rồi]
        AlreadyReviewed -- Chưa --> ImageCheck{Có tệp hình ảnh tải kèm?}
        ImageCheck -- Có --> SaveImages[Lưu tệp ảnh vào thư mục upload] --> SaveReview
        ImageCheck -- Không --> SaveReview[Tạo bản ghi Đánh giá mới trong CSDL]
        SaveReview --> CalcRating[Tính điểm trung bình mới của sản phẩm]
        CalcRating --> UpdateProductDB[Cập nhật điểm trung bình & số lượt đánh giá trong CSDL]
        UpdateProductDB --> Return201[Trả về phản hồi 201 thành công]
        Return201 --> CloseReviewModal[Đóng Modal Đánh giá]
        CloseReviewModal --> ShowSuccessToast[Hiển thị Toast gửi đánh giá thành công]
    end
    ShowReviewErr --> EndFail13([Kết thúc thất bại])
    ShowSuccessToast --> EndSuccess13([Kết thúc thành công])
```

---

## 14. TƯ VẤN ONLINE (ONLINE CONSULTATION)

### 14.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ChatUI as : Giao diện Tư vấn (Chat Panel)
    participant ConsultationCtrl as : Điều khiển Tư vấn
    participant DB as : CSDL
    participant Disk as Thư mục Uploads

    Customer ->> ChatUI: Mở hộp thoại chat hỗ trợ trực tuyến
    activate ChatUI
    ChatUI ->> ConsultationCtrl: Yêu cầu tải lịch sử chat cũ (GET /api/consultations)
    activate ConsultationCtrl
    ConsultationCtrl ->> DB: Tìm phiên chat đang mở hoặc mới nhất của người dùng
    activate DB
    DB -->> ConsultationCtrl: Trả về lịch sử phiên chat (mảng tin nhắn)
    deactivate DB
    ConsultationCtrl -->> ChatUI: Trả về mảng các tin nhắn cũ
    deactivate ConsultationCtrl
    ChatUI -->> Customer: Render tin nhắn cũ lên khung chat

    Customer ->> ChatUI: Nhập tin nhắn mới, có thể đính kèm ảnh hoặc thông tin đơn hàng -> Nhấn "Gửi"
    alt Có chọn tệp ảnh đính kèm
        ChatUI ->> ConsultationCtrl: Tải ảnh đính kèm lên server (POST /api/products/upload)
        activate ConsultationCtrl
        ConsultationCtrl ->> Disk: Lưu tệp ảnh vào thư mục upload
        Disk -->> ConsultationCtrl: Lưu thành công, trả về tên file
        ConsultationCtrl -->> ChatUI: Trả về đường dẫn ảnh
        deactivate ConsultationCtrl
    end

    ChatUI ->> ConsultationCtrl: Gửi tin nhắn mới (POST /api/consultations)
    activate ConsultationCtrl
    ConsultationCtrl ->> DB: Tìm bản ghi Consultation của user có status='open'
    activate DB
    DB -->> ConsultationCtrl: Trả về bản ghi (hoặc null nếu chưa có)
    deactivate DB
    alt Chưa có phiên chat nào đang mở ('open')
        ConsultationCtrl ->> DB: Tạo bản ghi Consultation mới với status='open'
        activate DB
        DB -->> ConsultationCtrl: Đã tạo bản ghi
        deactivate DB
    end

    ConsultationCtrl ->> DB: Đẩy tin nhắn mới của khách hàng vào mảng messages
    activate DB
    DB -->> ConsultationCtrl: Lưu thành công
    deactivate DB
    ConsultationCtrl -->> ChatUI: Phản hồi 200 kèm tin nhắn mới tạo
    deactivate ConsultationCtrl
    ChatUI ->> ChatUI: Render tin nhắn mới lên giao diện chat<br>Cuộn xuống cuối khung chat
    ChatUI -->> Customer: Hoàn thành gửi tin nhắn
    deactivate ChatUI
```

### 14.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start14([Bắt đầu]) --> OpenChatPanel[Mở khung chat trực tuyến]
    end
    subgraph Hệ thống
        OpenChatPanel --> CallGetHistory[Gọi API lấy lịch sử tin nhắn cũ]
        CallGetHistory --> QueryChatDB[Server truy vấn CSDL tìm phiên chat]
        QueryChatDB --> RenderHistory[Trả về mảng tin nhắn và render lên khung chat]
    end
    subgraph Khách hàng
        RenderHistory --> EnterNewMessage[Nhập tin nhắn mới, chọn tệp đính kèm]
        EnterNewMessage --> ClickSendMsg[Nhấn nút Gửi]
    end
    subgraph Hệ thống
        ClickSendMsg --> CheckAttachment{Có tệp đính kèm?}
        CheckAttachment -- Có --> UploadImage[Tải hình ảnh lên server] --> GetImagePath[Nhận đường dẫn ảnh] --> SendMsgAPI
        CheckAttachment -- Không --> SendMsgAPI[Gửi yêu cầu lưu tin nhắn mới lên server]
        SendMsgAPI --> FindOpenChat[Tìm phiên chat đang mở open của người dùng]
        FindOpenChat --> OpenChatExist{Đã có phiên chat open?}
        OpenChatExist -- Chưa --> CreateNewChat[Tạo phiên chat Consultation mới] --> AppendMessage
        OpenChatExist -- Có --> AppendMessage[Đẩy tin nhắn mới vào phiên chat CSDL]
        AppendMessage --> SaveChatDB[Lưu phiên chat vào CSDL]
        SaveChatDB --> ReturnSuccessRes[Trả về phản hồi 200 thành công]
        ReturnSuccessRes --> RenderNewMsg[Render tin nhắn mới lên màn hình chat]
        RenderNewMsg --> ScrollChat[Cuộn khung chat xuống dưới cùng]
    end
    ScrollChat --> End14([Kết thúc])
```

---

## 15. KHIẾU NẠI CỬA HÀNG (COMPLAINTS)

### 15.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ComplaintUI as : Giao diện Khiếu Nại
    participant ComplaintCtrl as : Điều khiển Khiếu Nại
    participant DB as : CSDL

    Customer ->> ComplaintUI: Mở mục "Khiếu nại & Phản hồi"
    activate ComplaintUI
    ComplaintUI ->> ComplaintCtrl: Yêu cầu lấy lịch sử khiếu nại cá nhân (GET /api/complaints/my-complaints/:customerId)
    activate ComplaintCtrl
    ComplaintCtrl ->> DB: Tìm danh sách khiếu nại của khách hàng (Complaint.find({ customerId }))
    activate DB
    DB -->> ComplaintCtrl: Trả về danh sách khiếu nại
    deactivate DB
    ComplaintCtrl -->> ComplaintUI: Trả về danh sách khiếu nại cũ kèm đối thoại xử lý
    deactivate ComplaintCtrl
    ComplaintUI --> Customer: Hiển thị lịch sử khiếu nại lên màn hình

    Customer ->> ComplaintUI: Nhấp nút "Gửi khiếu nại mới"
    ComplaintUI ->> Customer: Hiển thị form điền nội dung khiếu nại
    Customer ->> ComplaintUI: Chọn loại khiếu nại & Nhập mô tả lỗi -> Nhấn "Gửi khiếu nại"
    ComplaintUI ->> ComplaintCtrl: Gọi API tạo khiếu nại (POST /api/complaints)
    activate ComplaintCtrl
    ComplaintCtrl ->> DB: Tạo bản ghi Complaint mới với status='pending', priority='medium'
    activate DB
    DB -->> ComplaintCtrl: Lưu khiếu nại thành công
    deactivate DB
    ComplaintCtrl -->> ComplaintUI: Phản hồi 201 (Thêm khiếu nại thành công)
    deactivate ComplaintCtrl
    ComplaintUI ->> ComplaintUI: Cập nhật thêm khiếu nại mới vào danh sách hiển thị
    ComplaintUI --> Customer: Hiển thị Toast thông báo gửi khiếu nại thành công, vui lòng chờ xử lý
    deactivate ComplaintUI
```

### 15.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start15([Bắt đầu]) --> OpenComplaintUI[Mở giao diện khiếu nại]
    end
    subgraph Hệ thống
        OpenComplaintUI --> CallGetComplaints[Gọi API lấy lịch sử khiếu nại cá nhân]
        CallGetComplaints --> QueryComplaintDB[Truy vấn CSDL tìm khiếu nại của khách]
        QueryComplaintDB --> RenderComplaints[Render danh sách khiếu nại lên màn hình]
    end
    subgraph Khách hàng
        RenderComplaints --> ClickCreateComplaint[Chọn gửi khiếu nại mới]
        ClickCreateComplaint --> ShowForm[Hiển thị form nhập liệu]
        ShowForm --> InputComplaint[Chọn loại khiếu nại, điền mô tả]
        InputComplaint --> ClickSendComplaint[Nhấn nút Gửi khiếu nại]
    end
    subgraph Hệ thống
        ClickSendComplaint --> SendComplaintAPI[Gửi yêu cầu tạo khiếu nại lên server]
        SendComplaintAPI --> CreateComplaintDoc[Tạo đối tượng khiếu nại mới status pending vào CSDL]
        CreateComplaintDoc --> SaveComplaintDB[Lưu khiếu nại vào CSDL]
        SaveComplaintDB --> ReturnSuccess201[Trả về phản hồi 201 thành công]
        ReturnSuccess201 --> RenderNewComplaint[Cập nhật thêm khiếu nại vào danh sách hiển thị]
        RenderNewComplaint --> ShowComplaintToast[Hiển thị Toast báo gửi khiếu nại thành công, chờ giải quyết]
    end
    ShowComplaintToast --> End15([Kết thúc])
```

---

## 16. QUẢN LÝ THÔNG TIN CÁ NHÂN (PROFILE MANAGEMENT)

### 16.1. Biểu đồ tuần tự
```mermaid
sequenceDiagram
    autonumber
    actor Customer as Khách hàng
    participant ProfileUI as : Giao diện Hồ Sơ
    participant ProfileCtrl as : Điều khiển Hồ Sơ
    participant DB as : CSDL

    Customer ->> ProfileUI: Truy cập trang cá nhân (Hồ sơ khách hàng)
    activate ProfileUI
    ProfileUI ->> ProfileCtrl: Yêu cầu lấy thông tin cá nhân (userId)
    activate ProfileCtrl
    ProfileCtrl ->> DB: Lấy thông tin chi tiết khách hàng (User)
    activate DB
    DB -->> ProfileCtrl: Trả về tài liệu User của khách hàng
    deactivate DB
    ProfileCtrl -->> ProfileUI: Phản hồi dữ liệu thông tin cá nhân
    deactivate ProfileCtrl
    ProfileUI ->> Customer: Hiển thị thông tin cá nhân & danh sách địa chỉ nhận hàng

    opt Cập nhật thông tin cá nhân cơ bản
        Customer ->> ProfileUI: Thay đổi thông tin cá nhân (fullName, phone, avatar, gender, birthDate)
        Customer ->> ProfileUI: Nhấn nút "Lưu Hồ Sơ"
        ProfileUI ->> ProfileCtrl: Gửi thông tin cập nhật (userId, updateData)
        activate ProfileCtrl
        
        alt Dữ liệu không hợp lệ (Ví dụ: Họ tên hoặc Số điện thoại trống)
            ProfileCtrl -->> ProfileUI: Phản hồi lỗi 400 (Dữ liệu đầu vào không hợp lệ)
            ProfileUI ->> Customer: Hiển thị Toast thông báo lỗi cập nhật
        else Dữ liệu hợp lệ
            ProfileCtrl ->> DB: Cập nhật thông tin vào bảng User
            activate DB
            DB -->> ProfileCtrl: Trả về thông tin User mới đã cập nhật
            deactivate DB
            ProfileCtrl -->> ProfileUI: Phản hồi 200 (Cập nhật thông tin thành công)
            deactivate ProfileCtrl
            ProfileUI ->> Customer: Hiển thị Toast thông báo thành công & cập nhật lại giao diện
        end
    end

    opt Quản lý sổ địa chỉ giao hàng (Thêm địa chỉ mới)
        Customer ->> ProfileUI: Nhấp chọn nút "Thêm Địa Chỉ Mới"
        ProfileUI ->> Customer: Hiển thị Form nhập địa chỉ giao hàng
        Customer ->> ProfileUI: Nhập thông tin địa chỉ mới (fullName, phone, province, district, ward, detail)
        Customer ->> ProfileUI: Nhấn nút "Lưu Địa Chỉ"
        ProfileUI ->> ProfileCtrl: Gửi yêu cầu thêm địa chỉ (userId, addressData)
        activate ProfileCtrl
        ProfileCtrl ->> DB: Đẩy (push) địa chỉ mới vào mảng addresses của User
        activate DB
        DB -->> ProfileCtrl: Xác nhận lưu thành công
        deactivate DB
        ProfileCtrl -->> ProfileUI: Phản hồi 200 (Thêm địa chỉ thành công)
        deactivate ProfileCtrl
        ProfileUI ->> Customer: Hiển thị Toast thành công & cập nhật danh sách địa chỉ
    end
    deactivate ProfileUI
```

### 16.2. Biểu đồ hoạt động
```mermaid
flowchart TD
    subgraph Khách hàng
        Start16([Bắt đầu]) --> OpenProfileUI[Truy cập trang Cá Nhân]
    end
    subgraph Hệ thống
        OpenProfileUI --> SendProfileReq[Gửi yêu cầu lấy thông tin cá nhân lên Server]
        SendProfileReq --> QueryProfileDB[Truy vấn thông tin tài khoản khách hàng từ User CSDL]
        QueryProfileDB --> DisplayProfileUI[Hiển thị thông tin cá nhân & danh sách địa chỉ giao hàng]
    end
    subgraph Khách hàng
        DisplayProfileUI --> ChooseProfileAction{Chọn thao tác muốn thực hiện?}
        ChooseProfileAction -- Cập nhật thông tin cơ bản --> EditInfo[Chỉnh sửa thông tin cá nhân]
        EditInfo --> ClickSaveInfo[Nhấn nút Lưu Hồ Sơ]
        
        ChooseProfileAction -- Thêm địa chỉ mới --> ClickNewAddress[Nhấn chọn nút Thêm Địa Chỉ Mới]
        ClickNewAddress --> FillAddressForm[Nhập thông tin địa chỉ giao hàng mới]
        FillAddressForm --> ClickSaveAddress[Nhấn nút Lưu Địa Chỉ]
    end
    subgraph Hệ thống
        ClickSaveInfo --> SendSaveInfoAPI[Gửi yêu cầu lưu thông tin lên Server]
        SendSaveInfoAPI --> CheckInfoInputs{Họ tên hoặc Số điện thoại trống?}
        CheckInfoInputs -- Có --> ReturnInfoErr[Trả về lỗi dữ liệu không hợp lệ 400] --> ShowInfoErr[Hiển thị Toast báo lỗi]
        CheckInfoInputs -- Không --> UpdateInfoDB[Cập nhật dữ liệu vào User CSDL]
        UpdateInfoDB --> ReturnInfoSuccess[Trả về phản hồi cập nhật thành công 200]
        ReturnInfoSuccess --> RefreshInfoUI[Cập nhật giao diện và hiển thị Toast thành công]
        
        ClickSaveAddress --> SendSaveAddressAPI[Gửi thông tin địa chỉ mới lên Server]
        SendSaveAddressAPI --> SaveAddressDB[Thêm địa chỉ vào mảng addresses của User trong CSDL]
        SaveAddressDB --> ReturnAddressSuccess[Trả về phản hồi thêm thành công 200]
        ReturnAddressSuccess --> RefreshAddressUI[Cập nhật lại danh sách địa chỉ và hiển thị Toast thành công]
    end
    ShowInfoErr --> EndFail16([Kết thúc thất bại])
    RefreshInfoUI --> EndSuccess16([Kết thúc thành công])
    RefreshAddressUI --> EndSuccess16
```

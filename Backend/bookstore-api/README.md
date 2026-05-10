# BookStore - Hệ Thống Thương Mại Điện Tử Sách Cao Cấp

Chào mừng đến với phiên bản nâng cấp toàn diện của hệ thống **BookStore**. Đây là một nền tảng thương mại điện tử hiện đại, tập trung vào trải nghiệm người dùng cao cấp, thiết kế tinh tế và các tính năng quản trị mạnh mẽ.

## 🌟 Tính Năng Nổi Bật

### 1. Trải Nghiệm Khách Hàng (Frontend)
- **Thiết kế Premium**: Giao diện mới với tông màu Blue & Slate, hiệu ứng Glassmorphism và Typography hiện đại.
- **Tìm kiếm Thông minh**: Hệ thống auto-suggest thời gian thực giúp người dùng tìm sách nhanh chóng.
- **Bộ lọc Nâng cao**: Lọc sản phẩm theo khoảng giá, đánh giá sao, định dạng bìa và danh mục.
- **Trang Sản phẩm Chi tiết**: 
    - Xem ảnh độ phân giải cao với gallery tương tác.
    - Tính năng **Đọc thử (Read Trial)** một vài trang sách.
    - Hệ thống bình luận và đánh giá từ độc giả.
- **Trung tâm Tài khoản**: 
    - Quản lý hồ sơ cá nhân.
    - Sổ địa chỉ (Address Book) lưu nhiều địa chỉ nhận hàng.
    - Danh sách yêu thích (Wishlist).
    - Theo dõi lịch sử đơn hàng.

### 2. Giỏ Hàng & Thanh Toán
- **Hệ thống Voucher**: Áp dụng mã giảm giá trực tiếp trong giỏ hàng.
- **Thanh toán Đa phương thức**: Hỗ trợ giao diện COD, Chuyển khoản Ngân hàng và Ví MoMo.
- **Quản lý Giỏ hàng**: Tăng/giảm số lượng, chọn tất cả, xóa nhanh sản phẩm.

### 3. Quản Trị Hệ Thống (Admin Panel)
- **Dashboard Tổng quan**: Biểu đồ doanh thu (Chart.js), thống kê đơn hàng và khách hàng mới.
- **Quản lý Kho hàng**: CRUD (Thêm/Sửa/Xóa) Sách và Danh mục sản phẩm chuyên nghiệp.
- **Quản lý Đơn hàng**: Theo dõi trạng thái và xử lý đơn hàng tập trung.

## 🛠 Công Nghệ Sử Dụng
- **Frontend**: HTML5, Vanilla CSS (Premium Style), Javascript (ES6+).
- **Thư viện**: 
    - [FontAwesome 6](https://fontawesome.com/) cho Icon.
    - [Chart.js](https://www.chartjs.org/) cho biểu đồ thống kê.
    - [Inter/Outfit Fonts](https://fonts.google.com/) cho typography.
- **API**: Kết nối với Backend thông qua các endpoints đã được chuẩn hóa.

## 📁 Cấu Trúc Thư Mục (FE)
```
FE/
├── css/
│   ├── style.css           # Global Design System
│   ├── admin.css           # Admin Dashboard Styles
│   ├── profile.css         # Account Center Styles
│   └── ...                 # Các CSS component khác
├── js/
│   ├── config.js           # API Endpoints & Configuration
│   ├── main.js             # Global Helpers & Search Logic
│   ├── admin.js            # Admin Dashboard Logic
│   ├── profile.js          # Account Management Logic
│   └── ...                 # Các JS logic khác
├── index.html              # Trang chủ
├── product-detail.html     # Trang chi tiết sách
├── category.html           # Trang danh sách & lọc
├── cart.html               # Giỏ hàng
├── checkout.html           # Thanh toán
├── profile.html            # Trang cá nhân
└── admin-books.html        # Trang quản trị tập trung
```

## 📝 Nhật Ký Cập Nhật (V2.0)
- ✅ Đại tu toàn bộ CSS sang hệ thống thiết kế Blue & Slate.
- ✅ Tích hợp thanh tìm kiếm thông minh và gợi ý tự động.
- ✅ Xây dựng lại trang cá nhân với Sidebar và Sổ địa chỉ.
- ✅ Cải tiến giỏ hàng hỗ trợ Voucher và chọn lọc sản phẩm.
- ✅ Nâng cấp trang Admin thành Dashboard tổng hợp với biểu đồ.

---
*Dự án được phát triển bởi Antigravity AI - Google DeepMind.*

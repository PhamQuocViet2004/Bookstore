# Hướng Dẫn Tích Hợp API Cho Backend (V2.0)

Để hỗ trợ các tính năng mới trên Frontend, Backend cần cập nhật hoặc thêm mới các Endpoints sau đây. Tất cả các phản hồi nên theo định dạng JSON chuẩn.

## 1. Người dùng & Hồ sơ (User & Profile)
### Cập nhật thông tin cá nhân
- **Endpoint**: `PUT /api/users/profile` (hoặc endpoint tương đương trong `config.js`)
- **Body**: `{ fullName, phone, dob }`
- **Yêu cầu**: Cập nhật thông tin và trả về object user mới.

### Quản lý Sổ địa chỉ (Address Book)
- **Lấy danh sách**: `GET /api/addresses` -> Trả về mảng các địa chỉ của user.
- **Thêm mới**: `POST /api/addresses` -> Body: `{ name, phone, detail, district, city, isDefault }`
- **Cập nhật**: `PUT /api/addresses/:id`
- **Xóa**: `DELETE /api/addresses/:id`

## 2. Danh sách yêu thích (Wishlist)
- **Lấy danh sách**: `GET /api/wishlist` -> Trả về mảng các sách user đã lưu.
- **Thêm vào wishlist**: `POST /api/wishlist` -> Body: `{ bookId }`
- **Xóa khỏi wishlist**: `DELETE /api/wishlist/:bookId`

## 3. Khuyến mãi & Voucher
- **Kiểm tra mã**: `GET /api/vouchers/validate?code=XXXX`
- **Trả về**: 
  ```json
  {
    "valid": true,
    "type": "percent | fixed",
    "value": 10, 
    "message": "Áp dụng thành công"
  }
  ```

## 4. Tìm kiếm & Lọc (Search & Filter)
- **Tìm kiếm gợi ý**: `GET /api/books?search=...&limit=5`
- **Lọc nâng cao**: Cập nhật `GET /api/books` để nhận thêm các params:
  - `minPrice`, `maxPrice`
  - `categoryId`
  - `sortBy` (newest, price-asc, price-desc, best-seller)

## 5. Quản trị (Admin Dashboard)
- **Thống kê tổng quan**: `GET /api/admin/stats`
- **Trả về**:
  ```json
  {
    "revenueMonth": 45000000,
    "newOrders": 12,
    "newUsers": 8,
    "lowStockCount": 5,
    "revenueChart": [1.2, 1.9, 3, 5, 2, 8, 10] 
  }
  ```
- **Quản lý đơn hàng**: `GET /api/admin/orders` và `PUT /api/admin/orders/:id/status`.

## 6. Lưu ý chung
- **CORS**: Đảm bảo Backend cho phép các phương thức `GET, POST, PUT, DELETE` và hỗ trợ `credentials: include`.
- **Authentication**: Tất cả các API người dùng/admin cần kiểm tra Token trong Header `Authorization: Bearer <token>`.

---
*Vui lòng tham khảo tệp `FE/js/config.js` để biết các đường dẫn endpoint mà Frontend đang gọi.*

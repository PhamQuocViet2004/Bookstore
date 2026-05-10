# Hướng dẫn Tích hợp & Trạng thái Hệ thống (Dành cho Team Backend & Database)

Tài liệu này cập nhật trạng thái mới nhất của hệ thống sau khi đã hoàn thiện các tính năng nâng cao (Chat Realtime, Thông báo, Bảo mật). Tài liệu giúp Team BE nắm bắt các thay đổi quan trọng trong logic xử lý và cấu trúc API.

---

## 1. Cấu hình Kết nối & Xác thực
- **Cấu hình API (`js/config.js`):** FE sử dụng hằng số tập trung. BE cần đảm bảo các Endpoint khớp với định nghĩa trong file này.
- **Xác thực (`Bearer Token`):** Mọi request từ FE đều tự động đính kèm Token trong Header `Authorization`. BE cần sử dụng `authMiddleware` để giải mã và lấy thông tin `req.user`.

---

## 2. Hệ thống Chat cộng tác (Collaborative Support Chat)
Đây là thay đổi lớn nhất trong đợt cập nhật này:
- **Logic Backend (`messageController.js` & `server.js`):**
    - Tất cả Admin/Librarian hiện tại đều dùng chung một `admin_room`. 
    - Khi khách hàng nhắn tin, thông báo sẽ được phát (`broadcast`) tới toàn bộ Admin online.
    - **Cơ chế đếm tin nhắn (`unreadCount`):** Backend đã được cập nhật để đếm tổng số tin nhắn chưa đọc từ một khách hàng gửi tới **BẤT KỲ** admin nào trong hệ thống, đảm bảo mọi admin đều thấy số lượng phản hồi đang chờ.
- **API Đánh dấu đã đọc:** Khi một admin chọn xem hội thoại, hệ thống sẽ gọi `PATCH /messages/mark-read/:userId`. Backend cần cập nhật trạng thái `isRead` cho tất cả tin nhắn từ khách hàng đó gửi tới Team Admin.

---

## 3. Hệ thống Thông báo (Real-time Notifications)
- **Socket.io:** Đã cấu hình đồng bộ hóa trạng thái thông báo.
- **Admin Badges:** FE đã hiển thị các dấu chấm đỏ thông báo (`adminChatDot`, `adminOrderDot`) dựa trên dữ liệu thực tế từ Backend:
    - `adminOrderDot`: Hiển thị khi có đơn hàng ở trạng thái `pending`.
    - `adminChatDot`: Hiển thị dựa trên tổng `unreadCount` từ danh sách đối tác chat.

---

## 4. Quản lý Tài khoản & Bảo mật
- **Đổi mật khẩu (`POST /auth/change-password`):** 
    - FE đã tích hợp xong luồng này.
    - Body gửi lên: `{ oldPassword, newPassword }`.
    - Backend xử lý: Kiểm tra mật khẩu cũ bằng `bcrypt.compare`, sau đó mã hóa mật khẩu mới bằng `bcrypt.hash` trước khi lưu vào bảng `Accounts`.
- **Cập nhật Profile (`PUT /auth/me`):** FE gửi đầy đủ `{ fullName, phone, address, dob, avatar }`. Backend đã hỗ trợ cập nhật vào bảng `Users`.

---

## 5. Danh mục & Sản phẩm (E-commerce Core)
- **Tìm kiếm & Lọc:** FE gọi `GET /books` với đầy đủ các tham số `search`, `categoryId`, `minPrice`, `maxPrice`, `sortBy`. 
- **SEO & Marketing:** 
    - FE đã sử dụng trường `slug` để tạo URL thân thiện.
    - Đã tích hợp các thẻ Meta SEO và thẻ Open Graph (OG) cho trang chi tiết sản phẩm để hỗ trợ chia sẻ lên mạng xã hội (Facebook, Zalo).

---

## 6. Lưu ý cho Team Backend khi tiếp nhận (HÀNH ĐỘNG NGAY)
1. **Cấu hình CORS:** BE cần cho phép Origin từ máy của FE (ví dụ: `http://localhost:5500` hoặc IP cụ thể) và bật `AllowCredentials`.
2. **Database Dump:** Đã đính kèm tệp **`dump (1).sql`**. Vui lòng Import tệp này vào MySQL để có đầy đủ dữ liệu mẫu và cấu trúc bảng mới nhất.
3. **Môi trường (.env):** Hãy cập nhật các thông số `DB_HOST`, `DB_USER`, `DB_PASS`, `JWT_SECRET` và `CLOUDINARY_URL` (để upload ảnh) trong tệp `.env`.
4. **Socket.io Server:** Đảm bảo Server Socket chạy cùng cổng với API hoặc đã được cấu hình CORS đúng để FE kết nối được vào `admin_room`.

---

## 7. Các điểm đã hoàn thiện 100%
- [x] Đăng nhập/Đăng ký/Profile.
- [x] Giỏ hàng/Đồng bộ giỏ hàng Session.
- [x] Quản lý đơn hàng (Admin & User).
- [x] Chat hỗ trợ thời gian thực (Multi-admin).
- [x] Hệ thống thông báo tự động.
- [x] Đánh giá sách & Đánh giá cửa hàng.
- [x] Đổi mật khẩu & Cập nhật Avatar (Cloudinary).

**Người cập nhật:** Antigravity AI
**Ngày cập nhật:** 10/05/2026
**Trạng thái:** Hệ thống đã sẵn sàng 100% để vận hành thực tế.

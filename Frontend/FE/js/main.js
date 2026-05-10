// main.js - Smart Search + Global Utils
/**
 * Hàm tìm kiếm chính - Chuyển sang trang category
 */
function search() {
    const keyword = document.getElementById("searchInput").value.toLowerCase().trim();
    if (!keyword) {
        alert("Vui lòng nhập từ khóa tìm kiếm!");
        return;
    }
    // Ẩn hộp gợi ý khi bắt đầu tìm kiếm
    const box = document.getElementById("suggestBox");
    if (box) box.style.display = "none";
    
    window.location.href = `category.html?search=${encodeURIComponent(keyword)}`;
}

/**
 * (Đã gỡ bỏ tính năng gợi ý theo yêu cầu để giao diện gọn gàng hơn)
 */

/**
 * Thêm sách vào giỏ hàng qua API
 */
async function addToCart(id, title, price, image, discount) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: id, quantity: 1 })
        });

        if (response.ok) {
            if (confirm("Đã thêm vào giỏ hàng thành công! Bạn có muốn đi đến giỏ hàng không?")) {
                window.location.href = "cart.html";
            }
        } else {
            const result = await response.json();
            alert("Lỗi: " + (result.message || "Không thể thêm vào giỏ hàng"));
        }
    } catch (error) {
        console.error("Cart Error:", error);
        alert("Có lỗi xảy ra khi kết nối tới máy chủ.");
    }
}

/**
 * Helper to calculate final price after discount (Point 15)
 */
function calculateFinalPrice(price, discount = 0) {
    return Math.round(price * (1 - (discount / 100)));
}

/**
 * Helper to format price with VND currency
 */
function formatPrice(amount) {
    return (amount || 0).toLocaleString() + "đ";
}

/**
 * Global helper to render a single book card with Deal support
 */
function renderBookCard(book) {
    const now = new Date().getTime();
    const dealStart = book.dealStartTime ? new Date(book.dealStartTime).getTime() : 0;
    const dealEnd = book.dealEndTime ? new Date(book.dealEndTime).getTime() : 0;
    const isSoldOut = book.dealSold >= book.dealQuantity;
    const isUpcoming = dealStart > now;
    const isEnded = dealEnd > 0 && now > dealEnd;
    const hasDeal = (book.discount > 0 || book.isDeal) && dealEnd > 0 && !isEnded;

    let statusOverlay = "";
    if (isSoldOut) {
        statusOverlay = `<div class="deal-status-overlay"><span class="deal-status-badge">Đã hết deal</span></div>`;
    } else if (isUpcoming) {
        statusOverlay = `<div class="deal-status-overlay"><span class="deal-status-badge">Sắp diễn ra</span></div>`;
    }

    const salePrice = calculateFinalPrice(book.price, book.discount || 0);
    const progressPercent = hasDeal ? Math.min((book.dealSold / book.dealQuantity) * 100, 100) : 0;

    return `
    <div class="book ${hasDeal ? 'has-deal' : ''}" data-id="${book.id}">
        <div style="position:relative; overflow:hidden; border-radius:12px;">
            <img src="${book.image || 'image/logo/logo.png'}" alt="${book.title}" onerror="this.src='image/logo/logo.png'">
            ${book.discount > 0 ? `<div class="discount-badge">-${book.discount}%</div>` : ''}
            
            <!-- Nút yêu thích ở góc ảnh -->
            <button class="wishlist-float-btn" onclick="toggleWishlist(${book.id}); event.stopPropagation();">
                <i class="fa-regular fa-heart"></i>
            </button>

            ${hasDeal && !isEnded && !isUpcoming && !isSoldOut ? `<div class="deal-timer" data-end="${dealEnd}">Kết thúc sau: --:--:--</div>` : ''}
            ${statusOverlay}
        </div>
        
        <h4>${book.title}</h4>
        
        <div class="book-price-box">
            <span class="sale">${formatPrice(salePrice)}</span>
            <span class="old-price">${formatPrice(book.price)}</span>
        </div>

        ${hasDeal ? `
            <div class="deal-progress-container">
                <div class="deal-progress-bar">
                    <div class="deal-progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="deal-progress-text">
                    <span>Đã bán: ${book.dealSold || 0}</span>
                    <span>Tồn deal: ${book.dealQuantity || 0}</span>
                </div>
            </div>
        ` : ''}

        <div class="book-actions">
            ${isUpcoming ? `
                <button class="btn-detail btn-remind" onclick="alert('Chúng tôi sẽ thông báo cho bạn khi deal bắt đầu!')"><i class="fa-solid fa-bell"></i> Nhắc tôi</button>
            ` : `
                <button class="btn-detail" onclick="location.href='product-detail.html?id=${book.id}'">Chi tiết</button>
                <button class="btn-add-cart ${isSoldOut ? 'btn-upcoming' : ''}" 
                    ${isSoldOut ? 'disabled' : ''} 
                    onclick="addToCartWithLimit(${book.id}, ${book.maxPerUser || 2})">
                    <i class="fa-solid fa-cart-plus"></i>
                </button>
            `}
        </div>
    </div>
    `;
}

/**
 * Handle purchase limit logic
 */
async function addToCartWithLimit(id, limit) {
    // In a real app, check session/user history first
    // For now, simple limit check
    console.log(`Adding book ${id} with max limit ${limit}`);
    addToCart(id);
}

/**
 * Countdown timer loop
 */
function updateDealTimers() {
    const timers = document.querySelectorAll(".deal-timer");
    const now = new Date().getTime();

    timers.forEach(timer => {
        const endTime = parseInt(timer.getAttribute("data-end"));
        const diff = endTime - now;

        if (diff <= 0) {
            timer.innerHTML = "Deal đã kết thúc";
            // Optional: refresh page or change UI
            return;
        }

        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        timer.innerHTML = `Kết thúc sau: ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    });
}

/**
 * Thêm/Xóa khỏi danh sách yêu thích
 */
async function toggleWishlist(id) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.WISHLIST), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId: id })
        });
        if (response.ok) {
            const result = await response.json();
            
            // Tìm tất cả các nút wishlist của sách này để đổi icon
            const btns = document.querySelectorAll(`.book[data-id="${id}"] .wishlist-float-btn i, .btn-wishlist i`);
            btns.forEach(btn => {
                if (result.message.includes("Đã thêm")) {
                    btn.classList.replace("fa-regular", "fa-solid");
                    btn.parentElement.classList.add("active");
                } else {
                    btn.classList.replace("fa-solid", "fa-regular");
                    btn.parentElement.classList.remove("active");
                }
            });

            // Nếu đang ở trang profile tab wishlist thì load lại
            if (typeof loadWishlist === 'function') loadWishlist();
            
            alert(result.message || "Đã cập nhật danh sách yêu thích!");
        }
    } catch (e) { console.error(e); }
}

/**
 * Tải danh sách Deal Hot
 */
/**
 * Tải danh sách Deal Hot có phân trang tại chỗ
 */
async function loadTopDeals(page = 1) {
    const list = document.getElementById("topDealList");
    const paginContainer = document.getElementById("topDealPagination");
    if (!list) return;
    
    // Giới hạn 5 cuốn mỗi trang để vừa 1 hàng
    const limit = 5;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + `?hasDiscount=true&page=${page}&limit=${limit}`));
        if (response.ok) {
            const result = await response.json();
            const books = result.data || [];
            const pagination = result.pagination || {};
            
            // Dùng dữ liệu thực từ Backend (Point 16)
            const booksWithDeals = books.map(b => ({
                ...b,
                isDeal: true, // Mark as deal for UI
                dealStartTime: b.createdAt, // Fallback
                dealEndTime: new Date(new Date(b.createdAt).getTime() + 1000 * 60 * 60 * 24).getTime(), // Fallback: 24 hours from creation
                dealQuantity: (b.stock || 0) + (b.sold || 0),
                dealSold: b.sold || 0,
                maxPerUser: 5
            }));

            if (booksWithDeals.length > 0) {
                list.innerHTML = booksWithDeals.map(b => renderBookCard(b)).join("");
                
                // Render nút điều hướng Prev/Next
                if (paginContainer) {
                    paginContainer.innerHTML = `
                        <button onclick="loadTopDeals(${page - 1})" class="pagination-btn ${page === 1 ? 'disabled' : ''}" ${page === 1 ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <span style="font-weight:700; color:var(--primary); align-self:center; font-size:14px">${page}/${pagination.totalPages || 4}</span>
                        <button onclick="loadTopDeals(${page + 1})" class="pagination-btn ${page >= pagination.totalPages ? 'disabled' : ''}" ${page >= pagination.totalPages ? 'disabled' : ''}>
                            <i class="fa-solid fa-chevron-right"></i>
                        </button>
                    `;
                }
            } else {
                list.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted)'>Hiện chưa có deal nào đang diễn ra.</p>";
            }
        }
    } catch (e) { console.error(e); }
}

/**
 * Tải tất cả sách có phân trang
 */
async function loadAllBooks(page = 1) {
    const list = document.getElementById("allBooksList");
    const paginContainer = document.getElementById("pagination");
    if (!list) return;

    list.innerHTML = '<div class="loading" style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải sách...</div>';
    
    const sortBy = document.getElementById("sortBy") ? document.getElementById("sortBy").value : 'newest';
    const limit = 10;

    try {
        const url = getFullUrl(CONFIG.ENDPOINTS.BOOKS + `?page=${page}&limit=${limit}&sortBy=${sortBy}`);
        const response = await apiFetch(url);
        
        if (response.ok) {
            const result = await response.json();
            const books = result.data || [];
            const pagination = result.pagination || {};

            if (books.length > 0) {
                list.innerHTML = books.slice(0, limit).map(b => renderBookCard(b)).join("");
                renderPagination(pagination, "loadAllBooks");
            } else {
                list.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Không tìm thấy sách nào.</p>";
                paginContainer.innerHTML = "";
            }
        }
    } catch (e) { console.error(e); }
}

/**
 * Tải danh mục vào Sidebar
 */
async function loadCategoriesSidebar() {
    const nav = document.querySelector(".category nav");
    if (!nav) return;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CATEGORIES));
        if (response.ok) {
            const result = await response.json();
            const categories = result.data || result || [];
            
            if (categories.length > 0) {
                nav.innerHTML = categories.map(cat => `
                    <a href="category.html?categoryId=${cat.id}">
                        <i class="fa-solid fa-chevron-right" style="font-size:10px; margin-right:8px; opacity:0.5"></i>
                        ${cat.name}
                    </a>
                `).join("");
            }
        }
    } catch (e) { console.error(e); }
}

/**
 * Render bộ nút phân trang
 */
function renderPagination(pagination, functionName) {
    const container = document.getElementById("pagination");
    if (!container) return;

    const { currentPage, totalPages } = pagination;
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    
    // Nút Previous
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" 
             ${currentPage === 1 ? 'disabled' : ''} 
             onclick="${functionName}(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
                     onclick="${functionName}(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }

    // Nút Next
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" 
             ${currentPage === totalPages ? 'disabled' : ''} 
             onclick="${functionName}(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

// Bắt sự kiện Enter & Khởi tạo
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keyup", (e) => {
            if (e.key === "Enter") search();
        });
    }
    updateDealTimers();
    // Cập nhật đồng hồ mỗi giây
    setInterval(updateDealTimers, 1000);
    
    // Tải dữ liệu ban đầu
    loadTopDeals(1);
    loadAllBooks(1);

    // Khởi tạo thông báo nếu đã đăng nhập
    if (localStorage.getItem("userToken")) {
        const notifWrapper = document.getElementById("notifWrapper");
        if (notifWrapper) {
            notifWrapper.style.display = "block";
            loadNotifications();
        }
    }

    // Đóng dropdown khi click ngoài
    document.addEventListener("click", function(e) {
        const wrapper = document.getElementById("notifWrapper");
        const dropdown = document.getElementById("notifDropdown");
        if (wrapper && dropdown && !wrapper.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });
});

async function loadNotifications() {
    const list = document.getElementById("notifList");
    const countEl = document.getElementById("notifCount");
    if (!list) return;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.NOTIFICATIONS));
        if (response.ok) {
            const notifications = await response.json();
            const unreadCount = notifications.filter(n => !n.isRead).length;

            if (unreadCount > 0) {
                countEl.textContent = unreadCount;
                countEl.style.display = "flex";
            } else {
                countEl.style.display = "none";
            }

            if (notifications.length === 0) {
                list.innerHTML = '<p style="padding: 15px; text-align: center; color: #64748b; font-size: 13px;">Không có thông báo mới.</p>';
                return;
            }

            list.innerHTML = notifications.map(n => `
                <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="markNotifAsRead(${n.id}, ${n.relatedId})">
                    <div class="notif-item-title">${n.title}</div>
                    <div class="notif-item-message">${n.message}</div>
                    <div class="notif-item-time">${new Date(n.createdAt).toLocaleString()}</div>
                </div>
            `).join("");
        }
    } catch (err) { console.error("Lỗi load thông báo:", err); }
}

function toggleNotifDropdown() {
    const dropdown = document.getElementById("notifDropdown");
    if (dropdown) dropdown.classList.toggle("show");
}

async function markNotifAsRead(id, relatedId) {
    try {
        await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.NOTIFICATIONS}/${id}/read`), { method: 'PATCH' });
        loadNotifications();
        
        if (relatedId) {
            window.location.href = `my-orders.html?id=${relatedId}`;
        }
    } catch (err) { console.error(err); }
}

async function markAllNotifAsRead() {
    try {
        await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.NOTIFICATIONS}/read-all`), { method: 'POST' });
        loadNotifications();
    } catch (err) { console.error(err); }
}

// =======================
// REALTIME SOCKET
// =======================
let socket;
document.addEventListener("DOMContentLoaded", function() {
    initSocket();
});

function initSocket() {
    try {
        if (typeof io === 'undefined') return;

        socket = io(CONFIG.SOCKET_URL);

        socket.on('connect', () => {
            const userStr = localStorage.getItem('userInfo');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    socket.emit('join', user.id);
                    
                    // Nếu là Admin, tham gia thêm phòng admin để nhận tin nhắn chat
                    if (user.role === 'admin' || user.role === 'librarian') {
                        socket.emit('joinAdmin', user.id);
                        console.log("Admin Realtime: Đã tham gia phòng hỗ trợ");
                    }
                }
            }
        });

        socket.on('receiveMessage', (msg) => {
            // Hiện chấm đỏ ở nút Quản trị trên Header
            const badge = document.getElementById("adminChatBadge");
            if (badge) badge.style.display = "block";
        });

        socket.on('notification', (data) => {
            // console.log("Realtime: Có thông báo mới!", data);
            
            // Hiển thị thông báo trình duyệt (nếu được phép)
            if (Notification.permission === "granted") {
                new Notification(data.title, { body: data.message });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }

            // Tải lại chuông thông báo nếu có hàm tương ứng
            if (typeof loadNotifications === 'function') {
                loadNotifications();
            }
        });

    } catch (err) {
        console.error("Lỗi khởi tạo Socket:", err);
    }
}
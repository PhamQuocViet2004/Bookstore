// admin.js - Admin Logic & Management

let socket;

document.addEventListener("DOMContentLoaded", function() {
    checkAdminAccess();
    initSocket();
    loadDashboardStats();
    loadBooks();
    loadCategories();
    loadOrders();
    loadUsers();
    loadVouchers();
    loadNotifications();

    // Chú thích: Bỏ setInterval vì đã có Socket.io cập nhật thời gian thực (Point 17)
    // setInterval(loadNotifications, 60000);

    // Close dropdown when clicking outside
    document.addEventListener("click", function(e) {
        const wrapper = document.getElementById("notifWrapper");
        const dropdown = document.getElementById("notifDropdown");
        if (wrapper && dropdown && !wrapper.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });

    const vForm = document.getElementById("voucherForm");
    if (vForm) {
        vForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            const payload = {
                code: document.getElementById("vCode").value,
                type: document.getElementById("vType").value,
                value: document.getElementById("vValue").value,
                minOrderValue: document.getElementById("vMinOrder").value,
                usageLimit: document.getElementById("vLimit").value,
                endDate: document.getElementById("vEndDate").value || null
            };

            try {
                const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.VOUCHERS), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) {
                    alert("Đã tạo Voucher thành công!");
                    vForm.reset();
                    loadVouchers();
                }
            } catch (err) { console.error(err); }
        });
    }
});

async function checkAdminAccess() {
    const userInfoStr = localStorage.getItem("userInfo");
    if (!userInfoStr) {
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CHECK_ADMIN));
        const result = await safeJson(response);
        
        if (!response.ok || !result.isAdmin) {
            alert("Bạn không có quyền truy cập trang quản trị!");
            window.location.href = "index.html";
            return;
        }
        
        const userInfo = JSON.parse(userInfoStr);
        document.getElementById("adminName").textContent = userInfo.fullName || "Admin";
        console.log("Admin Verified: Access Granted");
    } catch (err) {
        console.error("Auth Check Error:", err);
        window.location.href = "index.html";
    }
}

// DASHBOARD
async function loadDashboardStats() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.DASHBOARD + "/stats"));
        if (response.ok) {
            const result = await response.json();
            const stats = result.data;
            
            // Update UI with real data
            document.getElementById("totalRevenue").textContent = (stats.revenueMonth || 0).toLocaleString() + "đ";
            document.getElementById("newOrdersCount").textContent = stats.newOrders || 0;
            document.getElementById("newUsersCount").textContent = stats.newUsers || 0;
            document.getElementById("lowStockCount").textContent = stats.lowStockCount || 0;
            
            // Initialize charts with real data
            if (stats.revenueChart) {
                initRevenueChart(stats.revenueChart);
            }
            if (stats.salesByCategory) {
                initCategoryPieChart(stats.salesByCategory);
            }

            // Render Top Selling Books
            if (stats.topBooks) {
                renderTopBooks(stats.topBooks);
            }
        } else {
            console.error("Failed to load dashboard stats");
        }
    } catch (e) {
        console.error("Error connecting to dashboard API:", e);
    }
}

function renderTopBooks(books) {
    const container = document.getElementById("topSellingBooks");
    if (!container) return;

    if (!books || books.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:#64748b;">Chưa có dữ liệu bán hàng.</p>';
        return;
    }

    container.innerHTML = books.map((book, index) => `
        <div style="display: flex; align-items: center; gap: 15px; padding: 12px; border-bottom: 1px solid #f1f5f9;">
            <div style="font-weight: 800; color: #3b82f6; width: 25px;">#${index + 1}</div>
            <img src="${book.image || 'image/logo/logo.png'}" style="width: 45px; height: 60px; object-fit: cover; border-radius: 6px;">
            <div style="flex: 1;">
                <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${book.title}</div>
                <div style="font-size: 12px; color: #64748b;">Đã bán: <span style="font-weight: 700; color: #0f172a;">${book.sold}</span></div>
            </div>
            <div style="font-weight: 700; color: #10b981;">${(book.price || 0).toLocaleString()}đ</div>
        </div>
    `).join("");
}

function initRevenueChart(dataArray) {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;
    
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        labels.push(dayNames[d.getDay()]);
    }
    
    if (window.myRevenueChart) {
        window.myRevenueChart.destroy();
    }
    
    window.myRevenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Doanh thu (VNĐ)',
                data: dataArray || [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
                            return value.toLocaleString() + 'đ';
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + context.parsed.y.toLocaleString() + 'đ';
                        }
                    }
                }
            }
        }
    });
}

// BOOKS MANAGEMENT
async function loadBooks() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + "?limit=50"));
        if (response.ok) {
            const result = await response.json();
            const books = result.data || result || [];
            renderBookTable(books);
        }
    } catch (e) { console.error(e); }
}

function renderBookTable(books) {
    const body = document.getElementById("bookTableBody");
    body.innerHTML = books.map(book => `
        <tr>
            <td><img src="${book.image || 'image/logo/logo.png'}" width="40" style="border-radius:4px"></td>
            <td style="max-width:200px">${book.title}</td>
            <td>${book.author}</td>
            <td>${book.price.toLocaleString()}đ</td>
            <td><span class="badge ${book.stock < 10 ? 'badge-danger' : 'badge-success'}">${book.stock}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="editBook(${book.id})"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-delete" onclick="deleteBook(${book.id})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function deleteBook(id) {
    if (!confirm("Xóa sách này khỏi hệ thống?")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + "/" + id), { method: 'DELETE' });
        if (response.ok) loadBooks();
    } catch (e) { console.error(e); }
}

// CATEGORIES
async function loadCategories() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CATEGORIES));
        if (response.ok) {
            const result = await response.json();
            const cats = result.data || result || [];
            
            // Fill select in form
            const select = document.getElementById("category");
            select.innerHTML = '<option value="">Chọn danh mục</option>' + 
                cats.map(c => `<option value="${c.id}">${c.name}</option>`).join("");
                
            // Fill table
            const body = document.getElementById("categoryTableBody");
            body.innerHTML = cats.map(c => `
                <tr>
                    <td>${c.id}</td>
                    <td>${c.name}</td>
                    <td>${c.bookCount || 0}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteCategory(${c.id})"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `).join("");
        }
    } catch (e) { console.error(e); }
}

async function addCategory() {
    const name = document.getElementById("newCategoryName").value.trim();
    if (!name) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CATEGORIES), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (response.ok) {
            document.getElementById("newCategoryName").value = "";
            loadCategories();
        } else {
            const err = await response.json();
            alert("Lỗi: " + (err.message || "Không thể thêm danh mục (có thể do trùng tên)"));
        }
    } catch (e) { console.error(e); }
}
async function deleteCategory(id) {
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này? (Lưu ý: Chỉ xóa được danh mục không có sách)")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CATEGORIES + "/" + id), {
            method: 'DELETE'
        });
        if (response.ok) {
            loadCategories();
        } else {
            const err = await response.json();
            alert("Lỗi: " + (err.message || "Không thể xóa danh mục này."));
        }
    } catch (e) { console.error(e); }
}

// Gán vào window để HTML onclick có thể gọi được
window.deleteCategory = deleteCategory;
window.addCategory = addCategory;
// BOOK FORM SUBMIT
document.getElementById("bookForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const id = document.getElementById("bookId").value;
    const data = {
        title: document.getElementById("title").value,
        author: document.getElementById("author").value,
        price: parseFloat(document.getElementById("price").value),
        discount: parseInt(document.getElementById("discount").value),
        stock: parseInt(document.getElementById("stock").value),
        categoryId: parseInt(document.getElementById("category").value),
        image: document.getElementById("image").value,
        description: document.getElementById("detail").value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? CONFIG.ENDPOINTS.BOOKS + "/" + id : CONFIG.ENDPOINTS.BOOKS;

    try {
        const response = await apiFetch(getFullUrl(url), {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            alert("Lưu thông tin sách thành công!");
            this.reset();
            document.getElementById("bookId").value = "";
            loadBooks();
        }
    } catch (e) { console.error(e); }
});

// ORDER MANAGEMENT
async function loadOrders() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADMIN_ORDERS));
        if (response.ok) {
            const result = await response.json();
            const orders = result.data || [];
            renderOrderTable(orders);
            
            // Hiện nút đỏ nếu có đơn hàng pending
            const hasPending = orders.some(o => o.status === 'pending');
            const orderDot = document.getElementById("adminOrderDot");
            if (orderDot) {
                orderDot.style.display = hasPending ? "block" : "none";
            }
        }
    } catch (e) { console.error(e); }
}

function renderOrderTable(orders) {
    const body = document.getElementById("orderTableBody");
    if (!body) return;
    
    body.innerHTML = orders.map(order => `
        <tr>
            <td>#${order.id}</td>
            <td>
                <strong>${order.user ? order.user.fullName : 'Guest'}</strong><br>
                <small>${order.user ? order.user.phone : ''}</small>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</td>
            <td>${(order.total || order.totalPrice).toLocaleString()}đ</td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${translateStatus(order.status)}
                </span>
            </td>
            <td>
                <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Chờ duyệt</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                    <option value="shipping" ${order.status === 'shipping' ? 'selected' : ''}>Đang giao</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Đã giao</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                </select>
            </td>
        </tr>
    `).join("");
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'pending': return 'badge-warning';
        case 'confirmed': return 'badge-info';
        case 'shipping': return 'badge-primary';
        case 'delivered': return 'badge-success';
        case 'cancelled': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

function translateStatus(status) {
    const map = {
        'pending': 'Chờ duyệt',
        'confirmed': 'Đã xác nhận',
        'shipping': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
    };
    return map[status] || status;
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADMIN_ORDERS + "/" + orderId + "/status"), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            alert("Cập nhật trạng thái đơn hàng thành công!");
            loadOrders();
            loadDashboardStats(); // Update stats if revenue changed or order status affects counts
        } else {
            const err = await response.json();
            alert("Lỗi: " + err.message);
        }
    } catch (e) {
        console.error(e);
        alert("Không thể kết nối đến máy chủ.");
    }
}

// USER MANAGEMENT
async function loadUsers() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.USERS));
        if (response.ok) {
            const users = await response.json();
            renderUserTable(users);
        }
    } catch (e) { console.error(e); }
}

function renderUserTable(users) {
    const body = document.getElementById("userTableBody");
    if (!body) return;
    
    body.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <strong>${user.fullName}</strong><br>
                <small>ID: ${user.id}</small>
            </td>
            <td>
                ${user.email}<br>
                <small>${user.phone}</small>
            </td>
            <td>
                <select onchange="updateUserRole(${user.id}, this.value)" class="status-select">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>Người dùng</option>
                    <option value="librarian" ${user.role === 'librarian' ? 'selected' : ''}>Thủ thư</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Quản trị viên</option>
                </select>
            </td>
            <td>
                <span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">
                    ${user.isActive ? 'Hoạt động' : 'Đang khóa'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" title="${user.isActive ? 'Khóa' : 'Mở khóa'}" 
                        onclick="updateUserStatus(${user.id}, ${!user.isActive})">
                        <i class="fa-solid ${user.isActive ? 'fa-user-slash' : 'fa-user-check'}"></i>
                    </button>
                    <button class="btn-delete" title="Xóa người dùng" onclick="deleteUserAccount(${user.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

async function updateUserStatus(userId, isActive) {
    if (!confirm(`Bạn có chắc muốn ${isActive ? 'Mở khóa' : 'Khóa'} tài khoản này?`)) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.USERS + "/" + userId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive })
        });
        if (response.ok) {
            alert("Cập nhật trạng thái thành công!");
            loadUsers();
            loadDashboardStats();
        }
    } catch (e) { console.error(e); }
}

async function updateUserRole(userId, role) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.USERS + "/" + userId), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
        if (response.ok) {
            alert("Cập nhật quyền thành công!");
            loadUsers();
        }
    } catch (e) { console.error(e); }
}

async function deleteUserAccount(userId) {
    if (!confirm("XÓA VĨNH VIỄN người dùng này và các dữ liệu liên quan? Hành động này không thể hoàn tác!")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.USERS + "/" + userId), {
            method: 'DELETE'
        });
        if (response.ok) {
            alert("Đã xóa người dùng thành công.");
            loadUsers();
            loadDashboardStats();
        } else {
            const err = await response.json();
            alert("Lỗi: " + err.message);
        }
    } catch (e) { console.error(e); }
}

async function editBook(id) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + "/" + id));
        if (response.ok) {
            const result = await response.json();
            const book = result.data || result;
            
            document.getElementById("bookId").value = book.id;
            document.getElementById("title").value = book.title;
            document.getElementById("author").value = book.author;
            document.getElementById("price").value = book.price;
            document.getElementById("discount").value = book.discount || 0;
            document.getElementById("stock").value = book.stock || 0;
            document.getElementById("category").value = book.categoryId;
            document.getElementById("image").value = book.image;
            document.getElementById("detail").value = book.description;
            
            showSection('booksSection');
            document.getElementById("bookForm").scrollIntoView();
        }
    } catch (e) { console.error(e); }
}

// VOUCHER MANAGEMENT
async function loadVouchers() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.VOUCHERS));
        if (response.ok) {
            const vouchers = await response.json();
            renderVoucherTable(vouchers);
        }
    } catch (e) { console.error(e); }
}

function renderVoucherTable(vouchers) {
    const body = document.getElementById("voucherTableBody");
    if (!body) return;

    body.innerHTML = vouchers.map(v => `
        <tr>
            <td><strong>${v.code}</strong></td>
            <td>${v.type === 'percent' ? 'Giảm %' : 'Cố định'}</td>
            <td>${v.value.toLocaleString()}${v.type === 'percent' ? '%' : 'đ'}</td>
            <td>${v.minOrderValue.toLocaleString()}đ</td>
            <td>${v.usedCount} / ${v.usageLimit}</td>
            <td>${v.endDate ? new Date(v.endDate).toLocaleDateString('vi-VN') : 'Không'}</td>
            <td>
                <button class="btn-delete" onclick="deleteVoucher(${v.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

async function deleteVoucher(id) {
    if (!confirm("Xóa mã giảm giá này?")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.VOUCHERS + "/" + id), {
            method: 'DELETE'
        });
        if (response.ok) {
            loadVouchers();
        }
    } catch (e) { console.error(e); }
}

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
                list.innerHTML = '<p style="padding: 20px; text-align: center; color: #64748b;">Không có thông báo nào.</p>';
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
            showSection('orderSection');
            setActive(document.querySelector('li[onclick*="orderSection"]'));
            setTimeout(() => {
                const orderEl = document.querySelector(`tr[data-id="${relatedId}"]`);
                if (orderEl) orderEl.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    } catch (err) { console.error(err); }
}

async function markAllNotifAsRead() {
    try {
        await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.NOTIFICATIONS}/read-all`), { method: 'POST' });
        loadNotifications();
    } catch (err) { console.error(err); }
}

function initCategoryPieChart(dataArray) {
    const ctx = document.getElementById('categoryPieChart');
    if (!ctx) return;

    // Không lọc bỏ số 0 để hiện tất cả danh mục trong chú thích
    const labels = dataArray.map(item => item.name);
    const data = dataArray.map(item => parseInt(item.totalSold));
    
    // Bảng màu mở rộng để đủ cho nhiều danh mục
    const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
        '#64748b', '#1e293b', '#475569', '#94a3b8'
    ];

    if (window.myPieChart) {
        window.myPieChart.destroy();
    }

    window.myPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        font: { size: 12, family: "'Inter', sans-serif" },
                        // Hiện cả những cái có giá trị 0
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const value = context.parsed;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${value} cuốn (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initSocket() {
    try {
        if (typeof io === 'undefined') {
            console.warn("Socket.io chưa được tải.");
            return;
        }

        socket = io(CONFIG.SOCKET_URL);

        socket.on('connect', () => {
            console.log('Socket connected to server');
            socket.emit('joinAdmin');
        });

        socket.on('newOrder', (data) => {
            console.log("Realtime: Có đơn hàng mới!", data);
            
            // Thông báo trình duyệt (nếu được phép)
            if (Notification.permission === "granted") {
                new Notification("🔔 Đơn hàng mới!", { body: data.message });
            } else if (Notification.permission !== "denied") {
                Notification.requestPermission();
            }

            // Tải lại toàn bộ dữ liệu thống kê và danh sách
            loadDashboardStats();
            loadOrders();
            loadNotifications();
        });

        socket.on('dashboardUpdate', () => {
            console.log("Realtime: Cập nhật Dashboard...");
            loadDashboardStats();
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });
    } catch (err) {
        console.error("Lỗi khởi tạo Socket:", err);
    }
}

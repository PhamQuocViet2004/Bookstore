// my-orders.js - Quản lý lịch sử đơn hàng
console.log("== ĐANG GỌI API ĐƠN HÀNG ==");

let orderHistory = [];

async function loadOrdersFromAPI() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ORDERS + "/my-orders"));
        if (response.ok) {
            const result = await response.json();
            console.log("[DEBUG] Dữ liệu đơn hàng nhận được:", result);
            
            // Backend trả về danh sách đơn trong result.data hoặc result.orders
            orderHistory = result.data || result.orders || (Array.isArray(result) ? result : []);
            renderOrders('all');
        } else {
            console.error("Lỗi lấy danh sách đơn hàng từ Backend");
            renderOrders('all');
        }
    } catch (error) {
        console.error("Lỗi xử lý đơn hàng:", error);
        // Nếu lỗi do code hiển thị (renderOrders), chúng ta vẫn cố gắng render lại với mảng rỗng để không bị treo loading
        orderHistory = [];
        renderOrders('all');
    }
}

// Chạy ngay lập tức
loadOrdersFromAPI();

function renderOrders(statusFilter, data) {
    const list = document.getElementById("ordersList");
    if (!list) return;

    try {
        let source = data || orderHistory;
        if (!Array.isArray(source)) source = [];
        
        let filtered = source;
        if (statusFilter !== 'all') {
            filtered = source.filter(o => o && o.status === statusFilter);
        }

        // Sắp xếp an toàn
        filtered.sort((a, b) => {
            const dateA = new Date(a.date || a.createdAt || 0);
            const dateB = new Date(b.date || b.createdAt || 0);
            return dateB - dateA;
        });

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-orders">
                    <i class="fa-solid fa-box-open"></i>
                    <h2>Chưa có đơn hàng nào</h2>
                    <p>Có vẻ như bạn chưa thực hiện giao dịch nào trong danh mục này.</p>
                    <a href="index.html" class="btn-action btn-detail" style="text-decoration:none; display:inline-block">Khám phá sách ngay</a>
                </div>
            `;
            return;
        }

        list.innerHTML = "";
        filtered.forEach(order => {
            if (!order) return;

            // Xử lý danh sách sản phẩm an toàn
            const items = Array.isArray(order.items) ? order.items : [];
            const itemHtml = items.map(item => {
                if (!item) return "";
                const book = item.book || {};
                const itemTitle = book.title || item.title || item.name || "Sản phẩm không xác định";
                const itemImage = book.image || item.image || 'image/logo/logo.png';
                const itemPrice = item.finalUnitPrice || item.unitPrice || item.finalPrice || (item.price * (1 - (item.discount || 0)/100)) || 0;
                
                return `
                <div class="order-product-row">
                    <img src="${itemImage}" alt="${itemTitle}" onerror="this.src='image/logo/logo.png'">
                    <div class="product-info">
                        <h4>${itemTitle}</h4>
                        <p>Số lượng: ${item.quantity || 1}</p>
                    </div>
                    <div class="product-price">${(itemPrice || 0).toLocaleString()}đ</div>
                </div>
            `}).join("");

            const statusInfo = getStatusInfo(order.status);
            const orderId = order.id || order._id || "N/A";
            const dateValue = order.date || order.createdAt;
            const dateStr = dateValue ? new Date(dateValue).toLocaleString('vi-VN', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : "Chưa rõ ngày";

            // Xử lý tổng tiền an toàn (Tránh lỗi toLocaleString of undefined)
            const totalDisplay = (order.total || order.totalPrice || 0).toLocaleString();

            let actionBtn = "";
            if (order.status === 'pending') {
                actionBtn = `<button class="btn-action btn-cancel" onclick="cancelOrder('${orderId}')">Hủy đơn hàng</button>`;
            }

            list.innerHTML += `
                <div class="order-card">
                    <div class="order-card-header">
                        <div class="order-id-group">
                            <span>Mã đơn hàng</span>
                            <strong>#${orderId}</strong>
                            <small style="color:var(--text-muted); font-size:11px; margin-top:4px">${dateStr}</small>
                        </div>
                        <div class="order-status-badge status-${order.status || 'pending'}">
                            <i class="${statusInfo.icon}"></i> ${statusInfo.label}
                        </div>
                    </div>
                    <div class="order-card-body">
                        ${itemHtml || '<p style="padding:15px; color:gray">Không có thông tin sản phẩm</p>'}
                    </div>
                    <div class="order-card-footer">
                        <div class="total-amount">
                            <span>Tổng thanh toán</span>
                            <strong>${totalDisplay}đ</strong>
                        </div>
                        <div class="order-actions">
                            ${actionBtn}
                            <button class="btn-action btn-detail" onclick="viewOrderDetail('${orderId}')">Xem chi tiết</button>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Lỗi Render đơn hàng:", e);
        list.innerHTML = `<p style="text-align:center; padding:20px; color:red">Đã xảy ra lỗi khi hiển thị đơn hàng. Vui lòng thử lại.</p>`;
    }
}

function viewOrderDetail(orderId) {
    const order = orderHistory.find(o => (o.id || o._id || "").toString() === orderId.toString());
    if (!order) return;

    const modal = document.getElementById('orderDetailModal');
    const content = document.getElementById('orderDetailContent');
    
    const items = Array.isArray(order.items) ? order.items : [];
    const itemHtml = items.map(item => {
        const book = item.book || {};
        const itemTitle = book.title || item.title || item.name || "Sản phẩm không xác định";
        const itemImage = book.image || item.image || 'image/logo/logo.png';
        const itemPrice = item.finalUnitPrice || item.unitPrice || item.finalPrice || (item.price * (1 - (item.discount || 0)/100)) || 0;
        
        return `
            <div style="display: flex; gap: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                <img src="${itemImage}" style="width: 60px; height: 80px; object-fit: cover; border-radius: 6px;" onerror="this.src='image/logo/logo.png'">
                <div style="flex: 1;">
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 5px;">${itemTitle}</div>
                    <div style="font-size: 13px; color: #64748b; margin-bottom: 5px;">Số lượng: ${item.quantity || 1}</div>
                    <div style="font-weight: 700; color: var(--primary); font-size: 14px;">${(itemPrice || 0).toLocaleString()}đ</div>
                </div>
            </div>
        `;
    }).join("");

    const statusInfo = getStatusInfo(order.status);
    let shippingAddress = order.shippingAddress || {};
    if (typeof shippingAddress === 'string') {
        try { shippingAddress = JSON.parse(shippingAddress); } catch(e) { shippingAddress = { address: shippingAddress }; }
    }

    content.innerHTML = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Mã đơn hàng:</span>
                <strong>#${order.id || order._id}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Trạng thái:</span>
                <span class="order-status-badge status-${order.status || 'pending'}" style="padding: 4px 10px; font-size: 12px;">
                    <i class="${statusInfo.icon}"></i> ${statusInfo.label}
                </span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #64748b;">Phương thức thanh toán:</span>
                <strong>${order.paymentMethod === 'vnpay' || order.paymentMethod === 'banking' ? 'Chuyển khoản' : 'Thanh toán khi nhận hàng (COD)'}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748b;">Ngày đặt:</span>
                <strong>${new Date(order.date || order.createdAt).toLocaleString('vi-VN')}</strong>
            </div>
        </div>

        <h4 style="margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Thông tin giao hàng</h4>
        <div style="margin-bottom: 25px; line-height: 1.6; color: #334155;">
            <p><strong>Người nhận:</strong> ${shippingAddress.fullName || shippingAddress.name || 'Đang cập nhật'}</p>
            <p><strong>Số điện thoại:</strong> ${shippingAddress.phone || 'Đang cập nhật'}</p>
            <p><strong>Địa chỉ:</strong> ${shippingAddress.address || shippingAddress.detail || 'Đang cập nhật'}</p>
            ${order.note ? `<p><strong>Ghi chú:</strong> ${order.note}</p>` : ''}
        </div>

        <h4 style="margin-bottom: 15px; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">Danh sách sản phẩm</h4>
        <div style="margin-bottom: 20px; max-height: 250px; overflow-y: auto;">
            ${itemHtml || '<p style="color:gray;">Không có thông tin sản phẩm</p>'}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px dashed #e2e8f0; padding-top: 15px; margin-top: 15px;">
            <span style="font-size: 16px; color: #64748b;">Tổng tiền:</span>
            <strong style="font-size: 22px; color: var(--primary);">${(order.total || order.totalPrice || 0).toLocaleString()}đ</strong>
        </div>
    `;

    modal.style.display = "flex";
}

function getStatusInfo(status) {
    switch (status) {
        case 'pending': return { label: 'Chờ xác nhận', icon: 'fa-solid fa-clock' };
        case 'shipping': return { label: 'Đang giao hàng', icon: 'fa-solid fa-truck' };
        case 'delivered': return { label: 'Đã giao hàng', icon: 'fa-solid fa-check-circle' };
        case 'cancelled': return { label: 'Đã hủy', icon: 'fa-solid fa-circle-xmark' };
        default: return { label: 'Đang xử lý', icon: 'fa-solid fa-spinner' };
    }
}

// XỬ LÝ HỦY ĐƠN
async function cancelOrder(orderId) {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.ORDERS}/${orderId}/cancel`), {
            method: 'POST'
        });

        if (response.ok) {
            alert("Đơn hàng đã được hủy thành công!");
            await loadOrdersFromAPI(); 
        } else {
            const result = await response.json();
            alert("Không thể hủy đơn hàng: " + (result.message || "Lỗi hệ thống"));
        }
    } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        alert("Lỗi kết nối. Vui lòng thử lại sau!");
    }
}

function filterByStatus(status) {
    const buttons = document.querySelectorAll(".tab-btn");
    buttons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("onclick") && btn.getAttribute("onclick").includes(`'${status}'`)) {
            btn.classList.add("active");
        }
    });
    renderOrders(status);
}

function searchOrders() {
    const keyword = document.getElementById("searchInput").value.toLowerCase().trim();
    if (!keyword) {
        renderOrders('all');
        return;
    }

    const results = orderHistory.filter(o => {
        const oId = (o.id || o._id || "").toString();
        const items = Array.isArray(o.items) ? o.items : [];
        return oId.includes(keyword) || 
        items.some(item => {
            const itemTitle = (item.title || item.name || "").toLowerCase();
            return itemTitle.includes(keyword);
        });
    });
    
    renderOrders('all', results);
}

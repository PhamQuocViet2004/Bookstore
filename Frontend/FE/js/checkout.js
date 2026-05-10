// checkout.js - Xử lý đặt hàng
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Kiểm tra đăng nhập
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
    if (!userInfo) {
        alert("Vui lòng đăng nhập để thanh toán!");
        window.location.href = "login.html";
        return;
    }

    // 2. Điền sẵn thông tin user hoặc địa chỉ mặc định
    await loadDefaultAddress(userInfo);

    // 3. Tải tóm tắt đơn hàng từ giỏ hàng
    await loadOrderSummary();
});

let userAddresses = [];

async function loadDefaultAddress(userInfo) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADDRESSES));
        if (response.ok) {
            const result = await response.json();
            userAddresses = result.data || [];
            const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
            
            if (defaultAddr) {
                document.getElementById("fullName").value = defaultAddr.name || "";
                document.getElementById("phone").value = defaultAddr.phone || "";
                document.getElementById("address").value = `${defaultAddr.detail}, ${defaultAddr.district}, ${defaultAddr.city}`;
                return;
            }
        }
    } catch (e) { console.error("Lỗi tải sổ địa chỉ:", e); }
    
    // Fallback to userInfo
    document.getElementById("fullName").value = userInfo.fullName || "";
    document.getElementById("phone").value = userInfo.phone || "";
    document.getElementById("address").value = userInfo.address || "";
}

function openAddressModal() {
    const modal = document.getElementById("checkoutAddressModal");
    const list = document.getElementById("checkoutAddressList");
    modal.style.display = "flex";

    if (userAddresses.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#64748b;">Chưa có địa chỉ nào trong sổ địa chỉ.</p>';
        return;
    }

    list.innerHTML = userAddresses.map(addr => `
        <div style="border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 15px; cursor: pointer; transition: all 0.2s;" 
             onclick="selectAddress(${addr.id})"
             onmouseover="this.style.borderColor='var(--primary)'" 
             onmouseout="this.style.borderColor='#e2e8f0'">
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <strong style="color: #0f172a;">${addr.name}</strong>
                ${addr.isDefault ? '<span style="background:#eff6ff; color:var(--primary); padding:2px 8px; border-radius:12px; font-size:12px; font-weight:600;">Mặc định</span>' : ''}
            </div>
            <div style="font-size: 14px; color: #64748b; margin-bottom: 3px;"><i class="fa-solid fa-phone"></i> ${addr.phone}</div>
            <div style="font-size: 14px; color: #475569;">${addr.detail}, ${addr.district}, ${addr.city}</div>
        </div>
    `).join("");
}

function selectAddress(id) {
    const addr = userAddresses.find(a => a.id === id);
    if (addr) {
        document.getElementById("fullName").value = addr.name || "";
        document.getElementById("phone").value = addr.phone || "";
        document.getElementById("address").value = `${addr.detail}, ${addr.district}, ${addr.city}`;
        document.getElementById("checkoutAddressModal").style.display = "none";
    }
}

async function loadOrderSummary() {
    const container = document.getElementById("checkoutItems");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("totalAmount");

    try {
        // LỖI 5: Đọc sản phẩm đã chọn từ sessionStorage thay vì gọi API lấy hết giỏ hàng
        const selectedItems = JSON.parse(sessionStorage.getItem("selectedCartItems") || "[]");
        
        if (selectedItems.length === 0) {
            // Nếu không có trong session, thử lấy từ giỏ hàng (fallback)
            const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART));
            if (response.ok) {
                const result = await response.json();
                const allItems = result.cart || result.data || [];
                if (allItems.length === 0) {
                    alert("Giỏ hàng của bạn đang trống!");
                    window.location.href = "index.html";
                    return;
                }
                renderItems(allItems, container, subtotalEl, totalEl);
            }
        } else {
            renderItems(selectedItems, container, subtotalEl, totalEl);
        }
    } catch (e) { console.error(e); }
}

function renderItems(items, container, subtotalEl, totalEl) {
    let subtotal = 0;
    container.innerHTML = items.map(item => {
        const title = item.title || (item.book ? item.book.title : "Sách");
        const price = item.price || (item.book ? item.book.price : 0);
        const discount = item.discount || (item.book ? item.book.discount : 0);
        const image = item.image || (item.book ? item.book.image : 'image/logo/logo.png');
        
        const finalPrice = item.finalPrice || Math.round(price * (1 - (discount / 100)));
        const itemTotal = finalPrice * item.quantity;
        subtotal += itemTotal;

        return `
            <div class="checkout-item">
                <img src="${image}" alt="${title}" onerror="this.src='image/logo/logo.png'">
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${title}</div>
                    <div style="font-size: 13px; color: #64748b;">Số lượng: ${item.quantity}</div>
                    <div class="checkout-item-price">${finalPrice.toLocaleString()}đ</div>
                </div>
            </div>
        `;
    }).join("");

    subtotalEl.textContent = subtotal.toLocaleString() + "đ";
    totalEl.textContent = subtotal.toLocaleString() + "đ";
}

async function processOrder() {
    const fullName = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const note = document.getElementById("note").value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    if (!fullName || !phone || !address) {
        alert("Vui lòng điền đầy đủ thông tin giao hàng!");
        return;
    }

    const selectedItems = JSON.parse(sessionStorage.getItem("selectedCartItems") || "[]");
    const itemsPayload = selectedItems.map(it => ({
        bookId: it.bookId || it.id,
        quantity: it.quantity
    }));

    const btn = document.querySelector(".btn-checkout");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG XỬ LÝ...';
    btn.disabled = true;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ORDERS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: itemsPayload.length > 0 ? itemsPayload : null,
                shippingAddress: {
                    fullName,
                    phone,
                    address
                },
                paymentMethod,
                note
            })
        });

        if (response.ok) {
            const result = await response.json();
            // Đặt hàng thành công
            alert("Chúc mừng! Đơn hàng của bạn đã được tiếp nhận.");
            window.location.href = "my-orders.html"; // Chuyển đến trang lịch sử mua hàng
        } else {
            const err = await response.json();
            alert("Lỗi: " + (err.message || "Đặt hàng không thành công"));
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> ĐẶT HÀNG NGAY';
            btn.disabled = false;
        }
    } catch (e) {
        console.error(e);
        alert("Có lỗi xảy ra khi đặt hàng.");
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> ĐẶT HÀNG NGAY';
        btn.disabled = false;
    }
}
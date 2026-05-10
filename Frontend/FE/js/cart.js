// cart.js - Cart Management & Summary

let cartItems = [];
let appliedVoucher = null;

document.addEventListener("DOMContentLoaded", function() {
    loadCart();
});

async function loadCart() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART));
        if (response.ok) {
            const result = await response.json();
            cartItems = result.cart || [];
            renderCart();
            updateSummary();
        } else {
            document.getElementById("cartList").innerHTML = "<h3>Giỏ hàng trống hoặc có lỗi xảy ra.</h3>";
        }
    } catch (e) {
        console.error(e);
        document.getElementById("cartList").innerHTML = "<h3>Không thể kết nối đến máy chủ.</h3>";
    }
}

function renderCart() {
    const list = document.getElementById("cartList");
    if (cartItems.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding: 60px; background: white; border-radius: 12px;">
                <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" width="120" style="opacity:0.3; margin-bottom:20px;">
                <h3>Giỏ hàng của bạn đang trống</h3>
                <p style="color:var(--text-muted); margin-bottom:25px;">Hãy khám phá hàng ngàn cuốn sách hấp dẫn tại BookStore nhé!</p>
                <a href="index.html" class="btn-checkout" style="text-decoration:none; display:inline-block; width:auto; padding: 12px 40px;">Tiếp tục mua sắm</a>
            </div>
        `;
        return;
    }

    list.innerHTML = cartItems.map(item => {
        const book = item.book || item;
        const bookId = book.bookId || book.id;
        const salePrice = book.price * (1 - (book.discount || 0)/100);
        return `
            <div class="cart-item" data-id="${bookId}">
                <input type="checkbox" checked onchange="updateSummary()" style="width:18px; height:18px; cursor:pointer;">
                <img src="${book.image || 'image/logo/logo.png'}" alt="${book.title}" onclick="location.href='product-detail.html?id=${bookId}'" style="cursor:pointer">
                <div class="item-info">
                    <h4 onclick="location.href='product-detail.html?id=${bookId}'" style="cursor:pointer">${book.title}</h4>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Tác giả: ${book.author || 'Đang cập nhật'}</p>
                    <div class="item-price-box">
                        <span class="price">${salePrice.toLocaleString()}đ</span>
                        ${book.discount > 0 ? `<span class="old">${book.price.toLocaleString()}đ</span>` : ''}
                    </div>
                </div>
                <div class="quantity-control">
                    <button onclick="changeQty(${bookId}, -1)">-</button>
                    <input type="number" value="${item.quantity}" min="1" onchange="setQty(${bookId}, this.value)">
                    <button onclick="changeQty(${bookId}, 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeFromCart(${bookId})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    }).join("");
}

async function changeQty(bookId, delta) {
    const item = cartItems.find(i => (i.bookId || i.id) == bookId);
    if (item) {
        const newQty = Math.max(1, (item.quantity || 1) + delta);
        await setQty(bookId, newQty);
    }
}

async function setQty(bookId, qty) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART_UPDATE), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, quantity: parseInt(qty) })
        });

        if (response.ok) {
            await loadCart();
        }
    } catch (e) { console.error(e); }
}

async function removeFromCart(bookId) {
    if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART + "/" + bookId), {
            method: 'DELETE'
        });
        if (response.ok) await loadCart();
    } catch (e) { console.error(e); }
}

async function clearCart() {
    if (!confirm("Xóa toàn bộ giỏ hàng?")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART_CLEAR), { method: 'DELETE' });
        if (response.ok) await loadCart();
    } catch (e) { console.error(e); }
}

function updateSummary() {
    const subtotalEl = document.getElementById("subtotal");
    const discountEl = document.getElementById("discount");
    const totalEl = document.getElementById("total");
    
    let subtotal = 0;
    // Chỉ tính tiền các item được check
    const items = document.querySelectorAll(".cart-item");
    items.forEach((node, index) => {
        const cb = node.querySelector("input[type='checkbox']");
        if (cb.checked) {
            const item = cartItems[index];
            const book = item.book || item;
            const salePrice = book.price * (1 - (book.discount || 0)/100);
            subtotal += salePrice * item.quantity;
        }
    });

    let discount = 0;
    if (appliedVoucher) {
        if (appliedVoucher.type === 'percent') {
            discount = subtotal * (appliedVoucher.value / 100);
        } else {
            discount = appliedVoucher.value;
        }
    }

    subtotalEl.textContent = subtotal.toLocaleString() + "đ";
    discountEl.textContent = "-" + discount.toLocaleString() + "đ";
    totalEl.textContent = Math.max(0, subtotal - discount).toLocaleString() + "đ";
}

async function applyVoucher() {
    const code = document.getElementById("voucherCode").value.trim();
    if (!code) return;

    // Tính tổng tạm tính để gửi cho BE kiểm tra minOrderValue
    let subtotal = 0;
    const itemNodes = document.querySelectorAll(".cart-item");
    itemNodes.forEach((node, index) => {
        const cb = node.querySelector("input[type='checkbox']");
        if (cb && cb.checked) {
            const item = cartItems[index];
            const book = item.book || item;
            const salePrice = book.price * (1 - (book.discount || 0)/100);
            subtotal += salePrice * item.quantity;
        }
    });

    try {
        const response = await fetch(getFullUrl(CONFIG.ENDPOINTS.VOUCHERS + "/validate?code=" + code + "&totalValue=" + subtotal));
        const result = await response.json();
        
        if (result.valid) {
            appliedVoucher = result;
            alert(result.message || "Áp dụng mã giảm giá thành công!");
        } else {
            alert(result.message || "Mã giảm giá không hợp lệ!");
            appliedVoucher = null;
        }
        updateSummary();
    } catch (e) {
        console.error(e);
        alert("Lỗi khi kiểm tra mã giảm giá.");
    }
}

function selectAll() {
    const mainCb = document.getElementById("selectAll");
    const itemCbs = document.querySelectorAll(".cart-item input[type='checkbox']");
    itemCbs.forEach(cb => cb.checked = mainCb.checked);
    updateSummary();
}

function checkout() {
    // Lưu các item được chọn vào session trước khi sang trang checkout
    const selectedItems = [];
    const items = document.querySelectorAll(".cart-item");
    items.forEach((node, index) => {
        const cb = node.querySelector("input[type='checkbox']");
        if (cb.checked) {
            selectedItems.push(cartItems[index]);
        }
    });

    if (selectedItems.length === 0) {
        alert("Vui lòng chọn ít nhất một sản phẩm để thanh toán!");
        return;
    }

    sessionStorage.setItem("checkoutItems", JSON.stringify(selectedItems));
    sessionStorage.setItem("appliedVoucher", JSON.stringify(appliedVoucher));
    window.location.href = "checkout.html";
}
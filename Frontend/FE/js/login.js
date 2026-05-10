document.getElementById("loginForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        alert("Vui lòng nhập đầy đủ thông tin!");
        return;
    }

    const data = {
        email: email,
        password: password
    };

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.LOGIN), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Đăng nhập thành công!");
            
            // Lưu token hoặc thông tin user vào localStorage (nếu có)
            if (result.token) {
                localStorage.setItem("userToken", result.token);
            }
            if (result.user) {
                localStorage.setItem("userInfo", JSON.stringify(result.user));
            }

            // Chuyển hướng về trang chủ
            await syncGuestCart();
            window.location.href = "index.html";
        } else {
            alert("Đăng nhập thất bại: " + (result.message || "Email hoặc mật khẩu không chính xác"));
            console.error("Lỗi:", result);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    }
});

/**
 * Đồng bộ giỏ hàng từ Session sang Database sau khi đăng nhập thành công
 */
async function syncGuestCart() {
    try {
        // 1. Lấy dữ liệu giỏ hàng hiện tại (đang nằm trong Session)
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART));
        
        if (response.ok) {
            const result = await response.json();
            const items = result.cart || [];
            
            if (items.length > 0) {
                // 2. Gửi dữ liệu này lên API bulk-update của Member
                await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CART_BULK_UPDATE), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ items: items.map(i => ({ bookId: i.bookId, quantity: i.quantity })) })
                });
                console.log("Cart synced successfully");
            }
        }
    } catch (error) {
        console.error("Cart Sync Error:", error);
        // Không chặn đứng quá trình login nếu sync lỗi
    }
}

// Toggle Password Visibility
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
}
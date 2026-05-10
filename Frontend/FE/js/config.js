const CONFIG = {
    API_BASE_URL: "http://localhost:3001/api",
    SOCKET_URL: "http://localhost:3001",
    ENDPOINTS: {
        REGISTER: "/auth/register",
        LOGIN: "/auth/login",
        CHECK_ADMIN: "/auth/check-admin",
        PROFILE: "/auth/me",
        BOOKS: "/books",
        CATEGORIES: "/categories",
        USERS: "/users",
        CART: "/cart",
        CART_UPDATE: "/cart/update",
        CART_BULK_UPDATE: "/cart/bulk-update",
        CART_CLEAR: "/cart/clear",
        ORDERS: "/orders",
        DASHBOARD: "/dashboard",
        ADMIN_ORDERS: "/admin/orders",
        REVIEWS: "/reviews",
        VOUCHERS: "/vouchers",
        WISHLIST: "/wishlist",
        ADDRESSES: "/addresses",
        NOTIFICATIONS: "/notifications",
        STORE_REVIEWS: "/store-reviews",
        MESSAGES: "/messages",
        CHANGE_PASSWORD: "/auth/change-password"
    }
};

// Hàm tiện ích để lấy URL đầy đủ
function getFullUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

/**
 * Helper to parse JSON safely (Point 11)
 * Returns the parsed object or a default value (null) if parsing fails.
 */
async function safeJson(response, defaultValue = null) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : defaultValue;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return defaultValue;
    }
}

function apiFetch(url, options = {}) {
    // Luôn gửi credentials để CORS session hoạt động
    options.credentials = 'include';

    // Tự động thêm Authorization header nếu có token
    const token = localStorage.getItem("userToken");
    if (token) {
        options.headers = options.headers || {};
        if (!options.headers["Authorization"]) {
            options.headers["Authorization"] = `Bearer ${token.trim()}`;
        }
    }

    return fetch(url, options).catch(err => {
        console.error("Network/Fetch Error:", err);
        // Trả về một đối tượng Response "giả" để không làm hỏng chuỗi xử lý
        return new Response(JSON.stringify({ message: "Không thể kết nối đến máy chủ." }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    });
}

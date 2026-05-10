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
 * Hàm fetch tập trung - Tự động gửi kèm:
 * 1. credentials: 'include' (gửi cookie/session cho CORS)
 * 2. Authorization: Bearer <token> (nếu đã đăng nhập)
 * 
 * Sử dụng: thay thế fetch() bằng apiFetch() ở mọi nơi gọi API
 * 
 * @param {string} url - URL đầy đủ của API
 * @param {object} options - Các tùy chọn fetch (method, body, headers, ...)
 * @returns {Promise<Response>}
 */
function apiFetch(url, options = {}) {
    // Luôn gửi credentials để CORS session hoạt động
    options.credentials = 'include';

    // Tự động thêm Authorization header nếu có token
    const token = localStorage.getItem("userToken");
    if (token) {
        options.headers = options.headers || {};
        // Không ghi đè nếu caller đã set Authorization
        if (!options.headers["Authorization"]) {
            options.headers["Authorization"] = `Bearer ${token.trim()}`;
        }
    }

    return fetch(url, options);
}

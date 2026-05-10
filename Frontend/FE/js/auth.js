// auth.js - Quản lý trạng thái đăng nhập/đăng xuất
document.addEventListener("DOMContentLoaded", function() {
    checkLoginStatus();
});

function getInitials(name) {
    if (!name) return "KH";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function updateTopMenuAvatar() {
    const authLink = document.getElementById("auth-link");
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo || !authLink) return;

    const user = JSON.parse(userInfo);
    const avatarHtml = user.avatar 
        ? `<img src="${user.avatar}" class="top-menu-avatar" alt="Avatar">`
        : `<div class="top-menu-initials">${getInitials(user.fullName)}</div>`;
    
    authLink.innerHTML = `${avatarHtml}<span>${user.fullName || 'Tài khoản'}</span>`;
}

function checkLoginStatus() {
    const authLink = document.getElementById("auth-link");
    const adminLinkDropdown = document.getElementById("admin-link-dropdown");
    const userDropdown = document.getElementById("userDropdown");
    
    const token = localStorage.getItem("userToken");
    const userInfo = localStorage.getItem("userInfo");

    if (token && userInfo) {
        const user = JSON.parse(userInfo);
        
        // 1. Update Auth Link to show Avatar/Initials + Name
        updateTopMenuAvatar();
        
        if (authLink) {
            authLink.href = "javascript:void(0)";
            // Toggle dropdown
            authLink.onclick = (e) => {
                e.stopPropagation();
                userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
            };
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.style.display = 'none';
        });

        // 2. Check Admin role for nav and dropdown links
        const adminNavLink = document.getElementById("admin-nav-link");
        const hasAccess = user.role === 'admin' || user.role === 'librarian';

        if (hasAccess) {
            if (adminNavLink) adminNavLink.classList.remove("hidden");
            if (adminLinkDropdown) adminLinkDropdown.classList.remove("hidden");
        } else {
            if (adminNavLink) adminNavLink.classList.add("hidden");
            if (adminLinkDropdown) adminLinkDropdown.classList.add("hidden");
        }
    } else {
        if (authLink) {
            authLink.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> Đăng nhập`;
            authLink.href = "login.html";
            authLink.onclick = null;
        }
    }
}

function logout() {
    if (confirm("Bạn có chắc chắn muốn đăng xuất?")) {
        localStorage.removeItem("userToken");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("token"); // Xóa cả token dư thừa nếu có
        
        alert("Đã đăng xuất thành công!");
        window.location.href = "login.html"; // Chuyển sang trang đăng nhập
    }
}

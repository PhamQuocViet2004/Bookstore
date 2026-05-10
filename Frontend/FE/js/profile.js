// profile.js - Account Center Management

document.addEventListener("DOMContentLoaded", function() {
    loadUserProfile();
    // Check for hash in URL to switch tab
    const hash = window.location.hash.replace('#', '');
    if (hash) switchTab(hash);
});

async function loadUserProfile() {
    const userInfo = localStorage.getItem("userInfo");
    if (!userInfo) {
        window.location.href = "login.html";
        return;
    }

    const user = JSON.parse(userInfo);
    
    // Fill sidebar avatar or initials
    const avatarImg = document.getElementById("sidebar-avatar");
    if (user.avatar) {
        avatarImg.src = user.avatar;
        avatarImg.style.display = "block";
        // Nếu có phần tử initials thì ẩn đi
        const initialsDiv = document.getElementById("sidebar-initials");
        if (initialsDiv) initialsDiv.style.display = "none";
    } else {
        // Fallback initials
        let initialsDiv = document.getElementById("sidebar-initials");
        if (!initialsDiv) {
            initialsDiv = document.createElement("div");
            initialsDiv.id = "sidebar-initials";
            initialsDiv.className = "user-initials";
            initialsDiv.style.width = "60px";
            initialsDiv.style.height = "60px";
            initialsDiv.style.fontSize = "20px";
            avatarImg.parentElement.insertBefore(initialsDiv, avatarImg);
        }
        initialsDiv.textContent = getInitials(user.fullName);
        initialsDiv.style.display = "flex";
        avatarImg.style.display = "none";
    }

    document.getElementById("sidebar-name").textContent = user.fullName || "Khách hàng";
    document.getElementById("sidebar-email").textContent = user.email || "";
    
    // Fill Profile Tab
    document.getElementById("profile-name").value = user.fullName || "";
    document.getElementById("profile-email").value = user.email || "";
    document.getElementById("profile-phone").value = user.phone || "";
    document.getElementById("profile-dob").value = user.dob ? user.dob.split('T')[0] : "";

    // Load sub-data
    loadAddressBook();
    loadWishlist();
    
    // Đồng bộ menu trên cùng
    if (typeof updateTopMenuAvatar === 'function') updateTopMenuAvatar();
}

function getInitials(name) {
    if (!name) return "KH";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Hiển thị trạng thái đang tải
    const avatarWrapper = document.querySelector(".avatar-wrapper");
    const overlay = document.querySelector(".avatar-overlay");
    overlay.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    overlay.style.opacity = "1";

    try {
        // 1. Upload to Cloudinary
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await apiFetch(getFullUrl("/upload/cloudinary"), {
            method: 'POST',
            body: formData
            // Lưu ý: apiFetch không nên set Content-Type khi gửi FormData để browser tự set boundary
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadResult = await uploadRes.json();
        const imageUrl = uploadResult.imageUrl;

        // 2. Update Profile via API
        const updateRes = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.PROFILE), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar: imageUrl })
        });

        if (updateRes.ok) {
            const updateResult = await updateRes.json();
            // 3. Update Local Storage & UI
            localStorage.setItem("userInfo", JSON.stringify(updateResult.user));
            loadUserProfile();
            alert("Cập nhật ảnh đại diện thành công!");
        } else {
            alert("Lỗi khi cập nhật hồ sơ.");
        }
    } catch (err) {
        console.error(err);
        alert("Có lỗi xảy ra khi tải ảnh lên.");
    } finally {
        overlay.innerHTML = '<i class="fa-solid fa-camera"></i>';
        overlay.style.opacity = "";
    }
}

function switchTab(tabName) {
    // Update Sidebar
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(`'${tabName}'`)) {
            link.classList.add('active');
        }
    });

    // Update Content
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));
    
    const target = document.getElementById(`section-${tabName}`);
    if (target) target.classList.add('active');

    // Handle special cases
    if (tabName === 'orders') {
        window.location.href = 'my-orders.html';
    }
}

// ADDRESS BOOK LOGIC
async function loadAddressBook() {
    const list = document.getElementById("address-list");
    if (!list) return;

    list.innerHTML = '<p style="padding: 20px; text-align:center;">Đang tải sổ địa chỉ...</p>';

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADDRESSES));
        if (response.ok) {
            const result = await response.json();
            const addresses = result.data || [];
            
            if (addresses.length === 0) {
                list.innerHTML = '<p style="padding: 20px; text-align:center; color: var(--text-muted)">Bạn chưa có địa chỉ nào.</p>';
                return;
            }

            list.innerHTML = addresses.map(addr => `
                <div class="address-card ${addr.isDefault ? 'default' : ''}">
                    ${addr.isDefault ? '<span class="badge-default">Mặc định</span>' : ''}
                    <h4>${addr.name}</h4>
                    <p><i class="fa-solid fa-phone"></i> ${addr.phone}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${addr.detail}</p>
                    <p>${addr.district}, ${addr.city}</p>
                    <div class="address-actions">
                        ${!addr.isDefault ? `<button onclick="deleteAddress(${addr.id})" style="color:#ef4444">Xóa</button>` : ''}
                    </div>
                </div>
            `).join("");
        }
    } catch (e) {
        console.error(e);
        list.innerHTML = '<p style="color:red; text-align:center;">Lỗi tải sổ địa chỉ.</p>';
    }
}

document.getElementById("addressForm")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("addr-name").value;
    const phone = document.getElementById("addr-phone").value;
    const detail = document.getElementById("addr-detail").value;
    const district = document.getElementById("addr-district").value;
    const city = document.getElementById("addr-city").value;
    const isDefault = document.getElementById("addr-default").checked;

    try {
        const res = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADDRESSES), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, detail, district, city, isDefault })
        });
        if (res.ok) {
            alert("Thêm địa chỉ thành công!");
            closeModal("addressModal");
            this.reset();
            loadAddressBook();
        } else {
            alert("Lỗi khi thêm địa chỉ.");
        }
    } catch (err) { console.error(err); }
});

async function deleteAddress(id) {
    if (!confirm("Xóa địa chỉ này?")) return;
    try {
        const res = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.ADDRESSES + "/" + id), { method: 'DELETE' });
        if (res.ok) {
            loadAddressBook();
        }
    } catch (e) { console.error(e); }
}

function showAddAddressModal() {
    document.getElementById("addressModal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

// WISHLIST LOGIC
async function loadWishlist() {
    const list = document.getElementById("wishlist-list");
    if (!list) return;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.WISHLIST));
        if (response.ok) {
            const result = await response.json();
            const wishlistItems = result.data || [];

            if (wishlistItems.length === 0) {
                list.innerHTML = `
                    <div style="grid-column: 1/-1; text-align:center; padding: 40px; background:white; border-radius:12px;">
                        <p style="color:var(--text-muted)">Danh sách yêu thích của bạn đang trống.</p>
                        <a href="index.html" style="color:var(--primary-vivid); font-weight:700;">Khám phá ngay</a>
                    </div>
                `;
                return;
            }

            list.innerHTML = wishlistItems.map(book => {
                const salePrice = book.price * (1 - (book.discount || 0)/100);
                return `
                    <div class="book" style="position:relative">
                        <img src="${book.image || 'image/logo/logo.png'}" alt="${book.title}" onerror="this.src='image/logo/logo.png'">
                        <h4>${book.title}</h4>
                        <div class="book-price-box">
                            <span class="sale">${salePrice.toLocaleString()}đ</span>
                            ${book.discount > 0 ? `
                                <div class="old-price">
                                    <span class="original">${book.price.toLocaleString()}đ</span>
                                    <span class="discount">-${book.discount}%</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="book-actions">
                            <button class="btn-detail" onclick="location.href='product-detail.html?id=${book.id}'">Chi tiết</button>
                            <button class="btn-add-cart" onclick="addToCart(${book.id})"><i class="fa-solid fa-cart-plus"></i></button>
                        </div>
                        <button class="btn-remove-wishlist" style="position:absolute; top:10px; left:10px; background:white; border:none; border-radius:50%; width:30px; height:30px; box-shadow:var(--shadow-sm); cursor:pointer; color:#ef4444" onclick="removeFromWishlist(${book.id})">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                `;
            }).join("");
        }
    } catch (e) { console.error(e); }
}

async function removeFromWishlist(bookId) {
    if (!confirm("Xóa khỏi danh sách yêu thích?")) return;
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.WISHLIST + "/" + bookId), {
            method: 'DELETE'
        });
        if (response.ok) {
            loadWishlist();
        }
    } catch (e) { console.error(e); }
}

// PROFILE UPDATE
document.getElementById("profileForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    const name = document.getElementById("profile-name").value;
    const phone = document.getElementById("profile-phone").value;
    const dob = document.getElementById("profile-dob").value;

    const data = { fullName: name, phone, dob };

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.PROFILE), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            localStorage.setItem("userInfo", JSON.stringify(result.user));
            alert("Cập nhật thông tin thành công!");
            loadUserProfile();
        } else {
            alert("Cập nhật thất bại!");
        }
    } catch (e) {
        console.error(e);
        alert("Lỗi kết nối máy chủ!");
    }
});
// CHANGE PASSWORD
document.getElementById("passwordForm")?.addEventListener("submit", async function(e) {
    e.preventDefault();
    const oldPassword = document.getElementById("old-pass").value;
    const newPassword = document.getElementById("new-pass").value;
    const confirmPassword = document.getElementById("confirm-new-pass").value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert("Vui lòng điền đầy đủ các trường mật khẩu!");
        return;
    }

    if (newPassword !== confirmPassword) {
        alert("Mật khẩu mới không khớp!");
        return;
    }

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CHANGE_PASSWORD), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        const result = await response.json();

        if (response.ok) {
            alert("Đổi mật khẩu thành công!");
            this.reset();
        } else {
            alert("Lỗi: " + (result.message || "Không thể đổi mật khẩu."));
        }
    } catch (err) {
        console.error(err);
        alert("Lỗi kết nối máy chủ!");
    }
});

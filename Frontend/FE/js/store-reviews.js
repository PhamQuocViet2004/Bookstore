// js/store-reviews.js

let selectedRating = 0;

let currentReviewPage = 1;
let currentRatingFilter = 'all';

document.addEventListener("DOMContentLoaded", () => {
    loadStoreReviews();
    loadStoreStats();
    initStarInput();
});

function initStarInput() {
    const stars = document.querySelectorAll("#starInput i");
    if (!stars.length) return;

    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.getAttribute("data-value"));
            updateStarDisplay(selectedRating);
        });

        star.addEventListener("mouseover", () => {
            const hoverValue = parseInt(star.getAttribute("data-value"));
            updateStarDisplay(hoverValue);
        });

        star.addEventListener("mouseout", () => {
            updateStarDisplay(selectedRating);
        });
    });
}

function updateStarDisplay(value) {
    const stars = document.querySelectorAll("#starInput i");
    stars.forEach(star => {
        const starValue = parseInt(star.getAttribute("data-value"));
        if (starValue <= value) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
}

async function loadStoreReviews(page = 1, rating = 'all') {
    currentReviewPage = page;
    currentRatingFilter = rating;

    const grid = document.getElementById("storeReviewsGrid");
    if (grid) grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding:40px;">Đang tải đánh giá...</p>';

    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.STORE_REVIEWS}?page=${page}&limit=6&rating=${rating}`));
        const result = await response.json();
        
        if (result.success) {
            renderStoreReviews(result.data);
            renderPagination(result.pagination);
        }
    } catch (err) {
        console.error("Lỗi tải đánh giá:", err);
    }
}

function filterByRating(rating) {
    // Update active class on buttons
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`'${rating}'`) || btn.getAttribute('onclick').includes(`${rating}`)) {
            btn.classList.add('active');
        }
    });

    loadStoreReviews(1, rating);
}

function renderPagination(pagination) {
    const container = document.getElementById("reviewsPagination");
    if (!container) return;

    if (!pagination || pagination.totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    // Previous button
    html += `<button class="page-btn" ${pagination.currentPage === 1 ? 'disabled' : ''} onclick="loadStoreReviews(${pagination.currentPage - 1}, '${currentRatingFilter}')"><i class="fa-solid fa-chevron-left"></i></button>`;

    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        html += `<button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="loadStoreReviews(${i}, '${currentRatingFilter}')">${i}</button>`;
    }

    // Next button
    html += `<button class="page-btn" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''} onclick="loadStoreReviews(${pagination.currentPage + 1}, '${currentRatingFilter}')"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}

async function loadStoreStats() {
    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.STORE_REVIEWS}/stats`));
        const result = await response.json();
        
        if (result.success) {
            const { average, total } = result.data;
            document.getElementById("storeTotalReviews").textContent = `(${total || 0} đánh giá)`;
            renderStarsDisplay(average || 5);
        }
    } catch (err) { console.error("Lỗi tải thống kê:", err); }
}

function renderStarsDisplay(avg) {
    const container = document.getElementById("storeStarsDisplay");
    if (!container) return;
    let html = "";
    const fullStars = Math.floor(avg);
    const hasHalf = avg % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) html += '<i class="fa-solid fa-star"></i>';
        else if (i === fullStars + 1 && hasHalf) html += '<i class="fa-solid fa-star-half-stroke"></i>';
        else html += '<i class="fa-regular fa-star"></i>';
    }
    container.innerHTML = html;
}

function getInitials(name) {
    if (!name) return "KH";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderStoreReviews(reviews) {
    const grid = document.getElementById("storeReviewsGrid");
    if (!grid) return;
    if (reviews.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding:40px; color:#64748b;">Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá!</p>';
        return;
    }

    grid.innerHTML = reviews.map(rev => {
        const userName = rev.user?.fullName || 'Khách hàng';
        const isMe = rev.user?.id == (JSON.parse(localStorage.getItem('userInfo'))?.id);
        
        // Logic hiển thị Avatar: Nếu có ảnh thì hiện ảnh, không thì hiện chữ cái đầu
        const avatarHtml = rev.user?.avatar 
            ? `<img src="${rev.user.avatar}" class="user-avatar" alt="Avatar">`
            : `<div class="user-initials">${getInitials(userName)}</div>`;

        return `
            <div class="review-card">
                <div class="review-user">
                    ${avatarHtml}
                    <div>
                        <div class="user-name">${userName} ${isMe ? '<span style="font-size:10px; background:#e0f2fe; color:#0369a1; padding:2px 6px; border-radius:10px; margin-left:5px;">Bạn</span>' : ''}</div>
                        <div class="review-date">${new Date(rev.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                </div>
                <div class="review-stars" style="font-size: 12px; color: #f59e0b; margin-bottom: 8px;">
                    ${'<i class="fa-solid fa-star"></i>'.repeat(rev.rating)}
                    ${'<i class="fa-regular fa-star"></i>'.repeat(5 - rev.rating)}
                </div>
                <p class="review-content" style="font-size: 13.5px;">"${rev.content}"</p>
            </div>
        `;
    }).join("");
}

async function submitStoreReview() {
    const userStr = localStorage.getItem("userInfo");
    if (!userStr) {
        alert("Vui lòng đăng nhập để gửi đánh giá!");
        window.location.href = "login.html";
        return;
    }

    const content = document.getElementById("reviewText").value.trim();
    
    if (selectedRating === 0) {
        alert("Vui lòng chọn số sao đánh giá!");
        return;
    }
    if (!content) {
        alert("Vui lòng nhập nội dung nhận xét!");
        return;
    }

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.STORE_REVIEWS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: selectedRating, content })
        });

        const result = await response.json();
        if (result.success) {
            alert("Cảm ơn bạn đã đánh giá cửa hàng!");
            document.getElementById("reviewText").value = "";
            selectedRating = 0;
            updateStarDisplay(0);
            loadStoreReviews();
            loadStoreStats();
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (err) {
        console.error("Lỗi gửi đánh giá:", err);
        alert("Có lỗi xảy ra khi gửi đánh giá.");
    }
}

// product-detail.js - Book Details & Interaction

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    if (bookId) {
        loadProductDetail(bookId);
    } else {
        document.getElementById("productDetail").innerHTML = "<h3>Không tìm thấy sản phẩm!</h3>";
    }
});

async function loadProductDetail(id) {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + "/" + id));
        if (response.ok) {
            const result = await response.json();
            const book = result.data || result;
            renderDetail(book);
        } else {
            document.getElementById("productDetail").innerHTML = "<h3>Sách không tồn tại hoặc đã bị ẩn.</h3>";
        }
    } catch (error) {
        console.error("Detail Error:", error);
        document.getElementById("productDetail").innerHTML = "<h3>Lỗi kết nối máy chủ!</h3>";
    }
}

function renderDetail(book) {
    const container = document.getElementById("productDetail");
    const salePrice = book.price * (1 - (book.discount || 0)/100);

    container.innerHTML = `
        <div class="detail-left">
            <div class="main-img-box">
                <img src="${book.image || 'image/logo/logo.png'}" id="mainImg" alt="${book.title}" onerror="this.src='image/logo/logo.png'">
            </div>
            <div class="img-thumb-list">
                <div class="thumb-item active" onclick="changeImg(this, '${book.image}')">
                    <img src="${book.image || 'image/logo/logo.png'}" onerror="this.src='image/logo/logo.png'">
                </div>
                <div class="thumb-item" onclick="changeImg(this, 'https://placehold.co/400x600?text=Trang+Sau')">
                    <img src="https://placehold.co/400x600?text=Trang+Sau">
                </div>
            </div>
        </div>
        <div class="detail-right">
            <h1>${book.title}</h1>
            <div class="detail-meta">
                <span>Tác giả: <strong>${book.author || 'Đang cập nhật'}</strong></span>
                <span>Thể loại: <strong>${book.categoryName || 'Đang cập nhật'}</strong></span>
            </div>
            <div class="detail-price-box">
                <span class="sale-price">${salePrice.toLocaleString()}đ</span>
                ${book.discount > 0 ? `
                    <span class="old-price">${book.price.toLocaleString()}đ</span>
                    <span class="discount-tag">-${book.discount}%</span>
                ` : ''}
            </div>
            
            <p style="margin-bottom: 25px; color: var(--text-muted); font-size: 15px; line-height: 1.8;">
                ${book.description || 'Chưa có mô tả chi tiết cho cuốn sách này.'}
            </p>

            <div class="detail-actions">
                <button class="btn-buy-now" onclick="buyNow(${book.id})">MUA NGAY</button>
                <button class="btn-add-to-cart" onclick="addToCart(${book.id})">
                    <i class="fa-solid fa-cart-plus"></i> THÊM GIỎ HÀNG
                </button>
                <button class="btn-wishlist" onclick="toggleWishlist(${book.id})">
                    <i class="fa-regular fa-heart"></i>
                </button>
            </div>

            <button onclick="showReadTrial('${book.title}')" style="background:none; border:none; color:var(--primary-vivid); font-weight:700; cursor:pointer; text-decoration:underline;">
                <i class="fa-solid fa-book-open"></i> Đọc thử một vài trang
            </button>

            <div class="detail-info-grid">
                <div class="info-item"><span>Mã hàng</span> ${book.id}</div>
                <div class="info-item"><span>Nhà cung cấp</span> NXB Trẻ</div>
                <div class="info-item"><span>Trọng lượng</span> 350g</div>
                <div class="info-item"><span>Kích thước</span> 14.5 x 20.5 cm</div>
            </div>
        </div>
    `;
    loadComments(book.id);
    initStarRating();
}

function initStarRating() {
    const stars = document.querySelectorAll(".star-rating-input i");
    let currentRating = 0;

    stars.forEach((star, index) => {
        star.addEventListener("mouseover", () => {
            highlightStars(index + 1);
        });

        star.addEventListener("mouseleave", () => {
            highlightStars(currentRating);
        });

        star.addEventListener("click", () => {
            currentRating = index + 1;
            document.getElementById("reviewRating").value = currentRating;
            highlightStars(currentRating);
        });
    });

    function highlightStars(count) {
        stars.forEach((s, i) => {
            if (i < count) {
                s.classList.replace("fa-regular", "fa-solid");
            } else {
                s.classList.replace("fa-solid", "fa-regular");
            }
        });
    }
}

async function loadComments(bookId) {
    const list = document.getElementById("commentsList");
    if (!list) return;
    try {
        const response = await fetch(getFullUrl(CONFIG.ENDPOINTS.REVIEWS + "/book/" + bookId));
        if (response.ok) {
            const reviews = await response.json();
            if (reviews.length === 0) {
                list.innerHTML = "<p style='color:var(--text-muted); padding:20px 0;'>Chưa có đánh giá nào cho cuốn sách này. Hãy là người đầu tiên đánh giá!</p>";
                return;
            }

            list.innerHTML = reviews.map(r => `
                <div class="comment" style="padding:20px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${r.user?.avatar || 'https://ui-avatars.com/api/?name=' + (r.user?.fullName || 'U')}" style="width:30px; height:30px; border-radius:50%;" onerror="this.src='https://ui-avatars.com/api/?name=U'">
                            <strong style="font-size:15px">${r.user?.fullName || 'Người dùng'}</strong>
                        </div>
                        <span style="font-size:12px; color:var(--text-muted)">${new Date(r.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div style="color:var(--accent); margin-bottom:10px; font-size:12px;">
                        ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
                        ${'<i class="fa-regular fa-star"></i>'.repeat(5 - r.rating)}
                    </div>
                    <p style="font-size:14px; color:var(--text-main); line-height:1.6">${r.content}</p>
                </div>
            `).join("");

            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            if (document.querySelector(".avg-rating")) {
                document.querySelector(".avg-rating").textContent = avg.toFixed(1);
                document.querySelector(".stars-box span").textContent = `(${reviews.length} đánh giá)`;
            }
        }
    } catch (e) { console.error("Load Reviews Error:", e); }
}

async function submitReview() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookId = urlParams.get('id');
    const rating = document.getElementById("reviewRating").value;
    const content = document.getElementById("reviewText").value.trim();

    if (!rating || rating == 0) {
        alert("Vui lòng chọn số sao đánh giá!");
        return;
    }
    if (!content) {
        alert("Vui lòng nhập nội dung đánh giá!");
        return;
    }

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.REVIEWS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookId, rating, content })
        });

        const result = await response.json();
        if (response.ok) {
            alert("Cảm ơn bạn đã đánh giá!");
            document.getElementById("reviewText").value = "";
            document.getElementById("reviewRating").value = 0;
            document.querySelectorAll(".star-rating-input i").forEach(s => s.classList.replace("fa-solid", "fa-regular"));
            loadComments(bookId);
        } else {
            alert(result.message || "Không thể gửi đánh giá.");
        }
    } catch (e) {
        console.error("Submit Review Error:", e);
        alert("Đã có lỗi xảy ra. Vui lòng thử lại!");
    }
}

function changeImg(el, src) {
    document.getElementById("mainImg").src = src;
    document.querySelectorAll(".thumb-item").forEach(t => t.classList.remove("active"));
    el.classList.add("active");
}

function showReadTrial(title) {
    document.getElementById("trial-title").textContent = title;
    document.getElementById("trialModal").style.display = "flex";
}

function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

async function buyNow(id) {
    await addToCart(id);
    window.location.href = "cart.html";
}

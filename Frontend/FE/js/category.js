// category.js - Book Filtering & Pagination

let currentPage = 1;
const limit = 10;

document.addEventListener("DOMContentLoaded", function() {
    loadCategories();
    applyFilters(); // Initial load
});

async function loadCategories() {
    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.CATEGORIES));
        if (response.ok) {
            const result = await response.json();
            const cats = result.data || result || [];
            const nav = document.getElementById("categoryNav");
            nav.innerHTML = cats.map(c => `
                <a href="category.html?cat=${c.id}">${c.name}</a>
            `).join("");
        }
    } catch (e) { console.error(e); }
}

async function applyFilters(page = 1) {
    currentPage = page;
    const urlParams = new URLSearchParams(window.location.search);
    const catId = urlParams.get('cat') || urlParams.get('categoryId');
    const search = urlParams.get('search');
    const isSale = urlParams.get('sale');
    
    const minPrice = document.getElementById("minPrice").value;
    const maxPrice = document.getElementById("maxPrice").value;
    const sortBy = document.getElementById("sortSelect").value;
    
    // Construct Query String
    let query = `?page=${page}&limit=${limit}`;
    if (catId) query += `&categoryId=${catId}`;
    if (search) query += `&search=${encodeURIComponent(search)}`;
    if (minPrice) query += `&minPrice=${minPrice}`;
    if (maxPrice) query += `&maxPrice=${maxPrice}`;
    if (isSale) query += `&hasDiscount=true`;
    if (sortBy !== 'newest') query += `&sortBy=${sortBy}`;

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.BOOKS + query));
        if (response.ok) {
            const result = await response.json();
            const books = result.data || [];
            const pagination = result.pagination || {};
            
            renderBooks(books.slice(0, limit));
            // Sử dụng dữ liệu phân trang chuẩn từ Backend
            renderPagination(pagination);
            
            // Update Title
            if (isSale) {
                document.getElementById("categoryTitle").textContent = "🔥 Deal Hời Mỗi Ngày";
            } else if (search) {
                document.getElementById("categoryTitle").textContent = `Kết quả tìm kiếm: "${search}"`;
            } else if (catId) {
                document.getElementById("categoryTitle").textContent = "Danh mục sản phẩm";
            } else {
                document.getElementById("categoryTitle").textContent = "Tất cả sản phẩm";
            }
        }
    } catch (e) {
        console.error("Filter error:", e);
    }
}

function renderBooks(books) {
    const list = document.getElementById("productList");
    if (books.length === 0) {
        list.innerHTML = `<div style="text-align:center; grid-column: 1/-1; padding: 50px;">
            <img src="image/logo/logo.png" style="width:100px; opacity:0.3; margin-bottom:20px">
            <h3>Rất tiếc, không tìm thấy sách phù hợp!</h3>
            <p style="color:var(--text-muted)">Vui lòng thử lại với bộ lọc khác.</p>
        </div>`;
        return;
    }

    list.innerHTML = books.map(book => renderBookCard(book)).join("");
}

function renderPagination(pagination) {
    const { totalPages, currentPage } = pagination;
    const container = document.getElementById("pagination");
    if (!container) return;

    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    // Nút Trước
    html += `<button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
             ${currentPage === 1 ? 'disabled' : ''} 
             onclick="applyFilters(${currentPage - 1})"><i class="fa-solid fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="applyFilters(${i})">${i}</button>`;
    }

    // Nút Sau
    html += `<button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
             ${currentPage === totalPages ? 'disabled' : ''} 
             onclick="applyFilters(${currentPage + 1})"><i class="fa-solid fa-chevron-right"></i></button>`;

    container.innerHTML = html;
}
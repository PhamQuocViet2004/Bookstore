// js/admin-chat.js
let adminChatSocket;
let selectedUserId = null;

document.addEventListener("DOMContentLoaded", () => {
    initAdminChat();
});

async function initAdminChat() {
    const partnerList = document.getElementById("adminChatPartnerList");
    const chatInput = document.getElementById("adminChatInput");
    const chatSend = document.getElementById("adminChatSend");

    if (!partnerList) return;

    // Load partners
    loadChatPartners();

    // Init Socket
    if (typeof io !== "undefined") {
        adminChatSocket = io(CONFIG.SOCKET_URL);
        
        adminChatSocket.on("connect", () => {
            const userInfoStr = localStorage.getItem("userInfo");
            const userInfo = JSON.parse(userInfoStr || "{}");
            if (userInfo.id) {
                adminChatSocket.emit("joinAdmin", userInfo.id);
                console.log("Admin Chat Socket: Connected as", userInfo.fullName);
            }
        });

        adminChatSocket.on("receiveMessage", (msg) => {
            if (selectedUserId && (msg.senderId === selectedUserId || msg.receiverId === selectedUserId)) {
                appendAdminMessage(msg);
                markAsRead(selectedUserId);
            } else {
                // Cập nhật danh sách đối tác để hiện số tin chưa đọc
                loadChatPartners();
                
                const adminChatDot = document.getElementById("adminChatDot");
                if (adminChatDot) adminChatDot.style.display = "block";
            }
        });

        adminChatSocket.on("messageSent", (msg) => {
            if (selectedUserId && msg.receiverId === selectedUserId) {
                appendAdminMessage(msg);
            }
        });
    }

    // Send logic
    const sendMsg = () => {
        const content = chatInput.value.trim();
        if (!content || !selectedUserId) return;

        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        adminChatSocket.emit("sendMessage", {
            senderId: userInfo.id,
            receiverId: selectedUserId,
            content: content
        });
        chatInput.value = "";
    };

    chatSend.addEventListener("click", sendMsg);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });
}

async function loadChatPartners() {
    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.MESSAGES}/partners`));
        const result = await response.json();
        
        if (result.success) {
            renderChatPartners(result.data);
        }
    } catch (err) {
        console.error("Lỗi tải danh sách đối tác chat:", err);
    }
}

function renderChatPartners(partners) {
    const list = document.getElementById("adminChatPartnerList");
    if (!list) return;

    if (partners.length === 0) {
        list.innerHTML = `<div class="chat-empty-state" style="padding:20px; text-align:center;">Chưa có hội thoại nào.</div>`;
        return;
    }

    list.innerHTML = partners.map(p => `
        <div class="partner-item ${selectedUserId == p.id ? 'active' : ''}" onclick="selectPartner(${p.id}, '${p.fullName}')">
            <div class="partner-avatar">
                ${p.avatar ? `<img src="${p.avatar}" alt="${p.fullName}">` : `<div class="avatar-placeholder">${p.fullName.charAt(0).toUpperCase()}</div>`}
            </div>
            <div class="partner-info">
                <div class="partner-name">${p.fullName}</div>
                <div class="partner-role">${p.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</div>
            </div>
            ${p.unreadCount > 0 ? `<div class="unread-count">${p.unreadCount}</div>` : ''}
        </div>
    `).join("");

    // Cập nhật tổng số chưa đọc để hiện nút đỏ ở sidebar
    const totalUnread = partners.reduce((sum, p) => sum + (p.unreadCount || 0), 0);
    const sidebarDot = document.getElementById("adminChatDot");
    if (sidebarDot) {
        sidebarDot.style.display = totalUnread > 0 ? "block" : "none";
    }
}

async function markAsRead(userId) {
    if (!userId) return;
    try {
        await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.MESSAGES}/mark-read/${userId}`), {
            method: 'PATCH'
        });
        loadChatPartners();
    } catch (err) {
        console.error("Lỗi đánh dấu đã đọc:", err);
    }
}

async function selectPartner(userId, fullName) {
    selectedUserId = userId;
    const partnerNameEl = document.getElementById("chatPartnerName") || document.getElementById("selectedPartnerName");
    if (partnerNameEl) partnerNameEl.innerText = fullName;
    
    const statusEl = document.querySelector(".chat-partner-status");
    if (statusEl) statusEl.innerText = "Đang tư vấn cho khách hàng";

    const chatInput = document.getElementById("adminChatInput");
    const chatSend = document.getElementById("adminChatSend");
    
    if (chatInput) chatInput.disabled = false;
    if (chatSend) chatSend.disabled = false;

    // Đánh dấu đã đọc
    markAsRead(userId);

    loadAdminChatHistory(userId);
    // Update UI active state
    document.querySelectorAll(".partner-item").forEach(item => {
        item.classList.remove("active");
        const onclickAttr = item.getAttribute("onclick");
        if (onclickAttr && onclickAttr.includes(userId)) {
            item.classList.add("active");
        }
    });
}

async function loadAdminChatHistory(partnerId) {
    const container = document.getElementById("adminChatMessages");
    container.innerHTML = '<p style="padding:20px; text-align:center;">Đang tải tin nhắn...</p>';

    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.MESSAGES}?partnerId=${partnerId}`));
        const result = await response.json();
        
        if (result.success) {
            container.innerHTML = '';
            if (result.data.length === 0) {
                container.innerHTML = '<div class="chat-empty-state"><p>Chưa có tin nhắn nào với người này.</p></div>';
            } else {
                result.data.forEach(msg => appendAdminMessage(msg));
            }
        }
    } catch (err) {
        console.error("Lỗi tải lịch sử chat admin:", err);
    }
}

function appendAdminMessage(msg) {
    const container = document.getElementById("adminChatMessages");
    if (!container) return;

    // Xóa empty state nếu có
    const empty = container.querySelector('.chat-empty-state');
    if (empty) empty.remove();

    const senderRole = (msg.sender && msg.sender.role) || '';
    const isMe = senderRole === 'admin' || senderRole === 'librarian';
    
    const div = document.createElement("div");
    div.className = `admin-msg ${isMe ? 'sent' : 'received'}`;
    div.innerHTML = `
        ${msg.content}
        <div class="msg-time">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

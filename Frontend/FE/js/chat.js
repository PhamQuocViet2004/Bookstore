// js/chat.js
document.addEventListener("DOMContentLoaded", () => {
    initChat();
});

let chatSocket;
let currentPartnerId = 1; // Mặc định là Admin (ID=1)

async function initChat() {
    const chatToggle = document.getElementById("chatToggle");
    const chatWindow = document.getElementById("chatWindow");
    const chatClose = document.getElementById("chatClose");
    const chatSend = document.getElementById("chatSend");
    const chatInput = document.getElementById("chatInput");
    const userInfoStr = localStorage.getItem("userInfo");

    if (!chatToggle || !chatWindow) return;

    // Fetch Admin ID dynamically
    try {
        const adminRes = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.MESSAGES}/admin-id`));
        const adminData = await adminRes.json();
        if (adminData.success) {
            currentPartnerId = adminData.adminId;
            console.log("Chat với Admin ID:", currentPartnerId);
        }
    } catch (err) {
        console.error("Không lấy được Admin ID, dùng mặc định:", currentPartnerId);
    }

    // Toggle Chat
    chatToggle.addEventListener("click", () => {
        chatWindow.classList.toggle("hidden");
        if (!chatWindow.classList.contains("hidden")) {
            loadChatHistory();
            document.getElementById("chatBadge").classList.add("hidden");
            document.getElementById("chatBadge").textContent = "0";
        }
    });

    chatClose.addEventListener("click", () => {
        chatWindow.classList.add("hidden");
    });

    // Send Message
    const sendMessage = () => {
        const content = chatInput.value.trim();
        if (!content || !userInfoStr) return;

        const user = JSON.parse(userInfoStr);
        const data = {
            senderId: user.id,
            receiverId: currentPartnerId,
            content: content
        };

        if (chatSocket) {
            chatSocket.emit("sendMessage", data);
            chatInput.value = "";
        }
    };

    chatSend.addEventListener("click", sendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    // Init Socket for Chat
    if (typeof io !== "undefined") {
        chatSocket = io(CONFIG.SOCKET_URL);
        
        if (userInfoStr) {
            const user = JSON.parse(userInfoStr);
            chatSocket.emit("join", user.id);

            chatSocket.on("receiveMessage", (msg) => {
                if (chatWindow.classList.contains("hidden")) {
                    const badge = document.getElementById("chatBadge");
                    badge.classList.remove("hidden");
                    badge.textContent = parseInt(badge.textContent) + 1;
                }
                appendMessage(msg);
            });

            chatSocket.on("messageSent", (msg) => {
                appendMessage(msg);
            });
        }
    }
}

async function loadChatHistory() {
    const userInfoStr = localStorage.getItem("userInfo");
    if (!userInfoStr) return;

    try {
        const response = await apiFetch(getFullUrl(`${CONFIG.ENDPOINTS.MESSAGES}?partnerId=${currentPartnerId}`));
        const result = await response.json();
        
        if (result.success) {
            const container = document.getElementById("chatMessages");
            container.innerHTML = '<div class="message system">Lịch sử trò chuyện đã được tải</div>';
            result.data.forEach(msg => appendMessage(msg));
        }
    } catch (err) {
        console.error("Lỗi tải lịch sử chat:", err);
    }
}

function appendMessage(msg) {
    const container = document.getElementById("chatMessages");
    if (!container) return;

    const userInfoStr = localStorage.getItem("userInfo");
    const userId = userInfoStr ? JSON.parse(userInfoStr).id : null;
    
    const isMe = msg.senderId === userId;
    
    const div = document.createElement("div");
    div.className = `message ${isMe ? 'sent' : 'received'}`;
    div.innerHTML = `
        <div class="message-content">${msg.content}</div>
        <div class="message-time">${new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

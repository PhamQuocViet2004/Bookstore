document.getElementById("registerForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }

    if (password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }

    const data = {
        fullName,
        email,
        phone,
        password
    };

    try {
        const response = await apiFetch(getFullUrl(CONFIG.ENDPOINTS.REGISTER), {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Đăng ký thành công! Vui lòng đăng nhập.");
            window.location.href = "login.html";
        } else {
            alert("Đăng ký thất bại: " + (result.message || "Có lỗi xảy ra"));
            console.error("Lỗi:", result);
        }
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        alert("Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
    }
});

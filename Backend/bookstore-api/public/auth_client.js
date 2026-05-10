const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

const showMessage = (text, type) => {
  message.textContent = text;
  message.className = type === "error" ? "error" : "success";
  message.style.display = "block";
};

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    submitBtn.textContent = "Đang đăng nhập...";
    submitBtn.disabled = true;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showMessage("Đăng nhập thành công! Chuyển hướng...", "success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      } else {
        showMessage(data.message || "Đăng nhập thất bại", "error");
      }
    } catch (err) {
      showMessage("Đã có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      submitBtn.textContent = "Đăng nhập";
      submitBtn.disabled = false;
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
      const fullName = document.getElementById("fullName").value;
      const phone = document.getElementById("phone").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      submitBtn.textContent = "Đang xử lý...";
      submitBtn.disabled = true;

      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName, phone, email, password }),
        });

      const data = await response.json();

      if (response.ok) {
        showMessage("Tạo tài khoản thành công! Đang chuyển hướng...", "success");
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        showMessage(data.message || "Đăng ký thất bại", "error");
      }
    } catch (err) {
      showMessage("Đã có lỗi xảy ra. Vui lòng thử lại.", "error");
    } finally {
      submitBtn.textContent = "Đăng ký tài khoản";
      submitBtn.disabled = false;
    }
  });
}

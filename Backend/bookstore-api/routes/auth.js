const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// Authentication routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.get("/me", authMiddleware, authController.getMe);
router.put("/me", authMiddleware, authController.updateMe);
router.post("/change-password", authMiddleware, authController.changePassword);

// API kiểm tra quyền Admin dành riêng cho FE sử dụng
router.get("/check-admin", authMiddleware, (req, res) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'librarian')) {
    res.status(200).json({ isAdmin: true, role: req.user.role });
  } else {
    res.status(403).json({ isAdmin: false, message: "Không có quyền" });
  }
});

module.exports = router;

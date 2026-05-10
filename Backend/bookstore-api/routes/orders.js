const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// User routes
router.post("/", authMiddleware, orderController.createOrder); // Đặt hàng
router.get("/my-orders", authMiddleware, orderController.getMyOrders); // Xem DS đơn hàng cá nhân
router.get("/:id", authMiddleware, orderController.getOrderById); // Xem chi tiết 1 đơn hàng
router.post("/:id/cancel", authMiddleware, orderController.cancelOrder); // Hủy đơn hàng

// Admin / Librarian routes
router.get("/all", authMiddleware, roleMiddleware(['admin', 'librarian']), orderController.getAllOrders); // Xem tất cả
router.patch("/:id/status", authMiddleware, roleMiddleware(['admin', 'librarian']), orderController.updateOrderStatus); // Cập nhật trạng thái

module.exports = router;
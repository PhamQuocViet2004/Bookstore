const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const orderController = require("../controllers/orderController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// All admin routes require admin role
router.use(authMiddleware, roleMiddleware(['admin', 'librarian']));

router.get("/stats", dashboardController.getStats);
router.get("/orders", orderController.getAllOrders);
router.put("/orders/:id/status", orderController.updateOrderStatus);

module.exports = router;

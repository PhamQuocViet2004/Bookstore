const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/", authMiddleware, notificationController.getMyNotifications);
router.post("/read-all", authMiddleware, notificationController.markAllAsRead);
router.patch("/:id/read", authMiddleware, notificationController.markAsRead);

module.exports = router;

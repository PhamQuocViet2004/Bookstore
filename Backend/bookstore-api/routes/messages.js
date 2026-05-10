const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

router.get("/", messageController.getMessages);
router.get("/partners", messageController.getMyChatPartners);
router.get("/admin-id", messageController.getAdminId);
router.patch("/mark-read/:partnerId", messageController.markMessagesAsRead);

module.exports = router;

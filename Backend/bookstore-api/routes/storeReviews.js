const express = require("express");
const router = express.Router();
const storeReviewController = require("../controllers/storeReviewController");
const authMiddleware = require("../middlewares/authMiddleware");

// Lấy danh sách đánh giá (Công khai)
router.get("/", storeReviewController.getAllStoreReviews);

// Lấy thống kê (Công khai)
router.get("/stats", storeReviewController.getStoreRatingStats);

// Gửi đánh giá mới (Cần đăng nhập)
router.post("/", authMiddleware, storeReviewController.createStoreReview);

module.exports = router;

const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const authMiddleware = require("../middlewares/authMiddleware");

// Lấy đánh giá của sách (Công khai)
router.get("/book/:bookId", reviewController.getBookReviews);

// Gửi đánh giá (Cần đăng nhập)
router.post("/", authMiddleware, reviewController.createReview);

// Xóa đánh giá (Admin hoặc Người viết)
router.delete("/:id", authMiddleware, reviewController.deleteReview);

module.exports = router;

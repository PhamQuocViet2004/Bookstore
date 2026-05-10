const { Review, User, Book, Order, OrderItem } = require("../models");

// 1. Gửi đánh giá mới
const createReview = async (req, res) => {
  try {
    const { bookId, rating, content } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem user đã mua sách này chưa (Tùy chọn: bỏ qua nếu muốn cho phép đánh giá tự do)
    const hasBought = await Order.findOne({
      where: { userId, status: 'delivered' },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { bookId }
      }]
    });

    if (!hasBought) {
      return res.status(403).json({ message: "Bạn cần mua và nhận sách thành công mới có thể đánh giá." });
    }

    // Kiểm tra xem đã đánh giá chưa
    const existingReview = await Review.findOne({ where: { bookId, userId } });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá sách này rồi." });
    }

    const review = await Review.create({
      bookId,
      userId,
      rating,
      content
    });

    res.status(201).json({ message: "Đánh giá thành công!", review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi gửi đánh giá." });
  }
};

// 2. Lấy danh sách đánh giá của một cuốn sách
const getBookReviews = async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.findAll({
      where: { bookId },
      include: [{
        model: User,
        as: 'user',
        attributes: ['fullName', 'avatar']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đánh giá." });
  }
};

// 3. Xóa đánh giá (Admin hoặc Người viết)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findByPk(id);

    if (!review) return res.status(404).json({ message: "Đánh giá không tồn tại." });

    if (req.user.role !== 'admin' && req.user.id !== review.userId) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đánh giá này." });
    }

    await review.destroy();
    res.json({ message: "Đã xóa đánh giá thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa đánh giá." });
  }
};

module.exports = { createReview, getBookReviews, deleteReview };

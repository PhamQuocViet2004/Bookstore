const { StoreReview, User } = require("../models");

// Gửi đánh giá mới
const createStoreReview = async (req, res) => {
  try {
    const { rating, content } = req.body;
    const userId = req.user.id;

    // Kiểm tra xem người dùng đã đánh giá chưa (tùy chọn: cho phép đánh giá nhiều lần hoặc chỉ 1 lần)
    // Ở đây cho phép đánh giá nhiều lần để tăng tương tác

    const review = await StoreReview.create({
      userId,
      rating,
      content
    });

    res.status(201).json({
      success: true,
      message: "Cảm ơn bạn đã đánh giá cửa hàng!",
      data: review
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi gửi đánh giá." });
  }
};

// Lấy danh sách đánh giá công khai (Có phân trang & lọc)
const getAllStoreReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const rating = req.query.rating; // Có thể null nếu xem tất cả
    const offset = (page - 1) * limit;

    const where = { isActive: true };
    if (rating && rating !== 'all') {
      where.rating = parseInt(rating);
    }

    const { count, rows } = await StoreReview.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'avatar'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy đánh giá." });
  }
};

// Lấy thống kê sao trung bình
const getStoreRatingStats = async (req, res) => {
  try {
    const reviews = await StoreReview.findAll({ where: { isActive: true } });
    
    if (reviews.length === 0) {
      return res.json({
        success: true,
        data: { average: 5, total: 0 }
      });
    }

    const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
    const average = (sum / reviews.length).toFixed(1);

    res.json({
      success: true,
      data: { average: parseFloat(average), total: reviews.length }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy thống kê đánh giá." });
  }
};

module.exports = {
  createStoreReview,
  getAllStoreReviews,
  getStoreRatingStats
};

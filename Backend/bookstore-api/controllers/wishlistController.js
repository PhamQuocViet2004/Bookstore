const { Wishlist, Book } = require("../models");

// 1. Get wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [{ model: Book, as: 'book' }]
    });
    const books = wishlist.map(item => item.book).filter(b => b);
    res.json({ success: true, data: books });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách yêu thích." });
  }
};

// 2. Add to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { bookId } = req.body;
    const [item, created] = await Wishlist.findOrCreate({
      where: { userId: req.user.id, bookId }
    });
    res.json({ success: true, message: created ? "Đã thêm vào yêu thích" : "Đã có trong yêu thích" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi thêm vào yêu thích." });
  }
};

// 3. Remove from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { bookId } = req.params;
    await Wishlist.destroy({ where: { userId: req.user.id, bookId } });
    res.json({ success: true, message: "Đã xóa khỏi yêu thích" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa khỏi yêu thích." });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };

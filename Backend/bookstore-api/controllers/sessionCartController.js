const { Book } = require("../models");

// 1. Get cart from session
const getSessionCart = (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  res.json(req.session.cart);
};

// 2. Add item to session cart
const addToSessionCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    const book = await Book.findByPk(bookId);
    if (!book) return res.status(404).json({ message: "Sách không tồn tại." });

    if (book.stock < qty) {
      return res.status(400).json({ message: "Số lượng tồn kho không đủ." });
    }

    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if book already in cart
    const itemIndex = req.session.cart.findIndex(item => item.bookId == bookId);

    if (itemIndex > -1) {
      // Update quantity
      const newQty = req.session.cart[itemIndex].quantity + qty;
      if (book.stock < newQty) {
        return res.status(400).json({ message: "Tổng số lượng vượt quá tồn kho." });
      }
      req.session.cart[itemIndex].quantity = newQty;
    } else {
      // Add new item
      req.session.cart.push({
        bookId: book.id,
        title: book.title,
        price: book.price,
        discount: book.discount,
        image: book.image,
        quantity: qty
      });
    }

    res.json({ message: "Đã thêm vào giỏ hàng (session).", cart: req.session.cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi thêm vào giỏ hàng." });
  }
};

// 3. Update quantity in session cart
const updateSessionCartItem = (req, res) => {
  const { bookId } = req.params;
  const { quantity } = req.body;
  const qty = parseInt(quantity);

  if (!req.session.cart) {
    req.session.cart = [];
  }

  const itemIndex = req.session.cart.findIndex(item => item.bookId == bookId);
  if (itemIndex === -1) {
    return res.status(404).json({ message: `Sản phẩm với ID ${bookId} không có trong giỏ hàng.` });
  }


  if (qty <= 0) {
    req.session.cart.splice(itemIndex, 1);
  } else {
    req.session.cart[itemIndex].quantity = qty;
  }

  res.json({ message: "Cập nhật thành công.", cart: req.session.cart });
};

// 4. Remove item from session cart
const removeFromSessionCart = (req, res) => {
  const { bookId } = req.params;

  if (!req.session.cart) return res.status(404).json({ message: "Giỏ hàng trống." });

  req.session.cart = req.session.cart.filter(item => item.bookId != bookId);

  res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng.", cart: req.session.cart });
};

// 5. Clear session cart
const clearSessionCart = (req, res) => {
  req.session.cart = [];
  res.json({ message: "Đã làm trống giỏ hàng (session)." });
};

module.exports = {
  getSessionCart,
  addToSessionCart,
  updateSessionCartItem,
  removeFromSessionCart,
  clearSessionCart
};

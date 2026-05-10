const { CartItem, Book } = require("../models");

// 1. Lấy giỏ hàng
const getCart = async (req, res) => {
  try {
    let items = [];
    if (req.user) {
      // Người dùng đã đăng nhập -> Lấy từ DB
      const dbItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'book' }]
      });
      items = dbItems
        .filter(item => item.book) // Chỉ lấy nếu sách còn tồn tại
        .map(item => {
          const book = item.book;
          return {
            bookId: item.bookId,
            title: book.title,
            price: book.price,
            discount: book.discount,
            finalPrice: Math.round(book.price * (1 - (book.discount || 0) / 100)),
            image: book.image,
            quantity: item.quantity
          };
        });
    } else {
      // Khách -> Lấy từ Session
      items = req.session.cart || [];
    }
    return res.json({ 
      success: true,
      cart: items 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống khi lấy giỏ hàng" });
  }
};

// 2. Thêm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const qty = parseInt(quantity) || 1;
    const bId = parseInt(bookId);

    if (!bId) return res.status(400).json({ message: "ID sách không hợp lệ." });

    const book = await Book.findByPk(bId);
    if (!book) return res.status(404).json({ message: "Sách không tồn tại." });
    if (book.stock < qty) return res.status(400).json({ message: "Sách không đủ tồn kho." });

    if (req.user) {
      // LOGIC DATABASE
      let cartItem = await CartItem.findOne({ where: { userId: req.user.id, bookId: bId } });
      if (cartItem) {
        cartItem.quantity += qty;
        await cartItem.save();
      } else {
        cartItem = await CartItem.create({ userId: req.user.id, bookId: bId, quantity: qty });
      }
      
      // Lấy lại toàn bộ giỏ hàng để trả về cho FE (đồng nhất với guest)
      const dbItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'book' }]
      });
      const cart = dbItems.filter(item => item.book).map(item => ({
        bookId: item.bookId,
        title: item.book.title,
        price: item.book.price,
        discount: item.book.discount,
        finalPrice: Math.round(item.book.price * (1 - (item.book.discount || 0) / 100)),
        image: item.book.image,
        quantity: item.quantity
      }));

      return res.json({ 
        message: "Đã thêm vào giỏ hàng",
        cart 
      });
    } else {
      // LOGIC SESSION
      if (!req.session.cart) req.session.cart = [];
      const itemIndex = req.session.cart.findIndex(item => item.bookId == bId);

      if (itemIndex > -1) {
        req.session.cart[itemIndex].quantity += qty;
      } else {
        req.session.cart.push({
          bookId: book.id,
          title: book.title,
          price: book.price,
          discount: book.discount,
          finalPrice: Math.round(book.price * (1 - (book.discount || 0) / 100)),
          image: book.image,
          quantity: qty
        });
      }
      return res.json({ message: "Đã thêm vào giỏ hàng", cart: req.session.cart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi thêm vào giỏ hàng." });
  }
};

// 3. Cập nhật số lượng
const updateCartItem = async (req, res) => {
  try {
    const { bookId, quantity } = req.body;
    const qty = parseInt(quantity);
    const bId = parseInt(bookId);

    if (req.user) {
      const cartItem = await CartItem.findOne({ where: { userId: req.user.id, bookId: bId } });
      if (!cartItem) return res.status(404).json({ message: "Sản phẩm không có trong giỏ hàng" });

      if (qty <= 0) {
        await cartItem.destroy();
      } else {
        const book = await Book.findByPk(bId);
        if (book.stock < qty) return res.status(400).json({ message: "Không đủ tồn kho" });
        cartItem.quantity = qty;
        await cartItem.save();
      }
      
      // Trả về giỏ hàng mới
      const dbItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'book' }]
      });
      const cart = dbItems.filter(item => item.book).map(item => ({
        bookId: item.bookId,
        title: item.book.title,
        price: item.book.price,
        discount: item.book.discount,
        finalPrice: Math.round(item.book.price * (1 - (item.book.discount || 0) / 100)),
        image: item.book.image,
        quantity: item.quantity
      }));

      return res.json({ message: "Cập nhật thành công", cart });
    } else {
      // SESSION
      if (!req.session.cart) req.session.cart = [];
      const itemIndex = req.session.cart.findIndex(item => item.bookId == bId);
      if (itemIndex === -1) return res.status(404).json({ message: "Sản phẩm không tồn tại" });

      if (qty <= 0) {
        req.session.cart.splice(itemIndex, 1);
      } else {
        req.session.cart[itemIndex].quantity = qty;
      }
      return res.json({ message: "Cập nhật thành công", cart: req.session.cart });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 4. Xóa một sản phẩm
const removeFromCart = async (req, res) => {
  try {
    const { bookId } = req.params;
    const bId = parseInt(bookId);

    if (req.user) {
      await CartItem.destroy({ where: { userId: req.user.id, bookId: bId } });
      
      const dbItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'book' }]
      });
      const cart = dbItems.filter(item => item.book).map(item => ({
        bookId: item.bookId,
        title: item.book.title,
        price: item.book.price,
        discount: item.book.discount,
        finalPrice: Math.round(item.book.price * (1 - (item.book.discount || 0) / 100)),
        image: item.book.image,
        quantity: item.quantity
      }));
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng.", cart });
    } else {
      if (req.session.cart) {
        req.session.cart = req.session.cart.filter(item => item.bookId != bId);
      }
      return res.json({ message: "Đã xóa sản phẩm khỏi giỏ hàng.", cart: req.session.cart || [] });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa sản phẩm." });
  }
};

// 5. Làm trống giỏ hàng
const clearCart = async (req, res) => {
  try {
    if (req.user) {
      await CartItem.destroy({ where: { userId: req.user.id } });
    } else {
      req.session.cart = [];
    }
    res.json({ message: "Đã làm trống giỏ hàng.", cart: [] });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi làm trống giỏ hàng." });
  }
};

// 6. Cập nhật hàng loạt (Bulk Update)
const bulkUpdateCart = async (req, res) => {
  try {
    const { items } = req.body; // Expecting [{ bookId, quantity }, ...]
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: "Dữ liệu items phải là một mảng." });
    }

    if (req.user) {
      // DB Bulk Update - Merge guest items into DB
      for (const item of items) {
        const book = await Book.findByPk(item.bookId);
        if (!book) continue;

        let cartItem = await CartItem.findOne({ 
          where: { userId: req.user.id, bookId: item.bookId } 
        });

        if (cartItem) {
          // Sync logic: often it means replace or add. 
          // The contract says "merge session -> database".
          // We'll set the quantity to what FE sends.
          if (item.quantity <= 0) {
            await cartItem.destroy();
          } else {
            cartItem.quantity = item.quantity;
            await cartItem.save();
          }
        } else {
          if (item.quantity > 0) {
            await CartItem.create({
              userId: req.user.id,
              bookId: item.bookId,
              quantity: item.quantity
            });
          }
        }
      }
      
      const updatedDBItems = await CartItem.findAll({
        where: { userId: req.user.id },
        include: [{ model: Book, as: 'book' }]
      });
      
      const cart = updatedDBItems
        .filter(item => item.book)
        .map(item => {
          const book = item.book;
          return {
            bookId: item.bookId,
            title: book.title,
            price: book.price,
            discount: book.discount,
            finalPrice: Math.round(book.price * (1 - (book.discount || 0) / 100)),
            image: book.image,
            quantity: item.quantity
          };
        });

      return res.json({ message: "Đồng bộ giỏ hàng thành công", cart });
    } else {
      // Session Bulk Update
      if (!req.session.cart) req.session.cart = [];
      
      for (const newItem of items) {
        const book = await Book.findByPk(newItem.bookId);
        if (!book) continue;

        const index = req.session.cart.findIndex(i => i.bookId == newItem.bookId);
        if (index > -1) {
          if (newItem.quantity <= 0) {
            req.session.cart.splice(index, 1);
          } else {
            req.session.cart[index].quantity = newItem.quantity;
          }
        } else {
          if (newItem.quantity > 0) {
            req.session.cart.push({
              bookId: book.id,
              title: book.title,
              price: book.price,
              discount: book.discount,
              finalPrice: Math.round(book.price * (1 - (book.discount || 0) / 100)),
              image: book.image,
              quantity: newItem.quantity
            });
          }
        }
      }
      return res.json({ message: "Cập nhật giỏ hàng thành công", cart: req.session.cart });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, bulkUpdateCart };


const { Book, Category, User, sequelize, Sequelize } = require("../models");
const { Op } = require("sequelize");

// List all books with pagination, search, and filtering
const getAllBooks = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { categoryId, search, minPrice, maxPrice, isActive, sortBy, sortOrder, hasDiscount } = req.query;
    
    // Default filter
    const where = {};

    // Filter by discount
    if (hasDiscount === 'true') {
      where.discount = { [Op.gt]: 0 };
    }
    
    // Check if user is admin/librarian to see inactive books
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'librarian');

    if (isAdmin && isActive !== undefined) {
      where.isActive = isActive === 'true';
    } else if (!isAdmin) {
      where.isActive = true;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Search logic: Title, Author, or Category Name (Improved typo tolerance)
    if (search) {
      const searchLiteral = `%${search}%`;
      where[Op.or] = [
        { title: { [Op.like]: searchLiteral } },
        { author: { [Op.like]: searchLiteral } },
        { detail: { [Op.like]: searchLiteral } },
        { '$category.name$': { [Op.like]: searchLiteral } },
        // Thêm SOUNDEX để nhận diện các từ đồng âm hoặc sai lệch nhẹ (như Doremon vs Doraemon)
        sequelize.where(
          sequelize.fn('SOUNDEX', sequelize.col('Book.title')),
          sequelize.fn('SOUNDEX', search)
        )
      ];
    }
    
    // Price range filtering
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseInt(minPrice);
      if (maxPrice) where.price[Op.lte] = parseInt(maxPrice);
    }

    // Sorting logic
    let order = [['createdAt', 'DESC']]; // Default

    if (sortBy === 'newest') {
      order = [['createdAt', 'DESC']];
    } else if (sortBy === 'price-asc') {
      order = [['price', 'ASC']];
    } else if (sortBy === 'price-desc') {
      order = [['price', 'DESC']];
    } else if (sortBy === 'best-seller') {
      order = [['sold', 'DESC']];
    } else if (sortBy && sortOrder) {
      // Compatibility with old sorting
      const validSortFields = ['createdAt', 'price', 'sold', 'title'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const direction = (sortOrder.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';
      order = [[sortField, direction]];
    }

    const { count, rows: books } = await Book.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ],
      limit: limit,
      offset: offset,
      order: order,
      distinct: true // Important for accurate count when using includes
    });

    res.json({
      success: true,
      data: books,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalItems: count, // Keeping this as extra info
        limit: limit
      }
    });
  } catch (error) {
    console.error("Get All Books Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy danh sách sách" });
  }
};

// Get book by ID
const getBookById = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ]
    });

    if (!book) return res.status(404).json({ success: false, message: "Book not found" });
    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    console.error("Get Book By ID Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create new book
const createBook = async (req, res) => {
  try {
    const { title, author, price, discount, categoryId, image, detail, stock, isActive } = req.body;

    // Check if category exists
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res.status(400).json({ message: "Invalid category ID" });
    }

    const book = await Book.create({
      title,
      author,
      price,
      discount: discount || 0,
      categoryId,
      image: image || '',
      detail,
      stock: stock || 0,
      sold: 0,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: "Tạo sách mới thành công",
      data: book
    });
  } catch (error) {
    console.error("Create Book Error:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Validation error", errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update book
const updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    const { title, author, price, discount, categoryId, image, detail, stock, isActive } = req.body;

    // If category is being updated, check if it exists
    if (categoryId && categoryId !== book.categoryId) {
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    await book.update({
      title: title || book.title,
      author: author || book.author,
      price: price !== undefined ? price : book.price,
      discount: discount !== undefined ? discount : book.discount,
      categoryId: categoryId || book.categoryId,
      image: image !== undefined ? image : book.image,
      detail: detail !== undefined ? detail : book.detail,
      stock: stock !== undefined ? stock : book.stock,
      isActive: isActive !== undefined ? isActive : book.isActive
    });

    res.json({
      success: true,
      message: "Cập nhật sách thành công",
      data: book
    });
  } catch (error) {
    console.error("Update Book Error:", error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: "Validation error", errors: error.errors.map(e => e.message) });
    }
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete book (Hard delete)
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Hard delete - completely remove from database
    await book.destroy();

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Delete Book Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};

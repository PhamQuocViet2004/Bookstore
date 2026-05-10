const { Category, User } = require("../models");
const { Op } = require("sequelize");

// List all categories
const getAllCategories = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const categories = await Category.findAll({
      where,
      attributes: {
        include: [
          [
            Category.sequelize.literal(`(
                SELECT COALESCE(COUNT(*), 0)
                FROM books AS book
                WHERE book.categoryId = Category.id
            )`),
            'bookCount'
          ]
        ]
      },
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'fullName'] }
      ]
    });

    if (!category) return res.status(404).json({ message: "Danh mục không tồn tại" });
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, slug, description, image, isActive } = req.body;

    const category = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/ /g, '-'),
      description: description || '',
      image: image || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user ? req.user.id : null
    });

    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Tên danh mục hoặc slug đã tồn tại" });
    }
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Danh mục không tồn tại" });

    const { name, slug, description, image, isActive } = req.body;

    await category.update({
      name: name || category.name,
      slug: slug || category.slug,
      description: description !== undefined ? description : category.description,
      image: image !== undefined ? image : category.image,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.json(category);
  } catch (error) {
    console.error(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: "Tên danh mục hoặc slug đã tồn tại" });
    }
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Delete category
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: "Danh mục không tồn tại" });

    await category.destroy();

    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};

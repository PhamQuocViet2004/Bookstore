const { Book, User, Order, Category, sequelize } = require("../models");

const getStats = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Monthly Revenue
    const revenueMonth = await Order.sum('totalPrice', { 
      where: { 
        status: 'delivered',
        createdAt: { [Op.gte]: firstDayOfMonth }
      } 
    }) || 0;

    // 2. New Orders this month
    const newOrders = await Order.count({
      where: { createdAt: { [Op.gte]: firstDayOfMonth } }
    });

    // 3. New Users this month
    const newUsers = await User.count({
      where: { createdAt: { [Op.gte]: firstDayOfMonth } }
    });

    // 4. Low stock count (e.g. stock < 5)
    const lowStockCount = await Book.count({
      where: { stock: { [Op.lt]: 5 } }
    });

    // 5. Real revenue chart (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyRevenue = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalPrice')), 'total']
      ],
      where: {
        status: { [Op.ne]: 'cancelled' }, // Không tính đơn đã hủy
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Map dữ liệu về mảng 7 phần tử để vẽ biểu đồ
    const revenueChart = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const match = dailyRevenue.find(r => r.date === dateStr);
      revenueChart.push(match ? parseInt(match.total) : 0);
    }

    // 6. Top Selling Books
    const topBooks = await Book.findAll({
      order: [['sold', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'image', 'sold', 'price']
    });

    // 7. Sales by Category (for Pie Chart) - Dùng Subquery cho an toàn
    const salesByCategory = await Category.findAll({
      attributes: [
        'name',
        [
          sequelize.literal(`(
            SELECT COALESCE(SUM(sold), 0)
            FROM books
            WHERE books.categoryId = Category.id
          )`),
          'totalSold'
        ]
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        revenueMonth,
        newOrders,
        newUsers,
        lowStockCount,
        revenueChart,
        topBooks,
        salesByCategory
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy thống kê." });
  }
};

module.exports = { getStats };

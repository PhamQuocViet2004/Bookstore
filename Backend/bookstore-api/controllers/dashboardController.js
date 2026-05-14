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

    // Lấy TẤT CẢ đơn hàng trong 7 ngày qua và tự group bằng JS để tránh lỗi Timezone/Alias của Sequelize
    const recentOrders = await Order.findAll({
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.gte]: sevenDaysAgo }
      },
      raw: true
    });

    const revenueChart = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      // Tính tổng doanh thu của ngày này
      let dailyTotal = 0;
      recentOrders.forEach(order => {
        // Parse order.createdAt về giờ local
        const orderDate = new Date(order.createdAt);
        const orderY = orderDate.getFullYear();
        const orderM = String(orderDate.getMonth() + 1).padStart(2, '0');
        const orderD = String(orderDate.getDate()).padStart(2, '0');
        const orderDateStr = `${orderY}-${orderM}-${orderD}`;
        
        if (orderDateStr === dateStr) {
          dailyTotal += parseInt(order.totalPrice || 0);
        }
      });
      
      revenueChart.push(dailyTotal);
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

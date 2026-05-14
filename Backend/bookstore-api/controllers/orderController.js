const { Order, OrderItem, Book, User, CartItem, sequelize } = require("../models");

// 1. Tạo đơn hàng mới
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    let { items, shippingAddress, paymentMethod, note } = req.body;
    const userId = req.user.id;

    // Nếu FE không gửi items, tự động lấy từ Cart trong DB
    if (!items || items.length === 0) {
      const cartItems = await CartItem.findAll({
        where: { userId },
        include: [{ model: Book, as: 'book' }]
      });

      if (!cartItems || cartItems.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm trước khi đặt hàng." });
      }

      items = cartItems.map(ci => ({
        bookId: ci.bookId,
        quantity: ci.quantity
      }));
    }

    // Nếu không gửi địa chỉ, lấy địa chỉ từ profile user
    if (!shippingAddress) {
      const user = await User.findByPk(userId);
      shippingAddress = user.address || "Chưa có địa chỉ";
    }

    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const book = await Book.findByPk(item.bookId, { transaction });
      if (!book) {
        await transaction.rollback();
        return res.status(404).json({ message: `Sách ID ${item.bookId} không tồn tại.` });
      }

      if (book.stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ message: `Sách "${book.title}" không đủ tồn kho.` });
      }

      const finalPrice = Math.round(book.price * (1 - (book.discount / 100)));
      const subtotal = finalPrice * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        bookId: book.id,
        quantity: item.quantity,
        unitPrice: book.price,
        discountAtPurchase: book.discount,
        finalUnitPrice: finalPrice,
        subtotal: subtotal
      });

      // Cập nhật tồn kho và số lượng đã bán
      await book.update({
        stock: book.stock - item.quantity,
        sold: (book.sold || 0) + item.quantity
      }, { transaction });
    }

    // 4. Áp dụng Voucher (nếu có)
    let { voucherCode } = req.body;
    let discountValue = 0;
    let voucherId = null;

    if (voucherCode) {
      const { Voucher } = require("../models");
      const voucher = await Voucher.findOne({
        where: { code: voucherCode, isActive: true }
      });

      if (voucher) {
        // Kiểm tra điều kiện đơn hàng tối thiểu
        if (totalAmount >= voucher.minOrderValue) {
          if (voucher.type === 'percentage') {
            discountValue = Math.round(totalAmount * (voucher.value / 100));
            if (voucher.maxDiscount && discountValue > voucher.maxDiscount) {
              discountValue = voucher.maxDiscount;
            }
          } else {
            discountValue = voucher.value;
          }
          voucherId = voucher.id;
          totalAmount = Math.max(0, totalAmount - discountValue);
          
          // Tăng lượt sử dụng voucher
          await voucher.update({ usedCount: voucher.usedCount + 1 }, { transaction });
        }
      }
    }

    // Tạo Order
    const order = await Order.create({
      userId,
      shippingAddress: typeof shippingAddress === 'string' ? { address: shippingAddress } : shippingAddress,
      totalPrice: totalAmount,
      voucherId: voucherId,
      discountAmount: discountValue,
      paymentMethod: paymentMethod || 'cod',
      note: note || '',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    }, { transaction });

    // Tạo OrderItems
    const itemsWithOrderId = orderItemsData.map(item => ({
      ...item,
      orderId: order.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    await OrderItem.bulkCreate(itemsWithOrderId, { transaction });

    // XÓA GIỎ HÀNG SAU KHI ĐẶT HÀNG THÀNH CÔNG
    await CartItem.destroy({ where: { userId }, transaction });

    await transaction.commit();

    // TẠO THÔNG BÁO CHO ADMIN (Sử dụng try-catch riêng để không làm hỏng flow chính)
    try {
      const { Notification, User } = require("../models");
      const admins = await User.findAll({ where: { role: ['admin', 'librarian'] } });
      const user = await User.findByPk(userId);
      
      const adminNotifs = admins.map(admin => ({
        userId: admin.id,
        title: "🔔 Có đơn hàng mới!",
        message: `Khách hàng ${user.fullName} vừa đặt một đơn hàng mới. Tổng tiền: ${totalAmount.toLocaleString()}đ`,
        type: 'new_order',
        relatedId: order.id
      }));
      await Notification.bulkCreate(adminNotifs);

      // SOCKET REALTIME
      const io = req.app.get('io');
      if (io) {
        io.to('admin_room').emit('newOrder', {
          orderId: order.id,
          message: `Khách hàng ${user.fullName} vừa đặt một đơn hàng mới.`
        });
      }
    } catch (err) { console.error("Lỗi tạo thông báo admin:", err); }

    res.status(201).json({
      message: "Đặt hàng thành công",
      orderId: order.id,
      total: totalAmount
    });

  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Lỗi hệ thống khi tạo đơn hàng.", error: error.message, stack: error.stack });
  }
};

// 2. Lấy danh sách đơn hàng của người dùng đang đăng nhập
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, as: 'items', include: [{ model: Book, as: 'book' }] }],
      order: [['createdAt', 'DESC']]
    });

    // Map totalPrice thành total cho FE
    const mappedOrders = orders.map(order => {
      const o = order.toJSON();
      o.total = o.totalPrice || 0;
      return o;
    });

    res.json(mappedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng." });
  }
};

// 3. Lấy tất cả đơn hàng (Admin/Librarian) - Có phân trang và lọc
const getAllOrders = async (req, res) => {
  try {
    const { status, paymentMethod, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) whereClause.status = status;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;

    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['id', 'fullName', 'email', 'phone']
    };

    // Nếu có tìm kiếm theo tên hoặc email khách hàng
    if (search) {
      const { Op } = require('sequelize');
      userInclude.where = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        userInclude,
        { model: User, as: 'processor', attributes: ['id', 'fullName'] },
        { model: OrderItem, as: 'items', include: [{ model: Book, as: 'book' }] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true // Tránh đếm thừa khi include 1-n
    });

    // Map totalPrice thành total cho FE
    const mappedRows = rows.map(order => {
      const o = order.toJSON();
      o.total = o.totalPrice || 0;
      return o;
    });

    res.json({
      success: true,
      data: mappedRows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng." });
  }
};

// 4. Lấy chi tiết đơn hàng
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: User, as: 'processor', attributes: ['id', 'fullName'] },
        { model: OrderItem, as: 'items', include: [{ model: Book, as: 'book' }] }
      ]
    });

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại." });

    // Bảo mật: Chỉ chủ đơn hàng hoặc Admin mới được xem
    if (order.userId !== req.user.id && req.user.role === 'user') {
      return res.status(403).json({ message: "Bạn không có quyền truy cập đơn hàng này." });
    }

    const mappedOrder = order.toJSON();
    mappedOrder.total = mappedOrder.totalPrice || 0;

    res.json(mappedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy chi tiết đơn hàng." });
  }
};

// 5. Cập nhật trạng thái đơn hàng (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { status, isPaid } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại." });

    const oldStatus = order.status;
    const newStatus = status || order.status;

    // Quản lý tồn kho khi đổi trạng thái sang 'cancelled' hoặc ngược lại
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
        // Trả lại kho
        const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
        for (const item of orderItems) {
            const book = await Book.findByPk(item.bookId);
            if (book) {
                await book.update({
                    stock: book.stock + item.quantity,
                    sold: book.sold - item.quantity
                });
            }
        }
    } else if (oldStatus === 'cancelled' && (newStatus === 'pending' || newStatus === 'confirmed' || newStatus === 'shipping')) {
        // Kiểm tra xem có đủ hàng để khôi phục không
        const orderItems = await OrderItem.findAll({ where: { orderId: order.id } });
        for (const item of orderItems) {
            const book = await Book.findByPk(item.bookId);
            if (!book || book.stock < item.quantity) {
                return res.status(400).json({ message: `Sách "${book ? book.title : '???'}" không đủ tồn kho để khôi phục đơn hàng.` });
            }
            await book.update({
                stock: book.stock - item.quantity,
                sold: book.sold + item.quantity
            });
        }
    }

    await order.update({
      status: newStatus,
      isPaid: isPaid !== undefined ? isPaid : order.isPaid,
      paidAt: (isPaid && !order.isPaid) ? new Date() : order.paidAt,
      processedBy: req.user.id
    });

    // TẠO THÔNG BÁO CHO NGƯỜI DÙNG
    try {
        const { Notification } = require("../models");
        const statusNames = {
            'confirmed': 'đã được xác nhận',
            'shipping': 'đang được giao',
            'delivered': 'đã giao thành công',
            'cancelled': 'đã bị hủy'
        };
        const statusVi = statusNames[status] || status;

        await Notification.create({
            userId: order.userId,
            title: "📦 Cập nhật đơn hàng",
            message: `Đơn hàng #${order.id} của bạn ${statusVi}.`,
            type: 'order_status',
            relatedId: order.id
        });

        // SOCKET REALTIME
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${order.userId}`).emit('notification', {
                title: "Cập nhật đơn hàng",
                message: `Đơn hàng #${order.id} của bạn ${statusVi}.`
            });
            io.to('admin_room').emit('dashboardUpdate');
        }
    } catch (err) { console.error("Lỗi tạo thông báo user:", err); }

    res.json({ message: "Cập nhật đơn hàng thành công.", order });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật trạng thái đơn hàng." });
  }
};

// 6. Hủy đơn hàng
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: "Đơn hàng không tồn tại." });
    }

    // Kiểm tra tính hợp lệ: Chỉ được hủy khi đang ở trạng thái 'pending'
    if (order.status !== 'pending' && req.user.role === 'user') {
      await transaction.rollback();
      return res.status(400).json({ message: "Không thể hủy đơn hàng đã xử lý." });
    }

    // Hoàn trả tồn kho
    for (const item of order.items) {
      const book = await Book.findByPk(item.bookId, { transaction });
      if (book) {
        await book.update({
          stock: book.stock + item.quantity,
          sold: book.sold - item.quantity
        }, { transaction });
      }
    }

    await order.update({ status: 'cancelled' }, { transaction });
    await transaction.commit();

    res.json({ message: "Đơn hàng đã được hủy." });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Lỗi hệ thống khi hủy đơn hàng." });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, getOrderById, updateOrderStatus, cancelOrder };

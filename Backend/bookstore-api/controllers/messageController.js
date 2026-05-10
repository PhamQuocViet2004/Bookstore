const { Message, User } = require("../models");
const { Op } = require("sequelize");

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const partnerId = req.query.partnerId;

    if (!partnerId) {
      return res.status(400).json({ message: "Thiếu partnerId" });
    }

    let whereClause;
    if (userRole === 'admin' || userRole === 'librarian') {
      // Admin thấy tất cả tin nhắn giữa partnerId và BẤT KỲ admin nào
      const adminUsers = await User.findAll({
        where: { role: { [Op.or]: ['admin', 'librarian'] } },
        attributes: ['id']
      });
      const adminIds = adminUsers.map(a => a.id);
      
      whereClause = {
        [Op.or]: [
          { senderId: partnerId, receiverId: { [Op.in]: adminIds } },
          { senderId: { [Op.in]: adminIds }, receiverId: partnerId }
        ]
      };
    } else {
      // User chỉ thấy tin nhắn của chính mình
      whereClause = {
        [Op.or]: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId }
        ]
      };
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'sender', attributes: ['id', 'fullName', 'avatar', 'role'] },
        { model: User, as: 'receiver', attributes: ['id', 'fullName', 'avatar', 'role'] }
      ]
    });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getMyChatPartners = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let partnerIds = [];
    if (userRole === 'admin' || userRole === 'librarian') {
      // 1. Lấy danh sách tất cả Admin/Librarian IDs
      const adminUsers = await User.findAll({
        where: { role: { [Op.or]: ['admin', 'librarian'] } },
        attributes: ['id']
      });
      const adminIds = adminUsers.map(a => a.id);

      // 2. Tìm tất cả User IDs đã nhắn tin cho Admin hoặc được Admin nhắn tin
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { receiverId: { [Op.in]: adminIds } },
            { senderId: { [Op.in]: adminIds } }
          ]
        },
        attributes: ['senderId', 'receiverId']
      });

      const uniqueIds = [...new Set([
        ...messages.map(m => m.senderId),
        ...messages.map(m => m.receiverId)
      ])];

      // 3. Chỉ lấy những người KHÔNG phải là Admin/Librarian (để hiện danh sách khách hàng)
      partnerIds = uniqueIds.filter(id => !adminIds.includes(id));
    } else {
      // User bình thường: Chỉ thấy những người mình đã nhắn tin cùng
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        attributes: ['senderId', 'receiverId']
      });
      partnerIds = [...new Set([
        ...messages.map(m => m.senderId),
        ...messages.map(m => m.receiverId)
      ])].filter(id => id !== userId);
    }

    if (partnerIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const partners = await User.findAll({
      where: { id: partnerIds },
      attributes: ['id', 'fullName', 'avatar', 'role']
    });

    // 1. Lấy danh sách adminIds để đếm tin nhắn gửi tới họ
    const adminUsers = await User.findAll({
      where: { role: { [Op.or]: ['admin', 'librarian'] } },
      attributes: ['id']
    });
    const adminIds = adminUsers.map(a => a.id);

    const dataWithUnread = await Promise.all(partners.map(async (p) => {
      let unreadCount = 0;
      if (userRole === 'admin' || userRole === 'librarian') {
        // Admin thấy số tin chưa đọc từ khách tới BẤT KỲ admin nào
        unreadCount = await Message.count({
          where: {
            senderId: p.id,
            receiverId: { [Op.in]: adminIds },
            isRead: false
          }
        });
      } else {
        // User bình thường thấy số tin admin gửi cho mình chưa đọc
        unreadCount = await Message.count({
          where: {
            senderId: p.id,
            receiverId: userId,
            isRead: false
          }
        });
      }
      return {
        ...p.toJSON(),
        unreadCount
      };
    }));

    res.json({ success: true, data: dataWithUnread });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getAdminId = async (req, res) => {
  try {
    const { User } = require("../models");
    const admin = await User.findOne({
      where: { role: 'admin' },
      attributes: ['id']
    });
    res.json({ success: true, adminId: admin ? admin.id : 1 });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { partnerId } = req.params;

    let whereClause;
    if (userRole === 'admin' || userRole === 'librarian') {
      const adminUsers = await User.findAll({
        where: { role: { [Op.or]: ['admin', 'librarian'] } },
        attributes: ['id']
      });
      const adminIds = adminUsers.map(a => a.id);
      whereClause = {
        senderId: partnerId,
        receiverId: { [Op.in]: adminIds },
        isRead: false
      };
    } else {
      whereClause = {
        senderId: partnerId,
        receiverId: userId,
        isRead: false
      };
    }

    await Message.update(
      { isRead: true },
      { where: whereClause }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = {
  getMessages,
  getMyChatPartners,
  getAdminId,
  markMessagesAsRead
};

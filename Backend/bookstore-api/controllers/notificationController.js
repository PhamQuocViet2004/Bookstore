const { Notification } = require("../models");

// 1. Lấy danh sách thông báo của người dùng
const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông báo." });
  }
};

// 2. Đánh dấu đã đọc tất cả
const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ message: "Đã đánh dấu tất cả là đã đọc." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

// 3. Đánh dấu 1 thông báo là đã đọc
const markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (notif) {
      await notif.update({ isRead: true });
    }
    res.json({ message: "Đã đọc thông báo." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

module.exports = { getMyNotifications, markAllAsRead, markAsRead };

const { User, Account } = require("../models");
const bcrypt = require("bcrypt");

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Account, as: 'account', attributes: ['isActive', 'createdAt'] }]
    });
    
    const result = users.map(u => {
      const userData = u.toJSON();
      return {
        id: userData.id,
        name: userData.fullName, // FE expects "name" here
        fullName: userData.fullName,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        isActive: userData.account ? userData.account.isActive : true,
        createdAt: userData.account ? userData.account.createdAt : userData.createdAt
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách người dùng." });
  }
};

// Get user by ID (Admin or Self)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Authorization check: Admin or the owner
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Bạn không có quyền xem thông tin này." });
    }

    const user = await User.findByPk(id, {
      include: [{ model: Account, as: 'account', attributes: ['isActive', 'lastLogin', 'loginAttempts'] }]
    });

    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

// Update user (Admin or Self)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, avatar, address } = req.body;

    // Authorization check
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: "Bạn không có quyền cập nhật thông tin này." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

    await user.update({
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
      avatar: avatar || user.avatar,
      address: address || user.address
    });

    res.json({ message: "Cập nhật thành công.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi cập nhật thông tin." });
  }
};

// Toggle user status (Admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ Admin mới có quyền này." });
    }

    const account = await Account.findOne({ where: { userId: id } });
    if (!account) return res.status(404).json({ message: "Tài khoản không tồn tại." });

    await account.update({ isActive });
    res.json({ message: `Đã ${isActive ? 'kích hoạt' : 'khóa'} người dùng.` });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

// Delete user (Admin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Chỉ Admin mới có quyền này." });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

    await user.destroy();
    res.json({ message: "Đã xóa người dùng thành công." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa người dùng." });
  }
};

// Patch user (Admin only - for status and role)
const updateUserPatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "Người dùng không tồn tại." });

    if (role) {
      await user.update({ role });
    }

    if (isActive !== undefined) {
      const account = await Account.findOne({ where: { userId: id } });
      if (account) {
        await account.update({ isActive });
      }
    }

    res.json({ message: "Cập nhật thành công." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserPatch,
  toggleUserStatus,
  deleteUser
};

const { User, Account, sequelize } = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dữ liệu không được để trống" });
    }
    const { fullName, phone, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      await transaction.rollback();
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      fullName,
      phone,
      email,
      role: 'user'
    }, { transaction });

    // Create account
    await Account.create({
      userId: user.id,
      passwordHash: hashedPassword,
      isActive: true
    }, { transaction });

    await transaction.commit();

    res.status(200).json({ success: true, message: "Đăng ký thành công" });
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const login = async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Dữ liệu không được để trống" });
    }
    const { email, password } = req.body;

    // Find user and include account
    const user = await User.findOne({ 
      where: { email },
      include: [{ model: Account, as: 'account' }]
    });

    if (!user || !user.account) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    if (!user.account.isActive) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.account.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }

    // Update lastLogin
    await user.account.update({
      lastLogin: new Date()
    });

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "24h" }
    );

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role 
      } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Account, as: 'account', attributes: ['isActive', 'createdAt'] }]
    });
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }
    
    // Map birthDate to dob for FE consistency
    const userData = user.toJSON();
    userData.dob = userData.birthDate;
    userData.isActive = userData.account ? userData.account.isActive : true;
    userData.createdAt = userData.account ? userData.account.createdAt : userData.createdAt;
    
    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const updateMe = async (req, res) => {
  try {
    const { fullName, phone, address, dob, avatar } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    await user.update({
      fullName: fullName || user.fullName,
      phone: phone || user.phone,
      address: address || user.address,
      birthDate: dob || user.birthDate,
      avatar: avatar || user.avatar
    });

    const updatedUser = await User.findByPk(req.user.id);
    res.json({
      success: true,
      message: "Cập nhật thành công",
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Account, as: 'account' }]
    });

    if (!user || !user.account) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.account.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu cũ không đúng" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await user.account.update({ passwordHash: hashedNewPassword });

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

module.exports = { register, login, getMe, updateMe, changePassword };

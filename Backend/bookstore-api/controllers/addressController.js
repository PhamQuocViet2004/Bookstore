const { Address } = require("../models");

// 1. Get all addresses for user
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, data: addresses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy danh sách địa chỉ." });
  }
};

// 2. Add new address
const addAddress = async (req, res) => {
  try {
    const { name, phone, detail, district, city, isDefault } = req.body;
    
    // If setting as default, unset other defaults
    if (isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    const address = await Address.create({
      userId: req.user.id,
      name,
      phone,
      detail,
      district,
      city,
      isDefault: isDefault || false
    });

    res.status(201).json({ success: true, message: "Thêm địa chỉ thành công", data: address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi thêm địa chỉ." });
  }
};

// 3. Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, detail, district, city, isDefault } = req.body;

    const address = await Address.findOne({ where: { id, userId: req.user.id } });
    if (!address) return res.status(404).json({ success: false, message: "Địa chỉ không tồn tại." });

    if (isDefault && !address.isDefault) {
      await Address.update({ isDefault: false }, { where: { userId: req.user.id } });
    }

    await address.update({ name, phone, detail, district, city, isDefault });
    res.json({ success: true, message: "Cập nhật thành công", data: address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi cập nhật địa chỉ." });
  }
};

// 4. Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Address.destroy({ where: { id, userId: req.user.id } });
    if (!result) return res.status(404).json({ success: false, message: "Địa chỉ không tồn tại." });
    res.json({ success: true, message: "Đã xóa địa chỉ." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi khi xóa địa chỉ." });
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };

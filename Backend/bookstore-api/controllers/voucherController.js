const { Voucher } = require("../models");
const { Op } = require("sequelize");

// 1. Kiểm tra mã giảm giá
const validateVoucher = async (req, res) => {
  try {
    const { code, totalValue } = req.query;
    const now = new Date();

    const voucher = await Voucher.findOne({
      where: {
        code,
        isActive: true,
        [Op.or]: [
          { startDate: null },
          { startDate: { [Op.lte]: now } }
        ],
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: now } }
        ]
      }
    });

    if (!voucher) {
      return res.json({ valid: false, message: "Mã giảm giá không hợp lệ hoặc đã hết hạn." });
    }

    if (voucher.usedCount >= voucher.usageLimit) {
      return res.json({ valid: false, message: "Mã giảm giá đã hết lượt sử dụng." });
    }

    if (totalValue && totalValue < voucher.minOrderValue) {
      return res.json({ 
        valid: false, 
        message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ mới được áp dụng mã này.` 
      });
    }

    res.json({
      valid: true,
      code: voucher.code,
      type: voucher.type,
      value: voucher.value,
      maxDiscount: voucher.maxDiscount,
      message: `Áp dụng thành công mã ${voucher.code}`
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

// 2. Lấy tất cả mã giảm giá (Admin)
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({ order: [['createdAt', 'DESC']] });
    res.json(vouchers);
  } catch (error) {
    res.status(500).json({ message: "Lỗi lấy danh sách voucher." });
  }
};

// 3. Tạo voucher mới (Admin)
const createVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.create(req.body);
    res.status(201).json({ message: "Tạo voucher thành công.", voucher });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo voucher." });
  }
};

// 4. Xóa voucher
const deleteVoucher = async (req, res) => {
  try {
    await Voucher.destroy({ where: { id: req.params.id } });
    res.json({ message: "Đã xóa voucher." });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa voucher." });
  }
};

module.exports = { validateVoucher, getAllVouchers, createVoucher, deleteVoucher };

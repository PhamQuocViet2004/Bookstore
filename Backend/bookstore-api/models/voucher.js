module.exports = (sequelize, DataTypes) => {
  const Voucher = sequelize.define('Voucher', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.ENUM('percent', 'fixed'),
      allowNull: false,
      defaultValue: 'percent'
    },
    value: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    minOrderValue: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    maxDiscount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    usageLimit: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 100
    },
    usedCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'vouchers',
    timestamps: true
  });

  return Voucher;
};

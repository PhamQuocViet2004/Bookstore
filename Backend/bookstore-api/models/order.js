'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Order.belongsTo(models.User, { foreignKey: 'processedBy', as: 'processor' });
      Order.hasMany(models.OrderItem, { foreignKey: 'orderId', as: 'items' });
    }
  }
  Order.init({
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    shippingAddress: {
      type: DataTypes.JSON,
      allowNull: false
    },
    totalPrice: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentMethod: {
      type: DataTypes.ENUM('cod', 'banking', 'momo'),
      defaultValue: 'cod'
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    note: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    processedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    voucherId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    discountAmount: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Order',
    tableName: 'orders'
  });
  return Order;
};

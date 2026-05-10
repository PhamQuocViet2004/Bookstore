'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, { foreignKey: 'orderId', as: 'order' });
      OrderItem.belongsTo(models.Book, { foreignKey: 'bookId', as: 'book' });
    }
  }
  OrderItem.init({
    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    bookId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    unitPrice: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    discountAtPurchase: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    finalUnitPrice: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    subtotal: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items'
  });
  return OrderItem;
};

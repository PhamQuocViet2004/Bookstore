'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
  }
  Notification.init({
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: 'ID người nhận thông báo'
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    message: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('new_order', 'order_status', 'system', 'promotion'),
      defaultValue: 'system'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    relatedId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: 'ID của đối tượng liên quan (ví dụ orderId)'
    }
  }, {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications'
  });
  return Notification;
};

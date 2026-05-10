'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CartItem extends Model {
    static associate(models) {
      CartItem.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      CartItem.belongsTo(models.Book, { foreignKey: 'bookId', as: 'book' });
    }
  }
  CartItem.init({
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    bookId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'CartItem',
    tableName: 'cart_items'
  });
  return CartItem;
};

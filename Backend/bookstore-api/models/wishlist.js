'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Wishlist extends Model {
    static associate(models) {
      Wishlist.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Wishlist.belongsTo(models.Book, { foreignKey: 'bookId', as: 'book' });
    }
  }
  Wishlist.init({
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    bookId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Wishlist',
    tableName: 'wishlists',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'bookId']
      }
    ]
  });
  return Wishlist;
};

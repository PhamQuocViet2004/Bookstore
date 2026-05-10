'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
    static associate(models) {
      Book.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Book.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Book.hasMany(models.OrderItem, { foreignKey: 'bookId', as: 'orderItems' });
      Book.hasMany(models.CartItem, { foreignKey: 'bookId', as: 'cartItems' });
      Book.hasMany(models.Review, { foreignKey: 'bookId', as: 'reviews' });
    }
  }
  Book.init({
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    author: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    price: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    discount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    stock: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    sold: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Book',
    tableName: 'books',
    indexes: [
      {
        type: 'FULLTEXT',
        name: 'books_fulltext',
        fields: ['title', 'author']
      }
    ]
  });
  return Book;
};

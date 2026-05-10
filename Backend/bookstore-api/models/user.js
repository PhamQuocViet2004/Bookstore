'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Account, { foreignKey: 'userId', as: 'account' });
      User.hasMany(models.Book, { foreignKey: 'createdBy', as: 'createdBooks' });
      User.hasMany(models.Category, { foreignKey: 'createdBy', as: 'createdCategories' });
      User.hasMany(models.Order, { foreignKey: 'userId', as: 'orders' });
      User.hasMany(models.CartItem, { foreignKey: 'userId', as: 'cartItems' });
      User.hasMany(models.Review, { foreignKey: 'userId', as: 'reviews' });
      User.hasMany(models.Message, { foreignKey: 'senderId', as: 'sentMessages' });
      User.hasMany(models.Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
    }
  }
  User.init({
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    address: {
      type: DataTypes.STRING(255),
      defaultValue: ''
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    avatar: {
      type: DataTypes.STRING(500),
      defaultValue: ''
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'librarian'),
      defaultValue: 'user'
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users'
  });
  return User;
};
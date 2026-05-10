const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const env = process.env.NODE_ENV || 'development';
const config = require('./config/config.json')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false
});

async function updateDb() {
  try {
    console.log('--- Đang tạo bảng messages ---');
    
    const Message = sequelize.define('Message', {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true
      },
      senderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      receiverId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    }, {
      tableName: 'messages'
    });

    await Message.sync({ alter: true });
    console.log('✅ Đã tạo bảng messages thành công!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

updateDb();

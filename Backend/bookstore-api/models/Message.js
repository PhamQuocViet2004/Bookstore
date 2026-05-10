module.exports = (sequelize, DataTypes) => {
  class Message extends sequelize.Sequelize.Model {
    static associate(models) {
      Message.belongsTo(models.User, { as: 'sender', foreignKey: 'senderId' });
      Message.belongsTo(models.User, { as: 'receiver', foreignKey: 'receiverId' });
    }
  }

  Message.init({
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
    sequelize,
    tableName: 'messages',
    timestamps: true,
    modelName: 'Message'
  });

  return Message;
};

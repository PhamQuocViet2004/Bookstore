module.exports = (sequelize, DataTypes) => {
  const StoreReview = sequelize.define('StoreReview', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'store_reviews',
    timestamps: true
  });

  StoreReview.associate = (models) => {
    StoreReview.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return StoreReview;
};

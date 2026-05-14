const { sequelize } = require("./models");

async function syncDatabase() {
  try {
    console.log("--- Bắt đầu đồng bộ cấu trúc Database (cập nhật các cột mới) ---");
    
    // alter: true sẽ tự động thêm các cột mới vào database mà không làm mất dữ liệu cũ
    await sequelize.sync({ alter: true });
    
    console.log("--- Đồng bộ Database thành công! ---");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi khi đồng bộ DB:", error);
    process.exit(1);
  }
}

syncDatabase();

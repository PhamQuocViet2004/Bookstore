const { sequelize } = require("./models");

async function updateDatabase() {
  try {
    console.log("--- Đang bắt đầu cập nhật cấu trúc Database ---");
    const queryInterface = sequelize.getQueryInterface();
    const tables = ["Users", "Books", "Categories"];

    for (const table of tables) {
      try {
        await queryInterface.addColumn(table, "deletedAt", {
          type: require("sequelize").DataTypes.DATE,
          allowNull: true,
        });
        console.log(`[OK] Đã thêm cột deletedAt vào bảng ${table}`);
      } catch (err) {
        if (err.number === 1060 || err.message.includes("Duplicate column name")) {
          console.log(`[!] Bảng ${table} đã có cột deletedAt rồi.`);
        } else {
          console.error(`[LỖI] Không thể cập nhật bảng ${table}:`, err.message);
        }
      }
    }
    console.log("--- Cập nhật Database hoàn tất! ---");
    process.exit(0);
  } catch (error) {
    console.error("Lỗi hệ thống khi cập nhật DB:", error);
    process.exit(1);
  }
}

updateDatabase();

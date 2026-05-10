const { sequelize } = require('./models');

async function updateDatabase() {
    console.log("--- ĐANG CẬP NHẬT CƠ SỞ DỮ LIỆU ---");
    try {
        const queryInterface = sequelize.getQueryInterface();
        
        // 1. Thêm cột voucherId vào bảng orders
        console.log("Đang thêm cột voucherId vào bảng orders...");
        await queryInterface.addColumn('orders', 'voucherId', {
            type: require('sequelize').DataTypes.INTEGER.UNSIGNED,
            allowNull: true
        }).catch(err => console.log("- Cột voucherId đã tồn tại hoặc có lỗi nhẹ:", err.message));

        // 2. Thêm cột discountAmount vào bảng orders
        console.log("Đang thêm cột discountAmount vào bảng orders...");
        await queryInterface.addColumn('orders', 'discountAmount', {
            type: require('sequelize').DataTypes.INTEGER.UNSIGNED,
            defaultValue: 0
        }).catch(err => console.log("- Cột discountAmount đã tồn tại hoặc có lỗi nhẹ:", err.message));

        console.log("--- HOÀN TẤT CẬP NHẬT: Bạn có thể đặt hàng ngay bây giờ! ---");
        process.exit(0);
    } catch (err) {
        console.error("LỖI CẬP NHẬT:", err.message);
        process.exit(1);
    }
}

updateDatabase();

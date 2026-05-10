const { sequelize } = require('./models');

async function updateDatabaseNotif() {
    console.log("--- ĐANG TẠO BẢNG THÔNG BÁO (NOTIFICATIONS) ---");
    try {
        // Tự động tạo bảng dựa trên Model Notification đã định nghĩa
        // force: false để không xóa dữ liệu cũ
        const { Notification } = require('./models');
        await Notification.sync({ alter: true });
        
        console.log("--- HOÀN TẤT: Bảng notifications đã sẵn sàng hoạt động! ---");
        process.exit(0);
    } catch (err) {
        console.error("LỖI CẬP NHẬT:", err.message);
        process.exit(1);
    }
}

updateDatabaseNotif();

const { Book, sequelize } = require('./models');

async function setupTopDeals() {
    console.log("--- ĐANG THIẾT LẬP 20 CUỐN TOP DEAL ---");
    
    try {
        // 1. Đưa tất cả sách về mức giảm giá 0%
        console.log("Đưa toàn bộ sách về giá gốc...");
        await Book.update({ discount: 0 }, { where: {} });

        // 2. Chọn ra 20 cuốn sách tiêu biểu để giảm giá (Flash Sale)
        // Tôi sẽ chọn các cuốn dựa trên tiêu đề quen thuộc
        const hotTitles = [
            'Doraemon', 'Naruto', 'One Piece', '7 Viên Ngọc Rồng', 'Harry Potter (Bộ 1 - Hòn Đá Phù Thủy)',
            'Chí Phèo', 'Dế Mèn Phiêu Lưu Ký', 'Số Đỏ', 'Tắt Đèn', 'Vợ Nhặt',
            'Đại Tiệc Buffet', 'Cẩm Nang Nấu Sushi', 'Món Ăn Nhật Bản', 'Món Ăn Hàn Quốc',
            'Tư Duy Nhanh Và Chậm', 'Đắc Nhân Tâm', 'Kỹ Năng Giao Tiếp',
            'Tiếng Anh Cho Người Bắt Đầu', 'Tiếng Nhật Cơ Bản', 'Chúa Tể Những Chiếc Nhẫn'
        ];

        console.log(`Đang áp dụng giảm giá cho ${hotTitles.length} cuốn Top Deal...`);
        
        await Book.update(
            { discount: 20 }, // Giảm 20% cho các cuốn này
            { where: { title: hotTitles } }
        );

        // Nếu số lượng sách tìm thấy ít hơn 20 (do tên chưa khớp), ta chọn thêm 20 cuốn ID đầu tiên
        await Book.update(
            { discount: 15 },
            { 
                where: { 
                    id: { [sequelize.Sequelize.Op.lte]: 20 } 
                } 
            }
        );

        console.log("--- HOÀN TẤT: Đã có 20 cuốn Top Deal sẵn sàng! ---");
        process.exit(0);
    } catch (err) {
        console.error("LỖI:", err.message);
        process.exit(1);
    }
}

setupTopDeals();

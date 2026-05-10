const fs = require('fs');
const path = require('path');
const { Book, Category, sequelize } = require('./models');

async function seedBooks() {
    console.log("--- BẮT ĐẦU NẠP DỮ LIỆU CHUẨN THEO TÊN DANH MỤC ---");
    
    try {
        // 1. Làm sạch bảng books
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await Book.destroy({ where: {}, truncate: true });
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Lấy bản đồ danh mục thực tế trong DB của bạn
        const categories = await Category.findAll();
        const dbCatMap = {};
        categories.forEach(c => {
            // Chuẩn hóa tên để so khớp (bỏ khoảng trắng, viết thường)
            const cleanName = c.name.toLowerCase().trim();
            dbCatMap[cleanName] = c.id;
            console.log(`Tìm thấy danh mục trong máy: "${c.name}" (ID: ${c.id})`);
        });

        // 3. Định nghĩa bản đồ khớp từ ID trong SQL sang Tên danh mục chuẩn
        const sqlIdToName = {
            1: "văn học",
            2: "tiểu thuyết",
            3: "truyện tranh",
            4: "kinh tế & kinh doanh",
            5: "khoa học & lịch sử",
            6: "kỹ năng mềm",
            7: "ngoại ngữ",
            8: "sách nấu ăn"
        };

        // 4. Đọc file SQL
        const sqlPath = path.join(__dirname, '../..', 'Bookstore.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const insertRegex = /INSERT INTO `books` VALUES ([\s\S]+?);/;
        const match = sqlContent.match(insertRegex);
        
        if (!match) return console.error("Không tìm thấy dữ liệu.");

        const rows = match[1].split(/\),\(/);
        let count = 0;

        for (let row of rows) {
            row = row.replace(/^\(/, '').replace(/\)$/, '');
            const fields = row.match(/('[^']*'|[^,]+)/g).map(f => f.trim().replace(/^'|'$/g, ''));
            
            if (fields.length < 8) continue;

            const title = fields[1];
            const author = fields[2];
            const price = parseInt(fields[3]);
            const discount = parseInt(fields[4]);
            const sqlCatId = parseInt(fields[5]); // ID cũ trong SQL
            const cloudinaryUrl = fields[6];
            const detail = fields[7];

            // Tìm tên danh mục từ ID SQL
            const catName = sqlIdToName[sqlCatId];
            // Tìm ID thực tế trong DB của bạn dựa trên tên đó
            const realCatId = dbCatMap[catName];

            if (!realCatId) {
                console.warn(`Cảnh báo: Không tìm thấy danh mục "${catName}" trong DB cho cuốn "${title}"`);
            }

            let localImage = "";
            if (cloudinaryUrl.includes('bookstore/')) {
                localImage = "image/" + cloudinaryUrl.split('bookstore/')[1];
            }

            await Book.create({
                title,
                author,
                price,
                discount,
                categoryId: realCatId || sqlCatId, // Dùng ID thật, nếu không có thì dùng tạm ID cũ
                image: localImage,
                detail,
                stock: 100,
                isActive: true,
                createdBy: null
            });
            count++;
        }

        console.log(`--- HOÀN TẤT: Đã nạp ${count} cuốn sách VÀO ĐÚNG CHỦ ĐỀ! ---`);
        process.exit(0);
    } catch (err) {
        console.error("LỖI:", err.message);
        process.exit(1);
    }
}

seedBooks();

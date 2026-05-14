'use strict';
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Account, Category, Book } = require('../models');

const SALT_ROUNDS = 10;

// ============================================================
// DỮ LIỆU MẪU
// ============================================================

const users = [
  {
    fullName: 'Admin BookStore',
    phone: '0900000001',
    email: 'admin@bookstore.vn',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    birthDate: '1990-01-01',
    avatar: 'image/avatar/admin.png',
    role: 'admin',
    password: 'Admin@1234'
  },
  {
    fullName: 'Thủ Thư BookStore',
    phone: '0900000002',
    email: 'librarian@bookstore.vn',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    birthDate: '1995-06-15',
    avatar: 'image/avatar/librarian.png',
    role: 'librarian',
    password: 'Librarian@1234'
  }
];

const categories = [
  { name: 'Văn học',          slug: 'van-hoc',           description: 'Các tác phẩm văn học Việt Nam và thế giới.', image: 'image/categories/van-hoc.jpg',                isActive: true },
  { name: 'Tiểu thuyết',      slug: 'tieu-thuyet',       description: 'Tiểu thuyết trong nước và dịch thuật.',       image: 'image/categories/tieu-thuyet.jpg',          isActive: true },
  { name: 'Truyện tranh',     slug: 'truyen-tranh',      description: 'Manga Nhật Bản và truyện tranh quốc tế.',     image: 'image/categories/truyen-tranh.jpg',         isActive: true },
  { name: 'Kinh tế & Kinh doanh', slug: 'kinh-te-kinh-doanh', description: 'Sách về khởi nghiệp, quản trị, marketing.', image: 'image/categories/kinh-te-kinh-doanh.jpg', isActive: true },
  { name: 'Khoa học & Lịch sử', slug: 'khoa-hoc-lich-su', description: 'Khám phá khoa học tự nhiên và lịch sử.',    image: 'image/categories/khoa-hoc-lich-su.jpg',      isActive: true },
  { name: 'Kỹ năng mềm',     slug: 'ky-nang-mem',       description: 'Sách phát triển bản thân và tư duy.',         image: 'image/categories/ky-nang-mem.jpg',          isActive: true },
  { name: 'Ngoại ngữ',        slug: 'ngoai-ngu',         description: 'Giáo trình tự học các ngôn ngữ phổ biến.',    image: 'image/categories/ngoai-ngu.jpg',            isActive: true },
  { name: 'Sách nấu ăn',      slug: 'sach-nau-an',       description: 'Công thức ẩm thực Việt, Á, Âu và healthy.',  image: 'image/categories/sach-nau-an.jpg',          isActive: true }
];

// categoryIndex: 0=Văn học, 1=Tiểu thuyết, 2=Truyện tranh, 3=Kinh tế, 4=Khoa học, 5=Kỹ năng, 6=Ngoại ngữ, 7=Nấu ăn
const books = [
  // Văn học (cat 0)
  { title: 'Chí Phèo',                     author: 'Nam Cao',                 price: 45000,  discount: 15, categoryIndex: 0, stock: 120, image: 'image/sachvanhoc/chipheo.jpg',               detail: 'Chí Phèo là truyện ngắn nổi tiếng của Nam Cao, phản ánh bi kịch của người nông dân bị xã hội tước đoạt nhân tính.' },
  { title: 'Dế Mèn Phiêu Lưu Ký',          author: 'Tô Hoài',                 price: 80000,  discount: 25, categoryIndex: 0, stock: 200, image: 'image/sachvanhoc/demenphieuluuky.jpg',       detail: 'Tác phẩm thiếu nhi kinh điển kể về hành trình phiêu lưu của chú dế mèn.' },
  { title: 'Số Đỏ',                         author: 'Vũ Trọng Phụng',          price: 65000,  discount: 20, categoryIndex: 0, stock: 130, image: 'image/sachvanhoc/sodo.jpg',                 detail: 'Tiểu thuyết trào phúng xuất sắc châm biếm sâu cay xã hội thực dân nửa phong kiến.' },
  { title: 'Truyện Kiều',                   author: 'Nguyễn Du',               price: 90000,  discount: 30, categoryIndex: 0, stock: 180, image: 'image/sachvanhoc/truyenkieu.jpg',            detail: 'Kiệt tác văn học của đại thi hào Nguyễn Du, đỉnh cao của thơ Nôm Việt Nam.' },
  { title: 'Tôi Thấy Hoa Vàng Trên Cỏ Xanh', author: 'Nguyễn Nhật Ánh',      price: 125000, discount: 15, categoryIndex: 0, stock: 250, image: 'image/sachvanhoc/toithayhoavangtrencoxanh.jpg', detail: 'Câu chuyện về tuổi thơ hồn nhiên của hai anh em ở làng quê miền Trung.' },
  // Tiểu thuyết (cat 1)
  { title: 'Harry Potter (Hòn Đá Phù Thủy)', author: 'J.K. Rowling',          price: 195000, discount: 20, categoryIndex: 1, stock: 300, image: 'image/tieuthuyet/harrypotter.jpg',           detail: 'Tập đầu tiên trong bộ 7 tập huyền thoại của J.K. Rowling.' },
  { title: 'Hoàng Tử Bé',                   author: 'Antoine de Saint-Exupéry', price: 85000, discount: 20, categoryIndex: 1, stock: 200, image: 'image/tieuthuyet/hoangtube.jpg',           detail: 'Câu chuyện triết lý về tình yêu, tình bạn và bản chất con người.' },
  { title: 'Lịch Sử Loài Người',            author: 'Yuval Noah Harari',       price: 250000, discount: 25, categoryIndex: 1, stock: 200, image: 'image/khoahoc-lichsu/lichsuloainguoi.jpg',           detail: 'Một trong những cuốn sách bán chạy nhất thế kỷ 21.' },
  // Truyện tranh (cat 2)
  { title: 'Doraemon',                       author: 'Fujiko F. Fujio',         price: 25000,  discount: 15, categoryIndex: 2, stock: 500, image: 'image/truyentranh/doraemon.jpg',            detail: 'Bộ manga nổi tiếng nhất Nhật Bản với chú mèo máy đến từ tương lai.' },
  { title: 'One Piece',                      author: 'Eiichiro Oda',            price: 35000,  discount: 25, categoryIndex: 2, stock: 600, image: 'image/truyentranh/onepiece.jpg',            detail: 'Manga bán chạy nhất lịch sử với hành trình của Monkey D. Luffy.' },
  { title: 'Naruto',                         author: 'Masashi Kishimoto',       price: 35000,  discount: 10, categoryIndex: 2, stock: 400, image: 'image/truyentranh/naruto.jpg',             detail: 'Hành trình của cậu bé ninja Naruto Uzumaki với ước mơ trở thành Hokage.' },
  // Kinh tế (cat 3)
  { title: 'Tâm Lý Học Kinh Doanh',         author: 'Robert B. Cialdini',      price: 145000, discount: 5,  categoryIndex: 3, stock: 95,  image: 'image/kinhte-kinhdoanh/tamlyhoc.jpg',       detail: '6 nguyên tắc ảnh hưởng trong kinh doanh được nghiên cứu khoa học.' },
  { title: 'Nói Thế Nào Để Bán Hàng',       author: 'Brian Tracy',             price: 120000, discount: 15, categoryIndex: 3, stock: 110, image: 'image/kinhte-kinhdoanh/noithenaodebanhang.jpg', detail: 'Kỹ thuật giao tiếp và chốt sale hiệu quả từ chuyên gia hàng đầu.' },
  // Khoa học & Lịch sử (cat 4)
  { title: 'Lịch Sử Loài Người (Sapiens)',   author: 'Yuval Noah Harari',       price: 250000, discount: 25, categoryIndex: 4, stock: 200, image: 'image/khoahoc-lichsu/lichsuloainguoi.jpg',  detail: 'Tác phẩm dẫn người đọc qua 70.000 năm lịch sử loài người.' },
  { title: '100 Khoa Học Vĩ Đại',           author: 'Nhiều tác giả',           price: 150000, discount: 20, categoryIndex: 4, stock: 100, image: 'image/khoahoc-lichsu/100khoahocvidai.jpg',  detail: '100 phát minh và khám phá khoa học quan trọng nhất đã thay đổi thế giới.' },
  // Kỹ năng mềm (cat 5)
  { title: 'Tư Duy Nhanh Và Chậm',          author: 'Daniel Kahneman',         price: 220000, discount: 30, categoryIndex: 5, stock: 160, image: 'image/kynangmem/tuduynhanhcham.jpg',         detail: 'Lý thuyết hai hệ thống tư duy của nhà tâm lý học đoạt Nobel Kinh tế.' },
  { title: 'Kỹ Năng Giao Tiếp',             author: 'Dale Carnegie',           price: 90000,  discount: 15, categoryIndex: 5, stock: 150, image: 'image/kynangmem/kynanggiaotiep.jpg',         detail: 'Nghệ thuật trò chuyện và giao tiếp hiệu quả theo phương pháp Carnegie.' },
  // Ngoại ngữ (cat 6)
  { title: 'Tiếng Nhật Cho Người Mới',      author: 'Nhiều tác giả',           price: 195000, discount: 20, categoryIndex: 6, stock: 110, image: 'image/sachngoaingu/tiengnhat.jpg',          detail: 'Giáo trình tiếng Nhật từ Hiragana, Katakana đến Kanji cơ bản.' },
  { title: 'Tiếng Hàn Cấp Tốc',            author: 'Nhiều tác giả',           price: 180000, discount: 10, categoryIndex: 6, stock: 100, image: 'image/sachngoaingu/tienghan.jpg',            detail: 'Phương pháp học tiếng Hàn nhanh trong 60 ngày.' },
  // Sách nấu ăn (cat 7)
  { title: 'Cẩm Nang Nấu Sushi',            author: 'Nhiều tác giả',           price: 240000, discount: 20, categoryIndex: 7, stock: 55,  image: 'image/sachnauan/nausushi.jpg',              detail: 'Hướng dẫn toàn diện về nghệ thuật làm Sushi tại nhà.' },
  { title: 'Món Ăn Nhật Bản',               author: 'Nhiều tác giả',           price: 215000, discount: 10, categoryIndex: 7, stock: 70,  image: 'image/sachnauan/monnhat.jpg',               detail: 'Hướng dẫn nấu hơn 90 món ẩm thực Nhật Bản từ đơn giản đến tinh tế.' },
  { title: 'Đại Tiệc Buffet',               author: 'Nhiều tác giả',           price: 320000, discount: 25, categoryIndex: 7, stock: 50,  image: 'image/sachnauan/daitiec.jpg',                detail: 'Bộ công thức toàn diện với hơn 200 món ăn đa dạng cho các buổi tiệc.' }
];

// ============================================================
// CHẠY SEEDER
// ============================================================
async function seed() {
  try {
    console.log('\n🌱 ===== BẮT ĐẦU SEED DỮ LIỆU MẪU =====\n');
    await sequelize.authenticate();
    console.log('✅ Kết nối Database thành công!\n');

    // --- BƯỚC 1: USERS & ACCOUNTS ---
    console.log('📌 [1/4] Tạo Users & Accounts...');
    const createdUsers = [];
    for (const u of users) {
      const [user, created] = await User.findOrCreate({
        where: { email: u.email },
        defaults: {
          fullName: u.fullName, phone: u.phone,
          email: u.email,       address: u.address,
          birthDate: u.birthDate, avatar: u.avatar,
          role: u.role
        }
      });
      if (created) {
        const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
        await Account.findOrCreate({
          where: { userId: user.id },
          defaults: { userId: user.id, passwordHash: hash, isActive: true }
        });
        console.log(`   ✔ Tạo mới: ${u.email} (${u.role}) | Mật khẩu: ${u.password}`);
      } else {
        if (user.avatar !== u.avatar) {
            await user.update({ avatar: u.avatar });
            console.log(`   🔄 Đã cập nhật ảnh: ${u.email}`);
        } else {
            console.log(`   ⏩ Đã tồn tại: ${u.email}`);
        }
      }
      createdUsers.push(user);
    }

    // --- BƯỚC 2: CATEGORIES ---
    console.log('\n📌 [2/4] Tạo Categories...');
    const createdCategories = [];
    for (const c of categories) {
      try {
        // Tìm theo name (có UNIQUE constraint trong DB)
        let cat = await Category.findOne({ where: { name: c.name } });
        if (!cat) {
          cat = await Category.create({ ...c, createdBy: createdUsers[0].id });
          console.log(`   ✔ Tạo mới: ${c.name}`);
        } else {
          if (cat.image !== c.image) {
            await cat.update({ image: c.image });
            console.log(`   🔄 Đã cập nhật ảnh: ${c.name}`);
          } else {
            console.log(`   ⏩ Đã tồn tại: ${c.name}`);
          }
        }
        createdCategories.push(cat);
      } catch (e) {
        // Nếu vẫn lỗi duplicate thì tìm lại và bỏ qua
        const existing = await Category.findOne({ where: { name: c.name } });
        if (existing) {
          console.log(`   ⏩ Bỏ qua (trùng): ${c.name}`);
          createdCategories.push(existing);
        } else {
          console.log(`   ❌ Lỗi tạo: ${c.name} – ${e.message}`);
        }
      }
    }

    // --- BƯỚC 3: BOOKS ---
    console.log('\n📌 [3/4] Tạo Books...');
    let bookCount = 0;
    for (const b of books) {
      const categoryId = createdCategories[b.categoryIndex].id;
      const [book, created] = await Book.findOrCreate({
        where: { title: b.title, categoryId },
        defaults: {
          title: b.title, author: b.author,
          price: b.price, discount: b.discount,
          categoryId, image: b.image,
          detail: b.detail, stock: b.stock,
          sold: 0, isActive: true,
          createdBy: createdUsers[0].id
        }
      });
      if (created) { bookCount++; process.stdout.write(`   ✔ ${b.title}\n`); }
      else {
          if (book.image !== b.image) {
              await book.update({ image: b.image });
              process.stdout.write(`   🔄 Cập nhật ảnh: ${b.title}\n`);
          } else {
              process.stdout.write(`   ⏩ Bỏ qua (đã có): ${b.title}\n`);
          }
      }
    }

    // --- BƯỚC 4: TỔNG KẾT ---
    console.log('\n📌 [4/4] Tổng kết...');
    const totalUsers = await User.count();
    const totalCats  = await Category.count();
    const totalBooks = await Book.count();

    console.log('\n🎉 ===== SEED HOÀN TẤT =====');
    console.log(`   👥 Tổng Users:      ${totalUsers}`);
    console.log(`   📂 Tổng Categories: ${totalCats}`);
    console.log(`   📚 Tổng Books:      ${totalBooks}`);
    console.log('\n🔑 Tài khoản mẫu:');
    console.log('   Admin     → admin@bookstore.vn     / Admin@1234');
    console.log('   Librarian → librarian@bookstore.vn / Librarian@1234');
    console.log('\n✨ Hệ thống sẵn sàng! Chạy: node server.js\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ LỖI SEED:', err.message);
    process.exit(1);
  }
}

seed();

const { Book } = require('./models');
const { sequelize } = require('./models');

async function check() {
  try {
    const count = await Book.count();
    console.log(`TOTAL_BOOKS_IN_DB: ${count}`);
    const sample = await Book.findOne();
    if (sample) {
        console.log(`SAMPLE_BOOK_IMAGE: ${sample.image}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
check();

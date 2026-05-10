const { Category } = require('./models');

async function check() {
  const cats = await Category.findAll();
  console.log("DB_CATEGORIES:");
  cats.forEach(c => console.log(`${c.id}: ${c.name}`));
  process.exit(0);
}
check();

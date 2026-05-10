// db.js
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "123456",
  database: "bookstore",
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = pool.promise();
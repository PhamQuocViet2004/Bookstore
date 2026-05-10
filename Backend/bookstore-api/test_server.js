require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(express.static("public"));
try {
  require("./routes/auth");
  require("./routes/users");
  require("./routes/book");
  require("./routes/categories");
  require("./routes/orders");
} catch (e) {
  console.error("Require failed:", e);
}
app.listen(3001, () => {
  console.log('Test server running at :3001');
});

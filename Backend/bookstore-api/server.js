// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();

// middleware
// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173", // Vite default
  "http://127.0.0.1:5500", // Live Server default
  "http://192.168.190.151:5500", // Specific IP from FE README
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(express.json());
app.use(express.static("public"));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/books", require("./routes/book"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/users", require("./routes/users"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/vouchers", require("./routes/vouchers"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/addresses", require("./routes/addresses"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/store-reviews", require("./routes/storeReviews"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/messages", require("./routes/messages"));

// test
app.get("/", (req, res) => {
  res.send("API running...");
});

const http = require('http');
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

const { Message, User } = require("./models");

// Socket logic
io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
  });

  socket.on('joinAdmin', (adminId) => {
    socket.join('admin_room');
    if (adminId) socket.join(`user_${adminId}`);
    console.log(`[Socket] Admin ${adminId} đã tham gia admin_room và user_${adminId}`);
  });

  // Xử lý gửi tin nhắn
  socket.on('sendMessage', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      console.log(`[Chat] Từ ${senderId} tới ${receiverId}: ${content}`);
      
      // 1. Lưu vào Database
      const msg = await Message.create({
        senderId,
        receiverId,
        content
      });

      const fullMessage = await Message.findByPk(msg.id, {
        include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'avatar', 'role'] }]
      });

      // 2. Gửi tới người nhận
      io.to(`user_${data.receiverId}`).emit('receiveMessage', fullMessage);
    
      // Nếu người gửi là admin, gửi tới admin_room (ngoại trừ chính mình) để các admin khác thấy
      const sender = await User.findByPk(data.senderId);
      if (sender && (sender.role === 'admin' || sender.role === 'librarian')) {
        socket.to('admin_room').emit('receiveMessage', fullMessage);
      } else {
        // Nếu người gửi là khách, gửi tới TẤT CẢ admin trong room
        io.to('admin_room').emit('receiveMessage', fullMessage);
      }
    
      socket.emit('messageSent', fullMessage);

      // 3. Tự động phản hồi (Auto-reply)
      const receiver = await User.findByPk(receiverId);
      const receiverRole = receiver ? receiver.get('role') : null;
      console.log(`[Chat Check] Người nhận ID ${receiverId} có role: ${receiverRole}`);

      if (receiverRole === 'admin' || receiverRole === 'librarian') {
        // Tạo thông báo hệ thống (chuông) cho Admin
        try {
          const { Notification } = require("./models");
          await Notification.create({
            userId: receiverId,
            title: "Tin nhắn mới từ khách hàng",
            message: `${fullMessage.sender.fullName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            type: "system",
            relatedId: senderId,
            isRead: false
          });
          // Thông báo cho admin qua socket để cập nhật chuông
          io.to(`user_${receiverId}`).emit('newNotification');
        } catch (notifErr) {
          console.error("Lỗi tạo thông báo chuông:", notifErr);
        }

        const count = await Message.count({
          where: { senderId: receiverId, receiverId: senderId }
        });
        console.log(`[Chat Check] Admin từng nhắn cho User ${senderId} chưa: ${count > 0 ? 'Rồi' : 'Chưa'}`);

        if (count === 0) {
          setTimeout(async () => {
            console.log(`[Chat] Đang gửi auto-reply tới User ${senderId}`);
            const autoContent = "Chào bạn! Hiện tại admin đang bận một chút, bạn cứ gửi thắc mắc tại đây, 5-7 phút sau admin sẽ check và phản hồi lại bạn ngay nhé! Cảm ơn bạn đã quan tâm đến BookStore.";
            const autoMsg = await Message.create({
              senderId: receiverId,
              receiverId: senderId,
              content: autoContent
            });
            const fullAutoMsg = await Message.findByPk(autoMsg.id, {
              include: [{ model: User, as: 'sender', attributes: ['id', 'fullName', 'avatar', 'role'] }]
            });
            io.to(`user_${senderId}`).emit('receiveMessage', fullAutoMsg);
            io.to('admin_room').emit('receiveMessage', fullAutoMsg);
          }, 2000);
        }
      }
    } catch (err) {
      console.error("Socket Chat Error:", err);
    }
  });

  socket.on('disconnect', () => {
  });
});

// Gán io vào app để truy cập từ controller
app.set('io', io);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng ${PORT} - Realtime đã sẵn sàng!`);
});
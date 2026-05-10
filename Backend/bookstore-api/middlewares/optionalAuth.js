const jwt = require("jsonwebtoken");

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || "SECRET_KEY", (err, user) => {
    if (err) {
      req.user = null; // Token sai hoặc hết hạn thì coi như khách
    } else {
      req.user = user;
    }
    next();
  });
};

module.exports = optionalAuth;

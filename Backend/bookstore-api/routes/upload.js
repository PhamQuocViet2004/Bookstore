const express = require("express");
const router = express.Router();
const uploadCloud = require("../config/cloudinary");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/cloudinary", uploadCloud.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded!" });
  }

  res.json({ imageUrl: req.file.path });
});

module.exports = router;

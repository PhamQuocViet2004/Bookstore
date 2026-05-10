const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

router.get("/stats", authMiddleware, roleMiddleware(['admin']), dashboardController.getStats);

module.exports = router;

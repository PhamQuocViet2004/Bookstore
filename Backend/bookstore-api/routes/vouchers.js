const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucherController");

const roleMiddleware = require("../middlewares/roleMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/validate", voucherController.validateVoucher);

// Admin routes
router.get("/", authMiddleware, roleMiddleware(['admin']), voucherController.getAllVouchers);
router.post("/", authMiddleware, roleMiddleware(['admin']), voucherController.createVoucher);
router.delete("/:id", authMiddleware, roleMiddleware(['admin']), voucherController.deleteVoucher);

module.exports = router;

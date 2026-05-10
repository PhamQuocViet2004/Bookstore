const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const optionalAuth = require("../middlewares/optionalAuth");

// SMART CART API (Handles both Login & Guest automatically)
router.get("/", optionalAuth, cartController.getCart);
router.post("/", optionalAuth, cartController.addToCart);
router.put("/update", optionalAuth, cartController.updateCartItem);
router.post("/bulk-update", optionalAuth, cartController.bulkUpdateCart);
router.delete("/:bookId", optionalAuth, cartController.removeFromCart);

router.delete("/clear", optionalAuth, cartController.clearCart);

module.exports = router;


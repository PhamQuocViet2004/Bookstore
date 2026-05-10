const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");
const authController = require("../controllers/authController");

// All routes require authentication
router.use(authMiddleware);

// Profile update (Must be above /:id)
router.put("/profile", authController.updateMe);

// General auth routes (Self or Admin)
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);

// Admin routes
router.get("/", roleMiddleware(['admin']), userController.getAllUsers);
router.patch("/:id", roleMiddleware(['admin']), userController.updateUserPatch);
router.delete("/:id", roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
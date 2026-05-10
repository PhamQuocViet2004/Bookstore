const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// All routes require authentication
router.use(authMiddleware);

// Admin routes
router.get("/", roleMiddleware(['admin']), userController.getAllUsers);
router.patch("/:id", roleMiddleware(['admin']), userController.updateUserPatch);
router.delete("/:id", roleMiddleware(['admin']), userController.deleteUser);

// General auth routes (Self or Admin)
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);

// V2 Profile update
const authController = require("../controllers/authController");
router.put("/profile", authController.updateMe);

module.exports = router;
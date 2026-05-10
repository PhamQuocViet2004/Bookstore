const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const authMiddleware = require("../middlewares/authMiddleware");
const roleMiddleware = require("../middlewares/roleMiddleware");

// PUBLIC ROUTES
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// PROTECTED ROUTES (Admin ONLY)
router.post(
  "/", 
  authMiddleware, 
  roleMiddleware(['admin']), 
  categoryController.createCategory
);

router.put(
  "/:id", 
  authMiddleware, 
  roleMiddleware(['admin']), 
  categoryController.updateCategory
);

router.delete(
  "/:id", 
  authMiddleware, 
  roleMiddleware(['admin']), 
  categoryController.deleteCategory
);

module.exports = router;
const express = require("express");
const router = express.Router();
const bookController = require("../controllers/bookController");
const authMiddleware = require("../middlewares/authMiddleware");
const optionalAuth = require("../middlewares/optionalAuth");
const roleMiddleware = require("../middlewares/roleMiddleware");

// PUBLIC ROUTES
router.get("/", optionalAuth, bookController.getAllBooks);
router.get("/:id", bookController.getBookById);

// PROTECTED ROUTES (Admin/Librarian ONLY)
router.post(
  "/", 
  authMiddleware, 
  roleMiddleware(['admin', 'librarian']), 
  bookController.createBook
);

router.put(
  "/:id", 
  authMiddleware, 
  roleMiddleware(['admin', 'librarian']), 
  bookController.updateBook
);

router.delete(
  "/:id", 
  authMiddleware, 
  roleMiddleware(['admin', 'librarian']), 
  bookController.deleteBook
);

module.exports = router;
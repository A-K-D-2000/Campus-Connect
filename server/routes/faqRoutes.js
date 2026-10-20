const express = require("express");
const router = express.Router();
const {
  createFAQ,
  getFAQs,
  updateFAQ,
  deleteFAQ,
} = require("../controllers/faqController");
const { protect, staffOnly } = require("../middleware/authMiddleware");

router.get("/", getFAQs);
router.post("/", protect, staffOnly, createFAQ);
router.put("/:id", protect, staffOnly, updateFAQ);
router.delete("/:id", protect, staffOnly, deleteFAQ);

module.exports = router;

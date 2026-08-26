const express = require('express');
const router = express.Router();
const { createFAQ, getFAQs } = require('../controllers/faqController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', getFAQs);
router.post('/', protect, adminOnly, createFAQ);

module.exports = router;
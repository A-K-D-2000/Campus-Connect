const express = require('express');
const router = express.Router();
const { getMyActivity } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getMyActivity);

module.exports = router;
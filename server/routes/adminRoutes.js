const express = require('express');
const router = express.Router();
const { listUsers, setUserRole } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, listUsers);
router.put('/users/:id/role', protect, adminOnly, setUserRole);

module.exports = router;
const express = require('express');
const router = express.Router();
const { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');
const { protect, staffOnly } = require('../middleware/authMiddleware');
const { uploadAttachments } = require('../middleware/upload');

router.get('/', getAnnouncements);
router.post('/', protect, staffOnly, uploadAttachments, createAnnouncement);
router.put('/:id', protect, staffOnly, updateAnnouncement);
router.delete('/:id', protect, staffOnly, deleteAnnouncement);

module.exports = router;
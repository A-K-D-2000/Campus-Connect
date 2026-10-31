const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, toggleUpvote, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { uploadImages } = require('../middleware/upload');

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', protect, uploadImages, createPost);
router.put('/:id/upvote', protect, toggleUpvote);
router.delete('/:id', protect, deletePost);

module.exports = router;
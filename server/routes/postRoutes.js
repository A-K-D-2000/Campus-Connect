const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPostById, toggleUpvote, deletePost } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPosts);
router.get('/:id', getPostById);
router.post('/', protect, createPost);
router.put('/:id/upvote', protect, toggleUpvote);
router.delete('/:id', protect, deletePost);

module.exports = router;
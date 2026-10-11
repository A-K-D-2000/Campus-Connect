const express = require('express');
const router = express.Router();
const {
  createComment,
  getComments,
  getReplies,
  toggleCommentUpvote,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/post/:postId', getComments);
router.get('/:id/replies', getReplies);
router.post('/', protect, createComment);
router.put('/:id/upvote', protect, toggleCommentUpvote);
router.delete('/:id', protect, deleteComment);

module.exports = router;
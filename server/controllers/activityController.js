const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Get my own posts or comments, newest first, in pages (logged-in)
const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const type = req.query.type === 'comments' ? 'comments' : 'posts';
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const filter = { createdBy: userId };

    if (type === 'posts') {
      const [found, total] = await Promise.all([
        Post.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Post.countDocuments(filter),
      ]);

      const items = found.map((p) => ({
        _id: p._id,
        title: p.title,
        flair: p.flair,
        createdAt: p.createdAt,
        upvoteCount: (p.upvotes || []).length,
      }));

      return res.status(200).json({ type, items, total, page, hasMore: page * limit < total });
    }

    const [found, total] = await Promise.all([
      Comment.find(filter)
        .populate('post', 'title')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Comment.countDocuments(filter),
    ]);

    const items = found.map((c) => ({
      _id: c._id,
      content: c.content,
      createdAt: c.createdAt,
      isReply: !!c.parentComment,
      post: c.post, // { _id, title }
      upvoteCount: (c.upvotes || []).length,
    }));

    res.status(200).json({ type, items, total, page, hasMore: page * limit < total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching your activity' });
  }
};

module.exports = { getMyActivity };
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const FAQ = require('../models/FAQ');
const Announcement = require('../models/Announcement');

const MODELS = { posts: Post, comments: Comment, faqs: FAQ, announcements: Announcement };

// Turns each raw database record into just the fields the page needs
const SHAPES = {
  posts: (p) => ({
    _id: p._id,
    title: p.title,
    flair: p.flair,
    createdAt: p.createdAt,
    upvoteCount: (p.upvotes || []).length,
  }),
  comments: (c) => ({
    _id: c._id,
    content: c.content,
    createdAt: c.createdAt,
    isReply: !!c.parentComment,
    post: c.post, // { _id, title }
    upvoteCount: (c.upvotes || []).length,
  }),
  faqs: (f) => ({
    _id: f._id,
    title: f.title,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
    attachmentCount: (f.attachments || []).length,
  }),
  announcements: (a) => ({
    _id: a._id,
    title: a.title,
    category: a.category,
    createdAt: a.createdAt,
    attachmentCount: (a.attachments || []).length,
  }),
};

// Get my own posts, comments, FAQs or announcements, newest first, in pages (logged-in)
const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const type = MODELS[req.query.type] ? req.query.type : 'posts';
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);

    const Model = MODELS[type];
    const filter = { createdBy: userId };

    let query = Model.find(filter);
    if (type === 'comments') query = query.populate('post', 'title');

    const [found, total] = await Promise.all([
      query.sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    res.status(200).json({
      type,
      items: found.map(SHAPES[type]),
      total,
      page,
      hasMore: page * limit < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching your activity' });
  }
};

module.exports = { getMyActivity };
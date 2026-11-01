const mongoose = require('mongoose');
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { containsProfanity } = require('../utils/profanity');
const { uploadFiles } = require('../utils/uploadToCloudinary');

// Create a post (any logged-in user)
const createPost = async (req, res) => {
  try {
    const { title, content, flair } = req.body;

    if (!title || !content || !flair) {
      return res
        .status(400)
        .json({ message: "Title, content, and flair are required" });
    }
        if (containsProfanity(title, content)) {
      return res.status(400).json({ message: 'Your post contains inappropriate language. Please edit it and try again.' });
    }
    // Files are uploaded only after every check has passed
    const attachments = await uploadFiles(req.files, 'campus-connect/posts');
    const post = new Post({
      title,
      content,
      flair,
      attachments,
      createdBy: req.user.userId,
    });

    await post.save();

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating post" });
  }
};

// Escape special characters so a search term is treated as plain text
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const SORTS = {
  new: { createdAt: -1 },
  old: { createdAt: 1 },
  top: { upvoteCount: -1, createdAt: -1 },
};

// Get posts: all of them, or search with ?q=, ordered with ?sort= (public)
const getPosts = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const requested = req.query.sort;
    const sortKey = ['new', 'old', 'top', 'relevance'].includes(requested)
      ? requested
      : q ? 'relevance' : 'new';

    // upvoteCount lets us sort by upvotes
    const addCount = { $addFields: { upvoteCount: { $size: { $ifNull: ['$upvotes', []] } } } };

    let results;

    if (!q) {
      // 'relevance' makes no sense without a search term, so it falls back to newest
      results = await Post.aggregate([addCount, { $sort: SORTS[sortKey] || SORTS.new }]);
    } else {
      try {
        const pipeline = [
          {
            $search: {
              index: 'post_search',
              compound: {
                should: [
                  {
                    text: {
                      query: q,
                      path: 'title',
                      fuzzy: { maxEdits: 1, prefixLength: 2 },
                      score: { boost: { value: 3 } },
                    },
                  },
                  {
                    text: {
                      query: q,
                      path: 'content',
                      fuzzy: { maxEdits: 1, prefixLength: 2 },
                    },
                  },
                ],
                minimumShouldMatch: 1,
              },
            },
          },
          { $limit: 50 },
          { $addFields: { score: { $meta: 'searchScore' } } },
          addCount,
        ];
        // Atlas already returns best match first, so only re-sort for the other orders
        if (sortKey !== 'relevance') pipeline.push({ $sort: SORTS[sortKey] });
        results = await Post.aggregate(pipeline);
      } catch (searchErr) {
        // If Atlas Search fails, fall back to a simple match so the page still works
        console.warn('Atlas Search failed, using fallback:', searchErr.message);
        const rx = new RegExp(escapeRegex(q), 'i');
        results = await Post.aggregate([
          { $match: { $or: [{ title: rx }, { content: rx }] } },
          addCount,
          { $sort: SORTS[sortKey] || SORTS.new },
          { $limit: 50 },
        ]);
      }
    }

    const populated = await Post.populate(results, { path: 'createdBy', select: 'username' });
    res.status(200).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
};

// Get one post by id (public)
const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = await Post.findById(id).populate('createdBy', 'username');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.status(200).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
};

// Toggle upvote (logged-in users only)
const toggleUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const alreadyUpvoted = post.upvotes.includes(userId);

    if (alreadyUpvoted) {
      post.upvotes = post.upvotes.filter((uid) => uid.toString() !== userId);
    } else {
      post.upvotes.push(userId);
    }

    await post.save();

    res.status(200).json({
      message: alreadyUpvoted ? "Upvote removed" : "Post upvoted",
      upvoteCount: post.upvotes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating upvote" });
  }
};

// Delete a post (creator or admin only)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isOwner = post.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    // Remove everything that belongs to this post
    await Comment.deleteMany({ post: post._id });
    await Notification.deleteMany({ post: post._id });

    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting post" });
  }
};

module.exports = { createPost, getPosts, getPostById, toggleUpvote, deletePost };
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const { containsProfanity } = require('../utils/profanity');

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

    const post = new Post({
      title,
      content,
      flair,
      createdBy: req.user.userId,
    });

    await post.save();

    res.status(201).json({ message: "Post created successfully", post });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating post" });
  }
};

// Get all posts (public)
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("createdBy", "username")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching posts" });
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

module.exports = { createPost, getPosts, toggleUpvote, deletePost };

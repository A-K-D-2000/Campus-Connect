const Comment = require("../models/Comment");
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendToUser } = require('../socket');
const { containsProfanity } = require('../utils/profanity');

const MAX_REPLIES = 200;
// Decide who to notify about a new comment/reply, and save the notifications
const notifyForComment = async ({ comment, post, parent, senderId }) => {
  const recipients = new Map(); // recipientId -> notification type

  if (!parent) {
    recipients.set(post.createdBy.toString(), "comment");
  } else {
    recipients.set(parent.createdBy.toString(), "reply");
    if (comment.taggedUser) {
      // Set after 'reply', so a tagged parent-owner gets one 'mention', not two notifications
      recipients.set(comment.taggedUser.toString(), "mention");
    }
  }

  recipients.delete(senderId); // never notify yourself

  const docs = [...recipients].map(([recipientId, type]) => ({
    recipient: recipientId,
    sender: senderId,
    type,
    post: post._id,
    comment: comment._id,
  }));

    if (docs.length > 0) {
    const created = await Notification.insertMany(docs);

    // Fill in the sender's username and the post title, same as the REST list shows
    const populated = await Notification.populate(created, [
      { path: 'sender', select: 'username' },
      { path: 'post', select: 'title' },
    ]);

    // Push each one to its recipient if they're online
    populated.forEach((n) => sendToUser(n.recipient.toString(), 'notification', n));
  }
};

// Create a comment or a reply (logged-in users)
// Create a comment or a reply (logged-in users)
const createComment = async (req, res) => {
  try {
    const { postId, content, parentComment, taggedUser } = req.body;

    if (!postId || !content) {
      return res
        .status(400)
        .json({ message: "postId and content are required" });
    }
        if (containsProfanity(content)) {
      return res.status(400).json({ message: 'Your comment contains inappropriate language. Please edit it and try again.' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    let parent = null;

    // Extra rules that only apply to replies
    if (parentComment) {
      parent = await Comment.findById(parentComment);
      if (!parent) {
        return res.status(404).json({ message: "Parent comment not found" });
      }
      if (parent.parentComment) {
        return res
          .status(400)
          .json({ message: "Replies can only be added to top-level comments" });
      }
      if (parent.post.toString() !== postId) {
        return res
          .status(400)
          .json({ message: "Parent comment does not belong to this post" });
      }
      const replyCount = await Comment.countDocuments({ parentComment });
      if (replyCount >= MAX_REPLIES) {
        return res
          .status(400)
          .json({ message: "Reply limit reached for this comment" });
      }
      if (taggedUser) {
        const tagged = await User.findById(taggedUser).select("_id");
        if (!tagged) {
          return res.status(404).json({ message: "Tagged user not found" });
        }
      }
    }

    const comment = new Comment({
      post: postId,
      content,
      createdBy: req.user.userId,
      parentComment: parentComment || null,
      taggedUser: parentComment ? taggedUser : undefined,
    });

    await comment.save();

    // A notification problem must never make the comment itself fail
    try {
      await notifyForComment({
        comment,
        post,
        parent,
        senderId: req.user.userId,
      });
    } catch (notifyErr) {
      console.error("Notification error:", notifyErr);
    }

    res.status(201).json({ message: "Comment created successfully", comment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating comment" });
  }
};

// Get top-level comments of a post, in pages (public)
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const comments = await Comment.find({ post: postId, parentComment: null })
      .populate("createdBy", "username")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const result = await Promise.all(
      comments.map(async (c) => ({
        ...c,
        upvoteCount: c.upvotes.length,
        replyCount: await Comment.countDocuments({ parentComment: c._id }),
      })),
    );

    const total = await Comment.countDocuments({
      post: postId,
      parentComment: null,
    });

    res
      .status(200)
      .json({ comments: result, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching comments" });
  }
};

// Get replies of one top-level comment, in pages (public)
const getReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const replies = await Comment.find({ parentComment: id })
      .populate("createdBy", "username")
      .populate("taggedUser", "username")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const result = replies.map((r) => ({
      ...r,
      upvoteCount: r.upvotes.length,
    }));

    const total = await Comment.countDocuments({ parentComment: id });

    res
      .status(200)
      .json({ replies: result, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while fetching replies" });
  }
};

// Toggle upvote on a comment or reply (logged-in users)
const toggleCommentUpvote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const alreadyUpvoted = comment.upvotes.includes(userId);

    if (alreadyUpvoted) {
      comment.upvotes = comment.upvotes.filter(
        (uid) => uid.toString() !== userId,
      );
    } else {
      comment.upvotes.push(userId);
    }

    await comment.save();

    res.status(200).json({
      message: alreadyUpvoted ? "Upvote removed" : "Comment upvoted",
      upvoteCount: comment.upvotes.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while updating upvote" });
  }
};

// Delete a comment (owner or admin)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isOwner = comment.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    // Deleting a top-level comment also removes its replies
    if (!comment.parentComment) {
      const replies = await Comment.find({ parentComment: comment._id }).select(
        "_id",
      );
      const replyIds = replies.map((r) => r._id);
      await Comment.deleteMany({ parentComment: comment._id });
      await Notification.deleteMany({ comment: { $in: replyIds } });
    }

    // Remove notifications that pointed at this comment
    await Notification.deleteMany({ comment: comment._id });

    await comment.deleteOne();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while deleting comment" });
  }
};

module.exports = {
  createComment,
  getComments,
  getReplies,
  toggleCommentUpvote,
  deleteComment,
};

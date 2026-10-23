const Notification = require('../models/Notification');

// Get my notifications, newest first, in pages (logged-in)
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'username')
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({ recipient: userId, isRead: false });

    res.status(200).json({ notifications, total, unreadCount, page, hasMore: page * limit < total });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Mark one notification as read (logged-in)
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Marked as read', notification });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating notification' });
  }
};

// Mark all my notifications as read (logged-in)
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({ message: 'All notifications marked as read' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating notifications' });
  }
};

// Dismiss (delete) one notification (logged-in)
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.userId,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.status(200).json({ message: 'Notification dismissed' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while dismissing notification' });
  }
};

// Clear all my notifications (logged-in)
const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.userId });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while clearing notifications' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
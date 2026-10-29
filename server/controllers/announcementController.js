const Announcement = require('../models/Announcement');

// Create an announcement (admin only)
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }

    const announcement = new Announcement({
      title,
      content,
      category,
      createdBy: req.user.userId,
    });

    await announcement.save();

    res.status(201).json({ message: 'Announcement created successfully', announcement });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while creating announcement' });
  }
};

// Get all announcements (public)
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('createdBy', 'username').sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching announcements' });
  }
};

// Update an announcement (admin only)
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

        const isOwner = announcement.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage announcements you created' });
    }

    if (title) announcement.title = title;
    if (content) announcement.content = content;
    if (category) announcement.category = category;

    await announcement.save();

    res.status(200).json({ message: 'Announcement updated successfully', announcement });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating announcement' });
  }
};

// Delete an announcement (admin only)
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }


        const isOwner = announcement.createdBy.toString() === req.user.userId;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only manage announcements you created' });
    }

    await announcement.deleteOne();

    res.status(200).json({ message: 'Announcement deleted successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while deleting announcement' });
  }
};

module.exports = { createAnnouncement, getAnnouncements, updateAnnouncement, deleteAnnouncement };
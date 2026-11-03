const mongoose = require('mongoose');
const User = require('../models/User');

const ROLES = ['student', 'authority', 'admin'];

// Escape special characters so a search term is treated as plain text
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// List users, with optional search and role filter (admin only)
const listUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 50);
    const q = String(req.query.q || '').trim().slice(0, 100);

    const filter = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ username: rx }, { email: rx }];
    }
    if (ROLES.includes(req.query.role)) {
      filter.role = req.query.role;
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('username email role isVerified createdAt')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.status(200).json({ users, total, page, hasMore: page * limit < total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Change one user's role (admin only)
const setUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role must be student, authority or admin' });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (id === req.user.userId) {
      return res.status(400).json({ message: 'You cannot change your own role' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      message: 'Role updated',
      user: { _id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error while updating role' });
  }
};

module.exports = { listUsers, setUserRole };
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // The account must still exist; the role comes from the database, not the token
    const user = await User.findById(decoded.userId).select('role');
    if (!user) {
      return res.status(401).json({ message: 'This account no longer exists' });
    }

    req.user = { userId: decoded.userId, role: user.role };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: admins only' });
  }
};
const staffOnly = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'authority')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: authorities and admins only' });
  }
};
module.exports = { protect, adminOnly, staffOnly  };
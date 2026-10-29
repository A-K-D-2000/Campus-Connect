const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Runs once per connection attempt: only logged-in users get through
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.query?.token;

    const header = socket.handshake.headers.authorization;
    if (!token && header && header.startsWith('Bearer ')) {
      token = header.split(' ')[1];
    }

    if (!token) {
      return next(new Error('No token provided'));
    }

    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user gets a private room named after their user ID
    const room = `user:${socket.user.userId}`;
    socket.join(room);
    console.log(`Socket connected: ${socket.user.userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.userId}`);
    });
  });

  return io;
};

// Send an event to one user's room (does nothing if they're offline)
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

module.exports = { initSocket, sendToUser };
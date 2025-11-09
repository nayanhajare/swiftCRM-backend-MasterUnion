const jwt = require('jsonwebtoken');
const { User } = require('../models');

const setupSocketIO = (io) => {
  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid token'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join role-based room
    socket.join(`role:${socket.user.role}`);

    // Handle lead updates
    socket.on('lead:subscribe', (leadId) => {
      socket.join(`lead:${leadId}`);
      console.log(`User ${socket.userId} subscribed to lead ${leadId}`);
    });

    socket.on('lead:unsubscribe', (leadId) => {
      socket.leave(`lead:${leadId}`);
      console.log(`User ${socket.userId} unsubscribed from lead ${leadId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

};

module.exports = { setupSocketIO };


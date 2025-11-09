const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { sequelize } = require('./config/database');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const activityRoutes = require('./routes/activities');
const dashboardRoutes = require('./routes/dashboard');
const { setupSocketIO } = require('./socket/socket');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

setupSocketIO(io);
// Make io accessible in routes
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SwiftCRM API is running' });
});

// 404 handler (must be before error handler)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

// Database connection and server start
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected successfully');
    return sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  })
  .then(() => {
    console.log('✅ Database models synchronized');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((error) => {
    console.error('\n❌ Database Connection Error:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('password')) {
      console.error('💡 Solution:');
      console.error('   1. Check if DB_PASSWORD is set in .env file');
      console.error('   2. Verify PostgreSQL user password is correct');
      console.error('   3. Make sure password is not empty\n');
    } else if (error.message.includes('does not exist')) {
      console.error('💡 Solution:');
      console.error('   1. Create the database: CREATE DATABASE swiftcrm;');
      console.error('   2. Or update DB_NAME in .env file\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Solution:');
      console.error('   1. Make sure PostgreSQL is running');
      console.error('   2. Check if DB_HOST and DB_PORT are correct');
      console.error('   3. Verify PostgreSQL service is started\n');
    }
    
    console.error('📝 See DATABASE_SETUP.md for detailed setup instructions\n');
    process.exit(1);
  });

module.exports = { app, server, io };


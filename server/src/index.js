const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const moderationService = require('./services/moderationService');

// Routes
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User joins their own room for direct messages
  socket.on('register_user', (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Direct user-to-user message
  socket.on('send_direct_message', async (data) => {
    // data: { senderId, recipientId, message, tempId }
    try {
      const moderationResult = await moderationService.moderateContent(data.message);
      console.log('Moderation result:', moderationResult);
      const Message = require('./models/Message');
      const User = require('./models/User');
      // Transform toxicityResults array to object for MongoDB
      let toxicityScores = {};
      if (Array.isArray(moderationResult.toxicityResults)) {
        for (const entry of moderationResult.toxicityResults) {
          toxicityScores[entry.label] = entry.results;
        }
      }
      // Save message to DB, flagged if not safe
      const newMessage = new Message({
        content: data.message,
        sender: data.senderId,
        recipient: data.recipientId,
        moderationResults: {
          isSafe: moderationResult.isSafe,
          reasons: moderationResult.reasons,
          toxicityScores
        }
      });
      const savedMessage = await newMessage.save();
      const senderUser = await User.findById(data.senderId).select('username email isAdmin warningCount isBanned lastActivity createdAt updatedAt');
      // Broadcast moderation info
      const msgPayload = {
        ...data,
        message: savedMessage.content,
        timestamp: savedMessage.createdAt,
        _id: savedMessage._id,
        sender: senderUser,
        moderation: {
          isSafe: moderationResult.isSafe,
          reasons: moderationResult.reasons
        }
      };
      console.log('Broadcasting message:', msgPayload);
      io.to(data.senderId).emit('receive_direct_message', msgPayload);
      io.to(data.recipientId).emit('receive_direct_message', msgPayload);
    } catch (error) {
      console.error('Moderation error:', error);
      socket.emit('error', { message: 'Message processing failed' });
    }
  });

  socket.on('disconnect', () => {
    // Remove user from connectedUsers
    for (const [userId, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

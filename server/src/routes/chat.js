const router = require('express').Router();
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');
const moderationService = require('../services/moderationService');

// Apply auth middleware to all routes
router.use(auth);

// Get all chat rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ isPrivate: false })
      .select('name description members moderationLevel')
      .populate('members', 'username profilePicture');
    
    res.status(200).json(rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat room
router.post('/rooms', async (req, res) => {
  try {
    const { name, description, moderationLevel, isPrivate } = req.body;
    const userId = req.body.userId; // In production, get this from auth middleware
    
    const newRoom = new ChatRoom({
      name,
      description,
      members: [userId],
      moderators: [userId],
      moderationLevel: moderationLevel || 'medium',
      isPrivate: isPrivate || false
    });
    
    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages for a specific room
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const messages = await Message.find({ 
      roomId,
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('sender', 'username profilePicture');
    
    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message to a room
router.post('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, senderId } = req.body;
    
    // Check if room exists
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found' });
    }
    
    // Check if user is blocked
    if (room.blockedUsers.includes(senderId)) {
      return res.status(403).json({ message: 'You are blocked from this room' });
    }
    
    // Moderate content
    const moderationResult = await moderationService.moderateContent(content);
    
    // Create message
    const newMessage = new Message({
      content,
      sender: senderId,
      roomId,
      isFlagged: !moderationResult.isSafe,
      moderationResults: {
        isSafe: moderationResult.isSafe,
        reasons: moderationResult.reasons,
        toxicityScores: moderationResult.toxicityResults,
        scamDetected: moderationResult.scamResults?.isScam || false
      }
    });
    
    const savedMessage = await newMessage.save();
    
    // If message is flagged but we're saving it for admin review
    if (!moderationResult.isSafe) {
      return res.status(200).json({
        message: 'Your message has been flagged for review',
        flagged: true,
        reasons: moderationResult.reasons,
        messageId: savedMessage._id
      });
    }
    
    // Normal case - message is sent
    await savedMessage.populate('sender', 'username profilePicture');
    res.status(201).json(savedMessage);
    
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Report a message
router.post('/messages/:messageId/report', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reporterId, reason } = req.body;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Flag the message
    message.isFlagged = true;
    if (!message.moderationResults) {
      message.moderationResults = {};
    }
    
    if (!message.moderationResults.reasons) {
      message.moderationResults.reasons = [];
    }
    
    message.moderationResults.reasons.push(`Reported by user: ${reason}`);
    await message.save();
    
    res.status(200).json({ message: 'Message reported successfully' });
  } catch (error) {
    console.error('Error reporting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all flagged messages (admin only)
router.get('/flagged-messages', async (req, res) => {
  try {
    // In production, check if user is admin
    
    const flaggedMessages = await Message.find({ isFlagged: true })
      .populate('sender', 'username email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(flaggedMessages);
  } catch (error) {
    console.error('Error fetching flagged messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, skip = 0 } = req.query;

        // Verify user exists
        const recipient = await User.findById(userId);
        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get messages between the two users
        const messages = await Message.find({
            $or: [
                { sender: req.user._id, recipient: userId },
                { sender: userId, recipient: req.user._id }
            ],
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit))
        .populate('sender', 'username profilePicture')
        .populate('recipient', 'username profilePicture');

        res.status(200).json(messages.reverse());
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message to a user
router.post('/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { content } = req.body;

        // Verify recipient exists
        const recipient = await User.findById(userId);
        if (!recipient) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if recipient has blocked the sender
        if (recipient.blockedUsers?.includes(req.user._id)) {
            return res.status(403).json({ message: 'You cannot send messages to this user' });
        }

        // Create new message
        const newMessage = new Message({
            content,
            sender: req.user._id,
            recipient: userId
        });

        // Moderate message content
        const moderationResult = await moderationService.moderateContent(content);
        if (!moderationResult.isSafe) {
            return res.status(400).json({ 
                message: 'Message contains inappropriate content',
                reasons: moderationResult.reasons
            });
        }

        const savedMessage = await newMessage.save();
        await savedMessage.populate('sender', 'username profilePicture');
        await savedMessage.populate('recipient', 'username profilePicture');

        res.status(201).json(savedMessage);
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's conversations
router.get('/conversations', async (req, res) => {
    try {
        // Find all messages where the user is either sender or recipient
        const messages = await Message.find({
            $or: [
                { sender: req.user._id },
                { recipient: req.user._id }
            ],
            isDeleted: false
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username profilePicture')
        .populate('recipient', 'username profilePicture');

        // Group messages by conversation partner
        const conversations = new Map();
        
        messages.forEach(message => {
            const partner = message.sender._id.toString() === req.user._id.toString() 
                ? message.recipient 
                : message.sender;
            
            const partnerId = partner._id.toString();
            
            if (!conversations.has(partnerId)) {
                conversations.set(partnerId, {
                    user: partner,
                    lastMessage: {
                        content: message.content,
                        createdAt: message.createdAt
                    },
                    // Count unread messages where user is recipient and hasn't deleted the message
                    unreadCount: messages.filter(m => 
                        m.sender._id.toString() === partnerId &&
                        m.recipient._id.toString() === req.user._id.toString() &&
                        !m.isDeleted
                    ).length
                });
            }
        });

        res.status(200).json(Array.from(conversations.values()));
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 
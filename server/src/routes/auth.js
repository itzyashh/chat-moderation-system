const router = require('express').Router();
const User = require('../models/User');
const { check, validationResult } = require('express-validator');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this email or username' 
      });
    }
    
    // Create new user (in a real app, you'd hash the password)
    const newUser = new User({
      username,
      email,
      password, // In production, hash this password
    });
    
    const savedUser = await newUser.save();
    
    // Return user without password
    const { password: pwd, ...userWithoutPassword } = savedUser.toObject();
    res.status(201).json(userWithoutPassword);
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check password (in a real app, you'd compare hashed passwords)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({ message: 'Your account has been banned' });
    }
    
    // Update last activity
    user.lastActivity = Date.now();
    await user.save();
    
    // Return user without password
    const { password: pwd, ...userWithoutPassword } = user.toObject();
    res.status(200).json(userWithoutPassword);
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 
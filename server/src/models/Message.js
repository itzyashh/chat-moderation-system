const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  moderationResults: {
    isSafe: {
      type: Boolean,
      default: true
    },
    reasons: [{
      type: String
    }],
    toxicityScores: {
      type: Map,
      of: Number
    }
  },
  attachments: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema); 
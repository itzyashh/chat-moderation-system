const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  roomId: {
    type: String,
    required: true
  },
  isFlagged: {
    type: Boolean,
    default: false
  },
  moderationResults: {
    isSafe: Boolean,
    reasons: [String],
    toxicityScores: Object,
    scamDetected: Boolean
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema); 
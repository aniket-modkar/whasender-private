const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
  },
  deviceFingerprint: {
    type: String,
  },
  issuedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
});

// Index for faster queries
sessionSchema.index({ token: 1 });
sessionSchema.index({ userId: 1, isRevoked: 1 });

module.exports = mongoose.model('Session', sessionSchema);

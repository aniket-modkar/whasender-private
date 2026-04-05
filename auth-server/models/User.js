const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: {
    type: String,
  },
  password: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    enum: ['trial', 'basic', 'pro'],
    default: 'trial',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxDailyMessages: {
    type: Number,
    default: 50,
  },
  deviceId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
  },
});

module.exports = mongoose.model('User', userSchema);

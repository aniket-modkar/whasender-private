const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema({
  host: String,
  port: Number,
  secure: Boolean,
  user: String,
  pass: String,
  alertEmail: String,
  enabledAlerts: {
    taskStarted: { type: Boolean, default: true },
    taskComplete: { type: Boolean, default: true },
    banDetected: { type: Boolean, default: true },
    serviceDown: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: true },
    dailyLimitReached: { type: Boolean, default: true },
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  plan: {
    type: String,
    enum: ['FREE', 'BASIC', 'PRO', 'PREMIUM', 'ENTERPRISE'],
    default: 'FREE',
  },
  maxDailyMessages: {
    type: Number,
    default: 50,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
  deviceId: {
    type: String,
  },
  smtpConfig: {
    type: smtpConfigSchema,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);

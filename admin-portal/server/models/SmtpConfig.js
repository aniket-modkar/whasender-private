const mongoose = require('mongoose');

const smtpConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    default: '',
  },
  host: {
    type: String,
    required: true,
  },
  port: {
    type: Number,
    required: true,
    default: 587,
  },
  secure: {
    type: Boolean,
    default: false,
  },
  user: {
    type: String,
    required: true,
  },
  pass: {
    type: String,
    required: true,
  },
  alertEmail: {
    type: String,
    required: true,
  },
  enabledAlerts: {
    taskStarted: { type: Boolean, default: true },
    taskComplete: { type: Boolean, default: true },
    banDetected: { type: Boolean, default: true },
    serviceDown: { type: Boolean, default: true },
    dailyReport: { type: Boolean, default: true },
    dailyLimitReached: { type: Boolean, default: true },
  },
  active: {
    type: Boolean,
    default: true,
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
smtpConfigSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('SmtpConfig', smtpConfigSchema);

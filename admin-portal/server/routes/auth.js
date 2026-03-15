const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const OTP = require('../models/OTP');
const { generateOTP, getOTPExpiry } = require('../utils/otp');
const { sendOTP } = require('../utils/email');

/**
 * POST /api/auth/request-otp
 * Request OTP for login
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    // Check if email is a valid admin
    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin email or account is inactive',
      });
    }

    // Generate OTP
    const otpCode = generateOTP(parseInt(process.env.OTP_LENGTH) || 6);
    const expiresAt = getOTPExpiry(parseInt(process.env.OTP_EXPIRY_MINUTES) || 10);

    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email: email.toLowerCase() });

    // Save new OTP
    await OTP.create({
      email: email.toLowerCase(),
      otp: otpCode,
      expiresAt,
    });

    // Send OTP via email
    await sendOTP(email, otpCode);

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES) || 10,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP. Please try again.',
    });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP and login
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email and OTP are required',
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp: otp.trim(),
    });

    if (!otpRecord) {
      return res.status(401).json({
        success: false,
        error: 'Invalid OTP',
      });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({ _id: otpRecord._id });
      return res.status(401).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase(), isActive: true });

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin email or account is inactive',
      });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Create session (in a real app, use JWT or express-session)
    const sessionToken = Buffer.from(`${admin._id}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        lastLogin: admin.lastLogin,
      },
      token: sessionToken,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify OTP. Please try again.',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout admin
 */
router.post('/logout', async (req, res) => {
  try {
    // In a real app, invalidate the session/token here
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout',
    });
  }
});

/**
 * GET /api/auth/verify-session
 * Verify if session is valid
 */
router.get('/verify-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided',
      });
    }

    // Decode token (simple implementation - use JWT in production)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [adminId] = decoded.split(':');

    const admin = await Admin.findById(adminId);

    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid session',
    });
  }
});

module.exports = router;

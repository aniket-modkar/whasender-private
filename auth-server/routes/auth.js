const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const authMiddleware = require('../middleware/authMiddleware');
const { loginLimiter, authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Apply general rate limit to all auth routes
router.use(authLimiter);

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Check if account has expired
    if (new Date() > user.expiresAt) {
      return res.status(403).json({ error: 'Account has expired' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check device binding
    if (user.deviceId && user.deviceId !== deviceId) {
      return res.status(403).json({
        error: 'Device mismatch. This account is registered to a different device.',
      });
    }

    // Bind device on first login
    if (!user.deviceId && deviceId) {
      user.deviceId = deviceId;
      await user.save();
    }

    // Create JWT
    const jwtExpiry = process.env.JWT_EXPIRY || '5d';
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        plan: user.plan,
        maxDailyMessages: user.maxDailyMessages,
      },
      process.env.JWT_SECRET,
      { expiresIn: jwtExpiry }
    );

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5); // 5 days

    // Store session
    const session = new Session({
      userId: user._id,
      token,
      deviceFingerprint: deviceId,
      expiresAt,
    });

    await session.save();

    // Return response
    res.json({
      token,
      expiresAt,
      user: {
        name: user.name,
        email: user.email,
        plan: user.plan,
        maxDailyMessages: user.maxDailyMessages,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    res.json({
      valid: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        plan: req.user.plan,
        maxDailyMessages: req.user.maxDailyMessages,
        expiresAt: req.user.expiresAt,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // Revoke the current session
    req.session.isRevoked = true;
    await req.session.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    res.json({
      authenticated: true,
      user: {
        name: req.user.name,
        email: req.user.email,
        plan: req.user.plan,
      },
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

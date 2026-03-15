const express = require('express');
const router = express.Router();
const SmtpConfig = require('../models/SmtpConfig');

/**
 * GET /api/smtp-configs
 * Get all SMTP configurations
 */
router.get('/', async (req, res) => {
  try {
    const configs = await SmtpConfig.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error('Get SMTP configs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SMTP configurations',
    });
  }
});

/**
 * GET /api/smtp-configs/:id
 * Get single SMTP configuration
 */
router.get('/:id', async (req, res) => {
  try {
    const config = await SmtpConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'SMTP configuration not found',
      });
    }

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Get SMTP config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SMTP configuration',
    });
  }
});

/**
 * POST /api/smtp-configs
 * Create new SMTP configuration
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, host, port, secure, user, pass, alertEmail, enabledAlerts } = req.body;

    // Validate required fields
    if (!name || !host || !user || !pass || !alertEmail) {
      return res.status(400).json({
        success: false,
        error: 'Name, host, user, password, and alert email are required',
      });
    }

    // Check if name already exists
    const existing = await SmtpConfig.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'SMTP configuration with this name already exists',
      });
    }

    // Create config
    const config = await SmtpConfig.create({
      name,
      description: description || '',
      host,
      port: port || 587,
      secure: secure || false,
      user,
      pass,
      alertEmail,
      enabledAlerts: enabledAlerts || {
        taskStarted: true,
        taskComplete: true,
        banDetected: true,
        serviceDown: true,
        dailyReport: true,
        dailyLimitReached: true,
      },
    });

    res.status(201).json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Create SMTP config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create SMTP configuration',
    });
  }
});

/**
 * PUT /api/smtp-configs/:id
 * Update SMTP configuration
 */
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      host,
      port,
      secure,
      user,
      pass,
      alertEmail,
      enabledAlerts,
      active,
    } = req.body;

    const config = await SmtpConfig.findById(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'SMTP configuration not found',
      });
    }

    // Update fields
    if (name !== undefined) config.name = name;
    if (description !== undefined) config.description = description;
    if (host !== undefined) config.host = host;
    if (port !== undefined) config.port = port;
    if (secure !== undefined) config.secure = secure;
    if (user !== undefined) config.user = user;
    if (pass !== undefined) config.pass = pass;
    if (alertEmail !== undefined) config.alertEmail = alertEmail;
    if (enabledAlerts !== undefined) config.enabledAlerts = enabledAlerts;
    if (active !== undefined) config.active = active;

    await config.save();

    res.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Update SMTP config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update SMTP configuration',
    });
  }
});

/**
 * DELETE /api/smtp-configs/:id
 * Delete SMTP configuration
 */
router.delete('/:id', async (req, res) => {
  try {
    const config = await SmtpConfig.findByIdAndDelete(req.params.id);

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'SMTP configuration not found',
      });
    }

    res.json({
      success: true,
      message: 'SMTP configuration deleted successfully',
    });
  } catch (error) {
    console.error('Delete SMTP config error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete SMTP configuration',
    });
  }
});

module.exports = router;

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

class SmtpService {
  constructor() {
    this.transporter = null;
    this.config = null;
    this.initialized = false;
    this.currentUserId = null;
  }

  // Initialize with user's SMTP config from MongoDB
  async init(smtpConfig = null) {
    if (smtpConfig) {
      this.config = smtpConfig;
      this.initializeTransporter();
      this.initialized = true;
    } else {
      this.initialized = false;
      this.transporter = null;
      this.config = null;
    }
  }

  // Set SMTP config from user data (called after auth)
  async setConfigFromUser(user) {
    if (!user || !user.smtpConfig) {
      console.log('No SMTP config available for user');
      this.config = null;
      this.transporter = null;
      this.initialized = false;
      return;
    }

    this.currentUserId = user.id || user._id;
    this.config = user.smtpConfig;
    this.initializeTransporter();
    this.initialized = true;
    console.log('SMTP config loaded from user data');
  }

  // Get current config (for internal use)
  getCurrentConfig() {
    return this.config;
  }

  // Initialize nodemailer transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        auth: {
          user: this.config.user,
          pass: this.config.pass,
        },
      });

      console.log('SMTP transporter initialized');
    } catch (error) {
      console.error('Error initializing transporter:', error);
      this.transporter = null;
    }
  }

  // Test connection
  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('SMTP not configured');
      }

      await this.transporter.verify();

      return {
        success: true,
        message: 'SMTP connection successful',
      };
    } catch (error) {
      console.error('SMTP test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Load HTML template
  loadTemplate(templateName) {
    const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);
    return fs.readFileSync(templatePath, 'utf8');
  }

  // Simple template replacement ({{variable}})
  renderTemplate(template, data) {
    let rendered = template;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }

    // Handle conditionals {{#if variable}}...{{/if}}
    rendered = rendered.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return data[varName] ? content : '';
    });

    return rendered;
  }

  // Send alert email
  async sendAlert(type, data) {
    try {
      // Check if alerts are configured
      if (!this.isConfigured()) {
        console.log('SMTP not configured, skipping email alert');
        return { success: false, error: 'SMTP not configured' };
      }

      // Check if this alert type is enabled
      const alertKey = this.getAlertKey(type);
      if (!this.config.enabledAlerts[alertKey]) {
        console.log(`Alert ${type} is disabled, skipping`);
        return { success: false, error: 'Alert type disabled' };
      }

      // Get template and subject based on type
      const { template, subject } = this.getTemplateAndSubject(type, data);

      // Load and render template
      const html = this.loadTemplate(template);
      const renderedHtml = this.renderTemplate(html, data);

      // Send email
      const info = await this.transporter.sendMail({
        from: `WhaSender <${this.config.user}>`,
        to: this.config.alertEmail,
        subject: subject,
        html: renderedHtml,
      });

      console.log(`Alert email sent: ${type} - ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Error sending alert email:', error);
      // Don't throw - email failure shouldn't crash the task
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get template and subject for alert type
  getTemplateAndSubject(type, data) {
    switch (type) {
      case 'TASK_STARTED':
        return {
          template: 'task-started',
          subject: `WhaSender: Task #${data.taskId} Started`,
        };

      case 'TASK_COMPLETE':
        return {
          template: 'task-complete',
          subject: `WhaSender: Task #${data.taskId} Completed - ${data.successRate}% Success`,
        };

      case 'BAN_DETECTED':
        return {
          template: 'ban-alert',
          subject: `🚨 WhaSender: Ban/Rate Limit Detected - Task #${data.taskId}`,
        };

      case 'SERVICE_DOWN':
        return {
          template: 'service-down',
          subject: `⚠️ WhaSender: Service Issue - Task #${data.taskId}`,
        };

      case 'DAILY_REPORT':
        return {
          template: 'daily-report',
          subject: `WhaSender: Daily Report - ${data.date}`,
        };

      case 'DAILY_LIMIT_REACHED':
        return {
          template: 'daily-limit-reached',
          subject: `⏸️ WhaSender: Daily Limit Reached - Task #${data.taskId}`,
        };

      default:
        throw new Error(`Unknown alert type: ${type}`);
    }
  }

  // Get alert key for enabled check
  getAlertKey(type) {
    const map = {
      TASK_STARTED: 'taskStarted',
      TASK_COMPLETE: 'taskComplete',
      BAN_DETECTED: 'banDetected',
      SERVICE_DOWN: 'serviceDown',
      DAILY_REPORT: 'dailyReport',
      DAILY_LIMIT_REACHED: 'dailyLimitReached',
    };

    return map[type] || type;
  }

  // Check if configured
  isConfigured() {
    return this.config && this.config.host && this.config.user && this.config.pass;
  }
}

module.exports = new SmtpService();

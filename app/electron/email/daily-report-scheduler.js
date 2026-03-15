const cron = require('node-cron');
const smtpService = require('./smtp-service');
const reportGenerator = require('./report-generator');
const { getSetting } = require('../database/queries');

class DailyReportScheduler {
  constructor() {
    this.cronJob = null;
  }

  // Start daily report cron job
  start() {
    // Schedule for 9:00 PM IST every day
    // IST is UTC+5:30, so 9:00 PM IST = 3:30 PM UTC (15:30)
    // Using cron timezone feature
    this.cronJob = cron.schedule(
      '0 21 * * *', // 9:00 PM
      async () => {
        await this.sendDailyReport();
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );

    console.log('Daily report scheduler started (9:00 PM IST)');
  }

  // Send daily report
  async sendDailyReport() {
    try {
      console.log('Generating daily report...');

      // Check if any messages were sent today
      const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);

      if (sentToday === 0) {
        console.log('No messages sent today, skipping daily report');
        return;
      }

      // Generate report
      const reportData = reportGenerator.generateDailyReport();

      if (!reportData) {
        console.log('Failed to generate daily report');
        return;
      }

      // Send email
      const result = await smtpService.sendAlert('DAILY_REPORT', reportData);

      if (result.success) {
        console.log('Daily report sent successfully');
      } else {
        console.log('Failed to send daily report:', result.error);
      }
    } catch (error) {
      console.error('Error sending daily report:', error);
    }
  }

  // Stop cron job
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Daily report scheduler stopped');
    }
  }

  // Manually trigger daily report (for testing)
  async triggerNow() {
    console.log('Manually triggering daily report...');
    await this.sendDailyReport();
  }
}

module.exports = new DailyReportScheduler();

const { Notification } = require('electron');

class NotificationService {
  constructor() {
    this.enabled = true;
  }

  // Check if notifications are supported
  isSupported() {
    return Notification.isSupported();
  }

  // Show a notification
  show(title, body, options = {}) {
    if (!this.enabled || !this.isSupported()) {
      return;
    }

    try {
      const notification = new Notification({
        title,
        body,
        icon: options.icon,
        silent: options.silent || false,
        urgency: options.urgency || 'normal', // low, normal, critical
      });

      if (options.onClick) {
        notification.on('click', options.onClick);
      }

      notification.show();
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Task started notification
  notifyTaskStarted(taskId, totalNumbers) {
    this.show('Task Started', `Task #${taskId} has started sending to ${totalNumbers} numbers`, {
      urgency: 'low',
    });
  }

  // Task completed notification
  notifyTaskComplete(taskId, stats) {
    const successRate = stats.total > 0 ? ((stats.sent / stats.total) * 100).toFixed(1) : 0;

    this.show(
      'Task Completed',
      `Task #${taskId} finished!\n✓ Sent: ${stats.sent}\n✗ Failed: ${stats.failed}\nSuccess Rate: ${successRate}%`,
      {
        urgency: 'normal',
      }
    );
  }

  // Task failed notification
  notifyTaskFailed(taskId, error) {
    this.show('Task Failed', `Task #${taskId} failed: ${error}`, {
      urgency: 'critical',
    });
  }

  // Task stopped notification
  notifyTaskStopped(taskId) {
    this.show('Task Stopped', `Task #${taskId} was stopped by user`, {
      urgency: 'low',
    });
  }

  // Ban detected notification
  notifyBanDetected(taskId, sentSoFar) {
    this.show(
      '⚠️ Possible Ban Detected',
      `Task #${taskId} paused after ${sentSoFar} messages.\nPlease check WhatsApp status.`,
      {
        urgency: 'critical',
      }
    );
  }

  // WhatsApp disconnected notification
  notifyWhatsAppDisconnected(reason) {
    this.show('WhatsApp Disconnected', `Connection lost: ${reason || 'Unknown reason'}`, {
      urgency: 'critical',
    });
  }

  // WhatsApp reconnected notification
  notifyWhatsAppReconnected() {
    this.show('WhatsApp Connected', 'Successfully reconnected to WhatsApp', {
      urgency: 'low',
    });
  }

  // Daily limit warning
  notifyDailyLimitWarning(current, limit) {
    const percentage = ((current / limit) * 100).toFixed(0);
    this.show(
      'Daily Limit Warning',
      `You've sent ${current}/${limit} messages today (${percentage}%).\nApproaching daily limit.`,
      {
        urgency: 'normal',
      }
    );
  }

  // Daily limit reached notification
  notifyDailyLimitReached(taskId, sentToday, dailyLimit, remaining) {
    this.show(
      '⏸️ Daily Limit Reached',
      `Task #${taskId} paused.\n✓ Sent: ${sentToday}/${dailyLimit} today\n📋 Remaining: ${remaining} messages\n⏰ Auto-resume: Tomorrow 9 AM IST`,
      {
        urgency: 'normal',
      }
    );
  }

  // Enable notifications
  enable() {
    this.enabled = true;
  }

  // Disable notifications
  disable() {
    this.enabled = false;
  }
}

// Export singleton
const notificationService = new NotificationService();
module.exports = notificationService;

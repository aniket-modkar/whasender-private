const { getTask, getTaskNumbers, getLogsForTask } = require('../database/queries');
const { getDatabase } = require('../database/db');

class ReportGenerator {
  // Generate task completion report
  generateTaskReport(taskId) {
    try {
      const task = getTask(taskId);

      if (!task) {
        throw new Error('Task not found');
      }

      // Get failed numbers
      const failedNumbers = getTaskNumbers(taskId, 'failed');
      const skippedNumbers = getTaskNumbers(taskId, 'skipped');

      // Format failed numbers list
      const failedNumbersList = failedNumbers
        .map((n) => `${n.phone}: ${n.error}`)
        .join('<br>');

      // Calculate duration
      let duration = 'N/A';
      if (task.started_at && task.completed_at) {
        const start = new Date(task.started_at);
        const end = new Date(task.completed_at);
        const diffMs = end - start;
        duration = this.formatDuration(diffMs);
      }

      // Calculate success rate
      const total = task.sent_count + task.failed_count + task.skipped_count;
      const successRate = total > 0 ? Math.round((task.sent_count / total) * 100) : 0;

      // Message preview (truncate)
      const messagePreview =
        task.message_template.length > 100
          ? task.message_template.substring(0, 100) + '...'
          : task.message_template;

      // Get execution logs
      const logs = getLogsForTask(taskId, 500); // Get last 500 logs
      const logsHtml = this.formatLogs(logs);

      return {
        taskId: task.id,
        status: task.status,
        messagePreview,
        startedAt: task.started_at ? new Date(task.started_at).toLocaleString() : 'N/A',
        completedAt: task.completed_at
          ? new Date(task.completed_at).toLocaleString()
          : 'N/A',
        duration,
        totalNumbers: task.total_numbers,
        sent: task.sent_count,
        failed: task.failed_count,
        skipped: task.skipped_count,
        successRate,
        hasFailedNumbers: failedNumbers.length > 0 || skippedNumbers.length > 0,
        failedNumbersList:
          failedNumbers.length > 0 || skippedNumbers.length > 0
            ? failedNumbersList
            : 'None',
        operatingWindow: '9:00 AM - 8:00 PM IST',
        hasLogs: logs.length > 0,
        logsHtml: logsHtml,
        logsCount: logs.length,
      };
    } catch (error) {
      console.error('Error generating task report:', error);
      return null;
    }
  }

  // Generate daily report
  generateDailyReport() {
    try {
      const db = getDatabase();

      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get all tasks completed today
      const stmt = db.prepare(`
        SELECT * FROM tasks
        WHERE DATE(started_at) = ?
        ORDER BY started_at DESC
      `);

      const tasks = stmt.all(today);

      // Calculate aggregates
      let totalSent = 0;
      let totalFailed = 0;
      let totalSkipped = 0;
      let tasksCompleted = 0;

      const tasksList = tasks
        .map((task) => {
          totalSent += task.sent_count || 0;
          totalFailed += task.failed_count || 0;
          totalSkipped += task.skipped_count || 0;

          if (['completed', 'stopped'].includes(task.status)) {
            tasksCompleted++;
          }

          const total = task.sent_count + task.failed_count + task.skipped_count;
          const successRate = total > 0 ? Math.round((task.sent_count / total) * 100) : 0;

          // Get logs for this task (limited to 50 per task)
          const taskLogs = getLogsForTask(task.id, 50);
          const taskLogsHtml = taskLogs.length > 0 ? `
            <details style="margin-top: 10px;">
              <summary style="cursor: pointer; color: #007bff; font-size: 12px;">
                📋 View Logs (${taskLogs.length} entries)
              </summary>
              <div style="max-height: 200px; overflow-y: auto; margin-top: 5px; border: 1px solid #ddd; border-radius: 3px; padding: 5px;">
                ${this.formatLogs(taskLogs)}
              </div>
            </details>
          ` : '';

          return `
            <div style="padding: 10px; background: #f9f9f9; margin: 5px 0; border-left: 3px solid #007bff;">
              <strong>Task #${task.id}</strong> - ${task.status}<br>
              Sent: ${task.sent_count} | Failed: ${task.failed_count} | Skipped: ${task.skipped_count}<br>
              Success Rate: ${successRate}%
              ${taskLogsHtml}
            </div>
          `;
        })
        .join('');

      const total = totalSent + totalFailed + totalSkipped;
      const successRate = total > 0 ? Math.round((totalSent / total) * 100) : 0;

      // Get warmup stats (from settings)
      const dailyLimit = this.getSetting('wa_daily_limit') || 200;
      const sentToday = parseInt(this.getSetting('wa_messages_sent_today') || '0', 10);
      const remainingToday = Math.max(0, dailyLimit - sentToday);
      const accountAge = this.getAccountAge();

      return {
        date: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        totalSent,
        totalFailed,
        totalSkipped,
        tasksCompleted,
        successRate,
        dailyLimit,
        remainingToday,
        accountAge,
        operatingWindow: '9:00 AM - 8:00 PM IST',
        hasTasks: tasks.length > 0,
        tasksList: tasks.length > 0 ? tasksList : 'No tasks today',
      };
    } catch (error) {
      console.error('Error generating daily report:', error);
      return null;
    }
  }

  // Helper: Get setting from database
  getSetting(key) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
  }

  // Helper: Get account age
  getAccountAge() {
    const firstConnected = this.getSetting('wa_first_connected_date');
    if (!firstConnected) {
      return 0;
    }

    const first = new Date(firstConnected);
    const now = new Date();
    const diffMs = now - first;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays + 1;
  }

  // Helper: Format duration
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Helper: Format logs to HTML
  formatLogs(logs) {
    if (!logs || logs.length === 0) {
      return '<p style="color: #666; font-style: italic;">No logs available</p>';
    }

    const logLevelColors = {
      info: '#2563eb',    // blue
      success: '#16a34a', // green
      error: '#dc2626',   // red
      warning: '#ea580c', // orange
    };

    const logLevelIcons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    };

    const logsHtml = logs
      .map((log) => {
        const timestamp = new Date(log.timestamp).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });

        const color = logLevelColors[log.level] || '#666';
        const icon = logLevelIcons[log.level] || '•';

        return `
          <div style="
            padding: 8px 12px;
            margin: 4px 0;
            border-left: 3px solid ${color};
            background: ${log.level === 'error' ? '#fee' : log.level === 'success' ? '#efe' : '#f9f9f9'};
            font-family: 'Courier New', monospace;
            font-size: 12px;
            display: flex;
            align-items: flex-start;
          ">
            <span style="margin-right: 8px;">${icon}</span>
            <div style="flex: 1;">
              <span style="color: #666; margin-right: 12px;">${timestamp}</span>
              <span style="color: ${color}; font-weight: bold; text-transform: uppercase; margin-right: 12px;">[${log.level}]</span>
              <span style="color: #333;">${this.escapeHtml(log.message)}</span>
            </div>
          </div>
        `;
      })
      .join('');

    return logsHtml;
  }

  // Helper: Escape HTML
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

module.exports = new ReportGenerator();

const cron = require('node-cron');
const { getDatabase } = require('../database/db');
const taskManager = require('./task-manager');

class Scheduler {
  constructor(taskExecutor) {
    this.taskExecutor = taskExecutor;
    this.scheduledJobs = new Map(); // taskId -> cron job
  }

  // Parse IST datetime to cron expression
  parseISTDateTimeToCron(istDateTimeString) {
    // Parse the ISO string
    const date = new Date(istDateTimeString);

    // Convert to IST (Asia/Kolkata timezone)
    const istDate = new Date(
      date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    );

    const minutes = istDate.getMinutes();
    const hours = istDate.getHours();
    const dayOfMonth = istDate.getDate();
    const month = istDate.getMonth() + 1; // 0-indexed

    // Create cron expression: "minute hour day month *"
    const cronExpression = `${minutes} ${hours} ${dayOfMonth} ${month} *`;

    return cronExpression;
  }

  // Schedule a task
  scheduleTask(taskId, scheduledAtIST) {
    try {
      console.log(`Scheduling task #${taskId} for ${scheduledAtIST}`);

      const scheduledDate = new Date(scheduledAtIST);
      const now = new Date();

      // Check if scheduled time is in the past
      if (scheduledDate <= now) {
        console.log('Scheduled time is in the past, starting immediately');
        this.taskExecutor.executeTask(taskId);
        return {
          success: true,
          message: 'Task started immediately (scheduled time was in the past)',
        };
      }

      // Create cron expression
      const cronExpression = this.parseISTDateTimeToCron(scheduledAtIST);
      console.log(`Cron expression: ${cronExpression}`);

      // Validate cron expression
      if (!cron.validate(cronExpression)) {
        throw new Error('Invalid cron expression generated');
      }

      // Cancel existing job if any
      if (this.scheduledJobs.has(taskId)) {
        this.cancelSchedule(taskId);
      }

      // Create cron job
      const job = cron.schedule(
        cronExpression,
        () => {
          console.log(`Cron triggered: Starting task #${taskId}`);
          this.taskExecutor.executeTask(taskId);

          // Remove from scheduled jobs after execution
          this.scheduledJobs.delete(taskId);
        },
        {
          scheduled: true,
          timezone: 'Asia/Kolkata',
        }
      );

      // Store job reference
      this.scheduledJobs.set(taskId, {
        job,
        scheduledAt: scheduledAtIST,
        cronExpression,
      });

      console.log(
        `Task #${taskId} scheduled for ${new Date(scheduledAtIST).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`
      );

      return {
        success: true,
        message: `Task scheduled for ${new Date(scheduledAtIST).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST`,
        cronExpression,
      };
    } catch (error) {
      console.error('Error scheduling task:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Cancel scheduled task
  cancelSchedule(taskId) {
    try {
      if (!this.scheduledJobs.has(taskId)) {
        return {
          success: false,
          error: 'No scheduled job found for this task',
        };
      }

      const { job } = this.scheduledJobs.get(taskId);
      job.stop();
      this.scheduledJobs.delete(taskId);

      console.log(`Task #${taskId} schedule cancelled`);

      return {
        success: true,
        message: 'Schedule cancelled',
      };
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get scheduled time for a task
  getScheduledTime(taskId) {
    if (!this.scheduledJobs.has(taskId)) {
      return null;
    }

    const { scheduledAt } = this.scheduledJobs.get(taskId);
    return scheduledAt;
  }

  // Check if task is scheduled
  isScheduled(taskId) {
    return this.scheduledJobs.has(taskId);
  }

  // Get all scheduled tasks
  getAllScheduledTasks() {
    const scheduled = [];

    for (const [taskId, data] of this.scheduledJobs.entries()) {
      scheduled.push({
        taskId,
        scheduledAt: data.scheduledAt,
        cronExpression: data.cronExpression,
      });
    }

    return scheduled;
  }

  // Re-register scheduled tasks on app startup
  reregisterScheduledTasks() {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT id, scheduled_at
        FROM tasks
        WHERE status = 'scheduled'
        AND scheduled_at IS NOT NULL
      `);

      const tasks = stmt.all();

      console.log(`Re-registering ${tasks.length} scheduled tasks`);

      for (const task of tasks) {
        this.scheduleTask(task.id, task.scheduled_at);
      }

      return {
        success: true,
        count: tasks.length,
      };
    } catch (error) {
      console.error('Error re-registering scheduled tasks:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Resume all tasks paused due to daily limit
  resumePausedLimitTasks() {
    try {
      const db = require('../database/db').getDatabase();
      const stmt = db.prepare(`
        SELECT id, message_template, total_numbers, sent_count
        FROM tasks
        WHERE status = 'paused_limit'
        ORDER BY id ASC
      `);

      const pausedTasks = stmt.all();

      console.log(`Found ${pausedTasks.length} tasks paused due to daily limit`);

      for (const task of pausedTasks) {
        const remaining = task.total_numbers - task.sent_count;
        console.log(`Resuming task #${task.id} (${remaining} messages remaining)`);

        // Start the task immediately
        this.taskExecutor.executeTask(task.id);
      }

      return {
        success: true,
        count: pausedTasks.length,
      };
    } catch (error) {
      console.error('Error resuming paused limit tasks:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Start daily auto-resume scheduler (runs at 9 AM IST)
  startDailyResumeScheduler() {
    // Create cron job for 9:00 AM IST every day
    const job = cron.schedule(
      '0 9 * * *', // 9:00 AM every day
      () => {
        console.log('Daily auto-resume triggered at 9:00 AM IST');
        this.resumePausedLimitTasks();
      },
      {
        scheduled: true,
        timezone: 'Asia/Kolkata',
      }
    );

    console.log('Daily auto-resume scheduler started (9:00 AM IST)');
    return job;
  }

  // Stop all scheduled jobs
  stopAll() {
    for (const [taskId, { job }] of this.scheduledJobs.entries()) {
      job.stop();
      console.log(`Stopped scheduled task #${taskId}`);
    }

    this.scheduledJobs.clear();
  }
}

module.exports = Scheduler;

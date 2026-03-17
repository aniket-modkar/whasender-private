const { getWAConnection } = require('../whatsapp/wa-connection');
const WASender = require('../whatsapp/wa-sender');
const DelayEngine = require('../anti-ban/delay-engine');
const TimeWindowManager = require('../anti-ban/time-window');
const HumanSimulator = require('../anti-ban/human-simulator');
const WarmupManager = require('../anti-ban/warmup-manager');
const taskManager = require('./task-manager');
const smtpService = require('../email/smtp-service');
const reportGenerator = require('../email/report-generator');
const notificationService = require('../notifications/notification-service');
const authManager = require('../auth/auth-manager');
const {
  getTask,
  getTaskNumbers,
  markNumberSent,
  markNumberFailed,
  markNumberSkipped,
  insertLog,
} = require('../database/queries');

class TaskExecutor {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.waConnection = getWAConnection(mainWindow);
    this.waSender = new WASender(this.waConnection);
    this.delayEngine = new DelayEngine();
    this.timeWindow = new TimeWindowManager();
    this.humanSimulator = new HumanSimulator();
    this.warmupManager = new WarmupManager();

    this.currentTask = null;
    this.isRunning = false;
    this.isPaused = false;
    this.shouldStop = false;
  }

  // Recover state from database (call on app startup)
  async recoverState() {
    try {
      console.log('TaskExecutor: Checking for interrupted tasks...');

      // Check for tasks that were running or paused when app closed
      const interruptedTask = await taskManager.getActiveTask();

      if (!interruptedTask) {
        console.log('TaskExecutor: No interrupted tasks found');
        return;
      }

      const status = interruptedTask.status;
      console.log(`TaskExecutor: Found interrupted task #${interruptedTask.id} with status: ${status}`);

      // Handle different recovery scenarios
      if (status === 'running') {
        // Task was running when app closed - mark as paused_manual
        console.log('TaskExecutor: Task was running when app closed, marking as paused');
        await taskManager.updateStatus(
          interruptedTask.id,
          'paused_manual',
          'App was closed while task was running. Click Resume to continue.'
        );
        insertLog(
          interruptedTask.id,
          'warn',
          'Task paused due to app restart. Ready to resume.'
        );
      } else if (status.startsWith('paused_')) {
        // Task was already paused - keep it paused
        console.log('TaskExecutor: Task remains paused, can be resumed from UI');
        insertLog(
          interruptedTask.id,
          'info',
          'App restarted. Task remains paused and can be resumed.'
        );
      }

      // Emit status to UI so it shows the current state
      this.emitStatusChange(
        interruptedTask.id,
        status,
        status.startsWith('paused_') ? status : 'paused_manual',
        interruptedTask.pause_reason
      );

      console.log('TaskExecutor: State recovery complete');
    } catch (error) {
      console.error('TaskExecutor: Error recovering state:', error);
    }
  }

  // Resume a task from any paused state or database
  async resumeTask(taskId) {
    try {
      console.log(`TaskExecutor: Attempting to resume task #${taskId}`);

      // If already running something else, reject
      if (this.isRunning && this.currentTask && this.currentTask.id !== taskId) {
        return {
          success: false,
          error: 'Another task is already running',
        };
      }

      // Get task from database
      const task = await getTask(taskId);

      if (!task) {
        return {
          success: false,
          error: 'Task not found',
        };
      }

      // Check if task is in a resumable state
      if (!task.status.startsWith('paused_') && task.status !== 'running') {
        return {
          success: false,
          error: `Task cannot be resumed from status: ${task.status}`,
        };
      }

      // If executor is currently running and paused, just unpause
      if (this.isRunning && this.isPaused && this.currentTask?.id === taskId) {
        console.log('TaskExecutor: Resuming paused execution');
        this.isPaused = false;
        await taskManager.updateStatus(taskId, 'running');
        this.emitStatusChange(taskId, task.status, 'running');
        insertLog(taskId, 'info', 'Task resumed');
        return { success: true };
      }

      // Otherwise, start execution from where it left off
      console.log('TaskExecutor: Restarting task execution from saved state');
      return await this.executeTask(taskId);

    } catch (error) {
      console.error('TaskExecutor: Error resuming task:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Start task execution
  async executeTask(taskId) {
    try {
      console.log(`Starting task execution: Task #${taskId}`);

      // Check if already running
      if (this.isRunning) {
        return {
          success: false,
          error: 'Task executor is already running',
        };
      }

      // Check WhatsApp connection
      if (!this.waConnection.isConnected()) {
        return {
          success: false,
          error: 'WhatsApp is not connected',
        };
      }

      // Load task
      const task = getTask(taskId);
      if (!task) {
        return {
          success: false,
          error: 'Task not found',
        };
      }

      this.currentTask = task;
      this.isRunning = true;
      this.isPaused = false;
      this.shouldStop = false;

      // Initialize warmup if first time
      await this.warmupManager.initializeConnection();

      // Update task status to running
      taskManager.updateStatus(taskId, 'running');
      this.emitStatusChange(taskId, 'scheduled', 'running');

      // Log start
      insertLog(taskId, 'info', 'Task execution started');

      // Send task started email
      smtpService.sendAlert('TASK_STARTED', {
        taskId,
        totalNumbers: task.total_numbers,
        messagePreview:
          task.message_template.length > 100
            ? task.message_template.substring(0, 100) + '...'
            : task.message_template,
        startedAt: new Date().toLocaleString(),
      });

      // Show notification
      notificationService.notifyTaskStarted(taskId, task.total_numbers);

      // Start the sending loop (don't await, run in background)
      this.sendingLoop(taskId);

      return {
        success: true,
        message: 'Task execution started',
      };
    } catch (error) {
      console.error('Error starting task execution:', error);
      this.isRunning = false;

      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Main sending loop
  async sendingLoop(taskId) {
    try {
      const task = getTask(taskId);

      // Get pending numbers (from current_index)
      let numbers = getTaskNumbers(taskId, 'pending');

      // Shuffle numbers for randomness
      numbers = this.humanSimulator.shuffleArray(numbers);

      console.log(`Processing ${numbers.length} pending numbers`);

      let sentCount = task.sent_count || 0;
      let failedCount = task.failed_count || 0;
      let skippedCount = task.skipped_count || 0;
      let currentIndex = task.current_index || 0;
      let messagesSinceLastPause = 0;
      let consecutiveFailures = 0;

      // Main loop
      for (let i = 0; i < numbers.length; i++) {
        // Check if should stop
        if (this.shouldStop) {
          console.log('Stop requested, breaking loop');
          break;
        }

        // Check if paused
        while (this.isPaused && !this.shouldStop) {
          await this.delayEngine.sleep(1000); // Check every second
        }

        if (this.shouldStop) break;

        const numberData = numbers[i];

        // Check time window
        if (!this.timeWindow.isWithinOperatingHours()) {
          const status = this.timeWindow.getWindowStatus();
          console.log(`Outside operating hours: ${status.message}`);
          insertLog(taskId, 'info', `Paused: Outside operating hours. ${status.message}`);

          this.emitStatusChange(taskId, 'running', 'paused_manual', 'Outside operating hours');
          taskManager.updateStatus(taskId, 'paused_manual', 'Outside operating hours');

          // Wait until window opens
          await this.delayEngine.sleep(status.millisUntilOpen);

          taskManager.updateStatus(taskId, 'running');
          this.emitStatusChange(taskId, 'paused_manual', 'running');
          insertLog(taskId, 'info', 'Resumed: Operating hours active');
        }

        // Check warmup limits
        // Get user's plan limit from MongoDB
        const user = authManager.getUser();
        const userPlanLimit = user?.maxDailyMessages || 50; // Default to 50 if not authenticated

        if (!this.warmupManager.canSendMore(userPlanLimit)) {
          const stats = this.warmupManager.getWarmupStats(userPlanLimit);
          const remaining = numbers.length - i; // Calculate remaining messages

          console.log(`Daily limit reached: ${stats.sentToday}/${stats.dailyLimit}`);
          console.log(`${remaining} messages remaining, will resume tomorrow`);

          insertLog(
            taskId,
            'info',
            `Daily limit reached: ${stats.sentToday}/${stats.dailyLimit}. ` +
            `${remaining} messages remaining. ` +
            `Task will auto-resume tomorrow at 9:00 AM IST.`
          );

          // Pause task due to daily limit (not completed!)
          taskManager.updateStatus(taskId, 'paused_limit', `Daily limit reached (${stats.sentToday}/${stats.dailyLimit})`);
          this.emitStatusChange(taskId, 'running', 'paused_limit', 'Daily limit reached');

          // Send email notification
          smtpService.sendAlert('DAILY_LIMIT_REACHED', {
            taskId,
            sentToday: stats.sentToday,
            dailyLimit: stats.dailyLimit,
            remaining,
            resumeTime: 'Tomorrow at 9:00 AM IST',
          });

          // Show notification
          notificationService.notifyDailyLimitReached(taskId, stats.sentToday, stats.dailyLimit, remaining);

          // Stop execution for today
          this.isRunning = false;
          this.currentTask = null;
          break;
        }

        // Send message based on media type
        console.log(`Sending to ${numberData.phone} (${i + 1}/${numbers.length})`);
        let sendResult;

        const mediaType = task.media_type || 'text';

        if (mediaType === 'text') {
          // Vary text message
          const variedMessage = this.humanSimulator.varyMessage(
            task.message_template,
            numberData.name,
            numberData.phone
          );

          sendResult = await this.waSender.sendTextMessage(
            numberData.phone,
            variedMessage
          );
        } else if (mediaType === 'video') {
          // Vary caption for video
          const variedCaption = this.humanSimulator.varyMessage(
            task.media_caption || task.message_template || '',
            numberData.name,
            numberData.phone
          );

          sendResult = await this.waSender.sendVideoMessage(
            numberData.phone,
            task.media_path,
            variedCaption
          );
        } else if (mediaType === 'image') {
          // Vary caption for image
          const variedCaption = this.humanSimulator.varyMessage(
            task.media_caption || task.message_template || '',
            numberData.name,
            numberData.phone
          );

          sendResult = await this.waSender.sendImageMessage(
            numberData.phone,
            task.media_path,
            variedCaption
          );
        } else if (mediaType === 'document') {
          // Vary caption for document
          const variedCaption = this.humanSimulator.varyMessage(
            task.media_caption || task.message_template || '',
            numberData.name,
            numberData.phone
          );

          sendResult = await this.waSender.sendDocumentMessage(
            numberData.phone,
            task.media_path,
            variedCaption,
            task.media_filename
          );
        } else {
          // Fallback to text
          const variedMessage = this.humanSimulator.varyMessage(
            task.message_template,
            numberData.name,
            numberData.phone
          );

          sendResult = await this.waSender.sendTextMessage(
            numberData.phone,
            variedMessage
          );
        }

        // Update based on result
        if (sendResult.sent) {
          markNumberSent(numberData.id);
          sentCount++;
          consecutiveFailures = 0;
          this.warmupManager.recordSend();

          insertLog(taskId, 'info', `✓ Sent to ${numberData.phone}`);
        } else {
          // Check error type
          if (sendResult.errorType === 'rate_limit') {
            // Ban detected!
            console.log('Ban detected! Pausing task.');
            insertLog(taskId, 'ban', `Ban detected: ${sendResult.error}`);

            taskManager.updateStatus(taskId, 'paused_ban', 'Rate limit / ban detected');
            this.emitStatusChange(taskId, 'running', 'paused_ban', 'Ban detected');
            this.emitBanDetected(taskId, sentCount);

            // Send ban alert email
            smtpService.sendAlert('BAN_DETECTED', {
              taskId,
              sentSoFar: sentCount,
              detectedAt: new Date().toLocaleString(),
            });

            // Show notification
            notificationService.notifyBanDetected(taskId, sentCount);

            // Stop execution
            this.shouldStop = true;
            break;
          } else if (!sendResult.retryable || sendResult.error === 'not_on_whatsapp') {
            // Skip number
            markNumberSkipped(numberData.id, sendResult.error);
            skippedCount++;
            consecutiveFailures = 0;

            insertLog(taskId, 'warn', `⊘ Skipped ${numberData.phone}: ${sendResult.error}`);
          } else {
            // Failed, but retryable
            markNumberFailed(numberData.id, sendResult.error);
            failedCount++;
            consecutiveFailures++;

            insertLog(taskId, 'error', `✗ Failed ${numberData.phone}: ${sendResult.error}`);
          }

          // Check for consecutive failures
          if (consecutiveFailures >= 5) {
            console.log('Too many consecutive failures, pausing task');
            insertLog(taskId, 'error', '5 consecutive failures detected. Possible connection issue.');

            taskManager.updateStatus(taskId, 'paused_manual', 'Consecutive failures');
            this.emitStatusChange(taskId, 'running', 'paused_manual', 'Consecutive failures');

            // Send service down alert
            smtpService.sendAlert('SERVICE_DOWN', {
              taskId,
              sent: sentCount,
              reason: '5 consecutive message send failures',
              detectedAt: new Date().toLocaleString(),
            });

            // Pause for investigation
            this.isPaused = true;
            break;
          }
        }

        // Update counters
        currentIndex = i + 1;
        taskManager.updateCounters(taskId, sentCount, failedCount, skippedCount, currentIndex);

        // Emit progress
        this.emitProgress(taskId, {
          sent: sentCount,
          failed: failedCount,
          skipped: skippedCount,
          total: numbers.length,
          currentPhone: numberData.phone,
        });

        messagesSinceLastPause++;

        // Check if batch pause needed
        if (this.delayEngine.shouldTakeBatchPause(messagesSinceLastPause)) {
          const pauseDelay = this.delayEngine.getBatchPauseDelay();
          console.log(`Taking batch pause: ${this.delayEngine.formatDelay(pauseDelay)}`);
          insertLog(taskId, 'info', `Batch pause: ${this.delayEngine.formatDelay(pauseDelay)}`);

          await this.delayEngine.sleep(pauseDelay);
          messagesSinceLastPause = 0;
        } else {
          // Normal message delay
          const delay = this.delayEngine.getMessageDelay();
          console.log(`Delay: ${this.delayEngine.formatDelay(delay)}`);

          await this.delayEngine.sleep(delay);
        }
      }

      // Task completed (unless stopped or paused)
      if (!this.shouldStop && !this.isPaused) {
        taskManager.updateStatus(taskId, 'completed');
        this.emitStatusChange(taskId, 'running', 'completed');
        this.emitComplete(taskId, { sentCount, failedCount, skippedCount });
        insertLog(taskId, 'info', 'Task completed successfully');

        // Send task complete email
        const reportData = reportGenerator.generateTaskReport(taskId);
        if (reportData) {
          smtpService.sendAlert('TASK_COMPLETE', reportData);
        }

        // Show notification
        notificationService.notifyTaskComplete(taskId, {
          sent: sentCount,
          failed: failedCount,
          total: numbers.length,
        });
      }

      this.isRunning = false;
      this.currentTask = null;
    } catch (error) {
      console.error('Error in sending loop:', error);
      insertLog(taskId, 'error', `Task error: ${error.message}`);
      taskManager.updateStatus(taskId, 'failed', error.message);
      this.emitStatusChange(taskId, 'running', 'failed', error.message);

      // Show notification
      notificationService.notifyTaskFailed(taskId, error.message);

      this.isRunning = false;
      this.currentTask = null;
    }
  }

  // Pause execution
  async pause(reason = 'manual') {
    // Check in-memory state first
    if (!this.isRunning || !this.currentTask) {
      // If not running in memory, check database for active task
      const activeTask = await taskManager.getActiveTask();
      if (!activeTask) {
        return {
          success: false,
          error: 'No active task found',
        };
      }

      // Task exists in database but not in memory - update database directly
      if (activeTask.status === 'running') {
        const pauseReason = reason === 'manual' ? 'Paused by user' : reason;
        await taskManager.updateStatus(activeTask.id, 'paused_manual', pauseReason);
        insertLog(activeTask.id, 'info', `Task paused: ${pauseReason}`);
        this.emitStatusChange(activeTask.id, 'running', 'paused_manual', pauseReason);
        return { success: true };
      }

      return {
        success: false,
        error: `Task is in ${activeTask.status} status, cannot pause`,
      };
    }

    // Normal pause for running task
    this.isPaused = true;
    this.delayEngine.cancel(); // Cancel current sleep

    const pauseReason = reason === 'manual' ? 'Paused by user' : reason;
    await taskManager.updateStatus(this.currentTask.id, 'paused_manual', pauseReason);
    this.emitStatusChange(this.currentTask.id, 'running', 'paused_manual', pauseReason);
    insertLog(this.currentTask.id, 'info', `Task paused: ${pauseReason}`);

    return {
      success: true,
    };
  }

  // Resume execution (use resumeTask for more robust resuming)
  async resume() {
    // Check in-memory state first
    if (!this.isRunning || !this.currentTask) {
      // If not running in memory, check database for paused task
      const activeTask = await taskManager.getActiveTask();
      if (!activeTask) {
        return {
          success: false,
          error: 'No active task found to resume',
        };
      }

      // Use the new resumeTask method for database-based resume
      if (activeTask.status.startsWith('paused_')) {
        return await this.resumeTask(activeTask.id);
      }

      return {
        success: false,
        error: `Task is in ${activeTask.status} status, cannot resume`,
      };
    }

    // Normal resume for paused task
    if (!this.isPaused) {
      return {
        success: false,
        error: 'Task is not paused',
      };
    }

    this.isPaused = false;
    await taskManager.updateStatus(this.currentTask.id, 'running');
    this.emitStatusChange(this.currentTask.id, 'paused_manual', 'running');
    insertLog(this.currentTask.id, 'info', 'Task resumed');

    return {
      success: true,
    };
  }

  // Stop execution
  stop() {
    if (!this.isRunning) {
      return {
        success: false,
        error: 'No task is running',
      };
    }

    this.shouldStop = true;
    this.delayEngine.cancel(); // Cancel current sleep

    if (this.currentTask) {
      taskManager.updateStatus(this.currentTask.id, 'stopped');
      this.emitStatusChange(this.currentTask.id, 'running', 'stopped', 'Stopped by user');
      insertLog(this.currentTask.id, 'info', 'Task stopped by user');

      // Show notification
      notificationService.notifyTaskStopped(this.currentTask.id);
    }

    return {
      success: true,
    };
  }

  // Emit progress event
  emitProgress(taskId, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('task:progress', {
        taskId,
        ...data,
      });
    }
  }

  // Emit status change event
  emitStatusChange(taskId, oldStatus, newStatus, reason = null) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('task:status-change', {
        taskId,
        oldStatus,
        newStatus,
        reason,
      });
    }
  }

  // Emit complete event
  emitComplete(taskId, stats) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('task:complete', {
        taskId,
        stats,
      });
    }
  }

  // Emit ban detected event
  emitBanDetected(taskId, sentSoFar) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('task:ban-detected', {
        taskId,
        sentSoFar,
      });
    }
  }
}

module.exports = TaskExecutor;

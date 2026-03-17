const { ipcMain, dialog, app } = require('electron');
const { autoUpdater } = require('electron-updater');
const { getDatabase } = require('./database/db');
const authManager = require('./auth/auth-manager');
const { getWAConnection } = require('./whatsapp/wa-connection');
const WASender = require('./whatsapp/wa-sender');
const ExcelParser = require('./utils/excel-parser');
const taskManager = require('./task/task-manager');
const TaskExecutor = require('./task/task-executor');
const Scheduler = require('./task/scheduler');
const smtpService = require('./email/smtp-service');
const notificationService = require('./notifications/notification-service');
const { getMediaManager } = require('./media/media-manager');
const contactsManager = require('./contacts/contacts-manager');

function registerIpcHandlers(mainWindow) {
  // Test handler
  ipcMain.handle('ping', async () => {
    return 'pong';
  });

  // Database test handler
  ipcMain.handle('db:test', async () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT COUNT(*) as count
        FROM sqlite_master
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      `);
      const result = stmt.get();
      return {
        success: true,
        tableCount: result.count,
        message: `Database has ${result.count} tables`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Auth handlers
  ipcMain.handle('auth:login', async (event, { email, password }) => {
    try {
      return await authManager.login(email, password);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('auth:verify', async () => {
    try {
      const result = await authManager.verifyToken();
      return {
        success: true,
        valid: result.valid,
        user: result.user,
        isActive: result.isActive,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('auth:check-status', async () => {
    try {
      return await authManager.checkAccountStatus();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('auth:logout', async () => {
    try {
      return await authManager.logout();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('auth:get-user', async () => {
    try {
      const user = authManager.getUser();
      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('auth:is-authenticated', async () => {
    try {
      const isAuth = authManager.isAuthenticated();
      return {
        success: true,
        isAuthenticated: isAuth,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // WhatsApp handlers
  const waConnection = getWAConnection(mainWindow);

  ipcMain.handle('wa:connect', async () => {
    try {
      return await waConnection.connect();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('wa:disconnect', async () => {
    try {
      return await waConnection.disconnect();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('wa:status', async () => {
    try {
      return {
        success: true,
        ...waConnection.getStatus(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('wa:clear-session', async () => {
    try {
      return await waConnection.clearSession();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // File dialog handler
  ipcMain.handle('dialog:open-file', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, options);
      return result;
    } catch (error) {
      return {
        canceled: true,
        error: error.message,
      };
    }
  });

  // File parsing handlers
  const excelParser = new ExcelParser();

  ipcMain.handle('file:parse-numbers', async (event, filePath) => {
    try {
      const result = excelParser.parseFile(filePath);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Task management handlers
  ipcMain.handle('task:get-active', async () => {
    try {
      const task = taskManager.getActiveTask();
      return {
        success: true,
        task,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:get-stats', async (event, taskId) => {
    try {
      const stats = taskManager.getTaskStats(taskId);
      return {
        success: true,
        stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:get-history', async (event, limit) => {
    try {
      const history = taskManager.getTaskHistory(limit);
      return {
        success: true,
        history,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:stop', async (event, taskId) => {
    try {
      return taskManager.stopTask(taskId);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Task execution handlers
  const taskExecutor = new TaskExecutor(mainWindow);

  ipcMain.handle('task:start', async (event, taskId) => {
    try {
      return await taskExecutor.executeTask(taskId);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:pause', async () => {
    try {
      return taskExecutor.pause();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:resume', async (event, taskId) => {
    try {
      // Use the robust resumeTask method if taskId provided
      if (taskId) {
        return await taskExecutor.resumeTask(taskId);
      }
      // Otherwise use old resume method for backward compatibility
      return await taskExecutor.resume();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Task scheduling handlers
  const scheduler = new Scheduler(taskExecutor);

  // Re-register scheduled tasks on startup
  scheduler.reregisterScheduledTasks();

  // Start daily auto-resume scheduler for paused_limit tasks
  scheduler.startDailyResumeScheduler();

  // Recover state for interrupted tasks (app restart)
  taskExecutor.recoverState().catch(error => {
    console.error('Failed to recover task state:', error);
  });

  // Task creation handler (moved here to access scheduler and executor)
  ipcMain.handle('task:create', async (event, data) => {
    try {
      // Create the task in database
      const result = taskManager.createTask(data);

      if (!result.success) {
        return result;
      }

      const taskId = result.taskId;
      const scheduledAt = data.scheduledAt;

      // Auto-schedule or auto-start the task
      if (scheduledAt) {
        // Schedule for later
        console.log(`Auto-scheduling task #${taskId} for ${scheduledAt}`);
        const scheduleResult = scheduler.scheduleTask(taskId, scheduledAt);

        return {
          success: true,
          taskId,
          task: result.task,
          scheduled: true,
          scheduleMessage: scheduleResult.message,
        };
      } else {
        // Start immediately
        console.log(`Auto-starting task #${taskId} immediately`);
        const executeResult = await taskExecutor.executeTask(taskId);

        return {
          success: true,
          taskId,
          task: result.task,
          scheduled: false,
          executing: executeResult.success,
          executeMessage: executeResult.message || executeResult.error,
        };
      }
    } catch (error) {
      console.error('Error in task:create handler:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:schedule', async (event, { taskId, scheduledAt }) => {
    try {
      return scheduler.scheduleTask(taskId, scheduledAt);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:cancel-schedule', async (event, taskId) => {
    try {
      return scheduler.cancelSchedule(taskId);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Log handlers
  ipcMain.handle('task:get-logs', async (event, { taskId, limit = 100, level = null, search = null }) => {
    try {
      const { getDatabase } = require('./database/db');
      const db = getDatabase();

      // Build query with filters
      let query = 'SELECT * FROM logs WHERE task_id = ?';
      const params = [taskId];

      if (level) {
        query += ' AND level = ?';
        params.push(level);
      }

      if (search) {
        query += ' AND message LIKE ?';
        params.push(`%${search}%`);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const stmt = db.prepare(query);
      const logs = stmt.all(...params);

      return {
        success: true,
        logs,
      };
    } catch (error) {
      console.error('Error fetching logs:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:export-logs', async (event, { taskId, format = 'csv' }) => {
    try {
      const { getDatabase } = require('./database/db');
      const db = getDatabase();

      const stmt = db.prepare(`
        SELECT * FROM logs
        WHERE task_id = ?
        ORDER BY timestamp ASC
      `);
      const logs = stmt.all(taskId);

      if (format === 'csv') {
        // Generate CSV
        const header = 'ID,Task ID,Level,Message,Timestamp\n';
        const rows = logs.map(log =>
          `${log.id},${log.task_id},${log.level},"${log.message.replace(/"/g, '""')}",${log.timestamp}`
        ).join('\n');

        return {
          success: true,
          data: header + rows,
          filename: `task-${taskId}-logs.csv`,
        };
      } else {
        // JSON format
        return {
          success: true,
          data: JSON.stringify(logs, null, 2),
          filename: `task-${taskId}-logs.json`,
        };
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('task:clear-logs', async (event, taskId) => {
    try {
      const { getDatabase } = require('./database/db');
      const db = getDatabase();

      const stmt = db.prepare('DELETE FROM logs WHERE task_id = ?');
      const result = stmt.run(taskId);

      return {
        success: true,
        deleted: result.changes,
      };
    } catch (error) {
      console.error('Error clearing logs:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  ipcMain.handle('logs:cleanup-old', async (event, daysToKeep = 30) => {
    try {
      const { getDatabase } = require('./database/db');
      const db = getDatabase();

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const stmt = db.prepare('DELETE FROM logs WHERE timestamp < ?');
      const result = stmt.run(cutoffDate.toISOString());

      return {
        success: true,
        deleted: result.changes,
        message: `Deleted ${result.changes} log entries older than ${daysToKeep} days`,
      };
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // SMTP handlers (removed - now configured via MongoDB)

  // Dashboard stats handler
  ipcMain.handle('dashboard:get-stats', async () => {
    try {
      const db = getDatabase();
      const { getSetting } = require('./database/queries');
      const WarmupManager = require('./anti-ban/warmup-manager');
      const warmupManager = new WarmupManager();

      // Get today's message count
      const sentToday = parseInt(getSetting('wa_messages_sent_today') || '0', 10);

      // Get warmup stats
      const userPlanLimit = authManager.getUser()?.maxDailyMessages || 200;
      const warmupStats = warmupManager.getWarmupStats(userPlanLimit);

      // Get active task
      const activeTaskQuery = db.prepare(`
        SELECT * FROM tasks
        WHERE status IN ('scheduled', 'running', 'paused_ban', 'paused_manual')
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const activeTask = activeTaskQuery.get();

      // Get total completed tasks
      const completedQuery = db.prepare(`
        SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'
      `);
      const completedResult = completedQuery.get();

      // Get today's stats (all tasks from today)
      const today = new Date().toISOString().split('T')[0];
      const todayStatsQuery = db.prepare(`
        SELECT
          SUM(sent_count) as sent,
          SUM(failed_count) as failed,
          SUM(total_numbers) as total
        FROM tasks
        WHERE DATE(created_at) = ?
      `);
      const todayStats = todayStatsQuery.get(today);

      return {
        success: true,
        stats: {
          sentToday,
          dailyLimit: warmupStats.dailyLimit,
          accountAge: warmupStats.accountAge,
          completedTasks: completedResult.count,
          todayStats: {
            sent: todayStats.sent || 0,
            failed: todayStats.failed || 0,
            total: todayStats.total || 0,
          },
          activeTask,
        },
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // === Notification Handlers ===
  ipcMain.handle('notifications:enable', async () => {
    try {
      notificationService.enable();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('notifications:disable', async () => {
    try {
      notificationService.disable();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('notifications:is-enabled', async () => {
    try {
      return {
        success: true,
        enabled: notificationService.enabled,
        supported: notificationService.isSupported(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // === Auto-Updater Handlers ===
  ipcMain.handle('updater:check-for-updates', async () => {
    try {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return {
          success: false,
          error: 'Auto-updater is disabled in development mode',
        };
      }

      const result = await autoUpdater.checkForUpdates();
      return {
        success: true,
        updateInfo: result ? result.updateInfo : null,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('updater:download-update', async () => {
    try {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return {
          success: false,
          error: 'Auto-updater is disabled in development mode',
        };
      }

      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('updater:quit-and-install', async () => {
    try {
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return {
          success: false,
          error: 'Auto-updater is disabled in development mode',
        };
      }

      // This will quit the app and install the update
      autoUpdater.quitAndInstall(false, true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('updater:get-version', async () => {
    try {
      return {
        success: true,
        version: app.getVersion(),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Media file handlers
  ipcMain.handle('media:save-file', async (event, { sourcePath, mediaType, taskId }) => {
    try {
      const mediaManager = getMediaManager();
      return await mediaManager.saveUploadedFile(sourcePath, mediaType, taskId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:delete-file', async (event, filePath) => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.deleteFile(filePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:get-file-info', async (event, filePath) => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.getFileInfo(filePath);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:validate-file', async (event, { filePath, mediaType }) => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.validateFileSize(filePath, mediaType);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:cleanup-temp', async (event, hours = 24) => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.cleanupTempFiles(hours);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:delete-task-media', async (event, taskId) => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.deleteTaskMedia(taskId);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('media:get-disk-usage', async () => {
    try {
      const mediaManager = getMediaManager();
      return mediaManager.getDiskUsage();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // === Test Send Handler ===
  ipcMain.handle('test:send-message', async (event, { phone, message, mediaType, mediaPath }) => {
    try {
      const waConnection = getWAConnection();
      const waSender = new WASender(waConnection);

      // Check if WhatsApp is connected
      if (!waConnection.isConnected()) {
        return {
          success: false,
          error: 'WhatsApp not connected. Please connect first.'
        };
      }

      let result;

      // Send based on media type
      if (mediaType === 'text') {
        result = await waSender.sendTextMessage(phone, message);
      } else if (mediaType === 'video') {
        if (!mediaPath) {
          return { success: false, error: 'Video file path required' };
        }
        result = await waSender.sendVideoMessage(phone, mediaPath, message);
      } else if (mediaType === 'image') {
        if (!mediaPath) {
          return { success: false, error: 'Image file path required' };
        }
        result = await waSender.sendImageMessage(phone, mediaPath, message);
      } else if (mediaType === 'document') {
        if (!mediaPath) {
          return { success: false, error: 'Document file path required' };
        }
        result = await waSender.sendDocumentMessage(phone, mediaPath, message);
      } else {
        return { success: false, error: 'Invalid media type' };
      }

      if (result.sent) {
        console.log(`Test message sent to ${phone} (type: ${mediaType})`);
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to send test message'
        };
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      return {
        success: false,
        error: error.message || 'Failed to send test message'
      };
    }
  });

  // === Contacts Management Handlers ===
  ipcMain.handle('contacts:add', async (event, contact) => {
    try {
      return contactsManager.addContact(contact);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:import', async (event, contacts) => {
    try {
      return contactsManager.importContacts(contacts);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:get-all', async (event, options = {}) => {
    try {
      return contactsManager.getContacts(options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:get', async (event, id) => {
    try {
      return contactsManager.getContact(id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:update', async (event, { id, ...data }) => {
    try {
      return contactsManager.updateContact(id, data);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:delete', async (event, id) => {
    try {
      return contactsManager.deleteContact(id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:delete-multiple', async (event, ids) => {
    try {
      return contactsManager.deleteContacts(ids);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:get-count', async () => {
    try {
      return contactsManager.getContactCount();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:get-tags', async () => {
    try {
      return contactsManager.getAllTags();
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('contacts:export', async (event, ids = []) => {
    try {
      return contactsManager.exportContacts(ids);
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // More handlers will be registered here as we build out the app
}

module.exports = { registerIpcHandlers };

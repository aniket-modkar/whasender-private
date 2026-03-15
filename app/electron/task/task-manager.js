const { getDatabase } = require('../database/db');
const {
  insertTask,
  getTask,
  getActiveTask,
  updateTaskStatus,
  updateTaskCounters,
  insertNumbers,
  getTaskNumbers,
} = require('../database/queries');
const taskLock = require('./task-lock');

class TaskManager {
  // Create a new task
  createTask({ messageTemplate, numbers, scheduledAt = null, mediaType = 'text', mediaPath = null, mediaCaption = '', mediaSize = null, mediaFilename = null }) {
    try {
      // Check if another task is active
      taskLock.assertNotLocked();

      // Insert task
      const taskId = insertTask({
        messageTemplate,
        totalNumbers: numbers.length,
        scheduledAt,
        mediaType,
        mediaPath,
        mediaCaption,
        mediaSize,
        mediaFilename,
      });

      // Insert numbers
      insertNumbers(taskId, numbers);

      console.log(`Task #${taskId} created with ${numbers.length} numbers (type: ${mediaType})`);

      return {
        success: true,
        taskId,
        task: this.getTask(taskId),
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get task by ID
  getTask(id) {
    try {
      const task = getTask(id);

      if (!task) {
        return null;
      }

      // Get aggregated stats
      const stats = this.getTaskStats(id);

      return {
        ...task,
        stats,
      };
    } catch (error) {
      console.error('Error getting task:', error);
      return null;
    }
  }

  // Get currently active task
  getActiveTask() {
    try {
      const task = getActiveTask();

      if (!task) {
        return null;
      }

      // Get aggregated stats
      const stats = this.getTaskStats(task.id);

      return {
        ...task,
        stats,
      };
    } catch (error) {
      console.error('Error getting active task:', error);
      return null;
    }
  }

  // Update task status
  updateStatus(id, status, reason = null) {
    try {
      updateTaskStatus(id, status, reason);

      console.log(`Task #${id} status updated to: ${status}`);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update task counters
  updateCounters(id, sent, failed, skipped, currentIndex) {
    try {
      updateTaskCounters(id, sent, failed, skipped, currentIndex);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error updating task counters:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get task statistics
  getTaskStats(id) {
    try {
      const db = getDatabase();

      // Get counts by status
      const stmt = db.prepare(`
        SELECT
          status,
          COUNT(*) as count
        FROM task_numbers
        WHERE task_id = ?
        GROUP BY status
      `);

      const results = stmt.all(id);

      const stats = {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
      };

      for (const row of results) {
        stats[row.status] = row.count;
        stats.total += row.count;
      }

      // Calculate success rate
      const completed = stats.sent + stats.failed + stats.skipped;
      stats.successRate = completed > 0 ? (stats.sent / completed) * 100 : 0;

      // Get elapsed time
      const task = getTask(id);
      if (task.started_at) {
        const startTime = new Date(task.started_at);
        const endTime = task.completed_at
          ? new Date(task.completed_at)
          : new Date();
        stats.elapsedTime = endTime - startTime;
      } else {
        stats.elapsedTime = 0;
      }

      return stats;
    } catch (error) {
      console.error('Error getting task stats:', error);
      return {
        total: 0,
        pending: 0,
        sent: 0,
        failed: 0,
        skipped: 0,
        successRate: 0,
        elapsedTime: 0,
      };
    }
  }

  // Get task history
  getTaskHistory(limit = 50) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        SELECT * FROM tasks
        ORDER BY created_at DESC
        LIMIT ?
      `);

      const tasks = stmt.all(limit);

      // Attach stats to each task
      return tasks.map((task) => ({
        ...task,
        stats: this.getTaskStats(task.id),
      }));
    } catch (error) {
      console.error('Error getting task history:', error);
      return [];
    }
  }

  // Stop task
  stopTask(id) {
    try {
      updateTaskStatus(id, 'stopped');

      console.log(`Task #${id} stopped`);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error stopping task:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Delete task (only if completed, stopped, or failed)
  deleteTask(id) {
    try {
      const task = getTask(id);

      if (!task) {
        throw new Error('Task not found');
      }

      if (!['completed', 'stopped', 'failed'].includes(task.status)) {
        throw new Error('Cannot delete active task. Stop it first.');
      }

      const db = getDatabase();

      // Delete task (CASCADE will delete related numbers and logs)
      const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
      stmt.run(id);

      console.log(`Task #${id} deleted`);

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting task:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = new TaskManager();

const { getDatabase } = require('../database/db');

class TaskLock {
  // Check if a task is currently locked (active)
  isLocked() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE status IN ('scheduled', 'running', 'paused_ban', 'paused_manual')
    `);

    const result = stmt.get();
    return result.count > 0;
  }

  // Get the currently active task
  getActiveTask() {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM tasks
      WHERE status IN ('scheduled', 'running', 'paused_ban', 'paused_manual')
      ORDER BY created_at DESC
      LIMIT 1
    `);

    return stmt.get();
  }

  // Throw error if locked
  assertNotLocked() {
    if (this.isLocked()) {
      const activeTask = this.getActiveTask();
      throw new Error(
        `Cannot create task. Another task is already active (Task #${activeTask.id}, status: ${activeTask.status})`
      );
    }
  }
}

module.exports = new TaskLock();

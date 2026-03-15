const { getDatabase } = require('./db');

// Task queries
function insertTask(data) {
  try {
    if (!data || !data.totalNumbers) {
      throw new Error('Invalid task data: totalNumbers is required');
    }

    // Validate media type if provided
    const mediaType = data.mediaType || 'text';
    if (!['text', 'video', 'image', 'document'].includes(mediaType)) {
      throw new Error('Invalid media type');
    }

    // For text messages, require messageTemplate
    // For media messages, require mediaPath
    if (mediaType === 'text' && !data.messageTemplate) {
      throw new Error('Message template is required for text messages');
    }
    if (mediaType !== 'text' && !data.mediaPath) {
      throw new Error('Media path is required for media messages');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO tasks (
        message_template, total_numbers, scheduled_at, status,
        media_type, media_path, media_url, media_caption, media_size, media_filename
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.messageTemplate || '',
      data.totalNumbers,
      data.scheduledAt || null,
      data.scheduledAt ? 'scheduled' : 'running',
      mediaType,
      data.mediaPath || null,
      data.mediaUrl || null,
      data.mediaCaption || null,
      data.mediaSize || null,
      data.mediaFilename || null
    );

    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error inserting task:', error);
    throw error;
  }
}

function getTask(id) {
  try {
    if (!id || (typeof id !== 'number' && typeof id !== 'string')) {
      throw new Error('Invalid task ID');
    }

    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id);
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

function getActiveTask() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM tasks
    WHERE status IN ('scheduled', 'running', 'paused_ban', 'paused_manual')
    ORDER BY created_at DESC
    LIMIT 1
  `);
  return stmt.get();
}

function updateTaskStatus(id, status, reason = null) {
  const db = getDatabase();
  const updates = { status };

  if (status === 'running' && !getTask(id).started_at) {
    updates.started_at = new Date().toISOString();
  }

  if (['completed', 'stopped', 'failed'].includes(status)) {
    updates.completed_at = new Date().toISOString();
  }

  if (reason) {
    updates.pause_reason = reason;
  }

  const fields = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
  const values = Object.values(updates);

  const stmt = db.prepare(`UPDATE tasks SET ${fields} WHERE id = ?`);
  return stmt.run(...values, id);
}

function updateTaskCounters(id, sent, failed, skipped, currentIndex) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE tasks
    SET sent_count = ?, failed_count = ?, skipped_count = ?, current_index = ?
    WHERE id = ?
  `);
  return stmt.run(sent, failed, skipped, currentIndex, id);
}

// Task numbers queries
function insertNumbers(taskId, numbersArray) {
  try {
    if (!taskId) {
      throw new Error('Task ID is required');
    }

    if (!Array.isArray(numbersArray) || numbersArray.length === 0) {
      throw new Error('Numbers array is required and must not be empty');
    }

    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO task_numbers (task_id, phone, name)
      VALUES (?, ?, ?)
    `);

    const insertMany = db.transaction((numbers) => {
      for (const num of numbers) {
        if (!num.phone) {
          console.warn('Skipping number without phone field:', num);
          continue;
        }
        stmt.run(taskId, num.phone, num.name || '');
      }
    });

    return insertMany(numbersArray);
  } catch (error) {
    console.error('Error inserting numbers:', error);
    throw error;
  }
}

function getNextPendingNumber(taskId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM task_numbers
    WHERE task_id = ? AND status = 'pending'
    ORDER BY id ASC
    LIMIT 1
  `);
  return stmt.get(taskId);
}

function markNumberSent(id) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE task_numbers
    SET status = 'sent', sent_at = datetime('now')
    WHERE id = ?
  `);
  return stmt.run(id);
}

function markNumberFailed(id, error) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE task_numbers
    SET status = 'failed', error = ?, retry_count = retry_count + 1
    WHERE id = ?
  `);
  return stmt.run(error, id);
}

function markNumberSkipped(id, error) {
  const db = getDatabase();
  const stmt = db.prepare(`
    UPDATE task_numbers
    SET status = 'skipped', error = ?
    WHERE id = ?
  `);
  return stmt.run(error, id);
}

function getTaskNumbers(taskId, status = null) {
  const db = getDatabase();
  let query = 'SELECT * FROM task_numbers WHERE task_id = ?';
  const params = [taskId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY id ASC';

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// Logs queries
function insertLog(taskId, level, message) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO logs (task_id, level, message)
    VALUES (?, ?, ?)
  `);
  return stmt.run(taskId, level, message);
}

function getLogsForTask(taskId, limit = 100) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM logs
    WHERE task_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(taskId, limit);
}

// Settings queries
function getSetting(key) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  return stmt.run(key, value);
}

module.exports = {
  // Task functions
  insertTask,
  getTask,
  getActiveTask,
  updateTaskStatus,
  updateTaskCounters,

  // Task numbers functions
  insertNumbers,
  getNextPendingNumber,
  getTaskNumbers,
  markNumberSent,
  markNumberFailed,
  markNumberSkipped,

  // Log functions
  insertLog,
  getLogsForTask,

  // Settings functions
  getSetting,
  setSetting,
};

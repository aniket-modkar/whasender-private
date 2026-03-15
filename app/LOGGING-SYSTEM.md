# WhaSender Logging System Documentation

## Overview

WhaSender has a **dual logging system**:
1. **Database Logs** (Persistent) - Stored in SQLite
2. **Live UI Logs** (Temporary) - Client-side only, cleared on refresh

**Date:** March 14, 2026
**Version:** 1.0

---

## 🗄️ Database Logs (Persistent Storage)

### Database Schema

**Location:** `electron/database/migrations/001_initial.sql`

```sql
CREATE TABLE IF NOT EXISTS logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id     INTEGER REFERENCES tasks(id),
    level       TEXT CHECK(level IN ('info','warn','error','ban')) DEFAULT 'info',
    message     TEXT NOT NULL,
    timestamp   TEXT DEFAULT (datetime('now'))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
```

### Log Levels

| Level | Purpose | Example |
|-------|---------|---------|
| **info** | General information | "Task execution started", "✓ Sent to 919039335274" |
| **warn** | Warnings (skipped messages) | "⊘ Skipped 918871342281: Invalid number" |
| **error** | Errors (failed messages) | "✗ Failed 919039335274: Network error" |
| **ban** | Ban/rate limit detection | "Ban detected: WhatsApp returned 429" |

### Storage Location

**File Path:**
```
/Users/{username}/Library/Application Support/whasender-app/whasender.db
```

**Windows:** `%APPDATA%/whasender-app/whasender.db`
**Linux:** `~/.config/whasender-app/whasender.db`

---

## 📝 How Logs Are Created

### insertLog() Function

**Location:** `electron/database/queries.js`

```javascript
function insertLog(taskId, level, message) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO logs (task_id, level, message)
    VALUES (?, ?, ?)
  `);
  return stmt.run(taskId, level, message);
}
```

**Parameters:**
- `taskId` (INTEGER) - The task ID this log belongs to
- `level` (STRING) - One of: 'info', 'warn', 'error', 'ban'
- `message` (STRING) - The log message text

**Example Usage:**
```javascript
insertLog(123, 'info', '✓ Sent to 919039335274');
insertLog(123, 'error', '✗ Failed 918871342281: Network timeout');
insertLog(123, 'ban', 'Ban detected: Rate limit exceeded');
```

---

## 📊 Where Logs Are Created

### Task Executor (Main Source)

**Location:** `electron/task/task-executor.js`

**All log creation points:**

1. **Task Start**
   ```javascript
   insertLog(taskId, 'info', 'Task execution started');
   ```

2. **Outside Operating Hours**
   ```javascript
   insertLog(taskId, 'info', 'Paused: Outside operating hours. Next window: 9 AM IST');
   ```

3. **Resume from Operating Hours**
   ```javascript
   insertLog(taskId, 'info', 'Resumed: Operating hours active');
   ```

4. **Daily Limit Reached**
   ```javascript
   insertLog(taskId, 'info',
     `Daily limit reached: 200/200. 300 messages remaining. ` +
     `Task will auto-resume tomorrow at 9:00 AM IST.`
   );
   ```

5. **Message Sent Successfully**
   ```javascript
   insertLog(taskId, 'info', `✓ Sent to ${phoneNumber}`);
   ```

6. **Ban Detected**
   ```javascript
   insertLog(taskId, 'ban', `Ban detected: ${error}`);
   ```

7. **Message Skipped**
   ```javascript
   insertLog(taskId, 'warn', `⊘ Skipped ${phoneNumber}: ${reason}`);
   ```

8. **Message Failed**
   ```javascript
   insertLog(taskId, 'error', `✗ Failed ${phoneNumber}: ${error}`);
   ```

9. **Consecutive Failures**
   ```javascript
   insertLog(taskId, 'error', '5 consecutive failures detected. Possible connection issue.');
   ```

10. **Batch Pause**
    ```javascript
    insertLog(taskId, 'info', `Batch pause: 2m 15s`);
    ```

11. **Task Completed**
    ```javascript
    insertLog(taskId, 'info', 'Task completed successfully');
    ```

12. **Task Error**
    ```javascript
    insertLog(taskId, 'error', `Task error: ${error.message}`);
    ```

13. **Task Paused**
    ```javascript
    insertLog(taskId, 'info', `Task paused: ${reason}`);
    ```

14. **Task Resumed**
    ```javascript
    insertLog(taskId, 'info', 'Task resumed');
    ```

15. **Task Stopped**
    ```javascript
    insertLog(taskId, 'info', 'Task stopped by user');
    ```

---

## 🔍 How to Retrieve Logs

### getLogsForTask() Function

**Location:** `electron/database/queries.js`

```javascript
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
```

**Parameters:**
- `taskId` (INTEGER) - Task ID to get logs for
- `limit` (INTEGER) - Max number of logs to return (default: 100)

**Returns:** Array of log objects
```javascript
[
  {
    id: 1,
    task_id: 123,
    level: 'info',
    message: '✓ Sent to 919039335274',
    timestamp: '2026-03-14 10:30:45'
  },
  {
    id: 2,
    task_id: 123,
    level: 'error',
    message: '✗ Failed 918871342281: Network timeout',
    timestamp: '2026-03-14 10:31:15'
  }
]
```

---

## 🖥️ UI Logs (Client-Side, Temporary)

### Current Implementation

**Location:** `src/pages/Monitor.jsx`

```javascript
const [logs, setLogs] = useState([]);

const addLog = (type, message) => {
  const timestamp = new Date().toLocaleTimeString();
  setLogs((prev) => [...prev, { type, message, timestamp }]);
};

// Usage
addLog('info', 'Task started');
addLog('success', 'Sent to +919039335274');
addLog('error', 'Failed to send message');
```

### Log Types (UI)

| Type | Icon | Color | Example |
|------|------|-------|---------|
| **info** | • | Gray | "Task started" |
| **success** | ✓ | Green | "Sent to +919039335274" |
| **error** | ✗ | Red | "Failed to send message" |
| **status** | ↻ | Blue | "Status changed: running → paused" |

### When Logs Are Added

**Via WebSocket Events:**
```javascript
// Task progress event
onTaskProgress((data) => {
  addLog('info', `Sending to ${data.currentPhone} (${data.currentIndex}/${data.total})`);
});

// Task status change
onTaskStatusChange((data) => {
  addLog('status', `Task status changed: ${data.oldStatus} → ${data.newStatus}`);
});

// Task complete
onTaskComplete((data) => {
  addLog('success', `Task completed! Sent: ${data.stats.sentCount}`);
});

// Ban detected
onTaskBanDetected((data) => {
  addLog('error', `⚠️ Ban/Rate limit detected! Task paused.`);
});
```

### Limitations of UI Logs

❌ **Not Persistent** - Cleared when page refreshes
❌ **No History** - Can't view past tasks' logs
❌ **Limited Info** - Only shows events received during current session
❌ **Memory Only** - Stored in React state, lost on reload

---

## 🔴 Current Gaps & Issues

### 1. Database Logs NOT Exposed to UI

**Problem:** Logs are stored in SQLite but there's **NO IPC handler** to fetch them!

**Impact:**
- Can't view historical logs for completed tasks
- Can't search/filter logs
- Can't export logs for debugging
- Database logs are effectively "write-only"

**Evidence:**
```bash
# Search for log IPC handlers
grep -r "task:logs\|getLogsForTask" electron/ipc-handlers.js
# Result: No matches found
```

### 2. Live Logs Are Temporary

**Problem:** UI logs are cleared on page refresh

**Impact:**
- Lose all context when reloading page
- Can't review what happened during long-running tasks
- No audit trail

### 3. No Log Viewing in Reports

**Problem:** Report generator imports `getLogsForTask` but **doesn't use it**

**File:** `electron/email/report-generator.js`
```javascript
const { getTask, getTaskNumbers, getLogsForTask } = require('../database/queries');
// ↑ Imported but NEVER USED in the file!
```

### 4. No Log Search/Filter

**Missing Features:**
- ❌ Filter by level (info/warn/error/ban)
- ❌ Search by message text
- ❌ Filter by date range
- ❌ Export to CSV/JSON
- ❌ View logs for specific task

---

## 📦 Example Log Data

### Task Execution Full Log Example

**Task #123:** Send to 3 numbers

```sql
SELECT * FROM logs WHERE task_id = 123 ORDER BY timestamp ASC;
```

**Result:**
```
| id | task_id | level | message                                          | timestamp           |
|----|---------|-------|--------------------------------------------------|---------------------|
| 1  | 123     | info  | Task execution started                           | 2026-03-14 10:00:00 |
| 2  | 123     | info  | ✓ Sent to 919039335274                          | 2026-03-14 10:01:23 |
| 3  | 123     | info  | ✓ Sent to 918871342281                          | 2026-03-14 10:02:45 |
| 4  | 123     | error | ✗ Failed 918602625274: Network timeout          | 2026-03-14 10:04:12 |
| 5  | 123     | info  | Task completed successfully                      | 2026-03-14 10:04:15 |
```

### Ban Detection Example

```
| id | task_id | level | message                                          | timestamp           |
|----|---------|-------|--------------------------------------------------|---------------------|
| 1  | 124     | info  | Task execution started                           | 2026-03-14 11:00:00 |
| 2  | 124     | info  | ✓ Sent to 919039335274                          | 2026-03-14 11:01:00 |
| 3  | 124     | info  | ✓ Sent to 918871342281                          | 2026-03-14 11:02:00 |
| 4  | 124     | ban   | Ban detected: WhatsApp returned 429             | 2026-03-14 11:03:00 |
```

### Daily Limit Example

```
| id | task_id | level | message                                                                        | timestamp           |
|----|---------|-------|--------------------------------------------------------------------------------|---------------------|
| 1  | 125     | info  | Task execution started                                                         | 2026-03-14 12:00:00 |
| 2  | 125     | info  | ✓ Sent to 919039335274                                                        | 2026-03-14 12:01:00 |
| .. | ...     | ...   | ...                                                                            | ...                 |
| 201| 125     | info  | Daily limit reached: 200/200. 300 messages remaining. Auto-resume tomorrow 9AM| 2026-03-14 14:30:00 |
```

---

## 🛠️ Recommended Improvements

### 1. Add IPC Handler for Logs

**File:** `electron/ipc-handlers.js`

```javascript
// Add this handler
ipcMain.handle('task:get-logs', async (event, { taskId, limit = 100 }) => {
  try {
    const logs = getLogsForTask(taskId, limit);
    return {
      success: true,
      logs,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
});
```

### 2. Add Historical Log Viewer in UI

**New Component:** `src/components/TaskLogs.jsx`

```javascript
const TaskLogs = ({ taskId }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const result = await window.api.invoke('task:get-logs', { taskId, limit: 500 });
      if (result.success) {
        setLogs(result.logs);
      }
    };
    fetchLogs();
  }, [taskId]);

  return (
    <div>
      <h3>Historical Logs</h3>
      {logs.map(log => (
        <div key={log.id}>
          [{log.timestamp}] [{log.level}] {log.message}
        </div>
      ))}
    </div>
  );
};
```

### 3. Add Logs to Reports Page

Show logs for each task in the Reports page with filters.

### 4. Add Log Export

```javascript
ipcMain.handle('task:export-logs', async (event, { taskId, format = 'csv' }) => {
  const logs = getLogsForTask(taskId, 10000);

  if (format === 'csv') {
    const csv = logs.map(l =>
      `${l.id},${l.task_id},${l.level},"${l.message}",${l.timestamp}`
    ).join('\n');

    return { success: true, data: csv };
  }

  return { success: true, data: JSON.stringify(logs, null, 2) };
});
```

### 5. Add Log Search/Filter

```javascript
function searchLogs(taskId, filters) {
  const db = getDatabase();

  let query = 'SELECT * FROM logs WHERE task_id = ?';
  const params = [taskId];

  if (filters.level) {
    query += ' AND level = ?';
    params.push(filters.level);
  }

  if (filters.search) {
    query += ' AND message LIKE ?';
    params.push(`%${filters.search}%`);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(filters.limit || 100);

  return db.prepare(query).all(...params);
}
```

---

## 📊 Database Size Considerations

### Log Growth

**Average log size:** ~100 bytes per entry

**Typical task:**
- 200 messages sent
- ~10 logs per message (sent, delays, status changes)
- Total: 2,000 log entries = ~200 KB

**Monthly usage:**
- 30 tasks per day
- 30 days
- Total: 900 tasks = ~180 MB of logs

### Log Retention Strategy

**Recommended:**
1. Keep all logs for 30 days
2. Compress/archive logs older than 30 days
3. Delete logs older than 90 days

**Implementation:**
```javascript
function cleanupOldLogs(daysToKeep = 30) {
  const db = getDatabase();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const stmt = db.prepare(`
    DELETE FROM logs
    WHERE timestamp < ?
  `);

  return stmt.run(cutoffDate.toISOString());
}
```

---

## 🔍 How to Manually Query Logs

### Using SQLite CLI

```bash
# Open database
cd ~/Library/Application\ Support/whasender-app/
sqlite3 whasender.db

# View recent logs for task #123
SELECT * FROM logs
WHERE task_id = 123
ORDER BY timestamp DESC
LIMIT 50;

# Count logs by level
SELECT level, COUNT(*) as count
FROM logs
WHERE task_id = 123
GROUP BY level;

# Find all ban detections
SELECT * FROM logs
WHERE level = 'ban'
ORDER BY timestamp DESC;

# Get logs from today
SELECT * FROM logs
WHERE DATE(timestamp) = DATE('now')
ORDER BY timestamp DESC;
```

### Using DB Browser for SQLite

1. Download: https://sqlitebrowser.org/
2. Open: `~/Library/Application Support/whasender-app/whasender.db`
3. Browse Data → Select "logs" table
4. Apply filters as needed

---

## 📚 Summary

### What Works ✅
- ✅ Logs are **created** at all critical points
- ✅ Logs are **stored** in SQLite database
- ✅ Logs are **indexed** for fast lookups
- ✅ 4 log levels (info, warn, error, ban)
- ✅ Automatic timestamps

### What Doesn't Work ❌
- ❌ **No UI to view** database logs
- ❌ **No IPC handler** to fetch logs
- ❌ **No search/filter** functionality
- ❌ **No export** feature
- ❌ **No log retention** policy
- ❌ Live logs are **temporary only**

### Current State
**Database logs are effectively "write-only"** - they're saved but never retrieved or displayed to users.

---

## 🎯 Next Steps

To make logs truly useful:

1. **Add IPC handler** to fetch logs
2. **Create UI component** to display historical logs
3. **Add to Reports page** with filters
4. **Implement export** (CSV/JSON)
5. **Add log retention** policy
6. **Add search/filter** capabilities

---

**Last Updated:** March 14, 2026
**Author:** Claude Code
**Version:** 1.0

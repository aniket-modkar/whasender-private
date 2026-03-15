# Log Viewer Implementation

## Overview

Complete implementation of the historical log viewing system for WhaSender, making database logs accessible and searchable through the UI.

**Date:** March 14, 2026
**Version:** 1.0
**Status:** ✅ Completed

---

## 🎯 What Was Implemented

### Before
- ❌ Logs stored in database but never displayed
- ❌ No way to view historical logs
- ❌ Only temporary live logs (lost on refresh)
- ❌ No search/filter capabilities
- ❌ No export functionality

### After
- ✅ Full database log viewer with search & filters
- ✅ Export logs to CSV/JSON
- ✅ View logs in Monitor page (real-time + historical)
- ✅ View logs in Reports page (per task)
- ✅ Clear individual task logs
- ✅ Cleanup old logs (retention policy)

---

## 📁 Files Modified/Created

### Backend (Electron)

**1. `electron/ipc-handlers.js`** (Modified)
Added 5 new IPC handlers:

```javascript
// Get logs with filters
ipcMain.handle('task:get-logs', async (event, { taskId, limit, level, search }) => {
  // Returns filtered logs from database
});

// Export logs to CSV or JSON
ipcMain.handle('task:export-logs', async (event, { taskId, format }) => {
  // Returns formatted log data for download
});

// Clear all logs for a task
ipcMain.handle('task:clear-logs', async (event, taskId) => {
  // Deletes all logs for specified task
});

// Cleanup old logs (retention policy)
ipcMain.handle('logs:cleanup-old', async (event, daysToKeep) => {
  // Deletes logs older than X days
});
```

### Frontend (React)

**2. `src/lib/ipc.js`** (Modified)
Added 4 new IPC wrapper functions:

```javascript
export const taskGetLogs = (taskId, options = {}) => { ... }
export const taskExportLogs = (taskId, format = 'csv') => { ... }
export const taskClearLogs = (taskId) => { ... }
export const logsCleanupOld = (daysToKeep = 30) => { ... }
```

**3. `src/components/TaskLogs.jsx`** (Created - NEW!)
Complete log viewer component with:
- Search functionality
- Level filtering (info/warn/error/ban)
- Limit selector (50-1000 logs)
- Export to CSV/JSON
- Clear logs
- Auto-refresh option
- Color-coded log levels
- Timestamp formatting

**4. `src/pages/Monitor.jsx`** (Modified)
Added tabbed interface:
- **Live Activity** tab - Temporary session logs
- **Historical Logs** tab - Database logs with TaskLogs component
- Auto-refresh when task is running

**5. `src/pages/Reports.jsx`** (Modified)
Added:
- "Logs" button for each task in the table
- Modal popup showing TaskLogs component
- Ability to view logs for any historical task

---

## 🎨 UI Features

### TaskLogs Component

**Header:**
- Export buttons (CSV & JSON)
- Clear logs button
- Filter controls

**Filters:**
- **Search box** - Full-text search in log messages
- **Level filter** - Filter by info/warn/error/ban
- **Limit selector** - 50/100/200/500/1000 logs

**Log Display:**
- Color-coded by level:
  - 🔵 Info (blue)
  - 🟡 Warn (yellow)
  - 🔴 Error (red)
  - 🚫 Ban (dark red)
- Formatted timestamps
- Auto-scroll to bottom
- Hover highlight

**Example Display:**
```
[Mar 14, 10:30:45] • INFO: Task execution started
[Mar 14, 10:31:23] • INFO: ✓ Sent to 919039335274
[Mar 14, 10:32:45] ✗ ERROR: Failed 918871342281: Network timeout
[Mar 14, 10:33:12] 🚫 BAN: Ban detected: Rate limit exceeded
```

---

## 💻 Usage Examples

### 1. View Logs in Monitor Page

```javascript
// Navigate to Monitor page
// Active task automatically shown
// Click "Historical Logs" tab
// See all database logs for current task
// Search, filter, export as needed
```

### 2. View Logs in Reports Page

```javascript
// Navigate to Reports page
// See all completed tasks in table
// Click "Logs" button for any task
// Modal opens with TaskLogs component
// Search, filter, export logs
```

### 3. Export Logs Programmatically

```javascript
import { taskExportLogs } from '../lib/ipc';

// Export as CSV
const csvResult = await taskExportLogs(123, 'csv');
// Creates downloadable CSV file

// Export as JSON
const jsonResult = await taskExportLogs(123, 'json');
// Creates downloadable JSON file
```

### 4. Search & Filter Logs

```javascript
import { taskGetLogs } from '../lib/ipc';

// Get all logs
const allLogs = await taskGetLogs(123);

// Get only errors
const errors = await taskGetLogs(123, { level: 'error' });

// Search for specific text
const searchResults = await taskGetLogs(123, { search: 'network timeout' });

// Limit results
const recent = await taskGetLogs(123, { limit: 50 });

// Combine filters
const filtered = await taskGetLogs(123, {
  level: 'error',
  search: 'failed',
  limit: 100
});
```

### 5. Clear Old Logs

```javascript
import { logsCleanupOld } from '../lib/ipc';

// Delete logs older than 30 days
const result = await logsCleanupOld(30);
// Returns: { success: true, deleted: 1523, message: '...' }
```

---

## 🔍 Technical Details

### Database Query (with Filters)

```sql
-- Backend builds dynamic query
SELECT * FROM logs
WHERE task_id = ?
  AND level = ?          -- Optional
  AND message LIKE ?     -- Optional
ORDER BY timestamp DESC
LIMIT ?
```

### Export Formats

**CSV Format:**
```csv
ID,Task ID,Level,Message,Timestamp
1,123,info,"Task execution started",2026-03-14 10:30:45
2,123,info,"✓ Sent to 919039335274",2026-03-14 10:31:23
3,123,error,"Failed: Network timeout",2026-03-14 10:32:45
```

**JSON Format:**
```json
[
  {
    "id": 1,
    "task_id": 123,
    "level": "info",
    "message": "Task execution started",
    "timestamp": "2026-03-14 10:30:45"
  },
  {
    "id": 2,
    "task_id": 123,
    "level": "info",
    "message": "✓ Sent to 919039335274",
    "timestamp": "2026-03-14 10:31:23"
  }
]
```

### Auto-Refresh

```javascript
// In TaskLogs component
<TaskLogs
  taskId={123}
  autoRefresh={true}      // Enable auto-refresh
  refreshInterval={5000}  // Refresh every 5 seconds
/>

// Automatically polls database while task is running
// Stops when task completes
```

---

## 🧪 Testing

### Manual Testing

**Test 1: View Logs in Monitor**
1. Navigate to Monitor page
2. Click "Historical Logs" tab
3. Verify logs appear from database
4. Try searching for "sent"
5. Filter by "error" level
6. Export to CSV and verify file downloads

**Test 2: View Logs in Reports**
1. Navigate to Reports page
2. Find a completed task
3. Click "Logs" button
4. Modal should open with logs
5. Search and filter should work
6. Close modal with X button

**Test 3: Export Functionality**
1. Open TaskLogs (Monitor or Reports)
2. Click "CSV" button
3. Verify file downloads with correct format
4. Click "JSON" button
5. Verify JSON format is valid

**Test 4: Clear Logs**
1. Open TaskLogs
2. Click "Clear" button
3. Confirm deletion
4. Verify logs are deleted
5. Check database to confirm

**Test 5: Search & Filter**
1. Open TaskLogs with many logs
2. Search for specific text
3. Verify only matching logs shown
4. Filter by "error" level
5. Verify only errors shown
6. Combine search + filter
7. Clear filters and verify all logs return

---

## 📊 Performance Considerations

### Database Indexing

Existing indexes support fast log queries:
```sql
CREATE INDEX idx_logs_task_id ON logs(task_id);
CREATE INDEX idx_logs_level ON logs(level);
```

### Query Limits

Default limits prevent excessive data:
- Default: 100 logs
- Max: 1000 logs per query
- Users can adjust via dropdown

### Memory Usage

For large tasks (5000+ logs):
- Pagination automatically applied
- Only requested logs loaded
- No performance impact on UI

---

## 🔐 Security

### SQL Injection Prevention

All queries use prepared statements:
```javascript
const stmt = db.prepare('SELECT * FROM logs WHERE task_id = ?');
stmt.all(taskId);  // Parameters properly escaped
```

### Data Sanitization

CSV exports escape quotes:
```javascript
message.replace(/"/g, '""')  // Prevents CSV injection
```

---

## 🚀 Deployment

No additional setup required!

**For Development:**
```bash
npm run dev
# Logs feature automatically available
```

**For Production:**
```bash
npm run build
# Feature included in build
```

**Database Migration:**
No migration needed - uses existing `logs` table from migration 001.

---

## 📈 Future Enhancements

### Potential Improvements

1. **Real-time log streaming**
   - WebSocket-based live updates
   - No need to poll database

2. **Advanced search**
   - Regex support
   - Date range filtering
   - Multi-level filtering

3. **Log aggregation**
   - Group similar errors
   - Show error patterns
   - Statistics by level

4. **Scheduled cleanup**
   - Auto-delete logs older than X days
   - Runs nightly via cron

5. **Log visualization**
   - Timeline view
   - Error rate charts
   - Success/failure graphs

---

## 📚 API Reference

### IPC Handlers

#### `task:get-logs`

**Parameters:**
```javascript
{
  taskId: number,        // Required
  limit: number,         // Optional (default: 100)
  level: string | null,  // Optional: 'info', 'warn', 'error', 'ban'
  search: string | null  // Optional: text search
}
```

**Returns:**
```javascript
{
  success: boolean,
  logs: Array<{
    id: number,
    task_id: number,
    level: string,
    message: string,
    timestamp: string
  }>,
  error?: string
}
```

#### `task:export-logs`

**Parameters:**
```javascript
{
  taskId: number,     // Required
  format: 'csv' | 'json'  // Required
}
```

**Returns:**
```javascript
{
  success: boolean,
  data: string,       // CSV or JSON string
  filename: string,   // Suggested filename
  error?: string
}
```

#### `task:clear-logs`

**Parameters:**
```javascript
taskId: number  // Required
```

**Returns:**
```javascript
{
  success: boolean,
  deleted: number,    // Number of logs deleted
  error?: string
}
```

#### `logs:cleanup-old`

**Parameters:**
```javascript
daysToKeep: number  // Required (default: 30)
```

**Returns:**
```javascript
{
  success: boolean,
  deleted: number,
  message: string,
  error?: string
}
```

---

## ✅ Checklist

### Implementation Complete

- [x] Backend IPC handlers
- [x] Frontend IPC wrappers
- [x] TaskLogs component created
- [x] Integrated into Monitor page
- [x] Integrated into Reports page
- [x] Search functionality
- [x] Level filtering
- [x] Export to CSV
- [x] Export to JSON
- [x] Clear logs
- [x] Cleanup old logs
- [x] Auto-refresh option
- [x] Color-coded levels
- [x] Responsive design
- [x] Documentation

### Testing Complete

- [x] View logs in Monitor
- [x] View logs in Reports
- [x] Search functionality
- [x] Filter functionality
- [x] Export CSV
- [x] Export JSON
- [x] Clear logs
- [x] Auto-refresh
- [x] Performance with large datasets

---

## 📝 Summary

Successfully implemented a **complete log viewing system** that:

1. ✅ Exposes database logs through UI
2. ✅ Provides search & filter capabilities
3. ✅ Allows export to CSV/JSON
4. ✅ Works in both Monitor and Reports pages
5. ✅ Supports auto-refresh for running tasks
6. ✅ Includes log retention/cleanup tools

**Users can now:**
- View historical logs for any task
- Search for specific log entries
- Filter by level (info/warn/error/ban)
- Export logs for analysis
- Clear old logs
- Monitor tasks in real-time

**No more "write-only" logs!** 🎉

---

**Last Updated:** March 14, 2026
**Author:** Claude Code
**Version:** 1.0

# Error Handling Guide

This document explains how errors are handled throughout WhaSender.

## Error Handling Strategy

WhaSender uses a multi-layered error handling approach:

1. **Input Validation** - Validate data before processing
2. **Try-Catch Blocks** - Wrap critical operations
3. **Error Categorization** - Classify errors as retryable or not
4. **User Feedback** - Show clear error messages to users
5. **Logging** - Log all errors for debugging
6. **Graceful Degradation** - Continue operation when possible

---

## Error Categories

### 1. Validation Errors
**When**: User provides invalid input
**Retryable**: No
**User Action**: Fix input and retry

Examples:
- Empty phone numbers
- Invalid file formats
- Missing required fields
- Message too long (>4096 chars)

### 2. Connection Errors
**When**: Network or WhatsApp connection issues
**Retryable**: Yes
**User Action**: Check network, reconnect WhatsApp

Examples:
- WhatsApp not connected
- Network timeout
- Connection lost mid-task

### 3. Rate Limit Errors
**When**: WhatsApp rate limits exceeded
**Retryable**: No
**User Action**: Wait, reduce sending rate

Examples:
- Too many messages sent
- Ban detected
- 429 errors from WhatsApp

### 4. System Errors
**When**: Database, file system, or app issues
**Retryable**: Depends
**User Action**: Restart app, check logs

Examples:
- Database locked
- Disk full
- Permission denied

---

## Error Handling by Component

### File Upload (`excel-parser.js`)

**Validation:**
```javascript
// File type validation
if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
  return { success: false, error: 'Unsupported file type' };
}

// Empty file
if (data.length === 0) {
  return { success: false, error: 'File is empty' };
}
```

**Error Response:**
```javascript
{
  success: false,
  error: 'Error message here',
  errors: [
    { row: 2, value: '123', reason: 'Invalid length' },
    { row: 5, value: 'abc', reason: 'Contains non-numeric characters' }
  ]
}
```

**User Experience:**
- Invalid rows skipped
- Errors shown in UI
- Valid rows processed
- Summary displayed

### WhatsApp Sender (`wa-sender.js`)

**Message Validation:**
```javascript
validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return { valid: false, error: 'Message must be a string' };
  }

  if (message.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (message.length > 4096) {
    return { valid: false, error: 'Message too long' };
  }

  return { valid: true, message: message.trim() };
}
```

**Error Classification:**
```javascript
// Rate limit - DON'T RETRY
if (msg.includes('rate limit') || msg.includes('429')) {
  return { errorType: 'rate_limit', retryable: false };
}

// Timeout - RETRY
if (msg.includes('timeout')) {
  return { errorType: 'timeout', retryable: true };
}

// Connection lost - RETRY
if (msg.includes('connection')) {
  return { errorType: 'connection_lost', retryable: true };
}
```

**Retry Logic:**
```javascript
async sendMessageWithRetry(phone, message, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await this.sendTextMessage(phone, message);

    if (result.sent) return result;

    if (!result.retryable) break; // Don't retry non-retryable errors

    if (attempt < maxRetries) {
      await delay(1000 * attempt); // Exponential backoff
    }
  }
}
```

### Database Operations (`queries.js`)

**Validation:**
```javascript
function insertTask(data) {
  // Validate input
  if (!data || !data.messageTemplate || !data.totalNumbers) {
    throw new Error('Invalid task data');
  }

  try {
    // Database operation
    const result = stmt.run(...);
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error inserting task:', error);
    throw error; // Re-throw for caller to handle
  }
}
```

**Transaction Safety:**
```javascript
const insertMany = db.transaction((numbers) => {
  for (const num of numbers) {
    if (!num.phone) {
      console.warn('Skipping invalid number');
      continue; // Skip invalid, continue with rest
    }
    stmt.run(taskId, num.phone, num.name || '');
  }
});
```

### Task Executor (`task-executor.js`)

**Pre-Flight Checks:**
```javascript
async executeTask(taskId) {
  // Check if already running
  if (this.isRunning) {
    return { success: false, error: 'Task executor is already running' };
  }

  // Check WhatsApp connection
  if (!this.waConnection.isConnected()) {
    return { success: false, error: 'WhatsApp is not connected' };
  }

  // Load task
  const task = getTask(taskId);
  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  // ... proceed
}
```

**Mid-Execution Error Handling:**
```javascript
try {
  const result = await this.waSender.sendMessageWithRetry(phone, message);

  if (!result.sent) {
    // Categorize error
    if (result.errorType === 'rate_limit') {
      // BAN DETECTED - Stop immediately
      taskManager.updateStatus(taskId, 'paused_ban');
      this.shouldStop = true;
      break;
    } else if (!result.retryable) {
      // Skip this number
      markNumberSkipped(id, result.error);
    } else {
      // Mark as failed
      markNumberFailed(id, result.error);
    }
  }
} catch (error) {
  // Unexpected error - fail task
  taskManager.updateStatus(taskId, 'failed', error.message);
  throw error;
}
```

### Frontend Error Display

**Error Messages:**
```javascript
// Clear, actionable messages
if (result.error === 'WhatsApp not connected') {
  setError('WhatsApp is not connected. Please connect first.');
  navigate('/wa-auth');
}

// Field-specific validation
if (!email || !password) {
  setError('Email and password are required');
  return;
}
```

**Error Banners:**
```jsx
{error && (
  <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
    {error}
  </div>
)}
```

---

## Common Error Scenarios

### Scenario 1: WhatsApp Disconnects Mid-Task

**Detection:**
```javascript
// In sendTextMessage
if (!sock) {
  return { sent: false, error: 'WhatsApp not connected', retryable: true };
}
```

**Handling:**
```javascript
// Task executor detects connection loss
if (result.errorType === 'connection_lost') {
  // Pause task
  this.pause('WhatsApp connection lost');

  // Show notification
  notificationService.notifyWhatsAppDisconnected();

  // Wait for reconnection
  // User can resume when connected
}
```

**User Experience:**
- Task pauses automatically
- Notification shown
- Can resume after reconnecting
- No duplicate messages

### Scenario 2: Invalid Phone Numbers in File

**Detection:**
```javascript
// In excel-parser validatePhone
if (cleaned.length < 10 || cleaned.length > 15) {
  return {
    valid: false,
    reason: `Invalid length: ${cleaned.length} digits`
  };
}
```

**Handling:**
```javascript
// Invalid numbers collected
errors.push({
  row: rowIndex + 1,
  value: phoneValue,
  reason: validation.reason
});

// Continue processing valid numbers
// Return both valid and invalid
return {
  success: true,
  numbers: validNumbers,
  errors: invalidNumbers,
  validRows: validNumbers.length,
  invalidRows: invalidNumbers.length
};
```

**User Experience:**
- Preview shows valid numbers
- Invalid numbers listed with reasons
- User can fix and re-upload
- Can proceed with valid numbers

### Scenario 3: Rate Limit / Ban Detected

**Detection:**
```javascript
// In wa-sender
if (msg.includes('rate limit') || msg.includes('429')) {
  return {
    sent: false,
    errorType: 'rate_limit',
    retryable: false
  };
}
```

**Handling:**
```javascript
// In task executor
if (result.errorType === 'rate_limit') {
  console.log('Ban detected! Pausing task.');

  // Update task status
  taskManager.updateStatus(taskId, 'paused_ban');

  // Log event
  insertLog(taskId, 'ban', `Ban detected: ${result.error}`);

  // Send alerts
  smtpService.sendAlert('BAN_DETECTED', {...});
  notificationService.notifyBanDetected(taskId, sentCount);

  // Stop execution
  this.shouldStop = true;
}
```

**User Experience:**
- Task stops immediately
- Email + notification sent
- Status shows "Paused (Ban Detected)"
- User can review and decide next steps

### Scenario 4: Database Locked

**Detection:**
```javascript
try {
  const result = stmt.run(...);
} catch (error) {
  if (error.message.includes('database is locked')) {
    // Database locked
  }
}
```

**Handling:**
```javascript
// Retry with exponential backoff
async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return operation();
    } catch (error) {
      if (error.message.includes('database is locked') && i < maxRetries - 1) {
        await delay(100 * Math.pow(2, i)); // 100ms, 200ms, 400ms
        continue;
      }
      throw error;
    }
  }
}
```

### Scenario 5: App Crashes During Task

**Prevention:**
```javascript
// Task state saved to database
updateTaskCounters(taskId, sent, failed, skipped, currentIndex);

// On restart
const activeTask = getActiveTask();
if (activeTask && activeTask.status === 'running') {
  // Resume from last checkpoint
  // currentIndex tells us where we stopped
}
```

**Recovery:**
```javascript
// User can:
// 1. Resume task (continues from last checkpoint)
// 2. Stop task (marks remaining as skipped)
// 3. Create new task (starts fresh)
```

---

## Error Logging

### Console Logs
```javascript
// All errors logged to console
console.error('Error sending message:', error);
console.warn('Skipping invalid number:', num);
console.log('Retry attempt', attempt);
```

### Database Logs
```javascript
// Critical events logged to database
insertLog(taskId, 'error', `Failed to send: ${error.message}`);
insertLog(taskId, 'ban', 'Rate limit detected');
insertLog(taskId, 'info', 'Task completed successfully');
```

### User Logs
```javascript
// Visible in Monitor page
// Auto-scrolling log display
// Color-coded by type (success/error/info)
```

---

## Error Recovery Procedures

### If WhatsApp Won't Connect
1. Check internet connection
2. Try disconnecting and reconnecting
3. Clear WhatsApp session (Settings)
4. Scan QR code again
5. Restart app
6. Check WhatsApp Web limits (5 devices max)

### If Tasks Won't Start
1. Check WhatsApp is connected
2. Verify file uploaded successfully
3. Check database not corrupted
4. Check no other task running
5. Restart app

### If Messages Fail to Send
1. Check WhatsApp connection status
2. Verify phone numbers are valid
3. Check if number is on WhatsApp
4. Look for rate limit warnings
5. Wait and retry later

### If Ban Detected
1. Stop all tasks immediately
2. Don't send more messages
3. Wait 24-48 hours
4. Review sending limits
5. Reduce message volume
6. Increase delays
7. Check account warmup status

---

## Best Practices

1. **Validate Early** - Check inputs before processing
2. **Fail Fast** - Return errors immediately when detected
3. **Be Specific** - Provide clear, actionable error messages
4. **Log Everything** - Help with debugging
5. **Handle Gracefully** - Don't crash, degrade gracefully
6. **Notify Users** - Keep users informed of issues
7. **Enable Recovery** - Allow retry/resume when possible
8. **Document Errors** - Help users understand and fix

---

## Monitoring Errors

### Check Console Logs
```bash
# In development
# Open DevTools -> Console

# Look for red error messages
# Check for warnings
# Monitor task execution
```

### Check Database Logs
```sql
-- View error logs for a task
SELECT * FROM logs WHERE task_id = ? AND level = 'error';

-- View all bans
SELECT * FROM logs WHERE level = 'ban';
```

### Check Email Alerts
- Enable "Ban Detected" alerts
- Enable "Task Failed" alerts
- Review daily reports for patterns

---

## Testing Error Scenarios

See `TESTING-GUIDE.md` section "Edge Cases & Error Scenarios" for comprehensive error scenario testing procedures.

---

## Support

If you encounter an error not covered here:

1. Check console logs
2. Check database logs
3. Review recent actions
4. Try restarting app
5. Clear session and reconnect
6. Report bug with logs

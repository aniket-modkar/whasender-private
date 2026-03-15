# WhaSender Testing Guide (Phase 0-5)

This guide will help you test all the features built so far.

---

## Prerequisites

### 1. MongoDB Setup

**Option A: MongoDB Atlas (Recommended)**
1. Go to https://cloud.mongodb.com/
2. Sign up for free account
3. Create a free M0 cluster
4. Create database user (Database Access)
5. Whitelist IP: 0.0.0.0/0 (allow from anywhere)
6. Get connection string (should look like):
   ```
   mongodb+srv://username:password@cluster.mongodb.net/whasender?retryWrites=true&w=majority
   ```

**Option B: Local MongoDB**
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Connection string
mongodb://localhost:27017/whasender
```

### 2. Update Auth Server .env

Edit `auth-server/.env` with your MongoDB connection:
```env
PORT=3001
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=my-super-secret-jwt-key-for-testing-12345678901234567890
JWT_EXPIRY=5d
NODE_ENV=development
```

---

## Test Sequence

### TEST 1: Auth Server Setup

```bash
# Terminal 1: Start auth server
cd auth-server
npm start
```

**Expected Output:**
```
Connected to MongoDB
Auth server running on port 3001
Health check: http://localhost:3001/api/health
```

**Verify:**
```bash
# In another terminal
curl http://localhost:3001/api/health
```

**Expected:** `{"status":"ok","timestamp":"...","uptime":...}`

✅ **PASS**: Auth server is running
❌ **FAIL**: Check MongoDB connection string in .env

---

### TEST 2: Create Test User

```bash
# In auth-server directory
node scripts/manage-user.js create \
  --email test@whasender.com \
  --password Test123456 \
  --name "Test User" \
  --plan pro \
  --days 30
```

**Expected Output:**
```
User created successfully:
  Email: test@whasender.com
  Name: Test User
  Plan: pro
  Max Daily Messages: 200
  Expires: [30 days from now]
```

**Verify user exists:**
```bash
node scripts/manage-user.js list
```

✅ **PASS**: User created and listed
❌ **FAIL**: Check MongoDB connection

---

### TEST 3: Start Electron App

```bash
# Terminal 2: Start Electron app
cd app
npm run dev
```

**Expected:**
- Vite dev server starts on port 5173
- Electron window opens
- Login screen appears

✅ **PASS**: App launches and shows login screen
❌ **FAIL**: Check console for errors

---

### TEST 4: Login Flow

**In the Electron app:**

1. Enter credentials:
   - Email: `test@whasender.com`
   - Password: `Test123456`
2. Click "Login"

**Expected:**
- Login succeeds
- Redirects to WhatsApp Auth screen
- QR code appears

✅ **PASS**: Login successful, QR code shown
❌ **FAIL**: Check DevTools Console (Cmd+Option+I) for errors

**Test invalid login:**
- Try wrong password → Should show error
- Try deactivated user → Should show error

---

### TEST 5: WhatsApp Connection

**Prerequisites:**
- Have WhatsApp installed on your phone
- Phone has internet connection

**Steps:**
1. Open WhatsApp on phone
2. Go to: Settings (⚙️) → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code in the app

**Expected:**
- QR code refreshes every ~20 seconds (auto-refresh)
- After scanning: Shows "Connected Successfully!"
- Displays your phone number
- "Continue to Dashboard" button appears

**Verify session persistence:**
1. Close the Electron app
2. Reopen it
3. Should skip QR code and go straight to dashboard

✅ **PASS**: WhatsApp connected, session persists
❌ **FAIL**: Check console logs, try clearing auth state:
```bash
rm -rf ~/Library/Application\ Support/whasender-app/auth_info_baileys/
```

---

### TEST 6: Database Initialization

**Open DevTools Console (Cmd+Option+I) in Electron app:**

```javascript
// Test database
const result = await window.electronAPI.invoke('db:test');
console.log('Database test:', result);
```

**Expected Output:**
```javascript
{
  success: true,
  tableCount: 5,
  message: "Database has 5 tables"
}
```

**Verify database location:**
```bash
# The database file
ls -lh ~/Library/Application\ Support/whasender-app/whasender.db

# Open database
sqlite3 ~/Library/Application\ Support/whasender-app/whasender.db

# List tables
sqlite> .tables
# Should show: _migrations  logs  settings  task_numbers  tasks

# Check schema
sqlite> .schema tasks
sqlite> .quit
```

✅ **PASS**: Database created with 5 tables
❌ **FAIL**: Check app logs for database errors

---

### TEST 7: Excel/CSV Parsing

**Create test file:** `test-contacts.csv`
```csv
Phone,Name
9876543210,Alice
9876543211,Bob
9876543212,Charlie
+919876543213,David
1234567890,Eve (10 digits - will auto-add +91)
```

**In DevTools Console:**
```javascript
// Parse the file
const parseResult = await window.electronAPI.invoke(
  'file:parse-numbers',
  '/Users/aniketmodkar/TechnoMize/WA-Web/whasender/test-contacts.csv'
);
console.log('Parse result:', parseResult);
```

**Expected Output:**
```javascript
{
  success: true,
  numbers: [
    { phone: "919876543210", name: "Alice" },
    { phone: "919876543211", name: "Bob" },
    // ... etc
  ],
  errors: [],
  totalRows: 5,
  validRows: 5,
  invalidRows: 0
}
```

**Test invalid data:**
Create `test-invalid.csv`:
```csv
Phone,Name
abc123,Invalid
12345,Too Short
```

✅ **PASS**: Valid numbers parsed, invalid numbers in errors array
❌ **FAIL**: Check file path is absolute

---

### TEST 8: Task Creation

**In DevTools Console:**
```javascript
// Create a task
const taskResult = await window.electronAPI.invoke('task:create', {
  messageTemplate: 'Hello {name}! This is a test message from WhaSender. Testing Phase 5.',
  numbers: [
    { phone: '919876543210', name: 'Alice' },
    { phone: '919876543211', name: 'Bob' },
    { phone: '919876543212', name: 'Charlie' }
  ],
  scheduledAt: null // null = start immediately
});

console.log('Task created:', taskResult);
```

**Expected Output:**
```javascript
{
  success: true,
  taskId: 1,
  task: {
    id: 1,
    status: 'scheduled',
    message_template: 'Hello {name}! ...',
    total_numbers: 3,
    // ... etc
  }
}
```

**Verify in database:**
```bash
sqlite3 ~/Library/Application\ Support/whasender-app/whasender.db

sqlite> SELECT * FROM tasks;
sqlite> SELECT * FROM task_numbers;
sqlite> .quit
```

**Test task locking (try to create another task):**
```javascript
// This should fail because task 1 is still scheduled
const task2 = await window.electronAPI.invoke('task:create', {
  messageTemplate: 'Another task',
  numbers: [{ phone: '919999999999', name: 'Test' }],
  scheduledAt: null
});

console.log('Second task:', task2);
// Should show error: "Another task is already active"
```

✅ **PASS**: Task created, second task blocked
❌ **FAIL**: Check database connection

---

### TEST 9: Anti-Ban Components

**Test Delay Engine:**
```javascript
// In DevTools Console
const DelayEngine = require('./electron/anti-ban/delay-engine');
const delays = new DelayEngine();

console.log('Message delay:', delays.formatDelay(delays.getMessageDelay()));
console.log('Batch size:', delays.getBatchSize());
console.log('Batch pause:', delays.formatDelay(delays.getBatchPauseDelay()));

// Test multiple times to see variation
for (let i = 0; i < 5; i++) {
  console.log(`Delay ${i+1}:`, delays.formatDelay(delays.getMessageDelay()));
}
```

**Test Time Window:**
```javascript
const TimeWindowManager = require('./electron/anti-ban/time-window');
const timeWindow = new TimeWindowManager();

console.log('Window status:', timeWindow.getWindowStatus());
console.log('Within operating hours?', timeWindow.isWithinOperatingHours());
console.log('Operating hours:', timeWindow.getOperatingHoursString());
```

**Test Human Simulator:**
```javascript
const HumanSimulator = require('./electron/anti-ban/human-simulator');
const simulator = new HumanSimulator();

const template = 'Hello {name}, this is a test message!';

// Generate 5 variations
for (let i = 0; i < 5; i++) {
  const varied = simulator.varyMessage(template, 'Alice');
  console.log(`Variation ${i+1}:`, varied);
  console.log('Length:', varied.length);
}

// All should look identical but have different lengths (invisible chars)
```

✅ **PASS**: All components working, showing variation
❌ **FAIL**: Check require paths

---

### TEST 10: Task Execution (CRITICAL TEST)

**⚠️ WARNING:** This will send actual WhatsApp messages!

**Use test numbers you control!**

```javascript
// Get the task ID from TEST 8
const taskId = 1;

// Set up event listeners FIRST
window.electronAPI.on('task:progress', (data) => {
  console.log('📊 Progress:', data);
});

window.electronAPI.on('task:status-change', (data) => {
  console.log('🔄 Status:', data);
});

window.electronAPI.on('task:complete', (data) => {
  console.log('✅ Complete:', data);
});

window.electronAPI.on('task:ban-detected', (data) => {
  console.log('🚨 BAN DETECTED:', data);
});

// Start the task
const startResult = await window.electronAPI.invoke('task:start', taskId);
console.log('Task started:', startResult);
```

**Expected Behavior:**
1. Task status changes to 'running'
2. Messages sent with delays (45-120 seconds between messages)
3. Typing indicator shows on recipient's phone
4. Each message is slightly different (invisible chars)
5. Progress events emit in console
6. After 5-12 messages, takes a batch pause (5-15 minutes)

**Monitor in database:**
```bash
# In another terminal, watch progress
watch -n 2 'sqlite3 ~/Library/Application\ Support/whasender-app/whasender.db "SELECT status, sent_count, failed_count FROM tasks WHERE id=1"'
```

**Test Pause/Resume:**
```javascript
// Pause the task
await window.electronAPI.invoke('task:pause');
console.log('Task paused');

// Wait a bit, then resume
await window.electronAPI.invoke('task:resume');
console.log('Task resumed');
```

**Test Stop:**
```javascript
// Stop the task completely
await window.electronAPI.invoke('task:stop', taskId);
console.log('Task stopped');
```

✅ **PASS**: Messages sent with delays, pause/resume/stop works
❌ **FAIL**: Check WhatsApp connection, console errors

---

### TEST 11: Email Notifications

**Setup SMTP (using Gmail example):**

**First, get Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication if not enabled
3. Go to App Passwords
4. Create new app password for "Mail"
5. Copy the 16-character password

**Configure in DevTools:**
```javascript
// Configure SMTP
const smtpConfig = await window.electronAPI.invoke('smtp:configure', {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: 'your-email@gmail.com',
  pass: 'your-16-char-app-password',
  alertEmail: 'your-email@gmail.com',
  enabledAlerts: {
    taskStarted: true,
    taskComplete: true,
    banDetected: true,
    serviceDown: true,
    dailyReport: true
  }
});

console.log('SMTP configured:', smtpConfig);
```

**Test connection:**
```javascript
const testResult = await window.electronAPI.invoke('smtp:test');
console.log('SMTP test:', testResult);
// Should return: { success: true, message: 'SMTP connection successful' }
```

**Now run a task and check your email:**
```javascript
// Create and start a small task
const emailTestTask = await window.electronAPI.invoke('task:create', {
  messageTemplate: 'Email test: Hello {name}!',
  numbers: [
    { phone: '919876543210', name: 'Test User' }
  ]
});

await window.electronAPI.invoke('task:start', emailTestTask.taskId);
```

**Check your email for:**
1. ✉️ "Task Started" email - sent immediately
2. ✉️ "Task Completed" email - sent when done

✅ **PASS**: Emails received with correct data
❌ **FAIL**: Check SMTP settings, Gmail app password

---

### TEST 12: Warmup Manager

**Check warmup stats:**
```javascript
// In DevTools Console
const warmupStats = await window.electronAPI.invoke('db:test');

// Check settings table
// (You'll need to add a custom IPC handler for this, or use sqlite directly)
```

**Using SQLite:**
```bash
sqlite3 ~/Library/Application\ Support/whasender-app/whasender.db

sqlite> SELECT * FROM settings WHERE key LIKE 'wa_%';
# Should show:
# wa_first_connected_date
# wa_total_messages_sent
# wa_messages_sent_today
# wa_last_send_date

sqlite> .quit
```

**Verify daily limits:**
- Day 1-3: Should allow 10 messages max
- Day 4-7: Should allow 25 messages max
- etc.

✅ **PASS**: Warmup tracking working, limits enforced
❌ **FAIL**: Check settings table data

---

### TEST 13: Scheduler

**Schedule a task for 2 minutes from now:**
```javascript
// Get current time + 2 minutes
const scheduledTime = new Date(Date.now() + 2 * 60 * 1000);
console.log('Scheduling for:', scheduledTime.toISOString());

// Create task
const scheduledTask = await window.electronAPI.invoke('task:create', {
  messageTemplate: 'Scheduled test message to {name}',
  numbers: [{ phone: '919876543210', name: 'Test' }],
  scheduledAt: scheduledTime.toISOString()
});

// Schedule it
const scheduleResult = await window.electronAPI.invoke('task:schedule', {
  taskId: scheduledTask.taskId,
  scheduledAt: scheduledTime.toISOString()
});

console.log('Scheduled:', scheduleResult);
```

**Expected:**
- Task created with status 'scheduled'
- After 2 minutes, task automatically starts
- Check console for "Cron triggered" message

**Test cancel:**
```javascript
// Before it triggers
await window.electronAPI.invoke('task:cancel-schedule', scheduledTask.taskId);
```

✅ **PASS**: Task starts at scheduled time
❌ **FAIL**: Check cron expression, timezone

---

## Common Issues & Solutions

### Issue: Auth server can't connect to MongoDB
```bash
# Check MongoDB is running
# For Atlas: Check IP whitelist, connection string
# For local:
brew services list | grep mongodb
brew services restart mongodb-community
```

### Issue: Electron app won't start
```bash
cd app
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue: WhatsApp won't connect
```bash
# Clear session and try again
rm -rf ~/Library/Application\ Support/whasender-app/auth_info_baileys/
# Restart app and scan new QR
```

### Issue: Database errors
```bash
# Delete and recreate
rm ~/Library/Application\ Support/whasender-app/whasender.db
# Restart app - it will recreate
```

### Issue: Messages not sending
- Check WhatsApp connection status
- Verify phone numbers are valid WhatsApp numbers
- Check if within operating hours (9 AM - 8 PM IST)
- Check warmup limits

### Issue: Emails not sending
- Verify SMTP configuration
- Check Gmail app password (not regular password)
- Test connection first
- Check spam folder

---

## Success Criteria Checklist

All tests passing means:

- [ ] Auth server running and connected to MongoDB
- [ ] User can login with credentials
- [ ] WhatsApp connects and shows QR code
- [ ] WhatsApp session persists across restarts
- [ ] Database created with 5 tables
- [ ] Excel/CSV files parse correctly
- [ ] Tasks can be created
- [ ] Task locking prevents concurrent tasks
- [ ] Anti-ban components show variation
- [ ] Tasks execute with delays and progress events
- [ ] Pause/Resume/Stop work correctly
- [ ] SMTP configured and tested
- [ ] Emails received for task events
- [ ] Warmup tracking initialized
- [ ] Scheduled tasks trigger on time

**If all checked ✅ → Phase 0-5 fully working!**

---

## Next Steps After Testing

Once all tests pass:
1. Phase 6: Build UI screens (Dashboard, New Task, Monitor, etc.)
2. Phase 7: Add system tray and crash recovery
3. Phase 8: Package for distribution
4. Phase 9: End-to-end testing
5. Phase 10: Deploy auth server


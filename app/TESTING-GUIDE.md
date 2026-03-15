# WhaSender Testing Guide

This guide provides comprehensive testing procedures for WhaSender.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Phase 1: Authentication Testing](#phase-1-authentication-testing)
3. [Phase 2: WhatsApp Connection Testing](#phase-2-whatsapp-connection-testing)
4. [Phase 3: Task Creation Testing](#phase-3-task-creation-testing)
5. [Phase 4: Task Execution Testing](#phase-4-task-execution-testing)
6. [Phase 5: Anti-Ban Engine Testing](#phase-5-anti-ban-engine-testing)
7. [Phase 6: Email Notifications Testing](#phase-6-email-notifications-testing)
8. [Phase 7: System Tray & Notifications Testing](#phase-7-system-tray--notifications-testing)
9. [Phase 8: Settings & Reports Testing](#phase-8-settings--reports-testing)
10. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)

---

## Prerequisites

1. **Authentication Server Running**
   ```bash
   cd auth-server
   npm start
   ```
   Server should be running at http://localhost:3000

2. **Application Running**
   ```bash
   cd app
   npm run dev
   ```
   App should open automatically

3. **Test Data**
   - Create a test CSV file with 5-10 phone numbers
   - Use your own WhatsApp number for testing
   - Have a secondary device/number for receiving test messages

---

## Phase 1: Authentication Testing

### Test 1.1: New User Registration
**Steps:**
1. Open the app (should show login screen)
2. Click "Create Account" or similar
3. Enter email: `test@example.com`
4. Enter password: `Test123!@#`
5. Click Register

**Expected Result:**
- ✓ Registration successful
- ✓ Redirected to WhatsApp authentication screen
- ✓ User session created

**Verify:**
- Check auth server logs for registration
- Check `~/Library/Application Support/whasender-app/` for session data

### Test 1.2: Existing User Login
**Steps:**
1. Restart the app
2. Enter registered email and password
3. Click Login

**Expected Result:**
- ✓ Login successful
- ✓ Redirected to WhatsApp auth or Dashboard (if WA already connected)

### Test 1.3: Invalid Credentials
**Steps:**
1. Enter wrong email/password
2. Click Login

**Expected Result:**
- ✓ Error message displayed
- ✓ User remains on login screen

### Test 1.4: Session Persistence
**Steps:**
1. Login successfully
2. Close app
3. Reopen app

**Expected Result:**
- ✓ Auto-logged in
- ✓ No login screen shown

---

## Phase 2: WhatsApp Connection Testing

### Test 2.1: Initial QR Code Connection
**Steps:**
1. After login, should see WhatsApp auth screen
2. QR code should be displayed
3. Scan QR with WhatsApp app (Settings → Linked Devices → Link a Device)

**Expected Result:**
- ✓ QR code appears within 5 seconds
- ✓ After scanning, status changes to "Connected"
- ✓ Phone number displayed (e.g., +919039170088)
- ✓ Redirected to Dashboard within 1-2 seconds

**Verify:**
- Check console logs for "WhatsApp connected successfully"
- Check auth state stored in `~/Library/Application Support/whasender-app/`

### Test 2.2: Connection Persistence
**Steps:**
1. Close app while WhatsApp is connected
2. Reopen app

**Expected Result:**
- ✓ WhatsApp auto-connects without QR
- ✓ Dashboard loads directly
- ✓ No multiple connection attempts (check logs)

### Test 2.3: Manual Disconnect
**Steps:**
1. Go to Settings page
2. Click "Disconnect WhatsApp" or "Clear Session"
3. Confirm

**Expected Result:**
- ✓ WhatsApp disconnected
- ✓ Redirected to WhatsApp auth screen
- ✓ New QR code displayed

### Test 2.4: Logout from WhatsApp Mobile
**Steps:**
1. Connect WhatsApp via QR
2. On mobile: Settings → Linked Devices → WhaSender → Unlink

**Expected Result:**
- ✓ App detects disconnection
- ✓ Status changes to "Disconnected"
- ✓ Notification shown (if enabled)
- ✓ Redirected to WhatsApp auth screen

---

## Phase 3: Task Creation Testing

### Test 3.1: CSV File Upload
**Steps:**
1. Go to "New Task" page
2. Click "Select File"
3. Choose a CSV file with columns: `phone,name,custom1`

**Sample CSV:**
```csv
phone,name,company
919876543210,John Doe,Acme Corp
919876543211,Jane Smith,Tech Inc
919876543212,Bob Wilson,StartupXYZ
```

**Expected Result:**
- ✓ File parsed successfully
- ✓ Preview table shows data
- ✓ Column headers detected correctly
- ✓ Phone numbers formatted properly

### Test 3.2: Excel File Upload
**Steps:**
1. Upload an .xlsx file with same data

**Expected Result:**
- ✓ Excel parsed correctly
- ✓ Data matches CSV test

### Test 3.3: Message Template with Variables
**Steps:**
1. After file upload, proceed to message step
2. Enter message:
   ```
   Hi {{name}},

   This is a test message from {{company}}.

   Regards,
   WhaSender Team
   ```
3. Check preview

**Expected Result:**
- ✓ Variables {{name}} and {{company}} highlighted
- ✓ Preview shows replaced values for first contact
- ✓ Variables properly inserted via buttons

### Test 3.4: Schedule Immediate Task
**Steps:**
1. Select "Send Now"
2. Review summary
3. Click "Create Task"

**Expected Result:**
- ✓ Task created successfully
- ✓ Redirected to Monitor page
- ✓ Task appears with "Pending" or "Running" status

### Test 3.5: Schedule Future Task
**Steps:**
1. Select "Schedule for Later"
2. Choose date/time (e.g., 5 minutes from now)
3. Create task

**Expected Result:**
- ✓ Task created with "Scheduled" status
- ✓ Appears in Monitor/Reports
- ✓ Executes at scheduled time

---

## Phase 4: Task Execution Testing

### Test 4.1: Basic Task Execution
**Steps:**
1. Create task with 3-5 test numbers (your own numbers)
2. Click "Start" on Monitor page
3. Observe real-time progress

**Expected Result:**
- ✓ Status changes to "Running"
- ✓ Progress bar updates
- ✓ Logs show each message being sent
- ✓ Stats update (sent count increases)
- ✓ Messages received on test devices

**Check Console Logs:**
```
Sending to +919876543210...
✓ Sent to +919876543210
Delay: 1m 30s
Sending to +919876543211...
```

### Test 4.2: Pause and Resume
**Steps:**
1. Start a task with 5+ numbers
2. After 2 messages sent, click "Pause"
3. Wait 10 seconds
4. Click "Resume"

**Expected Result:**
- ✓ Task pauses immediately
- ✓ Status shows "Paused (Manual)"
- ✓ Resume continues from where it stopped
- ✓ No duplicate messages

### Test 4.3: Stop Task
**Steps:**
1. Start a task
2. After 2 messages, click "Stop"
3. Confirm

**Expected Result:**
- ✓ Task stops immediately
- ✓ Status changes to "Stopped"
- ✓ Remaining messages marked as "Skipped"
- ✓ Final stats shown

### Test 4.4: Task Completion
**Steps:**
1. Create small task (3 numbers)
2. Let it run to completion

**Expected Result:**
- ✓ All messages sent
- ✓ Status changes to "Completed"
- ✓ Success notification shown
- ✓ Success rate calculated
- ✓ Task appears in Reports

---

## Phase 5: Anti-Ban Engine Testing

### Test 5.1: Random Delays
**Steps:**
1. Start a task with 5+ numbers
2. Monitor console logs for delays

**Expected Result:**
- ✓ Each delay is different (45s - 2m range)
- ✓ No fixed pattern
- ✓ Average around 1-1.5 minutes

**Sample Log:**
```
Delay: 1m 15s
Delay: 47s
Delay: 1m 52s
Delay: 1m 3s
```

### Test 5.2: Batch Pauses
**Steps:**
1. Create task with 15+ numbers
2. Observe batch pause behavior

**Expected Result:**
- ✓ After 5-12 messages, longer pause (5-15 minutes)
- ✓ Log shows "Taking batch pause: 7m 30s"
- ✓ Task continues after batch pause

### Test 5.3: Time Window Restrictions
**Steps:**
1. Check current time
2. If outside 9 AM - 8 PM IST, create and start task

**Expected Result:**
- ✓ Task starts
- ✓ First message attempts
- ✓ If outside window, task should pause with message "Outside allowed time window"
- ✓ Task auto-resumes when window opens

### Test 5.4: Daily Limit Tracking
**Steps:**
1. Check Dashboard for "Messages Sent Today"
2. Send some messages
3. Refresh dashboard

**Expected Result:**
- ✓ Counter increases correctly
- ✓ Resets at midnight IST
- ✓ Approaching 80% shows warning

---

## Phase 6: Email Notifications Testing

### Test 6.1: SMTP Configuration
**Steps:**
1. Go to Settings → Email Alerts
2. Enter SMTP details:
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your@gmail.com
   - Password: app-specific-password
3. Click "Save"
4. Click "Send Test Email"

**Expected Result:**
- ✓ Configuration saved
- ✓ Test email received
- ✓ Success message shown

### Test 6.2: Task Started Email
**Steps:**
1. Enable "Task Started" alerts
2. Create and start a task

**Expected Result:**
- ✓ Email received within seconds
- ✓ Contains: Task ID, total numbers, timestamp

### Test 6.3: Task Completed Email
**Steps:**
1. Enable "Task Completed" alerts
2. Let a task complete

**Expected Result:**
- ✓ Email received
- ✓ Contains: Task ID, success rate, sent/failed counts, duration

### Test 6.4: Ban Detection Email
**Steps:**
1. Enable "Ban Detected" alerts
2. (This is hard to test - would require triggering WhatsApp rate limit)

**Expected Result (in production):**
- ✓ Immediate email when ban detected
- ✓ Contains: Task ID, messages sent before ban

### Test 6.5: Daily Report Email
**Steps:**
1. Enable "Daily Report"
2. Wait until 9:00 PM IST (or modify schedule for testing)

**Expected Result:**
- ✓ Email received at scheduled time
- ✓ Contains: Total sent today, success rate, tasks completed

---

## Phase 7: System Tray & Notifications Testing

### Test 7.1: Minimize to Tray
**Steps:**
1. Click window close button (X)

**Expected Result:**
- ✓ Window hides (doesn't quit)
- ✓ App icon visible in system tray
- ✓ macOS: Icon in menu bar
- ✓ Windows: Icon in system tray
- ✓ Linux: Icon in notification area

### Test 7.2: Tray Menu
**Steps:**
1. Right-click tray icon

**Expected Result:**
- ✓ Context menu appears
- ✓ Options: Show/Hide, WhatsApp Status, Quit
- ✓ "Show" brings window back
- ✓ "Quit" closes app completely

### Test 7.3: Background Task Execution
**Steps:**
1. Start a task
2. Close window (minimize to tray)
3. Wait for task to complete

**Expected Result:**
- ✓ Task continues running in background
- ✓ Completion notification shown
- ✓ Open window shows completed task

### Test 7.4: System Notifications
**Steps:**
1. Start a task
2. Minimize to tray
3. Wait for task events

**Expected Result:**
- ✓ "Task Started" notification
- ✓ "Task Completed" notification with stats
- ✓ Clicking notification brings window to front

### Test 7.5: WhatsApp Disconnect Notification
**Steps:**
1. Disconnect WhatsApp from mobile
2. Check for notification

**Expected Result:**
- ✓ "WhatsApp Disconnected" notification (critical)

---

## Phase 8: Settings & Reports Testing

### Test 8.1: Reports Filtering
**Steps:**
1. Create and complete 3+ tasks
2. Go to Reports page
3. Test filters: All, Completed, Failed, Stopped
4. Test search by task ID or message content

**Expected Result:**
- ✓ Filters work correctly
- ✓ Search finds tasks
- ✓ Stats cards update based on filter

### Test 8.2: Reports Sorting
**Steps:**
1. Click sort dropdown
2. Try "Date (Newest First)", "Date (Oldest First)", "Success Rate"

**Expected Result:**
- ✓ Tasks reorder correctly

### Test 8.3: CSV Export
**Steps:**
1. Click "Export CSV"

**Expected Result:**
- ✓ CSV file downloads
- ✓ Contains all task data
- ✓ Properly formatted

### Test 8.4: Settings Persistence
**Steps:**
1. Change SMTP settings
2. Enable/disable notifications
3. Close and reopen app

**Expected Result:**
- ✓ Settings preserved
- ✓ No need to reconfigure

---

## Edge Cases & Error Scenarios

### Edge Case 1: Invalid Phone Numbers
**Steps:**
1. Create CSV with invalid numbers:
   ```csv
   phone,name
   123,Invalid
   abc,Invalid
   919876543210,Valid
   ```
2. Create task

**Expected Result:**
- ✓ Invalid numbers skipped with log
- ✓ Valid number processed
- ✓ Task completes successfully

### Edge Case 2: Empty CSV
**Steps:**
1. Upload empty CSV (only headers)

**Expected Result:**
- ✓ Error message: "No contacts found"
- ✓ Cannot proceed

### Edge Case 3: Large File
**Steps:**
1. Upload CSV with 500+ numbers

**Expected Result:**
- ✓ File parsed (may take a few seconds)
- ✓ Preview shows first 50 rows
- ✓ Task creates successfully
- ✓ Warmup limits respected

### Edge Case 4: WhatsApp Disconnects Mid-Task
**Steps:**
1. Start task
2. Unlink WhatsApp from mobile during execution

**Expected Result:**
- ✓ Task detects disconnect
- ✓ Task pauses with error
- ✓ Notification shown
- ✓ Can reconnect and resume

### Edge Case 5: App Crash During Task
**Steps:**
1. Start task
2. Force quit app (Cmd+Q / Alt+F4)
3. Restart app

**Expected Result:**
- ✓ Task status preserved
- ✓ Can resume from last checkpoint
- ✓ No duplicate messages sent

### Edge Case 6: Concurrent Tasks
**Steps:**
1. Create task 1 and start it
2. Try to start task 2 while task 1 running

**Expected Result:**
- ✓ Error: "Task executor is already running"
- ✓ Only one task runs at a time

### Edge Case 7: Network Loss
**Steps:**
1. Start task
2. Disconnect internet
3. Reconnect

**Expected Result:**
- ✓ Task pauses on network error
- ✓ WhatsApp reconnects automatically
- ✓ Task can resume

---

## Automated Testing Checklist

Before releasing v1.0.0:

**Authentication:**
- [ ] Registration works
- [ ] Login works
- [ ] Logout works
- [ ] Session persists
- [ ] Invalid credentials rejected

**WhatsApp:**
- [ ] QR connection works
- [ ] Session persists
- [ ] Disconnect works
- [ ] Auto-reconnect works

**Tasks:**
- [ ] CSV upload works
- [ ] Excel upload works
- [ ] Message templates work
- [ ] Task creation works
- [ ] Immediate execution works
- [ ] Scheduled execution works

**Execution:**
- [ ] Messages send successfully
- [ ] Pause/Resume works
- [ ] Stop works
- [ ] Progress updates in real-time
- [ ] Completion triggers notifications

**Anti-Ban:**
- [ ] Random delays applied
- [ ] Batch pauses occur
- [ ] Daily limit tracked
- [ ] Time window respected

**Email:**
- [ ] SMTP configuration works
- [ ] Test email sends
- [ ] Task alerts work
- [ ] Daily reports work

**System:**
- [ ] Minimize to tray works
- [ ] Background execution works
- [ ] System notifications work
- [ ] Auto-update check works (production)

**UI:**
- [ ] All pages load
- [ ] Navigation works
- [ ] Forms validate
- [ ] Error messages clear
- [ ] Responsive on different sizes

**Data:**
- [ ] Settings persist
- [ ] Reports show correct data
- [ ] Export works
- [ ] Database migrations work

---

## Performance Testing

### Test P1: Large Task (500+ numbers)
**Expected:**
- CSV parses in < 5 seconds
- UI remains responsive
- Memory usage stable

### Test P2: Long Running Session
**Expected:**
- App runs for 8+ hours without crash
- Memory doesn't leak
- WhatsApp connection stable

### Test P3: Rapid Actions
**Expected:**
- Clicking UI rapidly doesn't break state
- No race conditions
- Concurrent operations handled gracefully

---

## Bug Reporting Template

When reporting bugs, include:

1. **Steps to Reproduce**
2. **Expected Result**
3. **Actual Result**
4. **Screenshots/Logs**
5. **Environment**:
   - OS: macOS/Windows/Linux
   - App Version: 1.0.0
   - Node Version: (from console)
6. **Console Logs** (Help → Dev Tools → Console)

---

## Test Sign-Off

After completing all tests:

- [ ] All critical tests pass
- [ ] No blocking bugs
- [ ] Performance acceptable
- [ ] Ready for production

**Tester:** _______________
**Date:** _______________
**Version:** _______________

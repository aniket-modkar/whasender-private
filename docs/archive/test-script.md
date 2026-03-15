# WhaSender Testing Checklist

## Pre-Testing
- [ ] MongoDB is running
- [ ] Auth server is running (port 3001)
- [ ] Test user created (test@example.com / test123)
- [ ] Electron app is running

## Authentication Tests
- [ ] Login with valid credentials → Success
- [ ] Login with wrong password → Error message
- [ ] Logout → Returns to login screen
- [ ] Login again → Session persists (auto-login if within 5 days)

## WhatsApp Connection Tests
- [ ] QR code displays
- [ ] Scan QR → Connection successful
- [ ] Phone number displayed
- [ ] Close app and reopen → Auto-reconnects (no QR needed)
- [ ] Disconnect WhatsApp → Shows disconnected state
- [ ] Reconnect → New QR appears

## Database Tests
- [ ] Check tasks table exists
- [ ] Check task_numbers table exists
- [ ] Check logs table exists
- [ ] Check settings table exists
- [ ] Check migrations table exists

## File Parsing Tests
- [ ] Parse CSV with valid numbers → Success
- [ ] Parse Excel (.xlsx) → Success
- [ ] Invalid file type → Error message
- [ ] Empty file → Error message
- [ ] File with invalid numbers → Error list

## Task Creation Tests
- [ ] Create task with valid data → Success
- [ ] Try to create second task while one active → Blocked
- [ ] Task appears in database
- [ ] Numbers inserted correctly

## Task Execution Tests
- [ ] Start task → Status changes to 'running'
- [ ] Messages send with delays
- [ ] Typing indicator appears (check on recipient phone)
- [ ] Progress events emit
- [ ] Logs written to database
- [ ] Pause task → Sending stops
- [ ] Resume task → Continues from where it left off
- [ ] Stop task → Status changes to 'stopped'

## Anti-Ban Tests
- [ ] Messages have random delays (45-120s)
- [ ] Batch pause occurs after 5-12 messages
- [ ] Each message is unique (check with same template)
- [ ] {name} placeholder replaced correctly
- [ ] Time window enforced (test outside 9 AM - 8 PM IST)
- [ ] Daily limit enforced (check warmup stats)

## Scheduler Tests
- [ ] Schedule task for future time → Cron job created
- [ ] Task starts at scheduled time
- [ ] Cancel schedule → Job cancelled
- [ ] Restart app → Scheduled tasks restored

## Error Handling Tests
- [ ] Disconnect internet during task → Handles gracefully
- [ ] Invalid phone number → Skips with error
- [ ] Number not on WhatsApp → Skips with error
- [ ] Disconnect WhatsApp during task → Detects and pauses

## Notes
- Use test numbers that you control
- Start with 2-3 numbers for initial testing
- Monitor console logs for detailed information
- Check database after each test

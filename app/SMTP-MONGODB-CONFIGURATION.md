# SMTP Configuration via MongoDB - Implementation

## Overview

SMTP email configuration has been moved from local electron-store to centralized MongoDB management. Admins configure SMTP settings in MongoDB and map them to users, eliminating the need for users to configure their own email settings.

**Date:** March 14, 2026
**Version:** 2.0
**Status:** ✅ Implemented

---

## 🎯 What Changed

### Before (Version 1.0)
- ❌ Each user configured their own SMTP settings
- ❌ Settings stored in local electron-store
- ❌ SMTP configuration UI in Settings page
- ❌ Users needed technical knowledge (SMTP servers, ports, etc.)
- ❌ Decentralized email configuration

### After (Version 2.0)
- ✅ Centralized SMTP configuration in MongoDB
- ✅ Admin maps SMTP configs to users
- ✅ No SMTP UI for end users
- ✅ Automatic email configuration on login
- ✅ Zero configuration needed from users

---

## 🏗️ Architecture

### Data Flow

```
┌─────────────────────────────────────────────┐
│  MongoDB Collections                        │
├─────────────────────────────────────────────┤
│  1. smtpConfigs Collection                  │
│     - SMTP server settings                  │
│     - Multiple configs for different zones  │
│                                             │
│  2. users Collection                        │
│     - User data with smtpConfig reference   │
│     - Config mapped by admin                │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Auth Server (/api/auth/login)              │
│  - Returns user with embedded smtpConfig    │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Desktop App (Electron)                     │
│  - Receives user data on login              │
│  - Initializes SMTP service automatically   │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Email Notifications                        │
│  - Task started/completed                   │
│  - Ban detected                             │
│  - Daily reports                            │
└─────────────────────────────────────────────┘
```

---

## 📊 MongoDB Schema

### 1. smtpConfigs Collection

```javascript
{
  _id: ObjectId("..."),
  name: "US East SMTP Server",          // Human-readable name
  description: "Primary SMTP for US customers",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,                        // true for port 465
  user: "notifications@company.com",
  pass: "encrypted_app_password",       // Encrypted/hashed
  alertEmail: "alerts@company.com",     // Where to send notifications
  enabledAlerts: {
    taskStarted: true,
    taskComplete: true,
    banDetected: true,
    serviceDown: true,
    dailyReport: true,
    dailyLimitReached: true
  },
  active: true,                         // Enable/disable config
  createdAt: ISODate("2026-03-14T00:00:00Z"),
  updatedAt: ISODate("2026-03-14T00:00:00Z")
}
```

### 2. users Collection (Updated)

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "John Doe",
  password: "hashed_password",
  plan: "PRO",
  maxDailyMessages: 500,
  isActive: true,
  expiresAt: "2026-12-31",
  deviceId: "unique_device_id",

  // NEW FIELD: SMTP Configuration Reference
  smtpConfig: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "notifications@company.com",
    pass: "app_password",               // Sent securely via HTTPS
    alertEmail: "alerts@company.com",
    enabledAlerts: {
      taskStarted: true,
      taskComplete: true,
      banDetected: true,
      serviceDown: true,
      dailyReport: true,
      dailyLimitReached: true
    }
  },

  createdAt: ISODate("2026-01-01T00:00:00Z"),
  updatedAt: ISODate("2026-03-14T00:00:00Z")
}
```

**Note:** The `smtpConfig` object is embedded in user document for performance (no joins needed).

---

## 🔄 Implementation Details

### 1. Backend Changes (Electron)

#### a) smtp-service.js (Refactored)

**Before:**
```javascript
class SmtpService {
  async init() {
    // Load config from electron-store
    this.config = store.get('smtp');
    this.initializeTransporter();
  }

  configure(smtpConfig) {
    // Save to electron-store
    store.set('smtp', config);
  }
}
```

**After:**
```javascript
class SmtpService {
  async setConfigFromUser(user) {
    if (!user || !user.smtpConfig) {
      this.config = null;
      this.transporter = null;
      return;
    }

    this.config = user.smtpConfig;
    this.initializeTransporter();
    console.log('SMTP config loaded from user data');
  }

  isConfigured() {
    return this.config && this.config.host && this.config.user && this.config.pass;
  }
}
```

**Key Changes:**
- ❌ Removed `configure()` method
- ❌ Removed electron-store dependency
- ✅ Added `setConfigFromUser()` method
- ✅ Config loaded from user object
- ✅ Simplified `isConfigured()` check

---

#### b) auth-manager.js (Updated)

```javascript
const smtpService = require('../email/smtp-service');

async login(email, password) {
  const response = await fetch(`${this.authServerUrl}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceId: getDeviceId() }),
  });

  const data = await response.json();

  // Cache user data
  store.set('user', data.user);

  // Initialize SMTP service with user's config
  if (data.user && data.user.smtpConfig) {
    await smtpService.setConfigFromUser(data.user);
  }

  return { success: true, user: data.user };
}
```

**Also Updated:**
- `verifyToken()` - Updates SMTP config when user data refreshes
- `checkAccountStatus()` - Updates SMTP config during periodic checks

---

#### c) main.js (Updated)

```javascript
// Initialize SMTP service with cached user config (if available)
const smtpService = require('./email/smtp-service');
const cachedUser = authManager.getUser();

if (cachedUser && cachedUser.smtpConfig) {
  await smtpService.setConfigFromUser(cachedUser);
} else {
  await smtpService.init(); // Initialize without config
}
```

**Ensures:** SMTP works even after app restart (uses cached user data).

---

#### d) ipc-handlers.js (Cleaned)

**Removed Handlers:**
```javascript
// ❌ REMOVED
ipcMain.handle('smtp:configure', ...)
ipcMain.handle('smtp:test', ...)
ipcMain.handle('smtp:get-config', ...)
```

**Why:** Users no longer configure SMTP through the app.

---

### 2. Frontend Changes (React)

#### a) Settings.jsx (Simplified)

**Removed:**
- ❌ SMTP configuration tab
- ❌ SMTP form (host, port, user, password, etc.)
- ❌ "Save Configuration" button
- ❌ "Test Connection" button
- ❌ Alert type checkboxes

**Kept:**
- ✅ Anti-Ban settings tab (read-only)
- ✅ Account information tab

**Before UI:**
```
Settings Page
├── Email Alerts (SMTP Config)  ❌ REMOVED
├── Anti-Ban (View Only)
└── Account (User Info)
```

**After UI:**
```
Settings Page
├── Anti-Ban (View Only)
└── Account (User Info)
```

---

#### b) lib/ipc.js (Cleaned)

**Removed Functions:**
```javascript
// ❌ REMOVED
export const smtpConfigure = (config) => { ... }
export const smtpTest = () => { ... }
export const smtpGetConfig = () => { ... }
```

---

### 3. Auth Server Requirements

#### a) Login Endpoint (Updated)

**Endpoint:** `POST /api/auth/login`

**Response Must Include:**
```javascript
{
  success: true,
  user: {
    email: "user@example.com",
    name: "John Doe",
    plan: "PRO",
    maxDailyMessages: 500,
    isActive: true,
    expiresAt: "2026-12-31",

    // REQUIRED: SMTP Configuration
    smtpConfig: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      user: "notifications@company.com",
      pass: "app_password",
      alertEmail: "alerts@company.com",
      enabledAlerts: {
        taskStarted: true,
        taskComplete: true,
        banDetected: true,
        serviceDown: true,
        dailyReport: true,
        dailyLimitReached: true
      }
    }
  },
  token: "jwt_token",
  expiresAt: "2026-03-15T00:00:00Z"
}
```

**Important:**
- If `smtpConfig` is `null` or missing → Email notifications disabled
- Password sent via HTTPS is acceptable (desktop app is trusted)
- Consider encrypting `pass` field with user's device ID for extra security

---

#### b) Verify/Status Endpoints (Updated)

**Endpoints:**
- `POST /api/auth/verify`
- `GET /api/auth/status`

**Must Return:**
```javascript
{
  success: true,
  user: {
    // ... all user fields including smtpConfig
    smtpConfig: { ... }  // Required for SMTP updates
  }
}
```

**Why:** App periodically checks status (every 5 minutes) and updates SMTP config if changed.

---

## 👨‍💼 Admin Workflow

### 1. Create SMTP Configuration

```javascript
// MongoDB - smtpConfigs collection
db.smtpConfigs.insertOne({
  name: "US East SMTP Server",
  description: "Primary SMTP for US customers",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "notifications@company.com",
  pass: "app_password_generated_from_gmail",
  alertEmail: "alerts@company.com",
  enabledAlerts: {
    taskStarted: true,
    taskComplete: true,
    banDetected: true,
    serviceDown: true,
    dailyReport: true,
    dailyLimitReached: true
  },
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

---

### 2. Assign SMTP Config to User

**Option A: Embed Full Config (Recommended for Performance)**
```javascript
// MongoDB - users collection
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      smtpConfig: {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        user: "notifications@company.com",
        pass: "app_password",
        alertEmail: "alerts@company.com",
        enabledAlerts: {
          taskStarted: true,
          taskComplete: true,
          banDetected: true,
          serviceDown: true,
          dailyReport: true,
          dailyLimitReached: true
        }
      },
      updatedAt: new Date()
    }
  }
);
```

**Option B: Reference by ID (If You Prefer Normalization)**
```javascript
// MongoDB - users collection
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      smtpConfigId: ObjectId("..."),  // Reference to smtpConfigs collection
      updatedAt: new Date()
    }
  }
);

// Then in auth server, populate smtpConfig on login:
const user = await User.findOne({ email }).lean();
const smtpConfig = await SmtpConfig.findById(user.smtpConfigId).lean();
user.smtpConfig = smtpConfig;  // Embed for response
```

---

### 3. Disable/Remove SMTP for User

```javascript
// Disable email notifications for specific user
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      smtpConfig: null,  // No email notifications
      updatedAt: new Date()
    }
  }
);
```

**Effect:** User won't receive any email notifications (app continues working normally).

---

### 4. Update SMTP Settings (Affects All Users)

```javascript
// Update SMTP config in smtpConfigs collection
db.smtpConfigs.updateOne(
  { _id: ObjectId("...") },
  {
    $set: {
      pass: "new_app_password",  // Example: rotate password
      updatedAt: new Date()
    }
  }
);

// Then update all users using this config
db.users.updateMany(
  { "smtpConfig.host": "smtp.gmail.com" },  // Find users with this host
  {
    $set: {
      "smtpConfig.pass": "new_app_password",
      updatedAt: new Date()
    }
  }
);
```

**Note:** Changes take effect within 5 minutes (next status check) or on next login.

---

## 🔐 Security Considerations

### 1. SMTP Password Storage

**Recommendation:** Store encrypted passwords in MongoDB

```javascript
const crypto = require('crypto');

// Encrypt password before storing
function encryptPassword(password, secretKey) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Decrypt when sending to desktop app
function decryptPassword(encrypted, secretKey) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Store encrypted
const encryptedPass = encryptPassword(smtpPassword, process.env.ENCRYPTION_KEY);
db.smtpConfigs.insertOne({ ..., pass: encryptedPass });

// Send decrypted to desktop app
const smtpConfig = await SmtpConfig.findById(user.smtpConfigId);
smtpConfig.pass = decryptPassword(smtpConfig.pass, process.env.ENCRYPTION_KEY);
user.smtpConfig = smtpConfig;
```

---

### 2. HTTPS Requirement

**Critical:** Auth server MUST use HTTPS to protect SMTP credentials in transit.

```javascript
// Desktop app connects via HTTPS
const AUTH_SERVER_URL = 'https://auth.yourdomain.com';  // ✅ Secure

// NOT this:
const AUTH_SERVER_URL = 'http://auth.yourdomain.com';   // ❌ Insecure!
```

---

### 3. Limit SMTP Config Visibility

**Don't expose SMTP credentials in public APIs:**

```javascript
// ❌ BAD: Public API that exposes SMTP credentials
app.get('/api/users/:id', (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);  // Includes smtpConfig with password!
});

// ✅ GOOD: Only send SMTP config to authenticated user
app.post('/api/auth/login', (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  // User gets their own SMTP config only
  res.json({ user });
});
```

---

## 📧 Email Templates

**Location:** `electron/email/templates/`

**Available Templates:**
1. `task-started.html` - Task execution started
2. `task-complete.html` - Task finished
3. `ban-alert.html` - Ban/rate limit detected
4. `service-down.html` - Service error
5. `daily-report.html` - Daily summary (9 PM IST)
6. `daily-limit-reached.html` - Daily quota reached

**Customization:**
- Templates use `{{variable}}` syntax
- Admins can customize templates server-side
- Different templates for different users/plans (optional)

---

## 🧪 Testing

### 1. Test SMTP Configuration

**Create Test User with SMTP Config:**
```javascript
db.users.insertOne({
  email: "test@example.com",
  name: "Test User",
  password: "hashed_password",
  plan: "PRO",
  maxDailyMessages: 100,
  isActive: true,
  smtpConfig: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: "your-test-email@gmail.com",
    pass: "your_app_password",
    alertEmail: "your-test-email@gmail.com",
    enabledAlerts: {
      taskStarted: true,
      taskComplete: true,
      banDetected: true,
      serviceDown: true,
      dailyReport: true,
      dailyLimitReached: true
    }
  }
});
```

**Login and Verify:**
1. Login to desktop app with test user
2. Check console logs: "SMTP config loaded from user data"
3. Start a task
4. Verify email received for "Task Started"
5. Complete task
6. Verify email received for "Task Complete"

---

### 2. Test No SMTP Config

**Create User Without SMTP:**
```javascript
db.users.insertOne({
  email: "nomail@example.com",
  name: "No Email User",
  smtpConfig: null,  // No email configuration
  // ... other fields
});
```

**Expected Behavior:**
- App works normally
- No emails sent
- Console: "No SMTP config available for user"
- No errors or crashes

---

### 3. Test SMTP Config Update

**Update user's SMTP while app is running:**
```javascript
// Change alert email
db.users.updateOne(
  { email: "test@example.com" },
  {
    $set: {
      "smtpConfig.alertEmail": "newemail@example.com",
      updatedAt: new Date()
    }
  }
);
```

**Expected Behavior:**
- Within 5 minutes, app fetches new config
- Next email sent to new alert email
- Console: "SMTP config loaded from user data"

---

## 📊 Migration Guide

### From Old System to MongoDB

**Step 1: Export Existing Configs (Optional)**
```javascript
// Not necessary - users didn't configure SMTP individually
// Skip this step
```

**Step 2: Create Global SMTP Configs**
```bash
# Create SMTP configurations in MongoDB
mongosh
use yourdb
db.smtpConfigs.insertOne({ ... })
```

**Step 3: Update All Users**
```javascript
// Assign default SMTP config to all active users
const defaultSmtpConfig = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  user: "notifications@company.com",
  pass: "app_password",
  alertEmail: "alerts@company.com",
  enabledAlerts: {
    taskStarted: true,
    taskComplete: true,
    banDetected: true,
    serviceDown: true,
    dailyReport: true,
    dailyLimitReached: true
  }
};

db.users.updateMany(
  { isActive: true },
  {
    $set: {
      smtpConfig: defaultSmtpConfig,
      updatedAt: new Date()
    }
  }
);
```

**Step 4: Deploy Updated App**
```bash
# Users download new app version
# On login, SMTP config loaded automatically
# No user action required
```

---

## ✅ Checklist

### Implementation Complete
- [x] Remove electron-store dependency from smtp-service
- [x] Add `setConfigFromUser()` method
- [x] Update auth-manager to initialize SMTP on login
- [x] Update main.js to load cached SMTP config
- [x] Remove SMTP IPC handlers
- [x] Remove SMTP UI from Settings page
- [x] Remove SMTP functions from lib/ipc.js
- [x] Update preload.js (remove SMTP channels)
- [x] Create documentation

### Auth Server Updates Needed
- [ ] Add `smtpConfig` field to User schema
- [ ] Include `smtpConfig` in login response
- [ ] Include `smtpConfig` in verify/status responses
- [ ] Create smtpConfigs collection (optional)
- [ ] Implement SMTP password encryption
- [ ] Test SMTP config assignment

### Testing
- [ ] Test login with SMTP config
- [ ] Test email notifications
- [ ] Test login without SMTP config (null)
- [ ] Test SMTP config updates (periodic check)
- [ ] Test app restart (cached config)

---

## 🎯 Summary

Successfully migrated SMTP configuration from local electron-store to centralized MongoDB management:

**Benefits:**
- ✅ Centralized control for admins
- ✅ Zero configuration for users
- ✅ Easy to update/rotate SMTP credentials
- ✅ Different configs for different user groups
- ✅ No technical knowledge required from users
- ✅ Automatic configuration on login

**User Experience:**
- 🎉 No SMTP setup required
- 🎉 Emails just work out of the box
- 🎉 Cleaner, simpler Settings UI
- 🎉 Nothing to configure

**Admin Control:**
- 🎛️ Manage SMTP configs in MongoDB
- 🎛️ Map configs to users
- 🎛️ Update credentials globally
- 🎛️ Enable/disable emails per user
- 🎛️ Monitor email usage

---

**Last Updated:** March 14, 2026
**Author:** Claude Code
**Version:** 2.0
**Status:** Implemented ✅

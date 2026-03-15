# WhaSender Documentation Index

Complete documentation for the WhaSender WhatsApp bulk messaging system.

---

## 📚 Documentation Structure

```
docs/
├── deployment/          # Build, release, and distribution guides
├── guides/             # Usage and integration guides
├── features/           # Feature-specific documentation
└── archive/            # Legacy and completion summaries
```

---

## 🚀 Getting Started

### Quick Start Guides

- **[Main README](../README.md)** - Project overview and quick start
- **[Testing Guide](guides/TESTING-GUIDE.md)** - How to test the complete system
- **[UI Integration Guide](guides/UI-INTEGRATION-GUIDE.md)** - Frontend integration reference

### Component Documentation

- **[WhaSender App](../app/README.md)** - Desktop application
- **[Auth Server](../auth-server/README.md)** - Authentication server
- **[Admin Portal](../admin-portal/README.md)** - Admin dashboard

---

## 📦 Deployment & Distribution

### Essential Reading

1. **[Quick Start Release](deployment/QUICK-START-RELEASE.md)** ⭐ START HERE
   - One-time setup (5 minutes)
   - Build and publish commands
   - Distribution to clients

2. **[Deployment Overview](deployment/README-DEPLOYMENT.md)**
   - Complete system overview
   - Auto-update system explained
   - Configuration guide

3. **[Deployment Guide](deployment/DEPLOYMENT-GUIDE.md)**
   - Complete reference (400+ lines)
   - Cross-platform building
   - Code signing
   - Advanced configuration

4. **[Private Repo Setup](deployment/PRIVATE-REPO-SETUP.md)**
   - Three implementation options
   - Security best practices
   - Bot account setup

### Quick Reference

**Build Commands:**
```bash
# Show version
node scripts/release.js version

# Bump and build
node scripts/release.js release patch mac

# Publish to GitHub
node scripts/release.js publish mac
```

**Configuration:**
- Version: `app/package.json`
- Updates: `app/electron/config/update-config.js`
- Environment: `app/.env.example`

---

## 🎯 Features

### Core Features

- **[Video Sending Guide](features/VIDEO-SENDING-GUIDE.md)**
  - Send videos, images, and documents
  - File size limits and formats
  - Media captions

- **[Video Implementation Summary](features/VIDEO-SENDING-IMPLEMENTATION-SUMMARY.md)**
  - Technical implementation details
  - Database schema changes
  - Backend and frontend integration

- **[Variable Fix Summary](features/VARIABLE-FIX-SUMMARY.md)**
  - Message variable system ({{name}}, {{phone}})
  - Implementation details

### App-Specific Features

Located in `app/` directory:

- **[Message Variables](../app/MESSAGE-VARIABLES.md)** - Template variable system
- **[WhatsApp Formatting](../app/WHATSAPP-FORMATTING.md)** - Bold, italic, formatting
- **[Daily Limit System](../app/DAILY-LIMIT-SYSTEM.md)** - Ban prevention
- **[Account Control](../app/ACCOUNT-ACTIVE-CONTROL.md)** - License management
- **[SMTP Configuration](../app/SMTP-MONGODB-CONFIGURATION.md)** - Email reports
- **[Logging System](../app/LOGGING-SYSTEM.md)** - Comprehensive logging
- **[Error Handling](../app/ERROR-HANDLING.md)** - Error handling strategy
- **[Ban Prevention Research](../app/BAN-PREVENTION-RESEARCH.md)** - WhatsApp ban prevention

---

## 📖 Usage Guides

### Testing

- **[Testing Guide](guides/TESTING-GUIDE.md)**
  - Manual testing procedures
  - Test scenarios
  - What to verify

### Integration

- **[UI Integration Guide](guides/UI-INTEGRATION-GUIDE.md)**
  - Frontend/backend integration
  - IPC communication
  - State management

---

## 🏗️ Architecture

### Main Components

```
WhaSender System
├── WhaSender App (Electron + React)
│   ├── Frontend (React + Vite)
│   └── Backend (Node.js + SQLite)
├── Auth Server (Express + MongoDB)
└── Admin Portal (React + Vite)
```

### Data Flow

```
User ──► WhaSender App ──► Auth Server ──► MongoDB
                │
                ├──► WhatsApp API
                │
                └──► SQLite (Tasks, Logs, Contacts)
```

### Documentation by Component

**WhaSender App:**
- [Main README](../app/README.md)
- [Build Guide](../app/BUILD.md)
- [Testing Guide](../app/TESTING-GUIDE.md)
- [Feature Docs](../app/) (various .md files)

**Auth Server:**
- [Main README](../auth-server/README.md)
- [Deployment Guide](../auth-server/DEPLOYMENT.md)
- [Production Checklist](../auth-server/PRODUCTION-CHECKLIST.md)
- [Phase 10 Completion](../auth-server/PHASE-10-COMPLETION.md)

**Admin Portal:**
- [Main README](../admin-portal/README.md)
- [Quick Start](../admin-portal/QUICK-START.md)

---

## 🔧 Development

### Environment Setup

**Prerequisites:**
- Node.js 18+
- MongoDB 4.4+
- macOS/Windows/Linux

**Quick Start:**
```bash
# Terminal 1 - Auth Server
cd auth-server
npm install && npm run dev

# Terminal 2 - Admin Portal
cd admin-portal
npm install && npm run dev

# Terminal 3 - WhaSender App
cd app
npm install && npm run dev
```

### Database

**SQLite Migrations:**
- Location: `app/electron/database/migrations/`
- Auto-run on app start
- Versioned migration system

**MongoDB:**
- Used by auth server
- Stores user data, SMTP config
- Connection: `MONGODB_URI` in `.env`

---

## 📊 Implementation Details

### App Implementation Docs

Located in `app/` directory:

- **[Phase 9 Completion](../app/PHASE-9-COMPLETION.md)** - Media sending implementation
- **[Logging Implementation](../app/LOGGING-IMPLEMENTATION.md)** - Logging system
- **[Warmup Schedule Update](../app/WARMUP-SCHEDULE-UPDATE.md)** - Account warmup
- **[WhatsApp Features Update](../app/WHATSAPP-FEATURES-UPDATE.md)** - Feature updates

### Server Implementation Docs

Located in `auth-server/` directory:

- **[Phase 10 Completion](../auth-server/PHASE-10-COMPLETION.md)** - Auth system completion

---

## 🗂️ Archive

Historical and completion summaries:

- **[Project Complete](archive/PROJECT-COMPLETE.md)** - Project completion summary
- **[Test Script](archive/test-script.md)** - Testing scripts

---

## 📞 Quick Reference

### File Locations

**App:**
- Source: `app/src/` (frontend), `app/electron/` (backend)
- Config: `app/electron/config/`
- Database: `app/electron/database/`
- Scripts: `app/scripts/`
- Logs: `~/Library/Logs/WhaSender/` (macOS)

**Auth Server:**
- Source: `auth-server/src/`
- Models: `auth-server/src/models/`
- Routes: `auth-server/src/routes/`
- Config: `auth-server/.env`

**Admin Portal:**
- Source: `admin-portal/src/`
- Pages: `admin-portal/src/pages/`
- Components: `admin-portal/src/components/`

### Common Tasks

**Start Development:**
```bash
# See "Development" section above
```

**Build for Production:**
```bash
cd app
node scripts/release.js release patch mac
```

**Run Tests:**
```bash
# See Testing Guide
cat docs/guides/TESTING-GUIDE.md
```

**Deploy Updates:**
```bash
# See Quick Start Release
cat docs/deployment/QUICK-START-RELEASE.md
```

---

## 🔍 Finding Documentation

### By Topic

- **Getting Started** → Main README, Component READMEs
- **Building & Releasing** → deployment/ folder
- **Features** → features/ folder + app/ folder
- **Usage** → guides/ folder
- **Troubleshooting** → Component READMEs

### By Component

- **WhaSender App** → `app/README.md` + `app/*.md`
- **Auth Server** → `auth-server/README.md` + `auth-server/*.md`
- **Admin Portal** → `admin-portal/README.md` + `admin-portal/*.md`

### By Role

**Developer:**
1. Main README
2. Component READMEs
3. UI Integration Guide
4. Implementation docs in app/

**DevOps/Deployment:**
1. Quick Start Release
2. Deployment Guide
3. Private Repo Setup
4. Production Checklist (auth-server)

**End User:**
1. Installation instructions (in built app)
2. Feature guides (Video Sending, etc.)
3. Testing Guide (for validation)

---

## 📝 Documentation Standards

### File Organization

- **Root:** Main README + master docs index
- **docs/deployment:** Build, release, distribution
- **docs/guides:** Usage and integration
- **docs/features:** Feature-specific docs
- **docs/archive:** Historical summaries
- **Component folders:** Component-specific docs

### Naming Convention

- `README.md` - Main documentation for a component
- `QUICK-START-*.md` - Quick start guides
- `*-GUIDE.md` - Comprehensive guides
- `*-IMPLEMENTATION.md` - Technical implementation
- `*-COMPLETION.md` - Phase/feature completion summaries

---

## 🎉 Getting Help

### Documentation Not Found?

1. **Check INDEX.md** (this file) for all docs
2. **Search by keyword** in appropriate folder
3. **Check component README** files
4. **Review archive/** for legacy docs

### Need More Help?

- Check component-specific documentation
- Review logs (see "File Locations" above)
- Refer to troubleshooting sections in guides

---

**Last Updated:** 2026-03-15

**Documentation Version:** 1.0.0

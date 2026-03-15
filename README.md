# WhaSender - WhatsApp Bulk Messaging System

Professional WhatsApp bulk messaging desktop application with admin dashboard and user management.

---

## 📋 Project Overview

WhaSender is a complete WhatsApp automation solution consisting of three main components:

1. **WhaSender App** - Desktop application (Electron + React)
2. **Auth Server** - User authentication & management (Express + MongoDB)
3. **Admin Portal** - Web dashboard for user management (React + Vite)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      WhaSender System                        │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  WhaSender App   │◄────►│   Auth Server    │◄────►│  Admin Portal    │
│   (Electron)     │      │  (Express API)   │      │   (React SPA)    │
│                  │      │                  │      │                  │
│  - Desktop UI    │      │  - User Auth     │      │  - User Mgmt     │
│  - WhatsApp API  │      │  - License Check │      │  - Analytics     │
│  - Task Manager  │      │  - SMTP Config   │      │  - Settings      │
│  - SQLite DB     │      │  - MongoDB       │      │  - Dashboard     │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        ▲                         ▲                         ▲
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                         Port 3001 (API)
                         Port 5001 (Admin)
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 4.4+ (for auth server)
- **macOS** (for building Mac apps) or **Windows** (for Windows builds)

### 1. Clone Repository

```bash
git clone https://github.com/YOUR-USERNAME/whasender.git
cd whasender
```

### 2. Start Auth Server

```bash
cd auth-server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm run dev
# Server runs on http://localhost:3001
```

### 3. Start Admin Portal

```bash
cd admin-portal
npm install
npm run dev
# Portal runs on http://localhost:5001
```

### 4. Start WhaSender App

```bash
cd app
npm install
npm run dev
# App launches in Electron window
```

---

## 📦 Project Structure

```
whasender/
│
├── app/                          # Main Desktop Application
│   ├── electron/                 # Backend (Node.js)
│   │   ├── main.js              # App entry point
│   │   ├── preload.js           # IPC bridge
│   │   ├── database/            # SQLite database
│   │   ├── whatsapp/            # WhatsApp integration
│   │   ├── task/                # Task management
│   │   ├── email/               # Email reports
│   │   ├── auth/                # Authentication
│   │   ├── contacts/            # Contact management
│   │   └── media/               # Media file handling
│   ├── src/                     # Frontend (React)
│   │   ├── pages/               # Page components
│   │   ├── components/          # UI components
│   │   └── lib/                 # Utilities & API
│   ├── package.json             # Dependencies & build config
│   └── docs/                    # App documentation
│
├── auth-server/                  # Authentication Server
│   ├── src/
│   │   ├── routes/              # API endpoints
│   │   ├── models/              # MongoDB models
│   │   ├── middleware/          # Auth middleware
│   │   └── utils/               # Utilities
│   ├── package.json
│   └── README.md
│
├── admin-portal/                 # Admin Dashboard
│   ├── src/
│   │   ├── pages/               # Dashboard pages
│   │   ├── components/          # UI components
│   │   └── lib/                 # API client
│   ├── package.json
│   └── README.md
│
└── docs/                         # Project Documentation
    ├── deployment/               # Deployment guides
    ├── guides/                   # User guides
    └── features/                 # Feature docs
```

---

## 📚 Documentation

### Getting Started

- **[Quick Start Guide](#-quick-start)** - Get up and running in 5 minutes
- **[Testing Guide](TESTING-GUIDE.md)** - How to test the complete system
- **[UI Integration Guide](UI-INTEGRATION-GUIDE.md)** - Frontend integration reference

### Components

- **[WhaSender App](app/README.md)** - Desktop application documentation
- **[Auth Server](auth-server/README.md)** - Authentication server setup
- **[Admin Portal](admin-portal/README.md)** - Admin dashboard guide

### Deployment

- **[Quick Start Release](QUICK-START-RELEASE.md)** - Release in 2 minutes
- **[Deployment Guide](DEPLOYMENT-GUIDE.md)** - Complete deployment reference
- **[Private Repo Setup](PRIVATE-REPO-SETUP.md)** - For private GitHub repos
- **[README Deployment](README-DEPLOYMENT.md)** - Deployment overview

### Features

- **[Video Sending](VIDEO-SENDING-GUIDE.md)** - Send videos, images, documents
- **[Message Variables](app/MESSAGE-VARIABLES.md)** - Use {{name}} and {{phone}}
- **[WhatsApp Formatting](app/WHATSAPP-FORMATTING.md)** - Bold, italic, etc.
- **[Daily Limits](app/DAILY-LIMIT-SYSTEM.md)** - Prevent WhatsApp bans
- **[Account Control](app/ACCOUNT-ACTIVE-CONTROL.md)** - License management
- **[SMTP Configuration](app/SMTP-MONGODB-CONFIGURATION.md)** - Email reports
- **[Logging System](app/LOGGING-SYSTEM.md)** - Comprehensive logging

---

## ⚡ Key Features

### WhaSender App

✅ **WhatsApp Integration**
- Multi-device support (WhatsApp Web API)
- QR code login
- Session persistence
- Connection monitoring

✅ **Bulk Messaging**
- Upload contacts (CSV/Excel)
- Master contacts database
- Message templates with variables
- Scheduled campaigns
- Media support (video, image, document)

✅ **Task Management**
- Create and schedule tasks
- Pause/resume campaigns
- Real-time progress tracking
- Detailed logs and reports

✅ **Safety Features**
- Random delays between messages
- Daily message limits
- Account warmup system
- Ban prevention

✅ **Reporting**
- Email reports (task completion + daily)
- Detailed execution logs
- Success/failure statistics
- Export capabilities

### Auth Server

✅ **User Management**
- User registration & authentication
- JWT-based sessions
- License validation
- Account activation/deactivation

✅ **Configuration**
- Per-user SMTP settings
- Centralized settings management
- MongoDB storage

### Admin Portal

✅ **Dashboard**
- User overview
- System statistics
- Activity monitoring

✅ **User Management**
- Create/edit users
- Activate/deactivate accounts
- View user activity
- License management

---

## 🔧 Development

### Running in Development

**Terminal 1 - Auth Server:**
```bash
cd auth-server
npm run dev
```

**Terminal 2 - Admin Portal:**
```bash
cd admin-portal
npm run dev
```

**Terminal 3 - WhaSender App:**
```bash
cd app
npm run dev
```

### Environment Variables

**Auth Server (.env):**
```bash
MONGODB_URI=mongodb://localhost:27017/whasender
JWT_SECRET=your-secret-key
PORT=3001
```

**WhaSender App:**
- Configured via Admin Portal (SMTP, etc.)
- No .env needed for development

### Database Migrations

WhaSender uses automatic SQLite migrations:

```bash
cd app
# Migrations run automatically on app start
# Located in: electron/database/migrations/
```

---

## 📦 Building & Distribution

### Build for Production

**macOS:**
```bash
cd app
node scripts/release.js release patch mac
```

**Windows:**
```bash
cd app
node scripts/release.js release patch win
```

**Both:**
```bash
cd app
node scripts/release.js release patch all
```

### Publish Release

```bash
cd app
export GH_TOKEN="your_github_token"
node scripts/release.js publish mac
```

**See:** [QUICK-START-RELEASE.md](QUICK-START-RELEASE.md) for complete guide

---

## 🔄 Auto-Update System

WhaSender includes automatic updates via GitHub releases:

- ✅ Checks for updates every 6 hours
- ✅ Downloads in background
- ✅ Installs on restart
- ✅ Works with public & private repos

**Configuration:** `app/electron/config/update-config.js`

**See:** [README-DEPLOYMENT.md](README-DEPLOYMENT.md#-auto-update-system)

---

## 🧪 Testing

### Manual Testing

```bash
# See complete testing guide
cat TESTING-GUIDE.md
```

### Test Scenarios

1. **WhatsApp Connection** - QR code login
2. **Task Creation** - Upload contacts, create campaign
3. **Message Sending** - Test send functionality
4. **Media Upload** - Video/image/document sending
5. **Email Reports** - Task completion emails
6. **Admin Portal** - User management
7. **Auto-Updates** - Update detection & installation

---

## 🔐 Security

### Authentication

- JWT-based authentication
- Secure token storage (electron-store)
- HTTP-only session cookies (admin portal)
- License validation per request

### Data Storage

- Local SQLite database (encrypted)
- MongoDB for user data
- Secure credential storage
- No plaintext passwords

### WhatsApp Integration

- Official WhatsApp Web API
- No unofficial modifications
- Session encryption
- Automatic cleanup

---

## 🆘 Troubleshooting

### WhaSender App Won't Start

```bash
cd app
rm -rf node_modules
npm install
npm run postinstall  # Rebuild native modules
npm run dev
```

### Auth Server Connection Failed

1. Check MongoDB is running: `mongosh`
2. Verify .env configuration
3. Check port 3001 is available: `lsof -i :3001`

### WhatsApp Won't Connect

1. Scan QR code with phone
2. Keep phone connected to internet
3. Check firewall settings
4. Review logs: `~/Library/Logs/WhaSender/`

### Build Fails

```bash
cd app
rm -rf release dist
node scripts/release.js build mac
```

**More:** See component-specific README files

---

## 📊 System Requirements

### Development

- **Node.js:** 18.0 or higher
- **npm:** 9.0 or higher
- **MongoDB:** 4.4 or higher
- **macOS:** 10.15+ (for Mac builds)
- **Windows:** 10+ (for Windows builds)

### Production

**WhaSender App (Client):**
- macOS 10.15+ or Windows 10+
- 4GB RAM minimum
- 500MB disk space
- Internet connection

**Servers:**
- Node.js 18+ runtime
- MongoDB 4.4+
- 1GB RAM minimum (auth server)
- Linux/macOS/Windows server

---

## 🗺️ Roadmap

### Completed Features

- ✅ WhatsApp integration with Baileys
- ✅ Bulk messaging with Excel/CSV upload
- ✅ Master contacts database
- ✅ Media support (video, image, document)
- ✅ Message variables ({{name}}, {{phone}})
- ✅ Task scheduling and management
- ✅ Email reports with logs
- ✅ User authentication & licensing
- ✅ Admin portal
- ✅ Auto-update system
- ✅ Ban prevention features

### Potential Future Features

- [ ] Multi-account support (multiple WhatsApp numbers)
- [ ] Advanced analytics dashboard
- [ ] Custom message templates library
- [ ] WhatsApp group messaging
- [ ] API for external integrations
- [ ] Cloud backup/sync
- [ ] Mobile app (React Native)

---

## 📄 License

**Proprietary** - This software is proprietary. Distribution and usage rights are controlled by the license holder.

---

## 🤝 Contributing

This is a proprietary project. Contact the maintainer for contribution guidelines.

---

## 📞 Support

### Documentation

- **App Issues:** See [app/README.md](app/README.md)
- **Auth Server:** See [auth-server/README.md](auth-server/README.md)
- **Admin Portal:** See [admin-portal/README.md](admin-portal/README.md)
- **Deployment:** See [README-DEPLOYMENT.md](README-DEPLOYMENT.md)

### Logs

- **App Logs:** `~/Library/Logs/WhaSender/` (macOS)
- **App Database:** `~/Library/Application Support/whasender-app/`
- **Auth Server Logs:** `auth-server/logs/`

---

## 🎯 Quick Links

| Component | Dev Server | Production | Documentation |
|-----------|------------|------------|---------------|
| **WhaSender App** | `npm run dev` | Built app | [app/README.md](app/README.md) |
| **Auth Server** | http://localhost:3001 | Deployed server | [auth-server/README.md](auth-server/README.md) |
| **Admin Portal** | http://localhost:5001 | Deployed portal | [admin-portal/README.md](admin-portal/README.md) |

---

## 🎉 Getting Help

1. **Check Documentation** - See links above
2. **Review Logs** - Check app/server logs
3. **Testing Guide** - [TESTING-GUIDE.md](TESTING-GUIDE.md)
4. **Troubleshooting** - Component-specific READMEs

---

**Built with ❤️ using Electron, React, and WhatsApp Web API**

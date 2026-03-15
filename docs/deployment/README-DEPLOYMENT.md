# WhaSender - Deployment & Distribution Guide

Complete guide for building, releasing, and distributing WhaSender to your clients.

---

## 📚 Documentation Index

This project includes comprehensive deployment documentation:

1. **[QUICK-START-RELEASE.md](QUICK-START-RELEASE.md)** - Start here for daily releases
   - One-time setup (5 minutes)
   - Quick build & publish commands
   - Distribution to clients
   - Essential troubleshooting

2. **[DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)** - Complete reference guide
   - Detailed build instructions
   - Cross-platform building (Windows, Mac, Linux)
   - Code signing for production
   - Advanced configuration
   - Comprehensive troubleshooting

3. **[PRIVATE-REPO-SETUP.md](PRIVATE-REPO-SETUP.md)** - For private repositories
   - Three implementation options
   - Security best practices
   - Bot account setup
   - Complete examples

---

## 🚀 Quick Start (2 Minutes)

### Prerequisites

```bash
# 1. Install dependencies
cd app
npm install

# 2. Set GitHub token
export GH_TOKEN="ghp_your_github_token_here"
echo 'export GH_TOKEN="ghp_your_token"' >> ~/.zshrc

# 3. Configure repository
# Edit app/package.json:
# - Update "author" with your company name
# - Update "build.publish.owner" with your GitHub username
```

### First Release

```bash
cd app

# Bump version and build
node scripts/release.js release patch mac

# Test the build
open release/WhaSender-*.dmg

# Publish to GitHub
node scripts/release.js publish mac
```

**Done!** Your app is now published with auto-updates enabled.

---

## 🎯 Auto-Update System

WhaSender includes a **complete auto-update system** that works out of the box:

### How It Works

```
Developer (You)              Client Side
───────────────              ───────────
Build v1.0.1       ──────→   Using v1.0.0
Publish to GitHub            App checks for updates
                             "Update available: v1.0.1"
                             Downloads update
                             Installs on restart
                             Now on v1.0.1 ✓
```

### Configuration

All update settings are centralized in:
**`app/electron/config/update-config.js`**

```javascript
module.exports = {
  // GitHub repository settings
  github: {
    owner: 'your-github-username',  // ← Change this
    repo: 'whasender',
    private: false,  // Set true for private repos
    token: process.env.GH_UPDATE_TOKEN || '',
  },

  // Update behavior
  updater: {
    autoDownload: false,           // Ask user before downloading
    autoInstallOnAppQuit: true,    // Install on next restart
    checkOnStartup: true,          // Check on app startup
    startupDelay: 5000,            // Wait 5 seconds before first check
    checkInterval: 6 * 60 * 60 * 1000,  // Check every 6 hours
  },
};
```

### Features

✅ **Automatic Detection** - Checks for updates every 6 hours
✅ **User Control** - Asks before downloading (configurable)
✅ **Background Download** - Downloads in background with progress
✅ **Auto Install** - Installs automatically on app restart
✅ **Notifications** - Desktop notifications for updates
✅ **Error Handling** - Graceful fallback if update fails

---

## 📦 Build Commands Reference

### Using Release Script (Recommended)

```bash
# Show current version
node scripts/release.js version

# Bump version only
node scripts/release.js bump patch   # 1.0.0 → 1.0.1
node scripts/release.js bump minor   # 1.0.0 → 1.1.0
node scripts/release.js bump major   # 1.0.0 → 2.0.0

# Build for specific platform
node scripts/release.js build mac
node scripts/release.js build win
node scripts/release.js build all

# Bump + Build in one command
node scripts/release.js release patch mac

# Build + Publish to GitHub
node scripts/release.js publish mac
```

### Using npm Scripts

```bash
# Build for macOS (Intel + Apple Silicon)
npm run build:mac

# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux

# Build for all platforms
npm run build:all
```

---

## 🔐 Private Repository Setup

If you want to keep your source code private:

**Quick Setup:**

1. Set repository to private on GitHub
2. Create a bot account (e.g., `whasender-bot`)
3. Add bot to your private repo with **Read** access
4. Generate read-only token from bot account
5. Update `app/electron/config/update-config.js`:

```javascript
github: {
  owner: 'your-username',
  repo: 'whasender',
  private: true,  // ← Set to true
  token: 'ghp_bot_readonly_token',  // ← Add bot token
}
```

**Complete Guide:** See [PRIVATE-REPO-SETUP.md](PRIVATE-REPO-SETUP.md)

---

## 📤 Distribution Methods

### Option 1: GitHub Releases (Recommended)

Share this link with clients:
```
https://github.com/YOUR-USERNAME/whasender/releases/latest
```

**Pros:**
- ✅ Always latest version
- ✅ Auto-updates work automatically
- ✅ No manual distribution

### Option 2: Direct File Sharing

Download from `app/release/` and share via:
- Email (if under 25MB)
- Google Drive / Dropbox
- Your own website
- USB drive

**Pros:**
- ✅ Full control over distribution
- ✅ Works without GitHub account
- ✅ Auto-updates still work

---

## 🔄 Update Workflow

### Releasing Updates

```bash
# 1. Make your changes
# ... code changes ...

# 2. Test locally
npm run dev

# 3. Bump version and build
node scripts/release.js release patch mac

# 4. Test the built app
open release/WhaSender-*.dmg

# 5. Commit changes
git add .
git commit -m "Release v1.0.1"
git push

# 6. Publish to GitHub
node scripts/release.js publish mac
```

### Client Updates

**Automatic (Default):**
1. Client's app checks for updates every 6 hours
2. Notification: "Update available: v1.0.1"
3. Client clicks "Download"
4. Update downloads in background
5. Client restarts app
6. Update installs automatically

**Manual:**
1. Client goes to Help → Check for Updates
2. Download and install

---

## 🏗️ Project Structure

```
whasender/
├── app/                              # Main Electron app
│   ├── electron/                     # Backend (Node.js)
│   │   ├── main.js                   # App entry point
│   │   ├── config/
│   │   │   └── update-config.js      # ← Update configuration
│   │   ├── database/
│   │   │   └── migrations/           # Database migrations
│   │   ├── whatsapp/                 # WhatsApp integration
│   │   ├── task/                     # Task management
│   │   └── email/                    # Email reports
│   ├── src/                          # Frontend (React)
│   ├── package.json                  # ← Version & build config
│   ├── scripts/
│   │   └── release.js                # ← Release automation
│   └── release/                      # Build output (gitignored)
│
├── auth-server/                      # Authentication server
├── admin-portal/                     # Admin dashboard
│
├── QUICK-START-RELEASE.md            # ← Start here
├── DEPLOYMENT-GUIDE.md               # Complete reference
├── PRIVATE-REPO-SETUP.md             # Private repo guide
└── README-DEPLOYMENT.md              # This file
```

---

## 🛠️ Configuration Files

### 1. Package Configuration
**`app/package.json`**
- App version
- Author information
- GitHub repository
- Build settings

### 2. Update Configuration
**`app/electron/config/update-config.js`**
- GitHub settings
- Update behavior
- Check intervals
- Custom server (optional)

### 3. Environment Variables
**`app/.env.example`** (template)
```bash
# Publishing (your admin token)
GH_TOKEN=ghp_your_admin_token

# Updates (bot read-only token, for private repos only)
GH_UPDATE_TOKEN=ghp_bot_readonly_token
```

---

## ✅ Pre-Release Checklist

Before publishing a release:

- [ ] All features tested locally
- [ ] Database migrations tested
- [ ] Updated version in package.json
- [ ] Release notes prepared
- [ ] All changes committed to git
- [ ] Build completes without errors
- [ ] Built app tested on clean machine
- [ ] GH_TOKEN environment variable set
- [ ] GitHub repository configured

---

## 🔧 Troubleshooting

### "GH_TOKEN not set"

```bash
export GH_TOKEN="your_token_here"
echo 'export GH_TOKEN="ghp_xxx"' >> ~/.zshrc
source ~/.zshrc
```

### "Updates not detecting"

1. Check `latest-mac.yml` exists in GitHub release
2. Verify version number increased
3. Check network/firewall
4. Review logs: `~/Library/Logs/WhaSender/`

### "Build fails"

```bash
cd app
rm -rf node_modules release dist
npm install
npm run postinstall
node scripts/release.js build mac
```

### More Help

- **Quick fixes:** [QUICK-START-RELEASE.md](QUICK-START-RELEASE.md#troubleshooting)
- **Complete guide:** [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md#troubleshooting)
- **Private repos:** [PRIVATE-REPO-SETUP.md](PRIVATE-REPO-SETUP.md#troubleshooting)

---

## 📞 Support

### Documentation

- **Daily releases:** [QUICK-START-RELEASE.md](QUICK-START-RELEASE.md)
- **Complete guide:** [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md)
- **Private repos:** [PRIVATE-REPO-SETUP.md](PRIVATE-REPO-SETUP.md)

### Logs Location

- **macOS:** `~/Library/Logs/WhaSender/`
- **Windows:** `%APPDATA%/WhaSender/logs/`
- **Linux:** `~/.config/WhaSender/logs/`

### Database Location

- **macOS:** `~/Library/Application Support/whasender-app/`
- **Windows:** `%APPDATA%/whasender-app/`
- **Linux:** `~/.config/whasender-app/`

---

## 🎉 Summary

WhaSender includes a **production-ready deployment system**:

✅ **Automated builds** - One command to build and publish
✅ **Auto-updates** - Clients get updates automatically
✅ **Public & private repos** - Works with both
✅ **Cross-platform** - macOS, Windows, Linux
✅ **Code signing ready** - Production certificates supported
✅ **Comprehensive docs** - Step-by-step guides

**Next Steps:**

1. Read [QUICK-START-RELEASE.md](QUICK-START-RELEASE.md) for first-time setup
2. Build and publish your first release
3. Distribute to clients
4. Enjoy automatic updates!

---

**Ready to ship!** 🚀

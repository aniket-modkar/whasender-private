# WhaSender Deployment & Release Guide

Complete guide for building, distributing, and managing updates for WhaSender desktop app.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Building for Production](#building-for-production)
3. [Release Management with GitHub](#release-management-with-github)
4. [Auto-Update System](#auto-update-system)
5. [Distribution to Clients](#distribution-to-clients)
6. [Code Signing](#code-signing)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **Git** (for GitHub releases)
   ```bash
   git --version
   ```

3. **GitHub Account** (for hosting releases and auto-updates)

4. **Platform-Specific Requirements:**

   **macOS:**
   - Xcode Command Line Tools
   - Apple Developer Account (for code signing)
   ```bash
   xcode-select --install
   ```

   **Windows:**
   - Windows 10/11
   - Visual Studio Build Tools (optional, for native modules)

---

## Building for Production

### Step 1: Prepare Your App

1. **Update Version Number**

   Edit `app/package.json`:
   ```json
   {
     "version": "1.0.0"  // Increment for each release: 1.0.1, 1.1.0, 2.0.0
   }
   ```

2. **Update Author Information**

   ```json
   {
     "author": {
       "name": "Your Name/Company",
       "email": "support@yourcompany.com"
     }
   }
   ```

3. **Configure GitHub Repository**

   Edit `app/package.json` build section:
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "owner": "your-github-username",
         "repo": "whasender"
       }
     }
   }
   ```

### Step 2: Build Commands

Navigate to app directory:
```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender/app
```

#### Build for Current Platform Only

**macOS:**
```bash
npm run build:mac
```
**Outputs:**
- `release/WhaSender-1.0.0.dmg` (installer)
- `release/WhaSender-1.0.0-mac.zip` (portable)

**Windows (from Mac using Wine):**
```bash
npm run build:win
```
**Outputs:**
- `release/WhaSender Setup 1.0.0.exe` (installer)
- `release/WhaSender 1.0.0.exe` (portable)

#### Build for All Platforms

```bash
npm run build:all
```

**Note:** Building Windows on Mac requires Wine:
```bash
brew install --cask wine-stable
```

### Step 3: Test the Built App

Before releasing, test the built application:

**macOS:**
```bash
open release/WhaSender-1.0.0.dmg
```

**Windows:**
- Run `WhaSender Setup 1.0.0.exe`
- Test on actual Windows machine

**Check:**
- ✅ App launches correctly
- ✅ Database migrations run
- ✅ WhatsApp connection works
- ✅ Task creation and execution works
- ✅ Settings are saved
- ✅ Auto-update check works

---

## Release Management with GitHub

### Step 1: Create GitHub Repository

1. Create a **public** repository on GitHub:
   ```
   https://github.com/your-username/whasender
   ```

2. Initialize git in your project:
   ```bash
   cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/whasender.git
   git push -u origin main
   ```

### Step 2: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `WhaSender Release Token`
4. Scopes: Select **`repo`** (all)
5. Click **"Generate token"**
6. **SAVE THE TOKEN** (you won't see it again)

### Step 3: Set Environment Variable

**macOS/Linux:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
export GH_TOKEN="your_github_token_here"

# Reload shell
source ~/.zshrc
```

**Windows:**
```cmd
setx GH_TOKEN "your_github_token_here"
```

### Step 4: Publish Release

1. **Build and Publish:**
   ```bash
   cd app
   npm run build:mac  # or build:win or build:all
   npx electron-builder --mac --publish always
   ```

2. **This will:**
   - Build the app
   - Create a GitHub Release
   - Upload installer files
   - Generate `latest-mac.yml` (update manifest)

3. **GitHub Release Created:**
   - URL: `https://github.com/your-username/whasender/releases`
   - Tag: `v1.0.0`
   - Files: DMG, ZIP, latest-mac.yml

### Step 5: Manual Release (Alternative)

If automatic publish fails:

1. Build locally:
   ```bash
   npm run build:mac
   ```

2. Go to: `https://github.com/your-username/whasender/releases/new`

3. Fill in:
   - **Tag:** `v1.0.0`
   - **Title:** `WhaSender v1.0.0`
   - **Description:** Release notes

4. Upload files from `release/` folder:
   - `WhaSender-1.0.0.dmg`
   - `WhaSender-1.0.0-mac.zip`
   - `latest-mac.yml` (REQUIRED for auto-updates)

5. Click **"Publish release"**

---

## Auto-Update System

### How It Works

1. **App checks for updates:**
   - On startup (after 5 seconds)
   - Every 6 hours automatically

2. **Checks GitHub releases:**
   - Looks at `latest-mac.yml` or `latest.yml`
   - Compares current version with latest

3. **If update available:**
   - Shows notification to user
   - User can download update
   - Auto-installs on app quit

### Update Flow for Users

```
┌─────────────────────────────────────┐
│  App starts                         │
│  Current version: 1.0.0             │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Check GitHub releases              │
│  Found: v1.0.1                      │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Show notification:                 │
│  "Update available: v1.0.1"         │
│  [Download] [Later]                 │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  User clicks Download               │
│  Progress bar shows download        │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Download complete                  │
│  "Update ready. Restart to install" │
│  [Restart Now] [Later]              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  App restarts                       │
│  Update installs automatically      │
│  App opens with version 1.0.1       │
└─────────────────────────────────────┘
```

### Configure Update Settings

Edit `app/electron/main.js`:

```javascript
autoUpdater.autoDownload = false;  // Ask user before downloading
autoUpdater.autoInstallOnAppQuit = true;  // Auto-install on quit
```

**Options:**
- `autoDownload: true` - Download updates silently
- `autoDownload: false` - Ask user first (recommended)
- `autoInstallOnAppQuit: true` - Install when app closes
- `autoInstallOnAppQuit: false` - Ask user to restart

### Testing Auto-Updates

1. **Build version 1.0.0** and publish to GitHub
2. **Install 1.0.0** on test machine
3. **Build version 1.0.1** and publish to GitHub
4. **Open 1.0.0 app** - should detect update available
5. **Click download** - should download and prompt to restart
6. **Restart app** - should install and show 1.0.1

### Update Channels

For beta testing:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-username",
      "repo": "whasender",
      "channel": "beta"  // Add this
    }
  }
}
```

Then publish with:
```bash
npx electron-builder --mac --publish always --prerelease
```

---

## Distribution to Clients

### Option 1: Direct Download (Recommended for Clients)

**Pros:**
- Simple for clients
- No GitHub account needed
- Works offline after download

**Distribution:**

1. **Upload to your own server:**
   ```
   https://yourwebsite.com/downloads/WhaSender-1.0.0.dmg
   ```

2. **Share via:**
   - Email
   - Dropbox/Google Drive
   - Your website

3. **Installation instructions:**
   ```
   macOS:
   1. Download WhaSender-1.0.0.dmg
   2. Open DMG file
   3. Drag WhaSender to Applications folder
   4. Open from Applications

   Windows:
   1. Download WhaSender Setup 1.0.0.exe
   2. Run installer
   3. Follow installation wizard
   4. Launch from Start Menu
   ```

**Auto-updates will still work** (clients get updates from GitHub)

### Option 2: GitHub Releases (For Tech-Savvy Users)

Share GitHub releases link:
```
https://github.com/your-username/whasender/releases/latest
```

### Option 3: Private Distribution

For paid/private clients:

1. **Use GitHub Private Repo:**
   ```json
   {
     "build": {
       "publish": {
         "provider": "github",
         "owner": "your-username",
         "repo": "whasender-private",
         "private": true,
         "token": "${GH_TOKEN}"
       }
     }
   }
   ```

2. **Clients need:**
   - GitHub account added to repo
   - Personal access token configured

### Option 4: Custom Update Server

For full control:

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://yourserver.com/updates/"
    }
  }
}
```

Host files on your server:
```
/updates/
  ├── latest-mac.yml
  ├── WhaSender-1.0.0.dmg
  └── WhaSender-1.0.0-mac.zip
```

---

## Code Signing

### Why Code Sign?

**macOS:**
- Without signing: "App is from unidentified developer"
- Users must right-click > Open to bypass Gatekeeper
- **Notarization required** for macOS 10.15+

**Windows:**
- Without signing: "Windows protected your PC" warning
- Users must click "More info" > "Run anyway"

### macOS Code Signing

**Requirements:**
1. Apple Developer Account ($99/year)
2. Developer ID Application certificate

**Steps:**

1. **Get Certificate:**
   - Join Apple Developer Program
   - Xcode > Preferences > Accounts > Manage Certificates
   - Create "Developer ID Application" certificate

2. **Configure:**

   Edit `app/package.json`:
   ```json
   {
     "build": {
       "mac": {
         "identity": "Developer ID Application: Your Name (TEAM_ID)",
         "hardenedRuntime": true,
         "gatekeeperAssess": false,
         "entitlements": "build/entitlements.mac.plist",
         "entitlementsInherit": "build/entitlements.mac.plist"
       }
     }
   }
   ```

3. **Notarize:**

   ```bash
   # Build and notarize
   export APPLE_ID="your@apple.id"
   export APPLE_ID_PASSWORD="app-specific-password"
   export APPLE_TEAM_ID="TEAM_ID"

   npm run build:mac
   ```

   electron-builder will automatically notarize if credentials are set.

### Windows Code Signing

**Requirements:**
1. Code signing certificate (from DigiCert, Sectigo, etc.)
2. Certificate file (.pfx)

**Configure:**

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "password",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

Or use environment variables:
```bash
export CSC_LINK="/path/to/certificate.pfx"
export CSC_KEY_PASSWORD="password"
npm run build:win
```

---

## Troubleshooting

### Build Issues

**Error: "Cannot find module 'better-sqlite3'"**
```bash
cd app
npm run postinstall
```

**Error: "App built but won't launch"**
- Check console logs: `~/Library/Logs/WhaSender/`
- Verify migrations are in `resources/migrations/`

**Error: "GitHub publish failed"**
```bash
# Check token
echo $GH_TOKEN

# Verify repo access
gh repo view your-username/whasender
```

### Auto-Update Issues

**Updates not detecting:**

1. **Check latest-mac.yml exists in release:**
   ```
   https://github.com/user/repo/releases/download/v1.0.0/latest-mac.yml
   ```

2. **Verify app can reach GitHub:**
   - Check firewall settings
   - Check internet connection

3. **Check logs:**
   ```javascript
   // Add in main.js
   autoUpdater.logger = require('electron-log');
   autoUpdater.logger.transports.file.level = 'info';
   ```

**Update downloads but won't install:**
- Check app permissions
- Try running as administrator (Windows)
- Check disk space

### Distribution Issues

**macOS: "App is damaged and can't be opened"**

Users should run:
```bash
xattr -cr /Applications/WhaSender.app
```

Or you need to code sign the app.

**Windows: SmartScreen blocks app**

Users should click "More info" > "Run anyway"

Or get code signing certificate.

---

## Release Checklist

### Before Each Release

- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md with changes
- [ ] Test on clean machine
- [ ] Test database migrations
- [ ] Test auto-update from previous version
- [ ] Run `npm audit` for security issues
- [ ] Update README if needed

### Build Process

- [ ] Clean previous builds: `rm -rf release/`
- [ ] Build for target platforms
- [ ] Test built apps
- [ ] Verify file sizes reasonable
- [ ] Check all features work

### Publishing

- [ ] Create GitHub release
- [ ] Upload all files (DMG, EXE, yml files)
- [ ] Write release notes
- [ ] Tag release with version (v1.0.0)
- [ ] Mark as latest release
- [ ] Notify clients

### Post-Release

- [ ] Monitor for issues
- [ ] Check auto-update working for users
- [ ] Respond to user feedback
- [ ] Plan next release

---

## Quick Reference

### Version Numbering

Follow semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (1.0.0 → 2.0.0)
- **MINOR**: New features (1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (1.0.0 → 1.0.1)

### Build Commands

```bash
# Single platform
npm run build:mac     # macOS only
npm run build:win     # Windows only
npm run build:linux   # Linux only

# All platforms
npm run build:all

# Build and publish to GitHub
npx electron-builder --mac --publish always
npx electron-builder --win --publish always
```

### File Sizes

Approximate sizes:
- **macOS DMG:** ~150-200 MB
- **macOS ZIP:** ~150-200 MB
- **Windows Setup:** ~120-150 MB
- **Windows Portable:** ~150-180 MB

### Support

For issues:
- GitHub Issues: `https://github.com/your-username/whasender/issues`
- Email: support@yourcompany.com

---

## Next Steps

1. **Set up GitHub repository**
2. **Configure GH_TOKEN**
3. **Build first release (v1.0.0)**
4. **Test auto-updates**
5. **Distribute to clients**
6. **Monitor and iterate**

Good luck with your releases! 🚀

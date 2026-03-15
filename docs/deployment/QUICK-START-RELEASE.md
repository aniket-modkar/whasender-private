# Quick Start: Release & Distribution

Fast guide to build and release WhaSender to your clients.

---

## 🚀 First Time Setup (Do Once)

### 1. Create GitHub Repository

```bash
# Navigate to project
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR-USERNAME/whasender.git
git push -u origin main
```

### 2. Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Name: `WhaSender Releases`
4. Select scope: **`repo`** (full access)
5. Generate and **COPY TOKEN**

### 3. Set Token as Environment Variable

**macOS/Linux:**
```bash
# Add to ~/.zshrc or ~/.bash_profile
echo 'export GH_TOKEN="ghp_your_token_here"' >> ~/.zshrc
source ~/.zshrc

# Verify
echo $GH_TOKEN
```

**Windows:**
```cmd
setx GH_TOKEN "ghp_your_token_here"
# Restart terminal
echo %GH_TOKEN%
```

### 4. Update package.json

Edit `app/package.json`:

```json
{
  "author": {
    "name": "Your Company Name",
    "email": "support@yourcompany.com"
  },
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR-GITHUB-USERNAME",  // ← Change this
      "repo": "whasender"               // ← Change if different
    }
  }
}
```

---

## 📦 Building & Releasing

### Quick Commands

```bash
cd app

# Show current version
node scripts/release.js version

# Bump version and build
node scripts/release.js release patch mac    # For bug fixes
node scripts/release.js release minor mac    # For new features
node scripts/release.js release major mac    # For breaking changes

# Publish to GitHub (auto-updates enabled)
node scripts/release.js publish mac
```

### Full Release Process

**Step 1: Bump Version & Build**

```bash
cd app
node scripts/release.js release patch mac
```

This will:
- ✅ Update version (1.0.0 → 1.0.1)
- ✅ Build macOS app
- ✅ Create installers in `release/` folder

**Step 2: Test the Build**

```bash
open release/WhaSender-*.dmg
```

Test:
- App launches
- WhatsApp connects
- Tasks work
- Settings save

**Step 3: Commit Changes**

```bash
git add .
git commit -m "Release v1.0.1"
git push
```

**Step 4: Publish to GitHub**

```bash
node scripts/release.js publish mac
```

This will:
- ✅ Build the app again
- ✅ Create GitHub release
- ✅ Upload installers
- ✅ Generate update manifest (latest-mac.yml)
- ✅ Enable auto-updates for users

**Step 5: Verify Release**

Go to: `https://github.com/YOUR-USERNAME/whasender/releases`

You should see:
- ✅ Release v1.0.1
- ✅ WhaSender-1.0.1.dmg
- ✅ WhaSender-1.0.1-mac.zip
- ✅ latest-mac.yml

---

## 📤 Distributing to Clients

### Option 1: GitHub Releases (Easiest)

**Share this link with clients:**
```
https://github.com/YOUR-USERNAME/whasender/releases/latest
```

**Installation Instructions (send to clients):**

```
macOS Installation:

1. Download WhaSender-X.X.X.dmg
2. Open the DMG file
3. Drag WhaSender to Applications folder
4. Open from Applications
5. If security warning appears:
   - Go to System Settings > Privacy & Security
   - Click "Open Anyway"

Windows Installation:

1. Download WhaSender Setup X.X.X.exe
2. Run the installer
3. Follow installation wizard
4. Launch from Start Menu
5. If SmartScreen warning appears:
   - Click "More info"
   - Click "Run anyway"
```

### Option 2: Direct File Sharing

Download installers from:
```
app/release/WhaSender-1.0.1.dmg
app/release/WhaSender Setup 1.0.1.exe
```

Share via:
- Email (if under 25MB)
- Google Drive / Dropbox
- Your own website
- USB drive

**Auto-updates still work!** Clients will get updates from GitHub.

---

## 🔄 Auto-Updates for Clients

### How It Works

1. **Client installs v1.0.0**
2. **You release v1.0.1** to GitHub
3. **Client's app checks** for updates (every 6 hours)
4. **Notification shows:** "Update available: v1.0.1"
5. **Client clicks download**
6. **Update installs** on next restart

**No action needed from you!** Updates are automatic.

### Update Flow

```
Your Side:                          Client Side:
───────────                         ────────────

Build v1.0.1                        Using v1.0.0
     ↓                                    ↓
Publish to GitHub  ────────────→   App checks updates
     ↓                                    ↓
Release created                     "Update available"
     ↓                                    ↓
Done! ✓                             Downloads update
                                          ↓
                                    Restarts & installs
                                          ↓
                                    Now on v1.0.1 ✓
```

### Testing Updates

1. **Build and publish v1.0.0**
   ```bash
   node scripts/release.js release patch mac
   node scripts/release.js publish mac
   ```

2. **Install v1.0.0** on test machine

3. **Build and publish v1.0.1**
   ```bash
   node scripts/release.js release patch mac
   node scripts/release.js publish mac
   ```

4. **Open v1.0.0 app** → Should show update notification

5. **Click Download** → Update downloads

6. **Restart app** → Should install v1.0.1

---

## 🔧 Building for Different Platforms

### macOS (from Mac)

```bash
# Intel + Apple Silicon
node scripts/release.js build mac
```

**Outputs:**
- `WhaSender-1.0.0.dmg` (installer)
- `WhaSender-1.0.0-mac.zip` (portable)

### Windows (from Mac with Wine)

**Install Wine first:**
```bash
brew install --cask wine-stable
```

**Build:**
```bash
node scripts/release.js build win
```

**Outputs:**
- `WhaSender Setup 1.0.0.exe` (installer)
- `WhaSender 1.0.0.exe` (portable)

### Both Platforms

```bash
node scripts/release.js build all
```

---

## 📋 Version Types

Choose based on changes:

**Patch** (1.0.0 → 1.0.1)
- Bug fixes
- Small improvements
- No breaking changes
```bash
node scripts/release.js release patch mac
```

**Minor** (1.0.0 → 1.1.0)
- New features
- Enhancements
- Backward compatible
```bash
node scripts/release.js release minor mac
```

**Major** (1.0.0 → 2.0.0)
- Breaking changes
- Major redesign
- API changes
```bash
node scripts/release.js release major mac
```

---

## ✅ Pre-Release Checklist

Before releasing:

- [ ] Test all features work
- [ ] Test on clean install
- [ ] Update version in package.json
- [ ] Write release notes
- [ ] Commit all changes
- [ ] Build succeeds
- [ ] Test built app
- [ ] GH_TOKEN is set
- [ ] GitHub repo configured

---

## 🆘 Troubleshooting

### "GH_TOKEN not set"

```bash
export GH_TOKEN="your_token_here"
# Add to ~/.zshrc for permanent
```

### "Cannot find module 'better-sqlite3'"

```bash
cd app
npm run postinstall
```

### "App won't launch after build"

Check:
1. Database migrations in `resources/migrations/`
2. Console logs in `~/Library/Logs/WhaSender/`
3. File permissions

### "Updates not detecting"

Verify:
1. `latest-mac.yml` exists in GitHub release
2. App can reach GitHub (firewall)
3. Version number increased

---

## 📞 Quick Reference

### Essential Commands

```bash
# Show version
node scripts/release.js version

# Bump & build
node scripts/release.js release patch mac

# Publish to GitHub
node scripts/release.js publish mac

# Manual build
npm run build:mac
npm run build:win
npm run build:all
```

### File Locations

- **Builds:** `app/release/`
- **Logs:** `~/Library/Logs/WhaSender/`
- **Database:** `~/Library/Application Support/whasender-app/`
- **Migrations:** `app/electron/database/migrations/`

### Important Links

- **Releases:** `https://github.com/YOUR-USERNAME/whasender/releases`
- **GitHub Token:** `https://github.com/settings/tokens`
- **Full Guide:** `DEPLOYMENT-GUIDE.md`

---

## 🎯 Example: First Release

```bash
# 1. Set up (first time)
export GH_TOKEN="ghp_your_token_here"

# 2. Navigate
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender/app

# 3. Build v1.0.0
node scripts/release.js release patch mac

# 4. Test
open release/WhaSender-1.0.0.dmg

# 5. Commit
git add .
git commit -m "Release v1.0.0"
git push

# 6. Publish
node scripts/release.js publish mac

# 7. Share with clients
# Send them: https://github.com/YOUR-USERNAME/whasender/releases/latest

# Done! 🎉
```

---

## 🎉 You're Ready!

Your app is now:
- ✅ Built and packaged
- ✅ Published to GitHub
- ✅ Auto-updates enabled
- ✅ Ready for clients

Share the download link and your clients will always have the latest version!

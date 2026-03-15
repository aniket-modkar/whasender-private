# Git Repository Setup Guide - Complete Strategy

**Your Project Components:**
- 📱 Electron App (WhaSender) - Client desktop application
- 🔐 Auth Server - Backend authentication server
- 👤 Admin Portal - User management dashboard

**Your Requirements:**
- ✅ Manage all code in Git
- ✅ Auto-updates for client app via GitHub releases
- ✅ Keep source code private
- ✅ Easy deployment for auth server & admin portal
- ✅ Distribute app to clients

---

## 🎯 Recommended Setup: Private Monorepo

**Best for your use case:** Single private repository (what you have now!)

### Why This Works Best

```
┌─────────────────────────────────────────────────────────────┐
│          whasender-private (GitHub Private Repo)            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  app/              ──► Electron app (builds + releases)    │
│  auth-server/      ──► Deploy to Railway/Render            │
│  admin-portal/     ──► Deploy to Vercel/Netlify            │
│  docs/             ──► Documentation                        │
│                                                             │
│  GitHub Releases:                                           │
│  └─ v1.0.0 ──► WhaSender-1.0.0.dmg (for auto-updates)     │
│  └─ v1.0.1 ──► WhaSender-1.0.1.dmg                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Advantages:**
- ✅ All code in one place (easy to manage)
- ✅ Single source of truth
- ✅ Easy to coordinate changes across components
- ✅ GitHub Releases work perfectly for auto-updates
- ✅ Source code stays private
- ✅ Clients only access built apps (via releases or bot token)
- ✅ Railway/Render deploy from same repo
- ✅ Simple git workflow

**How Auto-Updates Work:**
1. You build app and publish to GitHub Releases
2. Release contains built binaries (DMG/EXE) - NOT source code
3. Electron-updater checks releases for new versions
4. Downloads and installs updates automatically
5. Source code remains private (clients never see it)

---

## 📋 Step-by-Step Setup

### Step 1: Create Private GitHub Repository (5 minutes)

**1.1 Create Repository**
```bash
# Already in your project directory
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender
```

**1.2 Go to GitHub:**
- https://github.com/new
- Repository name: `whasender-private`
- Description: "WhaSender - WhatsApp Bulk Messaging System"
- **Visibility: 🔒 PRIVATE** (Important!)
- Don't initialize with README (you already have one)
- Click "Create repository"

**1.3 Initialize Git (if not done)**
```bash
# Check if git is initialized
git status

# If not initialized:
git init

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Build outputs
app/dist/
app/release/
admin-portal/client/dist/
admin-portal/client/.next/

# Environment files
.env
.env.local
.env.production
*.env

# Logs
logs/
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.sqlite
*.sqlite-shm
*.sqlite-wal
*.db

# Auth session files
auth-session/
WhatsApp/
.wwebjs_auth/
.wwebjs_cache/

# Electron
app/out/

# Testing
coverage/

# Temporary
tmp/
temp/
*.tmp
EOF
```

**1.4 Initial Commit**
```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit: WhaSender project with app, auth-server, and admin-portal"

# Add remote (replace YOUR-USERNAME)
git remote add origin https://github.com/YOUR-USERNAME/whasender-private.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

### Step 2: Configure for Auto-Updates (Already Done!)

Your app is already configured to use GitHub releases:

**File:** `app/package.json`
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR-USERNAME",
      "repo": "whasender-private",
      "private": true
    }
  }
}
```

**For Private Repos, also need bot token in:**
- `app/electron/config/update-config.js`

(Already documented in PRIVATE-REPO-SETUP.md)

---

### Step 3: Repository Structure

Your current structure is already PERFECT:

```
whasender-private/                    # Root (Private Repo)
│
├── .gitignore                        # Ignore build files, env, etc.
├── README.md                         # Project overview
├── package.json                      # Root package (optional)
│
├── app/                              # 📱 Electron App (Client)
│   ├── package.json                  # App dependencies
│   ├── electron/                     # Backend
│   ├── src/                          # Frontend
│   ├── scripts/
│   │   └── release.js               # ⭐ Build & publish releases
│   └── release/                      # ❌ .gitignore (not committed)
│       ├── WhaSender-1.0.0.dmg      # Built app (local only)
│       └── latest-mac.yml            # Auto-update manifest
│
├── auth-server/                      # 🔐 Auth Server (Deploy to Railway)
│   ├── package.json
│   ├── server.js
│   ├── models/
│   ├── routes/
│   └── scripts/
│
├── admin-portal/                     # 👤 Admin Portal (Deploy to Vercel)
│   ├── client/                       # Frontend
│   │   ├── package.json
│   │   └── src/
│   └── server/                       # Backend (optional)
│
├── docs/                             # 📚 Documentation
│   ├── deployment/
│   ├── guides/
│   └── features/
│
├── railway.json                      # Railway config (auth-server)
└── render.yaml                       # Render config (auth-server)
```

**What Gets Committed:**
- ✅ Source code (app/, auth-server/, admin-portal/)
- ✅ Documentation (docs/, *.md)
- ✅ Configuration files (package.json, configs)
- ✅ Scripts (release.js, etc.)

**What DOESN'T Get Committed (.gitignore):**
- ❌ node_modules/
- ❌ Built apps (app/release/)
- ❌ .env files
- ❌ Logs and temporary files
- ❌ Database files

**What Goes to GitHub Releases:**
- 📦 WhaSender-1.0.0.dmg (built app)
- 📦 WhaSender-1.0.0-mac.zip
- 📦 latest-mac.yml (update manifest)
- 📦 WhaSender Setup 1.0.0.exe (Windows)

---

### Step 4: Branching Strategy

**Simple Strategy (Recommended for Small Team):**

```
main (protected)
  ├── feature/video-sending
  ├── feature/contacts-import
  ├── fix/login-bug
  └── release/v1.0.1
```

**Branches:**
1. **main** - Production-ready code
2. **develop** (optional) - Integration branch
3. **feature/*** - New features
4. **fix/*** - Bug fixes
5. **release/*** - Release preparation

**Workflow:**

**For Features:**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes
git add .
git commit -m "Add new feature"

# Push to GitHub
git push origin feature/new-feature

# Create Pull Request on GitHub
# Merge to main when ready
```

**For Releases:**
```bash
# On main branch
git checkout main
git pull

# Build and release
cd app
node scripts/release.js release patch mac

# Commit version bump
git add .
git commit -m "Release v1.0.1"
git push

# Publish to GitHub releases
node scripts/release.js publish mac

# Tag the release
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

---

### Step 5: GitHub Releases Workflow

**How It Works:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. You build app locally:                                   │
│    cd app                                                    │
│    node scripts/release.js release patch mac                │
├─────────────────────────────────────────────────────────────┤
│ 2. Built files created locally:                             │
│    app/release/WhaSender-1.0.1.dmg                          │
│    app/release/latest-mac.yml                               │
├─────────────────────────────────────────────────────────────┤
│ 3. Publish to GitHub:                                        │
│    node scripts/release.js publish mac                      │
├─────────────────────────────────────────────────────────────┤
│ 4. Creates GitHub Release:                                  │
│    Tag: v1.0.1                                              │
│    Assets:                                                   │
│      - WhaSender-1.0.1.dmg                                  │
│      - WhaSender-1.0.1-mac.zip                              │
│      - latest-mac.yml                                        │
├─────────────────────────────────────────────────────────────┤
│ 5. Auto-updater checks releases:                            │
│    Client app → GitHub API → Check latest release          │
│    If new version → Download DMG → Install on restart       │
└─────────────────────────────────────────────────────────────┘
```

**View Releases:**
```
https://github.com/YOUR-USERNAME/whasender-private/releases
```

**Share with Clients:**
```
https://github.com/YOUR-USERNAME/whasender-private/releases/latest
```

(They can download even from private repo if you add them as collaborators OR use bot token for auto-updates)

---

### Step 6: Deployment from Git

**Auth Server Deployment (Railway):**

```
Railway reads from: auth-server/ folder in your repo
Auto-deploys on: git push to main
Configuration: railway.json
```

**Admin Portal Deployment (Vercel/Netlify):**

```
Vercel reads from: admin-portal/client/ folder
Auto-deploys on: git push to main
Configuration: vercel.json (can create)
```

**Electron App:**

```
Not deployed to server
Built locally and published to GitHub Releases
Distributed via releases
```

---

## 🔐 Private Repository Auto-Updates Setup

### Option 1: Add Bot Account (Recommended)

**Why:** Clients don't need GitHub accounts to get updates

**Setup:**

1. **Create Bot GitHub Account:**
   - Email: `whasender-bot@yourcompany.com`
   - Username: `whasender-bot`

2. **Add Bot to Private Repo:**
   - Repo Settings → Collaborators
   - Add `whasender-bot`
   - Permission: **Read** only

3. **Generate Bot Token:**
   - Login as bot
   - Settings → Developer settings → Personal access tokens
   - Generate new token (classic)
   - Scopes: `repo` (read only)
   - Copy token: `ghp_xxxxxxxxxxxxx`

4. **Add to App Config:**

**File:** `app/electron/config/update-config.js`
```javascript
module.exports = {
  github: {
    owner: 'YOUR-USERNAME',
    repo: 'whasender-private',
    private: true,  // ← Set to true
    token: 'ghp_xxxxxxxxxxxxx',  // ← Bot token (read-only)
  },
  // ...
};
```

5. **Rebuild App:**
```bash
cd app
node scripts/release.js release patch mac
```

Now clients get auto-updates without GitHub access!

**See:** [PRIVATE-REPO-SETUP.md](PRIVATE-REPO-SETUP.md) for complete guide

---

## 🎯 Alternative Setups (Not Recommended for You)

### Alternative 1: Separate Repositories

```
whasender-app (private)           - Electron app only
whasender-auth (private)          - Auth server only
whasender-admin (private)         - Admin portal only
whasender-releases (public)       - Only releases (no code)
```

**Pros:**
- Separate concerns
- Can have different collaborators per repo

**Cons:**
- ❌ Hard to coordinate changes
- ❌ Need to manage 4 repos
- ❌ Complex git workflow
- ❌ Harder to share code between components

**When to use:** Large teams with separate responsibilities

---

### Alternative 2: Monorepo with Public Releases

```
whasender-private (private)       - All source code
whasender-releases (public)       - Built apps only
```

**Setup:**
1. Develop in private repo
2. Build app locally
3. Manually upload to public releases repo
4. Auto-updater points to public repo

**Pros:**
- Source code stays private
- Releases are public (easy to share)

**Cons:**
- ❌ Manual upload process
- ❌ Manage two repos
- ❌ Extra step in release process

**When to use:** If you want public releases without bot token

---

## 📝 Git Workflow Cheat Sheet

### Daily Development

```bash
# Start working on new feature
git checkout -b feature/feature-name

# Make changes
# ... edit files ...

# Stage changes
git add .

# Commit
git commit -m "Descriptive message"

# Push to GitHub
git push origin feature/feature-name

# Create PR on GitHub, review, merge
```

### Bug Fixes

```bash
# Create fix branch
git checkout -b fix/bug-name

# Make changes
git add .
git commit -m "Fix: bug description"

# Push and create PR
git push origin fix/bug-name
```

### Deploying Auth Server

```bash
# Make changes to auth-server/
git add auth-server/
git commit -m "Update auth server: description"

# Push (Railway auto-deploys)
git push origin main

# Railway detects changes and redeploys auth-server
```

### Deploying Admin Portal

```bash
# Make changes to admin-portal/
git add admin-portal/
git commit -m "Update admin portal: description"

# Push (Vercel auto-deploys)
git push origin main

# Vercel detects changes and redeploys
```

### Releasing Electron App

```bash
# On main branch
git checkout main
git pull

# Build app
cd app
node scripts/release.js release patch mac

# This updates version in package.json
# Commit version change
cd ..
git add app/package.json
git commit -m "Bump version to 1.0.1"
git push

# Publish to GitHub Releases
cd app
export GH_TOKEN="your_github_token"
node scripts/release.js publish mac

# This creates GitHub release with built app
# Auto-updates now work for clients!

# Tag the release (optional but recommended)
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

---

## ✅ Best Practices

### Commits

**Good commit messages:**
```
✅ "Add video sending feature to WhaSender app"
✅ "Fix login authentication bug in auth server"
✅ "Update admin portal user table styling"
✅ "Release version 1.0.1"
```

**Bad commit messages:**
```
❌ "Update"
❌ "Fix bug"
❌ "Changes"
❌ "WIP"
```

**Commit conventions:**
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes (formatting)
refactor: Code refactoring
test: Add tests
chore: Maintenance tasks
release: Version bump for release
```

### .gitignore

**Always ignore:**
```
# Secrets
.env
.env.local
.env.production
config/secrets.js

# Build outputs
dist/
build/
release/

# Dependencies
node_modules/

# Logs
*.log

# OS files
.DS_Store
```

**Never commit:**
- ❌ Passwords, API keys, secrets
- ❌ node_modules/
- ❌ Built applications
- ❌ Database files
- ❌ Log files

### Branching

**Protect main branch:**
1. GitHub → Repo → Settings → Branches
2. Add rule for `main`
3. Require pull request reviews
4. Require status checks

**Branch naming:**
```
feature/descriptive-name
fix/bug-description
release/v1.0.1
hotfix/critical-bug
```

---

## 🔧 Setup Commands

### Complete Initial Setup

```bash
# 1. Initialize repository
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender
git init
git add .
git commit -m "Initial commit"

# 2. Add remote (create repo on GitHub first)
git remote add origin https://github.com/YOUR-USERNAME/whasender-private.git

# 3. Push to GitHub
git branch -M main
git push -u origin main

# 4. Set up GitHub token for releases
export GH_TOKEN="ghp_your_github_token"
echo 'export GH_TOKEN="ghp_your_token"' >> ~/.zshrc

# 5. Configure package.json
# Edit app/package.json:
# - Set build.publish.owner to YOUR-USERNAME
# - Set build.publish.repo to whasender-private

# 6. Test release
cd app
node scripts/release.js release patch mac
node scripts/release.js publish mac

# 7. Verify on GitHub
# Go to: https://github.com/YOUR-USERNAME/whasender-private/releases
```

---

## 📊 Summary

### ✅ Recommended Setup (What You Should Use)

```
Repository Structure:
┌─────────────────────────────────────────────┐
│  whasender-private (Private GitHub Repo)    │
│                                             │
│  ├── app/ (Electron)                        │
│  ├── auth-server/ (Deploy to Railway)      │
│  ├── admin-portal/ (Deploy to Vercel)      │
│  └── docs/ (Documentation)                  │
│                                             │
│  GitHub Releases:                           │
│  └── Built apps for auto-updates            │
└─────────────────────────────────────────────┘

Git Workflow:
1. All code in main branch
2. Feature branches for development
3. PR and merge to main
4. Build app locally
5. Publish to GitHub Releases
6. Auto-updates work automatically

Deployment:
• Auth Server: Railway auto-deploys from auth-server/
• Admin Portal: Vercel auto-deploys from admin-portal/
• Electron App: Build locally, publish to releases

Auto-Updates:
• Private repo with bot token (read-only)
• Electron-updater checks GitHub releases
• Downloads and installs automatically
```

### Why This Works

✅ **Simple:** One repository, easy to manage
✅ **Secure:** Private repo, source code protected
✅ **Auto-updates:** GitHub releases work perfectly
✅ **Auto-deploy:** Railway/Vercel deploy automatically
✅ **Scalable:** Easy to add more components
✅ **Maintainable:** Single source of truth

---

## 🆘 Troubleshooting

### Problem: Can't push to GitHub

**Error:** `remote: Permission denied`

**Fix:**
```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and add to GitHub → Settings → SSH Keys

# Or use HTTPS with Personal Access Token
git remote set-url origin https://YOUR-TOKEN@github.com/YOUR-USERNAME/whasender-private.git
```

### Problem: Auto-updates not working

**Check:**
1. GitHub release exists: `https://github.com/YOUR-USERNAME/whasender-private/releases`
2. `latest-mac.yml` uploaded to release
3. Version number increased
4. Bot token set (if private repo)

**Fix:**
```bash
# Republish release
cd app
export GH_TOKEN="your_github_token"
node scripts/release.js publish mac
```

### Problem: Railway not deploying

**Check:**
1. Railway connected to correct repo
2. Root directory set to `auth-server`
3. Changes pushed to main branch

**Fix:**
```bash
# Push changes
git push origin main

# Trigger manual deploy in Railway dashboard
```

---

## 📞 Next Steps

1. ✅ **Set up repository** (if not done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR-USERNAME/whasender-private.git
   git push -u origin main
   ```

2. ✅ **Deploy auth server** (follow DEPLOY-NOW.md)

3. ✅ **Configure for private repo** (follow PRIVATE-REPO-SETUP.md)

4. ✅ **Build and publish first release**
   ```bash
   cd app
   node scripts/release.js release patch mac
   node scripts/release.js publish mac
   ```

5. ✅ **Test auto-updates**

---

**You're all set! Your Git setup is optimized for development, deployment, and distribution! 🎉**

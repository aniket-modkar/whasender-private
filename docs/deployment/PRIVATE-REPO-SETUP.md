# Private Repository Auto-Updates Setup

Complete guide for using WhaSender with a **private** GitHub repository.

---

## Why Private Repo?

**Use private repo when:**
- ✅ Selling the app to clients (protect source code)
- ✅ Controlling who can download
- ✅ Internal company tool
- ✅ Beta testing before public release

**Auto-updates still work!** Just need extra configuration.

---

## Setup Options

You have **3 options** for private repo auto-updates:

### Option 1: GitHub Token in App (Easiest)
- ✅ Simple setup
- ✅ Works immediately
- ⚠️ Token embedded in app (low security risk if token is read-only)

### Option 2: Custom Update Server (Most Secure)
- ✅ Full control
- ✅ No GitHub token needed
- ⚠️ Requires your own server

### Option 3: Electron Release Server (Advanced)
- ✅ Professional solution
- ✅ Usage analytics
- ⚠️ More complex setup

**Recommended: Option 1** for most use cases.

---

## Option 1: GitHub Token in App (Recommended)

### How It Works

1. Create a **read-only** GitHub token
2. Embed token in your app
3. App uses token to download updates from private repo
4. Clients don't need GitHub accounts

### Step 1: Create GitHub Token

**Important: Use a machine/bot account, NOT your personal account!**

1. **Create a Bot Account** (recommended):
   - Go to: https://github.com/signup
   - Email: `whasender-bot@yourcompany.com`
   - Username: `whasender-bot` or similar
   - Complete signup

2. **Add Bot to Your Private Repo**:
   - Go to: `https://github.com/YOUR-USERNAME/whasender/settings/access`
   - Click **"Add people"**
   - Add `whasender-bot`
   - Role: **"Read"** (important!)

3. **Generate Token for Bot Account**:
   - Login as bot account
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token (classic)"**
   - Name: `WhaSender Updates Read-Only`
   - Expiration: **No expiration** (important for auto-updates)
   - Scopes: **ONLY select `repo` (read access)**
   - Generate and copy token: `ghp_xxxxxxxxxxxxx`

### Step 2: Configure package.json

Edit `app/package.json`:

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR-USERNAME",
      "repo": "whasender",
      "private": true,
      "token": "ghp_xxxxxxxxxxxxx"  // Bot account token (read-only)
    }
  }
}
```

**⚠️ Security Note:**
- Use a **bot account**, not your personal account
- Token should have **read-only** access
- Even if someone extracts token, they can only read releases
- Revoke token anytime to disable updates

### Step 3: Use Environment Variable (Alternative - More Secure)

Instead of hardcoding token in package.json:

**package.json:**
```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "YOUR-USERNAME",
      "repo": "whasender",
      "private": true,
      "token": "${GH_TOKEN_READONLY}"
    }
  }
}
```

**Set environment variable:**
```bash
# Build machine only (your Mac)
export GH_TOKEN_READONLY="ghp_xxxxxxxxxxxxx"
echo 'export GH_TOKEN_READONLY="ghp_xxxxxxxxxxxxx"' >> ~/.zshrc
```

**At build time:**
```bash
GH_TOKEN_READONLY="ghp_xxxxx" node scripts/release.js publish mac
```

This way token is NOT in your source code.

### Step 4: Update Auto-Updater Code

Edit `app/electron/main.js`:

```javascript
const { autoUpdater } = require('electron-updater');

function setupAutoUpdater() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Set GitHub token for private repo
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'YOUR-USERNAME',
    repo: 'whasender',
    private: true,
    token: 'ghp_xxxxxxxxxxxxx'  // Bot account read-only token
  });

  // Rest of auto-updater setup...
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // ... event handlers ...
}
```

**Alternative (more secure) - Load from config:**

```javascript
const Store = require('electron-store');
const store = new Store();

function setupAutoUpdater() {
  if (process.env.NODE_ENV === 'development') {
    return;
  }

  const updateConfig = {
    provider: 'github',
    owner: 'YOUR-USERNAME',
    repo: 'whasender',
    private: true,
    // Token embedded at build time or loaded from secure location
    token: process.env.GH_UPDATE_TOKEN || 'ghp_xxxxxxxxxxxxx'
  };

  autoUpdater.setFeedURL(updateConfig);

  // Rest of setup...
}
```

### Step 5: Build & Test

```bash
cd app

# Build with private repo config
node scripts/release.js build mac

# Test locally
open release/WhaSender-*.dmg

# Should connect to private GitHub repo for updates
```

### Step 6: Publish Release

```bash
# Use your ADMIN token for publishing (not the read-only one)
export GH_TOKEN="ghp_your_admin_token"

# Publish
node scripts/release.js publish mac
```

**Note:** Use **different tokens** for:
- **Publishing** (your admin token with write access)
- **Updates** (bot read-only token embedded in app)

---

## Option 2: Custom Update Server

Host update files on your own server instead of GitHub.

### Step 1: Set Up Server

You need a web server with these files:

```
https://updates.yourcompany.com/
  ├── latest-mac.yml       (update manifest)
  ├── latest.yml           (Windows manifest)
  ├── WhaSender-1.0.0.dmg
  ├── WhaSender-1.0.0-mac.zip
  └── WhaSender Setup 1.0.0.exe
```

### Step 2: Configure package.json

```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://updates.yourcompany.com/"
    }
  }
}
```

### Step 3: Update Auto-Updater

Edit `app/electron/main.js`:

```javascript
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://updates.yourcompany.com/'
});
```

### Step 4: Manual Publishing

Build locally:
```bash
npm run build:mac
```

Upload to your server:
```bash
# Files from release/ folder
scp release/WhaSender-1.0.0.dmg your-server:/var/www/updates/
scp release/latest-mac.yml your-server:/var/www/updates/
```

### Step 5: Create latest-mac.yml

Example `latest-mac.yml`:

```yaml
version: 1.0.0
files:
  - url: WhaSender-1.0.0.dmg
    sha512: <hash>
    size: 153600000
  - url: WhaSender-1.0.0-mac.zip
    sha512: <hash>
    size: 153500000
path: WhaSender-1.0.0.dmg
sha512: <hash>
releaseDate: '2025-03-14T12:00:00.000Z'
```

**Generate hash:**
```bash
shasum -a 512 WhaSender-1.0.0.dmg | awk '{print $1}' | xxd -r -p | base64
```

### Pros & Cons

**Pros:**
- ✅ Full control over updates
- ✅ No GitHub dependency
- ✅ Can track download analytics
- ✅ Custom domain (looks professional)

**Cons:**
- ⚠️ Need to maintain server
- ⚠️ Manual upload process
- ⚠️ Need SSL certificate

---

## Option 3: Electron Release Server

Use an open-source release server: https://github.com/ArekSredzki/electron-release-server

### Features

- ✅ Web dashboard
- ✅ Usage analytics
- ✅ Channel management (stable, beta, alpha)
- ✅ Access control
- ✅ Asset management

### Quick Setup

1. **Deploy Server:**
   ```bash
   git clone https://github.com/ArekSredzki/electron-release-server
   cd electron-release-server
   npm install
   npm start
   ```

2. **Configure App:**
   ```json
   {
     "build": {
       "publish": {
         "provider": "generic",
         "url": "https://your-release-server.com/update"
       }
     }
   }
   ```

3. **Upload via Dashboard:**
   - Login to web interface
   - Create new version
   - Upload DMG/EXE files
   - Publish

### Pros & Cons

**Pros:**
- ✅ Professional dashboard
- ✅ Analytics
- ✅ Multi-channel support
- ✅ User management

**Cons:**
- ⚠️ Complex setup
- ⚠️ Need hosting
- ⚠️ Maintenance required

---

## Comparison

| Feature | GitHub Private | Custom Server | Release Server |
|---------|---------------|---------------|----------------|
| **Setup** | Easy | Medium | Complex |
| **Cost** | Free (if <500MB) | Server cost | Server cost |
| **Security** | Good (read token) | Excellent | Excellent |
| **Analytics** | No | Manual | Yes |
| **Maintenance** | None | Manual updates | Self-hosted |
| **Best For** | Small teams | Custom needs | Enterprise |

---

## Recommended Setup

For most cases, use **Option 1 (GitHub Private with Token)**:

**Why?**
- ✅ Free (GitHub is free for repos <500MB per file)
- ✅ Easy to set up (5 minutes)
- ✅ Reliable (GitHub's infrastructure)
- ✅ Automatic (no manual uploads)
- ✅ Secure (read-only bot token)

**When to use others:**
- Use **Option 2** if you need custom domain/branding
- Use **Option 3** if you need analytics and multi-channel

---

## Security Best Practices

### For Option 1 (GitHub Private)

1. **Use Bot Account:**
   - Don't use your personal GitHub account
   - Create dedicated bot: `whasender-bot`
   - Only for release access

2. **Read-Only Token:**
   - Token should only have `repo` read access
   - NOT write access
   - Set to "Read" role in repo settings

3. **Token Rotation:**
   - Change token every 6-12 months
   - Publish new app version with new token
   - Old versions stop getting updates (security feature)

4. **Separate Tokens:**
   - **Publishing token** (admin, write access) - on your Mac only
   - **Update token** (bot, read-only) - embedded in app

### What If Token Leaks?

If someone extracts the read-only token from your app:

**They CAN:**
- Download your releases (same as having the app)
- View release notes

**They CANNOT:**
- Modify your repo
- Create new releases
- Access source code (if repo is private)
- Delete anything

**Mitigation:**
1. Revoke old token
2. Generate new token
3. Publish new app version

---

## Complete Example: Private Repo Setup

```bash
# 1. Create bot account
# GitHub: whasender-bot@yourcompany.com

# 2. Add bot to repo (Read access)
# Repo Settings > Access > Add people > whasender-bot (Read)

# 3. Generate read-only token (as bot)
# https://github.com/settings/tokens
# Token: ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456

# 4. Update package.json
cd app
```

**app/package.json:**
```json
{
  "version": "1.0.0",
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-company",
      "repo": "whasender",
      "private": true,
      "token": "ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456"
    }
  }
}
```

**app/electron/main.js:**
```javascript
function setupAutoUpdater() {
  if (process.env.NODE_ENV === 'development') return;

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'your-company',
    repo: 'whasender',
    private: true,
    token: 'ghp_aBcDeFgHiJkLmNoPqRsTuVwXyZ123456'  // Bot read-only
  });

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  // ... rest of setup
}
```

```bash
# 5. Build and test
node scripts/release.js build mac
open release/WhaSender-1.0.0.dmg

# 6. Publish (use YOUR admin token, not bot token)
export GH_TOKEN="ghp_your_admin_token_with_write_access"
node scripts/release.js publish mac

# 7. Distribute to clients
# Send DMG file directly OR
# Give clients access to private repo (add to repo, they download from releases)
```

---

## Client Distribution (Private Repo)

### Method 1: Direct File Sharing (Recommended)

1. **Download built app:**
   ```bash
   # From release/ folder
   WhaSender-1.0.0.dmg
   ```

2. **Share via:**
   - Email (if <25MB)
   - Google Drive / Dropbox (private link)
   - Your website (password protected)
   - USB drive / in-person

3. **Auto-updates work!**
   - Client installs from DMG
   - App has embedded read-only token
   - Auto-updates download from private GitHub
   - **Client doesn't need GitHub account**

### Method 2: Add Clients to Private Repo

1. **Add client to repo:**
   - Repo Settings > Access > Add people
   - Enter client's GitHub email
   - Role: **"Read"**

2. **Client downloads:**
   - Go to: `https://github.com/your-company/whasender/releases`
   - Download latest DMG/EXE
   - Install

3. **Pro:** Client can always download latest
4. **Con:** Requires GitHub account

---

## FAQ

**Q: Is it safe to embed GitHub token in app?**
A: Yes, if it's read-only and from a bot account. Worst case: someone can download releases (which they already have by having the app).

**Q: Can I use my personal GitHub account for the bot?**
A: No, create a separate bot account. If token leaks, you don't want your personal account compromised.

**Q: What if I need to change the token?**
A: Generate new token, rebuild app with new token, release new version. Old app versions will stop getting updates.

**Q: Can clients see my source code?**
A: No, private repo source code is protected. They only access releases (binaries).

**Q: How much does private repo cost?**
A: Free if repo <500MB per file and <500MB total storage. For larger, GitHub Pro is $4/month.

**Q: Can I use both public and private repos?**
A: Yes, have public repo for marketing/docs, private repo for releases.

---

## Troubleshooting

### "Failed to fetch updates"

Check:
1. Token is valid: Test at https://github.com/settings/tokens
2. Bot has access to repo
3. App has correct token in setFeedURL
4. Release exists in private repo

### "Unauthorized" Error

- Token expired or revoked
- Bot removed from repo
- Wrong token in app

### Updates Not Showing

- Check latest-mac.yml exists in release
- Verify version number increased
- Check app can reach GitHub (firewall)

---

## Summary

**For Private Repos:**

✅ **Best Practice:**
- Use Option 1 (GitHub private with bot token)
- Create dedicated bot account
- Use read-only token
- Distribute DMG/EXE files directly to clients
- Auto-updates work without client GitHub accounts

✅ **Security:**
- Bot account with read-only access
- Token rotation every 6-12 months
- Separate publishing token (admin) from update token (read)

✅ **Distribution:**
- Share installer files directly
- Auto-updates pull from private GitHub
- No GitHub account needed for clients

🎉 **Your app is secure AND auto-updates work!**

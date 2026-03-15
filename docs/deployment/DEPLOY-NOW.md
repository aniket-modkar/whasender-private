# 🚀 Deploy Auth Server NOW - Step by Step

**Time Required:** 60 minutes
**Cost:** Free (using Railway + MongoDB Atlas free tiers)

---

## ✅ Pre-Deployment Checklist

Before starting:
- [ ] GitHub account created
- [ ] Code committed to GitHub (we'll do this now)
- [ ] Email for MongoDB Atlas signup
- [ ] Email for Railway signup

---

## 📝 STEP 1: Generate Secrets (2 minutes)

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender/auth-server
node scripts/generate-secrets.js
```

**⚠️ COPY THE OUTPUT** - You'll need JWT_SECRET and SESSION_SECRET later!

Save them temporarily in a note:
```
JWT_SECRET: [copy from output]
SESSION_SECRET: [copy from output]
```

---

## 🗄️ STEP 2: MongoDB Atlas Setup (15 minutes)

### 2.1 Create Account

1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up with your email
3. Verify email

### 2.2 Create FREE Cluster

1. Click **"Build a Database"**
2. Choose **"M0 FREE"**
3. Provider: **AWS**
4. Region: **Mumbai (ap-south-1)** or closest to you
5. Cluster Name: `whasender-auth`
6. Click **"Create Deployment"**
7. Wait 2-3 minutes for cluster creation

### 2.3 Create Database User

1. **Important:** When prompted, create database user:
   - Username: `whasender-admin`
   - Password: Click "Autogenerate Secure Password"
   - **⚠️ COPY AND SAVE THIS PASSWORD!**
   - Click "Create User"

If you missed it:
1. Go to: Security > Database Access
2. Click "Add New Database User"
3. Username: `whasender-admin`
4. Password: Autogenerate and **COPY IT**
5. Privileges: "Read and write to any database"
6. Click "Add User"

### 2.4 Allow Network Access

1. When prompted for IP Address:
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click "Finish and Close"

If you missed it:
1. Go to: Security > Network Access
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. Confirm

### 2.5 Get Connection String

1. Go to: Database > Clusters
2. Click **"Connect"** button
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://anikettechnomize:tGQgH4l36W00Wwh1@anikettechnomize.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **IMPORTANT:** Replace `<password>` with your actual password
7. **IMPORTANT:** Add `/whasender` before the `?` to specify database name

**Final connection string should look like:**
```
mongodb+srv://whasender-admin:YourActualPassword@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
```

**⚠️ SAVE THIS CONNECTION STRING!** You'll need it for Railway.

---

## 💾 STEP 3: Push to GitHub (5 minutes)

### 3.1 Check Git Status

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender
git status
```

### 3.2 Commit All Changes

```bash
# Add all files
git add .

# Commit
git commit -m "Prepare for auth server deployment"
```

### 3.3 Create GitHub Repository

1. Go to: https://github.com/new
2. Repository name: `whasender-private`
3. **Choose PRIVATE** (to protect your code)
4. Don't initialize with README (already have one)
5. Click "Create repository"

### 3.4 Push to GitHub

```bash
# Add remote (replace YOUR-USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR-USERNAME/whasender-private.git

# If you already have a remote, remove it first:
# git remote remove origin
# Then add the new one

# Push to GitHub
git branch -M main
git push -u origin main
```

**✅ Verify:** Go to your GitHub repository and confirm files are there.

---

## 🚂 STEP 4: Deploy to Railway (20 minutes)

### 4.1 Create Railway Account

1. Go to: https://railway.app/
2. Click **"Start a New Project"**
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub
5. Verify email if prompted

### 4.2 Create New Project

1. Click **"New Project"**
2. Click **"Deploy from GitHub repo"**
3. **If asked to configure GitHub:**
   - Click "Configure GitHub App"
   - Select "Only select repositories"
   - Choose your `whasender-private` repository
   - Click "Save"
   - Go back to Railway

4. Select your `whasender-private` repository

### 4.3 Configure Service

Railway will try to detect your app:

1. **If it detects multiple services:**
   - Click "Add Service"
   - Choose "GitHub Repo"
   - Select `whasender-private`

2. **Configure Root Directory:**
   - Click on the service
   - Go to Settings tab
   - Find "Root Directory"
   - Set to: `auth-server`
   - Click "Save"

3. **Configure Build:**
   - Should auto-detect Node.js
   - Build command: `npm install`
   - Start command: `npm start`

### 4.4 Add Environment Variables

1. Click on your service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"**

Add these variables one by one:

**Variable 1:**
```
MONGODB_URI
[paste your MongoDB connection string from Step 2.5]
```

**Variable 2:**
```
JWT_SECRET
[paste JWT_SECRET from Step 1]
```

**Variable 3:**
```
SESSION_SECRET
[paste SESSION_SECRET from Step 1]
```

**Variable 4:**
```
JWT_EXPIRY
5d
```

**Variable 5:**
```
NODE_ENV
production
```

**Variable 6:**
```
PORT
3001
```

**Variable 7:**
```
ALLOWED_ORIGINS
*
```

4. Click "Deploy" or it will auto-deploy

### 4.5 Wait for Deployment

1. Go to **"Deployments"** tab
2. Watch the build logs
3. Wait for "Success" status (2-5 minutes)
4. If it fails, check logs for errors

### 4.6 Get Your Deployment URL

1. Go to **"Settings"** tab
2. Find **"Domains"** section
3. Click **"Generate Domain"**
4. Copy the URL (looks like):
   ```
   https://auth-server-production-xxxx.up.railway.app
   ```

**⚠️ SAVE THIS URL!** This is your AUTH_SERVER_URL.

---

## 🧪 STEP 5: Test Deployment (5 minutes)

### 5.1 Test Health Endpoint

```bash
# Replace URL with your Railway URL
curl https://auth-server-production-xxxx.up.railway.app/api/health
```

**Expected response:**
```json
{"status":"ok","service":"WhaSender Auth Server","timestamp":"2026-03-15T..."}
```

**If it fails:**
- Check Railway logs (Deployments > Click on deployment > View Logs)
- Verify environment variables are set correctly
- Check MongoDB connection string is correct

### 5.2 Create Admin User

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender/auth-server

# Set your MongoDB URI temporarily
export MONGODB_URI="your-mongodb-connection-string"

# Create admin user
node scripts/create-admin.js "admin@yourcompany.com" "YourSecurePassword123" "Admin Name"
```

**⚠️ SAVE THE ADMIN CREDENTIALS!**

---

## 📱 STEP 6: Update WhaSender App (10 minutes)

### 6.1 Update Production Auth URL

Edit: `app/electron/config/env.js`

Find this line (line 12):
```javascript
(isDevelopment ? 'http://localhost:3001' : 'https://your-production-auth-server.com');
```

Replace with your Railway URL:
```javascript
(isDevelopment ? 'http://localhost:3001' : 'https://auth-server-production-xxxx.up.railway.app');
```

### 6.2 Test App with Deployed Server

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender/app

# Build for production to test
NODE_ENV=production npm run dev

# Try to login with admin credentials
```

If login works, ✅ **deployment is successful!**

---

## 📦 STEP 7: Build App for Distribution (10 minutes)

### 7.1 Commit Configuration Changes

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender

git add app/electron/config/env.js
git commit -m "Update auth server URL for production"
git push
```

### 7.2 Build App

```bash
cd app

# Make sure you have GitHub token set
export GH_TOKEN="your_github_token"

# Build for Mac
node scripts/release.js release patch mac
```

### 7.3 Test Built App

```bash
# Install and test
open release/WhaSender-*.dmg
```

**Test checklist:**
- [ ] App launches
- [ ] Login screen appears
- [ ] Can login with admin credentials
- [ ] WhatsApp QR code shows
- [ ] All features work

### 7.4 Publish Release (Optional)

```bash
# If everything works, publish to GitHub
node scripts/release.js publish mac
```

---

## 🎉 DEPLOYMENT COMPLETE!

### ✅ What You've Deployed:

```
✓ MongoDB Atlas (Cloud Database)
  └── Free tier, 512MB storage
  └── Auto-backups not included (upgrade to M10 for backups)

✓ Auth Server on Railway
  └── Free $5 credit/month
  └── Automatic HTTPS
  └── URL: https://auth-server-production-xxxx.up.railway.app

✓ WhaSender App
  └── Built and ready for distribution
  └── Configured to use deployed auth server
```

### 📋 Important URLs & Credentials

**MongoDB Atlas:**
```
Cluster: whasender-auth
User: whasender-admin
Password: [your-password]
Connection: mongodb+srv://whasender-admin:password@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
```

**Railway Auth Server:**
```
URL: https://auth-server-production-xxxx.up.railway.app
Health Check: [URL]/api/health
API Base: [URL]/api
```

**Admin Credentials:**
```
Email: admin@yourcompany.com
Password: YourSecurePassword123
```

**GitHub Repository:**
```
Repo: https://github.com/YOUR-USERNAME/whasender-private
Branch: main
```

---

## 📱 Next Steps

### For Admin Portal Deployment (Optional):

1. Deploy admin portal to Vercel/Netlify
2. Update ALLOWED_ORIGINS in Railway to include admin portal URL
3. Access admin portal to manage users

### For Client Distribution:

1. Download built app from `app/release/`
2. Share with clients via:
   - Email (if < 25MB)
   - Google Drive
   - Your website
   - GitHub Releases (if using publish)

3. Clients install and use admin credentials to login

### For Creating Client Users:

**Option 1: Admin Portal (Recommended)**
- Deploy admin portal
- Login with admin credentials
- Create users via UI

**Option 2: Direct Database (Quick)**
- Use same create-admin.js script:
  ```bash
  node scripts/create-admin.js "client@email.com" "password" "Client Name"
  ```

**Option 3: MongoDB Compass (GUI)**
- Download MongoDB Compass
- Connect to your cluster
- Browse `whasender` database > `users` collection
- Add users manually

---

## 🆘 Troubleshooting

### Problem: Railway deployment failed

**Check:**
1. Railway logs (Deployments > View Logs)
2. Environment variables are set
3. MongoDB connection string is correct
4. `auth-server` folder exists in your repo

**Fix:**
- Re-deploy from Railway dashboard
- Check build command: `npm install`
- Check start command: `npm start`
- Verify root directory: `auth-server`

### Problem: Can't connect to MongoDB

**Check:**
1. Connection string has password replaced
2. Connection string has `/whasender` database name
3. Network access allows 0.0.0.0/0
4. Database user exists with correct permissions

**Test:**
```bash
cd auth-server
export MONGODB_URI="your-connection-string"
node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message));"
```

### Problem: App can't connect to auth server

**Check:**
1. Railway URL is correct in `app/electron/config/env.js`
2. Auth server health endpoint responds
3. ALLOWED_ORIGINS includes `*` or your app's origin

**Test:**
```bash
curl https://your-railway-url.up.railway.app/api/health
```

### Problem: Admin user creation failed

**Check:**
1. MONGODB_URI is set correctly
2. MongoDB connection is working
3. User doesn't already exist

**Fix:**
```bash
# Check existing users in MongoDB Compass
# Or drop users collection and recreate
```

---

## 💰 Costs

**Current Setup (Free):**
```
MongoDB Atlas M0:     $0/month (512MB)
Railway:              $0/month ($5 credit covers auth server)
GitHub:               $0/month (private repos included)
─────────────────────────────────────────────
Total:                $0/month
```

**When Free Tier Runs Out:**
```
MongoDB Atlas M0:     $0/month (stays free)
Railway:              $5-10/month (if exceeds credit)
─────────────────────────────────────────────
Total:                $5-10/month
```

**For Production (Recommended):**
```
MongoDB Atlas M10:    $9/month (includes backups)
Railway Hobby:        $5/month
Domain:               $12/year (~$1/month)
─────────────────────────────────────────────
Total:                ~$15/month
```

---

## ✅ Deployment Checklist

- [ ] Secrets generated (JWT_SECRET, SESSION_SECRET)
- [ ] MongoDB Atlas cluster created
- [ ] Database user created and password saved
- [ ] Network access configured (0.0.0.0/0)
- [ ] MongoDB connection string saved
- [ ] Code pushed to GitHub (private repo)
- [ ] Railway account created
- [ ] Auth server deployed to Railway
- [ ] Environment variables set in Railway
- [ ] Railway deployment successful
- [ ] Railway URL saved
- [ ] Health endpoint responding
- [ ] Admin user created
- [ ] Admin credentials saved
- [ ] App config updated with Railway URL
- [ ] App tested with production auth server
- [ ] App built for distribution
- [ ] App tested on clean machine

---

## 🎓 What You Learned

1. ✅ Deploy Node.js apps to Railway
2. ✅ Set up MongoDB Atlas cloud database
3. ✅ Configure environment variables for production
4. ✅ Secure secrets generation
5. ✅ Production deployment workflow
6. ✅ Health check endpoints
7. ✅ HTTPS and SSL (automatic with Railway)
8. ✅ Git and GitHub workflow

---

**🎉 Congratulations! Your auth server is deployed and ready for clients!**

**Time to distribute the app to your clients!**

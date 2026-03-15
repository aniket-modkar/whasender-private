# Auth Server Deployment Guide - Complete Walkthrough

**Purpose:** Deploy auth server to cloud before distributing WhaSender app to clients.

**Why Deploy Auth Server:**
- ✅ Centralized authentication for all clients
- ✅ License management from one place
- ✅ SMTP configuration storage
- ✅ User account control

---

## 🎯 Deployment Strategy

```
Your Architecture:

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Client 1 App   │      │  Client 2 App   │      │  Client N App   │
│  (Mac/Windows)  │      │  (Mac/Windows)  │      │  (Mac/Windows)  │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Auth Server (Cloud)   │
                    │  https://your-api.com   │
                    │      Port: 443/80       │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │  MongoDB Atlas (Cloud)  │
                    │   (Free Tier: 512MB)    │
                    └─────────────────────────┘
```

**You are CORRECT** - Deploy auth server before distributing apps!

---

## 📋 Step-by-Step Deployment

### Part 1: MongoDB Atlas Setup (15 minutes)

### Part 2: Deploy Auth Server (30 minutes)
- Option A: Railway (Recommended - Free)
- Option B: Render (Free tier)
- Option C: DigitalOcean ($5/month)

### Part 3: Configure WhaSender App (5 minutes)

### Part 4: Test Everything (10 minutes)

**Total Time: ~60 minutes**

---

## 🗄️ PART 1: MongoDB Atlas Setup

### Step 1.1: Create MongoDB Atlas Account

1. **Go to:** https://www.mongodb.com/cloud/atlas/register

2. **Sign up:**
   - Use your company email
   - Create password
   - Verify email

3. **Create Organization:**
   - Organization Name: "WhaSender" (or your company name)
   - Click "Next"

### Step 1.2: Create Cluster

1. **Create a Deployment:**
   - Click "Build a Database"
   - Choose **"M0 FREE"** (512MB storage, perfect for auth)
   - Cloud Provider: **AWS** (or your preferred)
   - Region: Choose closest to your users (e.g., Mumbai, Singapore)
   - Cluster Name: `whasender-auth`

2. **Wait for cluster creation** (2-3 minutes)

### Step 1.3: Create Database User

1. **Security > Database Access:**
   - Click "Add New Database User"
   - Authentication Method: **Password**
   - Username: `whasender-admin`
   - Password: Generate secure password (SAVE THIS!)
   - Database User Privileges: **Read and write to any database**
   - Click "Add User"

**⚠️ SAVE THESE CREDENTIALS:**
```
Username: whasender-admin
Password: [your-generated-password]
```

### Step 1.4: Configure Network Access

1. **Security > Network Access:**
   - Click "Add IP Address"
   - Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Confirm

**Note:** This allows your auth server (which can be deployed anywhere) to connect.

### Step 1.5: Get Connection String

1. **Go to Database > Clusters**
2. **Click "Connect"** on your cluster
3. **Choose "Connect your application"**
4. **Driver:** Node.js, Version: 5.5 or later
5. **Copy connection string:**

```
mongodb+srv://whasender-admin:<password>@whasender-auth.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

6. **Replace `<password>` with your actual password**

**⚠️ SAVE THIS CONNECTION STRING:**
```
mongodb+srv://whasender-admin:YOUR_PASSWORD@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
```

**Note:** I added `/whasender` after `.net` - this is your database name.

---

## 🚀 PART 2A: Deploy to Railway (Recommended)

**Why Railway:**
- ✅ Free $5 credit/month (enough for auth server)
- ✅ Automatic HTTPS
- ✅ Easy deployment
- ✅ GitHub integration
- ✅ Automatic restarts

### Step 2A.1: Push to GitHub

```bash
cd /Users/aniketmodkar/TechnoMize/WA-Web/whasender

# Initialize git if not done
git init
git add .
git commit -m "Initial commit"

# Create GitHub repo (private recommended)
# Then push:
git remote add origin https://github.com/YOUR-USERNAME/whasender.git
git branch -M main
git push -u origin main
```

### Step 2A.2: Create Railway Account

1. **Go to:** https://railway.app/
2. **Sign up with GitHub**
3. **Verify email**

### Step 2A.3: Deploy Auth Server

1. **Click "New Project"**
2. **Choose "Deploy from GitHub repo"**
3. **Select:** `whasender` repository
4. **Railway will detect multiple services, select "auth-server" folder**

If not detected:
- Click "Add Service" → "GitHub Repo"
- Configure root directory: `/auth-server`

### Step 2A.4: Configure Environment Variables

1. **In Railway project > auth-server service > Variables tab:**

```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://whasender-admin:YOUR_PASSWORD@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long

# Port (Railway handles this automatically, but set it)
PORT=3001

# Node Environment
NODE_ENV=production

# CORS Origin (your deployed admin portal URL, add later)
CORS_ORIGIN=*

# Session Secret (generate another random string)
SESSION_SECRET=your-session-secret-key-min-32-chars
```

**To generate secure secrets:**
```bash
# Run on your Mac
openssl rand -base64 32
# Use output for JWT_SECRET and SESSION_SECRET
```

### Step 2A.5: Deploy

1. **Click "Deploy"**
2. **Wait for deployment** (2-3 minutes)
3. **Railway will provide URL:** `https://auth-server-production-xxxx.up.railway.app`

**⚠️ SAVE THIS URL - you'll need it for the app!**

### Step 2A.6: Verify Deployment

```bash
# Test health endpoint
curl https://auth-server-production-xxxx.up.railway.app/api/health

# Expected response:
{"status":"ok","service":"WhaSender Auth Server","timestamp":"..."}
```

---

## 🚀 PART 2B: Deploy to Render (Alternative)

**Why Render:**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy to use

### Step 2B.1: Create Render Account

1. **Go to:** https://render.com/
2. **Sign up with GitHub**
3. **Verify email**

### Step 2B.2: Create Web Service

1. **Dashboard > New +**
2. **Choose "Web Service"**
3. **Connect GitHub repository:** `whasender`
4. **Configure:**
   - Name: `whasender-auth`
   - Root Directory: `auth-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: **Free**

### Step 2B.3: Environment Variables

Add in Render dashboard:

```bash
MONGODB_URI=mongodb+srv://whasender-admin:YOUR_PASSWORD@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
SESSION_SECRET=your-session-secret-key-min-32-chars
```

### Step 2B.4: Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (5-10 minutes on free tier)
3. **Render provides URL:** `https://whasender-auth.onrender.com`

**⚠️ Note:** Free tier sleeps after inactivity, takes ~30s to wake up.

---

## 🚀 PART 2C: Deploy to DigitalOcean ($5/month)

**Why DigitalOcean:**
- ✅ Full control
- ✅ No sleep time
- ✅ Better performance
- ✅ Predictable pricing ($5/month)

### Step 2C.1: Create Droplet

1. **Sign up:** https://www.digitalocean.com/
2. **Create Droplet:**
   - Image: Ubuntu 22.04 LTS
   - Plan: Basic ($5/month)
   - CPU: Regular, 1GB RAM
   - Datacenter: Closest to your users
   - Authentication: SSH keys (recommended) or password
   - Hostname: `whasender-auth`

### Step 2C.2: Connect to Droplet

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP
```

### Step 2C.3: Install Node.js & PM2

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Verify
node -v
npm -v
```

### Step 2C.4: Deploy Auth Server

```bash
# Clone your repository
git clone https://github.com/YOUR-USERNAME/whasender.git
cd whasender/auth-server

# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Add to .env:**
```bash
MONGODB_URI=mongodb+srv://whasender-admin:YOUR_PASSWORD@whasender-auth.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-long
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
SESSION_SECRET=your-session-secret-key-min-32-chars
```

**Save:** Ctrl+X, Y, Enter

### Step 2C.5: Start with PM2

```bash
# Start server with PM2
pm2 start server.js --name whasender-auth

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it suggests
```

### Step 2C.6: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
apt install -y nginx

# Configure Nginx
nano /etc/nginx/sites-available/whasender-auth
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_DROPLET_IP;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable and restart:**
```bash
ln -s /etc/nginx/sites-available/whasender-auth /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 2C.7: Setup HTTPS (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
# If you have domain: auth.yourcompany.com
certbot --nginx -d auth.yourcompany.com
```

**Your auth server URL:** `http://YOUR_DROPLET_IP` or `https://auth.yourcompany.com`

---

## 📱 PART 3: Configure WhaSender App

Now update the app to connect to your deployed auth server.

### Step 3.1: Update Auth Configuration

**Edit:** `app/electron/auth/auth-manager.js`

Find this line (around line 10):
```javascript
const AUTH_SERVER_URL = 'http://localhost:3001';
```

**Change to your deployed URL:**
```javascript
// Railway
const AUTH_SERVER_URL = 'https://auth-server-production-xxxx.up.railway.app';

// Or Render
const AUTH_SERVER_URL = 'https://whasender-auth.onrender.com';

// Or DigitalOcean
const AUTH_SERVER_URL = 'http://YOUR_DROPLET_IP';
// Or with domain: 'https://auth.yourcompany.com';
```

### Step 3.2: Update CORS on Server

**Update Railway/Render environment variable:**
```bash
# If you have admin portal deployed at specific URL:
CORS_ORIGIN=https://admin.yourcompany.com,http://localhost:5001

# Or allow all (less secure but easier for testing):
CORS_ORIGIN=*
```

**For DigitalOcean, update .env file and restart:**
```bash
ssh root@YOUR_DROPLET_IP
cd whasender/auth-server
nano .env
# Update CORS_ORIGIN
pm2 restart whasender-auth
```

### Step 3.3: Test Connection

```bash
cd app
npm run dev

# Try to login
# Check console for connection errors
```

---

## 🧪 PART 4: Testing Everything

### Test 1: Health Check

```bash
# Test auth server is running
curl https://YOUR_AUTH_SERVER_URL/api/health

# Expected:
{"status":"ok","service":"WhaSender Auth Server","timestamp":"..."}
```

### Test 2: Create Test User

**Option A: Using Admin Portal**

1. Deploy admin portal (or run locally):
```bash
cd admin-portal/client
npm install
npm run dev
```

2. Update admin portal API URL in `admin-portal/client/src/lib/api.js`:
```javascript
const API_URL = 'https://YOUR_AUTH_SERVER_URL';
```

3. Create first admin user directly in MongoDB:

```bash
# Connect to MongoDB Atlas
# Use MongoDB Compass or mongo shell

# Insert admin user:
db.users.insertOne({
  email: "admin@yourcompany.com",
  password: "$2a$10$...", // Use bcrypt to hash "admin123"
  name: "Admin User",
  isActive: true,
  role: "admin",
  createdAt: new Date()
})
```

**Or use this script:**

Create `auth-server/scripts/create-admin.js`:
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await User.create({
    email: 'admin@yourcompany.com',
    password: hashedPassword,
    name: 'Admin User',
    isActive: true,
    role: 'admin'
  });

  console.log('Admin created:', admin.email);
  process.exit(0);
}

createAdmin();
```

Run it:
```bash
cd auth-server
node scripts/create-admin.js
```

### Test 3: Login from App

1. **Build and run WhaSender app:**
```bash
cd app
npm run dev
```

2. **Try to login** with test credentials:
   - Email: `admin@yourcompany.com`
   - Password: `admin123`

3. **Check if login succeeds**

### Test 4: Create Client User

1. **Login to admin portal**
2. **Create a new user:**
   - Email: `client@test.com`
   - Password: `client123`
   - Name: `Test Client`
   - Active: ✓

3. **Test login from WhaSender app** with client credentials

---

## ✅ Pre-Distribution Checklist

Before distributing app to clients:

- [ ] MongoDB Atlas cluster created and running
- [ ] Auth server deployed to cloud (Railway/Render/DO)
- [ ] Health endpoint returns OK
- [ ] Test user can login from app
- [ ] SMTP configuration tested (if using)
- [ ] Admin portal can manage users
- [ ] Auth server URL updated in app code
- [ ] App rebuilt with production auth URL
- [ ] Test on clean machine
- [ ] Backup MongoDB database

---

## 📦 Building App for Distribution

After auth server is deployed and tested:

### Update Production Configuration

**1. Update auth-manager.js with production URL**
**2. Update package.json version**
**3. Build the app:**

```bash
cd app
node scripts/release.js release patch mac
```

### Test Built App

```bash
# Test the built app
open release/WhaSender-*.dmg

# Install and verify:
1. Login works with deployed auth server
2. WhatsApp connects
3. Tasks can be created
4. All features work
```

### Publish Release

```bash
export GH_TOKEN="your_github_token"
node scripts/release.js publish mac
```

---

## 🔐 Security Best Practices

### MongoDB Security

✅ **Done:**
- Strong password for database user
- Network access control

✅ **Recommended:**
- Enable MongoDB encryption at rest
- Regular backups (Atlas does this automatically)
- Monitor unusual access patterns

### Auth Server Security

✅ **Must Do:**
- Use HTTPS (SSL certificate)
- Strong JWT_SECRET (min 32 characters)
- Set CORS_ORIGIN to specific domains
- Enable rate limiting (already in code)
- Regular security updates

**Update auth server periodically:**
```bash
# For Railway/Render: Push to GitHub, auto-deploys
git push origin main

# For DigitalOcean:
ssh root@YOUR_DROPLET_IP
cd whasender/auth-server
git pull
npm install
pm2 restart whasender-auth
```

### Environment Variables

❌ **Never commit:**
- .env files
- MongoDB passwords
- JWT secrets
- API keys

✅ **Always:**
- Use environment variables
- Rotate secrets every 6 months
- Use different secrets for dev/production

---

## 📊 Monitoring & Maintenance

### Check Server Health

**Railway/Render Dashboard:**
- Check logs
- Monitor CPU/memory
- View uptime

**DigitalOcean:**
```bash
# Check server status
ssh root@YOUR_DROPLET_IP
pm2 status
pm2 logs whasender-auth
```

### Database Backups

**MongoDB Atlas:**
- Automatic backups on M10+ clusters
- Free tier: No automatic backups
- Recommendation: Upgrade to M10 ($0.08/hour) for backups

**Manual Backup:**
```bash
# Export database
mongodump --uri="mongodb+srv://..." --out=./backup

# Import backup
mongorestore --uri="mongodb+srv://..." ./backup
```

---

## 🆘 Troubleshooting

### Problem: App can't connect to auth server

**Check:**
1. Auth server health endpoint responds
2. CORS is configured correctly
3. Auth URL in app is correct
4. No firewall blocking requests

**Debug:**
```bash
# From your Mac, test connectivity
curl https://YOUR_AUTH_SERVER_URL/api/health

# Check app logs
# macOS: ~/Library/Logs/WhaSender/
```

### Problem: MongoDB connection failed

**Check:**
1. Connection string is correct
2. Password has no special characters (or properly encoded)
3. Database name is included in connection string
4. Network access allows 0.0.0.0/0

**Test:**
```bash
# Test MongoDB connection
cd auth-server
node -e "const mongoose = require('mongoose'); mongoose.connect('YOUR_MONGO_URI').then(() => console.log('Connected!')).catch(e => console.error(e));"
```

### Problem: Auth server crashes

**Railway/Render:**
- Check logs in dashboard
- Verify environment variables are set
- Check for errors during deployment

**DigitalOcean:**
```bash
ssh root@YOUR_DROPLET_IP
pm2 logs whasender-auth --lines 100
```

### Problem: Slow authentication

**Possible causes:**
- Free tier servers (Render) sleep after inactivity
- MongoDB Atlas free tier limited performance
- Network latency

**Solutions:**
- Upgrade to paid tiers ($5-10/month)
- Choose server region closer to users
- Implement caching in app

---

## 💰 Cost Breakdown

### Free Option (Recommended for Testing)

```
MongoDB Atlas:     $0 (M0 Free tier, 512MB)
Railway:           $0 (Free $5 credit/month, covers auth server)
Domain (optional): $10-15/year
───────────────────────────────────────────────
Total:             $0-15/year
```

### Paid Option (Production)

```
MongoDB Atlas:     $0-9/month (M0 free or M10 for backups)
Railway:           $5-10/month (if exceeds free credit)
Domain:            $10-15/year
───────────────────────────────────────────────
Total:             $5-20/month
```

### DigitalOcean Option

```
MongoDB Atlas:     $0-9/month
DigitalOcean:      $5/month (1GB Droplet)
Domain:            $10-15/year
───────────────────────────────────────────────
Total:             $5-15/month
```

---

## 🎯 Recommended Setup

**For 1-10 clients:**
```
✓ MongoDB Atlas M0 (Free)
✓ Railway (Free tier)
✓ No custom domain needed (use Railway URL)
Cost: $0/month
```

**For 10-50 clients:**
```
✓ MongoDB Atlas M10 ($9/month) - For backups
✓ Railway Hobby ($5/month)
✓ Custom domain ($12/year)
Cost: ~$15/month
```

**For 50+ clients:**
```
✓ MongoDB Atlas M20 ($25/month)
✓ DigitalOcean 2GB ($12/month)
✓ Custom domain + SSL
Cost: ~$40/month
```

---

## 📞 Next Steps

After deploying auth server:

1. ✅ **Test everything thoroughly**
2. ✅ **Create client accounts in admin portal**
3. ✅ **Update WhaSender app with production auth URL**
4. ✅ **Build app for distribution**
5. ✅ **Test built app on clean machine**
6. ✅ **Distribute to clients**

**See:**
- [QUICK-START-RELEASE.md](QUICK-START-RELEASE.md) - For building app
- [DEPLOYMENT-GUIDE.md](DEPLOYMENT-GUIDE.md) - For complete deployment
- [auth-server/README.md](auth-server/README.md) - For auth server details

---

## ✅ Summary

**You are CORRECT to deploy auth server first!**

**Deployment flow:**
1. MongoDB Atlas (15 min) → Cloud database
2. Auth Server (30 min) → Railway/Render/DO
3. Update App Config (5 min) → Point to deployed server
4. Test Everything (10 min) → Verify it works
5. Build & Distribute (30 min) → Share with clients

**Total Time: ~90 minutes**

**After deployment:**
- All clients connect to same auth server
- You control all licenses from admin portal
- Centralized user management
- Easy updates (just update server)

🎉 **Ready to deploy!**

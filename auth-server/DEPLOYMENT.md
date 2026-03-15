# Authentication Server Deployment Guide

This guide explains how to deploy the WhaSender authentication server to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Production Setup](#production-setup)
3. [MongoDB Atlas Setup](#mongodb-atlas-setup)
4. [Platform-Specific Deployment](#platform-specific-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

- MongoDB Atlas account (or other MongoDB hosting)
- Production domain (optional but recommended)
- SSL certificate (most platforms provide this automatically)
- One of the following deployment platforms:
  - Railway (recommended - easiest)
  - Render
  - Heroku
  - DigitalOcean
  - AWS/GCP/Azure

---

## Production Setup

### 1. MongoDB Atlas Setup

1. **Create MongoDB Atlas Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free tier (sufficient for small-medium usage)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose "Shared" (Free tier)
   - Select cloud provider and region (closest to your users)
   - Cluster name: `whasender-cluster`

3. **Create Database User**
   - Database Access → Add New User
   - Authentication Method: Password
   - Username: `whasender_admin`
   - Generate secure password (save it!)
   - Database User Privileges: Read and write to any database

4. **Configure Network Access**
   - Network Access → Add IP Address
   - For development: Add Current IP
   - For production: Add `0.0.0.0/0` (allow from anywhere)
     - Note: This is safe as authentication is required

5. **Get Connection String**
   - Clusters → Connect → Connect your application
   - Driver: Node.js
   - Version: 4.1 or later
   - Copy connection string:
     ```
     mongodb+srv://whasender_admin:<password>@whasender-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your database password
   - Add database name: `whasender` at the end:
     ```
     mongodb+srv://whasender_admin:<password>@whasender-cluster.xxxxx.mongodb.net/whasender?retryWrites=true&w=majority
     ```

---

## Platform-Specific Deployment

### Option 1: Railway (Recommended - Easiest)

Railway provides free tier with 500 hours/month and automatic SSL.

#### Steps:

1. **Sign Up**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Dashboard → New Project
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select the `whasender` repository
   - Railway will detect Node.js automatically

3. **Configure Root Directory**
   - Settings → Root Directory: `auth-server`
   - This tells Railway to deploy only the auth-server folder

4. **Set Environment Variables**
   - Variables tab → Add variables:
     ```
     PORT=3001
     NODE_ENV=production
     MONGO_URI=mongodb+srv://whasender_admin:yourpassword@cluster.mongodb.net/whasender?retryWrites=true&w=majority
     JWT_SECRET=your-secure-64-character-random-string-here
     JWT_EXPIRY=5d
     ```

5. **Generate Domain**
   - Settings → Networking → Generate Domain
   - Railway provides a domain like: `whasender-auth-production.up.railway.app`
   - Or add custom domain

6. **Deploy**
   - Railway auto-deploys on git push
   - Check deployment logs
   - Access: `https://your-app.up.railway.app/api/health`

#### Cost:
- Free tier: 500 hours/month
- After free tier: ~$5/month

---

### Option 2: Render

Render provides free tier with automatic SSL and CI/CD.

#### Steps:

1. **Sign Up**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - Select `whasender` repo

3. **Configure Service**
   ```
   Name: whasender-auth
   Environment: Node
   Region: Oregon (US West) or closest to users
   Branch: main
   Root Directory: auth-server
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   - Environment tab → Add:
     ```
     PORT=3001
     NODE_ENV=production
     MONGO_URI=<your-mongodb-connection-string>
     JWT_SECRET=<your-secure-secret>
     JWT_EXPIRY=5d
     ```

5. **Create Service**
   - Render auto-deploys on git push
   - Free tier sleeps after 15 minutes of inactivity
   - URL: `https://whasender-auth.onrender.com`

#### Cost:
- Free tier available
- Paid tier: $7/month (no sleep)

---

### Option 3: Heroku

#### Steps:

1. **Install Heroku CLI**
   ```bash
   # macOS
   brew install heroku/brew/heroku

   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login**
   ```bash
   heroku login
   ```

3. **Create App**
   ```bash
   cd auth-server
   heroku create whasender-auth
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGO_URI="mongodb+srv://..."
   heroku config:set JWT_SECRET="your-secret"
   heroku config:set JWT_EXPIRY="5d"
   ```

5. **Deploy**
   ```bash
   git init  # if not already a git repo
   git add .
   git commit -m "Deploy to Heroku"
   heroku git:remote -a whasender-auth
   git push heroku main
   ```

6. **Open App**
   ```bash
   heroku open
   # Visit /api/health to verify
   ```

#### Cost:
- No free tier anymore (as of Nov 2022)
- Eco tier: $5/month
- Basic: $7/month

---

### Option 4: DigitalOcean App Platform

#### Steps:

1. **Sign Up**
   - Create account at https://www.digitalocean.com
   - $200 free credit for 60 days

2. **Create App**
   - Apps → Create App
   - GitHub source
   - Select `whasender` repo
   - Select `auth-server` directory

3. **Configure**
   ```
   Name: whasender-auth
   Type: Web Service
   Environment: Node.js
   Build Command: npm install
   Run Command: npm start
   HTTP Port: 3001
   ```

4. **Environment Variables**
   - Add all required variables
   - Use encrypted values for secrets

5. **Deploy**
   - Review and create
   - URL provided automatically

#### Cost:
- Basic: $5/month
- Professional: $12/month

---

### Option 5: Docker Deployment

For VPS (AWS EC2, GCP, DigitalOcean Droplet, etc.)

See `Dockerfile` and `docker-compose.yml` in this directory.

```bash
# Build image
docker build -t whasender-auth .

# Run container
docker run -d \
  -p 3001:3001 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET="your-secret" \
  -e NODE_ENV="production" \
  whasender-auth
```

---

## Environment Configuration

### Required Environment Variables

```bash
# Server
PORT=3001
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/whasender?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-very-long-random-secret-at-least-64-characters
JWT_EXPIRY=5d

# Optional
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

### Generating Secure JWT Secret

```bash
# Generate 64-character random string
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Or use: https://www.grc.com/passwords.htm

---

## Security Hardening

### 1. CORS Configuration

Update `server.js` to restrict CORS to your app domain:

```javascript
// Production CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-app-domain.com'] // Add your domains
    : '*',
  credentials: true,
};

app.use(cors(corsOptions));
```

### 2. Rate Limiting

Already implemented in `server.js` via `express-rate-limit`.

Adjust limits in production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
});

app.use('/api/', limiter);
```

### 3. HTTPS Only

Ensure your deployment platform provides SSL/TLS:
- Railway: Automatic
- Render: Automatic
- Heroku: Automatic with custom domains

### 4. Environment Variables

Never commit `.env` to git:
- Add `.env` to `.gitignore` (already done)
- Use platform environment variable management
- Rotate secrets regularly

### 5. MongoDB Security

- Enable MongoDB Atlas firewall
- Use strong database passwords
- Enable MongoDB encryption at rest
- Regular backups

### 6. Helmet Configuration

Already using `helmet()` for security headers.

Additional configuration:
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

---

## Update Electron App

After deploying, update the Electron app to use production auth server.

### 1. Add Environment Config

Create `app/electron/config/env.js`:

```javascript
module.exports = {
  AUTH_SERVER_URL: process.env.AUTH_SERVER_URL || 'https://your-production-url.com',
  isDevelopment: process.env.NODE_ENV !== 'production',
};
```

### 2. Update Auth Manager

In `app/electron/auth/auth-manager.js`:

```javascript
const { AUTH_SERVER_URL } = require('../config/env');

// Use production URL
const API_URL = AUTH_SERVER_URL + '/api/auth';
```

### 3. Test Connection

```bash
# In Electron app
curl https://your-production-url.com/api/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-03-10T...",
  "uptime": 123.456
}
```

---

## Monitoring & Maintenance

### Health Checks

Monitor your auth server health:

```bash
# Health endpoint
curl https://your-url.com/api/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-03-10T12:00:00.000Z",
  "uptime": 3600
}
```

### Logging

Add production logging:

```bash
npm install winston
```

Configure in `server.js`:
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Monitoring Services

Use one of:
- **UptimeRobot** - Free uptime monitoring
- **Pingdom** - Advanced monitoring
- **New Relic** - Application performance
- **Sentry** - Error tracking

### Database Backups

MongoDB Atlas:
- Cloud backup enabled automatically (free tier)
- Configure backup schedule
- Test restore procedure

### Performance Monitoring

Monitor:
- Response times
- Error rates
- Database query performance
- Memory usage
- CPU usage

Use platform dashboards or:
- PM2 (if using VPS)
- New Relic
- DataDog

---

## Deployment Checklist

Before going live:

- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Connection string tested
- [ ] Deployment platform chosen
- [ ] Auth server deployed
- [ ] Environment variables configured
- [ ] JWT secret generated (64+ characters)
- [ ] CORS configured for production
- [ ] HTTPS enabled
- [ ] Health endpoint working
- [ ] Rate limiting configured
- [ ] Logging setup
- [ ] Monitoring configured
- [ ] Backups enabled
- [ ] Electron app updated with production URL
- [ ] End-to-end testing completed
- [ ] Security review done

---

## Troubleshooting

### Issue: "Cannot connect to MongoDB"

**Check:**
- Connection string correct
- Password doesn't contain special characters (URL encode if needed)
- IP whitelist includes 0.0.0.0/0 or your server IP
- Database user has correct permissions

### Issue: "JWT token invalid"

**Check:**
- JWT_SECRET matches between server and client
- Token not expired (check JWT_EXPIRY)
- System time correct on server

### Issue: "CORS errors"

**Check:**
- CORS origin configured correctly
- Request includes correct headers
- OPTIONS preflight request allowed

### Issue: "Rate limit exceeded"

**Solution:**
- Increase rate limits for production
- Use authentication to bypass limits for authenticated users

---

## Scaling

### Horizontal Scaling

When traffic increases:

1. **Add more instances**
   - Railway/Render: Increase instance count
   - Load balancer automatically distributes traffic

2. **Database scaling**
   - Upgrade MongoDB Atlas tier
   - Add read replicas
   - Enable sharding

3. **Caching**
   - Add Redis for session storage
   - Cache frequent queries

### Performance Optimization

1. **Database indexes**
   ```javascript
   // In User model
   userSchema.index({ email: 1 });
   ```

2. **Compression**
   ```bash
   npm install compression
   ```
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

3. **Connection pooling**
   - Already handled by Mongoose

---

## Cost Estimates

### Free Tier (Getting Started)
- MongoDB Atlas: Free (512MB storage)
- Railway: Free (500 hours/month)
- **Total: $0/month**

### Small Scale (<1000 users)
- MongoDB Atlas: Free or $9/month (2GB)
- Railway/Render: $5-7/month
- **Total: ~$5-16/month**

### Medium Scale (1000-10000 users)
- MongoDB Atlas: $25/month (10GB)
- Railway/Render: $12-20/month (scaled)
- Monitoring: $10/month
- **Total: ~$47-55/month**

---

## Support

For deployment issues:
- Railway: https://railway.app/help
- Render: https://render.com/docs
- MongoDB Atlas: https://www.mongodb.com/docs/atlas/
- WhaSender: GitHub Issues

---

## Next Steps

After deployment:

1. Update Electron app with production URL
2. Test registration and login
3. Monitor server health
4. Set up automated backups
5. Configure monitoring alerts
6. Plan for scaling

---

**Deployment Status Checklist:** See bottom of this file for final verification before production launch.

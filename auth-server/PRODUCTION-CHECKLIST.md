# Production Deployment Checklist

Use this checklist to ensure all steps are completed before deploying to production.

## Pre-Deployment

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created and configured
- [ ] Database user created with strong password (16+ chars)
- [ ] Network access configured (0.0.0.0/0 or specific IPs)
- [ ] Connection string obtained and tested
- [ ] Database name set to `whasender`
- [ ] Backups enabled

### Security
- [ ] JWT secret generated (64+ characters random)
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] All secrets stored securely (not in code)
- [ ] `.env` file in `.gitignore`
- [ ] CORS origins configured for production
- [ ] Rate limiting configured appropriately
- [ ] HTTPS/SSL certificate ready (usually automatic on platform)

### Platform Setup
- [ ] Deployment platform account created (Railway/Render/etc.)
- [ ] Platform connected to GitHub repository
- [ ] Billing information added (if needed)
- [ ] Custom domain configured (optional)
- [ ] DNS records updated (if using custom domain)

---

## Deployment

### Environment Variables
Set these on your deployment platform:

- [ ] `NODE_ENV=production`
- [ ] `PORT=3001` (or platform default)
- [ ] `MONGO_URI=mongodb+srv://...` (your connection string)
- [ ] `JWT_SECRET=...` (64+ char random string)
- [ ] `JWT_EXPIRY=5d`
- [ ] `ALLOWED_ORIGINS=https://your-domain.com` (comma-separated if multiple)

### Deploy Auth Server
- [ ] Code pushed to GitHub
- [ ] Deployment triggered
- [ ] Build logs checked (no errors)
- [ ] Deployment successful
- [ ] Server URL noted (e.g., `https://whasender-auth.up.railway.app`)

---

## Post-Deployment Verification

### Health Checks
- [ ] Health endpoint accessible:
  ```bash
  curl https://your-url.com/api/health
  ```
  Expected response:
  ```json
  {
    "status": "ok",
    "timestamp": "2025-03-10T...",
    "uptime": 123.456
  }
  ```

### API Testing
- [ ] Test registration:
  ```bash
  curl -X POST https://your-url.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!@#"}'
  ```

- [ ] Test login:
  ```bash
  curl -X POST https://your-url.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"Test123!@#"}'
  ```

- [ ] Verify token returned
- [ ] Test verify endpoint with token

### Database Verification
- [ ] Check MongoDB Atlas dashboard
- [ ] Verify `users` collection created
- [ ] Test user appears in database
- [ ] Connection count normal (< 100)

---

## Electron App Configuration

### Update Production URL
- [ ] Edit `app/electron/config/env.js`:
  ```javascript
  const AUTH_SERVER_URL =
    process.env.AUTH_SERVER_URL ||
    (isDevelopment ? 'http://localhost:3001' : 'https://YOUR-PRODUCTION-URL.com');
  ```

### Build & Test
- [ ] Build Electron app with production config:
  ```bash
  cd app
  npm run build:mac  # or build:win, build:linux
  ```

- [ ] Test built app:
  - [ ] Registration works
  - [ ] Login works
  - [ ] Session persists
  - [ ] No console errors related to auth

### Production Build
- [ ] Update package.json version
- [ ] Create git tag for release
- [ ] Build for all platforms
- [ ] Test installers on target platforms

---

## Monitoring Setup

### Platform Monitoring
- [ ] Platform health monitoring enabled
- [ ] Email alerts configured for downtime
- [ ] Deployment notifications enabled

### External Monitoring
- [ ] UptimeRobot account created (free tier)
- [ ] Monitor created for `/api/health`
- [ ] Alert contacts configured
- [ ] Test alert by stopping server

### Logging
- [ ] Production logs accessible
- [ ] Error alerts configured
- [ ] Log retention policy set
- [ ] Sensitive data NOT logged

---

## Security Verification

### SSL/TLS
- [ ] HTTPS enforced
- [ ] Certificate valid
- [ ] No mixed content warnings
- [ ] SSL Labs test passed (https://www.ssllabs.com/ssltest/)

### API Security
- [ ] Rate limiting working:
  ```bash
  # Send 110 requests in 15 minutes - should get 429 error
  for i in {1..110}; do curl https://your-url.com/api/health; done
  ```

- [ ] CORS blocking unauthorized origins:
  ```bash
  curl -H "Origin: https://evil.com" https://your-url.com/api/auth/login
  # Should get CORS error
  ```

- [ ] Helmet headers present:
  ```bash
  curl -I https://your-url.com/api/health
  # Check for X-Content-Type-Options, X-Frame-Options, etc.
  ```

### Authentication
- [ ] Passwords hashed (bcrypt)
- [ ] JWT tokens expire correctly
- [ ] Invalid tokens rejected
- [ ] Password requirements enforced

---

## Performance Verification

### Response Times
- [ ] Health endpoint < 200ms
- [ ] Login endpoint < 500ms
- [ ] Register endpoint < 1000ms

Test:
```bash
curl -w "\nTime: %{time_total}s\n" https://your-url.com/api/health
```

### Load Testing (Optional)
- [ ] Install k6 or Apache Bench
- [ ] Test 100 concurrent users
- [ ] No errors or timeouts
- [ ] Response times acceptable

---

## Documentation

### Internal Documentation
- [ ] Production URL documented
- [ ] Environment variables documented
- [ ] Backup/restore procedure documented
- [ ] Rollback procedure documented
- [ ] On-call contact information

### User Documentation
- [ ] Release notes prepared
- [ ] Known issues documented
- [ ] Support contact information
- [ ] FAQ updated

---

## Backup & Recovery

### Backup Plan
- [ ] MongoDB Atlas automatic backups enabled
- [ ] Backup schedule configured (daily recommended)
- [ ] Retention policy set (30 days recommended)
- [ ] Backup restoration tested

### Disaster Recovery
- [ ] Database restore procedure documented
- [ ] Server rebuild procedure documented
- [ ] Estimated recovery time documented
- [ ] Team trained on recovery process

---

## Compliance & Legal

### Data Protection
- [ ] Privacy policy reviewed
- [ ] Terms of service reviewed
- [ ] Data retention policy defined
- [ ] GDPR compliance checked (if EU users)
- [ ] User data deletion process defined

### Monitoring & Logging
- [ ] User consent for data collection
- [ ] PII not logged in plain text
- [ ] Audit logging for security events
- [ ] Data breach response plan

---

## Final Checks

### Pre-Launch
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Monitoring configured
- [ ] Team notified of launch

### Launch Day
- [ ] Staged rollout plan (optional)
- [ ] Monitor logs and metrics
- [ ] Test critical paths
- [ ] Announce to users
- [ ] Support team ready

### Post-Launch (First Week)
- [ ] Monitor error rates daily
- [ ] Check response times
- [ ] Review user feedback
- [ ] Address critical issues
- [ ] Plan first update

---

## Platform-Specific Checks

### Railway
- [ ] Custom domain configured
- [ ] Auto-deploy on push enabled
- [ ] Environment variables synced
- [ ] Billing alerts set
- [ ] Team members added

### Render
- [ ] Auto-deploy enabled
- [ ] Health check path configured
- [ ] Zero-downtime deploys enabled
- [ ] Notification channels configured
- [ ] Private service if needed

### Heroku
- [ ] Dyno type selected
- [ ] Auto-scaling configured (optional)
- [ ] Review apps enabled (optional)
- [ ] Add-ons configured
- [ ] CI/CD pipeline set up

---

## Rollback Plan

If deployment fails:

1. **Immediate Actions**
   - [ ] Stop new deployments
   - [ ] Assess impact
   - [ ] Notify team

2. **Rollback Procedure**
   - [ ] Revert to previous deployment
   - [ ] Verify services restored
   - [ ] Check database integrity
   - [ ] Notify users if needed

3. **Post-Mortem**
   - [ ] Document what went wrong
   - [ ] Identify root cause
   - [ ] Plan fix
   - [ ] Update procedures

---

## Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Reviewed By:** _______________

**Production URL:** _______________

**Status:**
- [ ] ✅ All checks passed - Ready for production
- [ ] ⚠️ Some issues remain - Address before launch
- [ ] ❌ Not ready - Major issues

**Notes:**
```
_________________________________________
_________________________________________
_________________________________________
```

---

## Emergency Contacts

**Platform Support:**
- Railway: https://railway.app/help
- Render: https://render.com/docs
- Heroku: https://help.heroku.com

**Database Support:**
- MongoDB Atlas: https://support.mongodb.com

**Team:**
- Lead Developer: _______________
- DevOps: _______________
- On-Call: _______________

---

## Post-Production Monitoring

Monitor these metrics daily for first week:

- [ ] Uptime: Should be 99.9%+
- [ ] Error rate: Should be < 1%
- [ ] Response time: Should be < 500ms avg
- [ ] User registrations: Track growth
- [ ] Active sessions: Monitor concurrent users
- [ ] Database size: Check growth rate
- [ ] API calls: Monitor usage patterns

**Weekly Review:**
- [ ] Performance trends
- [ ] Error patterns
- [ ] User feedback
- [ ] Cost vs budget
- [ ] Scaling needs

---

**Congratulations on your production deployment! 🚀**

Remember: Launch is just the beginning. Continuous monitoring and improvement are key to success.

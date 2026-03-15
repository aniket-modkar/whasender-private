# Quick Start Guide

Follow these steps to get the admin portal running:

## Step 1: Configure Backend Environment

```bash
cd admin-portal/server
cp .env.example .env
```

Edit `server/.env` and update these values:

```env
MONGODB_URI=mongodb://localhost:27017/whasender
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="WhaSender Admin <your-email@gmail.com>"
```

## Step 2: Install Backend Dependencies

```bash
cd admin-portal/server
npm install
```

## Step 3: Seed Admin Users

```bash
npm run seed-admins
```

This creates two admin accounts:
- ankit.technomize@gmail.com
- aniket.technomize@gmail.com

## Step 4: Start Backend Server

```bash
npm run dev
```

Server should be running on http://localhost:5001

## Step 5: Install Frontend Dependencies

Open a new terminal:

```bash
cd admin-portal/client
npm install
```

## Step 6: Start Frontend

```bash
npm run dev
```

Frontend should be running on http://localhost:5173

## Step 7: Login

1. Open http://localhost:5173/login in your browser
2. Enter admin email: `ankit.technomize@gmail.com` or `aniket.technomize@gmail.com`
3. Click "Send OTP"
4. Check your email for the 6-digit OTP
5. Enter OTP and click "Verify & Sign In"

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running: `mongod` or `brew services start mongodb-community`
- Verify MONGODB_URI in `.env` is correct

### OTP Email Not Received
- Check spam folder
- Verify SMTP credentials in `.env`
- For Gmail, use an "App Password" instead of your regular password
- Enable "Less secure app access" or use OAuth2

### Port Already in Use
- Backend: Change PORT in `server/.env`
- Frontend: Change port in `client/vite.config.js`

### CORS Errors
- Make sure FRONTEND_URL in `server/.env` matches the frontend URL
- Check that both servers are running

## What's Next?

After logging in, you can:

1. **Manage Users**: Create, edit, and delete WhaSender users
2. **Configure SMTP**: Set up SMTP configurations to assign to users
3. **Monitor Stats**: View user statistics on the dashboard

Refer to the main [README.md](./README.md) for detailed documentation.

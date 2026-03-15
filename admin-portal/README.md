# WhaSender Admin Portal

Admin portal for managing WhaSender users, SMTP configurations, and platform settings.

## Features

- **OTP-based Authentication**: Secure email-based login without passwords
- **User Management**: Full CRUD operations for managing WhaSender users
- **SMTP Configuration**: Manage reusable SMTP configurations and assign them to users
- **Dashboard**: Overview of user statistics and platform metrics
- **Plan Management**: Control user plans and daily message limits

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB with Mongoose
- Nodemailer for OTP emails
- JWT-like session tokens

### Frontend
- React 18
- Vite
- TailwindCSS
- Zustand for state management
- React Router for routing
- Lucide React for icons

## Project Structure

```
admin-portal/
├── server/              # Backend API
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── scripts/         # Database scripts
│   ├── server.js        # Main server file
│   └── .env             # Environment variables
└── client/              # Frontend React app
    ├── src/
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable components
    │   ├── stores/      # Zustand stores
    │   ├── api/         # API client
    │   ├── App.jsx      # Main app component
    │   └── main.jsx     # Entry point
    └── .env             # Environment variables
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance running
- SMTP credentials for sending OTP emails

### Backend Setup

1. Navigate to server directory:
   ```bash
   cd admin-portal/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your values:
   ```env
   # Server
   PORT=5001
   FRONTEND_URL=http://localhost:5173

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/whasender

   # SMTP for OTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM="WhaSender Admin <your-email@gmail.com>"

   # OTP Settings
   OTP_LENGTH=6
   OTP_EXPIRY_MINUTES=10
   ```

4. Seed admin users:
   ```bash
   npm run seed-admins
   ```

   This creates two admin accounts:
   - ankit.technomize@gmail.com
   - aniket.technomize@gmail.com

5. Start the server:
   ```bash
   npm run dev
   ```

   Server will run on http://localhost:5001

### Frontend Setup

1. Navigate to client directory:
   ```bash
   cd admin-portal/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` if needed:
   ```env
   VITE_API_URL=http://localhost:5001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

   Frontend will run on http://localhost:5173

## Usage

### Login

1. Go to http://localhost:5173/login
2. Enter your admin email (ankit.technomize@gmail.com or aniket.technomize@gmail.com)
3. Click "Send OTP"
4. Check your email for the 6-digit OTP
5. Enter the OTP and click "Verify & Sign In"

### Managing Users

1. Navigate to "Users" from the sidebar
2. Click "Add User" to create a new WhaSender user
3. Fill in user details:
   - Email, Name, Password
   - Plan (FREE, BASIC, PRO, PREMIUM, ENTERPRISE)
   - Max Daily Messages
   - SMTP Config (optional)
   - Expiration Date (optional)
   - Active/Inactive status
4. Click "Create" to save

To edit or delete users, use the action buttons in the user table.

### Managing SMTP Configurations

1. Navigate to "SMTP Configs" from the sidebar
2. Click "Add SMTP Config" to create a new configuration
3. Fill in SMTP details:
   - Name and Description
   - Host and Port
   - SSL/TLS setting
   - Username and Password
   - Alert Email
   - Active/Inactive status
4. Click "Create" to save

These SMTP configs can then be assigned to users in the User Management section.

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for login
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/verify-session` - Verify session token
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (with pagination and search)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/stats/overview` - Get user statistics

### SMTP Configs
- `GET /api/smtp-configs` - Get all SMTP configurations
- `GET /api/smtp-configs/:id` - Get single SMTP config
- `POST /api/smtp-configs` - Create new SMTP config
- `PUT /api/smtp-configs/:id` - Update SMTP config
- `DELETE /api/smtp-configs/:id` - Delete SMTP config

## Security Notes

- Session tokens are simple Base64 encoded strings (for development)
- In production, replace with proper JWT tokens
- Add rate limiting to prevent OTP spam
- Add CSRF protection
- Use HTTPS in production
- Hash passwords properly (currently storing plain text - needs bcrypt)
- Validate and sanitize all inputs
- Add authentication middleware to protect routes

## Production Deployment

1. Update environment variables for production
2. Build the frontend:
   ```bash
   cd client
   npm run build
   ```
3. Serve the built files using the backend or a static hosting service
4. Use a process manager like PM2 to run the backend
5. Set up a reverse proxy (nginx) for SSL/TLS
6. Use a production MongoDB instance
7. Implement proper JWT authentication
8. Add rate limiting and security headers

## Future Enhancements

- Dashboard analytics and charts
- Email templates management
- Activity logs and audit trail
- Role-based access control (super admin, admin, viewer)
- Bulk user operations
- Export users to CSV
- Advanced filtering and sorting
- Real-time notifications
- Two-factor authentication
- Password reset flow for users

# WhaSender Authentication Server

Node.js/Express authentication server for WhaSender desktop application.

## Features

- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ MongoDB database
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Health check endpoint
- ✅ Docker support
- ✅ Production-ready

## Tech Stack

- **Node.js** 20+
- **Express** 5.x
- **MongoDB** (via Mongoose)
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- **express-rate-limit** for API protection

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or MongoDB Atlas)

### Local Development

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd auth-server
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Required environment variables**
   ```bash
   PORT=3001
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/whasender
   JWT_SECRET=your-super-secret-key-at-least-64-characters
   JWT_EXPIRY=5d
   ```

4. **Start server**
   ```bash
   npm start
   ```

   Server runs at http://localhost:3001

5. **Verify health**
   ```bash
   curl http://localhost:3001/api/health
   ```

## API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-03-10T12:00:00.000Z",
  "uptime": 123.456
}
```

### Register User
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

Response: Same as register

### Verify Token
```
POST /api/auth/verify
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

### Get User
```
GET /api/auth/user
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "createdAt": "2025-03-10T12:00:00.000Z"
  }
}
```

### Logout
```
POST /api/auth/logout
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

### Quick Deploy Options

#### Railway (Recommended)
1. Connect GitHub repo
2. Set environment variables
3. Deploy automatically

#### Render
1. Connect GitHub repo
2. Use `render.yaml` config
3. Deploy automatically

#### Docker
```bash
docker build -t whasender-auth .
docker run -d -p 3001:3001 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET="..." \
  whasender-auth
```

## Security

### Features
- Password hashing with bcrypt (10 rounds)
- JWT tokens with expiration
- Rate limiting (100 requests per 15 minutes)
- Helmet security headers
- CORS protection
- Input validation
- MongoDB injection protection

### Production Checklist
See [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)

## Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Verify (use token from login)
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer <your-token>"
```

## Project Structure

```
auth-server/
├── config/
│   └── db.js              # MongoDB connection
├── middleware/
│   └── auth.js            # JWT verification middleware
├── models/
│   └── User.js            # User model
├── routes/
│   └── auth.js            # Authentication routes
├── scripts/
│   └── test-auth.js       # Test script
├── .env.example           # Environment template
├── .dockerignore          # Docker ignore
├── Dockerfile             # Docker config
├── docker-compose.yml     # Docker Compose config
├── railway.json           # Railway config
├── render.yaml            # Render config
├── server.js              # Application entry
├── package.json           # Dependencies
├── DEPLOYMENT.md          # Deployment guide
├── PRODUCTION-CHECKLIST.md # Launch checklist
└── README.md              # This file
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 3001 | Server port |
| NODE_ENV | No | development | Environment (development/production) |
| MONGO_URI | Yes | - | MongoDB connection string |
| JWT_SECRET | Yes | - | JWT signing secret (64+ chars) |
| JWT_EXPIRY | No | 5d | JWT token expiration |
| ALLOWED_ORIGINS | No | * | Allowed CORS origins (comma-separated) |

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MONGO_URI is correct
- Verify MongoDB is running (if local)
- Check network access (if MongoDB Atlas)
- Ensure IP is whitelisted (if MongoDB Atlas)

### "JWT verification failed"
- Check JWT_SECRET matches between server and client
- Verify token hasn't expired
- Check token format is correct

### "CORS error"
- Add your domain to ALLOWED_ORIGINS
- In development, CORS is disabled

### "Rate limit exceeded"
- Wait 15 minutes
- Adjust rate limits in server.js if needed

## Development

### Running in Development
```bash
npm run dev
```

### Environment
- Uses development CORS (allows all origins)
- Detailed error messages
- Auto-reload with nodemon (if installed)

## Monitoring

### Health Monitoring
- Use `/api/health` endpoint
- Monitor uptime with UptimeRobot or Pingdom
- Check response times

### Metrics to Monitor
- Request rate
- Error rate
- Response times
- Database connections
- Memory usage

## Scaling

### Horizontal Scaling
- Add more server instances
- Use load balancer
- Ensure stateless operation (JWT-based)

### Database Scaling
- Use MongoDB Atlas auto-scaling
- Add read replicas
- Enable sharding for large datasets

## License

MIT

## Support

- Documentation: See /docs
- Issues: GitHub Issues
- Email: support@whasender.com

## Changelog

### v1.0.0 (Initial Release)
- User registration and login
- JWT authentication
- MongoDB integration
- Rate limiting
- Security headers
- Docker support
- Production deployment guides

---

**For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
**For production checklist, see [PRODUCTION-CHECKLIST.md](./PRODUCTION-CHECKLIST.md)**

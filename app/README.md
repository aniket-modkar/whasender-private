# WhaSender - WhatsApp Bulk Messaging Application

WhaSender is a powerful desktop application for sending bulk WhatsApp messages with advanced anti-ban protection, built with Electron and React.

## Features

### Core Features
- ✅ **Bulk Messaging** - Send messages to hundreds of contacts
- ✅ **Excel/CSV Import** - Upload contact lists from spreadsheets
- ✅ **Message Templates** - Use variables for personalization
- ✅ **Task Scheduling** - Schedule messages for later
- ✅ **Real-time Monitoring** - Track progress and stats live
- ✅ **Task Management** - Pause, resume, and stop tasks

### Anti-Ban Protection
- ✅ **Smart Delays** - Random delays between messages (45s-2m)
- ✅ **Batch Pauses** - Automatic breaks after message batches
- ✅ **Time Windows** - Send only during allowed hours (9 AM - 8 PM IST)
- ✅ **Account Warmup** - Gradual daily limit increases
- ✅ **Daily Limits** - Prevent exceeding recommended volumes
- ✅ **Human Simulation** - Typing indicators and natural timing

### Email Notifications
- ✅ **Task Alerts** - Get notified when tasks start/complete
- ✅ **Ban Detection** - Immediate alerts on rate limits
- ✅ **Daily Reports** - Summary of daily activity (9 PM IST)
- ✅ **SMTP Configuration** - Use any email provider

### System Features
- ✅ **System Tray** - Minimize to tray, background execution
- ✅ **Desktop Notifications** - Native system notifications
- ✅ **Auto-Update** - Automatic update checks and installation
- ✅ **Session Persistence** - WhatsApp stays connected
- ✅ **Multi-Platform** - Windows, macOS, Linux support

### UI Features
- ✅ **Dashboard** - Overview of stats and active tasks
- ✅ **Reports** - Detailed task history and analytics
- ✅ **Settings** - Configure SMTP, view anti-ban limits
- ✅ **Dark Theme** - Modern, eye-friendly interface

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **WhatsApp Account** - Phone number with WhatsApp installed
- **SMTP Server** (optional) - For email notifications

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/whasender.git
   cd whasender/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the authentication server**
   ```bash
   cd ../auth-server
   npm install
   npm start
   ```
   Server runs at http://localhost:3000

4. **Start the application**
   ```bash
   cd ../app
   npm run dev
   ```

### First Time Setup

1. **Register Account**
   - Open the app
   - Create account with email/password
   - Registration validates with auth server

2. **Connect WhatsApp**
   - Scan QR code with WhatsApp mobile
   - Settings → Linked Devices → Link a Device
   - Connection persists across restarts

3. **Configure Email (Optional)**
   - Go to Settings → Email Alerts
   - Enter SMTP details
   - Click "Send Test Email" to verify

4. **Create First Task**
   - Go to "New Task"
   - Upload CSV/Excel file with contacts
   - Write message template
   - Start or schedule task

## Usage Guide

### Creating a Task

1. **Prepare Contact File**

   Create a CSV or Excel file with columns:
   ```csv
   phone,name,company
   919876543210,John Doe,Acme Corp
   919876543211,Jane Smith,Tech Inc
   ```

2. **Upload File**
   - Click "New Task"
   - Select your CSV/Excel file
   - Preview contacts

3. **Compose Message**
   ```
   Hi {{name}},

   This is a message from {{company}}.

   Regards,
   WhaSender Team
   ```

4. **Schedule or Send**
   - Send Now: Starts immediately
   - Schedule: Pick date/time

### Monitoring Tasks

- **Dashboard**: Overview and active task
- **Monitor**: Real-time progress, logs, controls
- **Reports**: Historical data, filtering, export

### Managing Tasks

- **Pause**: Temporarily stop task
- **Resume**: Continue paused task
- **Stop**: Permanently end task
- **View Logs**: See detailed activity

## Anti-Ban Guidelines

### Daily Limits

| Account Age | Daily Limit | Status |
|-------------|-------------|--------|
| New (< 7 days) | 10 messages | Warmup |
| 7-14 days | 25 messages | Warmup |
| 14-30 days | 50 messages | Warmup |
| 30-60 days | 100 messages | Warmup |
| 60+ days | 200 messages | Normal |

### Best Practices

1. **Start Slow** - Begin with 5-10 messages/day
2. **Respect Limits** - Don't exceed recommended volumes
3. **Use Delays** - Never send messages back-to-back
4. **Send During Day** - 9 AM - 8 PM IST only
5. **Take Breaks** - Let batch pauses happen
6. **Monitor Closely** - Watch for warning signs
7. **Quality Over Quantity** - Focus on meaningful messages

### Warning Signs

- Messages not delivered
- "Not delivered" status
- Recipients not receiving messages
- WhatsApp asking for verification
- Unusual delays in delivery

If you see these signs:
- **Stop immediately**
- **Wait 24-48 hours**
- **Reduce daily volume**
- **Increase delays**

## Email Configuration

### Gmail Setup

1. **Enable 2-Factor Authentication**
   - Google Account → Security → 2-Step Verification

2. **Generate App Password**
   - Google Account → Security → App Passwords
   - Create password for "Mail"

3. **Configure in WhaSender**
   ```
   Host: smtp.gmail.com
   Port: 587
   Encryption: TLS
   Username: your.email@gmail.com
   Password: [16-char app password]
   ```

### Other Providers

**Outlook/Hotmail**
```
Host: smtp-mail.outlook.com
Port: 587
```

**Yahoo**
```
Host: smtp.mail.yahoo.com
Port: 587
```

**Custom SMTP**
```
Use your provider's settings
```

## Building for Production

See [BUILD.md](./BUILD.md) for detailed build instructions.

### Quick Build

```bash
# Build for current platform
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux

# Build for all platforms
npm run build:all
```

Outputs in `release/` directory.

## Project Structure

```
app/
├── electron/              # Electron main process
│   ├── main.js           # Application entry point
│   ├── preload.js        # Context bridge
│   ├── ipc-handlers.js   # IPC communication
│   ├── auth/             # Authentication
│   ├── whatsapp/         # WhatsApp integration
│   ├── anti-ban/         # Anti-ban engine
│   ├── task/             # Task management
│   ├── email/            # Email notifications
│   ├── database/         # SQLite database
│   ├── notifications/    # System notifications
│   └── utils/            # Utilities
├── src/                  # React frontend
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # React entry point
│   ├── pages/            # Page components
│   ├── components/       # Reusable components
│   ├── stores/           # Zustand stores
│   ├── lib/              # IPC wrappers
│   └── styles/           # Tailwind CSS
├── build/                # Build resources
├── scripts/              # Dev scripts
└── package.json          # Dependencies & config
```

## Technologies Used

### Backend
- **Electron** - Desktop app framework
- **Baileys** - WhatsApp Web API
- **better-sqlite3** - Local database
- **node-cron** - Task scheduling
- **nodemailer** - Email sending
- **electron-store** - Encrypted storage

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **Vite** - Build tool

### Tools
- **electron-builder** - App packaging
- **electron-updater** - Auto-updates

## Testing

See [TESTING-GUIDE.md](./TESTING-GUIDE.md) for comprehensive testing procedures.

### Quick Test

```bash
# Start app in dev mode
npm run dev

# Test workflow:
# 1. Register/Login
# 2. Connect WhatsApp
# 3. Create task with 3-5 test numbers
# 4. Monitor execution
# 5. Check received messages
```

## Error Handling

See [ERROR-HANDLING.md](./ERROR-HANDLING.md) for detailed error handling documentation.

### Common Issues

**WhatsApp won't connect**
- Check internet connection
- Try clearing session (Settings)
- Restart app
- Verify WhatsApp Web limit (5 devices max)

**Tasks won't start**
- Ensure WhatsApp is connected
- Check no other task is running
- Verify file uploaded correctly

**Messages failing to send**
- Check phone number format
- Verify number is on WhatsApp
- Look for rate limit warnings

**Ban detected**
- Stop all tasks immediately
- Wait 24-48 hours
- Review sending limits
- Reduce message volume

## Database Location

WhatsApp session and app data stored in:

- **macOS**: `~/Library/Application Support/whasender-app/`
- **Windows**: `%APPDATA%\whasender-app\`
- **Linux**: `~/.config/whasender-app/`

Contains:
- `whasender.db` - SQLite database
- `auth-state/` - WhatsApp session (encrypted)

## Security

- ✅ Credentials encrypted with device ID
- ✅ WhatsApp auth stored securely
- ✅ No passwords stored in plain text
- ✅ Context isolation enabled
- ✅ No remote code execution

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

MIT License - see LICENSE file

## Support

- **Documentation**: See docs in this directory
- **Issues**: GitHub Issues
- **Email**: support@whasender.com

## Changelog

### v1.0.0 (Initial Release)
- Complete bulk messaging system
- Anti-ban protection
- Email notifications
- System tray integration
- Auto-update support
- Multi-platform builds

## Roadmap

Future enhancements:
- [ ] Media file support (images, PDFs)
- [ ] Contact groups/segmentation
- [ ] A/B testing for messages
- [ ] Analytics dashboard
- [ ] Multiple WhatsApp accounts
- [ ] API for integrations

## Credits

Built with:
- [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Electron](https://electronjs.org) - Desktop framework
- [React](https://react.dev) - UI library
- [Tailwind CSS](https://tailwindcss.com) - Styling

## Disclaimer

This tool is for legitimate business communication only. Users are responsible for:
- Complying with WhatsApp Terms of Service
- Obtaining consent from recipients
- Following anti-spam regulations
- Respecting privacy laws

Misuse may result in WhatsApp account ban. Use responsibly.

---

**Made with ❤️ by the WhaSender Team**

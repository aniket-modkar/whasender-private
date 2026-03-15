const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { registerIpcHandlers } = require('./ipc-handlers');
const { initDatabase, closeDatabase } = require('./database/db');
const dailyReportScheduler = require('./email/daily-report-scheduler');
const notificationService = require('./notifications/notification-service');
const updateConfig = require('./config/update-config');

let mainWindow;
let tray = null;
let isQuitting = false;

function createSystemTray() {
  // Create a simple tray icon (16x16 template image)
  // For production, replace with actual icon file
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFJSURBVDiNpZM9TsNAEIW/WTsxEQgJCUEBDQfgAFyAK3AFrkBBQUNJQYsQDQ0lDSUXoKGgQKIgQkIgJ3ZiZ2coCmzZjv/yqtnR7pt582YV3nvkjxQRwBjDeDxGKYUxBmstxhgAjDGICMYYRASArusAUEqhtUZrTVmWzOdzRIRpmqiq6vtXSimstYgI+77HWou1Fu89XdcxmUwA8N6TZTHL5ZKyLJnP53jvyYoiB0Brm5/niGQAZFmOiABw/z0QEZRSvL29ESUpSimstXRdR9/3lGVJURTkeY7WmmUxR2mN1prtdkuSJCilKC+v0FpzfHzM1dU1SZJwdHREXdckSUIcx2itabf7zfCHYRhYPTwCEAQBnw8PAKRp+t+gtUZrTSvf85IkCbvdjuPjE06mZ5RlyWQyZbPZ0DQNbduyE5Gf59/o8fjM5eU1X1/ZtAI8ugMTAAAAAElFTkSuQmCC'
  );

  tray = new Tray(icon);

  // Create context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show WhaSender',
      click: () => {
        mainWindow.show();
        if (process.platform === 'darwin') {
          app.dock.show();
        }
      },
    },
    {
      label: 'Hide WhaSender',
      click: () => {
        mainWindow.hide();
        if (process.platform === 'darwin') {
          app.dock.hide();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'WhatsApp Status',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('WhaSender - WhatsApp Bulk Sender');
  tray.setContextMenu(contextMenu);

  // On click, show/hide window
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    } else {
      mainWindow.show();
      if (process.platform === 'darwin') {
        app.dock.show();
      }
    }
  });
}

function setupAutoUpdater() {
  // Configure auto-updater
  const isDev = process.env.NODE_ENV !== 'production';

  // Don't check for updates in development
  if (isDev) {
    console.log('Auto-updater disabled in development mode');
    return;
  }

  // Set update feed URL if custom server or GitHub private repo
  if (updateConfig.customServer) {
    console.log('Using custom update server:', updateConfig.customServer.url);
    autoUpdater.setFeedURL(updateConfig.customServer);
  } else if (updateConfig.github && updateConfig.github.private) {
    console.log('Using private GitHub repository for updates');
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: updateConfig.github.owner,
      repo: updateConfig.github.repo,
      private: true,
      token: updateConfig.github.token,
    });
  }

  // Configure update behavior from config
  autoUpdater.autoDownload = updateConfig.updater.autoDownload;
  autoUpdater.autoInstallOnAppQuit = updateConfig.updater.autoInstallOnAppQuit;

  // Update available
  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }

    // Show notification
    notificationService.show(
      'Update Available',
      `Version ${info.version} is available for download.`,
      { urgency: 'low' }
    );
  });

  // Update not available
  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available. Current version:', info.version);
  });

  // Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}%`;
    console.log(logMessage);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    }
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:update-downloaded', {
        version: info.version,
      });
    }

    // Show notification
    notificationService.show(
      'Update Ready',
      `Version ${info.version} has been downloaded and will be installed on restart.`,
      { urgency: 'normal' }
    );
  });

  // Error occurred
  autoUpdater.on('error', (error) => {
    console.error('Auto-updater error:', error);

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater:error', {
        message: error.message,
      });
    }
  });

  // Check for updates on startup (if enabled)
  if (updateConfig.updater.checkOnStartup) {
    setTimeout(() => {
      console.log('Checking for updates...');
      autoUpdater.checkForUpdates().catch((error) => {
        console.error('Failed to check for updates:', error);
      });
    }, updateConfig.updater.startupDelay);
  }

  // Periodic update checks (if interval is configured)
  if (updateConfig.updater.checkInterval) {
    setInterval(
      () => {
        console.log('Periodic update check...');
        autoUpdater.checkForUpdates().catch((error) => {
          console.error('Failed to check for updates:', error);
        });
      },
      updateConfig.updater.checkInterval
    );
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // In development, load from Vite dev server
  // In production, load from built files
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification on first minimize (optional)
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  // Initialize database
  initDatabase();

  // Initialize auth manager (async for electron-store ES module)
  const authManager = require('./auth/auth-manager');
  await authManager.init();

  // Initialize SMTP service with cached user config (if available)
  const smtpService = require('./email/smtp-service');
  const cachedUser = authManager.getUser();
  if (cachedUser && cachedUser.smtpConfig) {
    await smtpService.setConfigFromUser(cachedUser);
  } else {
    await smtpService.init(); // Initialize without config
  }

  createWindow();
  createSystemTray();
  setupAutoUpdater();
  registerIpcHandlers(mainWindow);

  // Start daily report scheduler
  dailyReportScheduler.start();
});

app.on('before-quit', () => {
  isQuitting = true;

  // Stop daily report scheduler
  dailyReportScheduler.stop();

  // Close database connection before quitting
  closeDatabase();
});

app.on('window-all-closed', () => {
  // Don't quit on window close - app continues in tray
  // Only quit on macOS if explicitly commanded
  if (process.platform === 'darwin' && isQuitting) {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

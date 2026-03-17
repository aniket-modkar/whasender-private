// IPC wrapper functions for renderer process

// Test function
export const ping = () => {
  return window.electronAPI.invoke('ping');
};

// Auth functions
export const authLogin = (email, password) => {
  return window.electronAPI.invoke('auth:login', { email, password });
};

export const authLogout = () => {
  return window.electronAPI.invoke('auth:logout');
};

export const authVerify = () => {
  return window.electronAPI.invoke('auth:verify');
};

export const authGetUser = () => {
  return window.electronAPI.invoke('auth:get-user');
};

export const authIsAuthenticated = () => {
  return window.electronAPI.invoke('auth:is-authenticated');
};

export const authCheckStatus = () => {
  return window.electronAPI.invoke('auth:check-status');
};

// WhatsApp functions
export const waConnect = () => {
  return window.electronAPI.invoke('wa:connect');
};

export const waDisconnect = () => {
  return window.electronAPI.invoke('wa:disconnect');
};

export const waGetStatus = () => {
  return window.electronAPI.invoke('wa:status');
};

export const waClearSession = () => {
  return window.electronAPI.invoke('wa:clear-session');
};

// Database test
export const dbTest = () => {
  return window.electronAPI.invoke('db:test');
};

// Task functions
export const taskCreate = (data) => {
  return window.electronAPI.invoke('task:create', data);
};

export const taskStart = (taskId) => {
  return window.electronAPI.invoke('task:start', taskId);
};

export const taskPause = () => {
  return window.electronAPI.invoke('task:pause');
};

export const taskResume = (taskId) => {
  return window.electronAPI.invoke('task:resume', taskId);
};

export const taskStop = (taskId) => {
  return window.electronAPI.invoke('task:stop', taskId);
};

export const taskGetActive = () => {
  return window.electronAPI.invoke('task:get-active');
};

export const taskGetStats = (taskId) => {
  return window.electronAPI.invoke('task:get-stats', taskId);
};

export const taskGetHistory = () => {
  return window.electronAPI.invoke('task:get-history');
};

// Log functions
export const taskGetLogs = (taskId, options = {}) => {
  return window.electronAPI.invoke('task:get-logs', {
    taskId,
    limit: options.limit || 100,
    level: options.level || null,
    search: options.search || null,
  });
};

export const taskExportLogs = (taskId, format = 'csv') => {
  return window.electronAPI.invoke('task:export-logs', { taskId, format });
};

export const taskClearLogs = (taskId) => {
  return window.electronAPI.invoke('task:clear-logs', taskId);
};

export const logsCleanupOld = (daysToKeep = 30) => {
  return window.electronAPI.invoke('logs:cleanup-old', daysToKeep);
};

// File functions
export const parseNumbers = (filePath) => {
  return window.electronAPI.invoke('file:parse-numbers', filePath);
};

// SMTP functions (removed - now configured via MongoDB)

// Event listeners
export const onWaQr = (callback) => {
  return window.electronAPI.on('wa:qr', callback);
};

export const onWaStatus = (callback) => {
  return window.electronAPI.on('wa:status', callback);
};

export const onWaError = (callback) => {
  return window.electronAPI.on('wa:error', callback);
};

export const onTaskProgress = (callback) => {
  return window.electronAPI.on('task:progress', callback);
};

export const onTaskStatusChange = (callback) => {
  return window.electronAPI.on('task:status-change', callback);
};

export const onTaskComplete = (callback) => {
  return window.electronAPI.on('task:complete', callback);
};

export const onTaskBanDetected = (callback) => {
  return window.electronAPI.on('task:ban-detected', callback);
};

// Dashboard functions
export const getDashboardStats = () => {
  return window.electronAPI.invoke('dashboard:get-stats');
};

// Notification functions
export const notificationsEnable = () => {
  return window.electronAPI.invoke('notifications:enable');
};

export const notificationsDisable = () => {
  return window.electronAPI.invoke('notifications:disable');
};

export const notificationsIsEnabled = () => {
  return window.electronAPI.invoke('notifications:is-enabled');
};

// Auto-updater functions
export const updaterCheckForUpdates = () => {
  return window.electronAPI.invoke('updater:check-for-updates');
};

export const updaterDownloadUpdate = () => {
  return window.electronAPI.invoke('updater:download-update');
};

export const updaterQuitAndInstall = () => {
  return window.electronAPI.invoke('updater:quit-and-install');
};

export const updaterGetVersion = () => {
  return window.electronAPI.invoke('updater:get-version');
};

// Auto-updater event listeners
export const onUpdaterUpdateAvailable = (callback) => {
  return window.electronAPI.on('updater:update-available', callback);
};

export const onUpdaterDownloadProgress = (callback) => {
  return window.electronAPI.on('updater:download-progress', callback);
};

export const onUpdaterUpdateDownloaded = (callback) => {
  return window.electronAPI.on('updater:update-downloaded', callback);
};

export const onUpdaterError = (callback) => {
  return window.electronAPI.on('updater:error', callback);
};

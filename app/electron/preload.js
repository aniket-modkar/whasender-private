const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  invoke: (channel, data) => {
    // Whitelist channels
    const validChannels = [
      'ping',
      'auth:login',
      'auth:verify',
      'auth:logout',
      'auth:get-user',
      'auth:is-authenticated',
      'auth:check-status',
      'wa:connect',
      'wa:disconnect',
      'wa:status',
      'wa:clear-session',
      'db:test',
      'task:create',
      'task:start',
      'task:pause',
      'task:resume',
      'task:stop',
      'task:get-active',
      'task:get-stats',
      'task:get-history',
      'task:get-logs',
      'task:export-logs',
      'task:clear-logs',
      'logs:cleanup-old',
      'file:parse-numbers',
      'dialog:open-file',
      'dashboard:get-stats',
      'notifications:enable',
      'notifications:disable',
      'notifications:is-enabled',
      'updater:check-for-updates',
      'updater:download-update',
      'updater:quit-and-install',
      'updater:get-version',
      'media:save-file',
      'media:delete-file',
      'media:get-file-info',
      'media:validate-file',
      'media:cleanup-temp',
      'media:delete-task-media',
      'media:get-disk-usage',
      'test:send-message',
      'contacts:add',
      'contacts:import',
      'contacts:get-all',
      'contacts:get',
      'contacts:update',
      'contacts:delete',
      'contacts:delete-multiple',
      'contacts:get-count',
      'contacts:get-tags',
      'contacts:export',
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }

    throw new Error(`Invalid IPC channel: ${channel}`);
  },

  on: (channel, callback) => {
    const validChannels = [
      'wa:qr',
      'wa:status',
      'wa:error',
      'task:progress',
      'task:status-change',
      'task:complete',
      'task:ban-detected',
      'updater:update-available',
      'updater:download-progress',
      'updater:update-downloaded',
      'updater:error',
    ];

    if (validChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);

      // Return unsubscribe function
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }

    throw new Error(`Invalid IPC channel: ${channel}`);
  },
});

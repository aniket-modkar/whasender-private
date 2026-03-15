/**
 * Auto-Update Configuration
 *
 * Configure GitHub repository and update settings here
 */

module.exports = {
  // ============================================
  // Repository Settings
  // ============================================

  github: {
    owner: 'your-github-username',  // ← CHANGE THIS to your GitHub username
    repo: 'whasender',              // ← CHANGE THIS if repo name is different

    // Is this a PRIVATE repository?
    private: false,  // ← Set to TRUE if using private GitHub repo

    // Read-only token for private repos (from bot account)
    // Only needed if private: true
    // SAFE to commit - should be read-only token from bot account
    token: process.env.GH_UPDATE_TOKEN || '',  // ← Add bot token here if private repo
  },

  // ============================================
  // Update Behavior
  // ============================================

  updater: {
    // Auto-download updates without asking?
    autoDownload: false,  // false = ask user first (recommended)

    // Auto-install when user quits app?
    autoInstallOnAppQuit: true,  // true = install on next restart

    // Check for updates on startup?
    checkOnStartup: true,

    // Startup delay before first check (milliseconds)
    startupDelay: 5000,  // 5 seconds

    // Auto-check interval (milliseconds)
    // null = don't auto-check
    checkInterval: 6 * 60 * 60 * 1000,  // 6 hours
  },

  // ============================================
  // Alternative: Custom Update Server
  // ============================================

  // Uncomment to use custom update server instead of GitHub
  // customServer: {
  //   provider: 'generic',
  //   url: 'https://updates.yourcompany.com/',
  // },
};

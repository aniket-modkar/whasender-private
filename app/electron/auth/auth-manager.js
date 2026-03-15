const { getDeviceId } = require('./device-fingerprint');
const { AUTH_SERVER_URL } = require('../config/env');
const smtpService = require('../email/smtp-service');

// Default auth server URL from environment config
const DEFAULT_AUTH_SERVER_URL = AUTH_SERVER_URL;

// Encryption key derived from device ID
const deviceId = getDeviceId();

let Store;
let store;

class AuthManager {
  constructor() {
    this.initialized = false;
    this.authServerUrl = DEFAULT_AUTH_SERVER_URL;
  }

  // Initialize electron-store (async because it's an ES module)
  async init() {
    if (this.initialized) return;

    const ElectronStore = await import('electron-store');
    Store = ElectronStore.default;

    store = new Store({
      name: 'auth-data',
      encryptionKey: deviceId.substring(0, 32), // Use first 32 chars of device ID
    });

    this.authServerUrl = store.get('authServerUrl', DEFAULT_AUTH_SERVER_URL);
    this.initialized = true;
  }

  // Get auth server URL
  getAuthServerUrl() {
    return this.authServerUrl;
  }

  // Set auth server URL
  setAuthServerUrl(url) {
    this.authServerUrl = url;
    store.set('authServerUrl', url);
  }

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.authServerUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          deviceId: getDeviceId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Cache token and user data
      store.set('token', data.token);
      store.set('tokenExpiry', data.expiresAt);
      store.set('user', data.user);
      store.set('lastVerified', new Date().toISOString());

      // Initialize SMTP service with user's config
      if (data.user && data.user.smtpConfig) {
        await smtpService.setConfigFromUser(data.user);
      }

      return {
        success: true,
        user: data.user,
        isActive: data.user?.isActive !== false, // Include active status
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verify token and get latest user data
  async verifyToken(fullCheck = false) {
    try {
      const token = store.get('token');
      const tokenExpiry = store.get('tokenExpiry');
      const lastVerified = store.get('lastVerified');

      if (!token) {
        return { valid: false };
      }

      // Check if token has expired (client-side check)
      const expiryDate = new Date(tokenExpiry);
      if (new Date() > expiryDate) {
        console.log('Token expired (client-side check)');
        this.clearAuth();
        return { valid: false };
      }

      // Try to verify with server
      try {
        const response = await fetch(`${this.authServerUrl}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Update last verified timestamp
          store.set('lastVerified', new Date().toISOString());

          // Update user data if server sent it (includes isActive status)
          if (data.user) {
            store.set('user', data.user);

            // Update SMTP config if user data includes it
            if (data.user.smtpConfig) {
              await smtpService.setConfigFromUser(data.user);
            }
          }

          return {
            valid: true,
            user: data.user,
            isActive: data.user?.isActive !== false,
          };
        } else {
          // Token invalid on server
          this.clearAuth();
          return { valid: false };
        }
      } catch (networkError) {
        // Server unreachable - check offline grace period
        const lastVerifiedDate = new Date(lastVerified);
        const hoursSinceVerified =
          (new Date() - lastVerifiedDate) / (1000 * 60 * 60);

        // Allow 12 hours offline grace period
        if (hoursSinceVerified < 12) {
          console.log(
            `Server unreachable, using offline mode (${hoursSinceVerified.toFixed(1)} hours since last verify)`
          );
          // Return cached user data
          const cachedUser = store.get('user');
          return {
            valid: true,
            user: cachedUser,
            isActive: cachedUser?.isActive !== false,
            offline: true,
          };
        } else {
          console.log('Offline grace period exceeded');
          return { valid: false };
        }
      }
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false };
    }
  }

  // Check account status (lightweight check)
  async checkAccountStatus() {
    try {
      const token = store.get('token');
      if (!token) {
        return { success: false, isActive: false };
      }

      const response = await fetch(`${this.authServerUrl}/api/auth/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Update cached user data
        if (data.user) {
          store.set('user', data.user);

          // Update SMTP config if user data includes it
          if (data.user.smtpConfig) {
            await smtpService.setConfigFromUser(data.user);
          }
        }

        return {
          success: true,
          isActive: data.user?.isActive !== false,
          user: data.user,
        };
      } else {
        // If endpoint doesn't exist, fall back to cached data
        const cachedUser = store.get('user');
        return {
          success: true,
          isActive: cachedUser?.isActive !== false,
          user: cachedUser,
        };
      }
    } catch (error) {
      // Network error - use cached data
      console.log('Status check failed, using cached data');
      const cachedUser = store.get('user');
      return {
        success: true,
        isActive: cachedUser?.isActive !== false,
        user: cachedUser,
      };
    }
  }

  // Logout
  async logout() {
    try {
      const token = store.get('token');

      if (token) {
        // Try to revoke session on server
        try {
          await fetch(`${this.authServerUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });
        } catch (error) {
          // Ignore network errors during logout
          console.log('Could not contact server during logout');
        }
      }

      // Clear local data
      this.clearAuth();

      return {
        success: true,
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get cached user data
  getUser() {
    return store.get('user', null);
  }

  // Check if authenticated
  isAuthenticated() {
    const token = store.get('token');
    const tokenExpiry = store.get('tokenExpiry');

    if (!token || !tokenExpiry) {
      return false;
    }

    // Simple client-side check
    const expiryDate = new Date(tokenExpiry);
    return new Date() < expiryDate;
  }

  // Clear auth data
  clearAuth() {
    store.delete('token');
    store.delete('tokenExpiry');
    store.delete('user');
    store.delete('lastVerified');
  }
}

// Export singleton instance
const authManager = new AuthManager();
module.exports = authManager;

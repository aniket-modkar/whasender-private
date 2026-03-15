/**
 * Environment configuration for WhaSender
 * Manages authentication server URL and environment settings
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// Auth server URL configuration
// Set AUTH_SERVER_URL environment variable to override
const AUTH_SERVER_URL =
  process.env.AUTH_SERVER_URL ||
  (isDevelopment ? 'http://localhost:3001' : 'https://whasender-auth-production.up.railway.app');

module.exports = {
  isDevelopment,
  AUTH_SERVER_URL,
  API_BASE_URL: `${AUTH_SERVER_URL}/api`,
};

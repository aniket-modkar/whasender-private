const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class APIClient {
  constructor() {
    this.baseURL = API_URL;
  }

  getAuthToken() {
    const stored = localStorage.getItem('admin-auth-storage');
    if (stored) {
      const data = JSON.parse(stored);
      return data.state?.token;
    }
    return null;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async requestOTP(email) {
    return this.request('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email, otp) {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async verifySession() {
    return this.request('/api/auth/verify-session');
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUser(id) {
    return this.request(`/api/users/${id}`);
  }

  async createUser(userData) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserStats() {
    return this.request('/api/users/stats/overview');
  }

  // SMTP Config endpoints
  async getSmtpConfigs() {
    return this.request('/api/smtp-configs');
  }

  async getSmtpConfig(id) {
    return this.request(`/api/smtp-configs/${id}`);
  }

  async createSmtpConfig(configData) {
    return this.request('/api/smtp-configs', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  async updateSmtpConfig(id, configData) {
    return this.request(`/api/smtp-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(configData),
    });
  }

  async deleteSmtpConfig(id) {
    return this.request(`/api/smtp-configs/${id}`, {
      method: 'DELETE',
    });
  }
}

export default new APIClient();

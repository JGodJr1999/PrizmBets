import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for security and logging
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const tokens = getStoredAuthTokens();
    if (tokens && tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Helper function to get stored tokens
const getStoredAuthTokens = () => {
  let tokens = localStorage.getItem('prizmbets_auth_tokens');
  if (!tokens) {
    tokens = sessionStorage.getItem('prizmbets_auth_tokens');
  }
  
  if (tokens) {
    try {
      return JSON.parse(tokens);
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      return null;
    }
  }
  return null;
};

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Response Error:', error);
    
    // Handle common error scenarios
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Handle unauthorized access - try token refresh
      console.warn('Unauthorized access - attempting token refresh');
      
      const tokens = getStoredAuthTokens();
      if (tokens && tokens.refreshToken && !originalRequest.url.includes('/auth/refresh')) {
        originalRequest._retry = true;
        
        try {
          const refreshResponse = await api.post('/auth/refresh', {
            refresh_token: tokens.refreshToken
          });
          
          const newTokens = {
            accessToken: refreshResponse.data.access_token,
            refreshToken: refreshResponse.data.refresh_token,
            timestamp: Date.now()
          };
          
          // Update stored tokens
          const storage = localStorage.getItem('prizmbets_auth_tokens') ? localStorage : sessionStorage;
          storage.setItem('prizmbets_auth_tokens', JSON.stringify(newTokens));
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens and redirect to login
          localStorage.removeItem('prizmbets_auth_tokens');
          sessionStorage.removeItem('prizmbets_auth_tokens');
          localStorage.removeItem('prizmbets_user');
          sessionStorage.removeItem('prizmbets_user');
          
          // Notify the app about the auth failure
          window.dispatchEvent(new CustomEvent('authTokenExpired'));
        }
      }
    } else if (error.response?.status === 429) {
      // Handle rate limiting
      console.warn('Rate limit exceeded');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error occurred');
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  // === AUTHENTICATION ENDPOINTS ===
  
  // User registration
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Firebase user registration
  async registerFirebaseUser(userData) {
    try {
      const response = await api.post('/auth/register/firebase', userData);
      return response.data;
    } catch (error) {
      console.error('Firebase registration error:', error);
      throw error;
    }
  },

  // User login
  async login(email, password, rememberMe = false) {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        remember_me: rememberMe
      });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Get current user profile
  async getCurrentUser(token) {
    try {
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Refresh authentication tokens
  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh', {
        refresh_token: refreshToken
      });
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },

  // User logout
  async logout(token) {
    try {
      const response = await api.post('/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(profileData, token) {
    try {
      const response = await api.put('/auth/profile', profileData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },

  // Change password
  async changePassword(currentPassword, newPassword, token) {
    try {
      const response = await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  },

  // Get user sessions
  async getUserSessions(token) {
    try {
      const response = await api.get('/auth/sessions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get sessions error:', error);
      throw error;
    }
  },

  // Revoke specific session
  async revokeSession(sessionId, token) {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Revoke session error:', error);
      throw error;
    }
  },

  // Logout from all sessions
  async logoutAll(token) {
    try {
      const response = await api.post('/auth/logout-all', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Logout all error:', error);
      throw error;
    }
  },

  // === CORE API ENDPOINTS ===

  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Health check failed');
    }
  },

  // Evaluate parlay with AI
  async evaluateParlay(parlayData) {
    try {
      // Validate input data before sending
      if (!parlayData || !parlayData.bets || parlayData.bets.length === 0) {
        throw new Error('Invalid parlay data: must include at least one bet');
      }

      if (!parlayData.total_amount || parlayData.total_amount <= 0) {
        throw new Error('Invalid parlay data: total amount must be greater than 0');
      }

      const response = await api.post('/evaluate', parlayData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to evaluate parlay');
    }
  },

  // Future endpoints can be added here
  async getOdds(sport, event) {
    // Placeholder for odds comparison endpoint
    throw new Error('Odds comparison not yet implemented');
  },

  async getUserProfile() {
    // Placeholder for user profile endpoint
    throw new Error('User profiles not yet implemented');
  },

  async saveParlay(parlayData) {
    // Placeholder for saving parlays
    throw new Error('Parlay saving not yet implemented');
  },

  // === ODDS COMPARISON ENDPOINTS ===

  // Get best odds for a specific bet
  async getBestOdds(betData) {
    try {
      if (!betData || !betData.team || !betData.bet_type) {
        throw new Error('Invalid bet data: team and bet_type are required');
      }

      const response = await api.post('/odds/best', betData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get best odds');
    }
  },

  // Get comprehensive odds comparison for a sport
  async getOddsComparison(sport, limit = 10) {
    try {
      const response = await api.get(`/odds/comparison/${sport}?limit=${limit}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get odds comparison');
    }
  },

  // Get deep link to sportsbook
  async getSportsbookDeepLink(linkData) {
    try {
      if (!linkData || !linkData.sportsbook || !linkData.team || !linkData.sport) {
        throw new Error('Invalid link data: sportsbook, team, and sport are required');
      }

      const response = await api.post('/odds/deep-link', linkData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to generate sportsbook link');
    }
  },

  // Get list of supported sports
  async getSupportedSports() {
    try {
      const response = await api.get('/odds/sports');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get supported sports');
    }
  },

  // === PAYMENT & SUBSCRIPTION ENDPOINTS ===

  // Get subscription tiers
  async getSubscriptionTiers() {
    try {
      const response = await api.get('/payments/subscription/tiers');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get subscription tiers');
    }
  },

  // Create subscription
  async createSubscription(tier) {
    try {
      const response = await api.post('/payments/subscription/create', { tier });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create subscription');
    }
  },

  // Cancel subscription
  async cancelSubscription() {
    try {
      const response = await api.post('/payments/subscription/cancel');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to cancel subscription');
    }
  },

  // Update subscription
  async updateSubscription(tier) {
    try {
      const response = await api.post('/payments/subscription/update', { tier });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update subscription');
    }
  },

  // Get subscription status
  async getSubscriptionStatus() {
    try {
      const response = await api.get('/payments/subscription/status');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get subscription status');
    }
  },

  // Check feature access
  async checkFeatureAccess(feature) {
    try {
      const response = await api.get(`/payments/feature-access/${feature}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to check feature access');
    }
  },

  // Get premium analytics (Pro/Premium only)
  async getPremiumAnalytics() {
    try {
      const response = await api.get('/payments/premium/analytics');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get premium analytics');
    }
  },

  // Get personal consultation (Premium only)
  async getPersonalConsultation(consultationData) {
    try {
      const response = await api.post('/payments/premium/personal-consultant', consultationData);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get personal consultation');
    }
  },

  // === USAGE TRACKING ENDPOINTS ===

  // Get current user usage stats
  async getUserUsage() {
    try {
      const response = await api.get('/api/usage/current');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get usage data');
    }
  },

  // Get usage history
  async getUserUsageHistory(days = 30) {
    try {
      const response = await api.get(`/api/usage/history?days=${days}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get usage history');
    }
  },

  // === EDUCATIONAL CONTENT ENDPOINTS ===

  // Get demo parlays
  async getDemoParlays() {
    try {
      const response = await api.get('/api/education/demo-parlays');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get demo parlays');
    }
  },

  // Get tutorials
  async getTutorials() {
    try {
      const response = await api.get('/api/education/tutorials');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get tutorials');
    }
  },

  // Get specific tutorial
  async getTutorial(id) {
    try {
      const response = await api.get(`/api/education/tutorials/${id}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get tutorial');
    }
  },

  // === ADMIN ENDPOINTS ===

  // Get admin dashboard data
  async getAdminDashboard() {
    try {
      const response = await api.get('/api/admin/dashboard');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get admin dashboard');
    }
  },

  // Get user analytics
  async getUserAnalytics() {
    try {
      const response = await api.get('/api/admin/users/analytics');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get user analytics');
    }
  },

  // Get system health
  async getSystemHealth() {
    try {
      const response = await api.get('/api/admin/system/health');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get system health');
    }
  }
};

export default api;
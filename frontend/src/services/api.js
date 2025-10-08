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
      const response = await api.get('/api_health');
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

      const response = await api.post('/api_evaluate', parlayData);
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

  // === SPORTS DATA ENDPOINTS ===

  // Get live scores
  async getLiveScores() {
    try {
      const response = await api.get('/api_live_scores');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get live scores');
    }
  },

  // Get all games
  async getAllGames(perSport = 3, upcoming = true) {
    try {
      const response = await api.get(`/api_all_games?per_sport=${perSport}&upcoming=${upcoming}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get all games');
    }
  },

  // Get live odds for all sports
  async getLiveOddsAll(perSport = 3, upcoming = true) {
    try {
      const response = await api.get(`/api_all_games?per_sport=${perSport}&upcoming=${upcoming}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get live odds for all sports');
    }
  },

  // Get live odds for specific sport
  async getLiveOddsBySport(sport) {
    try {
      const response = await api.get(`/api_odds_comparison?sport=${sport}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to get live odds for ${sport}`);
    }
  },

  // === ODDS COMPARISON ENDPOINTS ===

  // Get best odds for a specific bet
  async getBestOdds(betData) {
    try {
      if (!betData || !betData.team || !betData.bet_type) {
        throw new Error('Invalid bet data: team and bet_type are required');
      }

      const response = await api.post('/api_odds_comparison', betData);
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
      const response = await api.get(`/api_odds_comparison?sport=${sport}&limit=${limit}`);
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
  },

  // === SUBSCRIPTION & USAGE ENDPOINTS ===

  // Get current user subscription and usage stats
  async getSubscription() {
    try {
      const response = await api.get('/usage');
      return response.data;
    } catch (error) {
      console.error('Failed to load subscription:', error);
      // Return default free tier on error
      return {
        tier: 'free',
        status: 'active',
        limits: {
          daily_evaluations: 3,
          daily_odds_comparisons: 10,
          max_bets: 50,
          concurrent_games: 5
        },
        usage: {
          evaluations_today: 0,
          comparisons_today: 0,
          total_bets: 0
        }
      };
    }
  },

  // Track usage for an action (evaluation, odds_comparison, bet_tracking)
  async trackUsage(actionType) {
    try {
      // Usage tracking happens server-side automatically
      // This is just a placeholder for future client-side confirmation
      return Promise.resolve({ tracked: true });
    } catch (error) {
      console.error('Failed to track usage:', error);
      return Promise.resolve({ tracked: false });
    }
  },

  // === AGENT SYSTEM ENDPOINTS ===

  // Get agent system health status
  async getAgentHealth() {
    try {
      const response = await api.get('/api_agents_health');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent system health');
    }
  },

  // Get comprehensive agent dashboard data
  async getAgentDashboard() {
    try {
      const response = await api.get('/api_agents_dashboard');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent dashboard data');
    }
  },

  // Initialize the agent system
  async initializeAgents(config = {}) {
    try {
      const response = await api.post('/api_agents_init', {
        config: {
          auto_start: true,
          enable_monitoring: true,
          ...config
        }
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to initialize agent system');
    }
  },

  // Execute a task with a specific agent
  async executeAgentTask(agentId, taskType, taskData = {}, priority = 'medium') {
    try {
      if (!agentId || !taskType) {
        throw new Error('Agent ID and task type are required');
      }

      const response = await api.post('/api_agents_task', {
        agent_id: agentId,
        task_type: taskType,
        task_data: taskData,
        priority: priority,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to execute task for agent ${agentId}`);
    }
  },

  // Get status of all agents
  async getAgentStatuses() {
    try {
      const response = await api.get('/api_agents_dashboard');
      return response.data?.agents || {};
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent statuses');
    }
  },

  // Get specific agent details
  async getAgentDetails(agentId) {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      const response = await api.get(`/api_agents_dashboard?agent_id=${agentId}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to get details for agent ${agentId}`);
    }
  },

  // Get agent task history
  async getAgentTaskHistory(agentId = null, limit = 50) {
    try {
      let url = `/api_agents_dashboard?include_history=true&limit=${limit}`;
      if (agentId) {
        url += `&agent_id=${agentId}`;
      }

      const response = await api.get(url);
      return response.data?.task_history || [];
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent task history');
    }
  },

  // Start a specific agent
  async startAgent(agentId) {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      const response = await api.post('/api_agents_task', {
        agent_id: agentId,
        task_type: 'start_agent',
        task_data: {},
        priority: 'high'
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to start agent ${agentId}`);
    }
  },

  // Stop a specific agent
  async stopAgent(agentId) {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      const response = await api.post('/api_agents_task', {
        agent_id: agentId,
        task_type: 'stop_agent',
        task_data: {},
        priority: 'high'
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to stop agent ${agentId}`);
    }
  },

  // Restart a specific agent
  async restartAgent(agentId) {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      const response = await api.post('/api_agents_task', {
        agent_id: agentId,
        task_type: 'restart_agent',
        task_data: {},
        priority: 'high'
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to restart agent ${agentId}`);
    }
  },

  // Get agent system metrics
  async getAgentMetrics() {
    try {
      const response = await api.get('/api_agents_dashboard?include_metrics=true');
      return response.data?.metrics || {};
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent system metrics');
    }
  },

  // Get agent logs
  async getAgentLogs(agentId = null, limit = 100, level = 'all') {
    try {
      let url = `/api_agents_dashboard?include_logs=true&limit=${limit}&level=${level}`;
      if (agentId) {
        url += `&agent_id=${agentId}`;
      }

      const response = await api.get(url);
      return response.data?.logs || [];
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent logs');
    }
  },

  // Configure agent settings
  async configureAgent(agentId, configuration) {
    try {
      if (!agentId || !configuration) {
        throw new Error('Agent ID and configuration are required');
      }

      const response = await api.post('/api_agents_task', {
        agent_id: agentId,
        task_type: 'configure_agent',
        task_data: { configuration },
        priority: 'medium'
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error(`Failed to configure agent ${agentId}`);
    }
  },

  // === USER PREFERENCES & CUSTOMIZATION ===
  // Get user agent preferences
  async getUserAgentPreferences() {
    try {
      const response = await api.get('/api/user/agent-preferences');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get user agent preferences');
    }
  },

  // Update user agent preferences
  async updateUserAgentPreferences(preferences) {
    try {
      const response = await api.put('/api/user/agent-preferences', preferences);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to update user agent preferences');
    }
  },

  // Get agent templates for common workflows
  async getAgentTemplates() {
    try {
      const response = await api.get('/api/agent-templates');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent templates');
    }
  },

  // Create custom agent workflow from template
  async createAgentWorkflowFromTemplate(templateId, customization = {}) {
    try {
      const response = await api.post('/api/agent-workflows', {
        template_id: templateId,
        customization,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to create agent workflow from template');
    }
  },

  // Get user's custom agent workflows
  async getUserAgentWorkflows() {
    try {
      const response = await api.get('/api/user/agent-workflows');
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get user agent workflows');
    }
  },

  // Schedule agent tasks for automation
  async scheduleAgentTask(agentId, taskConfig) {
    try {
      const response = await api.post('/api/agent-scheduler', {
        agent_id: agentId,
        schedule: taskConfig.schedule,
        task_type: taskConfig.taskType,
        task_data: taskConfig.taskData || {},
        enabled: taskConfig.enabled !== false,
        notification_preferences: taskConfig.notifications || {},
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to schedule agent task');
    }
  },

  // Get agent performance analytics
  async getAgentAnalytics(timeRange = '7d', agentId = null) {
    try {
      let url = `/api/agent-analytics?time_range=${timeRange}`;
      if (agentId) {
        url += `&agent_id=${agentId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent analytics');
    }
  },

  // Get agent cost tracking data
  async getAgentCostData(timeRange = '30d') {
    try {
      const response = await api.get(`/api/agent-costs?time_range=${timeRange}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent cost data');
    }
  },

  // Export agent data and reports
  async exportAgentData(exportConfig) {
    try {
      const response = await api.post('/api/agent-export', {
        export_type: exportConfig.type || 'comprehensive',
        time_range: exportConfig.timeRange || '30d',
        agents: exportConfig.agents || [],
        format: exportConfig.format || 'json',
        include_analytics: exportConfig.includeAnalytics !== false,
        include_cost_data: exportConfig.includeCostData !== false,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to export agent data');
    }
  },

  // Get real-time agent notifications
  async getAgentNotifications(limit = 20) {
    try {
      const response = await api.get(`/api/agent-notifications?limit=${limit}`);
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to get agent notifications');
    }
  },

  // Mark agent notifications as read
  async markNotificationsRead(notificationIds) {
    try {
      const response = await api.patch('/api/agent-notifications', {
        notification_ids: notificationIds,
        action: 'mark_read',
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Failed to mark notifications as read');
    }
  }
};

export default api;
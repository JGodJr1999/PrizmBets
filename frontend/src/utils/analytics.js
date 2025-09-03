/**
 * Analytics utility for tracking user behavior and business metrics
 * CEO-focused tracking for revenue, engagement, and conversion optimization
 */

class AnalyticsManager {
  constructor() {
    this.isInitialized = false;
    this.events = [];
    this.userId = null;
    this.sessionId = null;
  }

  // Initialize analytics (Google Analytics, Mixpanel, etc.)
  initialize(config = {}) {
    if (this.isInitialized) return;

    this.sessionId = this.generateSessionId();
    console.log('🔍 Analytics initialized');
    
    // In production, initialize real analytics services here
    if (process.env.NODE_ENV === 'production') {
      // Initialize Google Analytics 4
      if (config.gaTrackingId) {
        this.initializeGA4(config.gaTrackingId);
      }
      
      // Initialize custom analytics
      this.initializeCustomTracking();
    }

    this.isInitialized = true;
  }

  initializeGA4(trackingId) {
    // Google Analytics 4 implementation
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', trackingId, {
      send_page_view: false // We'll send custom page views
    });
  }

  initializeCustomTracking() {
    // Custom analytics for business metrics
    this.trackEvent('app_initialized', {
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      screen_resolution: `${window.screen.width}x${window.screen.height}`
    });
  }

  // Set user ID for tracking
  setUserId(userId) {
    this.userId = userId;
    console.log(`🔍 User identified: ${userId}`);
    
    if (window.gtag) {
      window.gtag('config', 'GA_TRACKING_ID', {
        user_id: userId
      });
    }
  }

  // Track page views
  trackPageView(pageName, additionalData = {}) {
    const eventData = {
      event: 'page_view',
      page_name: pageName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    this.events.push(eventData);
    console.log('📄 Page view:', eventData);

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: pageName,
        page_location: window.location.href
      });
    }
  }

  // Track business-critical events
  trackEvent(eventName, properties = {}) {
    const eventData = {
      event: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer
      }
    };

    this.events.push(eventData);
    console.log('🎯 Event tracked:', eventData);

    if (window.gtag) {
      window.gtag('event', eventName, properties);
    }

    // Send to backend for revenue tracking
    this.sendToBackend(eventData);
  }

  // CEO Dashboard Metrics - Track key business events
  trackRegistration(method, userData) {
    this.trackEvent('user_registered', {
      method, // 'email', 'google', 'apple'
      user_tier: 'free',
      registration_source: this.getTrafficSource(),
      user_data: userData
    });
  }

  trackLogin(method) {
    this.trackEvent('user_login', {
      method,
      login_source: this.getTrafficSource()
    });
  }

  trackParlayEvaluation(parlayData, result) {
    this.trackEvent('parlay_evaluated', {
      bet_count: parlayData.bets?.length || 0,
      total_amount: parlayData.total_amount || 0,
      ai_score: result.overall_score,
      confidence: result.confidence,
      recommendation: result.recommendation,
      user_tier: this.getUserTier()
    });
  }

  trackSubscriptionUpgrade(fromTier, toTier, price) {
    this.trackEvent('subscription_upgraded', {
      from_tier: fromTier,
      to_tier: toTier,
      price: price,
      upgrade_source: this.getTrafficSource(),
      revenue: price
    });
  }

  trackUsageLimitHit(limitType) {
    this.trackEvent('usage_limit_reached', {
      limit_type: limitType, // 'parlay_evaluations', 'odds_comparisons'
      user_tier: this.getUserTier(),
      conversion_opportunity: true
    });
  }

  trackError(errorType, errorMessage, context) {
    this.trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context: context,
      user_tier: this.getUserTier()
    });
  }

  // Conversion funnel tracking
  trackFunnelStep(step, additionalData = {}) {
    const funnelEvents = {
      'landing': 'User landed on site',
      'registration_started': 'Registration form opened',
      'registration_completed': 'User successfully registered',
      'first_parlay_viewed': 'User viewed parlay builder',
      'first_evaluation_completed': 'User completed first evaluation',
      'usage_limit_hit': 'User hit free tier limits',
      'upgrade_prompt_shown': 'Upgrade prompt displayed',
      'upgrade_completed': 'User upgraded subscription'
    };

    this.trackEvent('funnel_step', {
      step,
      description: funnelEvents[step],
      ...additionalData
    });
  }

  // Performance metrics
  trackPerformance(metricName, value, context = {}) {
    this.trackEvent('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      context
    });
  }

  // Utility methods
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getTrafficSource() {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('utm_source')) {
      return `${urlParams.get('utm_source')}_${urlParams.get('utm_medium')}`;
    }
    
    if (referrer) {
      if (referrer.includes('google')) return 'google_organic';
      if (referrer.includes('facebook')) return 'facebook';
      if (referrer.includes('twitter')) return 'twitter';
      return 'referral';
    }
    
    return 'direct';
  }

  getUserTier() {
    // This should come from user context/state
    return 'free'; // Default for now
  }

  // Send events to backend for server-side analytics
  async sendToBackend(eventData) {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });
      }
    } catch (error) {
      console.warn('Analytics backend error:', error);
    }
  }

  // Get analytics summary for debugging/admin
  getAnalyticsSummary() {
    const eventTypes = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1;
      return acc;
    }, {});

    return {
      total_events: this.events.length,
      session_id: this.sessionId,
      user_id: this.userId,
      event_types: eventTypes,
      session_duration: Date.now() - parseInt(this.sessionId.split('_')[1])
    };
  }
}

// Create global analytics instance
const analytics = new AnalyticsManager();

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  analytics.initialize({
    gaTrackingId: process.env.REACT_APP_GA_TRACKING_ID
  });
}

export default analytics;
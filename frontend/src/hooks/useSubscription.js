import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { canPerformAction, getUsageSummary } from '../services/usageService';

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState({
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
    },
    loading: true
  });

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    } else {
      // Reset to free tier if no user
      setSubscription(prev => ({
        ...prev,
        tier: 'free',
        loading: false
      }));
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      const data = await apiService.getSubscription();
      setSubscription({
        ...data,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load subscription:', error);
      // Default to free tier on error
      setSubscription(prev => ({
        ...prev,
        tier: 'free',
        loading: false
      }));
    }
  };

  const hasFeatureAccess = (feature) => {
    const tierLevels = { free: 0, pro: 1, elite: 2 };
    const featureTiers = {
      unlimited_evaluations: 'pro',
      email_tracking: 'pro',
      advanced_ai: 'pro',
      unlimited_alerts: 'pro',
      ai_recommendations: 'elite',
      steam_moves: 'elite',
      vip_community: 'elite',
      priority_chat: 'elite'
    };

    const requiredTier = featureTiers[feature] || 'free';
    return tierLevels[subscription.tier] >= tierLevels[requiredTier];
  };

  const canPerformAction = async (action) => {
    // Pro and Elite users have unlimited access
    if (subscription.tier !== 'free') {
      return {
        allowed: true,
        remaining: -1, // unlimited
        limit: -1,
        unlimited: true
      };
    }

    // Use new usage service for free tier limits
    try {
      const actionMap = {
        evaluation: 'aiParlayEvaluation',
        odds_comparison: 'oddsComparison',
        bet_tracking: 'betTracking',
        live_games: 'liveGames'
      };

      const serviceAction = actionMap[action] || action;
      const result = await canPerformAction(user?.uid, serviceAction, { tier: subscription.tier });

      return {
        allowed: result.allowed,
        remaining: result.allowed ? (result.limit - result.used) : 0,
        limit: result.limit || 0,
        used: result.used || 0,
        unlimited: result.unlimited || false,
        message: result.message,
        resetPeriod: result.resetPeriod
      };
    } catch (error) {
      console.error('Error checking action permission:', error);
      // Fallback to allow action if service fails
      return {
        allowed: true,
        remaining: 0,
        limit: 0,
        unlimited: false,
        message: 'Usage check failed'
      };
    }
  };

  const trackUsage = async (action) => {
    // Only track for free tier
    if (subscription.tier !== 'free') return;

    try {
      await apiService.trackUsage(action);

      // Update local state
      setSubscription(prev => {
        const usageKey = `${action}s_today`;
        const currentUsage = prev.usage[usageKey] || 0;

        return {
          ...prev,
          usage: {
            ...prev.usage,
            [usageKey]: currentUsage + 1
          }
        };
      });
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  };

  return {
    subscription,
    hasFeatureAccess,
    canPerformAction,
    trackUsage,
    refresh: loadSubscriptionData,
    isLoading: subscription.loading,
    tier: subscription.tier
  };
};
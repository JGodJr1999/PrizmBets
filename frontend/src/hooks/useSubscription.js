import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

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

  const canPerformAction = (action) => {
    // Pro and Elite users have unlimited access
    if (subscription.tier !== 'free') {
      return {
        allowed: true,
        remaining: -1, // unlimited
        limit: -1,
        unlimited: true
      };
    }

    // Free tier limits
    const actionMap = {
      evaluation: {
        used: subscription.usage.evaluations_today,
        limit: subscription.limits.daily_evaluations
      },
      odds_comparison: {
        used: subscription.usage.comparisons_today,
        limit: subscription.limits.daily_odds_comparisons
      },
      bet_tracking: {
        used: subscription.usage.total_bets,
        limit: subscription.limits.max_bets
      }
    };

    const actionData = actionMap[action];
    if (!actionData) {
      return { allowed: true, remaining: 0, limit: 0 };
    }

    const allowed = actionData.used < actionData.limit;
    const remaining = actionData.limit - actionData.used;

    return {
      allowed,
      remaining: Math.max(0, remaining),
      limit: actionData.limit,
      used: actionData.used,
      unlimited: false
    };
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
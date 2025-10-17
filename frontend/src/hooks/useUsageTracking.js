import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserUsage,
  getMonthlyUsage,
  canPerformAction,
  trackUsage,
  getUsageSummary,
  resetWeeklyUsage,
  resetDailyUsage
} from '../services/usageService';
import { isMasterAdmin } from '../services/masterAdminService';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing usage tracking and limits
 */
export const useUsageTracking = () => {
  const { user } = useAuth();
  const [usageSummary, setUsageSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get user's subscription tier (default to free if not set)
  const userTier = user?.subscription_tier || 'free';
  const subscription = { tier: userTier };

  // Load usage data
  const loadUsageData = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const summary = await getUsageSummary(user.uid, subscription);
      setUsageSummary(summary);
    } catch (err) {
      console.error('Error loading usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, userTier]);

  // Load usage data on mount and when user changes
  useEffect(() => {
    loadUsageData();
  }, [loadUsageData]);

  /**
   * Check if user can perform an action
   */
  const checkLimit = useCallback(async (action) => {
    if (!user?.uid) {
      return { allowed: false, message: 'User not authenticated' };
    }

    try {
      return await canPerformAction(user.uid, action, subscription, user);
    } catch (error) {
      console.error('Error checking limit:', error);
      return { allowed: true, message: 'Limit check failed, allowing action' };
    }
  }, [user?.uid, user?.email, userTier]);

  /**
   * Track usage after successful action
   */
  const recordUsage = useCallback(async (action) => {
    if (!user?.uid) {
      return;
    }

    // Check if master admin (will skip tracking automatically)
    if (isMasterAdmin(user)) {
      return;
    }

    // Don't track for non-free users
    if (userTier !== 'free') {
      return;
    }

    try {
      await trackUsage(user.uid, action, subscription, user);
      // Reload usage data to reflect changes
      await loadUsageData();
    } catch (error) {
      console.error('Error recording usage:', error);
    }
  }, [user?.uid, userTier, loadUsageData]);

  /**
   * Check limit and show appropriate message/modal
   */
  const checkAndWarn = useCallback(async (action, actionName = action) => {
    const result = await checkLimit(action);

    if (!result.allowed) {
      toast.error(result.message);
      return false;
    }

    // If near limit, show warning
    if (result.limit && result.used >= result.limit * 0.8) {
      const remaining = result.limit - result.used;
      toast.warning(`${remaining} ${actionName} remaining this ${result.resetPeriod}`);
    }

    return true;
  }, [checkLimit]);

  /**
   * Perform an action with automatic limit checking and usage tracking
   */
  const performAction = useCallback(async (action, actionCallback, actionName = action) => {
    const canPerform = await checkAndWarn(action, actionName);

    if (!canPerform) {
      return { success: false, limitReached: true };
    }

    try {
      // Execute the action
      const result = await actionCallback();

      // Track usage if action was successful
      if (result && result !== false) {
        await recordUsage(action);
      }

      return { success: true, result };
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      return { success: false, error };
    }
  }, [checkAndWarn, recordUsage]);

  /**
   * Get usage info for a specific feature
   */
  const getFeatureUsage = useCallback((feature) => {
    if (!usageSummary || usageSummary.unlimited) {
      return { used: 0, limit: -1, unlimited: true };
    }

    return usageSummary.features[feature] || { used: 0, limit: 0 };
  }, [usageSummary]);

  /**
   * Get remaining usage for a feature
   */
  const getRemainingUsage = useCallback((feature) => {
    const usage = getFeatureUsage(feature);

    if (usage.unlimited) {
      return -1; // Unlimited
    }

    return Math.max(0, usage.limit - usage.used);
  }, [getFeatureUsage]);

  /**
   * Check if a feature limit has been reached
   */
  const isLimitReached = useCallback((feature) => {
    const usage = getFeatureUsage(feature);

    if (usage.unlimited) {
      return false;
    }

    return usage.used >= usage.limit;
  }, [getFeatureUsage]);

  /**
   * Get usage percentage for a feature
   */
  const getUsagePercentage = useCallback((feature) => {
    const usage = getFeatureUsage(feature);

    if (usage.unlimited || usage.limit <= 0) {
      return 0;
    }

    return Math.min(100, (usage.used / usage.limit) * 100);
  }, [getFeatureUsage]);

  /**
   * Force refresh usage data
   */
  const refresh = useCallback(() => {
    return loadUsageData();
  }, [loadUsageData]);

  /**
   * Reset usage counters (for testing or manual reset)
   */
  const resetUsage = useCallback(async (type = 'both') => {
    if (!user?.uid) return;

    try {
      if (type === 'weekly' || type === 'both') {
        await resetWeeklyUsage(user.uid);
      }
      if (type === 'daily' || type === 'both') {
        await resetDailyUsage(user.uid);
      }

      await loadUsageData();
      toast.success(`${type} usage reset successfully`);
    } catch (error) {
      console.error('Error resetting usage:', error);
      toast.error('Failed to reset usage');
    }
  }, [user?.uid, loadUsageData]);

  // Master admin checks
  const isMasterAdminAccount = isMasterAdmin(user);

  return {
    // State
    usageSummary,
    loading,
    error,

    // User info
    userTier: isMasterAdminAccount ? 'master-admin' : userTier,
    isFreeTier: !isMasterAdminAccount && userTier === 'free',
    isMasterAdmin: isMasterAdminAccount,

    // Core functions
    checkLimit,
    recordUsage,
    performAction,

    // Convenience functions
    checkAndWarn,
    getFeatureUsage,
    getRemainingUsage,
    isLimitReached,
    getUsagePercentage,

    // Utility functions
    refresh,
    resetUsage,

    // Feature-specific helpers
    canUseAIParlay: () => checkLimit('aiParlayEvaluation'),
    canUseOddsComparison: () => checkLimit('oddsComparison'),
    canTrackBet: () => checkLimit('betTracking'),
    canViewLiveGame: () => checkLimit('liveGames'),

    // Usage tracking helpers
    trackAIParlay: () => recordUsage('aiParlayEvaluation'),
    trackOddsComparison: () => recordUsage('oddsComparison'),
    trackBet: () => recordUsage('betTracking'),
    trackLiveGame: () => recordUsage('liveGames')
  };
};
import { canPerformAction, trackUsage } from '../services/usageService';
import toast from 'react-hot-toast';

/**
 * Utility functions for checking limits and showing appropriate messages
 */

/**
 * Check if user can perform an action and show appropriate toast messages
 */
export const checkFeatureLimit = async (userId, action, subscription = null, showToast = true) => {
  try {
    const result = await canPerformAction(userId, action, subscription);

    if (!result.allowed && showToast) {
      toast.error(result.message);
    }

    return result;
  } catch (error) {
    console.error('Error checking feature limit:', error);
    if (showToast) {
      toast.error('Unable to check usage limits. Please try again.');
    }
    return { allowed: false, error: true };
  }
};

/**
 * Perform an action with automatic limit checking and usage tracking
 */
export const performWithLimitCheck = async (
  userId,
  action,
  actionCallback,
  subscription = null,
  options = {}
) => {
  const {
    showLimitToast = true,
    showSuccessToast = false,
    successMessage = 'Action completed successfully',
    onLimitReached = null
  } = options;

  try {
    // Check if action is allowed
    const limitCheck = await checkFeatureLimit(userId, action, subscription, showLimitToast);

    if (!limitCheck.allowed) {
      // If there's a custom limit reached handler, call it
      if (onLimitReached) {
        onLimitReached(limitCheck);
      }

      return {
        success: false,
        limitReached: true,
        limitInfo: limitCheck
      };
    }

    // Show remaining usage warning if near limit
    if (limitCheck.limit && limitCheck.used >= limitCheck.limit * 0.8 && showLimitToast) {
      const remaining = limitCheck.limit - limitCheck.used;
      toast.warning(
        `${remaining} ${action.replace(/([A-Z])/g, ' $1').toLowerCase()} remaining this ${limitCheck.resetPeriod || 'period'}`
      );
    }

    // Perform the action
    const result = await actionCallback();

    // Track usage if action was successful
    if (result !== false && result !== null) {
      await trackUsage(userId, action);

      if (showSuccessToast) {
        toast.success(successMessage);
      }
    }

    return {
      success: true,
      result,
      limitInfo: limitCheck
    };

  } catch (error) {
    console.error(`Error performing ${action}:`, error);
    toast.error('An error occurred while performing this action.');

    return {
      success: false,
      error: true,
      errorMessage: error.message
    };
  }
};

/**
 * Get user-friendly limit status message
 */
export const getLimitStatusMessage = (limitInfo) => {
  if (!limitInfo) return '';

  if (limitInfo.unlimited) {
    return 'Unlimited';
  }

  if (limitInfo.allowed) {
    const remaining = limitInfo.limit - limitInfo.used;
    return `${remaining} of ${limitInfo.limit} remaining this ${limitInfo.resetPeriod || 'period'}`;
  }

  return limitInfo.message || 'Limit reached';
};

/**
 * Check multiple features at once
 */
export const checkMultipleFeatureLimits = async (userId, actions, subscription = null) => {
  try {
    const results = {};

    for (const action of actions) {
      results[action] = await checkFeatureLimit(userId, action, subscription, false);
    }

    return results;
  } catch (error) {
    console.error('Error checking multiple feature limits:', error);
    return {};
  }
};

/**
 * Get usage summary for display purposes
 */
export const getUsageDisplayData = (limitInfo) => {
  if (!limitInfo) {
    return {
      used: 0,
      limit: 0,
      percentage: 0,
      status: 'unknown',
      message: 'Unable to load usage data'
    };
  }

  if (limitInfo.unlimited) {
    return {
      used: limitInfo.used || 0,
      limit: -1,
      percentage: 0,
      status: 'unlimited',
      message: 'Unlimited'
    };
  }

  const percentage = limitInfo.limit > 0 ? (limitInfo.used / limitInfo.limit) * 100 : 0;
  let status = 'good';

  if (percentage >= 100) {
    status = 'exceeded';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return {
    used: limitInfo.used || 0,
    limit: limitInfo.limit || 0,
    percentage: Math.min(percentage, 100),
    status,
    message: getLimitStatusMessage(limitInfo),
    resetPeriod: limitInfo.resetPeriod
  };
};

/**
 * Feature-specific helper functions
 */

export const checkAIParlayLimit = (userId, subscription) =>
  checkFeatureLimit(userId, 'aiParlayEvaluation', subscription);

export const checkOddsComparisonLimit = (userId, subscription) =>
  checkFeatureLimit(userId, 'oddsComparison', subscription);

export const checkBetTrackingLimit = (userId, subscription) =>
  checkFeatureLimit(userId, 'betTracking', subscription);

export const checkLiveGamesLimit = (userId, subscription) =>
  checkFeatureLimit(userId, 'liveGames', subscription);

/**
 * Perform specific actions with limit checking
 */

export const performAIParlay = (userId, actionCallback, subscription, options = {}) =>
  performWithLimitCheck(userId, 'aiParlayEvaluation', actionCallback, subscription, {
    successMessage: 'AI parlay evaluation completed',
    ...options
  });

export const performOddsComparison = (userId, actionCallback, subscription, options = {}) =>
  performWithLimitCheck(userId, 'oddsComparison', actionCallback, subscription, {
    successMessage: 'Odds comparison completed',
    ...options
  });

export const performBetTracking = (userId, actionCallback, subscription, options = {}) =>
  performWithLimitCheck(userId, 'betTracking', actionCallback, subscription, {
    successMessage: 'Bet tracked successfully',
    ...options
  });

export const performLiveGameView = (userId, actionCallback, subscription, options = {}) =>
  performWithLimitCheck(userId, 'liveGames', actionCallback, subscription, {
    successMessage: 'Live game loaded',
    showSuccessToast: false, // Usually don't show toast for viewing games
    ...options
  });
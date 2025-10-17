import { db } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { checkAndResetAllUsage } from './resetService';
import { isMasterAdmin, getMasterAdminFeatureAccess, shouldSkipUsageTracking } from './masterAdminService';

/**
 * Usage Tracking Service for Starter Plan Limits
 *
 * Tracks usage for:
 * - AI Parlay Evaluations: 3 per week
 * - Odds Comparison: 1 per day
 * - Bet Tracking: 5 bets per week
 * - Live Games: 5 games viewed
 */

// Get the start of the current week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Get the start of the current day
const getDayStart = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Generate week ID (YYYY-WW format)
const getWeekId = (date = new Date()) => {
  const weekStart = getWeekStart(date);
  const year = weekStart.getFullYear();
  const week = Math.ceil(((weekStart - new Date(year, 0, 1)) / 86400000 + 1) / 7);
  return `${year}-W${week.toString().padStart(2, '0')}`;
};

// Generate day ID (YYYY-MM-DD format)
const getDayId = (date = new Date()) => {
  return date.toISOString().split('T')[0];
};

// Get the start of the current month
const getMonthStart = (date = new Date()) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Generate month ID (YYYY-MM format)
const getMonthId = (date = new Date()) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Get user's monthly usage data (for Pro Plan tracking)
 */
export const getMonthlyUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  try {
    const monthId = getMonthId();
    const monthlyUsageRef = doc(db, 'users', userId, 'usage', `month-${monthId}`);
    const monthlyUsageDoc = await getDoc(monthlyUsageRef);

    const monthlyData = monthlyUsageDoc.exists() ? monthlyUsageDoc.data() : {
      aiParlayEvaluations: 0,
      monthStartDate: getMonthStart().toISOString(),
      monthId: monthId
    };

    return monthlyData;
  } catch (error) {
    console.error('Error getting monthly usage:', error);
    throw error;
  }
};

/**
 * Get user's current usage data
 */
export const getUserUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  try {
    // First, check and reset usage if necessary
    await checkAndResetAllUsage(userId);

    const weekId = getWeekId();
    const dayId = getDayId();

    // Get weekly usage
    const weeklyUsageRef = doc(db, 'users', userId, 'usage', `week-${weekId}`);
    const weeklyUsageDoc = await getDoc(weeklyUsageRef);

    // Get daily usage
    const dailyUsageRef = doc(db, 'users', userId, 'usage', `day-${dayId}`);
    const dailyUsageDoc = await getDoc(dailyUsageRef);

    const weeklyData = weeklyUsageDoc.exists() ? weeklyUsageDoc.data() : {
      aiParlayEvaluations: 0,
      betsTrackedThisWeek: 0,
      liveGamesViewed: 0,
      weekStartDate: getWeekStart().toISOString(),
      weekId: weekId
    };

    const dailyData = dailyUsageDoc.exists() ? dailyUsageDoc.data() : {
      oddsComparisonUsedToday: false,
      dayDate: getDayStart().toISOString(),
      dayId: dayId
    };

    return {
      weekly: weeklyData,
      daily: dailyData,
      weekId,
      dayId
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    throw error;
  }
};

/**
 * Check if user can perform an action based on their subscription tier and current usage
 */
export const canPerformAction = async (userId, action, subscription = null, user = null) => {
  if (!userId) throw new Error('User ID is required');

  // MASTER ADMIN BYPASS - unlimited access to everything
  if (user && isMasterAdmin(user)) {
    return getMasterAdminFeatureAccess(action);
  }

  const userTier = subscription?.tier || 'free';

  // Elite users have unlimited access to everything
  if (userTier === 'elite') {
    return { allowed: true, message: 'Unlimited access', unlimited: true };
  }

  // Pro users have specific monthly limits for AI evaluations, unlimited for others
  if (userTier === 'pro') {
    if (action === 'aiParlayEvaluation') {
      // Pro users have 35 AI evaluations per month
      const monthlyUsage = await getMonthlyUsage(userId);
      const parlayUsed = monthlyUsage.aiParlayEvaluations || 0;
      const parlayLimit = 35;

      if (parlayUsed >= parlayLimit) {
        return {
          allowed: false,
          message: `You've used all ${parlayLimit} AI parlay evaluations this month. Upgrade to Elite for unlimited evaluations.`,
          used: parlayUsed,
          limit: parlayLimit,
          resetPeriod: 'month'
        };
      }

      return {
        allowed: true,
        message: `${parlayLimit - parlayUsed} AI evaluations remaining this month`,
        used: parlayUsed,
        limit: parlayLimit,
        resetPeriod: 'month'
      };
    } else {
      // All other features are unlimited for Pro users
      return { allowed: true, message: 'Unlimited access', unlimited: true };
    }
  }

  // Free tier users have weekly/daily limits
  if (userTier === 'free') {
    try {
      const usage = await getUserUsage(userId);

    switch (action) {
      case 'aiParlayEvaluation':
        const parlayUsed = usage.weekly.aiParlayEvaluations || 0;
        const parlayLimit = 3;

        if (parlayUsed >= parlayLimit) {
          return {
            allowed: false,
            message: `You've used all ${parlayLimit} AI parlay evaluations this week. Upgrade for unlimited evaluations.`,
            used: parlayUsed,
            limit: parlayLimit,
            resetPeriod: 'week'
          };
        }

        return {
          allowed: true,
          message: `${parlayLimit - parlayUsed} of ${parlayLimit} AI evaluations remaining this week`,
          used: parlayUsed,
          limit: parlayLimit,
          resetPeriod: 'week'
        };

      case 'oddsComparison':
        const oddsUsed = usage.daily.oddsComparisonUsedToday || false;

        if (oddsUsed) {
          return {
            allowed: false,
            message: 'You\'ve used your daily odds comparison. Try again tomorrow or upgrade for unlimited comparisons.',
            used: 1,
            limit: 1,
            resetPeriod: 'day'
          };
        }

        return {
          allowed: true,
          message: '1 odds comparison available today',
          used: 0,
          limit: 1,
          resetPeriod: 'day'
        };

      case 'betTracking':
        const betsUsed = usage.weekly.betsTrackedThisWeek || 0;
        const betsLimit = 5;

        if (betsUsed >= betsLimit) {
          return {
            allowed: false,
            message: `You've tracked ${betsLimit} bets this week (maximum for Starter plan). Upgrade to track unlimited bets.`,
            used: betsUsed,
            limit: betsLimit,
            resetPeriod: 'week'
          };
        }

        return {
          allowed: true,
          message: `${betsLimit - betsUsed} of ${betsLimit} bets can be tracked this week`,
          used: betsUsed,
          limit: betsLimit,
          resetPeriod: 'week'
        };

      case 'liveGames':
        const gamesUsed = usage.weekly.liveGamesViewed || 0;
        const gamesLimit = 5;

        if (gamesUsed >= gamesLimit) {
          return {
            allowed: false,
            message: `You've viewed ${gamesLimit} live games (maximum for Starter plan). Upgrade for unlimited viewing.`,
            used: gamesUsed,
            limit: gamesLimit,
            resetPeriod: 'week'
          };
        }

        return {
          allowed: true,
          message: `${gamesLimit - gamesUsed} of ${gamesLimit} live games remaining`,
          used: gamesUsed,
          limit: gamesLimit,
          resetPeriod: 'week'
        };

      default:
        return { allowed: true, message: 'Action not tracked' };
    }
    } catch (error) {
      console.error('Error checking action permission:', error);
      // In case of error, allow the action but log the issue
      return { allowed: true, message: 'Usage check failed, allowing action' };
    }
  }

  // Default fallback
  return { allowed: true, message: 'Unknown tier, allowing action' };
};

/**
 * Track usage after a successful action
 */
export const trackUsage = async (userId, action, subscription = null, user = null) => {
  if (!userId) throw new Error('User ID is required');

  // MASTER ADMIN BYPASS - skip all usage tracking
  if (user && shouldSkipUsageTracking(user)) {
    console.log('Master admin - skipping usage tracking for:', action);
    return;
  }

  const userTier = subscription?.tier || 'free';
  const weekId = getWeekId();
  const dayId = getDayId();
  const monthId = getMonthId();

  try {
    switch (action) {
      case 'aiParlayEvaluation':
        if (userTier === 'pro') {
          // Pro users track monthly usage
          const monthlyUsageRef = doc(db, 'users', userId, 'usage', `month-${monthId}`);
          const monthlyUsageDoc = await getDoc(monthlyUsageRef);

          if (monthlyUsageDoc.exists()) {
            await updateDoc(monthlyUsageRef, {
              aiParlayEvaluations: (monthlyUsageDoc.data().aiParlayEvaluations || 0) + 1,
              lastUpdated: serverTimestamp()
            });
          } else {
            await setDoc(monthlyUsageRef, {
              aiParlayEvaluations: 1,
              monthStartDate: getMonthStart().toISOString(),
              monthId: monthId,
              lastUpdated: serverTimestamp()
            });
          }
        } else if (userTier === 'free') {
          // Free users track weekly usage
          const weeklyUsageRef = doc(db, 'users', userId, 'usage', `week-${weekId}`);
          const weeklyUsageDoc = await getDoc(weeklyUsageRef);

          if (weeklyUsageDoc.exists()) {
            await updateDoc(weeklyUsageRef, {
              aiParlayEvaluations: (weeklyUsageDoc.data().aiParlayEvaluations || 0) + 1,
              lastUpdated: serverTimestamp()
            });
          } else {
            await setDoc(weeklyUsageRef, {
              aiParlayEvaluations: 1,
              betsTrackedThisWeek: 0,
              liveGamesViewed: 0,
              weekStartDate: getWeekStart().toISOString(),
              weekId: weekId,
              lastUpdated: serverTimestamp()
            });
          }
        }
        // Elite users don't need tracking (unlimited)
        break;

      case 'oddsComparison':
        if (userTier === 'free') {
          // Only track for free tier users (Pro and Elite have unlimited)
          const dailyUsageRef = doc(db, 'users', userId, 'usage', `day-${dayId}`);
          await setDoc(dailyUsageRef, {
            oddsComparisonUsedToday: true,
            dayDate: getDayStart().toISOString(),
            dayId: dayId,
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
        break;

      case 'betTracking':
        if (userTier === 'free') {
          // Only track for free tier users (Pro and Elite have unlimited)
          const betsWeeklyRef = doc(db, 'users', userId, 'usage', `week-${weekId}`);
          const betsWeeklyDoc = await getDoc(betsWeeklyRef);

          if (betsWeeklyDoc.exists()) {
            await updateDoc(betsWeeklyRef, {
              betsTrackedThisWeek: (betsWeeklyDoc.data().betsTrackedThisWeek || 0) + 1,
              lastUpdated: serverTimestamp()
            });
          } else {
            await setDoc(betsWeeklyRef, {
              aiParlayEvaluations: 0,
              betsTrackedThisWeek: 1,
              liveGamesViewed: 0,
              weekStartDate: getWeekStart().toISOString(),
              weekId: weekId,
              lastUpdated: serverTimestamp()
            });
          }
        }
        break;

      case 'liveGames':
        if (userTier === 'free') {
          // Only track for free tier users (Pro and Elite have unlimited)
          const gamesWeeklyRef = doc(db, 'users', userId, 'usage', `week-${weekId}`);
          const gamesWeeklyDoc = await getDoc(gamesWeeklyRef);

          if (gamesWeeklyDoc.exists()) {
            await updateDoc(gamesWeeklyRef, {
              liveGamesViewed: (gamesWeeklyDoc.data().liveGamesViewed || 0) + 1,
              lastUpdated: serverTimestamp()
            });
          } else {
            await setDoc(gamesWeeklyRef, {
              aiParlayEvaluations: 0,
              betsTrackedThisWeek: 0,
              liveGamesViewed: 1,
              weekStartDate: getWeekStart().toISOString(),
              weekId: weekId,
              lastUpdated: serverTimestamp()
            });
          }
        }
        break;

      default:
        console.warn(`Unknown action for usage tracking: ${action}`);
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    throw error;
  }
};

/**
 * Get user's current usage summary for display
 */
export const getUsageSummary = async (userId, subscription = null) => {
  if (!userId) return null;

  const userTier = subscription?.tier || 'free';

  // If not on starter plan, return unlimited
  if (userTier !== 'free') {
    return {
      tier: userTier,
      unlimited: true,
      features: {
        aiParlayEvaluations: { used: 0, limit: -1, unlimited: true },
        oddsComparison: { used: 0, limit: -1, unlimited: true },
        betTracking: { used: 0, limit: -1, unlimited: true },
        liveGames: { used: 0, limit: -1, unlimited: true }
      }
    };
  }

  try {
    const usage = await getUserUsage(userId);

    return {
      tier: 'free',
      unlimited: false,
      features: {
        aiParlayEvaluations: {
          used: usage.weekly.aiParlayEvaluations || 0,
          limit: 3,
          period: 'week',
          unlimited: false
        },
        oddsComparison: {
          used: usage.daily.oddsComparisonUsedToday ? 1 : 0,
          limit: 1,
          period: 'day',
          unlimited: false
        },
        betTracking: {
          used: usage.weekly.betsTrackedThisWeek || 0,
          limit: 5,
          period: 'week',
          unlimited: false
        },
        liveGames: {
          used: usage.weekly.liveGamesViewed || 0,
          limit: 5,
          period: 'week',
          unlimited: false
        }
      },
      weekId: usage.weekId,
      dayId: usage.dayId
    };
  } catch (error) {
    console.error('Error getting usage summary:', error);
    return null;
  }
};

/**
 * Reset weekly usage (to be called by a scheduled function or on week change detection)
 */
export const resetWeeklyUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const weekId = getWeekId();

  try {
    const weeklyUsageRef = doc(db, 'users', userId, 'usage', `week-${weekId}`);
    await setDoc(weeklyUsageRef, {
      aiParlayEvaluations: 0,
      betsTrackedThisWeek: 0,
      liveGamesViewed: 0,
      weekStartDate: getWeekStart().toISOString(),
      weekId: weekId,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resetting weekly usage:', error);
    throw error;
  }
};

/**
 * Reset daily usage (to be called on day change detection)
 */
export const resetDailyUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const dayId = getDayId();

  try {
    const dailyUsageRef = doc(db, 'users', userId, 'usage', `day-${dayId}`);
    await setDoc(dailyUsageRef, {
      oddsComparisonUsedToday: false,
      dayDate: getDayStart().toISOString(),
      dayId: dayId,
      lastUpdated: serverTimestamp()
    });
  } catch (error) {
    console.error('Error resetting daily usage:', error);
    throw error;
  }
};
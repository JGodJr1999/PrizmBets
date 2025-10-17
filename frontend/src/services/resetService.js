import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Reset Service for handling weekly and daily usage resets
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
 * Check if we need to reset weekly usage and do it if necessary
 */
export const checkAndResetWeeklyUsage = async (userId) => {
  if (!userId) return { reset: false, error: 'No user ID provided' };

  try {
    const currentWeekId = getWeekId();
    const weeklyUsageRef = doc(db, 'users', userId, 'usage', `week-${currentWeekId}`);
    const weeklyUsageDoc = await getDoc(weeklyUsageRef);

    // If document doesn't exist for current week, create it
    if (!weeklyUsageDoc.exists()) {
      await setDoc(weeklyUsageRef, {
        aiParlayEvaluations: 0,
        betsTrackedThisWeek: 0,
        liveGamesViewed: 0,
        weekStartDate: getWeekStart().toISOString(),
        weekId: currentWeekId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp()
      });

      return { reset: true, reason: 'New week started', weekId: currentWeekId };
    }

    const data = weeklyUsageDoc.data();
    const docWeekId = data.weekId;

    // If the document is from a previous week, reset it
    if (docWeekId !== currentWeekId) {
      await setDoc(weeklyUsageRef, {
        aiParlayEvaluations: 0,
        betsTrackedThisWeek: 0,
        liveGamesViewed: 0,
        weekStartDate: getWeekStart().toISOString(),
        weekId: currentWeekId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp(),
        previousWeekData: {
          weekId: docWeekId,
          aiParlayEvaluations: data.aiParlayEvaluations || 0,
          betsTrackedThisWeek: data.betsTrackedThisWeek || 0,
          liveGamesViewed: data.liveGamesViewed || 0
        }
      });

      return {
        reset: true,
        reason: 'Week changed',
        previousWeekId: docWeekId,
        currentWeekId: currentWeekId
      };
    }

    return { reset: false, reason: 'Same week', weekId: currentWeekId };

  } catch (error) {
    console.error('Error checking/resetting weekly usage:', error);
    return { reset: false, error: error.message };
  }
};

/**
 * Check if we need to reset daily usage and do it if necessary
 */
export const checkAndResetDailyUsage = async (userId) => {
  if (!userId) return { reset: false, error: 'No user ID provided' };

  try {
    const currentDayId = getDayId();
    const dailyUsageRef = doc(db, 'users', userId, 'usage', `day-${currentDayId}`);
    const dailyUsageDoc = await getDoc(dailyUsageRef);

    // If document doesn't exist for current day, create it
    if (!dailyUsageDoc.exists()) {
      await setDoc(dailyUsageRef, {
        oddsComparisonUsedToday: false,
        dayDate: getDayStart().toISOString(),
        dayId: currentDayId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp()
      });

      return { reset: true, reason: 'New day started', dayId: currentDayId };
    }

    const data = dailyUsageDoc.data();
    const docDayId = data.dayId;

    // If the document is from a previous day, reset it
    if (docDayId !== currentDayId) {
      await setDoc(dailyUsageRef, {
        oddsComparisonUsedToday: false,
        dayDate: getDayStart().toISOString(),
        dayId: currentDayId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp(),
        previousDayData: {
          dayId: docDayId,
          oddsComparisonUsedToday: data.oddsComparisonUsedToday || false
        }
      });

      return {
        reset: true,
        reason: 'Day changed',
        previousDayId: docDayId,
        currentDayId: currentDayId
      };
    }

    return { reset: false, reason: 'Same day', dayId: currentDayId };

  } catch (error) {
    console.error('Error checking/resetting daily usage:', error);
    return { reset: false, error: error.message };
  }
};

/**
 * Check if we need to reset monthly usage and do it if necessary (for Pro Plan users)
 */
export const checkAndResetMonthlyUsage = async (userId) => {
  if (!userId) return { reset: false, error: 'No user ID provided' };

  try {
    const currentMonthId = getMonthId();
    const monthlyUsageRef = doc(db, 'users', userId, 'usage', `month-${currentMonthId}`);
    const monthlyUsageDoc = await getDoc(monthlyUsageRef);

    // If document doesn't exist for current month, create it
    if (!monthlyUsageDoc.exists()) {
      await setDoc(monthlyUsageRef, {
        aiParlayEvaluations: 0,
        monthStartDate: getMonthStart().toISOString(),
        monthId: currentMonthId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp()
      });

      return { reset: true, reason: 'New month started', monthId: currentMonthId };
    }

    const data = monthlyUsageDoc.data();
    const docMonthId = data.monthId;

    // If the document is from a previous month, reset it
    if (docMonthId !== currentMonthId) {
      await setDoc(monthlyUsageRef, {
        aiParlayEvaluations: 0,
        monthStartDate: getMonthStart().toISOString(),
        monthId: currentMonthId,
        lastUpdated: serverTimestamp(),
        resetAt: serverTimestamp(),
        previousMonthData: {
          monthId: docMonthId,
          aiParlayEvaluations: data.aiParlayEvaluations || 0
        }
      });

      return {
        reset: true,
        reason: 'Month changed',
        previousMonthId: docMonthId,
        currentMonthId: currentMonthId
      };
    }

    return { reset: false, reason: 'Same month', monthId: currentMonthId };

  } catch (error) {
    console.error('Error checking/resetting monthly usage:', error);
    return { reset: false, error: error.message };
  }
};

/**
 * Check and reset usage based on subscription tier (weekly/daily for free, monthly for Pro)
 */
export const checkAndResetAllUsage = async (userId, subscription = null) => {
  if (!userId) return { weeklyReset: false, dailyReset: false, monthlyReset: false, error: 'No user ID provided' };

  try {
    const userTier = subscription?.tier || 'free';

    if (userTier === 'pro') {
      // Pro users need monthly and daily resets (monthly for AI evaluations, daily for odds if they had limits)
      const [monthlyResult, weeklyResult, dailyResult] = await Promise.all([
        checkAndResetMonthlyUsage(userId),
        checkAndResetWeeklyUsage(userId),
        checkAndResetDailyUsage(userId)
      ]);

      return {
        weeklyReset: weeklyResult.reset,
        dailyReset: dailyResult.reset,
        monthlyReset: monthlyResult.reset,
        weeklyInfo: weeklyResult,
        dailyInfo: dailyResult,
        monthlyInfo: monthlyResult
      };
    } else {
      // Free tier users use weekly and daily resets
      const [weeklyResult, dailyResult] = await Promise.all([
        checkAndResetWeeklyUsage(userId),
        checkAndResetDailyUsage(userId)
      ]);

      return {
        weeklyReset: weeklyResult.reset,
        dailyReset: dailyResult.reset,
        monthlyReset: false,
        weeklyInfo: weeklyResult,
        dailyInfo: dailyResult,
        monthlyInfo: null
      };
    }

  } catch (error) {
    console.error('Error checking/resetting all usage:', error);
    return {
      weeklyReset: false,
      dailyReset: false,
      monthlyReset: false,
      error: error.message
    };
  }
};

/**
 * Force reset weekly usage (for testing or manual reset)
 */
export const forceResetWeeklyUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const currentWeekId = getWeekId();
  const weeklyUsageRef = doc(db, 'users', userId, 'usage', `week-${currentWeekId}`);

  try {
    await setDoc(weeklyUsageRef, {
      aiParlayEvaluations: 0,
      betsTrackedThisWeek: 0,
      liveGamesViewed: 0,
      weekStartDate: getWeekStart().toISOString(),
      weekId: currentWeekId,
      lastUpdated: serverTimestamp(),
      resetAt: serverTimestamp(),
      manualReset: true
    });

    return { success: true, weekId: currentWeekId };
  } catch (error) {
    console.error('Error force resetting weekly usage:', error);
    throw error;
  }
};

/**
 * Force reset daily usage (for testing or manual reset)
 */
export const forceResetDailyUsage = async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const currentDayId = getDayId();
  const dailyUsageRef = doc(db, 'users', userId, 'usage', `day-${currentDayId}`);

  try {
    await setDoc(dailyUsageRef, {
      oddsComparisonUsedToday: false,
      dayDate: getDayStart().toISOString(),
      dayId: currentDayId,
      lastUpdated: serverTimestamp(),
      resetAt: serverTimestamp(),
      manualReset: true
    });

    return { success: true, dayId: currentDayId };
  } catch (error) {
    console.error('Error force resetting daily usage:', error);
    throw error;
  }
};

/**
 * Get next reset times for display purposes
 */
export const getNextResetTimes = () => {
  const now = new Date();

  // Next week reset (Monday at 00:00)
  const nextWeekStart = getWeekStart();
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  // Next day reset (tomorrow at 00:00)
  const nextDayStart = getDayStart();
  nextDayStart.setDate(nextDayStart.getDate() + 1);

  return {
    nextWeeklyReset: nextWeekStart,
    nextDailyReset: nextDayStart,
    timeUntilWeeklyReset: nextWeekStart - now,
    timeUntilDailyReset: nextDayStart - now
  };
};

/**
 * Format time until reset for display
 */
export const formatTimeUntilReset = (milliseconds) => {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};
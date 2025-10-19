import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

/**
 * Track sportsbook link clicks for analytics
 * @param {string} sportsbookName - Name of the sportsbook (DraftKings, FanDuel, etc.)
 * @param {string} userId - User ID who clicked the link
 * @param {string} context - Where the click occurred (ai-top-5, odds-comparison, etc.)
 */
export const trackSportsbookClick = async (sportsbookName, userId, context) => {
  try {
    await addDoc(collection(db, 'sportsbookClicks'), {
      sportsbook: sportsbookName,
      userId: userId,
      context: context,
      timestamp: serverTimestamp(),
      userEmail: auth.currentUser?.email || 'anonymous'
    });
    console.log(`Tracked ${sportsbookName} click from ${context}`);
  } catch (error) {
    console.error('Error tracking sportsbook click:', error);
  }
};

/**
 * Track feature usage for analytics
 * @param {string} featureName - Name of the feature used
 * @param {string} userId - User ID who used the feature
 * @param {object} additionalData - Additional data about the feature usage
 */
export const trackFeatureUsage = async (featureName, userId, additionalData = {}) => {
  try {
    await addDoc(collection(db, 'featureUsage'), {
      feature: featureName,
      userId: userId,
      timestamp: serverTimestamp(),
      userEmail: auth.currentUser?.email || 'anonymous',
      ...additionalData
    });
  } catch (error) {
    console.error('Error tracking feature usage:', error);
  }
};

/**
 * Track user activity for real-time feed
 * @param {string} activityType - Type of activity (signup, login, subscription, etc.)
 * @param {string} userId - User ID
 * @param {string} description - Human-readable description of the activity
 * @param {object} metadata - Additional metadata about the activity
 */
export const trackUserActivity = async (activityType, userId, description, metadata = {}) => {
  try {
    await addDoc(collection(db, 'userActivity'), {
      type: activityType,
      userId: userId,
      description: description,
      timestamp: serverTimestamp(),
      userEmail: auth.currentUser?.email || 'anonymous',
      metadata
    });
  } catch (error) {
    console.error('Error tracking user activity:', error);
  }
};

/**
 * Handle sportsbook link clicks with tracking
 * @param {string} sportsbookName - Name of the sportsbook
 * @param {string} url - URL to open
 * @param {string} userId - User ID
 * @param {string} context - Context where the click occurred
 */
export const handleSportsbookClick = (sportsbookName, url, userId, context) => {
  // Track the click
  trackSportsbookClick(sportsbookName, userId, context);

  // Open the link
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Enhanced sportsbook URLs with tracking parameters
 */
export const SPORTSBOOK_URLS = {
  DraftKings: 'https://sportsbook.draftkings.com/',
  FanDuel: 'https://sportsbook.fanduel.com/',
  BetMGM: 'https://sports.betmgm.com/',
  Caesars: 'https://www.caesars.com/sportsbook',
  PointsBet: 'https://pointsbet.com/',
  BetRivers: 'https://www.betrivers.com/',
  Unibet: 'https://www.unibet.com/us'
};

/**
 * Get sportsbook button component with tracking
 * @param {string} sportsbookName - Name of the sportsbook
 * @param {string} userId - User ID
 * @param {string} context - Context where button is used
 * @param {object} customProps - Custom props for the button
 */
export const createSportsbookButton = (sportsbookName, userId, context, customProps = {}) => {
  const url = SPORTSBOOK_URLS[sportsbookName];

  if (!url) {
    console.warn(`No URL found for sportsbook: ${sportsbookName}`);
    return null;
  }

  return {
    onClick: () => handleSportsbookClick(sportsbookName, url, userId, context),
    children: `View on ${sportsbookName}`,
    ...customProps
  };
};

/**
 * Batch track multiple events (useful for bulk operations)
 * @param {Array} events - Array of event objects to track
 */
export const batchTrackEvents = async (events) => {
  try {
    const promises = events.map(event => {
      switch (event.type) {
        case 'sportsbook_click':
          return trackSportsbookClick(event.sportsbook, event.userId, event.context);
        case 'feature_usage':
          return trackFeatureUsage(event.feature, event.userId, event.additionalData);
        case 'user_activity':
          return trackUserActivity(event.activityType, event.userId, event.description, event.metadata);
        default:
          console.warn(`Unknown event type: ${event.type}`);
          return Promise.resolve();
      }
    });

    await Promise.all(promises);
    console.log(`Batch tracked ${events.length} events`);
  } catch (error) {
    console.error('Error batch tracking events:', error);
  }
};
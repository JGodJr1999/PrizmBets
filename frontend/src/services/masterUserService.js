/**
 * Master User Service
 * Provides unlimited access to all features for testing and administration
 */

// Master user emails (in production, this would be environment variables)
const MASTER_USER_EMAILS = [
  'g.jason18@yahoo.com'
];

// Master user IDs (Firebase UIDs) - can be populated as needed
const MASTER_USER_IDS = [
  // Add specific Firebase UIDs here if needed
];

/**
 * Check if a user is a master user by email
 */
export const isMasterUserByEmail = (userEmail) => {
  if (!userEmail) return false;
  return MASTER_USER_EMAILS.includes(userEmail.toLowerCase().trim());
};

/**
 * Check if a user is a master user by ID
 */
export const isMasterUserById = (userId) => {
  if (!userId) return false;
  return MASTER_USER_IDS.includes(userId);
};

/**
 * Universal master user check (checks both email and ID)
 */
export const isMasterUser = (user) => {
  if (!user) {
    console.log('Master User Check: No user provided');
    return false;
  }

  const userEmail = user.email?.toLowerCase().trim();
  console.log('Master User Check:', {
    userEmail: userEmail,
    userUID: user.uid,
    checking: 'g.jason18@yahoo.com'
  });

  // Check by email first (primary method)
  if (user.email && isMasterUserByEmail(user.email)) {
    console.log('✅ Master User detected by email:', userEmail);
    return true;
  }

  // Check by ID as fallback
  if (user.uid && isMasterUserById(user.uid)) {
    console.log('✅ Master User detected by ID:', user.uid);
    return true;
  }

  console.log('❌ Not a Master User:', userEmail);
  return false;
};

/**
 * Get master user access level
 */
export const getMasterUserAccess = () => {
  return {
    tier: 'master',
    unlimited: true,
    features: {
      aiParlayEvaluations: { limit: -1, period: 'unlimited' },
      oddsComparison: { limit: -1, period: 'unlimited' },
      aiTop5: { enabled: true, type: 'per-sport', limit: 5 },
      betTracking: { type: 'in-app', limit: -1 },
      liveGames: { limit: -1 },
      analytics: { type: 'premium', lifetime: true }
    }
  };
};

/**
 * Get master user feature access response
 */
export const getMasterUserFeatureAccess = (featureName) => {
  const baseResponse = {
    allowed: true,
    unlimited: true,
    tier: 'master',
    message: `Master User - Unlimited ${featureName} Access`
  };

  switch (featureName) {
    case 'aiParlayEvaluation':
      return {
        ...baseResponse,
        remaining: 'unlimited',
        message: 'Master User - Unlimited AI Parlay Evaluations'
      };

    case 'oddsComparison':
      return {
        ...baseResponse,
        message: 'Master User - Unlimited Odds Comparisons'
      };

    case 'aiTop5':
      return {
        ...baseResponse,
        pickCount: 5,
        perSport: true,
        message: 'Master User - Full AI Top 5 Access (5 picks per sport)'
      };

    case 'betTracking':
      return {
        ...baseResponse,
        message: 'Master User - Unlimited Bet Tracking'
      };

    case 'liveGames':
      return {
        ...baseResponse,
        message: 'Master User - Unlimited Live Game Viewing'
      };

    case 'analytics':
      return {
        allowed: true,
        level: 'premium',
        includeLifetime: true,
        tier: 'master',
        message: 'Master User - Premium Analytics with Lifetime Stats'
      };

    default:
      return baseResponse;
  }
};

/**
 * Check if usage tracking should be skipped for a user
 */
export const shouldSkipUsageTracking = (user) => {
  return isMasterUser(user);
};

/**
 * Get display name for master user
 */
export const getMasterUserDisplayInfo = () => {
  return {
    badge: '👑 Master User',
    description: 'Full unlimited access to all features',
    features: [
      'Unlimited AI Parlay Evaluations',
      'Unlimited Odds Comparisons',
      'AI Top 5 Picks - 5 per sport',
      'Unlimited Bet Tracking',
      'Unlimited Live Games',
      'Premium Analytics with Lifetime Stats'
    ]
  };
};

export default {
  isMasterUser,
  isMasterUserByEmail,
  isMasterUserById,
  getMasterUserAccess,
  getMasterUserFeatureAccess,
  shouldSkipUsageTracking,
  getMasterUserDisplayInfo
};
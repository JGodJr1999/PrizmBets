/**
 * Master Admin Service
 * Provides unlimited access to all features for testing and administration
 */

// Master admin emails (in production, this would be environment variables)
const MASTER_ADMIN_EMAILS = [
  'g.jason18@yahoo.com'
];

// Master admin IDs (Firebase UIDs) - can be populated as needed
const MASTER_ADMIN_IDS = [
  // Add specific Firebase UIDs here if needed
];

/**
 * Check if a user is a master admin by email
 */
export const isMasterAdminByEmail = (userEmail) => {
  if (!userEmail) return false;
  return MASTER_ADMIN_EMAILS.includes(userEmail.toLowerCase().trim());
};

/**
 * Check if a user is a master admin by ID
 */
export const isMasterAdminById = (userId) => {
  if (!userId) return false;
  return MASTER_ADMIN_IDS.includes(userId);
};

/**
 * Universal master admin check (checks both email and ID)
 */
export const isMasterAdmin = (user) => {
  if (!user) {
    console.log('Master Admin Check: No user provided');
    return false;
  }

  const userEmail = user.email?.toLowerCase().trim();
  console.log('Master Admin Check:', {
    userEmail: userEmail,
    userUID: user.uid,
    checking: 'g.jason18@yahoo.com'
  });

  // Check by email first (primary method)
  if (user.email && isMasterAdminByEmail(user.email)) {
    console.log('✅ Master Admin detected by email:', userEmail);
    return true;
  }

  // Check by ID as fallback
  if (user.uid && isMasterAdminById(user.uid)) {
    console.log('✅ Master Admin detected by ID:', user.uid);
    return true;
  }

  console.log('❌ Not a Master Admin:', userEmail);
  return false;
};

/**
 * Get master admin access level
 */
export const getMasterAdminAccess = () => {
  return {
    tier: 'master-admin',
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
 * Get master admin feature access response
 */
export const getMasterAdminFeatureAccess = (featureName) => {
  const baseResponse = {
    allowed: true,
    unlimited: true,
    tier: 'master-admin',
    message: `Master Admin - Unlimited ${featureName} Access`
  };

  switch (featureName) {
    case 'aiParlayEvaluation':
      return {
        ...baseResponse,
        remaining: 'unlimited',
        message: 'Master Admin - Unlimited AI Parlay Evaluations'
      };

    case 'oddsComparison':
      return {
        ...baseResponse,
        message: 'Master Admin - Unlimited Odds Comparisons'
      };

    case 'aiTop5':
      return {
        ...baseResponse,
        pickCount: 5,
        perSport: true,
        message: 'Master Admin - Full AI Top 5 Access (5 picks per sport)'
      };

    case 'betTracking':
      return {
        ...baseResponse,
        message: 'Master Admin - Unlimited Bet Tracking'
      };

    case 'liveGames':
      return {
        ...baseResponse,
        message: 'Master Admin - Unlimited Live Game Viewing'
      };

    case 'analytics':
      return {
        allowed: true,
        level: 'premium',
        includeLifetime: true,
        tier: 'master-admin',
        message: 'Master Admin - Premium Analytics with Lifetime Stats'
      };

    default:
      return baseResponse;
  }
};

/**
 * Check if usage tracking should be skipped for a user
 */
export const shouldSkipUsageTracking = (user) => {
  return isMasterAdmin(user);
};

/**
 * Get display name for master admin
 */
export const getMasterAdminDisplayInfo = () => {
  return {
    badge: '👑 Master Admin',
    description: 'Full unlimited access to all features and admin privileges',
    features: [
      'Unlimited AI Parlay Evaluations',
      'Unlimited Odds Comparisons',
      'AI Top 5 Picks - 5 per sport',
      'Unlimited Bet Tracking',
      'Unlimited Live Games',
      'Premium Analytics with Lifetime Stats',
      'Admin Management Tools',
      'User Administration'
    ]
  };
};

export default {
  isMasterAdmin,
  isMasterAdminByEmail,
  isMasterAdminById,
  getMasterAdminAccess,
  getMasterAdminFeatureAccess,
  shouldSkipUsageTracking,
  getMasterAdminDisplayInfo
};
import React from 'react';
import AITop5Dashboard from '../components/Sports/AITop5Dashboard'; // Elite version (5 per sport)
import AITop5Pro from '../components/Sports/AITop5Pro'; // Pro version (5 total)
import AITop5Locked from '../components/Sports/AITop5Locked';
import { useAuth } from '../contexts/AuthContext';
import { useUsageTracking } from '../hooks/useUsageTracking';

const SportsProjectionsPage = () => {
  const { user } = useAuth();
  const { userTier, isFreeTier, isMasterAdmin } = useUsageTracking();

  // CRITICAL: Check Master Admin FIRST before anything else
  if (isMasterAdmin) {
    console.log('Master Admin detected - granting full AI Top 5 access (Elite version with 5 picks per sport)');
    return <AITop5Dashboard />;
  }

  // Show locked version for Starter Plan users (free tier)
  if (isFreeTier) {
    return <AITop5Locked />;
  }

  // Show Pro version for Pro users (5 total picks across all sports)
  if (userTier === 'pro') {
    return <AITop5Pro />;
  }

  // Show Elite version for Elite users (5 picks per sport)
  if (userTier === 'elite') {
    return <AITop5Dashboard />;
  }

  // Default fallback
  return <AITop5Locked />;
};

export default SportsProjectionsPage;
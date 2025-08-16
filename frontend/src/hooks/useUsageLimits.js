import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const useUsageLimits = () => {
  const { user, isAuthenticated } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUsage = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    try {
      const response = await apiService.getUserUsage();
      setUsage(response);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [isAuthenticated]);

  const checkParlayLimit = () => {
    if (!usage) return true; // Allow if usage not loaded
    
    const parlayUsed = usage.parlay_evaluations || 0;
    const parlayLimit = usage.parlay_limit || 3;
    
    if (parlayLimit === -1) return true; // Unlimited
    
    return parlayUsed < parlayLimit;
  };

  const checkOddsLimit = () => {
    if (!usage) return true; // Allow if usage not loaded
    
    const oddsUsed = usage.odds_comparisons || 0;
    const oddsLimit = usage.odds_limit || 10;
    
    if (oddsLimit === -1) return true; // Unlimited
    
    return oddsUsed < oddsLimit;
  };

  const getUsageInfo = () => {
    if (!usage) return null;

    const parlayUsed = usage.parlay_evaluations || 0;
    const parlayLimit = usage.parlay_limit || 3;
    const oddsUsed = usage.odds_comparisons || 0;
    const oddsLimit = usage.odds_limit || 10;

    return {
      parlay: {
        used: parlayUsed,
        limit: parlayLimit,
        remaining: parlayLimit === -1 ? 'unlimited' : Math.max(0, parlayLimit - parlayUsed),
        percentage: parlayLimit === -1 ? 0 : (parlayUsed / parlayLimit) * 100
      },
      odds: {
        used: oddsUsed,
        limit: oddsLimit,
        remaining: oddsLimit === -1 ? 'unlimited' : Math.max(0, oddsLimit - oddsUsed),
        percentage: oddsLimit === -1 ? 0 : (oddsUsed / oddsLimit) * 100
      }
    };
  };

  const requestParlayEvaluation = (onSuccess, onLimitReached) => {
    if (!isAuthenticated) {
      toast.error('Please log in to evaluate parlays');
      return false;
    }

    if (!checkParlayLimit()) {
      toast.error('Daily parlay evaluation limit reached');
      if (onLimitReached) {
        onLimitReached('parlay');
      }
      return false;
    }

    if (onSuccess) {
      onSuccess();
    }
    
    // Refresh usage after successful evaluation
    setTimeout(fetchUsage, 1000);
    return true;
  };

  const requestOddsComparison = (onSuccess, onLimitReached) => {
    if (!isAuthenticated) {
      toast.error('Please log in to compare odds');
      return false;
    }

    if (!checkOddsLimit()) {
      toast.error('Daily odds comparison limit reached');
      if (onLimitReached) {
        onLimitReached('odds');
      }
      return false;
    }

    if (onSuccess) {
      onSuccess();
    }
    
    // Refresh usage after successful comparison
    setTimeout(fetchUsage, 1000);
    return true;
  };

  return {
    usage,
    loading,
    checkParlayLimit,
    checkOddsLimit,
    getUsageInfo,
    requestParlayEvaluation,
    requestOddsComparison,
    refreshUsage: fetchUsage
  };
};
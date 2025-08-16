import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { TrendingUp, BarChart3, AlertCircle, Check } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UpgradeFlow from '../Upgrade/UpgradeFlow';

const UsageContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const UsageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const UsageTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TierBadge = styled.span`
  background: ${props => props.tier === 'free' ? '#ff8c42' : props.theme.colors.accent.primary};
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
`;

const UsageMetrics = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const MetricValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const MetricNumber = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
`;

const MetricLimit = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background.primary};
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage >= 100) return '#ff4444';
    if (props.percentage >= 80) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
  width: ${props => Math.min(props.percentage, 100)}%;
  transition: width 0.3s ease;
`;

const StatusIcon = styled.div`
  color: ${props => {
    if (props.isLimitReached) return '#ff4444';
    if (props.isNearLimit) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
`;

const UpgradePrompt = styled.div`
  background: linear-gradient(135deg, #ff8c42, #ff6b35);
  color: white;
  padding: ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.md};
  text-align: center;
`;

const UpgradeButton = styled.button`
  background: white;
  color: #ff6b35;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  margin-top: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
`;

const UsageTracker = ({ onUpgradeClick }) => {
  const { user, isAuthenticated } = useAuth();
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUpgradeFlow, setShowUpgradeFlow] = useState(false);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.getUserUsage();
        setUsage(response);
      } catch (err) {
        setError('Failed to load usage data');
        console.error('Usage fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <UsageContainer>
        <UsageTitle>Loading usage data...</UsageTitle>
      </UsageContainer>
    );
  }

  if (error) {
    return (
      <UsageContainer>
        <UsageTitle>
          <AlertCircle size={20} />
          Usage Tracking
        </UsageTitle>
        <p style={{ color: '#ff4444', margin: '8px 0' }}>{error}</p>
      </UsageContainer>
    );
  }

  if (!usage) {
    return null;
  }

  const tier = user?.tier || 'free';
  const parlayUsed = usage.parlay_evaluations || 0;
  const parlayLimit = usage.parlay_limit || 3;
  const oddsUsed = usage.odds_comparisons || 0;
  const oddsLimit = usage.odds_limit || 10;

  const parlayPercentage = parlayLimit === -1 ? 0 : (parlayUsed / parlayLimit) * 100;
  const oddsPercentage = oddsLimit === -1 ? 0 : (oddsUsed / oddsLimit) * 100;

  const isFreeTier = tier === 'free';
  const isParlayLimitReached = parlayLimit !== -1 && parlayUsed >= parlayLimit;
  const isOddsLimitReached = oddsLimit !== -1 && oddsUsed >= oddsLimit;
  const isParlayNearLimit = parlayLimit !== -1 && parlayUsed >= parlayLimit * 0.8;
  const isOddsNearLimit = oddsLimit !== -1 && oddsUsed >= oddsLimit * 0.8;

  const shouldShowUpgrade = isFreeTier && (isParlayLimitReached || isOddsLimitReached);

  return (
    <UsageContainer>
      <UsageHeader>
        <UsageTitle>
          <BarChart3 size={20} />
          Daily Usage
        </UsageTitle>
        <TierBadge tier={tier}>{tier}</TierBadge>
      </UsageHeader>

      <UsageMetrics>
        <MetricCard>
          <MetricHeader>
            <TrendingUp size={16} />
            <MetricLabel>Parlay Evaluations</MetricLabel>
            <StatusIcon 
              isLimitReached={isParlayLimitReached}
              isNearLimit={isParlayNearLimit}
            >
              {isParlayLimitReached ? (
                <AlertCircle size={16} />
              ) : (
                <Check size={16} />
              )}
            </StatusIcon>
          </MetricHeader>
          
          <MetricValue>
            <MetricNumber>{parlayUsed}</MetricNumber>
            <MetricLimit>
              {parlayLimit === -1 ? 'Unlimited' : `of ${parlayLimit}`}
            </MetricLimit>
          </MetricValue>
          
          {parlayLimit !== -1 && (
            <ProgressBar>
              <ProgressFill percentage={parlayPercentage} />
            </ProgressBar>
          )}
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <BarChart3 size={16} />
            <MetricLabel>Odds Comparisons</MetricLabel>
            <StatusIcon 
              isLimitReached={isOddsLimitReached}
              isNearLimit={isOddsNearLimit}
            >
              {isOddsLimitReached ? (
                <AlertCircle size={16} />
              ) : (
                <Check size={16} />
              )}
            </StatusIcon>
          </MetricHeader>
          
          <MetricValue>
            <MetricNumber>{oddsUsed}</MetricNumber>
            <MetricLimit>
              {oddsLimit === -1 ? 'Unlimited' : `of ${oddsLimit}`}
            </MetricLimit>
          </MetricValue>
          
          {oddsLimit !== -1 && (
            <ProgressBar>
              <ProgressFill percentage={oddsPercentage} />
            </ProgressBar>
          )}
        </MetricCard>
      </UsageMetrics>

      {shouldShowUpgrade && (
        <UpgradePrompt>
          <h4 style={{ margin: '0 0 8px 0' }}>Daily Limit Reached!</h4>
          <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
            Upgrade to Pro for unlimited parlay evaluations and odds comparisons.
          </p>
          <UpgradeButton onClick={() => setShowUpgradeFlow(true)}>
            Upgrade Now
          </UpgradeButton>
        </UpgradePrompt>
      )}

      <UpgradeFlow
        isOpen={showUpgradeFlow}
        onClose={() => setShowUpgradeFlow(false)}
        suggestedTier="pro"
        reason={isParlayLimitReached ? 'limit_reached' : 'odds_limit'}
      />
    </UsageContainer>
  );
};

export default UsageTracker;
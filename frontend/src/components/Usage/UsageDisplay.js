import React from 'react';
import styled from 'styled-components';
import { TrendingUp, BarChart3, CreditCard, Monitor, AlertCircle, Check, Crown } from 'lucide-react';
import { useUsageTracking } from '../../hooks/useUsageTracking';

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
  background: ${props => {
    switch (props.tier) {
      case 'pro':
        return props.theme.colors.accent.primary;
      case 'elite':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  }};
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const UsageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${props => props.theme.spacing.md};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  position: relative;

  ${props => props.limitReached && `
    border-color: #ff4444;
    background: linear-gradient(135deg, rgba(255, 68, 68, 0.1) 0%, rgba(255, 68, 68, 0.05) 100%);
  `}
`;

const FeatureHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FeatureLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  span {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    font-weight: 500;
  }
`;

const StatusIcon = styled.div`
  color: ${props => {
    if (props.unlimited) return props.theme.colors.accent.primary;
    if (props.limitReached) return '#ff4444';
    if (props.nearLimit) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
`;

const UsageValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const UsageNumber = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
`;

const UsageLimit = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
`;

const UsagePeriod = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  font-style: italic;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background.primary};
  border-radius: 4px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.xs};
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.unlimited) return props.theme.colors.accent.primary;
    if (props.percentage >= 100) return '#ff4444';
    if (props.percentage >= 80) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
  width: ${props => props.unlimited ? '100%' : `${Math.min(props.percentage, 100)}%`};
  transition: width 0.3s ease;
  position: relative;

  ${props => props.unlimited && `
    background: linear-gradient(90deg,
      ${props.theme.colors.accent.primary} 0%,
      ${props.theme.colors.accent.secondary} 50%,
      ${props.theme.colors.accent.primary} 100%
    );
    background-size: 200% 100%;
    animation: shimmer 2s infinite;

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `}
`;

const UnlimitedBadge = styled.div`
  position: absolute;
  top: -6px;
  right: 8px;
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.muted};
`;

const UsageDisplay = ({ compact = false }) => {
  const {
    usageSummary,
    loading,
    error,
    userTier,
    isFreeTier,
    getFeatureUsage,
    getUsagePercentage,
    isLimitReached
  } = useUsageTracking();

  if (loading) {
    return (
      <UsageContainer>
        <LoadingState>Loading usage data...</LoadingState>
      </UsageContainer>
    );
  }

  if (error) {
    return (
      <UsageContainer>
        <UsageHeader>
          <UsageTitle>
            <AlertCircle size={20} />
            Usage Tracking
          </UsageTitle>
        </UsageHeader>
        <p style={{ color: '#ff4444', margin: '8px 0' }}>{error}</p>
      </UsageContainer>
    );
  }

  if (!usageSummary) {
    return null;
  }

  const features = [
    {
      key: 'aiParlayEvaluations',
      label: 'AI Parlay Evaluations',
      icon: TrendingUp,
      period: userTier === 'pro' ? 'month' : 'week'
    },
    {
      key: 'oddsComparison',
      label: 'Odds Comparisons',
      icon: BarChart3,
      period: 'day'
    },
    {
      key: 'betTracking',
      label: 'Bet Tracking',
      icon: CreditCard,
      period: 'week'
    },
    {
      key: 'liveGames',
      label: 'Live Games',
      icon: Monitor,
      period: 'week'
    }
  ];

  const getTierIcon = () => {
    switch (userTier) {
      case 'pro':
      case 'elite':
        return <Crown size={12} />;
      default:
        return null;
    }
  };

  const getTierDisplay = () => {
    switch (userTier) {
      case 'pro':
        return 'Pro';
      case 'elite':
        return 'Elite';
      default:
        return 'Starter';
    }
  };

  return (
    <UsageContainer>
      <UsageHeader>
        <UsageTitle>
          <BarChart3 size={20} />
          {isFreeTier ? 'Usage Limits' : 'Usage Overview'}
        </UsageTitle>
        <TierBadge tier={userTier}>
          {getTierIcon()}
          {getTierDisplay()}
        </TierBadge>
      </UsageHeader>

      <UsageGrid>
        {features.map((feature) => {
          const usage = getFeatureUsage(feature.key);
          const percentage = getUsagePercentage(feature.key);
          const limitReached = isLimitReached(feature.key);
          const nearLimit = !usage.unlimited && percentage >= 80;
          const Icon = feature.icon;

          return (
            <FeatureCard key={feature.key} limitReached={limitReached}>
              {usage.unlimited && <UnlimitedBadge>Unlimited</UnlimitedBadge>}

              <FeatureHeader>
                <FeatureLabel>
                  <Icon size={16} />
                  <span>{feature.label}</span>
                </FeatureLabel>
                <StatusIcon
                  unlimited={usage.unlimited}
                  limitReached={limitReached}
                  nearLimit={nearLimit}
                >
                  {usage.unlimited ? (
                    <Crown size={16} />
                  ) : limitReached ? (
                    <AlertCircle size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                </StatusIcon>
              </FeatureHeader>

              <UsageValue>
                <UsageNumber>{usage.used}</UsageNumber>
                <UsageLimit>
                  {usage.unlimited ? '' : `of ${usage.limit}`}
                </UsageLimit>
              </UsageValue>

              {usage.period && (
                <UsagePeriod>per {usage.period}</UsagePeriod>
              )}

              <ProgressBar>
                <ProgressFill
                  percentage={percentage}
                  unlimited={usage.unlimited}
                />
              </ProgressBar>
            </FeatureCard>
          );
        })}
      </UsageGrid>

      {isFreeTier && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(0, 212, 170, 0.05) 100%)',
          borderRadius: '8px',
          border: `1px solid rgba(0, 212, 170, 0.2)`,
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: '0.9rem',
            color: '#6B7280'
          }}>
            Upgrade to Pro or Elite for unlimited access to all features
          </p>
        </div>
      )}
    </UsageContainer>
  );
};

export default UsageDisplay;
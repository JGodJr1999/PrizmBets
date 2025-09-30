import React from 'react';
import styled from 'styled-components';
import { AlertCircle } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';

const MeterContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const MeterLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 4px;
  overflow: hidden;
`;

const Progress = styled.div`
  height: 100%;
  width: ${props => props.percentage}%;
  background: ${props => {
    if (props.percentage >= 90) return props.theme.colors.betting.negative;
    if (props.percentage >= 70) return '#ff8c42';
    return props.theme.colors.accent.primary;
  }};
  transition: width 0.3s ease;
`;

const UpgradePrompt = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.accent.primary}20;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.85rem;
  color: ${props => props.theme.colors.accent.primary};
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.accent.primary}30;
  }
`;

const UsageMeter = ({ type, onUpgradeClick }) => {
  const { subscription, canPerformAction } = useSubscription();

  // Only show for free tier
  if (subscription.tier !== 'free') return null;

  const actionCheck = canPerformAction(type);
  const { used = 0, remaining = 0, limit = 0 } = actionCheck;
  const percentage = limit > 0 ? (used / limit) * 100 : 0;

  const labels = {
    evaluation: 'AI Evaluations Today',
    odds_comparison: 'Odds Comparisons Today',
    bet_tracking: 'Total Bets Tracked'
  };

  return (
    <MeterContainer>
      <MeterLabel>
        <span>{labels[type]}</span>
        <span>{used} / {limit}</span>
      </MeterLabel>

      <ProgressBar>
        <Progress percentage={percentage} />
      </ProgressBar>

      {percentage >= 80 && onUpgradeClick && (
        <UpgradePrompt onClick={onUpgradeClick}>
          <AlertCircle size={16} />
          {percentage >= 100
            ? 'Limit reached - Upgrade to Pro for unlimited'
            : `${remaining} remaining - Upgrade for unlimited access`
          }
        </UpgradePrompt>
      )}
    </MeterContainer>
  );
};

export default UsageMeter;
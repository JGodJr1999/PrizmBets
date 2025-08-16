import React from 'react';
import styled from 'styled-components';
import { TrendingUp, BarChart3, Check, Crown } from 'lucide-react';

const DemoContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, 
      ${props => props.theme.colors.accent.primary}20 0%, 
      transparent 25%,
      transparent 75%,
      ${props => props.theme.colors.accent.primary}20 100%);
    pointer-events: none;
  }
`;

const DemoOverlay = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.gradient.primary};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.8rem;
  font-weight: 600;
  z-index: 1;
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
  background: #ff8c42;
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
  margin-bottom: ${props => props.theme.spacing.lg};
  
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
  background: #ff8c42;
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const StatusIcon = styled.div`
  color: #ff8c42;
`;

const CallToAction = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}, #4f46e5);
  color: white;
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  text-align: center;
`;

const CTAButton = styled.button`
  background: white;
  color: ${props => props.theme.colors.accent.primary};
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.xl};
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

const UsageDemo = ({ onSignUpClick }) => {
  return (
    <DemoContainer>
      <DemoOverlay>DEMO</DemoOverlay>
      
      <UsageHeader>
        <UsageTitle>
          <BarChart3 size={20} />
          Daily Usage Tracking
        </UsageTitle>
        <TierBadge>free</TierBadge>
      </UsageHeader>

      <UsageMetrics>
        <MetricCard>
          <MetricHeader>
            <TrendingUp size={16} />
            <MetricLabel>Parlay Evaluations</MetricLabel>
            <StatusIcon>
              <Check size={16} />
            </StatusIcon>
          </MetricHeader>
          
          <MetricValue>
            <MetricNumber>1</MetricNumber>
            <MetricLimit>of 3</MetricLimit>
          </MetricValue>
          
          <ProgressBar>
            <ProgressFill percentage={33} />
          </ProgressBar>
        </MetricCard>

        <MetricCard>
          <MetricHeader>
            <BarChart3 size={16} />
            <MetricLabel>Odds Comparisons</MetricLabel>
            <StatusIcon>
              <Check size={16} />
            </StatusIcon>
          </MetricHeader>
          
          <MetricValue>
            <MetricNumber>3</MetricNumber>
            <MetricLimit>of 10</MetricLimit>
          </MetricValue>
          
          <ProgressBar>
            <ProgressFill percentage={30} />
          </ProgressBar>
        </MetricCard>
      </UsageMetrics>

      <CallToAction>
        <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Crown size={20} />
          Track Your Betting Progress
        </h4>
        <p style={{ margin: '0', fontSize: '0.9rem', opacity: 0.9 }}>
          Sign up to track your daily usage, monitor your betting patterns, and upgrade for unlimited access.
        </p>
        <CTAButton onClick={onSignUpClick}>
          Start Tracking Free
        </CTAButton>
      </CallToAction>
    </DemoContainer>
  );
};

export default UsageDemo;
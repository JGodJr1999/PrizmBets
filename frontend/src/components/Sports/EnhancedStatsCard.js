import React from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown, Target, Activity, Zap } from 'lucide-react';

const StatsContainer = styled.div`
  background: ${props => props.theme.colors.gradient.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${props => props.theme.colors.gradient.primary};
  }
`;

const StatsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatsTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.stats.excellent};
  font-size: 0.8rem;
  font-weight: 500;
`;

const PulsingDot = styled.div`
  width: 8px;
  height: 8px;
  background: ${props => props.theme.colors.stats.excellent};
  border-radius: 50%;
  animation: pulse 2s infinite;

  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TrendIndicator = styled.div`
  color: ${props => props.positive ? 
    props.theme.colors.stats.excellent : 
    props.theme.colors.stats.poor};
`;

const PerformanceBar = styled.div`
  background: ${props => props.theme.colors.background.hover};
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  margin-top: ${props => props.theme.spacing.md};
  position: relative;
`;

const PerformanceFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage >= 80) return props.theme.colors.stats.excellent;
    if (props.percentage >= 60) return props.theme.colors.stats.good;
    if (props.percentage >= 40) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
`;

const PerformanceLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const EnhancedStatsCard = ({ 
  title = "Today's Performance",
  stats = {
    winRate: { value: 84, trend: 'up', change: '+12%' },
    totalPicks: { value: 127, trend: 'up', change: '+23' },
    avgConfidence: { value: 87, trend: 'down', change: '-3%' },
    hitRate: { value: 76, trend: 'up', change: '+8%' }
  },
  isLive = true
}) => {

  return (
    <StatsContainer>
      <StatsHeader>
        <StatsTitle>{title}</StatsTitle>
        {isLive && (
          <LiveIndicator>
            <PulsingDot />
            LIVE
          </LiveIndicator>
        )}
      </StatsHeader>

      <StatsGrid>
        <StatItem>
          <StatValue>
            {stats.winRate.value}%
            <TrendIndicator positive={stats.winRate.trend === 'up'}>
              {stats.winRate.trend === 'up' ? 
                <TrendingUp size={16} /> : 
                <TrendingDown size={16} />
              }
            </TrendIndicator>
          </StatValue>
          <StatLabel>Win Rate</StatLabel>
        </StatItem>

        <StatItem>
          <StatValue>
            {stats.totalPicks.value}
            <TrendIndicator positive={stats.totalPicks.trend === 'up'}>
              <Activity size={16} />
            </TrendIndicator>
          </StatValue>
          <StatLabel>Total Picks</StatLabel>
        </StatItem>

        <StatItem>
          <StatValue>
            {stats.avgConfidence.value}%
            <TrendIndicator positive={stats.avgConfidence.trend === 'up'}>
              <Target size={16} />
            </TrendIndicator>
          </StatValue>
          <StatLabel>Avg Confidence</StatLabel>
        </StatItem>

        <StatItem>
          <StatValue>
            {stats.hitRate.value}%
            <TrendIndicator positive={stats.hitRate.trend === 'up'}>
              <Zap size={16} />
            </TrendIndicator>
          </StatValue>
          <StatLabel>Hit Rate</StatLabel>
        </StatItem>
      </StatsGrid>

      <PerformanceBar>
        <PerformanceFill percentage={stats.winRate.value} />
      </PerformanceBar>
      <PerformanceLabel>
        <span>Overall Performance</span>
        <span style={{
          color: stats.winRate.value >= 80 ? 
            '#FFD700' : 
            stats.winRate.value >= 60 ? 
              '#32CD32' : 
              '#FFA500'
        }}>
          {stats.winRate.trend === 'up' ? '↗' : '↘'} {stats.winRate.change}
        </span>
      </PerformanceLabel>
    </StatsContainer>
  );
};

export default EnhancedStatsCard;
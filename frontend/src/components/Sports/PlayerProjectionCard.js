import React from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown, Target, Star, Clock, BarChart3 } from 'lucide-react';

const CardContainer = styled.div`
  background: ${props => props.theme.colors.gradient.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
    border-color: ${props => props.theme.colors.accent.primary}40;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      const confidence = props.confidence || 0;
      if (confidence >= 80) return props.theme.colors.stats.excellent;
      if (confidence >= 60) return props.theme.colors.stats.good;
      if (confidence >= 40) return props.theme.colors.stats.average;
      return props.theme.colors.stats.poor;
    }};
  }
`;

const PlayerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const PlayerPhoto = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.theme.colors.gradient.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${props => props.theme.borderRadius.full};
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: ${props => props.theme.borderRadius.full};
    padding: 2px;
    background: ${props => props.theme.colors.gradient.accent};
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: subtract;
  }
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const PlayerName = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const PlayerTeam = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ConfidenceBadge = styled.div`
  background: ${props => {
    const confidence = props.confidence || 0;
    if (confidence >= 80) return props.theme.colors.stats.excellent + '20';
    if (confidence >= 60) return props.theme.colors.stats.good + '20';
    if (confidence >= 40) return props.theme.colors.stats.average + '20';
    return props.theme.colors.stats.poor + '20';
  }};
  color: ${props => {
    const confidence = props.confidence || 0;
    if (confidence >= 80) return props.theme.colors.stats.excellent;
    if (confidence >= 60) return props.theme.colors.stats.good;
    if (confidence >= 40) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ProjectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ProjectionStat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const BettingOptions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BettingChip = styled.div`
  background: ${props => props.recommended ? 
    props.theme.colors.gradient.accent : 
    props.theme.colors.background.hover};
  color: ${props => props.recommended ? 
    'white' : 
    props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const MetricsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.secondary};
`;

const Metric = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const PlayerProjectionCard = ({ 
  player = {},
  projections = {},
  bettingOptions = [],
  confidence = 75,
  trend = 'up',
  lastUpdated = 'Just now'
}) => {
  const { name = 'Player Name', team = 'Team', position = 'POS', photoUrl } = player;
  const { points = 0, rebounds = 0, assists = 0, odds = '+120' } = projections;
  
  const getPlayerInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  const trendColor = trend === 'up' ? 'stats.excellent' : 'stats.poor';

  return (
    <CardContainer confidence={confidence}>
      <PlayerHeader>
        <PlayerPhoto>
          {photoUrl ? (
            <img src={photoUrl} alt={name} />
          ) : (
            getPlayerInitials(name)
          )}
        </PlayerPhoto>
        <PlayerInfo>
          <PlayerName>{name}</PlayerName>
          <PlayerTeam>
            <span>{team}</span>
            <span>•</span>
            <span>{position}</span>
          </PlayerTeam>
        </PlayerInfo>
        <ConfidenceBadge confidence={confidence}>
          <Target size={12} />
          {confidence}%
        </ConfidenceBadge>
      </PlayerHeader>

      <ProjectionGrid>
        <ProjectionStat>
          <StatValue>{points}</StatValue>
          <StatLabel>Points</StatLabel>
        </ProjectionStat>
        <ProjectionStat>
          <StatValue>{rebounds}</StatValue>
          <StatLabel>Rebounds</StatLabel>
        </ProjectionStat>
        <ProjectionStat>
          <StatValue>{assists}</StatValue>
          <StatLabel>Assists</StatLabel>
        </ProjectionStat>
        <ProjectionStat>
          <StatValue>{odds}</StatValue>
          <StatLabel>Best Odds</StatLabel>
        </ProjectionStat>
      </ProjectionGrid>

      <BettingOptions>
        {bettingOptions.map((option, index) => (
          <BettingChip key={index} recommended={option.recommended}>
            <Star size={12} />
            {option.label}
          </BettingChip>
        ))}
      </BettingOptions>

      <MetricsRow>
        <Metric>
          <TrendIcon size={14} color={trendColor} />
          Form Trend
        </Metric>
        <Metric>
          <BarChart3 size={14} />
          Analytics
        </Metric>
        <Metric>
          <Clock size={14} />
          {lastUpdated}
        </Metric>
      </MetricsRow>
    </CardContainer>
  );
};

export default PlayerProjectionCard;
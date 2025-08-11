import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { Clock, Activity, Trophy, Timer } from 'lucide-react';

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
`;

const LiveScoreCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.isLive ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  position: relative;
  
  ${props => props.isLive && css`
    box-shadow: 0 0 10px ${props.theme.colors.accent.primary}40;
    animation: ${pulseAnimation} 2s ease-in-out infinite;
  `}
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.accent.success};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => props.status === 'final' && css`
    background: ${props.theme.colors.text.secondary};
  `}
  
  ${props => props.status === 'scheduled' && css`
    background: ${props.theme.colors.accent.primary};
  `}
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SportBadge = styled.div`
  background: ${props => props.theme.colors.accent.primary};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const TeamsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TeamSection = styled.div`
  flex: 1;
  text-align: ${props => props.align || 'center'};
`;

const TeamName = styled.div`
  color: ${props => props.isWinner ? '#22c55e' : props.theme.colors.text.primary};
  font-weight: ${props => props.isWinner ? '700' : '600'};
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.xs};
  text-shadow: ${props => props.isWinner ? '0 0 4px rgba(34, 197, 94, 0.3)' : 'none'};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.9rem;
  }
`;

const TeamScore = styled.div`
  color: ${props => props.isWinner ? '#22c55e' : props.theme.colors.accent.primary};
  font-size: 2rem;
  font-weight: ${props => props.isWinner ? 'bold' : 'bold'};
  line-height: 1;
  text-shadow: ${props => props.isWinner ? '0 0 8px rgba(34, 197, 94, 0.5)' : 'none'};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.5rem;
  }
`;

const ScoreDivider = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin: 0 ${props => props.theme.spacing.md};
  
  &::before {
    content: '';
    width: 1px;
    height: 40px;
    background: ${props => props.theme.colors.border.primary};
  }
`;

const GameStatus = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatusText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
`;

const TimeText = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const GameDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${props => props.theme.spacing.sm};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  font-size: 0.85rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const OddsSection = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.sm};
  }
`;

const OddsItem = styled.div`
  text-align: center;
`;

const OddsLabel = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: 2px;
`;

const OddsValue = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const LiveGameScoreCard = ({ game }) => {
  // Safety checks
  if (!game) {
    console.error('LiveGameScoreCard: game prop is undefined');
    return null;
  }

  const liveData = game.live_data || {};
  const isLive = liveData.status === 'live';
  const isFinal = liveData.status === 'final';
  const isScheduled = liveData.status === 'scheduled' || !liveData.status;
  
  // Determine winner for final games - safer parsing
  const homeScore = Number(liveData.home_score) || 0;
  const awayScore = Number(liveData.away_score) || 0;
  const homeIsWinner = isFinal && homeScore > awayScore;
  const awayIsWinner = isFinal && awayScore > homeScore;

  const formatGameTime = (game, liveData) => {
    try {
      const sport = game?.sport?.toLowerCase();
      
      if (isScheduled) {
        if (game.commence_time) {
          const gameTime = new Date(game.commence_time);
          return gameTime.toLocaleDateString() + ' ' + gameTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        }
        return 'Scheduled';
      }
      
      if (isFinal) {
        return 'Final';
      }

      if (isLive) {
        // Format live time based on sport
        if (sport === 'nfl' || sport === 'ncaaf') {
          return `${liveData.quarter || 'Q1'} ${liveData.time_remaining || '15:00'}`;
        } else if (sport === 'nba' || sport === 'wnba' || sport === 'ncaab') {
          return `${liveData.quarter || 'Q1'} ${liveData.time_remaining || '12:00'}`;
        } else if (sport === 'mlb') {
          const inning = liveData.inning || 1;
          const half = liveData.inning_half === 'bottom' ? '⬇️' : '⬆️';
          return `${half} ${inning}`;
        } else if (sport === 'nhl') {
          return `${liveData.period || 'P1'} ${liveData.time_remaining || '20:00'}`;
        } else if (sport === 'soccer') {
          const minute = liveData.minute || 0;
          const added = liveData.added_time || 0;
          return `${minute}'` + (added > 0 ? ` +${added}` : '');
        } else if (sport === 'mma') {
          return `Round ${liveData.round || 1} ${liveData.time_remaining || '5:00'}`;
        } else if (sport === 'tennis') {
          return `Set ${liveData.home_sets || 0}-${liveData.away_sets || 0}`;
        }
      }
      
      return 'Live';
    } catch (error) {
      console.error('Error formatting game time:', error);
      return 'Game Time';
    }
  };

  const getStatusIcon = () => {
    if (isLive) return <Activity size={14} />;
    if (isFinal) return <Trophy size={14} />;
    return <Clock size={14} />;
  };

  const getStatusText = () => {
    if (isLive) return 'LIVE';
    if (isFinal) return 'FINAL';
    return 'SCHEDULED';
  };

  const getBestOdds = (team) => {
    try {
      const sportsbooks = game?.sportsbooks || {};
      let bestOdds = null;
      let bestBook = null;

      Object.entries(sportsbooks).forEach(([book, odds]) => {
        if (!odds) return;
        const teamOdds = odds[team] || odds.moneyline?.[team];
        if (teamOdds && (!bestOdds || teamOdds > bestOdds)) {
          bestOdds = teamOdds;
          bestBook = book;
        }
      });

      return { odds: bestOdds, book: bestBook };
    } catch (error) {
      console.error('Error getting best odds:', error);
      return { odds: null, book: null };
    }
  };

  return (
    <LiveScoreCard isLive={isLive}>
      <GameHeader>
        <SportBadge>
          {game.sport?.toUpperCase() || 'GAME'}
        </SportBadge>
        <LiveIndicator status={liveData.status || 'scheduled'}>
          {getStatusIcon()}
          {getStatusText()}
        </LiveIndicator>
      </GameHeader>

      <TeamsContainer>
        <TeamSection align="left">
          <TeamName isWinner={awayIsWinner}>{game.away_team || 'Away Team'}</TeamName>
          {(isLive || isFinal) && (
            <TeamScore isWinner={awayIsWinner}>{awayScore}</TeamScore>
          )}
        </TeamSection>
        
        <ScoreDivider />
        
        <TeamSection align="right">
          <TeamName isWinner={homeIsWinner}>{game.home_team || 'Home Team'}</TeamName>
          {(isLive || isFinal) && (
            <TeamScore isWinner={homeIsWinner}>{homeScore}</TeamScore>
          )}
        </TeamSection>
      </TeamsContainer>

      <GameStatus>
        <StatusText>
          <Timer size={16} />
          {formatGameTime(game, liveData)}
        </StatusText>
        {liveData.last_updated && (
          <TimeText>
            Updated: {new Date(liveData.last_updated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </TimeText>
        )}
      </GameStatus>

      {!isLive && !isFinal && game?.sportsbooks && (
        <GameDetails>
          <OddsSection>
            <OddsItem>
              <OddsLabel>Away</OddsLabel>
              <OddsValue>
                {(() => {
                  const awayOdds = getBestOdds('away');
                  if (awayOdds?.odds) {
                    return (awayOdds.odds > 0 ? '+' : '') + awayOdds.odds;
                  }
                  return 'N/A';
                })()}
              </OddsValue>
            </OddsItem>
            <OddsItem>
              <OddsLabel>Home</OddsLabel>
              <OddsValue>
                {(() => {
                  const homeOdds = getBestOdds('home');
                  if (homeOdds?.odds) {
                    return (homeOdds.odds > 0 ? '+' : '') + homeOdds.odds;
                  }
                  return 'N/A';
                })()}
              </OddsValue>
            </OddsItem>
          </OddsSection>
          <div>
            Best odds: {(() => {
              const homeOdds = getBestOdds('home');
              const awayOdds = getBestOdds('away');
              return homeOdds?.book || awayOdds?.book || 'N/A';
            })()}
          </div>
        </GameDetails>
      )}
    </LiveScoreCard>
  );
};

export default LiveGameScoreCard;
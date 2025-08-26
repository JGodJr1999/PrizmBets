import React, { useState } from 'react';
import styled from 'styled-components';
import { Clock, Activity, ChevronDown, ChevronUp, Target, TrendingUp, BarChart3, Timer, Calendar } from 'lucide-react';

const CardContainer = styled.div`
  background: linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid ${props => props.isLive ? 'rgba(34, 197, 94, 0.4)' : 'rgba(0, 212, 170, 0.2)'};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 ${props => props.isLive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 212, 170, 0.1)'};
  
  &:hover {
    border-color: ${props => props.isLive ? 'rgba(34, 197, 94, 0.6)' : 'rgba(0, 212, 170, 0.5)'};
    box-shadow: 
      0 16px 48px ${props => props.isLive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(0, 212, 170, 0.2)'},
      inset 0 1px 0 ${props => props.isLive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0, 212, 170, 0.2)'};
    transform: translateY(-2px);
  }
  
  ${props => props.isLive && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `}
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const GameInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const SportBadge = styled.div`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: fit-content;
`;

const GameTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.isLive ? '#22c55e' : 'rgba(0, 212, 170, 0.2)'};
  color: ${props => props.isLive ? 'white' : props.theme.colors.text.secondary};
  padding: 6px 10px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  
  ${props => props.isLive && `
    animation: livePulse 2s infinite;
    
    @keyframes livePulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
      50% { box-shadow: 0 0 0 4px rgba(34, 197, 94, 0); }
    }
  `}
`;

const Matchup = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  gap: ${props => props.theme.spacing.md};
`;

const Team = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex: 1;
  text-align: center;
`;

const TeamName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1rem;
  }
`;

const TeamRecord = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.muted};
  font-weight: 500;
`;

const Score = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.isWinning ? props.theme.colors.accent.primary : props.theme.colors.text.primary};
  text-shadow: ${props => props.isWinning ? '0 0 8px rgba(0, 212, 170, 0.5)' : 'none'};
  transition: all 0.3s ease;
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 2rem;
  }
`;

const Separator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.muted};
  font-weight: 500;
  
  .vs {
    font-size: 0.9rem;
  }
  
  .time {
    font-size: 0.8rem;
    text-align: center;
  }
`;

const ExpandButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  width: 100%;
  background: none;
  border: 1px solid rgba(0, 212, 170, 0.3);
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: ${props => props.theme.spacing.md};
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.accent.primary};
    background: rgba(0, 212, 170, 0.05);
  }
`;

const StatsContainer = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  padding-top: ${props => props.theme.spacing.lg};
  border-top: 1px solid rgba(0, 212, 170, 0.2);
  animation: fadeIn 0.3s ease;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatCard = styled.div`
  background: rgba(0, 212, 170, 0.05);
  border: 1px solid rgba(0, 212, 170, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  text-align: center;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
`;

const StatComparison = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatName = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  flex: 1;
  text-align: center;
`;

const StatTeamValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.95rem;
  min-width: 60px;
  text-align: center;
  
  &.winning {
    color: ${props => props.theme.colors.accent.primary};
    font-weight: 700;
  }
`;

const LiveScoreCard = ({ game, isLive = false, showCountdown = false, showFinalScore = false }) => {
  const [expanded, setExpanded] = useState(false);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(timeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getGameStatus = () => {
    if (isLive) {
      return game.period ? `${game.period} - ${game.time_remaining || 'Live'}` : 'Live';
    }
    if (showCountdown && game.starts_in) {
      return `Starts in ${game.starts_in}`;
    }
    if (showFinalScore && game.finished_ago) {
      return `Final - ${game.finished_ago} ago`;
    }
    if (game.status === 'completed') {
      return 'Final';
    }
    return game.status || 'Scheduled';
  };

  const isTeamWinning = (team) => {
    if (!game.home_score || !game.away_score) return false;
    const homeScore = parseInt(game.home_score);
    const awayScore = parseInt(game.away_score);
    
    if (team === 'home') {
      return homeScore > awayScore;
    } else {
      return awayScore > homeScore;
    }
  };

  const renderStats = () => {
    if (!expanded || !game.stats) return null;

    return (
      <StatsContainer>
        <StatsGrid>
          {game.possession && (
            <StatCard>
              <StatLabel>
                <Target size={14} />
                Possession
              </StatLabel>
              <StatValue>{game.possession}%</StatValue>
            </StatCard>
          )}
          
          {game.total_yards && (
            <StatCard>
              <StatLabel>
                <TrendingUp size={14} />
                Total Yards
              </StatLabel>
              <StatValue>{game.total_yards}</StatValue>
            </StatCard>
          )}
          
          {game.turnovers && (
            <StatCard>
              <StatLabel>
                <BarChart3 size={14} />
                Turnovers
              </StatLabel>
              <StatValue>{game.turnovers}</StatValue>
            </StatCard>
          )}
          
          {game.time_of_possession && (
            <StatCard>
              <StatLabel>
                <Timer size={14} />
                Time of Possession
              </StatLabel>
              <StatValue>{game.time_of_possession}</StatValue>
            </StatCard>
          )}
        </StatsGrid>

        {game.detailed_stats && (
          <div>
            <h4 style={{ 
              color: '#00d4aa', 
              fontSize: '1.1rem', 
              fontWeight: '600', 
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              Team Comparison
            </h4>
            
            {game.detailed_stats.map((stat, index) => (
              <StatComparison key={index}>
                <StatTeamValue className={stat.away_winning ? 'winning' : ''}>
                  {stat.away_value}
                </StatTeamValue>
                <StatName>{stat.name}</StatName>
                <StatTeamValue className={stat.home_winning ? 'winning' : ''}>
                  {stat.home_value}
                </StatTeamValue>
              </StatComparison>
            ))}
          </div>
        )}
      </StatsContainer>
    );
  };

  return (
    <CardContainer 
      isLive={isLive} 
      onClick={() => setExpanded(!expanded)}
    >
      <GameHeader>
        <GameInfo>
          <SportBadge>{game.sport || 'Sports'}</SportBadge>
          <GameTime>
            <Clock size={12} />
            {isLive ? 'Live Now' : formatTime(game.commence_time)}
          </GameTime>
        </GameInfo>
        
        <StatusBadge isLive={isLive}>
          {isLive ? <Activity size={12} /> : showFinalScore ? <Calendar size={12} /> : <Clock size={12} />}
          {getGameStatus()}
        </StatusBadge>
      </GameHeader>

      <Matchup>
        <Team>
          <TeamName>{game.away_team}</TeamName>
          {game.away_record && <TeamRecord>({game.away_record})</TeamRecord>}
          {(game.away_score !== undefined && game.away_score !== null) && (
            <Score isWinning={isTeamWinning('away')}>
              {game.away_score}
            </Score>
          )}
        </Team>
        
        <Separator>
          <div className="vs">@</div>
          {isLive && game.time_remaining && (
            <div className="time">{game.time_remaining}</div>
          )}
        </Separator>
        
        <Team>
          <TeamName>{game.home_team}</TeamName>
          {game.home_record && <TeamRecord>({game.home_record})</TeamRecord>}
          {(game.home_score !== undefined && game.home_score !== null) && (
            <Score isWinning={isTeamWinning('home')}>
              {game.home_score}
            </Score>
          )}
        </Team>
      </Matchup>

      {(game.stats || game.detailed_stats) && (
        <ExpandButton>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Hide Stats' : 'View Game Stats'}
        </ExpandButton>
      )}

      {renderStats()}
    </CardContainer>
  );
};

export default LiveScoreCard;
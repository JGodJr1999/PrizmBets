import React from 'react';
import styled from 'styled-components';
import { Trophy, Medal, Award, TrendingUp, Target, Calendar } from 'lucide-react';

const LeaderboardContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
`;

const LeaderboardHeader = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const Title = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
`;

const WeekInfo = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
`;

const StandingsTable = styled.div`
  overflow-x: auto;
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px 100px;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.tertiary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 50px 1fr 80px 80px 80px;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: 0.8rem;
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 60px 1fr 100px 100px 100px;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
  align-items: center;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 50px 1fr 80px 80px 80px;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  }
`;

const RankCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  color: ${props => {
    if (props.rank === 1) return props.theme.colors.accent.primary;
    if (props.rank === 2) return '#C0C0C0';
    if (props.rank === 3) return '#CD7F32';
    return props.theme.colors.text.primary;
  }};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const RankIcon = styled.div`
  margin-right: ${props => props.theme.spacing.xs};
`;

const PlayerCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
`;

const PlayerName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.95rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 0.9rem;
  }
`;

const PlayerStats = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
`;

const ScoreCell = styled.div`
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: ${props => props.theme.colors.accent.primary};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const PercentageCell = styled.div`
  text-align: center;
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
`;

const StreakCell = styled.div`
  text-align: center;
  font-weight: 500;
  color: ${props => {
    if (props.streak > 0) return props.theme.colors.accent.primary;
    if (props.streak < 0) return props.theme.colors.accent.secondary;
    return props.theme.colors.text.secondary;
  }};
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy size={18} />;
    case 2:
      return <Medal size={18} />;
    case 3:
      return <Award size={18} />;
    default:
      return null;
  }
};

const calculateWinPercentage = (correct, total) => {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
};

const formatStreak = (streak) => {
  if (streak === 0) return '-';
  return streak > 0 ? `W${streak}` : `L${Math.abs(streak)}`;
};

const Leaderboard = ({ standings = [], currentWeek }) => {
  if (standings.length === 0) {
    return (
      <LeaderboardContainer>
        <LeaderboardHeader>
          <Title>
            <TrendingUp size={20} />
            Leaderboard
          </Title>
          {currentWeek && (
            <WeekInfo>
              <Calendar size={16} />
              Through Week {currentWeek.week_number}
            </WeekInfo>
          )}
        </LeaderboardHeader>
        <EmptyState>
          <Target size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No standings yet</h3>
          <p>Standings will appear once members start making picks.</p>
        </EmptyState>
      </LeaderboardContainer>
    );
  }

  return (
    <LeaderboardContainer>
      <LeaderboardHeader>
        <Title>
          <TrendingUp size={20} />
          Leaderboard
        </Title>
        {currentWeek && (
          <WeekInfo>
            <Calendar size={16} />
            Through Week {currentWeek.week_number}
          </WeekInfo>
        )}
      </LeaderboardHeader>

      <StandingsTable>
        <TableHeader>
          <div>Rank</div>
          <div>Player</div>
          <div>Correct</div>
          <div>Win %</div>
          <div>Streak</div>
        </TableHeader>

        {standings.map((standing, index) => {
          const rank = index + 1;
          const winPercentage = calculateWinPercentage(standing.correct_picks, standing.total_picks);
          
          return (
            <TableRow key={standing.user_id || index}>
              <RankCell rank={rank}>
                <RankIcon>
                  {getRankIcon(rank)}
                </RankIcon>
                {rank}
              </RankCell>
              
              <PlayerCell>
                <PlayerName>
                  {standing.display_name || standing.user_name || `Player ${standing.user_id}`}
                </PlayerName>
                <PlayerStats>
                  {standing.total_picks} picks made
                </PlayerStats>
              </PlayerCell>
              
              <ScoreCell>
                {standing.correct_picks || 0}
              </ScoreCell>
              
              <PercentageCell>
                {winPercentage}%
              </PercentageCell>
              
              <StreakCell streak={standing.current_streak || 0}>
                {formatStreak(standing.current_streak || 0)}
              </StreakCell>
            </TableRow>
          );
        })}
      </StandingsTable>
    </LeaderboardContainer>
  );
};

export default Leaderboard;
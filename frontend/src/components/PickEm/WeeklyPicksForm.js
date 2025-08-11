import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Clock, Calendar, Users, Target, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../UI/LoadingSpinner';

const FormContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
`;

const FormHeader = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
`;

const WeekInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const WeekTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin: 0;
`;

const WeekStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.isOpen ? props.theme.colors.accent.primary : props.theme.colors.text.muted};
  font-size: 0.9rem;
  font-weight: 500;
`;

const DeadlineInfo = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const GamesContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const GameCard = styled.div`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.primary};
    box-shadow: ${props => props.theme.shadows.sm};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const GameHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: stretch;
    gap: ${props => props.theme.spacing.xs};
  }
`;

const GameTime = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const GameStatus = styled.div`
  color: ${props => props.isLocked ? props.theme.colors.accent.secondary : props.theme.colors.text.muted};
  font-size: 0.8rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TeamsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const TeamOption = styled.button`
  background: ${props => props.selected ? 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}20, ${props.theme.colors.accent.primary}10)` :
    props.theme.colors.background.secondary};
  border: 2px solid ${props => props.selected ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.selected ? 
    props.theme.colors.accent.primary : 
    props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  flex: 1;
  max-width: 180px;
  opacity: ${props => props.disabled ? 0.6 : 1};
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.sm};
    border-color: ${props => props.theme.colors.accent.primary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    max-width: none;
    width: 100%;
  }
`;

const VSText = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    margin: 0;
  }
`;

const SpreadInfo = styled.div`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  margin-top: ${props => props.theme.spacing.xs};
  font-style: italic;
`;

const PickStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.sm};
  font-size: 0.8rem;
  color: ${props => props.haspick ? props.theme.colors.accent.primary : props.theme.colors.text.muted};
`;

const FormActions = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  justify-content: between;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PicksSummary = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    justify-content: center;
  }
`;

const SubmitButton = styled.button`
  background: ${props => props.disabled ? 
    props.theme.colors.background.card : 
    `linear-gradient(135deg, ${props.theme.colors.accent.primary}, ${props.theme.colors.accent.primary}dd)`};
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  color: ${props => props.disabled ? 
    props.theme.colors.text.muted : 
    props.theme.colors.background.primary};
  font-size: 1rem;
  font-weight: 600;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme.shadows.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const WeeklyPicksForm = ({ pool, week, existingPicks = [], onPicksSubmitted }) => {
  const [games, setGames] = useState([]);
  const [picks, setPicks] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWeeklyGames();
  }, [week]);

  useEffect(() => {
    // Initialize picks from existing picks
    const picksMap = {};
    existingPicks.forEach(pick => {
      picksMap[pick.game_id] = pick.selected_team;
    });
    setPicks(picksMap);
  }, [existingPicks]);

  const loadWeeklyGames = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5006/api/pickem/nfl/weeks/${week.week_number}/games`);
      
      if (!response.ok) {
        throw new Error('Failed to load games');
      }
      
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Error loading games:', error);
      toast.error('Failed to load weekly games');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSelect = (gameId, teamName) => {
    // Check if the entire week is locked (first game started)
    if (isWeekLocked()) {
      toast.error('🔒 All picks are locked! The first game of the week has started.');
      return;
    }

    // Check if this specific game is locked
    const game = games.find(g => g.id === gameId);
    if (game && isGameLocked(game)) {
      toast.error('Picks are locked for this game');
      return;
    }

    setPicks(prev => ({
      ...prev,
      [gameId]: teamName
    }));
  };

  const isGameLocked = (game) => {
    const gameTime = new Date(game.commence_time);
    const now = new Date();
    return gameTime <= now;
  };

  const isWeekLocked = () => {
    if (!games || games.length === 0) return false;
    
    // Find the first game of the week
    const sortedGames = [...games].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    const firstGame = sortedGames[0];
    
    if (!firstGame) return false;
    
    // Week is locked if the first game has started
    const firstGameTime = new Date(firstGame.commence_time);
    const now = new Date();
    return firstGameTime <= now;
  };

  const getFirstGameTime = () => {
    if (!games || games.length === 0) return null;
    const sortedGames = [...games].sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));
    return sortedGames[0];
  };

  const canSubmitPicks = () => {
    if (isWeekLocked()) return false;
    
    // For straight up picks, user must pick all games
    if (pool.settings.pick_type === 'straight_up') {
      return games.length > 0 && games.every(game => picks[game.id]);
    }
    
    // For other pick types, at least one pick is required
    return Object.keys(picks).length > 0;
  };

  const handleSubmitPicks = async () => {
    if (!canSubmitPicks()) {
      toast.error('Please make all required picks');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const picksData = Object.entries(picks).map(([gameId, selectedTeam]) => ({
        game_id: parseInt(gameId),
        selected_team: selectedTeam
      }));

      const response = await fetch(`http://localhost:5006/api/pools/${pool.id}/picks/${week.week_number}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          picks: picksData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit picks');
      }

      const result = await response.json();
      
      if (onPicksSubmitted) {
        onPicksSubmitted(result.picks);
      }

    } catch (error) {
      console.error('Error submitting picks:', error);
      toast.error('Failed to submit picks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatGameTime = (commenceTime) => {
    return new Date(commenceTime).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  const getPicksCount = () => {
    return Object.keys(picks).length;
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading weekly games..." />;
  }

  return (
    <FormContainer>
      <FormHeader>
        <WeekInfo>
          <WeekTitle>
            <Calendar size={20} />
            NFL Week {week.week_number} Picks
          </WeekTitle>
          <WeekStatus isOpen={!isWeekLocked()}>
            {isWeekLocked() ? <Lock size={16} /> : <Target size={16} />}
            {isWeekLocked() ? 'Picks Locked' : 'Picks Open'}
          </WeekStatus>
        </WeekInfo>
        <DeadlineInfo>
          <Clock size={14} />
          {isWeekLocked() ? 
            '🔒 All picks locked - First game has started!' : 
            `Picks lock when first game starts${getFirstGameTime() ? ' • ' + formatGameTime(getFirstGameTime().commence_time) : ''}`
          }
        </DeadlineInfo>
      </FormHeader>

      <GamesContainer>
        {games.length === 0 ? (
          <EmptyState>
            <AlertCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No games available</h3>
            <p>Games for Week {week.week_number} are not yet available.</p>
          </EmptyState>
        ) : (
          games.map(game => {
            const isGameSpecificallyLocked = isGameLocked(game);
            const isAllLocked = isWeekLocked();
            const isLocked = isAllLocked || isGameSpecificallyLocked;
            const userPick = picks[game.id];
            
            return (
              <GameCard key={game.id}>
                <GameHeader>
                  <GameTime>
                    <Clock size={14} />
                    {formatGameTime(game.commence_time)}
                  </GameTime>
                  <GameStatus isLocked={isLocked}>
                    {isLocked ? <Lock size={12} /> : <Target size={12} />}
                    {isAllLocked ? 'Week Locked' : isGameSpecificallyLocked ? 'Game Locked' : 'Open'}
                  </GameStatus>
                </GameHeader>

                <TeamsContainer>
                  <TeamOption
                    selected={userPick === game.home_team}
                    disabled={isLocked}
                    onClick={() => handleTeamSelect(game.id, game.home_team)}
                  >
                    {game.home_team}
                    {pool.settings.pick_type === 'against_spread' && game.home_spread && (
                      <SpreadInfo>({game.home_spread > 0 ? '+' : ''}{game.home_spread})</SpreadInfo>
                    )}
                  </TeamOption>
                  
                  <VSText>vs</VSText>
                  
                  <TeamOption
                    selected={userPick === game.away_team}
                    disabled={isLocked}
                    onClick={() => handleTeamSelect(game.id, game.away_team)}
                  >
                    {game.away_team}
                    {pool.settings.pick_type === 'against_spread' && game.away_spread && (
                      <SpreadInfo>({game.away_spread > 0 ? '+' : ''}{game.away_spread})</SpreadInfo>
                    )}
                  </TeamOption>
                </TeamsContainer>

                <PickStatus haspick={!!userPick}>
                  {userPick ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {userPick ? `You picked: ${userPick}` : 'No pick made'}
                </PickStatus>
              </GameCard>
            );
          })
        )}
      </GamesContainer>

      {games.length > 0 && (
        <FormActions>
          <PicksSummary>
            <Users size={16} />
            {getPicksCount()} of {games.length} picks made
          </PicksSummary>
          <SubmitButton
            disabled={!canSubmitPicks() || isSubmitting}
            onClick={handleSubmitPicks}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Picks'}
          </SubmitButton>
        </FormActions>
      )}
    </FormContainer>
  );
};

export default WeeklyPicksForm;
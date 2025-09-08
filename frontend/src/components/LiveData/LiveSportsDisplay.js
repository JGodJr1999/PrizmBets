import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { apiService } from '../../services/api';
import { Play, Pause, Trophy, Clock, RefreshCw, AlertCircle, Calendar } from 'lucide-react';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
`;

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StatusTabs = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const StatusTab = styled.button`
  background: ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.background.hover};
    color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.text.primary};
  }
`;

const RefreshButton = styled.button`
  background: transparent;
  color: ${props => props.theme.colors.accent.primary};
  border: 1px solid ${props => props.theme.colors.accent.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary}20;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    animation: ${props => props.loading ? 'spin 1s linear infinite' : 'none'};
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const GamesContainer = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.lg};
`;

const SportSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SportHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  
  h3 {
    color: ${props => props.theme.colors.accent.primary};
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    text-transform: uppercase;
  }
  
  span {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.875rem;
    background: ${props => props.theme.colors.background.secondary};
    padding: 4px 8px;
    border-radius: ${props => props.theme.borderRadius.sm};
  }
`;

const GamesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const GameCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.2s ease;
  position: relative;
  
  ${props => props.isLive && `
    border-color: ${props.theme.colors.accent.primary}50;
    box-shadow: 0 0 20px rgba(0, 212, 170, 0.15);
  `}
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}30;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const GameStatus = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  
  ${props => {
    switch (props.status) {
      case 'live':
        return `
          color: ${props.theme.colors.status.success};
          background: ${props.theme.colors.status.success}20;
        `;
      case 'final':
        return `
          color: ${props.theme.colors.text.secondary};
          background: ${props.theme.colors.background.hover};
        `;
      case 'scheduled':
        return `
          color: ${props.theme.colors.accent.primary};
          background: ${props.theme.colors.accent.primary}20;
        `;
      default:
        return `
          color: ${props.theme.colors.text.secondary};
          background: ${props.theme.colors.background.hover};
        `;
    }
  }}
`;

const LiveIndicator = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  background: ${props => props.theme.colors.status.success};
  border-radius: 50%;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const Matchup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Team = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.sm};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const TeamName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.125rem;
  font-weight: 700;
`;

const Score = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.5rem;
  font-weight: 900;
  font-family: 'Monaco', 'Courier New', monospace;
  min-width: 40px;
  text-align: center;
`;

const GameInfo = styled.div`
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.text.secondary};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const GameTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl} 0;
  color: ${props => props.theme.colors.text.secondary};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.status.error}30;
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.status.error};
  
  h3 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: ${props => props.theme.spacing.sm};
    margin-bottom: ${props => props.theme.spacing.md};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl} 0;
  color: ${props => props.theme.colors.text.secondary};
  
  svg {
    margin-bottom: ${props => props.theme.spacing.md};
    opacity: 0.5;
  }
`;

const AutoRefreshIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  
  span {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: ${props => props.theme.colors.accent.primary};
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;

const GAME_STATUS_TABS = [
  { key: 'all', label: 'All Games', icon: Trophy },
  { key: 'live', label: 'Live', icon: Play },
  { key: 'scheduled', label: 'Upcoming', icon: Calendar },
  { key: 'final', label: 'Final', icon: Pause }
];

const LiveSportsDisplay = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  // Remove unused lastUpdate state for now
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Load live games and scores
  const loadGames = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('LiveSportsDisplay: Fetching live sports data...');
      const response = await apiService.getLiveScores();
      
      if (!mountedRef.current) return;
      
      if (response.success !== false && response.games) {
        // Sanitize and validate data
        const validGames = response.games.filter(game => 
          game && 
          game.home_team && 
          game.away_team &&
          game.sport
        );
        
        setGames(validGames);
        console.log(`LiveSportsDisplay: Loaded ${validGames.length} games`);
      } else if (response.live_games || response.starting_soon || response.recently_finished) {
        // Handle alternative response format
        const allGames = [
          ...(response.live_games || []),
          ...(response.starting_soon || []),
          ...(response.recently_finished || [])
        ];
        
        const validGames = allGames.filter(game => 
          game && 
          game.home_team && 
          game.away_team &&
          game.sport
        );
        
        setGames(validGames);
        console.log(`LiveSportsDisplay: Loaded ${validGames.length} games from live scores format`);
      } else {
        throw new Error(response.error || response.message || 'No games data available');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('LiveSportsDisplay: Error loading games:', err);
      setError(err.message || 'Failed to load live sports data. Please try again.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Set up auto-refresh
  useEffect(() => {
    mountedRef.current = true;
    loadGames();
    
    // Auto-refresh every 30 seconds for live data
    intervalRef.current = setInterval(loadGames, 30000);
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadGames]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadGames();
  };

  // Filter games by status
  const filteredGames = games.filter(game => {
    if (selectedStatus === 'all') return true;
    
    const gameStatus = getGameStatus(game);
    return gameStatus === selectedStatus;
  });

  // Group games by sport
  const gamesBySport = filteredGames.reduce((acc, game) => {
    const sport = game.sport?.toUpperCase() || 'UNKNOWN';
    if (!acc[sport]) {
      acc[sport] = [];
    }
    acc[sport].push(game);
    return acc;
  }, {});

  // Get game status
  function getGameStatus(game) {
    if (game.status === 'final' || game.status === 'completed') return 'final';
    if (game.status === 'live' || game.status === 'in_progress') return 'live';
    return 'scheduled';
  }

  // Get status display text
  function getStatusDisplay(game) {
    if (game.status === 'final' || game.status === 'completed') return 'Final';
    if (game.status === 'live' || game.status === 'in_progress') {
      return game.period || game.quarter || game.inning || 'Live';
    }
    return formatGameTime(game.commence_time);
  }

  // Format game time
  const formatGameTime = (timeString) => {
    try {
      const date = new Date(timeString);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      let dayLabel = '';
      if (date.toDateString() === today.toDateString()) {
        dayLabel = 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        dayLabel = 'Tomorrow';
      } else {
        dayLabel = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      }
      
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `${dayLabel} ${time}`;
    } catch {
      return 'Time TBD';
    }
  };

  // Get score display
  const getScore = (game, team) => {
    if (game.scores && game.scores[team] !== undefined) {
      return game.scores[team];
    }
    if (game[`${team}_score`] !== undefined) {
      return game[`${team}_score`];
    }
    return '—';
  };

  if (loading && games.length === 0) {
    return (
      <Container>
        <LoadingState>
          <RefreshCw size={32} />
          <p>Loading live sports data...</p>
        </LoadingState>
      </Container>
    );
  }

  if (error && games.length === 0) {
    return (
      <Container>
        <ErrorState>
          <h3>
            <AlertCircle size={24} />
            Unable to Load Sports Data
          </h3>
          <p>{error}</p>
          <RefreshButton onClick={handleRefresh} style={{ margin: '20px auto 0' }}>
            <RefreshCw size={16} />
            Try Again
          </RefreshButton>
        </ErrorState>
      </Container>
    );
  }

  return (
    <Container>
      <ControlsBar>
        <StatusTabs>
          {GAME_STATUS_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <StatusTab
                key={tab.key}
                active={selectedStatus === tab.key}
                onClick={() => setSelectedStatus(tab.key)}
              >
                <Icon size={16} />
                {tab.label}
              </StatusTab>
            );
          })}
        </StatusTabs>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AutoRefreshIndicator>
            <span />
            Auto-refreshing every 30s
          </AutoRefreshIndicator>
          <RefreshButton onClick={handleRefresh} disabled={loading} loading={loading}>
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
        </div>
      </ControlsBar>

      {filteredGames.length === 0 ? (
        <EmptyState>
          <Trophy size={48} />
          <h3>No Games Available</h3>
          <p>No {selectedStatus === 'all' ? '' : selectedStatus} games found.</p>
          <p>Try selecting a different filter or check back later.</p>
        </EmptyState>
      ) : (
        <GamesContainer>
          {Object.entries(gamesBySport)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([sport, sportGames]) => (
              <SportSection key={sport}>
                <SportHeader>
                  <Trophy size={20} />
                  <h3>{sport}</h3>
                  <span>{sportGames.length} games</span>
                </SportHeader>
                
                <GamesGrid>
                  {sportGames.map((game) => {
                    const gameStatus = getGameStatus(game);
                    const isLive = gameStatus === 'live';
                    
                    return (
                      <GameCard key={game.id} isLive={isLive}>
                        <GameStatus status={gameStatus}>
                          {isLive && <LiveIndicator />}
                          {getStatusDisplay(game)}
                        </GameStatus>
                        
                        <Matchup>
                          <Team>
                            <TeamName>{game.away_team}</TeamName>
                            <Score>{getScore(game, 'away')}</Score>
                          </Team>
                          <Team>
                            <TeamName>{game.home_team}</TeamName>
                            <Score>{getScore(game, 'home')}</Score>
                          </Team>
                        </Matchup>
                        
                        <GameInfo>
                          <GameTime>
                            <Clock size={14} />
                            {game.time_remaining || formatGameTime(game.commence_time)}
                          </GameTime>
                          {game.venue && (
                            <div>{game.venue}</div>
                          )}
                        </GameInfo>
                      </GameCard>
                    );
                  })}
                </GamesGrid>
              </SportSection>
            ))}
        </GamesContainer>
      )}
    </Container>
  );
};

export default LiveSportsDisplay;
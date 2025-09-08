import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { apiService } from '../../services/api';
import { RefreshCw, DollarSign, AlertCircle } from 'lucide-react';

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

const SportSelector = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const SportButton = styled.button`
  background: ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
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

const OddsGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.md};
`;

const GameCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}50;
    box-shadow: 0 4px 12px rgba(0, 212, 170, 0.1);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const TeamInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const GameTime = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.875rem;
  font-weight: 500;
`;

const TeamName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.125rem;
  font-weight: 700;
  margin: ${props => props.theme.spacing.xs} 0;
`;

const OddsTable = styled.div`
  overflow-x: auto;
  margin-top: ${props => props.theme.spacing.md};
`;

const Table = styled.table`
  width: 100%;
  min-width: 600px;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${props => props.theme.colors.background.hover};
  
  th {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    text-align: left;
    color: ${props => props.theme.colors.text.secondary};
    font-weight: 600;
    font-size: 0.875rem;
    border-bottom: 2px solid ${props => props.theme.colors.border.primary};
    
    &:first-child {
      border-top-left-radius: ${props => props.theme.borderRadius.sm};
    }
    
    &:last-child {
      border-top-right-radius: ${props => props.theme.borderRadius.sm};
    }
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${props => props.theme.colors.border.primary};
    
    &:hover {
      background: ${props => props.theme.colors.background.hover}50;
    }
  }
  
  td {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text.primary};
    font-weight: 500;
  }
`;

const OddsCell = styled.td`
  font-family: 'Monaco', 'Courier New', monospace;
  color: ${props => props.isBest ? props.theme.colors.accent.primary : props.theme.colors.text.primary};
  font-weight: ${props => props.isBest ? 700 : 500};
  background: ${props => props.isBest ? `${props.theme.colors.accent.primary}10` : 'transparent'};
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

const SPORTS = [
  { key: 'nfl', label: 'NFL', active: true },
  { key: 'nba', label: 'NBA', active: true },
  { key: 'mlb', label: 'MLB', active: true },
  { key: 'nhl', label: 'NHL', active: true },
  { key: 'ncaaf', label: 'NCAAF', active: false },
  { key: 'ncaab', label: 'NCAAB', active: false },
];

const SPORTSBOOKS = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers'];

const LiveOddsDisplay = () => {
  const [selectedSport, setSelectedSport] = useState('nfl');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Remove unused lastUpdate state for now
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Format odds for display
  const formatOdds = (odds) => {
    if (!odds && odds !== 0) return '—';
    return odds > 0 ? `+${odds}` : `${odds}`;
  };

  // Find best odds for a specific bet
  const findBestOdds = (sportsbooks, betType, team) => {
    if (!sportsbooks) return null;
    
    let bestOdds = null;
    let bestBook = null;
    
    Object.entries(sportsbooks).forEach(([book, data]) => {
      if (data && data[betType] && data[betType][team]) {
        const odds = data[betType][team];
        if (!bestOdds || odds > bestOdds) {
          bestOdds = odds;
          bestBook = book;
        }
      }
    });
    
    return { odds: bestOdds, book: bestBook };
  };

  // Load odds for selected sport
  const loadOdds = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`LiveOddsDisplay: Fetching odds for ${selectedSport}`);
      const response = await apiService.getLiveOddsBySport(selectedSport);
      
      if (!mountedRef.current) return;
      
      if (response.success && response.games) {
        // Sanitize and validate data
        const validGames = response.games.filter(game => 
          game && 
          game.home_team && 
          game.away_team && 
          game.sportsbooks && 
          Object.keys(game.sportsbooks).length > 0
        );
        
        setGames(validGames);
        console.log(`LiveOddsDisplay: Loaded ${validGames.length} games with odds`);
      } else {
        throw new Error(response.error || 'No odds data available');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      console.error('LiveOddsDisplay: Error loading odds:', err);
      setError(err.message || 'Failed to load odds. Please try again.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [selectedSport]);

  // Set up auto-refresh
  useEffect(() => {
    mountedRef.current = true;
    loadOdds();
    
    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(loadOdds, 60000);
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [loadOdds]);

  // Handle manual refresh
  const handleRefresh = () => {
    loadOdds();
  };

  // Handle sport change
  const handleSportChange = (sport) => {
    setSelectedSport(sport);
    setGames([]); // Clear old data
  };

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
      return `${dayLabel} at ${time}`;
    } catch {
      return 'Time TBD';
    }
  };

  if (loading && games.length === 0) {
    return (
      <Container>
        <LoadingState>
          <RefreshCw size={32} />
          <p>Loading live odds...</p>
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
            Unable to Load Odds
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
        <SportSelector>
          {SPORTS.map(sport => (
            <SportButton
              key={sport.key}
              active={selectedSport === sport.key}
              onClick={() => handleSportChange(sport.key)}
              disabled={!sport.active}
            >
              {sport.label}
            </SportButton>
          ))}
        </SportSelector>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AutoRefreshIndicator>
            <span />
            Auto-refreshing every 60s
          </AutoRefreshIndicator>
          <RefreshButton onClick={handleRefresh} disabled={loading} loading={loading}>
            <RefreshCw size={16} />
            Refresh
          </RefreshButton>
        </div>
      </ControlsBar>

      {games.length === 0 ? (
        <EmptyState>
          <DollarSign size={48} />
          <h3>No Odds Available</h3>
          <p>No games with odds found for {selectedSport.toUpperCase()}.</p>
          <p>Try selecting a different sport or check back later.</p>
        </EmptyState>
      ) : (
        <OddsGrid>
          {games.map((game) => {
            const homeBestML = findBestOdds(game.sportsbooks, 'moneyline', 'home');
            const awayBestML = findBestOdds(game.sportsbooks, 'moneyline', 'away');
            
            return (
              <GameCard key={game.id}>
                <GameHeader>
                  <TeamInfo>
                    <GameTime>{formatGameTime(game.commence_time)}</GameTime>
                    <TeamName>{game.away_team} @ {game.home_team}</TeamName>
                  </TeamInfo>
                </GameHeader>
                
                <OddsTable>
                  <Table>
                    <TableHeader>
                      <tr>
                        <th>Sportsbook</th>
                        <th>{game.away_team} ML</th>
                        <th>{game.home_team} ML</th>
                        <th>Spread</th>
                        <th>Total</th>
                      </tr>
                    </TableHeader>
                    <TableBody>
                      {SPORTSBOOKS.map(book => {
                        const bookData = game.sportsbooks[book];
                        if (!bookData) return null;
                        
                        return (
                          <tr key={book}>
                            <td style={{ textTransform: 'capitalize' }}>
                              {book.replace('draftkings', 'DraftKings').replace('fanduel', 'FanDuel')}
                            </td>
                            <OddsCell isBest={awayBestML?.book === book}>
                              {formatOdds(bookData.moneyline?.away)}
                            </OddsCell>
                            <OddsCell isBest={homeBestML?.book === book}>
                              {formatOdds(bookData.moneyline?.home)}
                            </OddsCell>
                            <td>{bookData.spread ? 'Available' : '—'}</td>
                            <td>{bookData.total ? 'Available' : '—'}</td>
                          </tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </OddsTable>
              </GameCard>
            );
          })}
        </OddsGrid>
      )}
    </Container>
  );
};

export default LiveOddsDisplay;
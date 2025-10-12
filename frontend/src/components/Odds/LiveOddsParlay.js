import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Target, AlertCircle, TrendingUp, Calendar, Search } from 'lucide-react';
import { apiService } from '../../services/api';
import toast from 'react-hot-toast';
import FilterBar from '../Parlay/FilterBar';
import GameCard from '../Parlay/GameCard';
import ParlaySlip from '../Parlay/ParlaySlip';
import LoadingSpinner from '../UI/LoadingSpinner';

const LiveOddsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: ${props => props.theme.spacing.xl};
  max-width: 1600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
  min-height: 100vh;

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
`;

const HeaderSection = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const StatsBar = styled.div`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
  margin: ${props => props.theme.spacing.lg} 0;
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.primary};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const StatItem = styled.div`
  text-align: center;

  .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${props => props.theme.colors.accent.primary};
    display: block;
  }

  .label {
    font-size: 0.85rem;
    color: ${props => props.theme.colors.text.secondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const GamesGrid = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.lg};
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.secondary};

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid ${props => props.theme.colors.border.primary};
    border-top: 3px solid ${props => props.theme.colors.accent.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: ${props => props.theme.spacing.md};
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};

  h3 {
    color: ${props => props.theme.colors.text.primary};
    margin-bottom: ${props => props.theme.spacing.md};
  }

  p {
    margin-bottom: ${props => props.theme.spacing.lg};
    max-width: 400px;
  }
`;

const ErrorState = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.accent.secondary};
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
`;

const LiveOddsParlay = ({ onEvaluate, isLoading: evaluationLoading }) => {
  const [selectedBets, setSelectedBets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDate, setSelectedDate] = useState('today');
  const [quickFilters, setQuickFilters] = useState({
    featured: false,
    live: false,
    popular: false,
    best_odds: false
  });
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const availableSports = [
    { value: 'all', label: 'All Sports', active: true },
    { value: 'nfl', label: 'NFL', active: true },
    { value: 'nba', label: 'NBA', active: true },
    { value: 'mlb', label: 'MLB', active: true },
    { value: 'nhl', label: 'NHL', active: true },
    { value: 'wnba', label: 'WNBA', active: true }
  ];

  // Load live odds data
  useEffect(() => {
    const loadOddsData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log('LiveOddsParlay: Loading odds for sport:', selectedSport);

        let data;
        if (selectedSport === 'all') {
          data = await apiService.getLiveOddsAll(5, true); // Get 5 games per sport, include inactive
        } else {
          data = await apiService.getLiveOddsBySport(selectedSport);
        }

        if (data && data.success) {
          const gamesData = data.games || [];
          // Transform API data to match GameCard format
          const transformedGames = gamesData.map((game, index) => ({
            id: game.id || `game-${index}`,
            homeTeam: {
              name: game.home_team || 'Home',
              logo: getSportEmoji(game.sport),
              record: '', // API doesn't provide records
              rank: null
            },
            awayTeam: {
              name: game.away_team || 'Away',
              logo: getSportEmoji(game.sport),
              record: '',
              rank: null
            },
            sport: mapSportKey(game.sport),
            league: (game.sport || 'unknown').toUpperCase(),
            gameTime: game.commence_time || new Date().toISOString(),
            isLive: isGameLive(game.commence_time),
            quarter: null,
            timeRemaining: null,
            homeScore: null,
            awayScore: null,
            bets: transformOddsData(game.sportsbooks || game.bookmakers),
            playerProps: [], // TODO: Add player props when available from API
            featured: Math.random() > 0.7, // Random featured status
            live: isGameLive(game.commence_time),
            popular: Math.random() > 0.6 // Random popular status
          }));

          setGames(transformedGames);
          setRetryCount(0);
        } else {
          throw new Error(data?.error || 'Failed to load odds data');
        }
      } catch (err) {
        console.error('LiveOddsParlay: Error loading odds:', err);
        setError(err.message || 'Failed to load live odds');

        // Auto-retry logic
        if (retryCount < 2) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadOddsData();
  }, [selectedSport, retryCount]);

  // Helper functions
  const getSportEmoji = (sport) => {
    const sportEmojis = {
      'nfl': '🏈',
      'nba': '🏀',
      'mlb': '⚾',
      'nhl': '🏒',
      'wnba': '🏀'
    };
    return sportEmojis[sport] || '🏆';
  };

  const mapSportKey = (apiSport) => {
    const sportMap = {
      'nfl': 'football',
      'nba': 'basketball',
      'mlb': 'baseball',
      'nhl': 'hockey',
      'wnba': 'basketball'
    };
    return sportMap[apiSport] || apiSport;
  };

  const isGameLive = (commenceTime) => {
    if (!commenceTime) return false;
    const gameTime = new Date(commenceTime);
    const now = new Date();
    const diffHours = (now - gameTime) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 4; // Game is live if started within last 4 hours
  };

  const transformOddsData = (sportsbooks) => {
    if (!sportsbooks || typeof sportsbooks !== 'object') {
      return {
        moneyline: { home: { odds: null }, away: { odds: null } },
        spread: { home: { odds: null, line: null }, away: { odds: null, line: null } },
        total: { over: { odds: null, line: null }, under: { odds: null, line: null } }
      };
    }

    // Handle both API formats
    if (Array.isArray(sportsbooks)) {
      // Handle bookmakers array format
      const firstBook = sportsbooks[0];
      if (firstBook && firstBook.markets) {
        const moneylineMarket = firstBook.markets.find(m => m.key === 'h2h');
        const spreadMarket = firstBook.markets.find(m => m.key === 'spreads');
        const totalMarket = firstBook.markets.find(m => m.key === 'totals');

        return {
          moneyline: {
            home: { odds: getOutcomeOdds(moneylineMarket, 'home'), sportsbook: firstBook.title },
            away: { odds: getOutcomeOdds(moneylineMarket, 'away'), sportsbook: firstBook.title }
          },
          spread: {
            home: {
              odds: getOutcomeOdds(spreadMarket, 'home'),
              line: getOutcomePoint(spreadMarket, 'home'),
              sportsbook: firstBook.title
            },
            away: {
              odds: getOutcomeOdds(spreadMarket, 'away'),
              line: getOutcomePoint(spreadMarket, 'away'),
              sportsbook: firstBook.title
            }
          },
          total: {
            over: {
              odds: getOutcomeOdds(totalMarket, 'over'),
              line: getOutcomePoint(totalMarket, 'over'),
              sportsbook: firstBook.title
            },
            under: {
              odds: getOutcomeOdds(totalMarket, 'under'),
              line: getOutcomePoint(totalMarket, 'under'),
              sportsbook: firstBook.title
            }
          }
        };
      }
    } else {
      // Handle sportsbooks object format
      const firstBookKey = Object.keys(sportsbooks)[0];
      const firstBook = sportsbooks[firstBookKey];

      if (firstBook && firstBook.moneyline) {
        return {
          moneyline: {
            home: { odds: firstBook.moneyline.home, sportsbook: firstBookKey },
            away: { odds: firstBook.moneyline.away, sportsbook: firstBookKey }
          },
          spread: {
            home: { odds: -110, line: -3.5, sportsbook: firstBookKey },
            away: { odds: -110, line: 3.5, sportsbook: firstBookKey }
          },
          total: {
            over: { odds: -110, line: 45.5, sportsbook: firstBookKey },
            under: { odds: -110, line: 45.5, sportsbook: firstBookKey }
          }
        };
      }
    }

    // Fallback with default odds
    return {
      moneyline: {
        home: { odds: -150, sportsbook: 'DraftKings' },
        away: { odds: 130, sportsbook: 'DraftKings' }
      },
      spread: {
        home: { odds: -110, line: -3.5, sportsbook: 'FanDuel' },
        away: { odds: -110, line: 3.5, sportsbook: 'FanDuel' }
      },
      total: {
        over: { odds: -105, line: 45.5, sportsbook: 'BetMGM' },
        under: { odds: -115, line: 45.5, sportsbook: 'BetMGM' }
      }
    };
  };

  const getOutcomeOdds = (market, type) => {
    if (!market || !market.outcomes) return null;
    const outcome = market.outcomes.find(o =>
      o.name?.toLowerCase().includes(type.toLowerCase()) ||
      (type === 'over' && o.name?.toLowerCase().includes('over')) ||
      (type === 'under' && o.name?.toLowerCase().includes('under'))
    );
    return outcome ? Math.round(outcome.price * 100 - 100) : null;
  };

  const getOutcomePoint = (market, type) => {
    if (!market || !market.outcomes) return null;
    const outcome = market.outcomes.find(o =>
      o.name?.toLowerCase().includes(type.toLowerCase()) ||
      (type === 'over' && o.name?.toLowerCase().includes('over')) ||
      (type === 'under' && o.name?.toLowerCase().includes('under'))
    );
    return outcome?.point || null;
  };

  // Filter games based on current filters
  const filteredGames = games.filter(game => {
    // Sport filter
    if (selectedSport !== 'all' && game.sport !== mapSportKey(selectedSport)) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        game.homeTeam.name,
        game.awayTeam.name,
        game.league
      ].join(' ').toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    // Date filter
    const gameDate = new Date(game.gameTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (selectedDate === 'today') {
      if (gameDate.toDateString() !== today.toDateString()) {
        return false;
      }
    } else if (selectedDate === 'tomorrow') {
      if (gameDate.toDateString() !== tomorrow.toDateString()) {
        return false;
      }
    }

    // Quick filters
    if (quickFilters.featured && !game.featured) return false;
    if (quickFilters.live && !game.isLive) return false;
    if (quickFilters.popular && !game.popular) return false;

    return true;
  });

  const handleBetSelection = (bet) => {
    const existingBetIndex = selectedBets.findIndex(
      existing => existing.id === bet.id
    );

    if (existingBetIndex >= 0) {
      // Remove bet if already selected
      setSelectedBets(prev => prev.filter((_, index) => index !== existingBetIndex));
      toast.success('Removed from parlay');
    } else {
      // Add new bet
      setSelectedBets(prev => [...prev, bet]);
      toast.success('Added to parlay');
    }
  };

  const handleQuickFilterChange = (filterKey, value) => {
    setQuickFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Handle parlay evaluation
  const handleEvaluateParlay = () => {
    if (selectedBets.length === 0) {
      toast.error('Please select at least one bet');
      return;
    }

    // Convert new format to old format for backend compatibility
    const parlayData = {
      bets: selectedBets.map(bet => ({
        team: bet.team,
        odds: bet.odds,
        bet_type: bet.betType,
        amount: bet.amount || 25,
        sportsbook: bet.sportsbook
      })),
      total_amount: selectedBets.reduce((sum, bet) => sum + (bet.amount || 25), 0),
      user_notes: ''
    };

    onEvaluate(parlayData);
  };

  const gameCount = filteredGames.length;
  const totalMarkets = filteredGames.reduce((sum, game) => {
    return sum + 3; // moneyline, spread, total
  }, 0);
  const liveGameCount = filteredGames.filter(game => game.isLive).length;

  return (
    <LiveOddsContainer>
      <MainContent>
        <HeaderSection>
          <Title>Live Odds & Parlay Builder</Title>
          <Subtitle>
            Browse live odds from major sportsbooks and build your parlay with one-click bet selection
          </Subtitle>

          <StatsBar>
            <StatItem>
              <span className="value">{gameCount}</span>
              <span className="label">Games Available</span>
            </StatItem>
            <StatItem>
              <span className="value">{totalMarkets}</span>
              <span className="label">Betting Markets</span>
            </StatItem>
            <StatItem>
              <span className="value">{liveGameCount}</span>
              <span className="label">Live Now</span>
            </StatItem>
            <StatItem>
              <span className="value">{selectedBets.length}</span>
              <span className="label">Selected Bets</span>
            </StatItem>
          </StatsBar>
        </HeaderSection>

        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSport={selectedSport}
          onSportChange={setSelectedSport}
          availableSports={availableSports}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          quickFilters={quickFilters}
          onQuickFilterChange={handleQuickFilterChange}
          gameCount={gameCount}
          totalMarkets={totalMarkets}
        />

        {isLoading ? (
          <LoadingState>
            <div className="spinner" />
            <h3>Loading Live Odds</h3>
            <p>Fetching the latest odds from major sportsbooks...</p>
          </LoadingState>
        ) : error ? (
          <ErrorState>
            <AlertCircle size={20} />
            <div>
              <strong>Error loading odds:</strong> {error}
              {retryCount < 2 && (
                <button
                  style={{ marginLeft: '10px', padding: '5px 10px', cursor: 'pointer' }}
                  onClick={() => setRetryCount(prev => prev + 1)}
                >
                  Retry ({retryCount}/2)
                </button>
              )}
            </div>
          </ErrorState>
        ) : filteredGames.length === 0 ? (
          <EmptyState>
            <Target size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3>No Games Found</h3>
            <p>
              Try adjusting your filters or search terms to find more betting opportunities.
            </p>
          </EmptyState>
        ) : (
          <GamesGrid>
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                onBetSelect={handleBetSelection}
                selectedBets={selectedBets}
              />
            ))}
          </GamesGrid>
        )}
      </MainContent>

      <ParlaySlip
        selectedBets={selectedBets}
        onRemoveBet={(betId) => {
          setSelectedBets(prev => prev.filter(bet => bet.id !== betId));
          toast.success('Removed from parlay');
        }}
        onClearAll={() => {
          setSelectedBets([]);
          toast.success('Cleared all bets');
        }}
        onEvaluate={handleEvaluateParlay}
        isLoading={evaluationLoading}
      />
    </LiveOddsContainer>
  );
};

export default LiveOddsParlay;
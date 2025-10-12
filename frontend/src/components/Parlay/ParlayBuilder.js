import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { DollarSign, RefreshCw, AlertCircle, Trash2, Search, Plus, AlertTriangle, Brain, Target } from 'lucide-react';
import { toast } from 'react-hot-toast';
import FilterBar from './FilterBar';
import GameCard from './GameCard';
import ParlaySlip from './ParlaySlip';
import OddsComparison from '../Odds/OddsComparison';

const BuilderContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: ${props => props.theme.spacing.xl};
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};

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

const ParlayBuilder = ({ onEvaluate, isLoading }) => {
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
  const [isLoadingGames, setIsLoadingGames] = useState(true);

  // Mock games data - replace with real API call
  const mockGames = [
    {
      id: '1',
      homeTeam: {
        name: 'Lakers',
        logo: '🏀',
        record: '28-15',
        rank: 7
      },
      awayTeam: {
        name: 'Warriors',
        logo: '🏀',
        record: '25-18',
        rank: 10
      },
      sport: 'basketball',
      league: 'NBA',
      gameTime: '2024-01-15T20:00:00Z',
      isLive: false,
      quarter: null,
      timeRemaining: null,
      homeScore: null,
      awayScore: null,
      bets: {
        moneyline: {
          home: { odds: -150, sportsbook: 'DraftKings' },
          away: { odds: +130, sportsbook: 'DraftKings' }
        },
        spread: {
          home: { odds: -110, line: -3.5, sportsbook: 'FanDuel' },
          away: { odds: -110, line: +3.5, sportsbook: 'FanDuel' }
        },
        total: {
          over: { odds: -105, line: 225.5, sportsbook: 'BetMGM' },
          under: { odds: -115, line: 225.5, sportsbook: 'BetMGM' }
        }
      },
      playerProps: [
        {
          player: 'LeBron James',
          type: 'Points',
          line: 28.5,
          over: { odds: -110, sportsbook: 'DraftKings' },
          under: { odds: -110, sportsbook: 'DraftKings' }
        },
        {
          player: 'Stephen Curry',
          type: 'Points',
          line: 26.5,
          over: { odds: -115, sportsbook: 'FanDuel' },
          under: { odds: -105, sportsbook: 'FanDuel' }
        }
      ],
      featured: true,
      popular: true
    },
    {
      id: '2',
      homeTeam: {
        name: 'Chiefs',
        logo: '🏈',
        record: '14-3',
        rank: 1
      },
      awayTeam: {
        name: 'Bills',
        logo: '🏈',
        record: '13-4',
        rank: 2
      },
      sport: 'football',
      league: 'NFL',
      gameTime: '2024-01-15T18:00:00Z',
      isLive: true,
      quarter: '2nd',
      timeRemaining: '8:42',
      homeScore: 14,
      awayScore: 10,
      bets: {
        moneyline: {
          home: { odds: -180, sportsbook: 'BetMGM' },
          away: { odds: +150, sportsbook: 'BetMGM' }
        },
        spread: {
          home: { odds: -110, line: -4.5, sportsbook: 'Caesars' },
          away: { odds: -110, line: +4.5, sportsbook: 'Caesars' }
        },
        total: {
          over: { odds: -110, line: 47.5, sportsbook: 'DraftKings' },
          under: { odds: -110, line: 47.5, sportsbook: 'DraftKings' }
        }
      },
      playerProps: [
        {
          player: 'Patrick Mahomes',
          type: 'Passing Yards',
          line: 285.5,
          over: { odds: -105, sportsbook: 'FanDuel' },
          under: { odds: -115, sportsbook: 'FanDuel' }
        },
        {
          player: 'Josh Allen',
          type: 'Passing Yards',
          line: 275.5,
          over: { odds: -110, sportsbook: 'DraftKings' },
          under: { odds: -110, sportsbook: 'DraftKings' }
        }
      ],
      featured: true,
      live: true,
      popular: true
    },
    {
      id: '3',
      homeTeam: {
        name: 'Bruins',
        logo: '🏒',
        record: '30-10-8',
        rank: 3
      },
      awayTeam: {
        name: 'Rangers',
        logo: '🏒',
        record: '28-12-6',
        rank: 5
      },
      sport: 'hockey',
      league: 'NHL',
      gameTime: '2024-01-15T19:30:00Z',
      isLive: false,
      quarter: null,
      timeRemaining: null,
      homeScore: null,
      awayScore: null,
      bets: {
        moneyline: {
          home: { odds: -120, sportsbook: 'FanDuel' },
          away: { odds: +100, sportsbook: 'FanDuel' }
        },
        spread: {
          home: { odds: -110, line: -1.5, sportsbook: 'BetMGM' },
          away: { odds: -110, line: +1.5, sportsbook: 'BetMGM' }
        },
        total: {
          over: { odds: -105, line: 6.5, sportsbook: 'Caesars' },
          under: { odds: -115, line: 6.5, sportsbook: 'Caesars' }
        }
      },
      playerProps: [
        {
          player: 'David Pastrnak',
          type: 'Goals',
          line: 0.5,
          over: { odds: +180, sportsbook: 'DraftKings' },
          under: { odds: -220, sportsbook: 'DraftKings' }
        }
      ],
      popular: true
    }
  ];

  const availableSports = [
    { value: 'all', label: 'All Sports', active: true },
    { value: 'football', label: 'NFL', active: true },
    { value: 'basketball', label: 'NBA', active: true },
    { value: 'hockey', label: 'NHL', active: true },
    { value: 'baseball', label: 'MLB', active: false },
    { value: 'soccer', label: 'Soccer', active: true }
  ];

  // Load games on component mount
  useEffect(() => {
    const loadGames = async () => {
      setIsLoadingGames(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setGames(mockGames);
      } catch (error) {
        console.error('Failed to load games:', error);
      } finally {
        setIsLoadingGames(false);
      }
    };

    loadGames();
  }, []);

  // Filter games based on current filters
  const filteredGames = games.filter(game => {
    // Sport filter
    if (selectedSport !== 'all' && game.sport !== selectedSport) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const searchableText = [
        game.homeTeam.name,
        game.awayTeam.name,
        game.league,
        ...game.playerProps.map(prop => prop.player)
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
    } else {
      // Add new bet
      setSelectedBets(prev => [...prev, bet]);
    }
  };

  const handleQuickFilterChange = (filterKey, value) => {
    setQuickFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  // Handle parlay evaluation with the new format
  const handleEvaluateParlay = () => {
    if (selectedBets.length === 0) {
      return;
    }

    // Convert new format to old format for backend compatibility
    const parlayData = {
      bets: selectedBets.map(bet => ({
        team: bet.team,
        odds: bet.odds,
        bet_type: bet.betType,
        amount: bet.amount || 25, // Default amount if not specified
        sportsbook: bet.sportsbook
      })),
      total_amount: selectedBets.reduce((sum, bet) => sum + (bet.amount || 25), 0),
      user_notes: ''
    };

    onEvaluate(parlayData);
  };

  const gameCount = filteredGames.length;
  const totalMarkets = filteredGames.reduce((sum, game) => {
    return sum + 3 + game.playerProps.length; // moneyline, spread, total + player props
  }, 0);

  return (
    <BuilderContainer>
      <MainContent>
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

        {isLoadingGames ? (
          <LoadingState>
            <div className="spinner" />
            <h3>Loading Games</h3>
            <p>Finding the best betting opportunities...</p>
          </LoadingState>
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
        }}
        onClearAll={() => setSelectedBets([])}
        onEvaluate={handleEvaluateParlay}
        isLoading={isLoading}
      />
    </BuilderContainer>
  );
};

export default ParlayBuilder;
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { Star, TrendingUp, Clock, ExternalLink, Calendar, PauseCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LiveGameScoreCard from './LiveGameScoreCard';
import EmptySportState from './EmptySportState';

const SportsContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  z-index: 1;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.sm};
  }
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
  background: ${props => props.theme.colors.background.card};
  backdrop-filter: blur(20px);
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin: 0 auto ${props => props.theme.spacing.xl} auto;
  max-width: 800px;
  position: relative;
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.lg};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, 
      ${props => props.theme.colors.accent.primary}08 0%, 
      transparent 50%,
      ${props => props.theme.colors.accent.primary}08 100%
    );
    pointer-events: none;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
    margin-bottom: ${props => props.theme.spacing.lg};
    max-width: 600px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
    max-width: none;
    margin-left: 0;
    margin-right: 0;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.75rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.9rem;
  }
`;

const DemoBanner = styled.div`
  background: linear-gradient(135deg, rgba(255, 140, 66, 0.2) 0%, rgba(255, 140, 66, 0.1) 100%);
  border: 1px solid rgba(255, 140, 66, 0.3);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    border-radius: 0;
    margin-left: -${props => props.theme.spacing.sm};
    margin-right: -${props => props.theme.spacing.sm};
  }
`;

const DemoText = styled.div`
  flex: 1;
  
  h4 {
    color: #ff8c42;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: ${props => props.theme.spacing.xs};
  }
  
  p {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.9rem;
    margin: 0;
    
    a {
      color: #ff8c42;
      text-decoration: none;
      font-weight: 500;
      
      &:hover {
        text-decoration: underline;
      }
    }
  }
`;

const SportSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SportButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.active 
    ? `linear-gradient(135deg, ${props.theme.colors.accent.primary} 0%, ${props.theme.colors.accent.primary}CC 100%)`
    : 'rgba(26, 26, 26, 0.8)'
  };
  backdrop-filter: blur(10px);
  color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.active ? props.theme.colors.accent.primary : 'rgba(0, 212, 170, 0.2)'};
  border-radius: ${props => props.theme.borderRadius.full};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.active 
    ? `0 4px 16px rgba(0, 212, 170, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)`
    : `0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(0, 212, 170, 0.1)`
  };
  position: relative;
  overflow: hidden;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.active ? props.theme.colors.background.primary : props.theme.colors.accent.primary};
    background: ${props => props.active 
      ? `linear-gradient(135deg, ${props.theme.colors.accent.primary} 0%, ${props.theme.colors.accent.primary}DD 100%)`
      : 'rgba(0, 212, 170, 0.1)'
    };
    box-shadow: ${props => props.active 
      ? `0 6px 20px rgba(0, 212, 170, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)`
      : `0 4px 12px rgba(0, 212, 170, 0.2), inset 0 1px 0 rgba(0, 212, 170, 0.2)`
    };
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0px);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: 0.9rem;
    min-height: 44px; /* iOS touch target minimum */
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex: 1;
    min-width: 0;
    text-align: center;
  }
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  
  > * {
    width: 100%;
    max-width: 900px;
  }
`;

const GameCard = styled.div`
  background: linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 212, 170, 0.2);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(0, 212, 170, 0.1);
  
  &:hover {
    border-color: rgba(0, 212, 170, 0.5);
    box-shadow: 
      0 16px 48px rgba(0, 212, 170, 0.2),
      inset 0 1px 0 rgba(0, 212, 170, 0.2);
    transform: translateY(-4px);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.sm};
`;

const Matchup = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  flex: 1;
`;

const Team = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const Vs = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-weight: 500;
`;

const GameTime = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
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
`;

const OddsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
`;

const SportsbookCard = styled.div`
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(20, 20, 20, 0.95) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 170, 0.15);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(0, 212, 170, 0.05);

  &:hover {
    border-color: rgba(0, 212, 170, 0.3);
    box-shadow: 
      0 8px 24px rgba(0, 212, 170, 0.1),
      inset 0 1px 0 rgba(0, 212, 170, 0.1);
    transform: translateY(-2px);
  }
`;

const SportsbookName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.sm};
  text-transform: capitalize;
`;

const OddsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const TeamOdds = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  
  span:first-child {
    color: ${props => props.theme.colors.text.secondary};
    font-size: 0.8rem;
    min-width: 50px;
  }
  
  span:last-child {
    color: ${props => props.theme.colors.text.primary};
    font-weight: 600;
    font-size: 0.9rem;
  }
`;

const BestOddsBadge = styled.div`
  position: absolute;
  top: -8px;
  right: -8px;
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: 4px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 2px;
`;

const BetButton = styled.button`
  width: 100%;
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-weight: 600;
  cursor: pointer;
  margin-top: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover};
    transform: translateY(-1px);
  }
`;

const LoadingState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
  
  h3 {
    color: ${props => props.theme.colors.text.primary};
    margin-bottom: ${props => props.theme.spacing.sm};
  }
`;

const SeasonStatusCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
  
  &.offseason {
    border-left: 4px solid ${props => props.theme.colors.accent.secondary};
  }
  
  &.preseason {
    border-left: 4px solid ${props => props.theme.colors.accent.primary};
  }
`;

const SeasonStatusIcon = styled.div`
  font-size: 3rem;
  margin-bottom: ${props => props.theme.spacing.md};
  opacity: 0.6;
`;

const SeasonStatusTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SeasonStatusDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SeasonStatusAction = styled.p`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
  font-style: italic;
`;

const PropBetsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xl};
  margin-top: ${props => props.theme.spacing.lg};
`;

const PropBetCategory = styled.div`
  background: linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.98) 100%);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(0, 212, 170, 0.25);
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(0, 212, 170, 0.15);
  
  &:hover {
    border-color: rgba(0, 212, 170, 0.5);
    box-shadow: 
      0 16px 48px rgba(0, 212, 170, 0.25),
      inset 0 1px 0 rgba(0, 212, 170, 0.25);
    transform: translateY(-4px);
  }
`;

const PropBetHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
  text-align: center;
`;

const PropBetTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PropBetDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const PropBetsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: ${props => props.theme.spacing.md};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PropBetItem = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

const PropBetItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PayoutCalculator = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.tertiary};
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const BetAmountInput = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const BetAmountLabel = styled.label`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 30px;
`;

const BetAmountField = styled.input`
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  width: 80px;
  text-align: center;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent.primary};
  }
`;

const PayoutDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PayoutLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const PayoutAmount = styled.span`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  font-size: 0.9rem;
  
  &.total-payout {
    color: ${props => props.theme.colors.accent.primary};
    font-weight: 700;
    font-size: 1rem;
  }
  
  &.profit {
    color: #22c55e;
  }
`;

const QuickBetAmounts = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.xs};
  margin-top: ${props => props.theme.spacing.xs};
`;

const QuickBetButton = styled.button`
  background: ${props => props.selected ? props.theme.colors.accent.primary : 'transparent'};
  color: ${props => props.selected ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: 4px 8px;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
  }
`;

const PropBetTeam = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  flex: 1;
`;

const PropBetOdds = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0 ${props => props.theme.spacing.sm};
`;

const PropBetButton = styled.button`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primaryHover};
    transform: translateY(-1px);
  }
`;

const SeasonHeader = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.card};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.primary};
`;

const SeasonTitle = styled.h2`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const SeasonSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
`;

const sportsData = [
  { key: 'all', name: 'All Sports', active: true },
  { key: 'wnba', name: 'WNBA', active: true },
  { key: 'nfl', name: 'NFL', active: true },
  { key: 'nba', name: 'NBA', active: true },
  { key: 'mlb', name: 'MLB', active: true },
  { key: 'nhl', name: 'NHL', active: true },
  { key: 'ncaaf', name: 'College Football', active: true },
  { key: 'ncaab', name: 'College Basketball', active: true },
  { key: 'soccer', name: 'Premier League', active: true },
  { key: 'mma', name: 'MMA/UFC', active: true },
  { key: 'tennis', name: 'Tennis', active: true },
  { key: 'golf', name: 'Golf', active: true },
  { key: 'nascar', name: 'NASCAR', active: true },
  { key: 'f1', name: 'Formula 1', active: true }
];

// Simple cache to store API responses for better performance
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const LiveSports = () => {
  const [selectedSport, setSelectedSport] = useState('all');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [seasonStatus, setSeasonStatus] = useState(null);
  const [seasonMessage, setSeasonMessage] = useState(null);
  const [propBets, setPropBets] = useState(null);
  const [hasPropBets, setHasPropBets] = useState(false);
  const [betAmounts, setBetAmounts] = useState({}); // For prop bets
  const [gameBetAmounts, setGameBetAmounts] = useState({}); // For regular game bets
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Memoize sports options to prevent unnecessary re-renders
  const sportsOptions = useMemo(() => sportsData, []);

  // Memoize filtered games to improve performance
  const filteredGames = useMemo(() => {
    return games.filter(game => game && (game.teams || (game.home_team && game.away_team)));
  }, [games]);

  const loadLiveOdds = useCallback(async (sport, retryCount = 0) => {
    const maxRetries = 2;
    
    setLoading(true);
    if (retryCount === 0) {
      setError(null);
    }
    setSeasonStatus(null);
    setSeasonMessage(null);
    setPropBets(null);
    setHasPropBets(false);
    
    try {
      let endpoint;
      if (sport === 'all') {
        endpoint = `/odds/all-games?per_sport=3&upcoming=true`;
      } else {
        endpoint = `/odds/comparison/${sport}`;
      }
      
      // Check cache first
      const cacheKey = `${sport}_${endpoint}`;
      const cached = apiCache.get(cacheKey);
      const now = Date.now();
      
      if (cached && (now - cached.timestamp < CACHE_DURATION)) {
        console.log('Using cached data for:', sport);
        const data = cached.data;
        setGames(data.games || []);
        if (data.demo_mode === true || data.data_source === 'mock' || data.data_source === 'demo') {
          setIsDemoMode(true);
        } else {
          setIsDemoMode(false);
        }
        if (data.season_status && data.season_status !== 'active') {
          setSeasonStatus(data.season_status);
          setSeasonMessage(data.season_message);
          if (data.has_prop_bets && data.prop_bets) {
            setPropBets(data.prop_bets);
            setHasPropBets(true);
          }
        }
        setLoading(false);
        return;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the response
      apiCache.set(cacheKey, {
        data: data,
        timestamp: now
      });
      
      if (data.success) {
        setGames(data.games || []);
        
        // Check if we're in demo mode - only trigger for actual mock/demo data
        // Note: 'expired_cache_fallback' is still real API data, just cached
        console.log('Live Sports API Response:', {
          data_source: data.data_source,
          demo_mode: data.demo_mode,
          games_count: data.games?.length || 0,
          success: data.success
        });
        
        if (data.demo_mode === true || data.data_source === 'mock' || data.data_source === 'demo') {
          setIsDemoMode(true);
          console.log('Demo mode activated due to:', data.demo_mode ? 'demo_mode flag' : data.data_source);
        } else {
          setIsDemoMode(false);
          console.log('Live mode activated - data source:', data.data_source);
        }
        
        // Handle season status and prop bets
        if (data.season_status && data.season_status !== 'active') {
          setSeasonStatus(data.season_status);
          setSeasonMessage(data.season_message);
          
          // Handle prop bets for out-of-season sports
          if (data.has_prop_bets && data.prop_bets) {
            setPropBets(data.prop_bets);
            setHasPropBets(true);
          }
        }
      } else {
        throw new Error(data.error || 'Failed to load odds');
      }
    } catch (err) {
      console.error(`Failed to load live odds (attempt ${retryCount + 1}):`, err);
      
      // Retry logic
      if (retryCount < maxRetries && (err.name === 'AbortError' || err.message.includes('fetch'))) {
        console.log(`Retrying in ${(retryCount + 1) * 2} seconds...`);
        setTimeout(() => {
          loadLiveOdds(sport, retryCount + 1);
        }, (retryCount + 1) * 2000); // Progressive delay
        return;
      }
      
      // Final error handling
      const errorMessage = err.name === 'AbortError' 
        ? 'Request timed out. Please check your connection and try again.'
        : err.message.includes('Failed to fetch')
        ? 'Unable to connect to server. Please check your connection and try again.'
        : err.message;
      
      setError(errorMessage);
      
      // Try to use any cached data as fallback
      const endpointForCache = sport === 'all' 
        ? `/odds/all-games?per_sport=3&upcoming=true` 
        : `/odds/comparison/${sport}`;
      const cacheKey = `${sport}_${endpointForCache}`;
      const fallbackCache = apiCache.get(cacheKey);
      if (fallbackCache) {
        console.log('Using fallback cached data');
        setGames(fallbackCache.data.games || []);
        setIsDemoMode(true); // Mark as demo since it's fallback data
      } else {
        setGames([]);
      }
      
      setSeasonStatus(null);
      setSeasonMessage(null);
      setPropBets(null);
      setHasPropBets(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveOdds(selectedSport);
  }, [selectedSport, loadLiveOdds]);

  const formatOdds = (odds) => {
    if (odds > 0) return `+${odds}`;
    return `${odds}`;
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSportsbookIcon = (sportsbook) => {
    const icons = {
      'draftkings': '👑',
      'fanduel': '⚡',
      'betmgm': '🦁',
      'caesars': '🏛️',
      'betrivers': '🌊',
      'espnbet': '📺',
      'prizepicks': '🎯',
      'underdog': '🐕',
      'parlayplay': '🎲',
      'superdraft': '⭐'
    };
    return icons[sportsbook] || '🎰';
  };

  const getBestOdds = (sportsbooks, team) => {
    let best = null;
    let bestBook = null;
    
    Object.entries(sportsbooks).forEach(([book, odds]) => {
      // Skip daily fantasy platforms for best odds calculation
      if (odds.type === 'daily_fantasy') return;
      
      if (odds.moneyline && odds.moneyline[team]) {
        const value = odds.moneyline[team];
        if (!best || (value > 0 && value > best) || (value < 0 && value > best)) {
          best = value;
          bestBook = book;
        }
      }
    });
    
    return { odds: best, book: bestBook };
  };

  const handleBetClick = (sportsbook, team, sport, betAmount, odds) => {
    // Safe sportsbook homepage links - no affiliate tracking or bet facilitation
    const sportsbookUrls = {
      'draftkings': 'https://www.draftkings.com',
      'fanduel': 'https://www.fanduel.com',
      'betmgm': 'https://www.betmgm.com',
      'caesars': 'https://www.caesars.com/sportsbook',
      'betrivers': 'https://www.betrivers.com',
      'espnbet': 'https://espnbet.com',
      'fanatics': 'https://fanatics.com/betting'
    };
    
    const sportsbookUrl = sportsbookUrls[sportsbook.toLowerCase()] || `https://www.${sportsbook.toLowerCase()}.com`;
    
    // Open sportsbook homepage in new tab
    window.open(sportsbookUrl, '_blank');
    
    // Show informational message
    toast.info(`Opening ${sportsbook.toUpperCase()} - Remember to bet responsibly!`);
  };

  const calculatePayout = (odds, betAmount) => {
    if (!betAmount || betAmount <= 0) return { payout: 0, profit: 0, roi: 0 };
    
    const oddsNum = parseInt(odds.replace('+', ''));
    let payout, profit;
    
    if (oddsNum > 0) {
      // Positive odds (underdog): +200 means you win $200 on a $100 bet
      profit = (betAmount * oddsNum) / 100;
      payout = betAmount + profit;
    } else {
      // Negative odds (favorite): -150 means you bet $150 to win $100
      profit = (betAmount * 100) / Math.abs(oddsNum);
      payout = betAmount + profit;
    }
    
    const roi = betAmount > 0 ? (profit / betAmount) * 100 : 0;
    
    return {
      payout: Math.round(payout * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      roi: Math.round(roi * 10) / 10 // Round to 1 decimal place
    };
  };

  const getBetAmount = (categoryIndex, betIndex) => {
    const key = `${categoryIndex}-${betIndex}`;
    return betAmounts[key] || 25; // Default $25
  };

  const setBetAmount = (categoryIndex, betIndex, amount) => {
    const key = `${categoryIndex}-${betIndex}`;
    setBetAmounts(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(10000, amount)) // Min $0, Max $10,000
    }));
  };

  // Helper functions for regular game bets
  const getGameBetAmount = (gameId, sportsbook, betType) => {
    const key = `${gameId}-${sportsbook}-${betType}`;
    return gameBetAmounts[key] || 25; // Default $25
  };

  const setGameBetAmount = (gameId, sportsbook, betType, amount) => {
    const key = `${gameId}-${sportsbook}-${betType}`;
    setGameBetAmounts(prev => ({
      ...prev,
      [key]: Math.max(0, Math.min(10000, amount)) // Min $0, Max $10,000
    }));
  };

  const handlePropBetClick = (team, odds, betType, sport, betAmount) => {
    // Safe sportsbook homepage links - no affiliate tracking or bet facilitation
    const sportsbookUrls = {
      'draftkings': 'https://www.draftkings.com',
      'fanduel': 'https://www.fanduel.com',
      'betmgm': 'https://www.betmgm.com',
      'caesars': 'https://www.caesars.com/sportsbook'
    };
    const sportsbooks = Object.keys(sportsbookUrls);
    const randomSportsbook = sportsbooks[Math.floor(Math.random() * sportsbooks.length)];
    
    const sportsbookUrl = sportsbookUrls[randomSportsbook];
    
    // Open sportsbook homepage in new tab
    window.open(sportsbookUrl, '_blank');
    
    // Show informational message
    toast.info(`Opening ${randomSportsbook.toUpperCase()} - Remember to bet responsibly!`);
  };

  if (loading) {
    return (
      <SportsContainer>
        <LoadingState>
          <div>Loading live odds...</div>
          <TrendingUp size={24} style={{ margin: '1rem auto', opacity: 0.5 }} />
        </LoadingState>
      </SportsContainer>
    );
  }

  return (
    <SportsContainer>
      <Header>
        <Title>Live Sports Betting Odds</Title>
        <Subtitle>Compare odds across 12+ sports and 6+ major sportsbooks - find the best value</Subtitle>
      </Header>
      
      {isDemoMode && (
        <DemoBanner>
          <AlertCircle size={24} color="#ff8c42" />
          <DemoText>
            <h4>Demo Mode - Using Mock Data</h4>
            <p>
              To see real live sports data, get a free API key from{' '}
              <a href="https://the-odds-api.com/" target="_blank" rel="noopener noreferrer">
                The Odds API
              </a>
              {' '}(10,000 requests/month free)
            </p>
          </DemoText>
        </DemoBanner>
      )}

      <SportSelector>
        {sportsOptions.map((sport) => (
          <SportButton
            key={sport.key}
            active={selectedSport === sport.key}
            onClick={() => setSelectedSport(sport.key)}
            disabled={!sport.active}
          >
            {sport.name}
          </SportButton>
        ))}
      </SportSelector>

      {error && (
        <EmptyState>
          <h3>Unable to load odds</h3>
          <p>{error}</p>
          <button onClick={() => loadLiveOdds(selectedSport)}>Try Again</button>
        </EmptyState>
      )}

      {!loading && !error && hasPropBets && propBets && (
        <div>
          <SeasonHeader>
            <SeasonTitle>{propBets.next_season}</SeasonTitle>
            <SeasonSubtitle>{seasonMessage?.description}</SeasonSubtitle>
          </SeasonHeader>
          
          <PropBetsContainer>
            {propBets.categories?.map((category, categoryIndex) => (
              <PropBetCategory key={categoryIndex}>
                <PropBetHeader>
                  <PropBetTitle>{category.title}</PropBetTitle>
                  <PropBetDescription>{category.description}</PropBetDescription>
                </PropBetHeader>
                
                <PropBetsList>
                  {category.bets?.map((bet, betIndex) => {
                    const currentBetAmount = getBetAmount(categoryIndex, betIndex);
                    const { payout, profit } = calculatePayout(bet.odds, currentBetAmount);
                    
                    return (
                      <PropBetItem key={betIndex}>
                        <PropBetItemHeader>
                          <PropBetTeam>{bet.team}</PropBetTeam>
                          <PropBetOdds>{bet.odds}</PropBetOdds>
                        </PropBetItemHeader>
                        
                        <PayoutCalculator>
                          <BetAmountInput>
                            <BetAmountLabel>Bet:</BetAmountLabel>
                            <span style={{ color: '#888', fontSize: '0.8rem' }}>$</span>
                            <BetAmountField
                              type="number"
                              value={currentBetAmount}
                              onChange={(e) => setBetAmount(categoryIndex, betIndex, parseFloat(e.target.value) || 0)}
                              min="0"
                              max="10000"
                              step="5"
                            />
                          </BetAmountInput>
                          
                          <QuickBetAmounts>
                            {[10, 25, 50, 100].map(amount => (
                              <QuickBetButton
                                key={amount}
                                selected={currentBetAmount === amount}
                                onClick={() => setBetAmount(categoryIndex, betIndex, amount)}
                              >
                                ${amount}
                              </QuickBetButton>
                            ))}
                          </QuickBetAmounts>
                          
                          <PayoutDisplay>
                            <PayoutLabel>To Win:</PayoutLabel>
                            <PayoutAmount className="profit">+${profit.toFixed(2)}</PayoutAmount>
                          </PayoutDisplay>
                          
                          <PayoutDisplay>
                            <PayoutLabel>Total Payout:</PayoutLabel>
                            <PayoutAmount className="total-payout">${payout.toFixed(2)}</PayoutAmount>
                          </PayoutDisplay>
                          
                          <PropBetButton 
                            onClick={() => handlePropBetClick(bet.team, bet.odds, category.title, selectedSport, currentBetAmount)}
                            style={{ marginTop: '8px' }}
                          >
                            <ExternalLink size={12} />
                            Bet ${currentBetAmount} Now
                          </PropBetButton>
                        </PayoutCalculator>
                      </PropBetItem>
                    );
                  })}
                </PropBetsList>
              </PropBetCategory>
            ))}
          </PropBetsContainer>
        </div>
      )}

      {!loading && !error && seasonMessage && !hasPropBets && (
        <SeasonStatusCard className={seasonStatus}>
          <SeasonStatusIcon>
            {seasonStatus === 'offseason' ? <PauseCircle size={48} /> : <Calendar size={48} />}
          </SeasonStatusIcon>
          <SeasonStatusTitle>{seasonMessage.title}</SeasonStatusTitle>
          <SeasonStatusDescription>{seasonMessage.description}</SeasonStatusDescription>
          <SeasonStatusAction>{seasonMessage.action}</SeasonStatusAction>
        </SeasonStatusCard>
      )}

      {!loading && !error && !seasonMessage && games.length === 0 && (
        <EmptySportState sport={selectedSport} />
      )}

      <GamesList>
        {filteredGames.map((game) => {
          // Check if game has live data and should use LiveGameScoreCard
          if (game.live_data) {
            return <LiveGameScoreCard key={game.id} game={game} />;
          }
          
          // Regular game card for scheduled games
          return (
            <GameCard key={game.id}>
              <GameHeader>
                <Matchup>
                  {selectedSport === 'all' && game.sport && (
                    <SportBadge>{game.sport}</SportBadge>
                  )}
                  <Team>{game.away_team}</Team>
                  <Vs>@</Vs>
                  <Team>{game.home_team}</Team>
                </Matchup>
                <GameTime>
                  <Clock size={14} />
                  {formatTime(game.commence_time)}
                </GameTime>
              </GameHeader>

            <OddsContainer>
              {Object.entries(game.sportsbooks).map(([sportsbook, odds]) => {
                // Check if this is a daily fantasy platform
                const isDailyFantasy = odds.type === 'daily_fantasy';
                
                if (isDailyFantasy) {
                  // Render daily fantasy props
                  return (
                    <SportsbookCard key={sportsbook} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <SportsbookName style={{ color: 'white' }}>
                        {getSportsbookIcon(sportsbook)} {odds.platform_name}
                      </SportsbookName>
                      
                      <div style={{ color: 'white', fontSize: '0.8rem', marginBottom: '8px', fontWeight: '500' }}>
                        Player Props & Over/Under
                      </div>
                      
                      {odds.player_props?.slice(0, 2).map((prop, index) => (
                        <div key={index} style={{ marginBottom: '8px', color: 'white' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                            {prop.player} - {prop.stat}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem' }}>More {prop.line}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{prop.more_odds}</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }}>
                              <div style={{ fontSize: '0.7rem' }}>Less {prop.line}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: '600' }}>{prop.less_odds}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <BetButton 
                        onClick={() => handleBetClick(sportsbook, 'Player Props', selectedSport, 25, -110)}
                        style={{ background: 'rgba(255,255,255,0.9)', color: '#333', marginTop: '8px' }}
                      >
                        <ExternalLink size={12} />
                        View All Props
                      </BetButton>
                    </SportsbookCard>
                  );
                }
                
                // Regular sportsbook rendering
                const homeOdds = odds.moneyline?.home;
                const awayOdds = odds.moneyline?.away;
                const bestHome = getBestOdds(game.sportsbooks, 'home');
                const bestAway = getBestOdds(game.sportsbooks, 'away');
                const hasBestHome = bestHome.book === sportsbook;
                const hasBestAway = bestAway.book === sportsbook;

                return (
                  <SportsbookCard key={sportsbook}>
                    {hasBestHome && hasBestAway && (
                      <BestOddsBadge>
                        <Star size={10} />
                        Best Both
                      </BestOddsBadge>
                    )}
                    {hasBestHome && !hasBestAway && (
                      <BestOddsBadge>
                        <Star size={10} />
                        Best Home
                      </BestOddsBadge>
                    )}
                    {hasBestAway && !hasBestHome && (
                      <BestOddsBadge>
                        <Star size={10} />
                        Best Away
                      </BestOddsBadge>
                    )}
                    
                    <SportsbookName>
                      {getSportsbookIcon(sportsbook)} {sportsbook.charAt(0).toUpperCase() + sportsbook.slice(1)}
                    </SportsbookName>
                    
                    {awayOdds && (
                      <div style={{ marginBottom: '12px' }}>
                        <OddsRow>
                          <TeamOdds>
                            <span>Away:</span>
                            <span>{formatOdds(awayOdds)}</span>
                          </TeamOdds>
                        </OddsRow>
                        
                        <PayoutCalculator style={{ marginTop: '8px' }}>
                          <BetAmountInput>
                            <BetAmountLabel>Bet:</BetAmountLabel>
                            <span style={{ color: '#888', fontSize: '0.8rem' }}>$</span>
                            <BetAmountField
                              type="number"
                              value={getGameBetAmount(game.id, sportsbook, 'away')}
                              onChange={(e) => setGameBetAmount(game.id, sportsbook, 'away', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="10000"
                              step="5"
                            />
                          </BetAmountInput>
                          
                          <QuickBetAmounts>
                            {[10, 25, 50, 100].map(amount => (
                              <QuickBetButton
                                key={amount}
                                selected={getGameBetAmount(game.id, sportsbook, 'away') === amount}
                                onClick={() => setGameBetAmount(game.id, sportsbook, 'away', amount)}
                              >
                                ${amount}
                              </QuickBetButton>
                            ))}
                          </QuickBetAmounts>
                          
                          <PayoutDisplay>
                            <PayoutLabel>To Win:</PayoutLabel>
                            <PayoutAmount className="profit">
                              +${calculatePayout(formatOdds(awayOdds), getGameBetAmount(game.id, sportsbook, 'away')).profit.toFixed(2)}
                            </PayoutAmount>
                          </PayoutDisplay>
                          
                          <BetButton 
                            onClick={() => handleBetClick(sportsbook, game.away_team, selectedSport, getGameBetAmount(game.id, sportsbook, 'away'), awayOdds)}
                            style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            <ExternalLink size={12} />
                            Bet ${getGameBetAmount(game.id, sportsbook, 'away')} on {game.away_team}
                          </BetButton>
                        </PayoutCalculator>
                      </div>
                    )}
                    
                    {homeOdds && (
                      <div>
                        <OddsRow>
                          <TeamOdds>
                            <span>Home:</span>
                            <span>{formatOdds(homeOdds)}</span>
                          </TeamOdds>
                        </OddsRow>
                        
                        <PayoutCalculator style={{ marginTop: '8px' }}>
                          <BetAmountInput>
                            <BetAmountLabel>Bet:</BetAmountLabel>
                            <span style={{ color: '#888', fontSize: '0.8rem' }}>$</span>
                            <BetAmountField
                              type="number"
                              value={getGameBetAmount(game.id, sportsbook, 'home')}
                              onChange={(e) => setGameBetAmount(game.id, sportsbook, 'home', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="10000"
                              step="5"
                            />
                          </BetAmountInput>
                          
                          <QuickBetAmounts>
                            {[10, 25, 50, 100].map(amount => (
                              <QuickBetButton
                                key={amount}
                                selected={getGameBetAmount(game.id, sportsbook, 'home') === amount}
                                onClick={() => setGameBetAmount(game.id, sportsbook, 'home', amount)}
                              >
                                ${amount}
                              </QuickBetButton>
                            ))}
                          </QuickBetAmounts>
                          
                          <PayoutDisplay>
                            <PayoutLabel>To Win:</PayoutLabel>
                            <PayoutAmount className="profit">
                              +${calculatePayout(formatOdds(homeOdds), getGameBetAmount(game.id, sportsbook, 'home')).profit.toFixed(2)}
                            </PayoutAmount>
                          </PayoutDisplay>
                          
                          <BetButton 
                            onClick={() => handleBetClick(sportsbook, game.home_team, selectedSport, getGameBetAmount(game.id, sportsbook, 'home'), homeOdds)}
                            style={{ marginTop: '8px', fontSize: '0.8rem', padding: '6px 12px' }}
                          >
                            <ExternalLink size={12} />
                            Bet ${getGameBetAmount(game.id, sportsbook, 'home')} on {game.home_team}
                          </BetButton>
                        </PayoutCalculator>
                      </div>
                    )}
                  </SportsbookCard>
                );
              })}
            </OddsContainer>
          </GameCard>
          )
        })}
      </GamesList>
    </SportsContainer>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(LiveSports);
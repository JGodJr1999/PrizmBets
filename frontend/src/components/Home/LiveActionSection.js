import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { Activity, Clock, AlertCircle, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.7; }
`;

const SectionContainer = styled.section`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  position: relative;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const SectionHeader = styled.div`
  max-width: 1200px;
  margin: 0 auto ${props => props.theme.spacing.xl} auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    align-items: flex-start;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  svg {
    color: ${props => props.theme.colors.status.error};
    animation: ${pulse} 2s ease-in-out infinite;
  }
`;

const ViewAllButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: transparent;
  border: 1px solid ${props => props.theme.colors.border.secondary};
  color: ${props => props.theme.colors.text.secondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.accent.primary};
    transform: translateX(5px);
  }
`;

const GamesGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const GameCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-4px);
  }

  ${props => props.isLive && `
    border-color: ${props.theme.colors.status.error}50;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg,
        ${props.theme.colors.status.error} 0%,
        ${props.theme.colors.status.warning} 100%
      );
    }
  `}
`;

const LiveIndicator = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.status.error};
  color: white;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 600;
  animation: ${pulse} 2s ease-in-out infinite;
`;

const TeamRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const TeamInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TeamLogo = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.sm};
  background: ${props => props.theme.colors.background.hover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
`;

const TeamName = styled.div`
  font-weight: 500;
  color: ${props => props.theme.colors.text.primary};
  ${props => props.isWinner && `
    color: ${props.theme.colors.status.success};
    font-weight: 600;
  `}
`;

const Score = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  ${props => props.isWinner && `
    color: ${props.theme.colors.status.success};
  `}
`;

const GameDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.secondary};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const QuickBetButton = styled(motion.button)`
  background: linear-gradient(135deg,
    ${props => props.theme.colors.accent.primary} 0%,
    ${props => props.theme.colors.accent.secondary} 100%
  );
  color: ${props => props.theme.colors.background.primary};
  border: none;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const CountdownTimer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;

  svg {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.secondary};

  svg {
    margin-bottom: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.text.muted};
  }
`;

const LiveActionSection = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  // Mock live games data
  const mockGames = [
    {
      id: 1,
      sport: 'NBA',
      homeTeam: 'Lakers',
      awayTeam: 'Celtics',
      homeScore: 87,
      awayScore: 92,
      period: '3rd Quarter',
      timeRemaining: '7:23',
      isLive: true
    },
    {
      id: 2,
      sport: 'NFL',
      homeTeam: 'Chiefs',
      awayTeam: 'Eagles',
      homeScore: 21,
      awayScore: 17,
      period: 'Halftime',
      timeRemaining: '',
      isLive: true
    },
    {
      id: 3,
      sport: 'NHL',
      homeTeam: 'Rangers',
      awayTeam: 'Bruins',
      homeScore: 2,
      awayScore: 2,
      period: '2nd Period',
      timeRemaining: '12:45',
      isLive: true
    },
    {
      id: 4,
      sport: 'NBA',
      homeTeam: 'Warriors',
      awayTeam: 'Nets',
      homeScore: 0,
      awayScore: 0,
      period: 'Starting Soon',
      timeRemaining: '15:00',
      isLive: false
    },
    {
      id: 5,
      sport: 'MLB',
      homeTeam: 'Yankees',
      awayTeam: 'Red Sox',
      homeScore: 4,
      awayScore: 3,
      period: '7th Inning',
      timeRemaining: '',
      isLive: true
    },
    {
      id: 6,
      sport: 'NFL',
      homeTeam: 'Cowboys',
      awayTeam: 'Giants',
      homeScore: 0,
      awayScore: 0,
      period: 'Starting Soon',
      timeRemaining: '45:00',
      isLive: false
    }
  ];

  useEffect(() => {
    // Use mock data for now
    setGames(mockGames);

    // Simulate score updates
    const interval = setInterval(() => {
      setGames(prev => prev.map(game => {
        if (game.isLive && Math.random() > 0.8) {
          const team = Math.random() > 0.5 ? 'home' : 'away';
          return {
            ...game,
            homeScore: team === 'home' ? game.homeScore + Math.floor(Math.random() * 3 + 1) : game.homeScore,
            awayScore: team === 'away' ? game.awayScore + Math.floor(Math.random() * 3 + 1) : game.awayScore,
          };
        }
        return game;
      }));
    }, 10000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    },
    hover: {
      y: -4,
      transition: { duration: 0.2 }
    }
  };

  return (
    <SectionContainer>
      <SectionHeader>
        <Title>
          <Activity size={24} />
          Live Action
        </Title>
        <ViewAllButton
          onClick={() => navigate('/live-scores')}
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          View All Games
          <ChevronRight size={16} />
        </ViewAllButton>
      </SectionHeader>

      <GamesGrid>
        {games.length > 0 ? (
          games.map((game, index) => (
            <GameCard
              key={game.id}
              isLive={game.isLive}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
              transition={{ delay: index * 0.1 }}
            >
              {game.isLive && (
                <LiveIndicator>
                  <Activity size={12} />
                  LIVE
                </LiveIndicator>
              )}

              <TeamRow>
                <TeamInfo>
                  <TeamLogo>{game.awayTeam.substring(0, 2).toUpperCase()}</TeamLogo>
                  <TeamName isWinner={game.isLive && game.awayScore > game.homeScore}>
                    {game.awayTeam}
                  </TeamName>
                </TeamInfo>
                <Score isWinner={game.isLive && game.awayScore > game.homeScore}>
                  {game.awayScore}
                </Score>
              </TeamRow>

              <TeamRow>
                <TeamInfo>
                  <TeamLogo>{game.homeTeam.substring(0, 2).toUpperCase()}</TeamLogo>
                  <TeamName isWinner={game.isLive && game.homeScore > game.awayScore}>
                    {game.homeTeam}
                  </TeamName>
                </TeamInfo>
                <Score isWinner={game.isLive && game.homeScore > game.awayScore}>
                  {game.homeScore}
                </Score>
              </TeamRow>

              <GameDetails>
                <div>
                  {game.period}
                  {game.timeRemaining && ` - ${game.timeRemaining}`}
                </div>
                {game.isLive ? (
                  <QuickBetButton
                    onClick={() => navigate('/parlay')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Zap size={14} />
                    Quick Bet
                  </QuickBetButton>
                ) : (
                  <CountdownTimer>
                    <Clock size={14} />
                    {game.timeRemaining}
                  </CountdownTimer>
                )}
              </GameDetails>
            </GameCard>
          ))
        ) : (
          <EmptyState>
            <AlertCircle size={48} />
            <p>No live games at the moment</p>
          </EmptyState>
        )}
      </GamesGrid>
    </SectionContainer>
  );
};

export default LiveActionSection;
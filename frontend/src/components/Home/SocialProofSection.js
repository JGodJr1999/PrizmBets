import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Activity, Award } from 'lucide-react';

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const SectionContainer = styled.section`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  background: linear-gradient(180deg,
    ${props => `${props.theme.colors.background.card}10`} 0%,
    ${props => props.theme.colors.background.primary} 100%
  );
  position: relative;
  overflow: hidden;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const ContentGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const LiveFeedCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  height: 400px;
  display: flex;
  flex-direction: column;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.md};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
`;

const CardTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};

  svg {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const LiveIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.status.error};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.7rem;
  font-weight: 600;
`;

const FeedContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: ${props => props.theme.spacing.xs};

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.background.hover};
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.secondary};
    border-radius: 2px;
  }
`;

const BetItem = styled(motion.div)`
  padding: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.background.hover};
  border-radius: ${props => props.theme.borderRadius.sm};
  border-left: 3px solid ${props => props.borderColor || props.theme.colors.accent.primary};
  animation: ${slideUp} 0.5s ease;
`;

const BetUser = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Username = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const BetAmount = styled.span`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
  font-size: 0.85rem;
`;

const BetDetails = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
`;

const WinItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md};
  background: linear-gradient(135deg,
    ${props => props.theme.colors.status.success}10 0%,
    transparent 100%
  );
  border-radius: ${props => props.theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.colors.status.success}30;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const WinIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.theme.colors.status.success}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.status.success};
`;

const WinDetails = styled.div`
  flex: 1;
`;

const WinUser = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 500;
`;

const WinAmount = styled.div`
  color: ${props => props.theme.colors.status.success};
  font-size: 1.1rem;
  font-weight: 700;
`;

const LeaderboardItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm};
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
    border-radius: ${props => props.theme.borderRadius.sm};
  }
`;

const Rank = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${props => props.theme.borderRadius.full};
  background: ${props => props.isTop3 ? props.theme.colors.accent.primary : props.theme.colors.background.hover};
  color: ${props => props.isTop3 ? props.theme.colors.background.primary : props.theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
`;

const LeaderInfo = styled.div`
  flex: 1;
`;

const LeaderName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  font-size: 0.9rem;
`;

const LeaderStats = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const LeaderPoints = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
`;

const CommunityStats = styled.div`
  grid-column: 1 / -1;
  display: flex;
  justify-content: space-around;
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const StatBlock = styled.div`
  text-align: center;
`;

const StatValue = styled(motion.div)`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg,
    ${props => props.theme.colors.text.primary} 0%,
    ${props => props.theme.colors.accent.primary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-top: ${props => props.theme.spacing.xs};
`;

const SocialProofSection = () => {
  const [recentBets, setRecentBets] = useState([]);
  const [recentWins, setRecentWins] = useState([]);
  const [communityStats, setCommunityStats] = useState({
    totalBets: 1247,
    todaysWinners: 89,
    totalPayout: 127450
  });

  // Mock data for recent bets
  const mockBets = [
    { user: 'Mike***', amount: 50, bet: 'Lakers ML + Over 220.5', time: 'Just now' },
    { user: 'Sarah***', amount: 100, bet: 'Chiefs -3.5', time: '30s ago' },
    { user: 'John***', amount: 25, bet: '3-leg NBA parlay', time: '1m ago' },
    { user: 'Emma***', amount: 200, bet: 'Yankees ML + Judge HR', time: '2m ago' },
    { user: 'Chris***', amount: 75, bet: 'Lightning vs Rangers O5.5', time: '3m ago' }
  ];

  // Mock data for recent wins
  const mockWins = [
    { user: 'Alex***', amount: 2450, bet: '5-leg parlay' },
    { user: 'Lisa***', amount: 780, bet: 'NBA same game parlay' },
    { user: 'Ryan***', amount: 1200, bet: 'NFL teaser' },
    { user: 'Kate***', amount: 540, bet: '3-team ML parlay' }
  ];

  // Mock leaderboard data
  const leaderboard = [
    { rank: 1, name: 'TopShark***', wins: 23, profit: '+$4,250' },
    { rank: 2, name: 'BetMaster***', wins: 21, profit: '+$3,890' },
    { rank: 3, name: 'ProPicks***', wins: 19, profit: '+$3,200' },
    { rank: 4, name: 'Wizard***', wins: 17, profit: '+$2,750' },
    { rank: 5, name: 'Sharp***', wins: 16, profit: '+$2,400' }
  ];

  useEffect(() => {
    // Initialize with mock data
    setRecentBets(mockBets);
    setRecentWins(mockWins);

    // Simulate new bets coming in
    const betInterval = setInterval(() => {
      const newBet = mockBets[Math.floor(Math.random() * mockBets.length)];
      setRecentBets(prev => [newBet, ...prev.slice(0, 4)]);
    }, 5000);

    // Simulate stats updates
    const statsInterval = setInterval(() => {
      setCommunityStats(prev => ({
        totalBets: prev.totalBets + Math.floor(Math.random() * 5),
        todaysWinners: prev.todaysWinners + (Math.random() > 0.7 ? 1 : 0),
        totalPayout: prev.totalPayout + Math.floor(Math.random() * 500)
      }));
    }, 3000);

    return () => {
      clearInterval(betInterval);
      clearInterval(statsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SectionContainer>
      <ContentGrid>
        {/* Live Bet Feed */}
        <LiveFeedCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CardHeader>
            <CardTitle>
              <Activity size={20} />
              Live Bet Feed
            </CardTitle>
            <LiveIndicator>
              <Activity size={10} />
              LIVE
            </LiveIndicator>
          </CardHeader>
          <FeedContent>
            <AnimatePresence>
              {recentBets.map((bet, index) => (
                <BetItem
                  key={`${bet.user}-${index}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  borderColor={index === 0 ? '#4ECDC4' : undefined}
                >
                  <BetUser>
                    <Username>{bet.user}</Username>
                    <BetAmount>${bet.amount}</BetAmount>
                  </BetUser>
                  <BetDetails>{bet.bet}</BetDetails>
                </BetItem>
              ))}
            </AnimatePresence>
          </FeedContent>
        </LiveFeedCard>

        {/* Recent Wins */}
        <LiveFeedCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <CardHeader>
            <CardTitle>
              <Trophy size={20} />
              Recent Wins
            </CardTitle>
          </CardHeader>
          <FeedContent>
            {recentWins.map((win, index) => (
              <WinItem
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <WinIcon>
                  <Trophy size={20} />
                </WinIcon>
                <WinDetails>
                  <WinUser>{win.user} won with {win.bet}</WinUser>
                  <WinAmount>+${win.amount.toLocaleString()}</WinAmount>
                </WinDetails>
              </WinItem>
            ))}
          </FeedContent>
        </LiveFeedCard>

        {/* Leaderboard */}
        <LiveFeedCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <CardHeader>
            <CardTitle>
              <Award size={20} />
              Today's Leaders
            </CardTitle>
          </CardHeader>
          <FeedContent>
            {leaderboard.map((leader) => (
              <LeaderboardItem key={leader.rank}>
                <Rank isTop3={leader.rank <= 3}>{leader.rank}</Rank>
                <LeaderInfo>
                  <LeaderName>{leader.name}</LeaderName>
                  <LeaderStats>{leader.wins} wins today</LeaderStats>
                </LeaderInfo>
                <LeaderPoints>{leader.profit}</LeaderPoints>
              </LeaderboardItem>
            ))}
          </FeedContent>
        </LiveFeedCard>

        {/* Community Stats */}
        <CommunityStats>
          <StatBlock>
            <StatValue
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
            >
              {communityStats.totalBets.toLocaleString()}
            </StatValue>
            <StatLabel>Bets Placed Today</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.4 }}
            >
              {communityStats.todaysWinners}
            </StatValue>
            <StatLabel>Winners Today</StatLabel>
          </StatBlock>
          <StatBlock>
            <StatValue
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
            >
              ${(communityStats.totalPayout / 1000).toFixed(0)}K
            </StatValue>
            <StatLabel>Total Payouts</StatLabel>
          </StatBlock>
        </CommunityStats>
      </ContentGrid>
    </SectionContainer>
  );
};

export default SocialProofSection;
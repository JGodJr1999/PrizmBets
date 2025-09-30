import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Users, Trophy, Zap, ArrowRight } from 'lucide-react';

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
  100% { transform: scale(1); opacity: 1; }
`;

const HeroContainer = styled(motion.section)`
  position: relative;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg,
    ${props => props.theme.colors.background.primary} 0%,
    ${props => props.theme.colors.background.card} 50%,
    ${props => props.theme.colors.background.primary} 100%
  );
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      ${props => `${props.theme.colors.accent.primary}10`} 0%,
      transparent 70%
    );
    animation: ${pulse} 4s ease-in-out infinite;
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const OddsTicker = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.background.card};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.sm} 0;
  overflow: hidden;
  z-index: 10;
`;

const TickerContent = styled.div`
  display: flex;
  animation: ${scroll} 30s linear infinite;
  white-space: nowrap;

  &:hover {
    animation-play-state: paused;
  }
`;

const TickerItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: 0 ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;

  strong {
    color: ${props => props.isPositive ? props.theme.colors.status.success : props.theme.colors.status.error};
    font-weight: 600;
  }
`;

const HeroContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: ${props => props.theme.spacing.xxl};
  position: relative;
  z-index: 1;
`;

const WelcomeSection = styled(motion.div)`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const WelcomeText = styled(motion.h1)`
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  background: linear-gradient(135deg,
    ${props => props.theme.colors.text.primary} 0%,
    ${props => props.theme.colors.accent.primary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${props => props.theme.spacing.md};

  span {
    display: block;
    font-size: 0.5em;
    font-weight: 500;
    color: ${props => props.theme.colors.text.secondary};
    -webkit-text-fill-color: unset;
    margin-top: ${props => props.theme.spacing.sm};
  }
`;

const StatsRow = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.xxl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.lg};
    align-items: center;
  }
`;

const StatCard = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: ${props => props.theme.colors.accent.primary};
    box-shadow: ${props => props.theme.shadows.lg};
  }

  svg {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  line-height: 1;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
`;

const CTASection = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xxl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryCTA = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  background: linear-gradient(135deg,
    ${props => props.theme.colors.accent.primary} 0%,
    ${props => props.theme.colors.accent.secondary} 100%
  );
  color: ${props => props.theme.colors.background.primary};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.lg};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover svg {
    transform: translateX(5px);
  }

  svg {
    transition: transform 0.3s ease;
  }
`;

const SecondaryCTA = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  border: 2px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.theme.colors.background.card};
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    usersOnline: 342,
    todaysWins: 127,
    activeParlays: 89
  });

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        usersOnline: prev.usersOnline + Math.floor(Math.random() * 5) - 2,
        todaysWins: prev.todaysWins + (Math.random() > 0.7 ? 1 : 0),
        activeParlays: prev.activeParlays + Math.floor(Math.random() * 3) - 1
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const oddsData = [
    { team: 'Lakers vs Celtics', odds: '+210', isPositive: true },
    { team: 'Chiefs -3.5', odds: '-110', isPositive: false },
    { team: 'Yankees ML', odds: '+145', isPositive: true },
    { team: 'Cowboys vs Eagles O47.5', odds: '-105', isPositive: false },
    { team: 'Warriors +7', odds: '+100', isPositive: true },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <HeroContainer
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <OddsTicker>
        <TickerContent>
          {[...oddsData, ...oddsData].map((item, index) => (
            <TickerItem key={index} isPositive={item.isPositive}>
              <TrendingUp size={14} />
              {item.team}: <strong>{item.odds}</strong>
            </TickerItem>
          ))}
        </TickerContent>
      </OddsTicker>

      <HeroContent>
        <WelcomeSection variants={itemVariants}>
          <WelcomeText>
            {user ? `Welcome back, ${user.name || user.email}!` : 'Your Winning Edge Starts Here'}
            <span>AI-Powered Betting Intelligence at Your Fingertips</span>
          </WelcomeText>
        </WelcomeSection>

        <StatsRow variants={itemVariants}>
          <StatCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Users size={24} />
            <div>
              <StatValue>{stats.usersOnline}</StatValue>
              <StatLabel>Users Online</StatLabel>
            </div>
          </StatCard>

          <StatCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Trophy size={24} />
            <div>
              <StatValue>{stats.todaysWins}</StatValue>
              <StatLabel>Wins Today</StatLabel>
            </div>
          </StatCard>

          <StatCard whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Zap size={24} />
            <div>
              <StatValue>{stats.activeParlays}</StatValue>
              <StatLabel>Active Parlays</StatLabel>
            </div>
          </StatCard>
        </StatsRow>

        <CTASection variants={itemVariants}>
          <PrimaryCTA
            onClick={() => navigate('/parlay')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Build Your Parlay
            <ArrowRight size={20} />
          </PrimaryCTA>
          <SecondaryCTA
            onClick={() => navigate('/live-sports')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Live Odds
          </SecondaryCTA>
        </CTASection>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;
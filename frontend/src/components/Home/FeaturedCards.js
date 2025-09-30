import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, Trophy, Flame, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SectionContainer = styled.section`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  background: linear-gradient(180deg,
    ${props => props.theme.colors.background.primary} 0%,
    ${props => `${props.theme.colors.background.card}10`} 100%
  );

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  margin-bottom: ${props => props.theme.spacing.xxl};
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const CardsGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.gradient};
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    border-color: ${props => props.accentColor};
    box-shadow: ${props => props.theme.shadows.lg};
    transform: translateY(-4px);

    &::before {
      transform: scaleX(1);
    }
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const CardBadge = styled.div`
  background: ${props => props.background};
  color: ${props => props.color};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.75rem;
  font-weight: 600;
`;

const CardTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const CardDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const CardStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const StatValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const CardAction = styled(motion.button)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => props.gradient};
  color: white;
  border: none;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const BetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BetItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.xs};
  background: ${props => props.theme.colors.background.hover};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 0.85rem;

  svg {
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const FeaturedCards = () => {
  const navigate = useNavigate();

  const cards = [
    {
      id: 1,
      type: 'smart-picks',
      icon: Brain,
      title: "Today's Smart Picks",
      description: 'AI-analyzed bets with the highest win probability',
      badge: { text: 'AI POWERED', background: '#4ECDC4', color: 'white' },
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      accentColor: '#667eea',
      stats: [
        { label: 'Win Rate', value: '73%' },
        { label: 'Avg Return', value: '+245' },
        { label: 'Picks Today', value: '5' }
      ],
      action: 'View Smart Picks'
    },
    {
      id: 2,
      type: 'trending',
      icon: TrendingUp,
      title: 'Trending Parlays',
      description: 'Most popular parlays from our community',
      badge: { text: 'HOT', background: '#FF6B6B', color: 'white' },
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      accentColor: '#f5576c',
      bets: [
        'Lakers ML + Over 220.5',
        'Chiefs -3.5 + Mahomes 2+ TDs',
        'Yankees ML + Judge HR'
      ],
      action: 'See Trending'
    },
    {
      id: 3,
      type: 'big-wins',
      icon: Trophy,
      title: 'Recent Big Wins',
      description: 'Celebrating our community winners',
      badge: { text: '$127K WON TODAY', background: '#4ECDC4', color: 'white' },
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      accentColor: '#fa709a',
      stats: [
        { label: 'Biggest Win', value: '$12,450' },
        { label: 'Winners Today', value: '89' },
        { label: 'Total Payout', value: '$127K' }
      ],
      action: 'View Winners'
    },
    {
      id: 4,
      type: 'hot-streaks',
      icon: Flame,
      title: 'Hot Streaks',
      description: 'Teams and players on fire right now',
      badge: { text: 'UPDATED LIVE', background: '#FFD93D', color: '#333' },
      gradient: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
      accentColor: '#FF512F',
      bets: [
        'Celtics: 8 game win streak',
        'Ohtani: 5 game hit streak',
        'McDavid: 7 game point streak'
      ],
      action: 'Track Streaks'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' }
    }
  };

  const handleCardClick = (type) => {
    switch (type) {
      case 'smart-picks':
        navigate('/projections');
        break;
      case 'trending':
      case 'hot-streaks':
        navigate('/live-sports');
        break;
      case 'big-wins':
        navigate('/parlay');
        break;
      default:
        navigate('/');
    }
  };

  return (
    <SectionContainer>
      <SectionTitle>Discover Winning Opportunities</SectionTitle>
      <SectionSubtitle>
        Expert insights, trending bets, and real-time analytics to power your decisions
      </SectionSubtitle>

      <CardsGrid
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {cards.map((card) => (
          <FeatureCard
            key={card.id}
            variants={cardVariants}
            whileHover={{ y: -4 }}
            onClick={() => handleCardClick(card.type)}
            gradient={card.gradient}
            accentColor={card.accentColor}
          >
            <CardHeader>
              <CardIcon gradient={card.gradient}>
                <card.icon size={24} />
              </CardIcon>
              <CardBadge
                background={card.badge.background}
                color={card.badge.color}
              >
                {card.badge.text}
              </CardBadge>
            </CardHeader>

            <CardTitle>{card.title}</CardTitle>
            <CardDescription>{card.description}</CardDescription>

            {card.stats && (
              <CardStats>
                {card.stats.map((stat, index) => (
                  <StatItem key={index}>
                    <StatLabel>{stat.label}</StatLabel>
                    <StatValue>{stat.value}</StatValue>
                  </StatItem>
                ))}
              </CardStats>
            )}

            {card.bets && (
              <BetList>
                {card.bets.map((bet, index) => (
                  <BetItem key={index}>
                    <Star size={14} />
                    {bet}
                  </BetItem>
                ))}
              </BetList>
            )}

            <CardAction
              gradient={card.gradient}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {card.action}
              <ChevronRight size={16} />
            </CardAction>
          </FeatureCard>
        ))}
      </CardsGrid>
    </SectionContainer>
  );
};

export default FeaturedCards;
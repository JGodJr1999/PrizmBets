import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Layers,
  Zap,
  FileText,
  Activity,
  Gift,
  BarChart3
} from 'lucide-react';

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const SectionContainer = styled.section`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  position: relative;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.md};
  }
`;

const DashboardGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.md};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${props => props.theme.spacing.sm};
  }
`;

const DashboardTile = styled(motion.button)`
  aspect-ratio: 1;
  background: ${props => props.gradient || props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -1000px;
    width: 1000px;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
    transition: left 0.5s ease;
  }

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: ${props => props.theme.shadows.xl};
    border-color: ${props => props.accentColor || props.theme.colors.accent.primary};

    &::before {
      left: 1000px;
    }

    svg {
      animation: ${float} 1s ease-in-out infinite;
    }
  }

  ${props => props.isPrimary && `
    grid-column: span 2;
    grid-row: span 1;
    background: linear-gradient(135deg,
      ${props.theme.colors.accent.primary} 0%,
      ${props.theme.colors.accent.secondary} 100%
    );
    border: none;
    color: ${props.theme.colors.background.primary};

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        45deg,
        transparent 30%,
        rgba(255, 255, 255, 0.1) 50%,
        transparent 70%
      );
      background-size: 200% 200%;
      animation: ${shimmer} 3s linear infinite;
    }
  `}

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.lg};
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.md};
    gap: ${props => props.theme.spacing.sm};
  }
`;

const TileIcon = styled.div`
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.background || 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.color || props.theme.colors.text.primary};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 40px;
    height: 40px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const TileTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.color || props.theme.colors.text.primary};
  text-align: center;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.95rem;
  }
`;

const TileSubtitle = styled.p`
  font-size: 0.85rem;
  color: ${props => props.color || props.theme.colors.text.secondary};
  text-align: center;
  margin-top: -${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.75rem;
    display: none;
  }
`;

const TileBadge = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.status.error};
  color: white;
  padding: 2px 8px;
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.7rem;
  font-weight: 600;
`;

const QuickAccessDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const tiles = [
    {
      id: 'build-parlay',
      title: 'Build Parlay',
      subtitle: 'Create your winning combo',
      icon: Layers,
      path: '/parlay',
      isPrimary: true,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      iconBg: 'rgba(255, 255, 255, 0.2)',
      color: 'white'
    },
    {
      id: 'quick-bet',
      title: 'Quick Bet',
      subtitle: 'Instant action',
      icon: Zap,
      path: '/parlay',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      iconBg: 'rgba(255, 255, 255, 0.15)',
      color: 'white'
    },
    {
      id: 'my-bets',
      title: 'My Bets',
      subtitle: 'Track your plays',
      icon: FileText,
      path: user ? '/dashboard' : '/login',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      iconBg: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
      badge: user ? null : 'Login'
    },
    {
      id: 'live-games',
      title: 'Live Games',
      subtitle: 'Real-time action',
      icon: Activity,
      path: '/live-scores',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      iconBg: 'rgba(255, 255, 255, 0.15)',
      color: 'white'
    },
    {
      id: 'promotions',
      title: 'Promotions',
      subtitle: 'Special offers',
      icon: Gift,
      path: '/subscription',
      gradient: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)',
      iconBg: 'rgba(255, 255, 255, 0.15)',
      color: 'white',
      badge: 'New'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Smart insights',
      icon: BarChart3,
      path: '/betting-hub',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      iconBg: 'rgba(255, 255, 255, 0.15)',
      color: 'white'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const tileVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 200,
        damping: 20
      }
    }
  };

  return (
    <SectionContainer>
      <DashboardGrid
        as={motion.div}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tiles.map((tile) => (
          <DashboardTile
            key={tile.id}
            onClick={() => navigate(tile.path)}
            variants={tileVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            isPrimary={tile.isPrimary}
            gradient={tile.gradient}
            accentColor={tile.color}
          >
            {tile.badge && <TileBadge>{tile.badge}</TileBadge>}
            <TileIcon background={tile.iconBg} color={tile.color}>
              <tile.icon size={24} />
            </TileIcon>
            <TileTitle color={tile.color}>{tile.title}</TileTitle>
            {tile.subtitle && (
              <TileSubtitle color={tile.color}>{tile.subtitle}</TileSubtitle>
            )}
          </DashboardTile>
        ))}
      </DashboardGrid>
    </SectionContainer>
  );
};

export default QuickAccessDashboard;
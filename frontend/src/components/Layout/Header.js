import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, User, Menu, X, Trophy, Star, Crown, DollarSign, Home, Lock } from 'lucide-react';
// Logo temporarily removed - new logo coming soon
// import prizmLogo from '../../assets/images/prizm-logo.png';
import UserColumnMenu from './UserColumnMenu';
import { useUsageTracking } from '../../hooks/useUsageTracking';

const HeaderContainer = styled.header`
  background: ${props => props.theme.colors.background.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const HeaderContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  min-height: 60px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: clamp(1.1rem, 2.5vw, 1.5rem);
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }

  @media (max-width: 968px) {
    font-size: 1.3rem;
  }
`;

// Logo image component temporarily removed
/* const LogoImage = styled.img`
  width: clamp(32px, 4vw, 40px);
  height: clamp(32px, 4vw, 40px);
  object-fit: contain;
  filter: brightness(1.1);

  @media (max-width: 968px) {
    width: 34px;
    height: 34px;
  }
`; */

const LogoText = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 900;
  letter-spacing: -0.5px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  flex: 1;
  justify-content: center;
  gap: clamp(0.5rem, 2vw, 1.5rem);
  margin: 0 2rem;

  @media (max-width: 1400px) {
    gap: clamp(0.25rem, 1.5vw, 1rem);
    margin: 0 1rem;
  }

  @media (max-width: 1200px) {
    gap: clamp(0.25rem, 1vw, 0.75rem);
    margin: 0 0.5rem;
  }

  @media (max-width: 968px) {
    display: ${props => props.isOpen ? 'flex' : 'none'};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${props => props.theme.colors.background.primary};
    border-top: 1px solid ${props => props.theme.colors.border.primary};
    flex-direction: column;
    gap: 0;
    padding: ${props => props.theme.spacing.md} 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    margin: 0;
    z-index: 999;
    max-height: 80vh;
    overflow-y: auto;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.background.hover};
  }

  @media (max-width: 968px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const NavItem = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-size: clamp(0.75rem, 1.2vw, 0.9rem);
  font-weight: 500;
  cursor: pointer;
  padding: clamp(0.4rem, 1vw, 0.6rem) clamp(0.5rem, 1.2vw, 0.8rem);
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
  min-width: fit-content;

  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
    transform: translateY(-1px);
  }

  ${props => props.active && `
    background: ${props.theme.colors.accent.primary}20;

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: ${props.theme.colors.accent.primary};
      border-radius: 1px;
    }
  `}

  svg {
    width: clamp(14px, 1.5vw, 16px);
    height: clamp(14px, 1.5vw, 16px);
    flex-shrink: 0;
  }

  @media (max-width: 1200px) {
    font-size: 0.8rem;
    padding: 0.5rem 0.6rem;
    gap: 0.25rem;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  @media (max-width: 968px) {
    width: 100%;
    justify-content: flex-start;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: 1rem;
    border-radius: 0;
    gap: 0.5rem;

    &::after {
      display: none;
    }

    ${props => props.active && `
      background: ${props.theme.colors.accent.primary}10;
      border-left: 3px solid ${props.theme.colors.accent.primary};
    `}

    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ComingSoonNavItem = styled.div`
  background: none;
  border: none;
  color: #ff8c42;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: help;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  position: relative;
  white-space: nowrap;
  opacity: 0.8;
  
  &:hover {
    background: rgba(255, 140, 66, 0.1);
    opacity: 1;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    font-size: 0.85rem;
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    
    svg {
      width: 14px;
      height: 14px;
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: flex-start;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-size: 1rem;
    border-radius: 0;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ComingSoonBadge = styled.span`
  background: #ff8c42;
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: ${props => props.theme.spacing.xs};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
`;

const UserMenu = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    flex-direction: column;
    gap: ${props => props.theme.spacing.xs};
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    border-top: 1px solid ${props => props.theme.colors.border.primary};
    margin-top: ${props => props.theme.spacing.sm};
  }
`;

const UserInfo = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${props => props.theme.colors.background.card};
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid ${props => props.theme.colors.border.primary};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    border-color: ${props => props.theme.colors.border.secondary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
    padding: ${props => props.theme.spacing.md};
    font-size: 1rem;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.muted};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${props => props.theme.colors.accent.secondary};
    background: ${props => props.theme.colors.accent.secondary}20;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
    padding: ${props => props.theme.spacing.md};
    border: 1px solid ${props => props.theme.colors.accent.secondary};
    border-radius: ${props => props.theme.borderRadius.md};
    color: ${props => props.theme.colors.accent.secondary};
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
    
    &:hover {
      background: ${props => props.theme.colors.accent.secondary}10;
    }
  }
`;

const BetaTag = styled.span`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: ${props => props.theme.spacing.xs};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
`;

const CrownIcon = styled.span`
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #ffd700;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);

  &:hover {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.2));
    border: 1px solid rgba(255, 215, 0, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(255, 215, 0, 0.2);
  }

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    font-size: 18px;
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  }

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    width: 100%;
    justify-content: center;
    padding: ${props => props.theme.spacing.md};
    font-size: 20px;
  }
`;

const Header = ({ user = null, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isFreeTier, isMasterAdmin } = useUsageTracking();

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleLogoClick = () => {
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo onClick={handleLogoClick}>
          {/* Logo image temporarily removed - new logo coming soon */}
          <LogoText>
            <span>Prizm</span>
            <span>Bets</span>
          </LogoText>
          <BetaTag>BETA</BetaTag>
        </Logo>
        
        <MobileMenuButton onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </MobileMenuButton>
        
        <Nav isOpen={isMobileMenuOpen}>
          <NavItem
            active={isActive('/')}
            onClick={() => handleNavigation('/')}
          >
            <Home size={16} />
            Home
          </NavItem>

          <NavItem
            active={isActive('/live-sports')}
            onClick={() => handleNavigation('/live-sports')}
          >
            <DollarSign size={16} />
            Live Odds & Parlays
          </NavItem>

          <NavItem
            active={isActive('/live-scores')}
            onClick={() => handleNavigation('/live-scores')}
          >
            <Trophy size={16} />
            Live Scores
          </NavItem>



          <NavItem
            active={isActive('/projections')}
            onClick={() => handleNavigation('/projections')}
            style={{ position: 'relative' }}
          >
            <BarChart3 size={16} />
            AI's Top 5
            {isFreeTier && !isMasterAdmin && (
              <Lock
                size={12}
                style={{
                  marginLeft: '4px',
                  color: '#ff8c42',
                  opacity: 0.8
                }}
              />
            )}
          </NavItem>
          
          <NavItem
            active={isActive('/pick-em')}
            onClick={() => handleNavigation('/pick-em')}
          >
            <Trophy size={16} />
            Pick'em Pools
          </NavItem>

          <NavItem
            active={isActive('/fantasy-coming-soon')}
            onClick={() => handleNavigation('/fantasy-coming-soon')}
            style={{ position: 'relative' }}
          >
            <Star size={16} />
            NFL Fantasy
            <ComingSoonBadge>2026</ComingSoonBadge>
          </NavItem>

          {/* Master Admin Crown Icon between NFL Fantasy and User */}
          {isMasterAdmin && (
            <CrownIcon
              onClick={() => handleNavigation('/admin-management')}
              title="Master Admin Dashboard"
            >
              👑
            </CrownIcon>
          )}

          {user?.role === 'admin' && (
            <NavItem
              active={isActive('/admin')}
              onClick={() => handleNavigation('/admin')}
            >
              <Crown size={16} />
              Admin
            </NavItem>
          )}
          
          {user ? (
            <UserColumnMenu
              user={user}
              onNavigate={handleNavigation}
              onLogout={onLogout}
            />
          ) : (
            <NavItem
              active={isActive('/login')}
              onClick={() => handleNavigation('/login')}
            >
              <User size={16} />
              Sign In
            </NavItem>
          )}
        </Nav>
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header;
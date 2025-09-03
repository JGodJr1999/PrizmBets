import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { Brain, TrendingUp, BarChart3, User, LogOut, Calendar, CreditCard, Menu, X, Trophy, Star, Upload, BookOpen, Lightbulb, Crown, Activity, Target, DollarSign } from 'lucide-react';
import UserColumnMenu from './UserColumnMenu';

const HeaderContainer = styled.header`
  background: ${props => props.theme.colors.background.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.5rem;
  font-weight: 900;
  cursor: pointer;
  white-space: nowrap;
  
  &:hover {
    opacity: 0.8;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.2rem;
    
    svg {
      width: 24px;
      height: 24px;
    }
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 1rem;
    gap: ${props => props.theme.spacing.xs};
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

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
  gap: ${props => props.theme.spacing.lg};
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  flex-wrap: nowrap;
  
  /* Hide scrollbar but allow scrolling */
  scrollbar-width: none;
  -ms-overflow-style: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    gap: ${props => props.theme.spacing.md};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
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
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow-x: visible;
    overflow-y: visible;
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
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const NavItem = styled.button`
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  position: relative;
  white-space: nowrap;
  
  &:hover {
    color: ${props => props.theme.colors.text.primary};
    background: ${props => props.theme.colors.background.hover};
  }
  
  ${props => props.active && `
    background: ${props.theme.colors.accent.primary}20;
    
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      height: 2px;
      background: ${props.theme.colors.accent.primary};
    }
  `}
  
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

const Header = ({ user = null, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false); // Close mobile menu after navigation
  };

  const handleLogoClick = () => {
    navigate('/parlay');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo onClick={handleLogoClick}>
          <Brain size={28} />
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
            active={isActive('/live-sports')}
            onClick={() => handleNavigation('/live-sports')}
          >
            <DollarSign size={16} />
            Live Odds
          </NavItem>
          
          <NavItem 
            active={isActive('/live-scores')}
            onClick={() => handleNavigation('/live-scores')}
          >
            <Trophy size={16} />
            Live Sports
          </NavItem>
          
          <NavItem 
            active={isActive('/projections')}
            onClick={() => handleNavigation('/projections')}
          >
            <BarChart3 size={16} />
            AI's Top 5
          </NavItem>
          
          <NavItem 
            active={isActive('/betting-hub')}
            onClick={() => handleNavigation('/betting-hub')}
          >
            <Target size={16} />
            Betting Hub
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
          
          <NavItem 
            active={isActive('/subscription')}
            onClick={() => handleNavigation('/subscription')}
          >
            <CreditCard size={16} />
            Subscription
          </NavItem>
          
          {user && (
            <>
              <NavItem 
                active={isActive('/dashboard')}
                onClick={() => handleNavigation('/dashboard')}
              >
                <Brain size={16} />
                Dashboard
              </NavItem>
              <NavItem 
                active={isActive('/history')}
                onClick={() => handleNavigation('/history')}
              >
                <Calendar size={16} />
                History
              </NavItem>
              {user.role === 'admin' && (
                <NavItem 
                  active={isActive('/admin')}
                  onClick={() => handleNavigation('/admin')}
                >
                  <Crown size={16} />
                  Admin
                </NavItem>
              )}
            </>
          )}
          
          {user ? (
            <>
              <NavItem 
                active={isActive('/account')}
                onClick={() => handleNavigation('/account')}
              >
                <User size={16} />
                Account
              </NavItem>
              <UserColumnMenu 
                user={user}
                onNavigate={handleNavigation}
                onLogout={onLogout}
              />
            </>
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
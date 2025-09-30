import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  LogOut,
  Settings,
  Upload,
  BarChart3,
  History,
  ChevronDown
} from 'lucide-react';

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const UserButton = styled(motion.button)`
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.lg};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-weight: 500;
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.accent.primary};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
    font-size: 0.9rem;
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const UserName = styled.span`
  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    display: none;
  }
`;

const ChevronIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    display: none;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.lg};
  min-width: 280px;
  z-index: 1000;
  overflow: hidden;
  backdrop-filter: blur(10px);
  margin-top: ${props => props.theme.spacing.sm};
`;

const MenuHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  background: ${props => props.theme.colors.gradient.card};
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const UserAvatar = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradient.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.background.primary};
  font-weight: 600;
  font-size: 1.2rem;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserDisplayName = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const UserEmail = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
`;

const MenuSection = styled.div`
  padding: ${props => props.theme.spacing.md};
`;

const SectionTitle = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${props => props.theme.spacing.sm};
  padding: 0 ${props => props.theme.spacing.sm};
`;

const MenuItem = styled(motion.button)`
  width: 100%;
  background: none;
  border: none;
  color: ${props => props.theme.colors.text.primary};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  text-align: left;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${props => props.theme.colors.background.hover};
    color: ${props => props.theme.colors.accent.primary};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MenuItemIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
  width: 20px;
`;

const MenuItemContent = styled.div`
  flex: 1;
`;

const MenuItemLabel = styled.div`
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const MenuItemDescription = styled.div`
  font-size: 0.8rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.3;
`;

const NotificationBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: ${props => props.theme.colors.accent.secondary};
  border-radius: 50%;
  border: 2px solid ${props => props.theme.colors.background.primary};
`;

const UserColumnMenu = ({ user, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (path) => {
    setIsOpen(false);
    onNavigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const menuVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeIn"
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const chevronVariants = {
    closed: { rotate: 0 },
    open: { rotate: 180 }
  };

  if (!user) return null;

  return (
    <UserMenuContainer ref={menuRef}>
      <UserButton
        onClick={toggleMenu}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <User size={18} />
        <UserName>{user.name || 'User'}</UserName>
        <ChevronIcon
          variants={chevronVariants}
          animate={isOpen ? 'open' : 'closed'}
        >
          <ChevronDown size={16} />
        </ChevronIcon>
        {/* {hasNotifications && <NotificationBadge />} */}
      </UserButton>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenu
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <MenuHeader>
              <UserInfo>
                <UserAvatar>
                  {getUserInitials(user.name)}
                </UserAvatar>
                <UserDetails>
                  <UserDisplayName>{user.name || 'User'}</UserDisplayName>
                  <UserEmail>{user.email || 'user@example.com'}</UserEmail>
                </UserDetails>
              </UserInfo>
            </MenuHeader>

            <MenuSection>
              <SectionTitle>Account</SectionTitle>
              <MenuItem
                variants={itemVariants}
                onClick={() => handleMenuItemClick('/profile')}
                whileHover={{ x: 4 }}
              >
                <MenuItemIcon>
                  <Settings size={18} />
                </MenuItemIcon>
                <MenuItemContent>
                  <MenuItemLabel>Profile Settings</MenuItemLabel>
                  <MenuItemDescription>Manage your account and preferences</MenuItemDescription>
                </MenuItemContent>
              </MenuItem>
            </MenuSection>

            <MenuSection>
              <SectionTitle>Betting Tools</SectionTitle>
              <MenuItem
                variants={itemVariants}
                onClick={() => handleMenuItemClick('/betting-data')}
                whileHover={{ x: 4 }}
              >
                <MenuItemIcon>
                  <Upload size={18} />
                </MenuItemIcon>
                <MenuItemContent>
                  <MenuItemLabel>Upload Data</MenuItemLabel>
                  <MenuItemDescription>Import betting data from sportsbooks</MenuItemDescription>
                </MenuItemContent>
              </MenuItem>

              <MenuItem
                variants={itemVariants}
                onClick={() => handleMenuItemClick('/dashboard')}
                whileHover={{ x: 4 }}
              >
                <MenuItemIcon>
                  <BarChart3 size={18} />
                </MenuItemIcon>
                <MenuItemContent>
                  <MenuItemLabel>Dashboard</MenuItemLabel>
                  <MenuItemDescription>View your betting analytics</MenuItemDescription>
                </MenuItemContent>
              </MenuItem>

              <MenuItem
                variants={itemVariants}
                onClick={() => handleMenuItemClick('/history')}
                whileHover={{ x: 4 }}
              >
                <MenuItemIcon>
                  <History size={18} />
                </MenuItemIcon>
                <MenuItemContent>
                  <MenuItemLabel>Betting History</MenuItemLabel>
                  <MenuItemDescription>Review your past bets and results</MenuItemDescription>
                </MenuItemContent>
              </MenuItem>
            </MenuSection>

            <MenuSection>
              <MenuItem
                variants={itemVariants}
                onClick={handleLogout}
                whileHover={{ x: 4 }}
                style={{ color: '#ff6b6b' }}
              >
                <MenuItemIcon>
                  <LogOut size={18} />
                </MenuItemIcon>
                <MenuItemContent>
                  <MenuItemLabel>Sign Out</MenuItemLabel>
                  <MenuItemDescription>Sign out of your account</MenuItemDescription>
                </MenuItemContent>
              </MenuItem>
            </MenuSection>
          </DropdownMenu>
        )}
      </AnimatePresence>
    </UserMenuContainer>
  );
};

export default UserColumnMenu;
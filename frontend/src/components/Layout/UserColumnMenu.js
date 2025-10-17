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
  ChevronDown,
  Target,
  Bell,
  Users,
  AlertTriangle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
  min-width: 320px;
  max-height: calc(100vh - 120px);
  z-index: 1000;
  overflow-y: auto;
  overflow-x: hidden;
  backdrop-filter: blur(10px);
  margin-top: ${props => props.theme.spacing.sm};
  scroll-behavior: smooth;

  /* Ensure dropdown stays on screen */
  @media (max-height: 600px) {
    max-height: calc(100vh - 80px);
  }

  @media (max-height: 500px) {
    max-height: calc(100vh - 60px);
  }

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border.primary};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.text.secondary};
  }

  /* Mobile responsive adjustments */
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    max-height: calc(100vh - 100px);
    max-width: calc(100vw - 32px);
    min-width: 300px;
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    max-height: calc(100vh - 80px);
    max-width: calc(100vw - 16px);
    min-width: 280px;
    right: -${props => props.theme.spacing.sm};
  }

  /* Very small screens */
  @media (max-width: 350px) {
    right: -${props => props.theme.spacing.xs};
    min-width: 260px;
  }
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
  overflow: hidden;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
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
  ${props => props.withBorder && `
    border-top: 1px solid ${props.theme.colors.border.primary};
  `}
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

  &.danger {
    color: #ff6b6b;

    &:hover {
      background: rgba(255, 107, 107, 0.1);
      color: #ff5252;
    }
  }

  &.switch-user {
    color: ${props => props.theme.colors.text.primary};

    &:hover {
      background: ${props => props.theme.colors.background.hover};
      color: ${props => props.theme.colors.accent.primary};
    }
  }
`;

const MenuItemIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  display: flex;
  align-items: center;
  width: 20px;

  .danger & {
    color: #ff6b6b;
  }
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

// Confirmation Dialog Components
const ConfirmationOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ConfirmationDialog = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  box-shadow: ${props => props.theme.shadows.xl};
  padding: ${props => props.theme.spacing.xl};
  max-width: 400px;
  width: 90%;
  margin: ${props => props.theme.spacing.lg};
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const DialogIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.danger ? 'rgba(255, 107, 107, 0.1)' : 'rgba(59, 130, 246, 0.1)'};
  color: ${props => props.danger ? '#ff6b6b' : '#3b82f6'};
`;

const DialogContent = styled.div`
  flex: 1;
`;

const DialogTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const DialogMessage = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.4;
  margin: 0;
`;

const DialogActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.xl};
`;

const DialogButton = styled.button`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;

  &.cancel {
    background: transparent;
    color: ${props => props.theme.colors.text.secondary};
    border-color: ${props => props.theme.colors.border.primary};

    &:hover {
      background: ${props => props.theme.colors.background.hover};
      color: ${props => props.theme.colors.text.primary};
    }
  }

  &.confirm {
    background: ${props => props.danger ? '#ff6b6b' : props.theme.colors.accent.primary};
    color: white;

    &:hover {
      background: ${props => props.danger ? '#ff5252' : props.theme.colors.accent.secondary};
    }
  }
`;

const UserColumnMenu = ({ user, onNavigate, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

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
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      setShowConfirmation(null);

      // Clear any parlay data in localStorage
      const parlayKeys = Object.keys(localStorage).filter(key =>
        key.includes('parlay') || key.includes('bet') || key.includes('slip')
      );
      parlayKeys.forEach(key => localStorage.removeItem(key));

      // Clear session-specific data
      sessionStorage.clear();

      // Use AuthContext logout function
      await logout();

      // Navigate to login page
      navigate('/login');

      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  const handleSwitchUser = async () => {
    try {
      setIsOpen(false);
      setShowConfirmation(null);

      // Save current location for return after switch
      const currentPath = window.location.pathname + window.location.search;
      sessionStorage.setItem('returnUrl', currentPath);

      // Add recent account to list
      const recentAccounts = JSON.parse(localStorage.getItem('recentAccounts') || '[]');
      const userEmail = user?.email;

      if (userEmail && !recentAccounts.includes(userEmail)) {
        recentAccounts.unshift(userEmail);
        // Keep only last 5 accounts
        localStorage.setItem('recentAccounts', JSON.stringify(recentAccounts.slice(0, 5)));
      }

      // Clear user-specific data but keep returnUrl and recentAccounts
      const returnUrl = sessionStorage.getItem('returnUrl');
      const accounts = localStorage.getItem('recentAccounts');

      localStorage.clear();
      sessionStorage.clear();

      if (returnUrl) sessionStorage.setItem('returnUrl', returnUrl);
      if (accounts) localStorage.setItem('recentAccounts', accounts);

      // Use AuthContext logout function
      await logout();

      // Navigate to login page with switch indicator
      navigate('/login', { state: { switching: true, returnUrl: currentPath } });

      toast.info('Please sign in with a different account');
    } catch (error) {
      console.error('Switch user error:', error);
      toast.error('Failed to switch user. Please try again.');
    }
  };

  const showLogoutConfirmation = () => {
    setShowConfirmation('logout');
  };

  const showSwitchUserConfirmation = () => {
    setShowConfirmation('switchUser');
  };

  const hideConfirmation = () => {
    setShowConfirmation(null);
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (user) => {
    if (!user) return 'User';

    // ONLY use displayName field - never use fullName
    if (user.displayName) return user.displayName;

    // Fallback to email prefix if no displayName is set
    if (user.email) {
      return user.email.split('@')[0];
    }

    return 'User';
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

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2
      }
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  if (!user) return null;

  return (
    <>
      <UserMenuContainer ref={menuRef}>
        <UserButton
          onClick={toggleMenu}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <User size={18} />
          <UserName>{getDisplayName(user)}</UserName>
          <ChevronIcon
            variants={chevronVariants}
            animate={isOpen ? 'open' : 'closed'}
          >
            <ChevronDown size={16} />
          </ChevronIcon>
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
                    {user?.photoURL ? (
                      <AvatarImage src={user.photoURL} alt="Profile" />
                    ) : (
                      getUserInitials(getDisplayName(user))
                    )}
                  </UserAvatar>
                  <UserDetails>
                    <UserDisplayName>{getDisplayName(user)}</UserDisplayName>
                    <UserEmail>{user?.email || 'user@example.com'}</UserEmail>
                  </UserDetails>
                </UserInfo>
              </MenuHeader>

              <MenuSection>
                <SectionTitle>Account</SectionTitle>
                <MenuItem
                  variants={itemVariants}
                  onClick={() => handleMenuItemClick('/account')}
                  whileHover={{ x: 4 }}
                >
                  <MenuItemIcon>
                    <User size={18} />
                  </MenuItemIcon>
                  <MenuItemContent>
                    <MenuItemLabel>Account Settings</MenuItemLabel>
                    <MenuItemDescription>Manage your profile and preferences</MenuItemDescription>
                  </MenuItemContent>
                </MenuItem>

              </MenuSection>

              <MenuSection>
                <SectionTitle>Betting Tools</SectionTitle>
                <MenuItem
                  variants={itemVariants}
                  onClick={() => handleMenuItemClick('/betting-hub')}
                  whileHover={{ x: 4 }}
                >
                  <MenuItemIcon>
                    <Target size={18} />
                  </MenuItemIcon>
                  <MenuItemContent>
                    <MenuItemLabel>Betting Hub</MenuItemLabel>
                    <MenuItemDescription>Advanced betting tools and insights</MenuItemDescription>
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


              <MenuSection withBorder>
                <MenuItem
                  variants={itemVariants}
                  onClick={showSwitchUserConfirmation}
                  whileHover={{ x: 4 }}
                  className="switch-user"
                >
                  <MenuItemIcon>
                    <Users size={18} />
                  </MenuItemIcon>
                  <MenuItemContent>
                    <MenuItemLabel>Switch User</MenuItemLabel>
                    <MenuItemDescription>Sign in with a different account</MenuItemDescription>
                  </MenuItemContent>
                </MenuItem>

                <MenuItem
                  variants={itemVariants}
                  onClick={showLogoutConfirmation}
                  whileHover={{ x: 4 }}
                  className="danger"
                >
                  <MenuItemIcon>
                    <LogOut size={18} />
                  </MenuItemIcon>
                  <MenuItemContent>
                    <MenuItemLabel>Log Out</MenuItemLabel>
                    <MenuItemDescription>Sign out of your account</MenuItemDescription>
                  </MenuItemContent>
                </MenuItem>
              </MenuSection>
            </DropdownMenu>
          )}
        </AnimatePresence>
      </UserMenuContainer>

      {/* Confirmation Dialogs */}
      <AnimatePresence>
        {showConfirmation && (
          <ConfirmationOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={hideConfirmation}
          >
            <ConfirmationDialog
              variants={dialogVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {showConfirmation === 'logout' && (
                <>
                  <DialogHeader>
                    <DialogIcon danger>
                      <AlertTriangle size={24} />
                    </DialogIcon>
                    <DialogContent>
                      <DialogTitle>Confirm Logout</DialogTitle>
                      <DialogMessage>
                        Are you sure you want to log out? Any unsaved changes will be lost.
                      </DialogMessage>
                    </DialogContent>
                  </DialogHeader>
                  <DialogActions>
                    <DialogButton className="cancel" onClick={hideConfirmation}>
                      Cancel
                    </DialogButton>
                    <DialogButton className="confirm" danger onClick={handleLogout}>
                      Log Out
                    </DialogButton>
                  </DialogActions>
                </>
              )}

              {showConfirmation === 'switchUser' && (
                <>
                  <DialogHeader>
                    <DialogIcon>
                      <Users size={24} />
                    </DialogIcon>
                    <DialogContent>
                      <DialogTitle>Switch User Account</DialogTitle>
                      <DialogMessage>
                        You will be signed out and redirected to the sign-in page. You can then sign in with a different account and will be returned to this page.
                      </DialogMessage>
                    </DialogContent>
                  </DialogHeader>
                  <DialogActions>
                    <DialogButton className="cancel" onClick={hideConfirmation}>
                      Cancel
                    </DialogButton>
                    <DialogButton className="confirm" onClick={handleSwitchUser}>
                      Switch User
                    </DialogButton>
                  </DialogActions>
                </>
              )}
            </ConfirmationDialog>
          </ConfirmationOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default UserColumnMenu;
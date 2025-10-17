import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';

// Main container matching app's design exactly
const AuthContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  display: flex;
  flex-direction: column;
`;

// Header matching the main app header exactly
const AuthHeader = styled.header`
  background: ${props => props.theme.colors.background.primary};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
`;

const HeaderContent = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.5rem;
  font-weight: 900;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
    transform: scale(1.02);
  }
`;

const LogoText = styled.span`
  display: flex;
  align-items: center;
  gap: 2px;
  font-weight: 900;
  letter-spacing: -0.5px;
`;

// Main content area
const MainContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.xl};
`;

// Auth card matching app's card styling exactly
const AuthCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border.primary};
  padding: ${props => props.theme.spacing.xxl};
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    padding: ${props => props.theme.spacing.xl};
    margin: ${props => props.theme.spacing.md};
  }
`;

// Welcome section in the card
const WelcomeSection = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const WelcomeTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};
`;

const WelcomeIcon = styled.div`
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary} 0%, ${props => props.theme.colors.accent.primary}CC 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.background.primary};
  box-shadow: 0 8px 32px ${props => props.theme.colors.accent.primary}40;
`;

const WelcomeSubtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
`;

// Tab container matching app's tab styling
const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
`;

const Tab = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.accent.primary : props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 3px solid ${props => props.active ? props.theme.colors.accent.primary : 'transparent'};
  transition: all 0.3s ease;
  white-space: nowrap;
  position: relative;

  &:hover {
    color: ${props => props.theme.colors.accent.primary};
    background: ${props => props.theme.colors.accent.primary}10;
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.active ?
      `linear-gradient(135deg, ${props.theme.colors.accent.primary}15 0%, transparent 100%)` :
      'transparent'
    };
    border-radius: ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0 0;
    z-index: -1;
  }
`;


const AuthScreen = () => {
  const [activeTab, setActiveTab] = useState('signin');

  return (
    <AuthContainer>
      {/* Header matching main app */}
      <AuthHeader>
        <HeaderContent>
          <Logo>
            <Brain size={28} />
            <LogoText>PrizmBets</LogoText>
          </Logo>
        </HeaderContent>
      </AuthHeader>

      {/* Main content */}
      <MainContent>
        <AuthCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Welcome section */}
          <WelcomeSection>
            <WelcomeTitle>
              <WelcomeIcon>
                <Brain size={24} />
              </WelcomeIcon>
              {activeTab === 'signin' ? 'Welcome Back' : 'Join PrizmBets'}
            </WelcomeTitle>
            <WelcomeSubtitle>
              {activeTab === 'signin'
                ? 'Sign in to access your betting dashboard'
                : 'Create your account to get started'
              }
            </WelcomeSubtitle>
          </WelcomeSection>

          {/* Tabs */}
          <TabContainer>
            <Tab
              active={activeTab === 'signin'}
              onClick={() => setActiveTab('signin')}
            >
              Sign In
            </Tab>
            <Tab
              active={activeTab === 'signup'}
              onClick={() => setActiveTab('signup')}
            >
              Sign Up
            </Tab>
          </TabContainer>

          {/* Form content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'signin' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'signin' ? 20 : -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'signin' ? <SignInForm /> : <SignUpForm />}
            </motion.div>
          </AnimatePresence>
        </AuthCard>
      </MainContent>
    </AuthContainer>
  );
};

export default AuthScreen;
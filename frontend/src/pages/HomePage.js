import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import HeroSection from '../components/Home/HeroSection';
import LiveActionSection from '../components/Home/LiveActionSection';
import FeaturedCards from '../components/Home/FeaturedCards';
import QuickAccessDashboard from '../components/Home/QuickAccessDashboard';
import SocialProofSection from '../components/Home/SocialProofSection';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  overflow-x: hidden;
  position: relative;
`;

const ScrollToTopButton = styled(motion.button)`
  position: fixed;
  bottom: ${props => props.theme.spacing.xl};
  right: ${props => props.theme.spacing.xl};
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg,
    ${props => props.theme.colors.accent.primary} 0%,
    ${props => props.theme.colors.accent.secondary} 100%
  );
  border: none;
  color: ${props => props.theme.colors.background.primary};
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.xl};
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.1);
  }

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    bottom: ${props => props.theme.spacing.lg};
    right: ${props => props.theme.spacing.lg};
    width: 48px;
    height: 48px;
  }
`;

const HomePage = () => {
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  return (
    <PageContainer
      as={motion.div}
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Hero Section with personalized welcome and live odds ticker */}
      <HeroSection />

      {/* Quick Access Dashboard - colorful tiles for main actions */}
      <QuickAccessDashboard />

      {/* Live Action Section - real-time scores and betting opportunities */}
      <LiveActionSection />

      {/* Featured Content Cards - AI picks, trending, wins, streaks */}
      <FeaturedCards />

      {/* Social Proof Section - live feeds, leaderboard, community stats */}
      <SocialProofSection />

      {/* Scroll to Top Button */}
      <ScrollToTopButton
        onClick={scrollToTop}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: showScrollButton ? 1 : 0,
          scale: showScrollButton ? 1 : 0
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        ↑
      </ScrollToTopButton>
    </PageContainer>
  );
};

export default HomePage;
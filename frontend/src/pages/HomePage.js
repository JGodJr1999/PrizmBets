import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedHero from '../components/Animations/AnimatedHero';
import FeatureShowcase from '../components/Animations/FeatureShowcase';
import UsageTracker from '../components/Usage/UsageTracker';
import UsageDemo from '../components/Usage/UsageDemo';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const FloatingElements = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
`;

const FloatingCircle = styled(motion.div)`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.theme.colors.accent.primary}10;
  border: 1px solid ${props => props.theme.colors.accent.primary}20;
`;

const CTASection = styled(motion.section)`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  text-align: center;
  background: ${props => props.theme.colors.gradient.card};
  border-top: 1px solid ${props => props.theme.colors.border.primary};
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const CTATitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CTADescription = styled(motion.p)`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto ${props => props.theme.spacing.xl};
  line-height: 1.6;
`;

const CTAButton = styled(motion.button)`
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  font-size: 1.2rem;
  font-weight: 600;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xxl};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
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
    background: linear-gradient(
      90deg,
      transparent,
      ${props => props.theme.colors.text.primary}20,
      transparent
    );
    transition: left 0.6s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const BackToTopButton = styled(motion.button)`
  position: fixed;
  bottom: ${props => props.theme.spacing.xl};
  right: ${props => props.theme.spacing.xl};
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradient.primary};
  border: none;
  color: ${props => props.theme.colors.background.primary};
  cursor: pointer;
  box-shadow: ${props => props.theme.shadows.lg};
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
`;

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleGetStarted = () => {
    navigate('/live-sports');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  const handleSignUpClick = () => {
    navigate('/register');
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const ctaVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  const buttonHover = {
    scale: 1.05,
    y: -2,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  };

  const shimmerVariants = {
    hover: {
      backgroundPosition: ['200% 0', '-200% 0'],
      transition: {
        duration: 1.5,
        ease: "easeInOut"
      }
    }
  };

  return (
    <PageContainer>
      <FloatingElements>
        <FloatingCircle
          variants={floatingVariants}
          animate="animate"
          style={{
            width: '100px',
            height: '100px',
            top: '20%',
            left: '10%',
          }}
        />
        <FloatingCircle
          variants={floatingVariants}
          animate="animate"
          style={{
            width: '60px',
            height: '60px',
            top: '60%',
            right: '15%',
            animationDelay: '2s'
          }}
        />
        <FloatingCircle
          variants={floatingVariants}
          animate="animate"
          style={{
            width: '80px',
            height: '80px',
            bottom: '20%',
            left: '20%',
            animationDelay: '4s'
          }}
        />
      </FloatingElements>

      <AnimatedHero 
        onGetStarted={handleGetStarted}
        onLearnMore={handleLearnMore}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {isAuthenticated ? (
          <UsageTracker onUpgradeClick={handleUpgradeClick} />
        ) : (
          <UsageDemo onSignUpClick={handleSignUpClick} />
        )}
      </div>

      <div id="features">
        <FeatureShowcase />
      </div>

      <CTASection
        variants={ctaVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <CTATitle variants={ctaVariants}>
          Ready to Start Winning?
        </CTATitle>
        <CTADescription variants={ctaVariants}>
          Join thousands of smart bettors who are tracking their bets and maximizing their success. 
          Start managing your betting portfolio today.
        </CTADescription>
        <CTAButton
          onClick={handleGetStarted}
          whileHover={buttonHover}
          whileTap={{ scale: 0.95 }}
          variants={shimmerVariants}
        >
          View Live Sports →
        </CTAButton>
      </CTASection>

      <BackToTopButton
        onClick={scrollToTop}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2 }}
      >
        ↑
      </BackToTopButton>
    </PageContainer>
  );
};

export default HomePage;
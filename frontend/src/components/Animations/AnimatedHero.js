import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, Target } from 'lucide-react';

const HeroContainer = styled(motion.section)`
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const BackgroundGradient = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(
    ellipse at center,
    ${props => props.theme.colors.accent.primary}10 0%,
    transparent 50%
  );
  z-index: 0;
`;

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 900px;
`;

const MainTitle = styled(motion.h1)`
  font-size: clamp(2.5rem, 6vw, 4.5rem);
  font-weight: 800;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  line-height: 1.1;
  
  background: linear-gradient(
    135deg,
    ${props => props.theme.colors.text.primary} 0%,
    ${props => props.theme.colors.accent.primary} 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled(motion.p)`
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.xxl};
  line-height: 1.6;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAContainer = styled(motion.div)`
  display: flex;
  gap: ${props => props.theme.spacing.lg};
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const PrimaryButton = styled(motion.button)`
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  font-size: 1.1rem;
  font-weight: 600;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  border: none;
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${props => props.theme.shadows.lg};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 15px 25px rgba(255, 215, 0, 0.3);
  }
`;

const SecondaryButton = styled(motion.button)`
  background: transparent;
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  border: 2px solid ${props => props.theme.colors.border.accent};
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.background.primary};
    transform: translateY(-2px);
  }
`;

const StatsContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.xl};
  margin: ${props => props.theme.spacing.xxl} auto 0;
  max-width: 800px;
  width: 100%;
  justify-items: center;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    max-width: 300px;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    gap: ${props => props.theme.spacing.lg};
  }
`;

const StatCard = styled(motion.div)`
  text-align: center;
  padding: ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background.card}40;
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 220px;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const StatIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  justify-content: center;
`;

const StatNumber = styled(motion.div)`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const AnimatedHero = ({ onGetStarted, onLearnMore }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        duration: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const backgroundVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut"
      }
    }
  };

  const buttonHover = {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  };

  const numberCountVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 1
      }
    }
  };

  return (
    <HeroContainer
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <BackgroundGradient variants={backgroundVariants} />
      
      <ContentWrapper>
        <MainTitle variants={itemVariants}>
          Track & Analyze Your Sports Bets
        </MainTitle>
        
        <Subtitle variants={itemVariants}>
          PrizmBets helps you make smarter decisions with AI-powered analytics. 
          We are not a sportsbook and do not facilitate betting.
        </Subtitle>
        
        <CTAContainer variants={itemVariants}>
          <PrimaryButton
            onClick={onGetStarted}
            whileHover={buttonHover}
            whileTap={{ scale: 0.95 }}
          >
            Explore Live Sports
          </PrimaryButton>
          <SecondaryButton
            onClick={onLearnMore}
            whileHover={buttonHover}
            whileTap={{ scale: 0.95 }}
          >
            Learn More
          </SecondaryButton>
        </CTAContainer>
        
        <StatsContainer variants={itemVariants}>
          <StatCard whileHover={{ y: -5 }}>
            <StatIcon>
              <TrendingUp size={32} />
            </StatIcon>
            <StatNumber variants={numberCountVariants}>
              89%
            </StatNumber>
            <StatLabel>Win Rate Improvement</StatLabel>
          </StatCard>
          
          <StatCard whileHover={{ y: -5 }}>
            <StatIcon>
              <Zap size={32} />
            </StatIcon>
            <StatNumber variants={numberCountVariants}>
              2
            </StatNumber>
            <StatLabel>Seconds Analysis</StatLabel>
          </StatCard>
          
          <StatCard whileHover={{ y: -5 }}>
            <StatIcon>
              <Target size={32} />
            </StatIcon>
            <StatNumber variants={numberCountVariants}>
              95%
            </StatNumber>
            <StatLabel>Accuracy Rate</StatLabel>
          </StatCard>
        </StatsContainer>
      </ContentWrapper>
    </HeroContainer>
  );
};

export default AnimatedHero;
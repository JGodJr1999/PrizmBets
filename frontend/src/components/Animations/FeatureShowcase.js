import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import {
  Brain,
  BarChart3,
  DollarSign,
  Shield
} from 'lucide-react';

const ShowcaseContainer = styled(motion.section)`
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;
`;

const SectionTitle = styled(motion.h2)`
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const SectionSubtitle = styled(motion.p)`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.secondary};
  text-align: center;
  max-width: 600px;
  margin: 0 auto ${props => props.theme.spacing.xxl};
  line-height: 1.6;
`;

const FeaturesGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const FeatureCard = styled(motion.div)`
  background: ${props => props.theme.colors.gradient.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      ${props => props.theme.colors.accent.primary}10 0%,
      transparent 50%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const FeatureIcon = styled(motion.div)`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: center;
  
  svg {
    filter: drop-shadow(0 0 10px ${props => props.theme.colors.accent.primary}40);
  }
`;

const FeatureTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.6;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
`;

const FeatureListItem = styled.li`
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  padding-left: ${props => props.theme.spacing.lg};
  position: relative;
  
  &::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: ${props => props.theme.colors.accent.primary};
    font-weight: bold;
  }
`;

const ProcessContainer = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.xl};
  padding: ${props => props.theme.spacing.xxl};
  margin-top: ${props => props.theme.spacing.xxl};
`;

const ProcessTitle = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const ProcessSteps = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
`;

const ProcessStep = styled(motion.div)`
  text-align: center;
  position: relative;
  
  &:not(:last-child)::after {
    content: '→';
    position: absolute;
    right: -${props => props.theme.spacing.lg};
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.accent.primary};
    font-size: 1.5rem;
    font-weight: bold;
    
    @media (max-width: ${props => props.theme.breakpoints.md}) {
      display: none;
    }
  }
`;

const StepNumber = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0 auto ${props => props.theme.spacing.md};
`;

const StepTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StepDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const FeatureShowcase = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6
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

  const cardHoverVariants = {
    hover: {
      y: -10,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const iconVariants = {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const features = [
    {
      icon: Brain,
      title: "Data Upload & Import",
      description: "Upload betting data from any sportsbook to track all your bets in one centralized location.",
      features: ["Support for all major sportsbooks", "CSV/Excel file import", "Automated data processing", "Historical data integration"]
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Get comprehensive analysis of your betting performance with detailed insights and trends.",
      features: ["Win/loss tracking", "ROI calculations", "Performance trends", "Risk analysis"]
    },
    {
      icon: DollarSign,
      title: "Live Sports Data",
      description: "Access real-time sports data, odds, and statistics to make informed betting decisions.",
      features: ["Live odds comparison", "Real-time scores", "Player statistics", "Team analytics"]
    },
    {
      icon: Shield,
      title: "Portfolio Management",
      description: "Manage your entire betting portfolio with tools for tracking and optimizing your strategy.",
      features: ["Centralized tracking", "Bankroll management", "Performance monitoring", "Goal setting"]
    }
  ];

  const processSteps = [
    {
      number: 1,
      title: "Upload Your Data",
      description: "Import betting history from any sportsbook"
    },
    {
      number: 2,
      title: "Analyze Performance",
      description: "Get detailed insights and analytics on your bets"
    },
    {
      number: 3,
      title: "Track Live Sports",
      description: "Monitor real-time odds and sports data"
    },
    {
      number: 4,
      title: "Optimize Strategy",
      description: "Make data-driven betting decisions"
    }
  ];

  return (
    <ShowcaseContainer
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <SectionTitle variants={itemVariants}>
        Complete Betting Management Platform
      </SectionTitle>
      <SectionSubtitle variants={itemVariants}>
        Import, track, and analyze all your betting data from every sportsbook in one powerful platform
      </SectionSubtitle>

      <FeaturesGrid variants={containerVariants}>
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            variants={itemVariants}
            whileHover="hover"
            initial="rest"
            animate="rest"
            custom={cardHoverVariants}
          >
            <FeatureIcon
              variants={iconVariants}
              whileHover="hover"
            >
              <feature.icon size={48} />
            </FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureDescription>{feature.description}</FeatureDescription>
            <FeatureList>
              {feature.features.map((item, idx) => (
                <FeatureListItem key={idx}>{item}</FeatureListItem>
              ))}
            </FeatureList>
          </FeatureCard>
        ))}
      </FeaturesGrid>

      <ProcessContainer
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <ProcessTitle>How It Works</ProcessTitle>
        <ProcessSteps>
          {processSteps.map((step, index) => (
            <ProcessStep
              key={index}
              variants={itemVariants}
              custom={{ delay: index * 0.2 }}
            >
              <StepNumber>{step.number}</StepNumber>
              <StepTitle>{step.title}</StepTitle>
              <StepDescription>{step.description}</StepDescription>
            </ProcessStep>
          ))}
        </ProcessSteps>
      </ProcessContainer>
    </ShowcaseContainer>
  );
};

export default FeatureShowcase;
import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Star, Trophy, Target, Users, Calendar, ChevronRight, Bell, Zap, Shield, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  position: relative;
  overflow: hidden;
`;

const BackgroundGradient = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: radial-gradient(circle at top center, rgba(255, 140, 66, 0.1) 0%, transparent 70%);
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  z-index: 1;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const HeroSection = styled.section`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} 0;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const IconContainer = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #ff8c42, #ff6b1a);
  border-radius: ${props => props.theme.borderRadius.full};
  margin-bottom: ${props => props.theme.spacing.xl};
  animation: ${pulse} 2s ease-in-out infinite;
  box-shadow: 0 10px 30px rgba(255, 140, 66, 0.3);
  
  svg {
    width: 60px;
    height: 60px;
    color: white;
  }
`;

const ComingSoonBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: rgba(255, 140, 66, 0.2);
  color: #ff8c42;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.full};
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.lg};
  border: 1px solid rgba(255, 140, 66, 0.3);
`;

const Title = styled.h1`
  font-size: 3.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.4rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 700px;
  margin: 0 auto ${props => props.theme.spacing.xxl};
  line-height: 1.6;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.2rem;
  }
`;

const FeaturesSection = styled.section`
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1.6rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    gap: ${props => props.theme.spacing.md};
  }
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  text-align: center;
  transition: all 0.3s ease;
  animation: ${float} 3s ease-in-out infinite;
  animation-delay: ${props => props.delay || '0s'};
  
  &:hover {
    border-color: #ff8c42;
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(255, 140, 66, 0.2);
  }
`;

const FeatureIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(255, 140, 66, 0.2);
  border-radius: ${props => props.theme.borderRadius.full};
  margin-bottom: ${props => props.theme.spacing.md};
  
  svg {
    width: 30px;
    height: 30px;
    color: #ff8c42;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FeatureDescription = styled.p`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.text.secondary};
  line-height: 1.5;
`;

const NotifySection = styled.section`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  max-width: 600px;
  margin: 0 auto ${props => props.theme.spacing.xxl};
  box-shadow: ${props => props.theme.shadows.md};
`;

const NotifyForm = styled.form`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.lg};
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  background: ${props => props.theme.colors.background.primary};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #ff8c42;
    box-shadow: 0 0 0 2px rgba(255, 140, 66, 0.2);
  }
  
  &::placeholder {
    color: ${props => props.theme.colors.text.muted};
  }
`;

const NotifyButton = styled.button`
  background: linear-gradient(135deg, #ff8c42, #ff6b1a);
  color: white;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  white-space: nowrap;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 20px rgba(255, 140, 66, 0.3);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    width: 100%;
    justify-content: center;
  }
`;

const FantasyComingSoonPage = () => {
  const [email, setEmail] = useState('');

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    if (email) {
      toast.success('🏈 You\'ll be the first to know when NFL Fantasy launches!');
      setEmail('');
    }
  };

  const features = [
    {
      icon: <Trophy />,
      title: 'Dynasty Leagues',
      description: 'Build your franchise over multiple seasons with keeper leagues and dynasty formats.',
      delay: '0s'
    },
    {
      icon: <Zap />,
      title: 'Daily Fantasy',
      description: 'Quick contests with instant payouts. Play daily or weekly without season-long commitment.',
      delay: '0.2s'
    },
    {
      icon: <Target />,
      title: 'Custom Scoring',
      description: 'Create unique scoring systems that match your league\'s style and preferences.',
      delay: '0.4s'
    },
    {
      icon: <Users />,
      title: 'League Management',
      description: 'Powerful commissioner tools to manage trades, waivers, and league settings.',
      delay: '0.6s'
    },
    {
      icon: <Shield />,
      title: 'Fair Play Guaranteed',
      description: 'Advanced anti-collusion detection and secure transaction processing.',
      delay: '0.8s'
    },
    {
      icon: <TrendingUp />,
      title: 'AI-Powered Insights',
      description: 'Get personalized lineup recommendations and trade analysis from our AI.',
      delay: '1s'
    }
  ];

  return (
    <PageContainer>
      <BackgroundGradient />
      <Container>
        <HeroSection>
          <IconContainer>
            <Star />
          </IconContainer>
          
          <ComingSoonBadge>
            <Calendar size={16} />
            Coming Fall 2026
          </ComingSoonBadge>
          
          <Title>NFL Fantasy Football</Title>
          <Subtitle>
            Get ready for the most advanced fantasy football experience ever created. 
            Powered by AI, built for champions.
          </Subtitle>
        </HeroSection>

        <FeaturesSection>
          <SectionTitle>What's Coming in 2026</SectionTitle>
          <FeaturesGrid>
            {features.map((feature, index) => (
              <FeatureCard key={index} delay={feature.delay}>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <FeatureTitle>{feature.title}</FeatureTitle>
                <FeatureDescription>{feature.description}</FeatureDescription>
              </FeatureCard>
            ))}
          </FeaturesGrid>
        </FeaturesSection>

        <NotifySection>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            🏆 Be First in Line
          </h3>
          <p style={{ color: '#999', marginBottom: '1.5rem' }}>
            Join the waitlist to get early access, exclusive beta invites, 
            and special launch promotions.
          </p>
          <NotifyForm onSubmit={handleNotifySubmit}>
            <EmailInput
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <NotifyButton type="submit">
              <Bell size={18} />
              Notify Me
            </NotifyButton>
          </NotifyForm>
        </NotifySection>
      </Container>
    </PageContainer>
  );
};

export default FantasyComingSoonPage;
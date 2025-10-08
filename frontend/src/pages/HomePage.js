import React from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Layers, Activity, TrendingUp, Users, Trophy, Brain } from 'lucide-react';

const PageContainer = styled.div`
  min-height: 100vh;
  background: #0a0a0a;
  padding: 2rem;
`;

const HeroSection = styled.section`
  text-align: center;
  padding: 4rem 1rem;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  border-radius: 12px;
  border: 1px solid #333;
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.25rem;
  color: #cccccc;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const CTAButton = styled.button`
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #0a0a0a;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto 3rem;
`;

const ActionCard = styled.div`
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #2a2a2a;
    border-color: #FFD700;
    transform: translateY(-4px);
  }
`;

const CardIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  svg {
    color: #0a0a0a;
  }
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
`;

const CardDescription = styled.p`
  color: #888888;
  font-size: 0.95rem;
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const FeatureCard = styled.div`
  background: linear-gradient(135deg, #1e1e1e 0%, #2a2a2a 100%);
  border: 1px solid #444;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
`;

const FeatureIcon = styled.div`
  color: #FFD700;
  margin-bottom: 1rem;
`;

const FeatureTitle = styled.h4`
  color: #FFD700;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const FeatureText = styled.p`
  color: #cccccc;
  font-size: 0.9rem;
`;

const HomePage = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <Layers size={24} />,
      title: 'Build a Parlay',
      description: 'AI-powered parlay analysis and recommendations',
      path: '/parlay'
    },
    {
      icon: <Activity size={24} />,
      title: 'Live Scores',
      description: 'Real-time game updates and scores',
      path: '/live-scores'
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'Odds Comparison',
      description: 'Find the best odds across all sportsbooks',
      path: '/odds-comparison'
    },
    {
      icon: <Users size={24} />,
      title: 'Pick\'Em Pools',
      description: 'Join or create weekly pick\'em competitions',
      path: '/pick-em'
    }
  ];

  const features = [
    {
      icon: <Brain size={32} />,
      title: 'AI-Powered Analysis',
      text: 'Get intelligent insights on every bet'
    },
    {
      icon: <Trophy size={32} />,
      title: 'Track Your Success',
      text: 'Monitor your betting performance and ROI'
    },
    {
      icon: <Activity size={32} />,
      title: 'Real-Time Updates',
      text: 'Live scores, odds, and betting opportunities'
    }
  ];

  return (
    <PageContainer>
      <HeroSection>
        <Title>Welcome to Prizm Bets</Title>
        <Subtitle>Your Complete Sports Betting Command Center</Subtitle>
        <CTAButton onClick={() => navigate('/parlay')}>
          Start Building Parlays
        </CTAButton>
      </HeroSection>

      <QuickActions>
        {quickActions.map((action, index) => (
          <ActionCard key={index} onClick={() => navigate(action.path)}>
            <CardIcon>{action.icon}</CardIcon>
            <CardTitle>{action.title}</CardTitle>
            <CardDescription>{action.description}</CardDescription>
          </ActionCard>
        ))}
      </QuickActions>

      <FeaturesGrid>
        {features.map((feature, index) => (
          <FeatureCard key={index}>
            <FeatureIcon>{feature.icon}</FeatureIcon>
            <FeatureTitle>{feature.title}</FeatureTitle>
            <FeatureText>{feature.text}</FeatureText>
          </FeatureCard>
        ))}
      </FeaturesGrid>
    </PageContainer>
  );
};

export default HomePage;
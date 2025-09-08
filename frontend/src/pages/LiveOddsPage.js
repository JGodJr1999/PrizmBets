import React from 'react';
import styled from 'styled-components';
import LiveOddsDisplay from '../components/LiveData/LiveOddsDisplay';
import SportsErrorBoundary from '../components/Security/SportsErrorBoundary';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.lg} 0;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding: 0 ${props => props.theme.spacing.lg};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.accent.primary};
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
`;

const LiveOddsPage = () => {
  return (
    <PageContainer>
      <Header>
        <Title>Live Odds</Title>
        <Subtitle>
          Compare live betting odds across major sportsbooks for today's games
        </Subtitle>
      </Header>
      <SportsErrorBoundary fallbackMessage="Unable to load live odds data. Please try refreshing the page or check back later.">
        <LiveOddsDisplay />
      </SportsErrorBoundary>
    </PageContainer>
  );
};

export default LiveOddsPage;
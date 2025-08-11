import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { Brain, BarChart3, DollarSign, Shield } from 'lucide-react';
import ParlayBuilder from '../components/Parlay/ParlayBuilder';
import EvaluationResults from '../components/Results/EvaluationResults';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { apiService } from '../services/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
`;

const MainContent = styled.main`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    padding: ${props => props.theme.spacing.md};
  }
`;

const Hero = styled.section`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  padding: ${props => props.theme.spacing.xxl} 0;
`;

const HeroTitle = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto ${props => props.theme.spacing.lg};
  line-height: 1.6;
  
  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 1rem;
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const FeatureCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  text-align: center;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: ${props => props.theme.colors.border.secondary};
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const FeatureIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  justify-content: center;
`;

const FeatureTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const FeatureDescription = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const ResultsSection = styled.section`
  margin-top: ${props => props.theme.spacing.xxl};
`;


const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.accent.secondary};
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
`;

const HomePage = () => {
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluateParlay = async (parlayData) => {
    setIsLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const result = await apiService.evaluateParlay(parlayData);
      setEvaluation(result.evaluation);
      toast.success('Parlay evaluated successfully!');
    } catch (err) {
      const errorMessage = err.message || 'Failed to evaluate parlay';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <MainContent>
        <Hero>
          <HeroTitle>AI-Powered Sports Betting Intelligence</HeroTitle>
          <HeroSubtitle>
            Build smarter parlays with our AI evaluation system. Get instant analysis, 
            risk assessment, and odds comparison to make informed betting decisions.
          </HeroSubtitle>
        </Hero>

        <FeatureGrid>
          <FeatureCard>
            <FeatureIcon>
              <Brain size={32} />
            </FeatureIcon>
            <FeatureTitle>AI Analysis</FeatureTitle>
            <FeatureDescription>
              Advanced algorithms analyze your parlays using historical data and trends
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <BarChart3 size={32} />
            </FeatureIcon>
            <FeatureTitle>Risk Assessment</FeatureTitle>
            <FeatureDescription>
              Get detailed risk factors and confidence levels for each bet
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <DollarSign size={32} />
            </FeatureIcon>
            <FeatureTitle>Odds Comparison</FeatureTitle>
            <FeatureDescription>
              Find the best odds across multiple sportsbooks to maximize returns
            </FeatureDescription>
          </FeatureCard>
          
          <FeatureCard>
            <FeatureIcon>
              <Shield size={32} />
            </FeatureIcon>
            <FeatureTitle>Smart Recommendations</FeatureTitle>
            <FeatureDescription>
              Receive actionable insights and betting strategy recommendations
            </FeatureDescription>
          </FeatureCard>
        </FeatureGrid>

        <ParlayBuilder 
          onEvaluate={handleEvaluateParlay}
          isLoading={isLoading}
        />

        {isLoading && (
          <LoadingSpinner 
            text="Analyzing your parlay..."
            subtext="Our AI is evaluating each bet for optimal results"
          />
        )}
        
        {error && (
          <ErrorMessage>
            <strong>Error:</strong> {error}
          </ErrorMessage>
        )}

        {evaluation && (
          <ResultsSection>
            <EvaluationResults evaluation={evaluation} />
          </ResultsSection>
        )}
      </MainContent>
    </PageContainer>
  );
};

export default HomePage;
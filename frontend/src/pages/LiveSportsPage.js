import React, { useState } from 'react';
import styled from 'styled-components';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LiveOddsParlay from '../components/Odds/LiveOddsParlay';
import EvaluationResults from '../components/Results/EvaluationResults';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import UsageTracker from '../components/Usage/UsageTracker';
import UsageDemo from '../components/Usage/UsageDemo';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import { apiService } from '../services/api';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
  padding-top: ${props => props.theme?.spacing?.lg || '1.5rem'};
`;

const ResultsSection = styled.section`
  max-width: 1600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
`;

const ErrorMessage = styled.div`
  background: ${props => props.theme.colors.accent.secondary}20;
  border: 1px solid ${props => props.theme.colors.accent.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  color: ${props => props.theme.colors.accent.secondary};
  text-align: center;
  margin: ${props => props.theme.spacing.lg} 0;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
`;

const UsageSection = styled.section`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.xl} ${props => props.theme.spacing.xl};
`;

const LiveSportsPage = () => {
  console.log('LiveSportsPage: Rendering Live Sports with Parlay Integration');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleEvaluateParlay = async (parlayData) => {
    setIsLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      console.log('LiveSportsPage: Evaluating parlay:', parlayData);
      const result = await apiService.evaluateParlay(parlayData);
      setEvaluation(result.evaluation);
      toast.success('Parlay evaluated successfully!');

      // Scroll to results section
      setTimeout(() => {
        const resultsSection = document.getElementById('evaluation-results');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (err) {
      const errorMessage = err.message || 'Failed to evaluate parlay';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    navigate('/subscription');
  };

  const handleSignUpClick = () => {
    navigate('/register');
  };

  return (
    <PageContainer>
      <ErrorBoundary>
        {/* Usage tracking/demo section */}
        <UsageSection>
          {isAuthenticated ? (
            <UsageTracker onUpgradeClick={handleUpgradeClick} />
          ) : (
            <UsageDemo onSignUpClick={handleSignUpClick} />
          )}
        </UsageSection>

        {/* Main Live Odds and Parlay interface */}
        <LiveOddsParlay
          onEvaluate={handleEvaluateParlay}
          isLoading={isLoading}
        />

        {/* Loading state for parlay evaluation */}
        {isLoading && (
          <ResultsSection>
            <LoadingSpinner
              text="Analyzing your parlay..."
              subtext="Our AI is evaluating each bet for optimal results"
            />
          </ResultsSection>
        )}

        {/* Error state */}
        {error && (
          <ErrorMessage>
            <strong>Error:</strong> {error}
          </ErrorMessage>
        )}

        {/* Evaluation results */}
        {evaluation && (
          <ResultsSection id="evaluation-results">
            <EvaluationResults evaluation={evaluation} />
          </ResultsSection>
        )}
      </ErrorBoundary>
    </PageContainer>
  );
};

export default LiveSportsPage;
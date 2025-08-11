import React from 'react';
import styled from 'styled-components';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

const ResultsContainer = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  animation: fadeIn 0.5s ease-out;
`;

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
`;

const Title = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const Timestamp = styled.span`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const OverallScore = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.accent.primary}20, ${props => props.theme.colors.accent.primary}10);
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.lg};
  text-align: center;
`;

const ScoreValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme.colors.accent.primary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ScoreLabel = styled.div`
  font-size: 1.1rem;
  color: ${props => props.theme.colors.text.secondary};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const Confidence = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => {
    const confidence = props.confidence?.toLowerCase();
    if (confidence === 'high') return props.theme.colors.betting.positive + '20';
    if (confidence === 'medium') return props.theme.colors.betting.neutral + '20';
    return props.theme.colors.betting.negative + '20';
  }};
  color: ${props => {
    const confidence = props.confidence?.toLowerCase();
    if (confidence === 'high') return props.theme.colors.betting.positive;
    if (confidence === 'medium') return props.theme.colors.betting.neutral;
    return props.theme.colors.betting.negative;
  }};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 600;
  font-size: 0.9rem;
`;

const Recommendation = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-left: 4px solid ${props => {
    const rec = props.recommendation?.toLowerCase();
    if (rec?.includes('recommended')) return props.theme.colors.betting.positive;
    if (rec?.includes('consider')) return props.theme.colors.betting.neutral;
    if (rec?.includes('caution')) return props.theme.colors.betting.neutral;
    return props.theme.colors.betting.negative;
  }};
  padding: ${props => props.theme.spacing.md};
  margin: ${props => props.theme.spacing.lg} 0;
  border-radius: 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md} 0;
`;

const Section = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const BetResult = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const BetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const BetScore = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  font-weight: 600;
  color: ${props => {
    const score = props.score;
    if (score >= 0.8) return props.theme.colors.betting.positive;
    if (score >= 0.6) return props.theme.colors.betting.neutral;
    return props.theme.colors.betting.negative;
  }};
`;

const BetExplanation = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
`;

const RiskFactors = styled.div`
  background: ${props => props.theme.colors.accent.warning}10;
  border: 1px solid ${props => props.theme.colors.accent.warning};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const RiskItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.accent.warning};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.xs};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const OddsSuggestion = styled.div`
  background: ${props => props.theme.colors.accent.primary}10;
  border: 1px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const getConfidenceIcon = (confidence) => {
  switch (confidence?.toLowerCase()) {
    case 'high':
      return <CheckCircle size={16} />;
    case 'medium':
      return <TrendingUp size={16} />;
    default:
      return <XCircle size={16} />;
  }
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

const EvaluationResults = ({ evaluation }) => {
  if (!evaluation) return null;

  return (
    <ResultsContainer>
      <ResultsHeader>
        <Title>
          <Brain size={24} />
          AI Evaluation Results
        </Title>
        <Timestamp>
          <Clock size={14} />
          {formatTimestamp(evaluation.analysis_timestamp)}
        </Timestamp>
      </ResultsHeader>

      <OverallScore>
        <ScoreValue>{evaluation.overall_score}/1.00</ScoreValue>
        <ScoreLabel>Overall Intelligence Score</ScoreLabel>
        <Confidence confidence={evaluation.confidence}>
          {getConfidenceIcon(evaluation.confidence)}
          {evaluation.confidence} Confidence
        </Confidence>
      </OverallScore>

      <Recommendation recommendation={evaluation.recommendation}>
        <strong>{evaluation.recommendation}</strong>
      </Recommendation>

      <Section>
        <SectionTitle>
          <TrendingUp size={18} />
          Individual Bet Analysis
        </SectionTitle>
        {evaluation.individual_bet_scores?.map((bet, index) => (
          <BetResult key={index}>
            <BetHeader>
              <span>Bet #{bet.bet_index + 1}</span>
              <BetScore score={bet.score}>
                {getConfidenceIcon(bet.score >= 0.8 ? 'high' : bet.score >= 0.6 ? 'medium' : 'low')}
                {bet.score}/1.00
              </BetScore>
            </BetHeader>
            <BetExplanation>{bet.explanation}</BetExplanation>
          </BetResult>
        ))}
      </Section>

      {evaluation.risk_factors?.length > 0 && (
        <Section>
          <SectionTitle>
            <AlertTriangle size={18} />
            Risk Assessment
          </SectionTitle>
          <RiskFactors>
            {evaluation.risk_factors.map((risk, index) => (
              <RiskItem key={index}>
                <AlertTriangle size={14} />
                {risk}
              </RiskItem>
            ))}
          </RiskFactors>
        </Section>
      )}

      {evaluation.best_odds_suggestion && (
        <Section>
          <SectionTitle>
            <TrendingUp size={18} />
            Best Odds Recommendation
          </SectionTitle>
          <OddsSuggestion>
            <SuggestionHeader>
              <strong>{evaluation.best_odds_suggestion.primary_recommendation}</strong>
              <span style={{ color: '#51cf66', fontWeight: '600' }}>
                Save {evaluation.best_odds_suggestion.potential_savings}
              </span>
            </SuggestionHeader>
            <p style={{ color: '#b3b3b3', fontSize: '0.9rem', margin: 0 }}>
              {evaluation.best_odds_suggestion.reason}
            </p>
          </OddsSuggestion>
        </Section>
      )}
    </ResultsContainer>
  );
};

export default EvaluationResults;
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Trophy, BarChart3, Brain, Star, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl} 0;
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
`;

const ParlayGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${props => props.theme.spacing.xl};
`;

const ParlayCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const ParlayHeader = styled.div`
  background: ${props => props.theme.colors.gradient.primary};
  color: white;
  padding: ${props => props.theme.spacing.lg};
  position: relative;
`;

const ParlayTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
`;

const ParlayMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  opacity: 0.9;
`;

const ParlayBody = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const BetsSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const SectionTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const BetItem = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.sm};
  border-left: 4px solid ${props => props.theme.colors.accent.primary};
`;

const BetDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const BetTeam = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
`;

const BetOdds = styled.span`
  color: ${props => props.theme.colors.accent.primary};
  font-weight: 600;
`;

const BetType = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const AnalysisSection = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ScoreCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => {
    if (props.score >= 80) return 'linear-gradient(135deg, #4CAF50, #45a049)';
    if (props.score >= 60) return 'linear-gradient(135deg, #ff8c42, #ff6b35)';
    return 'linear-gradient(135deg, #f44336, #d32f2f)';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
`;

const AnalysisGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AnalysisItem = styled.div`
  text-align: center;
`;

const AnalysisLabel = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.8rem;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const AnalysisValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1.1rem;
`;

const RecommendationBox = styled.div`
  background: ${props => {
    if (props.recommendation === 'STRONG_BET') return '#4CAF5020';
    if (props.recommendation === 'PROCEED_WITH_CAUTION') return '#ff8c4220';
    return '#f4433620';
  }};
  border: 1px solid ${props => {
    if (props.recommendation === 'STRONG_BET') return '#4CAF50';
    if (props.recommendation === 'PROCEED_WITH_CAUTION') return '#ff8c42';
    return '#f44336';
  }};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.md};
`;

const RecommendationText = styled.div`
  color: ${props => {
    if (props.recommendation === 'STRONG_BET') return '#4CAF50';
    if (props.recommendation === 'PROCEED_WITH_CAUTION') return '#ff8c42';
    return '#f44336';
  }};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ErrorMessage = styled.div`
  background: #ff444420;
  border: 1px solid #ff4444;
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  color: #ff4444;
  text-align: center;
  margin: ${props => props.theme.spacing.xl} 0;
`;

const DemoParlaysPage = () => {
  const [parlays, setParlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDemoParlays = async () => {
      try {
        const response = await apiService.getDemoParlays();
        setParlays(response.parlays || []);
      } catch (err) {
        setError('Failed to load demo parlays');
        console.error('Demo parlays fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoParlays();
  }, []);

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BET': return <Star size={18} />;
      case 'PROCEED_WITH_CAUTION': return <AlertTriangle size={18} />;
      default: return <AlertTriangle size={18} />;
    }
  };

  const formatRecommendation = (recommendation) => {
    switch (recommendation) {
      case 'STRONG_BET': return 'Strong Bet';
      case 'PROCEED_WITH_CAUTION': return 'Proceed with Caution';
      case 'AVOID': return 'Avoid This Bet';
      default: return recommendation;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingSpinner text="Loading demo parlays..." />
        </ContentContainer>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorMessage>{error}</ErrorMessage>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <Title>Demo Parlays</Title>
          <Subtitle>
            Explore real parlay examples with detailed AI analysis. 
            Learn from winning strategies and understand what makes a successful bet.
          </Subtitle>
        </Header>

        <ParlayGrid>
          {parlays.map((parlay) => (
            <ParlayCard
              key={parlay.id}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ParlayHeader>
                <ParlayTitle>{parlay.title}</ParlayTitle>
                <ParlayMeta>
                  <span>
                    <DollarSign size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    ${parlay.total_amount}
                  </span>
                  <span>{parlay.bets?.length || 0} bets</span>
                </ParlayMeta>
              </ParlayHeader>

              <ParlayBody>
                <BetsSection>
                  <SectionTitle>
                    <Trophy size={18} />
                    Bets in Parlay
                  </SectionTitle>
                  {parlay.bets?.map((bet, index) => (
                    <BetItem key={index}>
                      <BetDetails>
                        <BetTeam>{bet.team}</BetTeam>
                        <BetOdds>{bet.odds}</BetOdds>
                      </BetDetails>
                      <BetType>{bet.bet_type} - {bet.sport}</BetType>
                    </BetItem>
                  )) || []}
                </BetsSection>

                {parlay.ai_analysis && (
                  <AnalysisSection>
                    <SectionTitle>
                      <Brain size={18} />
                      AI Analysis
                    </SectionTitle>
                    
                    <ScoreDisplay>
                      <ScoreCircle score={parlay.ai_analysis.overall_score}>
                        {parlay.ai_analysis.overall_score}%
                      </ScoreCircle>
                    </ScoreDisplay>

                    <AnalysisGrid>
                      <AnalysisItem>
                        <AnalysisLabel>Confidence</AnalysisLabel>
                        <AnalysisValue>{parlay.ai_analysis.confidence_level}</AnalysisValue>
                      </AnalysisItem>
                      <AnalysisItem>
                        <AnalysisLabel>Risk Level</AnalysisLabel>
                        <AnalysisValue>{parlay.ai_analysis.risk_factor}</AnalysisValue>
                      </AnalysisItem>
                      <AnalysisItem>
                        <AnalysisLabel>Expected Return</AnalysisLabel>
                        <AnalysisValue>{parlay.ai_analysis.expected_return}</AnalysisValue>
                      </AnalysisItem>
                    </AnalysisGrid>

                    {parlay.ai_analysis.recommendation && (
                      <RecommendationBox recommendation={parlay.ai_analysis.recommendation}>
                        <RecommendationText recommendation={parlay.ai_analysis.recommendation}>
                          {getRecommendationIcon(parlay.ai_analysis.recommendation)}
                          {formatRecommendation(parlay.ai_analysis.recommendation)}
                        </RecommendationText>
                      </RecommendationBox>
                    )}
                  </AnalysisSection>
                )}
              </ParlayBody>
            </ParlayCard>
          ))}
        </ParlayGrid>
      </ContentContainer>
    </PageContainer>
  );
};

export default DemoParlaysPage;
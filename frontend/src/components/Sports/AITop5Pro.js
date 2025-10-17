import React from 'react';
import styled from 'styled-components';
import { BarChart3, Clock, CheckCircle, Crown } from 'lucide-react';
import BestOddsDisplay from '../UI/BestOddsDisplay';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
`;

const DashboardHeader = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
  text-align: center;
`;

const MainTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  background: ${props => props.theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.sm};

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const PlanBadge = styled.div`
  background: ${props => props.theme.colors.accent.primary};
  color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.9rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
`;

const UpdateTime = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.xs};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const BetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const BetCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0, 212, 170, 0.1);
  }
`;

const BetRank = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.md};
  right: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(0, 212, 170, 0.3);
`;

const SportIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const BetDetails = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const BetTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  line-height: 1.3;
`;

const BetSubtitle = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1rem;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ProbabilitySection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ProbabilityBar = styled.div`
  background: ${props => props.theme.colors.background.hover};
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ProbabilityFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage >= 85) return props.theme.colors.stats.excellent;
    if (props.percentage >= 75) return props.theme.colors.stats.good;
    if (props.percentage >= 65) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
`;

const ProbabilityText = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
`;

const ProbabilityValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
`;

const ConfidenceLevel = styled.span`
  color: ${props => {
    if (props.percentage >= 85) return props.theme.colors.stats.excellent;
    if (props.percentage >= 75) return props.theme.colors.stats.good;
    if (props.percentage >= 65) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  font-weight: 500;
`;

const AnalyticsSection = styled.div`
  background: ${props => props.theme.colors.background.hover};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const AnalyticsTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const AnalyticsText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
`;

const OddsSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.secondary};
`;

const OddsValue = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  font-size: 1.2rem;
  font-weight: bold;
`;

const RecommendedBadge = styled.div`
  background: ${props => props.theme.colors.stats.excellent};
  color: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  max-width: 120px;
  text-align: center;
`;

const AITop5Pro = () => {
  // Pro Plan gets 5 total picks across ALL sports combined
  const top5Data = [
    {
      rank: 1,
      sport: '🏀',
      sportName: 'NBA',
      title: 'LeBron James Over 27.5 Points',
      subtitle: 'Lakers vs Warriors',
      probability: 87,
      odds: '+110',
      analytics: 'LeBron averaging 31.2 PPG over last 5 games against Warriors. GSW allows 4th most points to SFs. Lakers need to win to stay in playoff race.',
      recommendedReason: 'Matchup advantage',
      oddsComparison: [
        { sportsbook: 'draftkings', odds: '+110', url: 'https://draftkings.com' },
        { sportsbook: 'fanduel', odds: '+105', url: 'https://fanduel.com' },
        { sportsbook: 'betmgm', odds: '+115', url: 'https://betmgm.com' }
      ]
    },
    {
      rank: 2,
      sport: '🏈',
      sportName: 'NFL',
      title: 'Josh Allen Over 2.5 Passing TDs',
      subtitle: 'Bills vs Chiefs',
      probability: 89,
      odds: '+125',
      analytics: 'Allen has 3+ passing TDs in 7 of last 8 games. Chiefs allow 2.8 passing TDs per game. Buffalo excellent in red zone.',
      recommendedReason: 'Elite form'
    },
    {
      rank: 3,
      sport: '🏀',
      sportName: 'NBA',
      title: 'Stephen Curry Over 4.5 3-Pointers',
      subtitle: 'Warriors vs Lakers',
      probability: 84,
      odds: '+115',
      analytics: 'Curry has hit 5+ threes in 8 of last 10 home games. Lakers rank 28th in 3-point defense. Historical advantage at home vs LAL.',
      recommendedReason: 'Home advantage'
    },
    {
      rank: 4,
      sport: '🏈',
      sportName: 'NFL',
      title: 'Travis Kelce Over 75.5 Rec Yards',
      subtitle: 'Chiefs vs Bills',
      probability: 85,
      odds: '+110',
      analytics: 'Kelce averages 95.3 yards vs Buffalo historically. Bills struggle covering TEs. Mahomes relies on Kelce in big games.',
      recommendedReason: 'Historical dominance'
    },
    {
      rank: 5,
      sport: '⚾',
      sportName: 'MLB',
      title: 'Aaron Judge Over 1.5 Total Bases',
      subtitle: 'Yankees vs Red Sox',
      probability: 82,
      odds: '+105',
      analytics: 'Judge has 2+ total bases in 6 of last 8 games vs Boston. Red Sox starting pitcher allows 1.8 HR/9 to RHB. Fenway favorable.',
      recommendedReason: 'Pitcher matchup'
    }
  ];

  const getConfidenceLabel = (percentage) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 75) return 'Strong';
    if (percentage >= 65) return 'Good';
    return 'Fair';
  };

  return (
    <DashboardContainer>
      <DashboardHeader>
        <PlanBadge>
          <Crown size={14} />
          Pro Plan
        </PlanBadge>
        <MainTitle>
          AI's Top 5 Picks
        </MainTitle>
        <Subtitle>
          Our AI's 5 highest probability bets across all sports with detailed analytics
        </Subtitle>
        <UpdateTime>
          <Clock size={14} />
          Updated 3 minutes ago
        </UpdateTime>
      </DashboardHeader>

      <BetsGrid>
        {top5Data.map((bet, betIndex) => (
          <BetCard key={betIndex}>
            <BetRank>{bet.rank}</BetRank>

            <SportIcon>{bet.sport}</SportIcon>

            <BetDetails>
              <BetTitle>{bet.title}</BetTitle>
              <BetSubtitle>
                {bet.sportName} • {bet.subtitle}
              </BetSubtitle>
            </BetDetails>

            <ProbabilitySection>
              <ProbabilityBar>
                <ProbabilityFill percentage={bet.probability} />
              </ProbabilityBar>
              <ProbabilityText>
                <ProbabilityValue>{bet.probability}% Win Probability</ProbabilityValue>
                <ConfidenceLevel percentage={bet.probability}>
                  {getConfidenceLabel(bet.probability)}
                </ConfidenceLevel>
              </ProbabilityText>
            </ProbabilitySection>

            <AnalyticsSection>
              <AnalyticsTitle>
                <BarChart3 size={14} />
                AI Analysis
              </AnalyticsTitle>
              <AnalyticsText>{bet.analytics}</AnalyticsText>
            </AnalyticsSection>

            {bet.oddsComparison ? (
              <BestOddsDisplay
                odds={bet.oddsComparison}
                betTitle={bet.title}
              />
            ) : (
              <OddsSection>
                <OddsValue>{bet.odds}</OddsValue>
                <RecommendedBadge>
                  <CheckCircle size={12} />
                  {bet.recommendedReason}
                </RecommendedBadge>
              </OddsSection>
            )}
          </BetCard>
        ))}
      </BetsGrid>
    </DashboardContainer>
  );
};

export default AITop5Pro;
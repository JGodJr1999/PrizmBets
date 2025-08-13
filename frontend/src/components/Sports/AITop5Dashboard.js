import React from 'react';
import styled from 'styled-components';
import { BarChart3, Clock, CheckCircle } from 'lucide-react';
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

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
`;

const SportsContainer = styled.div`
  display: grid;
  gap: ${props => props.theme.spacing.xl};
`;

const SportSection = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}40;
    transform: translateY(-2px);
  }
`;

const SportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};
`;

const SportTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const SportIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
`;

const UpdateTime = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const BetsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const BetCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border: 1px solid ${props => props.theme.colors.border.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    transform: translateY(-1px);
  }
`;

const BetRank = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.sm};
  right: ${props => props.theme.spacing.sm};
  background: ${props => props.theme.colors.gradient.primary};
  color: ${props => props.theme.colors.background.primary};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
`;

const BetDetails = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const BetTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.xs} 0;
`;

const BetSubtitle = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const ProbabilitySection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const ProbabilityBar = styled.div`
  background: ${props => props.theme.colors.background.hover};
  height: 8px;
  border-radius: 4px;
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
  font-size: 0.9rem;
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
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const AnalyticsTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const AnalyticsText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
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
  font-size: 1.1rem;
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
`;

const AITop5Dashboard = () => {
  const sportsData = [
    {
      name: 'NBA',
      icon: '🏀',
      lastUpdated: '2 min ago',
      bets: [
        {
          rank: 1,
          title: 'LeBron James Over 27.5 Points',
          subtitle: 'Lakers vs Warriors',
          probability: 87,
          odds: '+110',
          analytics: 'LeBron averaging 31.2 PPG over last 5 games against Warriors. GSW allows 4th most points to SFs. Lakers need to win to stay in playoff race.',
          recommendedReason: 'Matchup advantage + recent form',
          oddsComparison: [
            { sportsbook: 'draftkings', odds: '+110', url: 'https://draftkings.com' },
            { sportsbook: 'fanduel', odds: '+105', url: 'https://fanduel.com' },
            { sportsbook: 'betmgm', odds: '+115', url: 'https://betmgm.com' }
          ]
        },
        {
          rank: 2,
          title: 'Stephen Curry Over 4.5 3-Pointers',
          subtitle: 'Warriors vs Lakers',
          probability: 84,
          odds: '+115',
          analytics: 'Curry has hit 5+ threes in 8 of last 10 home games. Lakers rank 28th in 3-point defense. Historical advantage at home vs LAL.',
          recommendedReason: 'Home court + defensive matchup',
          oddsComparison: [
            { sportsbook: 'betmgm', odds: '+120', url: 'https://betmgm.com' },
            { sportsbook: 'draftkings', odds: '+115', url: 'https://draftkings.com' },
            { sportsbook: 'fanduel', odds: '+110', url: 'https://fanduel.com' }
          ]
        },
        {
          rank: 3,
          title: 'Anthony Davis Over 10.5 Rebounds',
          subtitle: 'Lakers vs Warriors',
          probability: 81,
          odds: '+105',
          analytics: 'AD averaging 12.8 rebounds in last 6 games. Warriors missing key rebounders. Lakers emphasizing interior presence recently.',
          recommendedReason: 'Recent trend + opponent weakness'
        },
        {
          rank: 4,
          title: 'Draymond Green Over 7.5 Assists',
          subtitle: 'Warriors vs Lakers',
          probability: 78,
          odds: '+120',
          analytics: 'Green has 8+ assists in 4 of last 5 games. Lakers play fast pace which creates more possessions. Primary facilitator role.',
          recommendedReason: 'Pace advantage + role expansion'
        },
        {
          rank: 5,
          title: 'Lakers Team Total Over 115.5',
          subtitle: 'Lakers vs Warriors',
          probability: 76,
          odds: '+100',
          analytics: 'Lakers averaging 118.4 PPG over last 8 games. Warriors allowing 116.2 PPG at home. Fast-paced game expected.',
          recommendedReason: 'Offensive surge + pace factors'
        }
      ]
    },
    {
      name: 'NFL',
      icon: '🏈',
      lastUpdated: '5 min ago',
      bets: [
        {
          rank: 1,
          title: 'Josh Allen Over 2.5 Passing TDs',
          subtitle: 'Bills vs Chiefs',
          probability: 89,
          odds: '+125',
          analytics: 'Allen has 3+ passing TDs in 7 of last 8 games. Chiefs allow 2.8 passing TDs per game. Buffalo excellent in red zone.',
          recommendedReason: 'Elite form + opponent tendency'
        },
        {
          rank: 2,
          title: 'Travis Kelce Over 75.5 Rec Yards',
          subtitle: 'Chiefs vs Bills',
          probability: 85,
          odds: '+110',
          analytics: 'Kelce averages 95.3 yards vs Buffalo historically. Bills struggle covering TEs. Mahomes relies on Kelce in big games.',
          recommendedReason: 'Historical dominance + game script'
        },
        {
          rank: 3,
          title: 'Stefon Diggs Over 6.5 Receptions',
          subtitle: 'Bills vs Chiefs',
          probability: 82,
          odds: '+105',
          analytics: 'Diggs targeted heavily in playoff games. Chiefs secondary depleted. Buffalo needs consistent passing attack.',
          recommendedReason: 'Target share + defensive injuries'
        },
        {
          rank: 4,
          title: 'Patrick Mahomes Over 275.5 Pass Yards',
          subtitle: 'Chiefs vs Bills',
          probability: 79,
          odds: '+115',
          analytics: 'Mahomes averages 312 yards vs Bills. High-scoring game expected. Both teams strong running defenses force passing.',
          recommendedReason: 'Game total + defensive strengths'
        },
        {
          rank: 5,
          title: 'Game Total Over 50.5',
          subtitle: 'Bills vs Chiefs',
          probability: 77,
          odds: '+100',
          analytics: 'Two elite offenses averaging 28+ PPG. Playoff intensity creates aggressive play-calling. Weather conditions favorable.',
          recommendedReason: 'Offensive firepower + game context'
        }
      ]
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
        <MainTitle>AI's Top 5</MainTitle>
        <Subtitle>
          Our AI's highest probability bets for each sport with detailed analytics and reasoning
        </Subtitle>
      </DashboardHeader>

      <SportsContainer>
        {sportsData.map((sport, sportIndex) => (
          <SportSection key={sportIndex}>
            <SportHeader>
              <SportTitle>
                <SportIcon>{sport.icon}</SportIcon>
                {sport.name}
              </SportTitle>
              <UpdateTime>
                <Clock size={14} />
                Updated {sport.lastUpdated}
              </UpdateTime>
            </SportHeader>

            <BetsGrid>
              {sport.bets.map((bet, betIndex) => (
                <BetCard key={betIndex}>
                  <BetRank>{bet.rank}</BetRank>
                  
                  <BetDetails>
                    <BetTitle>{bet.title}</BetTitle>
                    <BetSubtitle>{bet.subtitle}</BetSubtitle>
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
          </SportSection>
        ))}
      </SportsContainer>
    </DashboardContainer>
  );
};

export default AITop5Dashboard;
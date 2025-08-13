import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Brain, 
  Filter, 
  Calendar,
  Star,
  Award,
  ChevronRight,
  Eye,
  DollarSign,
  Percent
} from 'lucide-react';

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.xl};
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
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
  text-align: center;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    font-size: 2.5rem;
  }
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.2rem;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  line-height: 1.6;
  text-align: center;
`;

const FiltersRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: ${props => props.theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const FilterButton = styled.button`
  background: ${props => props.active ? 
    props.theme.colors.gradient.primary : 
    props.theme.colors.background.card};
  color: ${props => props.active ? 
    props.theme.colors.background.primary : 
    props.theme.colors.text.primary};
  border: 1px solid ${props => props.active ? 
    'transparent' : 
    props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.3s ease;
  font-weight: 500;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: ${props => props.theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.lg};
  }
`;

const AnalyticsCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary}40;
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.lg};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const CardIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
`;

const ViewDetailButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.colors.border.secondary};
  color: ${props => props.theme.colors.text.secondary};
  border-radius: ${props => props.theme.borderRadius.sm};
  padding: ${props => props.theme.spacing.sm};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme.colors.accent.primary};
    color: ${props => props.theme.colors.accent.primary};
  }
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md} 0;
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};

  &:last-child {
    border-bottom: none;
  }
`;

const MetricLabel = styled.span`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
`;

const MetricValue = styled.span`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 600;
  font-size: 1.1rem;
`;

const ProgressBar = styled.div`
  background: ${props => props.theme.colors.background.hover};
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin: ${props => props.theme.spacing.sm} 0;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: ${props => {
    if (props.percentage >= 80) return props.theme.colors.stats.excellent;
    if (props.percentage >= 60) return props.theme.colors.stats.good;
    if (props.percentage >= 40) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  width: ${props => props.percentage}%;
  transition: width 0.5s ease;
`;

const InsightCard = styled.div`
  background: ${props => props.theme.colors.background.secondary};
  border-left: 4px solid ${props => props.theme.colors.accent.primary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const InsightTitle = styled.h4`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const InsightText = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
`;

const ConfidenceIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  background: ${props => {
    if (props.level >= 90) return props.theme.colors.stats.excellent;
    if (props.level >= 75) return props.theme.colors.stats.good;
    if (props.level >= 60) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }}20;
  color: ${props => {
    if (props.level >= 90) return props.theme.colors.stats.excellent;
    if (props.level >= 75) return props.theme.colors.stats.good;
    if (props.level >= 60) return props.theme.colors.stats.average;
    return props.theme.colors.stats.poor;
  }};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.full};
  font-size: 0.8rem;
  font-weight: 600;
`;

const AnalyticsDashboard = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  const filters = [
    { id: 'all', label: 'All Bets', icon: BarChart3 },
    { id: 'nfl', label: 'NFL', icon: Target },
    { id: 'nba', label: 'NBA', icon: Target },
    { id: 'high-confidence', label: 'High Confidence', icon: Star }
  ];

  const timeRanges = [
    { id: '1d', label: 'Today' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: 'season', label: 'Season' }
  ];

  const analyticsData = {
    performance: {
      winRate: 78,
      totalPicks: 156,
      profitability: 24.5,
      avgOdds: 165,
      streak: 7
    },
    insights: [
      {
        title: "Home Underdog Strategy",
        confidence: 92,
        description: "Teams playing at home as underdogs are hitting at 82% this season. Historical data shows 15% edge over expected probability."
      },
      {
        title: "Over Bets in Divisional Games",
        confidence: 87,
        description: "Division rivals are consistently producing high-scoring games. Weather conditions and defensive familiarity creating explosive offenses."
      },
      {
        title: "Late Season Motivation Factor",
        confidence: 74,
        description: "Teams fighting for playoff spots showing increased offensive output in games with playoff implications."
      }
    ],
    topStrategies: [
      {
        name: "Weather-Based Unders",
        winRate: 84,
        roi: 32.1,
        games: 43
      },
      {
        name: "Primetime Favorites",
        winRate: 79,
        roi: 18.7,
        games: 28
      },
      {
        name: "Revenge Game Overs",
        winRate: 76,
        roi: 22.3,
        games: 21
      }
    ]
  };

  return (
    <DashboardContainer>
      <HeaderSection>
        <MainTitle>Betting Analytics</MainTitle>
        <Subtitle>
          Deep dive into AI predictions, performance metrics, and strategic insights
        </Subtitle>
      </HeaderSection>

      <FiltersRow>
        {filters.map(filter => (
          <FilterButton
            key={filter.id}
            active={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          >
            <filter.icon size={16} />
            {filter.label}
          </FilterButton>
        ))}
        
        <FilterButton
          active={false}
          onClick={() => {/* Time range selector */}}
        >
          <Calendar size={16} />
          {timeRanges.find(t => t.id === timeRange)?.label}
        </FilterButton>
      </FiltersRow>

      <AnalyticsGrid>
        <AnalyticsCard>
          <CardHeader>
            <CardTitle>
              <CardIcon><TrendingUp size={20} /></CardIcon>
              Performance Overview
            </CardTitle>
            <ViewDetailButton>
              <Eye size={14} />
              Details
              <ChevronRight size={14} />
            </ViewDetailButton>
          </CardHeader>

          <MetricRow>
            <MetricLabel>Win Rate</MetricLabel>
            <MetricValue>{analyticsData.performance.winRate}%</MetricValue>
          </MetricRow>
          <ProgressBar>
            <ProgressFill percentage={analyticsData.performance.winRate} />
          </ProgressBar>

          <MetricRow>
            <MetricLabel>Total Picks</MetricLabel>
            <MetricValue>{analyticsData.performance.totalPicks}</MetricValue>
          </MetricRow>

          <MetricRow>
            <MetricLabel>ROI</MetricLabel>
            <MetricValue>+{analyticsData.performance.profitability}%</MetricValue>
          </MetricRow>

          <MetricRow>
            <MetricLabel>Average Odds</MetricLabel>
            <MetricValue>+{analyticsData.performance.avgOdds}</MetricValue>
          </MetricRow>

          <MetricRow>
            <MetricLabel>Current Streak</MetricLabel>
            <MetricValue>{analyticsData.performance.streak}W</MetricValue>
          </MetricRow>
        </AnalyticsCard>

        <AnalyticsCard>
          <CardHeader>
            <CardTitle>
              <CardIcon><Brain size={20} /></CardIcon>
              AI Insights
            </CardTitle>
            <ViewDetailButton>
              <Filter size={14} />
              Filter
              <ChevronRight size={14} />
            </ViewDetailButton>
          </CardHeader>

          {analyticsData.insights.map((insight, index) => (
            <InsightCard key={index}>
              <InsightTitle>
                <Target size={14} />
                {insight.title}
                <ConfidenceIndicator level={insight.confidence}>
                  {insight.confidence}% Confidence
                </ConfidenceIndicator>
              </InsightTitle>
              <InsightText>{insight.description}</InsightText>
            </InsightCard>
          ))}
        </AnalyticsCard>

        <AnalyticsCard>
          <CardHeader>
            <CardTitle>
              <CardIcon><Award size={20} /></CardIcon>
              Top Strategies
            </CardTitle>
            <ViewDetailButton>
              <DollarSign size={14} />
              ROI
              <ChevronRight size={14} />
            </ViewDetailButton>
          </CardHeader>

          {analyticsData.topStrategies.map((strategy, index) => (
            <div key={index}>
              <MetricRow>
                <div>
                  <MetricLabel style={{ display: 'block' }}>{strategy.name}</MetricLabel>
                  <small style={{ color: '#888', fontSize: '0.8rem' }}>
                    {strategy.games} games
                  </small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <MetricValue>{strategy.winRate}%</MetricValue>
                  <div style={{ fontSize: '0.9rem', color: '#FFD700', fontWeight: '600' }}>
                    +{strategy.roi}% ROI
                  </div>
                </div>
              </MetricRow>
              <ProgressBar>
                <ProgressFill percentage={strategy.winRate} />
              </ProgressBar>
            </div>
          ))}
        </AnalyticsCard>

        <AnalyticsCard>
          <CardHeader>
            <CardTitle>
              <CardIcon><Percent size={20} /></CardIcon>
              Market Analysis
            </CardTitle>
            <ViewDetailButton>
              <BarChart3 size={14} />
              Charts
              <ChevronRight size={14} />
            </ViewDetailButton>
          </CardHeader>

          <InsightCard>
            <InsightTitle>
              <TrendingUp size={14} />
              Value Betting Opportunities
            </InsightTitle>
            <InsightText>
              Current market inefficiencies identified in NFL playoff race scenarios. 
              Sportsbooks undervaluing teams with strong defensive metrics in cold weather conditions.
            </InsightText>
          </InsightCard>

          <InsightCard>
            <InsightTitle>
              <Target size={14} />
              Sharps vs Public Action
            </InsightTitle>
            <InsightText>
              67% of public money on favorites this week, but sharp action heavily favoring 
              underdogs. Historical 72% hit rate when following this contrarian approach.
            </InsightText>
          </InsightCard>

          <MetricRow>
            <MetricLabel>Market Edge Identified</MetricLabel>
            <MetricValue>12 Games</MetricValue>
          </MetricRow>

          <MetricRow>
            <MetricLabel>Avg Value</MetricLabel>
            <MetricValue>+8.3%</MetricValue>
          </MetricRow>
        </AnalyticsCard>
      </AnalyticsGrid>
    </DashboardContainer>
  );
};

export default AnalyticsDashboard;
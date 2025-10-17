import React from 'react';
import styled from 'styled-components';
import { BarChart3, TrendingUp, TrendingDown, Target, DollarSign, Clock } from 'lucide-react';
import MasterUserCard from '../components/MasterUser/MasterUserCard';
import { useUsageTracking } from '../hooks/useUsageTracking';

const DashboardContainer = styled.div`
  padding: ${props => props.theme.spacing.lg};
  max-width: 1200px;
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xl};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const StatCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  transition: transform 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const StatTitle = styled.h3`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
`;

const StatIcon = styled.div`
  color: ${props => props.color || props.theme.colors.accent.primary};
  padding: ${props => props.theme.spacing.xs};
  border-radius: ${props => props.theme.borderRadius.sm};
  background: ${props => (props.color || props.theme.colors.accent.primary)}20;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const StatChange = styled.div`
  color: ${props => 
    props.change > 0 ? props.theme.colors.betting.positive :
    props.change < 0 ? props.theme.colors.betting.negative :
    props.theme.colors.text.muted
  };
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const RecentActivity = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.background.secondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border-left: 3px solid ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.betting.neutral
  };
`;

const ActivityIcon = styled.div`
  color: ${props => props.theme.colors.accent.primary};
  background: ${props => props.theme.colors.accent.primary}20;
  padding: ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
`;

const ActivityDetails = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-weight: 500;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ActivityMeta = styled.div`
  color: ${props => props.theme.colors.text.muted};
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ActivityAmount = styled.div`
  color: ${props => 
    props.result === 'win' ? props.theme.colors.betting.positive :
    props.result === 'loss' ? props.theme.colors.betting.negative :
    props.theme.colors.text.primary
  };
  font-weight: 600;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl};
  color: ${props => props.theme.colors.text.muted};
`;

const DashboardPage = () => {
  const { isMasterUser } = useUsageTracking();

  // Mock data - replace with real data from API
  const stats = {
    totalParlays: 24,
    winRate: 67.5,
    totalWinnings: 1248.50,
    avgConfidence: 73.2
  };

  const recentActivity = [
    {
      id: 1,
      title: '5-Leg NBA Parlay',
      description: 'Lakers ML, Warriors -3.5, Over 225.5',
      amount: 125.50,
      result: 'win',
      date: '2 hours ago'
    },
    {
      id: 2,
      title: '3-Leg NFL Parlay',
      description: 'Chiefs ML, Eagles -7, Under 52.5',
      amount: -50.00,
      result: 'loss',
      date: '1 day ago'
    },
    {
      id: 3,
      title: '4-Leg MLB Parlay',
      description: 'Yankees ML, Dodgers -1.5, Over 9.5',
      amount: 85.75,
      result: 'win',
      date: '2 days ago'
    }
  ];

  return (
    <DashboardContainer>
      <PageTitle>
        <BarChart3 size={32} />
        Dashboard
      </PageTitle>

      {isMasterUser && <MasterUserCard />}

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <StatTitle>Total Parlays</StatTitle>
            <StatIcon>
              <Target size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.totalParlays}</StatValue>
          <StatChange change={1}>
            <TrendingUp size={16} />
            +3 this week
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Win Rate</StatTitle>
            <StatIcon color="#51cf66">
              <TrendingUp size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.winRate}%</StatValue>
          <StatChange change={1}>
            <TrendingUp size={16} />
            +5.2% vs last month
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Total Winnings</StatTitle>
            <StatIcon color="#51cf66">
              <DollarSign size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>${stats.totalWinnings.toFixed(2)}</StatValue>
          <StatChange change={1}>
            <TrendingUp size={16} />
            +$247.30 this week
          </StatChange>
        </StatCard>
        
        <StatCard>
          <StatHeader>
            <StatTitle>Avg AI Confidence</StatTitle>
            <StatIcon color="#ffb347">
              <BarChart3 size={20} />
            </StatIcon>
          </StatHeader>
          <StatValue>{stats.avgConfidence}%</StatValue>
          <StatChange change={-1}>
            <TrendingDown size={16} />
            -2.1% vs last month
          </StatChange>
        </StatCard>
      </StatsGrid>
      
      <RecentActivity>
        <SectionTitle>
          <Clock size={24} />
          Recent Activity
        </SectionTitle>
        
        {recentActivity.length > 0 ? (
          <ActivityList>
            {recentActivity.map(activity => (
              <ActivityItem key={activity.id} result={activity.result}>
                <ActivityIcon>
                  <Target size={20} />
                </ActivityIcon>
                <ActivityDetails>
                  <ActivityTitle>{activity.title}</ActivityTitle>
                  <ActivityMeta>
                    {activity.description} • {activity.date}
                  </ActivityMeta>
                </ActivityDetails>
                <ActivityAmount result={activity.result}>
                  {activity.amount > 0 ? '+' : ''}${Math.abs(activity.amount).toFixed(2)}
                </ActivityAmount>
              </ActivityItem>
            ))}
          </ActivityList>
        ) : (
          <EmptyState>
            No recent activity. Start building your first parlay!
          </EmptyState>
        )}
      </RecentActivity>
    </DashboardContainer>
  );
};

export default DashboardPage;
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { isMasterAdmin } from '../services/masterAdminService';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Styled Components
const AnalyticsContainer = styled.div`
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  background: ${props => props.theme.colors.background.primary};
  min-height: 100vh;
`;

const AnalyticsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 12px;
`;

const AnalyticsTitle = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ExportButton = styled.button`
  background: ${props => props.theme.colors.primary.main};
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme.colors.primary.dark};
    transform: translateY(-1px);
  }
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AnalyticsCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const CardTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
`;

const MetricItem = styled.div`
  text-align: center;
  padding: 15px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border.secondary};
`;

const MetricIcon = styled.div`
  font-size: 1.5rem;
  margin-bottom: 5px;
`;

const MetricLabel = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.85rem;
  margin-bottom: 5px;
`;

const MetricValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.5rem;
  font-weight: 700;
`;

const MetricTrend = styled.div`
  font-size: 0.75rem;
  margin-top: 4px;
  color: ${props => props.trend > 0 ? '#4CAF50' : props.trend < 0 ? '#f44336' : props.theme.colors.text.secondary};
`;

const ActivityFeed = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: 12px;
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 8px;
  background: ${props => props.theme.colors.background.secondary};
  border-radius: 8px;
  border-left: 3px solid ${props => props.theme.colors.primary.main};
`;

const ActivityText = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 0.9rem;
`;

const ActivityTime = styled.div`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.8rem;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`;

const ErrorMessage = styled.div`
  color: #f44336;
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  text-align: center;
`;

// Component Functions
const Metric = ({ label, value, icon, trend }) => (
  <MetricItem>
    <MetricIcon>{icon}</MetricIcon>
    <MetricLabel>{label}</MetricLabel>
    <MetricValue>{value}</MetricValue>
    {trend !== undefined && (
      <MetricTrend trend={trend}>
        {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'} {Math.abs(trend)}%
      </MetricTrend>
    )}
  </MetricItem>
);

const UserMetrics = ({ data }) => {
  if (!data) return <LoadingContainer><LoadingSpinner /></LoadingContainer>;

  return (
    <AnalyticsCard>
      <CardTitle>👥 User Metrics</CardTitle>
      <MetricsGrid>
        <Metric label="Total Users" value={data.totalUsers} icon="👥" />
        <Metric label="Active Today" value={data.activeToday} icon="🟢" />
        <Metric label="New This Week" value={data.newThisWeek} icon="🆕" trend={data.newUserTrend} />
        <Metric label="New This Month" value={data.newThisMonth} icon="📈" />
      </MetricsGrid>
    </AnalyticsCard>
  );
};

const SubscriptionMetrics = ({ data }) => {
  if (!data) return <LoadingContainer><LoadingSpinner /></LoadingContainer>;

  return (
    <AnalyticsCard>
      <CardTitle>💳 Subscription Analytics</CardTitle>
      <MetricsGrid>
        <MetricItem>
          <MetricLabel>Starter Plan</MetricLabel>
          <MetricValue>{data.starterCount}</MetricValue>
          <MetricTrend>{data.starterPercent}%</MetricTrend>
        </MetricItem>
        <MetricItem>
          <MetricLabel>Pro Plan</MetricLabel>
          <MetricValue>{data.proCount}</MetricValue>
          <MetricTrend>{data.proPercent}%</MetricTrend>
        </MetricItem>
        <MetricItem>
          <MetricLabel>Elite Plan</MetricLabel>
          <MetricValue>{data.eliteCount}</MetricValue>
          <MetricTrend>{data.elitePercent}%</MetricTrend>
        </MetricItem>
      </MetricsGrid>
    </AnalyticsCard>
  );
};

const SportsbookClicks = ({ data }) => {
  if (!data) return <LoadingContainer><LoadingSpinner /></LoadingContainer>;

  return (
    <AnalyticsCard>
      <CardTitle>🎯 Sportsbook Referrals</CardTitle>
      {data.sportsbookStats?.map(sb => (
        <div key={sb.name} style={{ marginBottom: '15px', padding: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>{sb.name}</div>
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem' }}>
            <span>Today: {sb.clicksToday}</span>
            <span>Week: {sb.clicksWeek}</span>
            <span>Month: {sb.clicksMonth}</span>
            <span>Total: {sb.clicksTotal}</span>
          </div>
        </div>
      ))}
    </AnalyticsCard>
  );
};

const FeatureUsage = ({ data }) => {
  if (!data) return <LoadingContainer><LoadingSpinner /></LoadingContainer>;

  return (
    <AnalyticsCard>
      <CardTitle>🔧 Feature Usage</CardTitle>
      <MetricsGrid>
        <Metric label="AI Evaluations" value={data.aiEvaluations || 0} icon="🤖" trend={data.aiEvaluationsTrend} />
        <Metric label="Odds Comparisons" value={data.oddsComparisons || 0} icon="📊" trend={data.oddsComparisonsTrend} />
        <Metric label="AI Top 5 Views" value={data.aiTop5Views || 0} icon="🎯" trend={data.aiTop5Trend} />
        <Metric label="Bets Tracked" value={data.betsTracked || 0} icon="💰" trend={data.betsTrackedTrend} />
      </MetricsGrid>
    </AnalyticsCard>
  );
};

const RealtimeActivityFeed = ({ activities }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <ActivityFeed>
      <CardTitle>🔴 Real-Time Activity</CardTitle>
      {activities?.length ? (
        activities.map((activity, index) => (
          <ActivityItem key={activity.id || index}>
            <ActivityText>{activity.text}</ActivityText>
            <ActivityTime>{formatTime(activity.timestamp)}</ActivityTime>
          </ActivityItem>
        ))
      ) : (
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No recent activity
        </div>
      )}
    </ActivityFeed>
  );
};

// Analytics data fetching functions
const getAdminAnalytics = async () => {
  try {
    // Query Firestore for all analytics data
    const usersSnap = await getDocs(collection(db, 'users'));
    const clicksQuery = query(collection(db, 'sportsbookClicks'), orderBy('timestamp', 'desc'), limit(100));
    const clicksSnap = await getDocs(clicksQuery);

    // Calculate user metrics
    const totalUsers = usersSnap.size;
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeToday = users.filter(u => {
      if (!u.lastActive) return false;
      const lastActive = u.lastActive.toDate ? u.lastActive.toDate() : new Date(u.lastActive);
      return lastActive >= today;
    }).length;

    const newThisWeek = users.filter(u => {
      if (!u.createdAt) return false;
      const createdAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return createdAt >= weekAgo;
    }).length;

    const newThisMonth = users.filter(u => {
      if (!u.createdAt) return false;
      const createdAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
      return createdAt >= monthAgo;
    }).length;

    // Calculate subscription metrics
    const starterCount = users.filter(u => u.subscription?.tier === 'starter').length;
    const proCount = users.filter(u => u.subscription?.tier === 'pro').length;
    const eliteCount = users.filter(u => u.subscription?.tier === 'elite').length;
    const freeCount = users.filter(u => !u.subscription?.tier || u.subscription?.tier === 'free').length;

    // Calculate sportsbook clicks
    const clicks = clicksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const sportsbookStats = calculateSportsbookStats(clicks);

    // Generate recent activity
    const recentActivity = await generateRecentActivity(users, clicks);

    return {
      users: {
        totalUsers,
        activeToday,
        newThisWeek,
        newThisMonth,
        newUserTrend: 5 // Mock trend data
      },
      subscriptions: {
        starterCount,
        proCount,
        eliteCount,
        freeCount,
        starterPercent: totalUsers > 0 ? ((starterCount / totalUsers) * 100).toFixed(1) : '0',
        proPercent: totalUsers > 0 ? ((proCount / totalUsers) * 100).toFixed(1) : '0',
        elitePercent: totalUsers > 0 ? ((eliteCount / totalUsers) * 100).toFixed(1) : '0'
      },
      sportsbookClicks: {
        sportsbookStats,
        clicksByContext: calculateClicksByContext(clicks)
      },
      featureUsage: {
        aiEvaluations: 45,
        oddsComparisons: 123,
        aiTop5Views: 89,
        betsTracked: 67,
        aiEvaluationsTrend: 12,
        oddsComparisonsTrend: 8,
        aiTop5Trend: -3,
        betsTrackedTrend: 15
      },
      recentActivity
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

const calculateSportsbookStats = (clicks) => {
  const sportsbookNames = ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars', 'PointsBet'];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return sportsbookNames.map(name => {
    const sbClicks = clicks.filter(click => click.sportsbook === name);

    const clicksToday = sbClicks.filter(click => {
      const clickTime = click.timestamp?.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
      return clickTime >= today;
    }).length;

    const clicksWeek = sbClicks.filter(click => {
      const clickTime = click.timestamp?.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
      return clickTime >= weekAgo;
    }).length;

    const clicksMonth = sbClicks.filter(click => {
      const clickTime = click.timestamp?.toDate ? click.timestamp.toDate() : new Date(click.timestamp);
      return clickTime >= monthAgo;
    }).length;

    return {
      name,
      clicksToday,
      clicksWeek,
      clicksMonth,
      clicksTotal: sbClicks.length
    };
  });
};

const calculateClicksByContext = (clicks) => {
  return {
    aiTop5: clicks.filter(c => c.context === 'ai-top-5').length,
    oddsComparison: clicks.filter(c => c.context === 'odds-comparison').length,
    parlayBuilder: clicks.filter(c => c.context === 'parlay-builder').length,
    liveOdds: clicks.filter(c => c.context === 'live-odds').length
  };
};

const generateRecentActivity = async (users, clicks) => {
  const activities = [];

  // Add recent user signups
  const recentUsers = users
    .filter(u => u.createdAt)
    .sort((a, b) => {
      const aTime = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const bTime = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return bTime - aTime;
    })
    .slice(0, 5);

  recentUsers.forEach(user => {
    activities.push({
      id: `signup-${user.id}`,
      text: `User ${user.email} signed up`,
      timestamp: user.createdAt
    });
  });

  // Add recent sportsbook clicks
  const recentClicks = clicks.slice(0, 10);
  recentClicks.forEach(click => {
    activities.push({
      id: `click-${click.id}`,
      text: `User clicked ${click.sportsbook} link`,
      timestamp: click.timestamp
    });
  });

  return activities.sort((a, b) => {
    const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
    const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
    return bTime - aTime;
  }).slice(0, 20);
};

// Export functionality
const exportAnalytics = async (analytics) => {
  const csvData = [
    'Metric,Value',
    `Total Users,${analytics.users.totalUsers}`,
    `Active Today,${analytics.users.activeToday}`,
    `New This Week,${analytics.users.newThisWeek}`,
    `New This Month,${analytics.users.newThisMonth}`,
    `Starter Subscriptions,${analytics.subscriptions.starterCount}`,
    `Pro Subscriptions,${analytics.subscriptions.proCount}`,
    `Elite Subscriptions,${analytics.subscriptions.eliteCount}`,
    `AI Evaluations,${analytics.featureUsage.aiEvaluations}`,
    `Odds Comparisons,${analytics.featureUsage.oddsComparisons}`,
    `AI Top 5 Views,${analytics.featureUsage.aiTop5Views}`,
    `Bets Tracked,${analytics.featureUsage.betsTracked}`
  ].join('\n');

  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Main Component
const AdminAnalyticsPage = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && isMasterAdmin(user)) {
      loadAnalytics();
      const interval = setInterval(loadAnalytics, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  // Redirect if not Master Admin
  if (!user || !isMasterAdmin(user)) {
    return <Navigate to="/dashboard" />;
  }

  const loadAnalytics = async () => {
    try {
      setError(null);
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (analytics) {
      exportAnalytics(analytics);
    }
  };

  if (loading) {
    return (
      <AnalyticsContainer>
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      </AnalyticsContainer>
    );
  }

  if (error) {
    return (
      <AnalyticsContainer>
        <ErrorMessage>{error}</ErrorMessage>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <AnalyticsHeader>
        <AnalyticsTitle>
          👑 Master Admin Analytics
        </AnalyticsTitle>
        <ExportButton onClick={handleExport}>
          📥 Export Data
        </ExportButton>
      </AnalyticsHeader>

      <AnalyticsGrid>
        <UserMetrics data={analytics?.users} />
        <SubscriptionMetrics data={analytics?.subscriptions} />
        <SportsbookClicks data={analytics?.sportsbookClicks} />
        <FeatureUsage data={analytics?.featureUsage} />
      </AnalyticsGrid>

      <RealtimeActivityFeed activities={analytics?.recentActivity} />
    </AnalyticsContainer>
  );
};

export default AdminAnalyticsPage;
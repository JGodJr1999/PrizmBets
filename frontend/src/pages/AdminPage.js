import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Calendar,
  AlertCircle,
  Crown,
  Mail,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { Navigate } from 'react-router-dom';

const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background.primary};
  padding: ${props => props.theme.spacing.xl} 0;
`;

const ContentContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${props => props.theme.spacing.lg};
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const Title = styled.h1`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 1.1rem;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const StatCard = styled(motion.div)`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => props.color || props.theme.colors.accent.primary};
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const StatIcon = styled.div`
  width: 50px;
  height: 50px;
  border-radius: ${props => props.theme.borderRadius.lg};
  background: ${props => props.color || props.theme.colors.accent.primary}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color || props.theme.colors.accent.primary};
`;

const StatTitle = styled.h3`
  color: ${props => props.theme.colors.text.secondary};
  font-size: 0.9rem;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  color: ${props => props.theme.colors.text.primary};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const StatChange = styled.div`
  color: ${props => props.positive ? '#4CAF50' : '#f44336'};
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${props => props.theme.spacing.xl};
  margin-bottom: ${props => props.theme.spacing.xxl};

  @media (max-width: ${props => props.theme.breakpoints.lg}) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
`;

const ChartTitle = styled.h3`
  color: ${props => props.theme.colors.text.primary};
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const TableSection = styled.div`
  background: ${props => props.theme.colors.background.card};
  border: 1px solid ${props => props.theme.colors.border.primary};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xl};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 1px solid ${props => props.theme.colors.border.primary};
`;

const TableRow = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border.secondary};

  &:last-child {
    border-bottom: none;
  }
`;

const TableHeaderCell = styled.th`
  padding: ${props => props.theme.spacing.md};
  text-align: left;
  color: ${props => props.theme.colors.text.secondary};
  font-weight: 600;
  font-size: 0.9rem;
`;

const TableCell = styled.td`
  padding: ${props => props.theme.spacing.md};
  color: ${props => props.theme.colors.text.primary};
`;

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.status) {
      case 'active': return '#4CAF5020';
      case 'pro': return '#ff8c4220';
      case 'premium': return '#f5940020';
      default: return '#6B728020';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#4CAF50';
      case 'pro': return '#ff8c42';
      case 'premium': return '#f59400';
      default: return '#6B7280';
    }
  }};
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

const AdminPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.getAdminDashboard();
      setDashboard(response);
    } catch (err) {
      setError('Failed to load admin dashboard');
      console.error('Admin dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingSpinner text="Loading admin dashboard..." />
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

  const stats = dashboard?.overview || {};
  const recentUsers = dashboard?.recent_users || [];
  const usageTrends = dashboard?.usage_trends || [];

  return (
    <PageContainer>
      <ContentContainer>
        <Header>
          <Title>
            <Crown size={32} />
            Admin Dashboard
          </Title>
          <Subtitle>
            Monitor platform performance, user activity, and system health
          </Subtitle>
        </Header>

        <DashboardGrid>
          <StatCard
            color="#4CAF50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatHeader>
              <StatTitle>Total Users</StatTitle>
              <StatIcon color="#4CAF50">
                <Users size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.total_users || 0}</StatValue>
            <StatChange positive={stats.user_growth >= 0}>
              <TrendingUp size={16} />
              {stats.user_growth || 0}% this month
            </StatChange>
          </StatCard>

          <StatCard
            color="#ff8c42"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatHeader>
              <StatTitle>Daily Evaluations</StatTitle>
              <StatIcon color="#ff8c42">
                <BarChart3 size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.daily_evaluations || 0}</StatValue>
            <StatChange positive={stats.evaluation_growth >= 0}>
              <TrendingUp size={16} />
              {stats.evaluation_growth || 0}% vs yesterday
            </StatChange>
          </StatCard>

          <StatCard
            color="#6366f1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatHeader>
              <StatTitle>Active Subscriptions</StatTitle>
              <StatIcon color="#6366f1">
                <DollarSign size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.active_subscriptions || 0}</StatValue>
            <StatChange positive={stats.subscription_growth >= 0}>
              <TrendingUp size={16} />
              {stats.subscription_growth || 0}% this month
            </StatChange>
          </StatCard>

          <StatCard
            color="#f59400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatHeader>
              <StatTitle>System Health</StatTitle>
              <StatIcon color="#f59400">
                <Server size={24} />
              </StatIcon>
            </StatHeader>
            <StatValue>{stats.system_health || 0}%</StatValue>
            <StatChange positive={stats.system_health >= 95}>
              <Database size={16} />
              All systems operational
            </StatChange>
          </StatCard>
        </DashboardGrid>

        <ChartsSection>
          <ChartCard>
            <ChartTitle>
              <BarChart3 size={20} />
              Usage Trends
            </ChartTitle>
            <div style={{ color: '#6B7280', textAlign: 'center', padding: '40px 0' }}>
              {usageTrends.length > 0 ? (
                <div>
                  <p>Last 7 days usage data:</p>
                  {usageTrends.slice(-7).map((trend, index) => (
                    <div key={index} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '8px 0',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <span>{trend.date}</span>
                      <span>{trend.evaluations} evaluations</span>
                    </div>
                  ))}
                </div>
              ) : (
                'Usage trends chart would be displayed here'
              )}
            </div>
          </ChartCard>

          <ChartCard>
            <ChartTitle>
              <Mail size={20} />
              Email Stats
            </ChartTitle>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: '#4CAF50' }}>
                  {stats.emails_sent || 0}
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  Emails sent this month
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#ff8c42' }}>
                  {stats.email_success_rate || 0}%
                </div>
                <div style={{ color: '#6B7280', fontSize: '0.9rem' }}>
                  Success rate
                </div>
              </div>
            </div>
          </ChartCard>
        </ChartsSection>

        <TableSection>
          <ChartTitle>
            <Users size={20} />
            Recent Users
          </ChartTitle>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell>Joined</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <tbody>
              {recentUsers.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.tier}>
                      {user.tier}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <StatusBadge status="active">
                      Active
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableSection>
      </ContentContainer>
    </PageContainer>
  );
};

export default AdminPage;
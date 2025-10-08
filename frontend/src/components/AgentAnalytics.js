import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Cpu,
  MemoryStick,
  Zap,
  Target,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import apiService from '../services/api';

const AnalyticsContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h2`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const TimeRangeSelect = styled.select`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
  }
`;

const RefreshButton = styled.button`
  background: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.colors?.accent?.secondary || '#7c3aed'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 12px;
  padding: 1.5rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.color || props.theme?.colors?.accent?.primary || '#8b5cf6'};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MetricInfo = styled.div`
  flex: 1;
`;

const MetricTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 500;
`;

const MetricValue = styled.div`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: ${props => {
    if (props.positive) return '#22c55e';
    if (props.negative) return '#ef4444';
    return props.theme?.colors?.text?.tertiary || '#666';
  }};
`;

const MetricIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || props.theme?.colors?.accent?.primary || '#8b5cf6'}20;
  color: ${props => props.color || props.theme?.colors?.accent?.primary || '#8b5cf6'};
`;

const ChartsSection = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 12px;
  padding: 1.5rem;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartContent = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  background: ${props => props.theme?.colors?.background?.tertiary || '#333'}20;
  border-radius: 8px;
  border: 2px dashed ${props => props.theme?.colors?.border?.secondary || '#444'};
`;

const AgentPerformanceTable = styled.div`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 12px;
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TableTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Table = styled.div`
  overflow-x: auto;
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444'};
  align-items: center;
  gap: 1rem;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme?.colors?.background?.tertiary || '#333'}20;
  }
`;

const TableHeaderRow = styled(TableRow)`
  background: ${props => props.theme?.colors?.background?.tertiary || '#333'}40;
  font-weight: 600;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  font-size: 0.9rem;

  &:hover {
    background: ${props => props.theme?.colors?.background?.tertiary || '#333'}40;
  }
`;

const AgentName = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-weight: 500;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  background: ${props => {
    switch (props.status) {
      case 'active': return 'rgba(34, 197, 94, 0.2)';
      case 'idle': return 'rgba(245, 158, 11, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.status) {
      case 'active': return '#22c55e';
      case 'idle': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const PerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background: ${props => props.theme?.colors?.background?.tertiary || '#333'};
  border-radius: 3px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${props => props.value}%;
    background: ${props => {
      if (props.value >= 80) return '#22c55e';
      if (props.value >= 60) return '#f59e0b';
      return '#ef4444';
    }};
    transition: width 0.3s ease;
  }
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
`;

const AgentAnalytics = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { state } = useAgent();

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockAnalytics = {
        overview: {
          totalTasks: 1247,
          tasksChange: 12.5,
          successRate: 94.2,
          successRateChange: 2.1,
          avgResponseTime: 1.8,
          responseTimeChange: -15.3,
          systemEfficiency: 87.6,
          efficiencyChange: 8.9,
          activeAgents: 28,
          totalAgents: 29
        },
        agentPerformance: [
          {
            name: 'sports_data_collector',
            status: 'active',
            taskCount: 156,
            successRate: 98.1,
            avgResponseTime: 1.2,
            efficiency: 95.4,
            lastActive: '2 min ago'
          },
          {
            name: 'odds_analyzer',
            status: 'active',
            taskCount: 142,
            successRate: 96.8,
            avgResponseTime: 2.1,
            efficiency: 92.3,
            lastActive: '1 min ago'
          },
          {
            name: 'trend_detector',
            status: 'idle',
            taskCount: 89,
            successRate: 91.2,
            avgResponseTime: 3.4,
            efficiency: 78.5,
            lastActive: '15 min ago'
          },
          {
            name: 'pattern_analyzer',
            status: 'active',
            taskCount: 134,
            successRate: 93.7,
            avgResponseTime: 1.9,
            efficiency: 89.1,
            lastActive: '30 sec ago'
          },
          {
            name: 'optimizer',
            status: 'active',
            taskCount: 67,
            successRate: 97.0,
            avgResponseTime: 4.2,
            efficiency: 91.8,
            lastActive: '3 min ago'
          },
          {
            name: 'error_handler',
            status: 'error',
            taskCount: 23,
            successRate: 56.5,
            avgResponseTime: 8.1,
            efficiency: 34.2,
            lastActive: '1 hour ago'
          }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'time':
        return `${value}s`;
      case 'number':
        return value.toLocaleString();
      default:
        return value;
    }
  };

  const getChangeIcon = (change) => {
    if (change > 0) return TrendingUp;
    if (change < 0) return TrendingDown;
    return Activity;
  };

  if (loading) {
    return (
      <AnalyticsContainer>
        <LoadingState>
          <BarChart3 size={24} />
          <span style={{ marginLeft: '0.5rem' }}>Loading analytics...</span>
        </LoadingState>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <Header>
        <Title>
          <BarChart3 size={24} />
          Agent Performance Analytics
        </Title>
        <Controls>
          <TimeRangeSelect
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="1d">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </TimeRangeSelect>
          <RefreshButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={16} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>
        </Controls>
      </Header>

      <MetricsGrid>
        <MetricCard
          color="#22c55e"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <MetricHeader>
            <MetricInfo>
              <MetricTitle>Total Tasks</MetricTitle>
              <MetricValue>{formatValue(analytics.overview.totalTasks, 'number')}</MetricValue>
              <MetricChange positive={analytics.overview.tasksChange > 0}>
                {React.createElement(getChangeIcon(analytics.overview.tasksChange), { size: 12 })}
                {Math.abs(analytics.overview.tasksChange)}%
              </MetricChange>
            </MetricInfo>
            <MetricIcon color="#22c55e">
              <Target size={24} />
            </MetricIcon>
          </MetricHeader>
        </MetricCard>

        <MetricCard
          color="#3b82f6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MetricHeader>
            <MetricInfo>
              <MetricTitle>Success Rate</MetricTitle>
              <MetricValue>{formatValue(analytics.overview.successRate, 'percentage')}</MetricValue>
              <MetricChange positive={analytics.overview.successRateChange > 0}>
                {React.createElement(getChangeIcon(analytics.overview.successRateChange), { size: 12 })}
                {Math.abs(analytics.overview.successRateChange)}%
              </MetricChange>
            </MetricInfo>
            <MetricIcon color="#3b82f6">
              <CheckCircle size={24} />
            </MetricIcon>
          </MetricHeader>
        </MetricCard>

        <MetricCard
          color="#f59e0b"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MetricHeader>
            <MetricInfo>
              <MetricTitle>Avg Response Time</MetricTitle>
              <MetricValue>{formatValue(analytics.overview.avgResponseTime, 'time')}</MetricValue>
              <MetricChange positive={analytics.overview.responseTimeChange < 0}>
                {React.createElement(getChangeIcon(analytics.overview.responseTimeChange), { size: 12 })}
                {Math.abs(analytics.overview.responseTimeChange)}%
              </MetricChange>
            </MetricInfo>
            <MetricIcon color="#f59e0b">
              <Clock size={24} />
            </MetricIcon>
          </MetricHeader>
        </MetricCard>

        <MetricCard
          color="#8b5cf6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <MetricHeader>
            <MetricInfo>
              <MetricTitle>System Efficiency</MetricTitle>
              <MetricValue>{formatValue(analytics.overview.systemEfficiency, 'percentage')}</MetricValue>
              <MetricChange positive={analytics.overview.efficiencyChange > 0}>
                {React.createElement(getChangeIcon(analytics.overview.efficiencyChange), { size: 12 })}
                {Math.abs(analytics.overview.efficiencyChange)}%
              </MetricChange>
            </MetricInfo>
            <MetricIcon color="#8b5cf6">
              <Zap size={24} />
            </MetricIcon>
          </MetricHeader>
        </MetricCard>
      </MetricsGrid>

      <ChartsSection>
        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <LineChart size={20} />
              Performance Trends
            </ChartTitle>
          </ChartHeader>
          <ChartContent>
            <div>
              <LineChart size={48} />
              <p>Performance chart visualization would be implemented here</p>
            </div>
          </ChartContent>
        </ChartCard>

        <ChartCard>
          <ChartHeader>
            <ChartTitle>
              <PieChart size={20} />
              Task Distribution
            </ChartTitle>
          </ChartHeader>
          <ChartContent>
            <div>
              <PieChart size={48} />
              <p>Task distribution chart would be implemented here</p>
            </div>
          </ChartContent>
        </ChartCard>
      </ChartsSection>

      <AgentPerformanceTable>
        <TableHeader>
          <TableTitle>
            <Activity size={20} />
            Agent Performance Details
          </TableTitle>
        </TableHeader>
        <Table>
          <TableHeaderRow>
            <div>Agent Name</div>
            <div>Status</div>
            <div>Tasks</div>
            <div>Success Rate</div>
            <div>Response Time</div>
            <div>Efficiency</div>
          </TableHeaderRow>
          {analytics.agentPerformance.map((agent, index) => (
            <TableRow key={agent.name}>
              <AgentName>
                <Cpu size={16} />
                {agent.name}
              </AgentName>
              <StatusBadge status={agent.status}>
                {agent.status}
              </StatusBadge>
              <div>{agent.taskCount}</div>
              <div>
                <div style={{ marginBottom: '0.25rem' }}>{agent.successRate}%</div>
                <PerformanceBar value={agent.successRate} />
              </div>
              <div>{agent.avgResponseTime}s</div>
              <div>
                <div style={{ marginBottom: '0.25rem' }}>{agent.efficiency}%</div>
                <PerformanceBar value={agent.efficiency} />
              </div>
            </TableRow>
          ))}
        </Table>
      </AgentPerformanceTable>
    </AnalyticsContainer>
  );
};

export default AgentAnalytics;
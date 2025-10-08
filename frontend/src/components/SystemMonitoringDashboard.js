import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw,
  Shield,
  Users,
  Server,
  Monitor,
  Wifi,
  HardDrive,
  MemoryStick,
  Timer,
  Target,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { toast } from 'react-hot-toast';

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
  padding: 1.5rem;
  box-shadow: ${props => props.theme?.shadows?.md || '0 4px 6px rgba(0, 0, 0, 0.4)'};
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const MetricTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => {
    if (props.status === 'error') return props.theme?.colors?.status?.error || '#ff6b6b';
    if (props.status === 'warning') return props.theme?.colors?.status?.warning || '#FFA500';
    if (props.status === 'success') return props.theme?.colors?.status?.success || '#32CD32';
    return props.theme?.colors?.accent?.primary || '#FFD700';
  }};
  margin-bottom: 0.5rem;
`;

const MetricSubtext = styled.div`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const AlertsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlertsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const AlertCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => {
    if (props.severity === 'critical') return props.theme?.colors?.status?.error || '#ff6b6b';
    if (props.severity === 'warning') return props.theme?.colors?.status?.warning || '#FFA500';
    return props.theme?.colors?.border?.primary || '#333333';
  }};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AlertIcon = styled.div`
  color: ${props => {
    if (props.severity === 'critical') return props.theme?.colors?.status?.error || '#ff6b6b';
    if (props.severity === 'warning') return props.theme?.colors?.status?.warning || '#FFA500';
    return props.theme?.colors?.status?.info || '#4ECDC4';
  }};
  flex-shrink: 0;
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const AlertDescription = styled.div`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 0.9rem;
`;

const AlertTime = styled.div`
  color: ${props => props.theme?.colors?.text?.muted || '#888888'};
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const ChartContainer = styled.div`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const ChartHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const ChartTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RefreshButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.colors?.accent?.primary || '#FFD700'}10;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const SimpleChart = styled.div`
  height: 200px;
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-style: italic;
`;

const LoadingSpinner = styled(motion.div)`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.theme?.colors?.accent?.primary || '#FFD700'}30;
  border-top: 2px solid ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  border-radius: 50%;
`;

const SystemMonitoringDashboard = () => {
  const [metrics, setMetrics] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { state } = useAgent();

  // Mock system metrics (in production, this would come from real monitoring)
  const mockMetrics = {
    systemHealth: {
      value: state.agents?.length > 0 ? 95 : 0,
      status: state.agents?.length > 0 ? 'success' : 'warning',
      unit: '%',
      change: '+2.3',
      subtitle: 'Overall system performance'
    },
    activeAgents: {
      value: state.agents?.filter(a => a.status === 'active')?.length || 0,
      status: 'success',
      unit: '',
      change: '+3',
      subtitle: `of ${state.agents?.length || 0} total agents`
    },
    responseTime: {
      value: Math.floor(Math.random() * 50) + 150,
      status: 'success',
      unit: 'ms',
      change: '-12',
      subtitle: 'Average API response time'
    },
    errorRate: {
      value: Math.random() * 2,
      status: Math.random() > 0.7 ? 'warning' : 'success',
      unit: '%',
      change: '-0.5',
      subtitle: 'Error rate (last 24h)'
    },
    memoryUsage: {
      value: Math.floor(Math.random() * 30) + 45,
      status: 'success',
      unit: '%',
      change: '+5.2',
      subtitle: 'System memory utilization'
    },
    cpuUsage: {
      value: Math.floor(Math.random() * 25) + 35,
      status: 'success',
      unit: '%',
      change: '+1.8',
      subtitle: 'CPU utilization'
    }
  };

  const mockAlerts = [
    {
      id: 1,
      title: 'High Response Time',
      description: 'API response time exceeded threshold for odds-analyzer agent',
      severity: 'warning',
      time: '2 minutes ago',
      icon: Clock
    },
    {
      id: 2,
      title: 'Agent Restart',
      description: 'market-scanner agent automatically restarted after memory limit',
      severity: 'info',
      time: '15 minutes ago',
      icon: RefreshCw
    },
    {
      id: 3,
      title: 'System Health Check',
      description: 'All systems operating normally',
      severity: 'success',
      time: '1 hour ago',
      icon: CheckCircle
    }
  ];

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(mockMetrics);
        setAlerts(mockAlerts);
      } catch (error) {
        console.error('Failed to load system metrics:', error);
        toast.error('Failed to load system metrics');
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [state.agents]);

  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setMetrics(mockMetrics);
      setAlerts(mockAlerts);
      toast.success('Metrics refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical': return XCircle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      default: return AlertCircle;
    }
  };

  if (loading && Object.keys(metrics).length === 0) {
    return (
      <DashboardContainer>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
          <LoadingSpinner
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <span style={{ marginLeft: '1rem' }}>Loading system metrics...</span>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <SectionTitle>
          <Monitor size={24} />
          System Monitoring Dashboard
        </SectionTitle>
        <RefreshButton onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </RefreshButton>
      </div>

      <MetricsGrid>
        {Object.entries(metrics).map(([key, metric]) => (
          <MetricCard
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MetricHeader>
              <MetricTitle>
                {key === 'systemHealth' && <Shield size={18} />}
                {key === 'activeAgents' && <Users size={18} />}
                {key === 'responseTime' && <Zap size={18} />}
                {key === 'errorRate' && <AlertTriangle size={18} />}
                {key === 'memoryUsage' && <MemoryStick size={18} />}
                {key === 'cpuUsage' && <Cpu size={18} />}
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </MetricTitle>
            </MetricHeader>
            <MetricValue status={metric.status}>
              {metric.value}{metric.unit}
            </MetricValue>
            <MetricSubtext>
              {metric.change?.startsWith('+') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {metric.change} {metric.subtitle}
            </MetricSubtext>
          </MetricCard>
        ))}
      </MetricsGrid>

      <AlertsSection>
        <SectionTitle>
          <AlertTriangle size={20} />
          Recent Alerts
        </SectionTitle>
        <AlertsList>
          <AnimatePresence>
            {alerts.map((alert, index) => {
              const IconComponent = getAlertIcon(alert.severity);
              return (
                <AlertCard
                  key={alert.id}
                  severity={alert.severity}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <AlertIcon severity={alert.severity}>
                    <IconComponent size={20} />
                  </AlertIcon>
                  <AlertContent>
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.description}</AlertDescription>
                  </AlertContent>
                  <AlertTime>{alert.time}</AlertTime>
                </AlertCard>
              );
            })}
          </AnimatePresence>
        </AlertsList>
      </AlertsSection>

      <ChartContainer>
        <ChartHeader>
          <ChartTitle>
            <BarChart3 size={20} />
            Performance Trends
          </ChartTitle>
        </ChartHeader>
        <SimpleChart>
          📊 Chart visualization would be implemented here
          <br />
          (Using Chart.js or similar charting library)
        </SimpleChart>
      </ChartContainer>
    </DashboardContainer>
  );
};

export default SystemMonitoringDashboard;
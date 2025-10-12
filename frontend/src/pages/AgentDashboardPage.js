import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  Database,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings,
  Play,
  Square,
  RotateCcw,
  Zap,
  TrendingUp,
  Users,
  Shield,
  Brain,
  Target,
  Globe,
  Layers,
  Monitor,
  GitBranch
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary';
import AgentTemplates from '../components/Agent/AgentTemplates';
import AgentAnalytics from '../components/Agent/AgentAnalytics';
import SystemMonitoringDashboard from '../components/SystemMonitoringDashboard';
import WorkflowDesigner from '../components/WorkflowDesigner';
import { Navigate } from 'react-router-dom';

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
  padding: ${props => props.theme?.spacing?.xl || '2rem'} 0;
`;

const ContentContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 ${props => props.theme?.spacing?.lg || '1.5rem'};
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme?.spacing?.xxl || '3rem'};
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${props => props.theme?.spacing?.lg || '1.5rem'};
`;

const HeaderContent = styled.div`
  flex: 1;
  min-width: 300px;
`;

const Title = styled.h1`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: ${props => props.theme?.spacing?.sm || '0.5rem'};
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.md || '1rem'};
`;

const Subtitle = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 1.1rem;
  margin-bottom: ${props => props.theme?.spacing?.md || '1rem'};
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.sm || '0.5rem'};
  padding: ${props => props.theme?.spacing?.sm || '0.5rem'} ${props => props.theme?.spacing?.md || '1rem'};
  background: ${props => {
    const { status, theme } = props;
    if (status === 'active') return theme?.colors?.status?.success || '#32CD32';
    if (status === 'error') return theme?.colors?.status?.error || '#ff6b6b';
    if (status === 'starting') return theme?.colors?.status?.warning || '#FFA500';
    return theme?.colors?.background?.secondary || '#1a1a1a';
  }};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  font-weight: 500;
  color: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
`;

const HeaderActions = styled.div`
  display: flex;
  gap: ${props => props.theme?.spacing?.md || '1rem'};
  flex-wrap: wrap;
`;

const ActionButton = styled(motion.button)`
  background: ${props => props.primary ?
    `linear-gradient(135deg, ${props.theme?.colors?.accent?.primary || '#FFD700'}, ${props.theme?.colors?.accent?.primary || '#FFD700'}dd)` :
    'transparent'
  };
  border: 1px solid ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: ${props => props.theme?.spacing?.sm || '0.5rem'} ${props => props.theme?.spacing?.lg || '1.5rem'};
  color: ${props => props.primary ?
    props.theme?.colors?.background?.primary || '#0a0a0a' :
    props.theme?.colors?.accent?.primary || '#FFD700'
  };
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.xs || '0.25rem'};

  &:hover {
    transform: translateY(-1px);
    box-shadow: ${props => props.theme?.shadows?.md || '0 4px 6px rgba(0, 0, 0, 0.4)'};
    background: ${props => props.primary ?
      props.theme?.colors?.accent?.primary || '#FFD700' :
      `${props.theme?.colors?.accent?.primary || '#FFD700'}10`
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${props => props.theme?.spacing?.lg || '1.5rem'};
  margin-bottom: ${props => props.theme?.spacing?.xxl || '3rem'};
`;

const MetricCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
  padding: ${props => props.theme?.spacing?.xl || '2rem'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      const { status, theme } = props;
      if (status === 'success') return theme?.colors?.status?.success || '#32CD32';
      if (status === 'error') return theme?.colors?.status?.error || '#ff6b6b';
      if (status === 'warning') return theme?.colors?.status?.warning || '#FFA500';
      return theme?.colors?.accent?.primary || '#FFD700';
    }};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme?.spacing?.md || '1rem'};
`;

const MetricIcon = styled.div`
  color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  font-size: 1.5rem;
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  margin-bottom: ${props => props.theme?.spacing?.xs || '0.25rem'};
`;

const MetricLabel = styled.div`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 0.9rem;
  margin-bottom: ${props => props.theme?.spacing?.sm || '0.5rem'};
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.xs || '0.25rem'};
  font-size: 0.8rem;
  color: ${props => {
    const { change, theme } = props;
    if (change > 0) return theme?.colors?.status?.success || '#32CD32';
    if (change < 0) return theme?.colors?.status?.error || '#ff6b6b';
    return theme?.colors?.text?.muted || '#888888';
  }};
`;

const TabNavigation = styled.div`
  display: flex;
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 2rem;
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
`;

const TabButton = styled.button`
  background: ${props => props.active
    ? (props.theme?.colors?.accent?.primary || '#8b5cf6')
    : 'transparent'
  };
  color: ${props => props.active
    ? '#ffffff'
    : (props.theme?.colors?.text?.secondary || '#a0a0a0')
  };
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  flex: 1;
  justify-content: center;

  &:hover {
    background: ${props => props.active
      ? (props.theme?.colors?.accent?.secondary || '#7c3aed')
      : (props.theme?.colors?.background?.tertiary || '#333')
    };
  }
`;

const TabContent = styled.div`
  width: 100%;
`;

const AgentsSection = styled.div`
  margin-bottom: ${props => props.theme?.spacing?.xxl || '3rem'};
`;

const SectionTitle = styled.h2`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme?.spacing?.lg || '1.5rem'};
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.sm || '0.5rem'};
`;

const AgentsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: ${props => props.theme?.spacing?.lg || '1.5rem'};
`;

const AgentCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
  padding: ${props => props.theme?.spacing?.lg || '1.5rem'};
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.theme?.shadows?.lg || '0 10px 15px rgba(0, 0, 0, 0.5)'};
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  }
`;

const AgentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme?.spacing?.md || '1rem'};
`;

const AgentInfo = styled.div`
  flex: 1;
`;

const AgentName = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: ${props => props.theme?.spacing?.xs || '0.25rem'};
`;

const AgentDescription = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 0.9rem;
  line-height: 1.4;
`;

const AgentStatus = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme?.spacing?.xs || '0.25rem'};
  padding: ${props => props.theme?.spacing?.xs || '0.25rem'} ${props => props.theme?.spacing?.sm || '0.5rem'};
  border-radius: ${props => props.theme?.borderRadius?.full || '9999px'};
  font-size: 0.8rem;
  font-weight: 500;
  background: ${props => {
    const { status, theme } = props;
    if (status === 'active') return `${theme?.colors?.status?.success || '#32CD32'}20`;
    if (status === 'error') return `${theme?.colors?.status?.error || '#ff6b6b'}20`;
    if (status === 'starting' || status === 'stopping') return `${theme?.colors?.status?.warning || '#FFA500'}20`;
    return `${theme?.colors?.text?.muted || '#888888'}20`;
  }};
  color: ${props => {
    const { status, theme } = props;
    if (status === 'active') return theme?.colors?.status?.success || '#32CD32';
    if (status === 'error') return theme?.colors?.status?.error || '#ff6b6b';
    if (status === 'starting' || status === 'stopping') return theme?.colors?.status?.warning || '#FFA500';
    return theme?.colors?.text?.muted || '#888888';
  }};
`;

const AgentControls = styled.div`
  display: flex;
  gap: ${props => props.theme?.spacing?.xs || '0.25rem'};
  margin-top: ${props => props.theme?.spacing?.md || '1rem'};
`;

const ControlButton = styled(motion.button)`
  background: transparent;
  border: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444444'};
  border-radius: ${props => props.theme?.borderRadius?.sm || '4px'};
  padding: ${props => props.theme?.spacing?.xs || '0.25rem'};
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
    color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
    background: ${props => `${props.theme?.colors?.accent?.primary || '#FFD700'}10`};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: ${props => props.theme?.spacing?.xxl || '3rem'};
  color: ${props => props.theme?.colors?.status?.error || '#ff6b6b'};
`;

// Agent type icons mapping
const AGENT_ICONS = {
  marketing_manager: Globe,
  security_manager: Shield,
  testing_quality_manager: Target,
  data_analytics_manager: BarChart3,
  performance_manager: Zap,
  content_manager: Layers,
  ux_manager: Users,
  devops_manager: Database,
  compliance_manager: CheckCircle,
  ui_enhancement_manager: Brain
};

// Main Component
const AgentDashboardPage = () => {
  const { isAuthenticated } = useAuth();
  const {
    isLoading,
    isInitialized,
    systemStatus,
    agents,
    totalAgents,
    activeAgents,
    metrics,
    error,
    initializeAgents,
    startAgent,
    stopAgent,
    restartAgent,
    clearError,
    AGENT_STATUS
  } = useAgent();

  const [initializingSystem, setInitializingSystem] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Initialize system handler
  const handleInitializeSystem = async () => {
    setInitializingSystem(true);
    try {
      await initializeAgents({
        auto_start: true,
        enable_monitoring: true
      });
    } catch (error) {
      console.error('Failed to initialize system:', error);
    } finally {
      setInitializingSystem(false);
    }
  };

  // Status icon helper
  const getStatusIcon = (status) => {
    switch (status) {
      case AGENT_STATUS.ACTIVE:
        return <CheckCircle size={16} />;
      case AGENT_STATUS.ERROR:
        return <XCircle size={16} />;
      case AGENT_STATUS.STARTING:
      case AGENT_STATUS.STOPPING:
        return <Clock size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  // System status display
  const getSystemStatus = () => {
    if (systemStatus === 'active') {
      return { label: 'System Active', status: 'active', icon: <CheckCircle size={20} /> };
    } else if (systemStatus === 'error') {
      return { label: 'System Error', status: 'error', icon: <XCircle size={20} /> };
    } else if (systemStatus === 'starting') {
      return { label: 'System Starting', status: 'starting', icon: <Clock size={20} /> };
    } else {
      return { label: 'System Inactive', status: 'inactive', icon: <AlertCircle size={20} /> };
    }
  };

  if (error) {
    return (
      <PageContainer>
        <ContentContainer>
          <ErrorContainer>
            <AlertCircle size={48} />
            <h2>Agent System Error</h2>
            <p>{error}</p>
            <ActionButton primary onClick={clearError}>
              Try Again
            </ActionButton>
          </ErrorContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  if (isLoading && !isInitialized) {
    return (
      <PageContainer>
        <ContentContainer>
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        </ContentContainer>
      </PageContainer>
    );
  }

  return (
    <ErrorBoundary>
      <PageContainer>
        <ContentContainer>
          {/* Header */}
          <Header>
            <HeaderContent>
              <Title>
                <Brain size={32} />
                Agent System Dashboard
              </Title>
              <Subtitle>
                Monitor and manage your AI agent ecosystem in real-time
              </Subtitle>
              <StatusIndicator status={getSystemStatus().status}>
                {getSystemStatus().icon}
                {getSystemStatus().label}
              </StatusIndicator>
            </HeaderContent>
            <HeaderActions>
              {!isInitialized && (
                <ActionButton
                  primary
                  onClick={handleInitializeSystem}
                  disabled={initializingSystem}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {initializingSystem ? (
                    <>
                      <Clock size={16} />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      Initialize System
                    </>
                  )}
                </ActionButton>
              )}
              <ActionButton
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={16} />
                Refresh
              </ActionButton>
            </HeaderActions>
          </Header>

          {/* Tab Navigation */}
          <TabNavigation>
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            >
              <Activity size={16} />
              Overview
            </TabButton>
            <TabButton
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={16} />
              Analytics
            </TabButton>
            <TabButton
              active={activeTab === 'templates'}
              onClick={() => setActiveTab('templates')}
            >
              <Layers size={16} />
              Templates
            </TabButton>
            <TabButton
              active={activeTab === 'monitoring'}
              onClick={() => setActiveTab('monitoring')}
            >
              <Monitor size={16} />
              Monitoring
            </TabButton>
            <TabButton
              active={activeTab === 'workflows'}
              onClick={() => setActiveTab('workflows')}
            >
              <GitBranch size={16} />
              Workflows
            </TabButton>
            <TabButton
              active={activeTab === 'automation'}
              onClick={() => setActiveTab('automation')}
            >
              <Clock size={16} />
              Automation
            </TabButton>
          </TabNavigation>

          {/* Tab Content */}
          <TabContent>
            {activeTab === 'overview' && (
              <>
                {/* Metrics */}
          {isInitialized && (
            <MetricsGrid>
              <MetricCard
                status="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <MetricHeader>
                  <MetricIcon>
                    <Activity />
                  </MetricIcon>
                </MetricHeader>
                <MetricValue>{activeAgents}</MetricValue>
                <MetricLabel>Active Agents</MetricLabel>
                <MetricChange change={1}>
                  <TrendingUp size={12} />
                  {totalAgents} total
                </MetricChange>
              </MetricCard>

              <MetricCard
                status="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <MetricHeader>
                  <MetricIcon>
                    <BarChart3 />
                  </MetricIcon>
                </MetricHeader>
                <MetricValue>{metrics.totalTasks || 0}</MetricValue>
                <MetricLabel>Tasks Processed</MetricLabel>
                <MetricChange change={1}>
                  <TrendingUp size={12} />
                  {metrics.successRate || 0}% success rate
                </MetricChange>
              </MetricCard>

              <MetricCard
                status="warning"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <MetricHeader>
                  <MetricIcon>
                    <Clock />
                  </MetricIcon>
                </MetricHeader>
                <MetricValue>{metrics.averageResponseTime || 0}ms</MetricValue>
                <MetricLabel>Avg Response Time</MetricLabel>
                <MetricChange change={0}>
                  Real-time performance
                </MetricChange>
              </MetricCard>

              <MetricCard
                status="info"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <MetricHeader>
                  <MetricIcon>
                    <Cpu />
                  </MetricIcon>
                </MetricHeader>
                <MetricValue>{Math.round(metrics.uptime || 0)}h</MetricValue>
                <MetricLabel>System Uptime</MetricLabel>
                <MetricChange change={1}>
                  <TrendingUp size={12} />
                  {(metrics.errorRate || 0).toFixed(1)}% error rate
                </MetricChange>
              </MetricCard>
            </MetricsGrid>
          )}

          {/* Agents */}
          {isInitialized && (
            <AgentsSection>
              <SectionTitle>
                <Users size={24} />
                AI Agents ({Object.keys(agents).length})
              </SectionTitle>
              <AgentsGrid>
                <AnimatePresence>
                  {Object.entries(agents).map(([agentId, agent], index) => {
                    const IconComponent = AGENT_ICONS[agentId] || Brain;

                    return (
                      <AgentCard
                        key={agentId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <AgentHeader>
                          <AgentInfo>
                            <AgentName>
                              <IconComponent size={20} style={{ marginRight: '8px', display: 'inline' }} />
                              {agent.name || agentId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </AgentName>
                            <AgentDescription>
                              {agent.description || `Manages ${agentId.replace(/_/g, ' ')} operations`}
                            </AgentDescription>
                          </AgentInfo>
                          <AgentStatus status={agent.status}>
                            {getStatusIcon(agent.status)}
                            {agent.status}
                          </AgentStatus>
                        </AgentHeader>

                        <AgentControls>
                          <ControlButton
                            onClick={() => startAgent(agentId)}
                            disabled={agent.status === AGENT_STATUS.ACTIVE || agent.status === AGENT_STATUS.STARTING}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Start Agent"
                          >
                            <Play size={14} />
                          </ControlButton>

                          <ControlButton
                            onClick={() => stopAgent(agentId)}
                            disabled={agent.status === AGENT_STATUS.INACTIVE || agent.status === AGENT_STATUS.STOPPING}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Stop Agent"
                          >
                            <Square size={14} />
                          </ControlButton>

                          <ControlButton
                            onClick={() => restartAgent(agentId)}
                            disabled={agent.status === AGENT_STATUS.STARTING || agent.status === AGENT_STATUS.STOPPING}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Restart Agent"
                          >
                            <RotateCcw size={14} />
                          </ControlButton>

                          <ControlButton
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Configure Agent"
                          >
                            <Settings size={14} />
                          </ControlButton>
                        </AgentControls>
                      </AgentCard>
                    );
                  })}
                </AnimatePresence>
              </AgentsGrid>
            </AgentsSection>
          )}

                {/* No agents message */}
                {isInitialized && Object.keys(agents).length === 0 && (
                  <ErrorContainer>
                    <Brain size={48} />
                    <h2>No Agents Available</h2>
                    <p>The agent system is initialized but no agents are currently loaded.</p>
                    <ActionButton primary onClick={handleInitializeSystem}>
                      <RotateCcw size={16} />
                      Reinitialize System
                    </ActionButton>
                  </ErrorContainer>
                )}
              </>
            )}

            {activeTab === 'analytics' && (
              <AgentAnalytics />
            )}

            {activeTab === 'templates' && (
              <AgentTemplates />
            )}

            {activeTab === 'monitoring' && (
              <SystemMonitoringDashboard />
            )}

            {activeTab === 'workflows' && (
              <WorkflowDesigner />
            )}

            {activeTab === 'automation' && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#a0a0a0' }}>
                <Clock size={48} />
                <h3>Agent Automation & Scheduling</h3>
                <p>Advanced automation features coming soon!</p>
              </div>
            )}
          </TabContent>
        </ContentContainer>
      </PageContainer>
    </ErrorBoundary>
  );
};

export default AgentDashboardPage;
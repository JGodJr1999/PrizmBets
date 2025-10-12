import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Play,
  Settings,
  Clock,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  Cpu,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAgent } from '../../contexts/AgentContext';
import { toast } from 'react-hot-toast';

const TemplatesContainer = styled.div`
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

const SearchControls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const SearchInput = styled.input`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  width: 300px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
  }
`;

const FilterSelect = styled.select`
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

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const TemplateCard = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
  }
`;

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const TemplateTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
`;

const TemplateCategory = styled.span`
  background: ${props => {
    switch (props.category) {
      case 'analytics': return 'rgba(34, 197, 94, 0.2)';
      case 'automation': return 'rgba(59, 130, 246, 0.2)';
      case 'monitoring': return 'rgba(245, 158, 11, 0.2)';
      case 'optimization': return 'rgba(139, 92, 246, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.category) {
      case 'analytics': return '#22c55e';
      case 'automation': return '#3b82f6';
      case 'monitoring': return '#f59e0b';
      case 'optimization': return '#8b5cf6';
      default: return '#6b7280';
    }
  }};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
`;

const TemplateDescription = styled.p`
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  margin: 0 0 1rem 0;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const TemplateFeatures = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const FeatureTag = styled.span`
  background: ${props => props.theme?.colors?.background?.tertiary || '#333'};
  color: ${props => props.theme?.colors?.text?.tertiary || '#ccc'};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
`;

const TemplateStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444'};
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.theme?.colors?.text?.tertiary || '#ccc'};
  font-size: 0.8rem;
`;

const TemplateActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: ${props => props.primary
    ? (props.theme?.colors?.accent?.primary || '#8b5cf6')
    : 'transparent'
  };
  color: ${props => props.primary
    ? '#ffffff'
    : (props.theme?.colors?.text?.secondary || '#a0a0a0')
  };
  border: 1px solid ${props => props.primary
    ? 'transparent'
    : (props.theme?.colors?.border?.primary || '#333')
  };
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;

  &:hover {
    background: ${props => props.primary
      ? (props.theme?.colors?.accent?.secondary || '#7c3aed')
      : (props.theme?.colors?.background?.tertiary || '#333')
    };
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
`;

const AgentTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [creatingWorkflow, setCreatingWorkflow] = useState(null);

  const { executeAgentTask } = useAgent();

  // Mock template data for demonstration
  useEffect(() => {
    const mockTemplates = [
      {
        id: 'sports-analytics',
        name: 'Sports Analytics Automation',
        description: 'Automated analysis of sports data, odds movements, and betting patterns with real-time insights.',
        category: 'analytics',
        features: ['Real-time data processing', 'Odds tracking', 'Pattern recognition', 'Automated reports'],
        difficulty: 'intermediate',
        estimatedTime: '5-10 minutes',
        usageCount: 142,
        rating: 4.7,
        icon: BarChart3,
        agents: ['data_collector', 'odds_analyzer', 'pattern_detector'],
        tasks: [
          { type: 'data_collection', description: 'Collect sports data from multiple sources' },
          { type: 'odds_analysis', description: 'Analyze odds movements and identify opportunities' },
          { type: 'pattern_detection', description: 'Detect betting patterns and trends' },
          { type: 'report_generation', description: 'Generate comprehensive analytics report' }
        ]
      },
      {
        id: 'automated-monitoring',
        name: 'System Health Monitoring',
        description: 'Continuous monitoring of agent system health with automated alerts and self-healing capabilities.',
        category: 'monitoring',
        features: ['Health checks', 'Auto-recovery', 'Alert system', 'Performance tracking'],
        difficulty: 'beginner',
        estimatedTime: '2-5 minutes',
        usageCount: 89,
        rating: 4.5,
        icon: Cpu,
        agents: ['health_monitor', 'alert_manager', 'recovery_agent'],
        tasks: [
          { type: 'health_check', description: 'Monitor system health metrics' },
          { type: 'performance_analysis', description: 'Analyze system performance' },
          { type: 'alert_management', description: 'Send alerts for critical issues' },
          { type: 'auto_recovery', description: 'Attempt automatic recovery procedures' }
        ]
      },
      {
        id: 'optimization-suite',
        name: 'Performance Optimization',
        description: 'Intelligent optimization of agent performance, resource allocation, and task scheduling.',
        category: 'optimization',
        features: ['Resource optimization', 'Task scheduling', 'Performance tuning', 'Cost reduction'],
        difficulty: 'advanced',
        estimatedTime: '10-15 minutes',
        usageCount: 67,
        rating: 4.8,
        icon: Zap,
        agents: ['optimizer', 'scheduler', 'resource_manager'],
        tasks: [
          { type: 'resource_analysis', description: 'Analyze current resource usage' },
          { type: 'optimization_planning', description: 'Plan optimization strategies' },
          { type: 'implementation', description: 'Implement optimization changes' },
          { type: 'validation', description: 'Validate optimization results' }
        ]
      },
      {
        id: 'trend-analysis',
        name: 'Market Trend Analysis',
        description: 'Advanced trend analysis for sports betting markets with predictive modeling and insights.',
        category: 'analytics',
        features: ['Trend detection', 'Predictive modeling', 'Market analysis', 'Risk assessment'],
        difficulty: 'advanced',
        estimatedTime: '8-12 minutes',
        usageCount: 156,
        rating: 4.6,
        icon: TrendingUp,
        agents: ['trend_analyzer', 'predictor', 'risk_assessor'],
        tasks: [
          { type: 'data_aggregation', description: 'Aggregate market data from multiple sources' },
          { type: 'trend_analysis', description: 'Analyze trends and patterns' },
          { type: 'prediction_modeling', description: 'Build predictive models' },
          { type: 'risk_evaluation', description: 'Evaluate risk factors and opportunities' }
        ]
      },
      {
        id: 'automated-workflow',
        name: 'Smart Workflow Automation',
        description: 'Intelligent automation of complex workflows with decision trees and conditional logic.',
        category: 'automation',
        features: ['Decision trees', 'Conditional logic', 'Multi-stage workflows', 'Error handling'],
        difficulty: 'intermediate',
        estimatedTime: '6-10 minutes',
        usageCount: 98,
        rating: 4.4,
        icon: Target,
        agents: ['workflow_manager', 'decision_engine', 'error_handler'],
        tasks: [
          { type: 'workflow_design', description: 'Design workflow structure' },
          { type: 'logic_implementation', description: 'Implement decision logic' },
          { type: 'execution_monitoring', description: 'Monitor workflow execution' },
          { type: 'error_handling', description: 'Handle errors and exceptions' }
        ]
      }
    ];

    setTimeout(() => {
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreateWorkflow = async (template) => {
    setCreatingWorkflow(template.id);

    try {
      // Here we would call the API to create the workflow
      // For now, we'll simulate the process
      toast.loading(`Creating workflow from ${template.name}...`);

      // Simulate workflow creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.dismiss();
      toast.success(`Workflow "${template.name}" created successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to create workflow from template');
    } finally {
      setCreatingWorkflow(null);
    }
  };

  const handlePreviewTemplate = (template) => {
    // Open template preview/configuration modal
    toast.info(`Preview for ${template.name} - Feature coming soon!`);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyIcon = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return CheckCircle;
      case 'intermediate': return AlertTriangle;
      case 'advanced': return Info;
      default: return Info;
    }
  };

  if (loading) {
    return (
      <TemplatesContainer>
        <LoadingSpinner>
          <Layers size={24} />
          <span style={{ marginLeft: '0.5rem' }}>Loading agent templates...</span>
        </LoadingSpinner>
      </TemplatesContainer>
    );
  }

  return (
    <TemplatesContainer>
      <Header>
        <Title>
          <Layers size={24} />
          Agent Templates
        </Title>
        <SearchControls>
          <SearchInput
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FilterSelect
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="analytics">Analytics</option>
            <option value="automation">Automation</option>
            <option value="monitoring">Monitoring</option>
            <option value="optimization">Optimization</option>
          </FilterSelect>
        </SearchControls>
      </Header>

      {filteredTemplates.length === 0 ? (
        <EmptyState>
          <Search size={48} />
          <p>No templates found matching your criteria.</p>
        </EmptyState>
      ) : (
        <TemplatesGrid>
          <AnimatePresence>
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon;
              const DifficultyIcon = getDifficultyIcon(template.difficulty);

              return (
                <TemplateCard
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TemplateHeader>
                    <TemplateTitle>
                      <IconComponent size={20} />
                      {template.name}
                    </TemplateTitle>
                    <TemplateCategory category={template.category}>
                      {template.category}
                    </TemplateCategory>
                  </TemplateHeader>

                  <TemplateDescription>
                    {template.description}
                  </TemplateDescription>

                  <TemplateFeatures>
                    {template.features.map((feature, index) => (
                      <FeatureTag key={index}>{feature}</FeatureTag>
                    ))}
                  </TemplateFeatures>

                  <TemplateStats>
                    <StatItem>
                      <DifficultyIcon size={14} />
                      <span style={{ color: getDifficultyColor(template.difficulty) }}>
                        {template.difficulty}
                      </span>
                    </StatItem>
                    <StatItem>
                      <Clock size={14} />
                      {template.estimatedTime}
                    </StatItem>
                    <StatItem>
                      <Play size={14} />
                      {template.usageCount} uses
                    </StatItem>
                  </TemplateStats>

                  <TemplateActions>
                    <ActionButton onClick={() => handlePreviewTemplate(template)}>
                      <Settings size={16} />
                      Preview
                    </ActionButton>
                    <ActionButton
                      primary
                      onClick={() => handleCreateWorkflow(template)}
                      disabled={creatingWorkflow === template.id}
                    >
                      <Play size={16} />
                      {creatingWorkflow === template.id ? 'Creating...' : 'Use Template'}
                    </ActionButton>
                  </TemplateActions>
                </TemplateCard>
              );
            })}
          </AnimatePresence>
        </TemplatesGrid>
      )}
    </TemplatesContainer>
  );
};

export default AgentTemplates;
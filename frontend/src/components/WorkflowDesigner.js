import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Play,
  Square,
  Save,
  Upload,
  Download,
  Settings,
  GitBranch,
  Clock,
  Zap,
  Target,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  AlertTriangle,
  Info,
  Trash2,
  Edit3,
  Copy,
  MoreVertical,
  Users,
  Bot,
  Calendar,
  Timer,
  Cpu,
  Database,
  Globe,
  Shield,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { toast } from 'react-hot-toast';

const DesignerContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
`;

const DesignerHeader = styled.div`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const DesignerTitle = styled.h1`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ?
    `linear-gradient(135deg, ${props.theme?.colors?.accent?.primary || '#FFD700'}, ${props.theme?.colors?.accent?.primary || '#FFD700'}dd)` :
    'transparent'
  };
  border: 1px solid ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  color: ${props => props.primary ?
    props.theme?.colors?.background?.primary || '#0a0a0a' :
    props.theme?.colors?.accent?.primary || '#FFD700'
  };
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

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

const DesignerBody = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const Sidebar = styled.div`
  width: 300px;
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border-right: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  display: flex;
  flex-direction: column;
`;

const SidebarSection = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
`;

const SectionTitle = styled.h3`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NodePalette = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NodeItem = styled(motion.div)`
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444444'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: 0.75rem;
  cursor: grab;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
    transform: translateY(-1px);
  }

  &:active {
    cursor: grabbing;
    transform: scale(0.95);
  }
`;

const NodeIcon = styled.div`
  color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  flex-shrink: 0;
`;

const NodeLabel = styled.div`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 0.9rem;
  font-weight: 500;
`;

const NodeDescription = styled.div`
  color: ${props => props.theme?.colors?.text?.muted || '#888888'};
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const Canvas = styled.div`
  flex: 1;
  background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
  position: relative;
  overflow: auto;
  background-image: radial-gradient(circle, ${props => props.theme?.colors?.border?.primary || '#333333'}20 1px, transparent 1px);
  background-size: 20px 20px;
`;

const WorkflowNode = styled(motion.div)`
  position: absolute;
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 2px solid ${props => props.selected ?
    props.theme?.colors?.accent?.primary || '#FFD700' :
    props.theme?.colors?.border?.primary || '#333333'
  };
  border-radius: ${props => props.theme?.borderRadius?.lg || '12px'};
  padding: 1rem;
  min-width: 200px;
  cursor: pointer;
  box-shadow: ${props => props.theme?.shadows?.lg || '0 10px 15px rgba(0, 0, 0, 0.5)'};
  user-select: none;

  &:hover {
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  }
`;

const NodeHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const NodeTitle = styled.div`
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NodeMenu = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  cursor: pointer;
  padding: 0.25rem;
  border-radius: ${props => props.theme?.borderRadius?.sm || '4px'};

  &:hover {
    background: ${props => props.theme?.colors?.background?.hover || '#333333'};
  }
`;

const NodeContent = styled.div`
  color: ${props => props.theme?.colors?.text?.secondary || '#cccccc'};
  font-size: 0.9rem;
`;

const PropertyPanel = styled.div`
  width: 300px;
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border-left: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  padding: 1rem;
  overflow-y: auto;
`;

const PropertySection = styled.div`
  margin-bottom: 1.5rem;
`;

const PropertyLabel = styled.label`
  display: block;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const PropertyInput = styled.input`
  width: 100%;
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: 0.75rem;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  }
`;

const PropertySelect = styled.select`
  width: 100%;
  background: ${props => props.theme?.colors?.background?.card || '#1e1e1e'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333333'};
  border-radius: ${props => props.theme?.borderRadius?.md || '8px'};
  padding: 0.75rem;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme?.colors?.accent?.primary || '#FFD700'};
  }
`;

const StatusIndicator = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'running': return props.theme?.colors?.status?.success || '#32CD32';
      case 'error': return props.theme?.colors?.status?.error || '#ff6b6b';
      case 'warning': return props.theme?.colors?.status?.warning || '#FFA500';
      default: return props.theme?.colors?.text?.muted || '#888888';
    }
  }};
  margin-left: 0.5rem;
`;

const WorkflowDesigner = () => {
  const [workflow, setWorkflow] = useState({
    id: 'workflow_1',
    name: 'New Workflow',
    description: 'Workflow description',
    nodes: [],
    connections: []
  });
  const [selectedNode, setSelectedNode] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const { executeAgentTask } = useAgent();

  const nodeTypes = [
    {
      type: 'trigger',
      icon: Play,
      label: 'Trigger',
      description: 'Start workflow execution'
    },
    {
      type: 'agent',
      icon: Bot,
      label: 'Agent Task',
      description: 'Execute agent function'
    },
    {
      type: 'condition',
      icon: GitBranch,
      label: 'Condition',
      description: 'Conditional logic branch'
    },
    {
      type: 'delay',
      icon: Clock,
      label: 'Delay',
      description: 'Wait for specified time'
    },
    {
      type: 'data',
      icon: Database,
      label: 'Data Processing',
      description: 'Transform or filter data'
    },
    {
      type: 'notification',
      icon: Info,
      label: 'Notification',
      description: 'Send alerts or messages'
    }
  ];

  const handleDragStart = useCallback((nodeType) => {
    setDraggedNode(nodeType);
  }, []);

  const handleCanvasDrop = useCallback((event) => {
    event.preventDefault();
    if (!draggedNode) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newNode = {
      id: `node_${Date.now()}`,
      type: draggedNode.type,
      label: draggedNode.label,
      x: x - 100, // Center the node
      y: y - 50,
      properties: {
        name: draggedNode.label,
        description: '',
        agent: '',
        function: '',
        parameters: {}
      },
      status: 'idle'
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));

    setDraggedNode(null);
    setSelectedNode(newNode);
  }, [draggedNode]);

  const handleCanvasDragOver = useCallback((event) => {
    event.preventDefault();
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
  }, []);

  const handleNodeDelete = useCallback((nodeId) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.from !== nodeId && c.to !== nodeId)
    }));
    setSelectedNode(null);
  }, []);

  const updateNodeProperty = useCallback((property, value) => {
    if (!selectedNode) return;

    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === selectedNode.id
          ? { ...node, properties: { ...node.properties, [property]: value } }
          : node
      )
    }));

    setSelectedNode(prev => ({
      ...prev,
      properties: { ...prev.properties, [property]: value }
    }));
  }, [selectedNode]);

  const executeWorkflow = async () => {
    if (workflow.nodes.length === 0) {
      toast.error('No nodes in workflow');
      return;
    }

    setIsExecuting(true);
    toast.success('Workflow execution started');

    try {
      // Simulate workflow execution
      for (const node of workflow.nodes) {
        // Update node status to running
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(n =>
            n.id === node.id ? { ...n, status: 'running' } : n
          )
        }));

        // Simulate task execution
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (node.type === 'agent' && node.properties.agent) {
          try {
            await executeAgentTask(node.properties.agent, node.properties.function || 'default', {});
          } catch (error) {
            console.error('Agent task failed:', error);
          }
        }

        // Update node status to completed
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(n =>
            n.id === node.id ? { ...n, status: 'completed' } : n
          )
        }));
      }

      toast.success('Workflow executed successfully');
    } catch (error) {
      console.error('Workflow execution failed:', error);
      toast.error('Workflow execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const saveWorkflow = async () => {
    try {
      // In production, this would save to backend
      console.log('Saving workflow:', workflow);
      toast.success('Workflow saved successfully');
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  const getNodeIcon = (type) => {
    const nodeType = nodeTypes.find(nt => nt.type === type);
    return nodeType?.icon || Bot;
  };

  return (
    <DesignerContainer>
      <DesignerHeader>
        <DesignerTitle>
          <GitBranch size={24} />
          Workflow Designer
        </DesignerTitle>
        <HeaderActions>
          <ActionButton onClick={saveWorkflow}>
            <Save size={16} />
            Save
          </ActionButton>
          <ActionButton
            primary
            onClick={executeWorkflow}
            disabled={isExecuting || workflow.nodes.length === 0}
          >
            <Play size={16} />
            {isExecuting ? 'Executing...' : 'Execute'}
          </ActionButton>
        </HeaderActions>
      </DesignerHeader>

      <DesignerBody>
        <Sidebar>
          <SidebarSection>
            <SectionTitle>
              <Plus size={16} />
              Node Palette
            </SectionTitle>
            <NodePalette>
              {nodeTypes.map((nodeType) => (
                <NodeItem
                  key={nodeType.type}
                  draggable
                  onDragStart={() => handleDragStart(nodeType)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <NodeIcon>
                    <nodeType.icon size={18} />
                  </NodeIcon>
                  <div>
                    <NodeLabel>{nodeType.label}</NodeLabel>
                    <NodeDescription>{nodeType.description}</NodeDescription>
                  </div>
                </NodeItem>
              ))}
            </NodePalette>
          </SidebarSection>

          <SidebarSection style={{ flex: 1 }}>
            <SectionTitle>
              <Settings size={16} />
              Workflow Info
            </SectionTitle>
            <PropertySection>
              <PropertyLabel>Name</PropertyLabel>
              <PropertyInput
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              />
            </PropertySection>
            <PropertySection>
              <PropertyLabel>Description</PropertyLabel>
              <PropertyInput
                value={workflow.description}
                onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              />
            </PropertySection>
          </SidebarSection>
        </Sidebar>

        <Canvas
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {workflow.nodes.map((node) => {
            const IconComponent = getNodeIcon(node.type);
            return (
              <WorkflowNode
                key={node.id}
                style={{ left: node.x, top: node.y }}
                selected={selectedNode?.id === node.id}
                onClick={() => handleNodeClick(node)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <NodeHeader>
                  <NodeTitle>
                    <IconComponent size={16} />
                    {node.properties.name}
                    <StatusIndicator status={node.status} />
                  </NodeTitle>
                  <NodeMenu onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this node?')) {
                      handleNodeDelete(node.id);
                    }
                  }}>
                    <Trash2 size={14} />
                  </NodeMenu>
                </NodeHeader>
                <NodeContent>
                  {node.properties.description || `${node.label} node`}
                </NodeContent>
              </WorkflowNode>
            );
          })}
        </Canvas>

        {selectedNode && (
          <PropertyPanel>
            <SectionTitle>
              <Edit3 size={16} />
              Node Properties
            </SectionTitle>

            <PropertySection>
              <PropertyLabel>Name</PropertyLabel>
              <PropertyInput
                value={selectedNode.properties.name}
                onChange={(e) => updateNodeProperty('name', e.target.value)}
              />
            </PropertySection>

            <PropertySection>
              <PropertyLabel>Description</PropertyLabel>
              <PropertyInput
                value={selectedNode.properties.description}
                onChange={(e) => updateNodeProperty('description', e.target.value)}
              />
            </PropertySection>

            {selectedNode.type === 'agent' && (
              <>
                <PropertySection>
                  <PropertyLabel>Agent</PropertyLabel>
                  <PropertySelect
                    value={selectedNode.properties.agent}
                    onChange={(e) => updateNodeProperty('agent', e.target.value)}
                  >
                    <option value="">Select Agent</option>
                    <option value="odds-analyzer">Odds Analyzer</option>
                    <option value="market-scanner">Market Scanner</option>
                    <option value="data-processor">Data Processor</option>
                  </PropertySelect>
                </PropertySection>

                <PropertySection>
                  <PropertyLabel>Function</PropertyLabel>
                  <PropertySelect
                    value={selectedNode.properties.function}
                    onChange={(e) => updateNodeProperty('function', e.target.value)}
                  >
                    <option value="">Select Function</option>
                    <option value="analyze">Analyze</option>
                    <option value="scan">Scan</option>
                    <option value="process">Process</option>
                  </PropertySelect>
                </PropertySection>
              </>
            )}

            {selectedNode.type === 'delay' && (
              <PropertySection>
                <PropertyLabel>Delay (seconds)</PropertyLabel>
                <PropertyInput
                  type="number"
                  value={selectedNode.properties.delay || 1}
                  onChange={(e) => updateNodeProperty('delay', parseInt(e.target.value))}
                />
              </PropertySection>
            )}

            {selectedNode.type === 'condition' && (
              <PropertySection>
                <PropertyLabel>Condition</PropertyLabel>
                <PropertySelect
                  value={selectedNode.properties.condition}
                  onChange={(e) => updateNodeProperty('condition', e.target.value)}
                >
                  <option value="">Select Condition</option>
                  <option value="equals">Equals</option>
                  <option value="greater">Greater Than</option>
                  <option value="less">Less Than</option>
                </PropertySelect>
              </PropertySection>
            )}
          </PropertyPanel>
        )}
      </DesignerBody>
    </DesignerContainer>
  );
};

export default WorkflowDesigner;
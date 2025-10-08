import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Agent Context
const AgentContext = createContext();

// Agent Actions
const AGENT_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SYSTEM_STATUS: 'SET_SYSTEM_STATUS',
  SET_AGENTS: 'SET_AGENTS',
  UPDATE_AGENT: 'UPDATE_AGENT',
  SET_METRICS: 'SET_METRICS',
  SET_TASK_HISTORY: 'SET_TASK_HISTORY',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  SET_LOGS: 'SET_LOGS',
  ADD_LOG: 'ADD_LOG',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED'
};

// Agent Status Enums
export const AGENT_STATUS = {
  INACTIVE: 'inactive',
  STARTING: 'starting',
  ACTIVE: 'active',
  STOPPING: 'stopping',
  ERROR: 'error',
  UNKNOWN: 'unknown'
};

export const TASK_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Initial state
const initialState = {
  // System status
  isLoading: false,
  isInitialized: false,
  systemStatus: 'unknown',
  lastUpdated: null,
  error: null,

  // Agents
  agents: {},
  totalAgents: 0,
  activeAgents: 0,

  // Metrics
  metrics: {
    uptime: 0,
    totalTasks: 0,
    successRate: 0,
    averageResponseTime: 0,
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0
  },

  // Tasks
  taskHistory: [],
  activeTasks: {},

  // Logs
  logs: [],
  logLevel: 'info'
};

// Agent reducer
const agentReducer = (state, action) => {
  switch (action.type) {
    case AGENT_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AGENT_ACTIONS.SET_SYSTEM_STATUS:
      return {
        ...state,
        systemStatus: action.payload.status,
        lastUpdated: action.payload.timestamp || new Date().toISOString(),
        error: action.payload.error || null
      };

    case AGENT_ACTIONS.SET_AGENTS:
      const agents = action.payload;
      const totalAgents = Object.keys(agents).length;
      const activeAgents = Object.values(agents).filter(
        agent => agent.status === AGENT_STATUS.ACTIVE
      ).length;

      return {
        ...state,
        agents,
        totalAgents,
        activeAgents,
        lastUpdated: new Date().toISOString()
      };

    case AGENT_ACTIONS.UPDATE_AGENT:
      const { agentId, agentData } = action.payload;
      return {
        ...state,
        agents: {
          ...state.agents,
          [agentId]: {
            ...state.agents[agentId],
            ...agentData,
            lastUpdated: new Date().toISOString()
          }
        },
        activeAgents: Object.values({
          ...state.agents,
          [agentId]: { ...state.agents[agentId], ...agentData }
        }).filter(agent => agent.status === AGENT_STATUS.ACTIVE).length
      };

    case AGENT_ACTIONS.SET_METRICS:
      return {
        ...state,
        metrics: {
          ...state.metrics,
          ...action.payload,
          lastUpdated: new Date().toISOString()
        }
      };

    case AGENT_ACTIONS.SET_TASK_HISTORY:
      return {
        ...state,
        taskHistory: action.payload
      };

    case AGENT_ACTIONS.ADD_TASK:
      const newTask = action.payload;
      return {
        ...state,
        taskHistory: [newTask, ...state.taskHistory].slice(0, 100), // Keep last 100
        activeTasks: {
          ...state.activeTasks,
          [newTask.id]: newTask
        }
      };

    case AGENT_ACTIONS.UPDATE_TASK:
      const { taskId, taskData } = action.payload;
      const updatedTask = { ...state.activeTasks[taskId], ...taskData };

      return {
        ...state,
        activeTasks: {
          ...state.activeTasks,
          [taskId]: updatedTask
        },
        taskHistory: state.taskHistory.map(task =>
          task.id === taskId ? updatedTask : task
        )
      };

    case AGENT_ACTIONS.SET_LOGS:
      return {
        ...state,
        logs: action.payload
      };

    case AGENT_ACTIONS.ADD_LOG:
      return {
        ...state,
        logs: [action.payload, ...state.logs].slice(0, 1000) // Keep last 1000 logs
      };

    case AGENT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case AGENT_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AGENT_ACTIONS.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload
      };

    default:
      return state;
  }
};

// Agent Provider Component
export const AgentProvider = ({ children }) => {
  const [state, dispatch] = useReducer(agentReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Auto-refresh interval
  const REFRESH_INTERVAL = 5000; // 5 seconds

  // Load agent dashboard data
  const loadAgentData = useCallback(async (showLoading = true) => {
    if (!isAuthenticated) return;

    try {
      if (showLoading) {
        dispatch({ type: AGENT_ACTIONS.SET_LOADING, payload: true });
      }

      // Get dashboard data
      const dashboardData = await apiService.getAgentDashboard();

      // Update system status
      dispatch({
        type: AGENT_ACTIONS.SET_SYSTEM_STATUS,
        payload: {
          status: dashboardData.system_status || 'unknown',
          timestamp: dashboardData.last_updated
        }
      });

      // Update agents
      if (dashboardData.agents) {
        dispatch({
          type: AGENT_ACTIONS.SET_AGENTS,
          payload: dashboardData.agents
        });
      }

      // Update metrics
      if (dashboardData.metrics) {
        dispatch({
          type: AGENT_ACTIONS.SET_METRICS,
          payload: dashboardData.metrics
        });
      }

      // Update task history
      if (dashboardData.task_history) {
        dispatch({
          type: AGENT_ACTIONS.SET_TASK_HISTORY,
          payload: dashboardData.task_history
        });
      }

      dispatch({ type: AGENT_ACTIONS.CLEAR_ERROR });

    } catch (error) {
      console.error('Failed to load agent data:', error);
      dispatch({
        type: AGENT_ACTIONS.SET_ERROR,
        payload: error.message
      });
    } finally {
      if (showLoading) {
        dispatch({ type: AGENT_ACTIONS.SET_LOADING, payload: false });
      }
    }
  }, [isAuthenticated]);

  // Initialize agent system
  const initializeAgents = useCallback(async (config = {}) => {
    try {
      dispatch({ type: AGENT_ACTIONS.SET_LOADING, payload: true });

      const result = await apiService.initializeAgents(config);

      if (result.success) {
        dispatch({ type: AGENT_ACTIONS.SET_INITIALIZED, payload: true });
        toast.success('Agent system initialized successfully');

        // Load initial data
        await loadAgentData(false);
      } else {
        throw new Error(result.error || 'Failed to initialize agent system');
      }

    } catch (error) {
      console.error('Failed to initialize agents:', error);
      dispatch({
        type: AGENT_ACTIONS.SET_ERROR,
        payload: error.message
      });
      toast.error('Failed to initialize agent system');
    } finally {
      dispatch({ type: AGENT_ACTIONS.SET_LOADING, payload: false });
    }
  }, [loadAgentData]);

  // Execute agent task
  const executeTask = useCallback(async (agentId, taskType, taskData = {}, priority = TASK_PRIORITY.MEDIUM) => {
    try {
      const result = await apiService.executeAgentTask(agentId, taskType, taskData, priority);

      if (result.task_id) {
        // Add task to state
        dispatch({
          type: AGENT_ACTIONS.ADD_TASK,
          payload: {
            id: result.task_id,
            agent_id: agentId,
            task_type: taskType,
            status: TASK_STATUS.PENDING,
            priority,
            created_at: new Date().toISOString(),
            ...result
          }
        });

        toast.success(`Task submitted to ${agentId}`);
      }

      return result;

    } catch (error) {
      console.error('Failed to execute task:', error);
      toast.error(`Failed to execute task: ${error.message}`);
      throw error;
    }
  }, []);

  // Start agent
  const startAgent = useCallback(async (agentId) => {
    try {
      await apiService.startAgent(agentId);

      // Update agent status optimistically
      dispatch({
        type: AGENT_ACTIONS.UPDATE_AGENT,
        payload: {
          agentId,
          agentData: { status: AGENT_STATUS.STARTING }
        }
      });

      toast.success(`Starting ${agentId}...`);

      // Refresh data after a delay
      setTimeout(() => loadAgentData(false), 2000);

    } catch (error) {
      console.error('Failed to start agent:', error);
      toast.error(`Failed to start ${agentId}: ${error.message}`);
    }
  }, [loadAgentData]);

  // Stop agent
  const stopAgent = useCallback(async (agentId) => {
    try {
      await apiService.stopAgent(agentId);

      // Update agent status optimistically
      dispatch({
        type: AGENT_ACTIONS.UPDATE_AGENT,
        payload: {
          agentId,
          agentData: { status: AGENT_STATUS.STOPPING }
        }
      });

      toast.success(`Stopping ${agentId}...`);

      // Refresh data after a delay
      setTimeout(() => loadAgentData(false), 2000);

    } catch (error) {
      console.error('Failed to stop agent:', error);
      toast.error(`Failed to stop ${agentId}: ${error.message}`);
    }
  }, [loadAgentData]);

  // Restart agent
  const restartAgent = useCallback(async (agentId) => {
    try {
      await apiService.restartAgent(agentId);

      // Update agent status optimistically
      dispatch({
        type: AGENT_ACTIONS.UPDATE_AGENT,
        payload: {
          agentId,
          agentData: { status: AGENT_STATUS.STARTING }
        }
      });

      toast.success(`Restarting ${agentId}...`);

      // Refresh data after a delay
      setTimeout(() => loadAgentData(false), 3000);

    } catch (error) {
      console.error('Failed to restart agent:', error);
      toast.error(`Failed to restart ${agentId}: ${error.message}`);
    }
  }, [loadAgentData]);

  // Get agent health
  const checkHealth = useCallback(async () => {
    try {
      const health = await apiService.getAgentHealth();

      dispatch({
        type: AGENT_ACTIONS.SET_SYSTEM_STATUS,
        payload: {
          status: health.status,
          timestamp: health.timestamp
        }
      });

      return health;

    } catch (error) {
      console.error('Failed to check agent health:', error);
      dispatch({
        type: AGENT_ACTIONS.SET_SYSTEM_STATUS,
        payload: {
          status: 'error',
          error: error.message
        }
      });
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AGENT_ACTIONS.CLEAR_ERROR });
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!isAuthenticated || !state.isInitialized) return;

    const interval = setInterval(() => {
      loadAgentData(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isAuthenticated, state.isInitialized, loadAgentData]);

  // Initial load effect
  useEffect(() => {
    if (isAuthenticated) {
      loadAgentData();
    }
  }, [isAuthenticated, loadAgentData]);

  const value = {
    // State
    ...state,

    // Actions
    loadAgentData,
    initializeAgents,
    executeTask,
    startAgent,
    stopAgent,
    restartAgent,
    checkHealth,
    clearError,

    // Utilities
    AGENT_STATUS,
    TASK_STATUS,
    TASK_PRIORITY
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
};

// Hook to use agent context
export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export default AgentContext;
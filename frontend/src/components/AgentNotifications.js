import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Clock,
  Eye,
  EyeOff,
  Settings,
  MoreVertical,
  Trash2,
  MarkAsRead
} from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';

const NotificationsContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const NotificationBell = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  }
`;

const NotificationBadge = styled.span`
  position: absolute;
  top: 4px;
  right: 4px;
  background: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
`;

const NotificationsPanel = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-height: 600px;
  background: ${props => props.theme?.colors?.background?.secondary || '#1a1a1a'};
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444'};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PanelTitle = styled.h3`
  margin: 0;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PanelActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${props => props.theme?.colors?.border?.primary || '#333'};
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background: ${props => props.theme?.colors?.background?.tertiary || '#333'};
    border-color: ${props => props.theme?.colors?.accent?.primary || '#8b5cf6'};
  }
`;

const NotificationsList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const NotificationItem = styled(motion.div)`
  padding: 1rem;
  border-bottom: 1px solid ${props => props.theme?.colors?.border?.secondary || '#444'};
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: ${props => props.isRead ? 'transparent' : 'rgba(139, 92, 246, 0.05)'};

  &:hover {
    background: ${props => props.theme?.colors?.background?.tertiary || '#333'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const NotificationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
`;

const NotificationInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
`;

const NotificationIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.type) {
      case 'success': return 'rgba(34, 197, 94, 0.2)';
      case 'error': return 'rgba(239, 68, 68, 0.2)';
      case 'warning': return 'rgba(245, 158, 11, 0.2)';
      case 'info': return 'rgba(59, 130, 246, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.type) {
      case 'success': return '#22c55e';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  }};
`;

const NotificationContent = styled.div`
  flex: 1;
`;

const NotificationTitle = styled.h4`
  margin: 0 0 0.25rem 0;
  color: ${props => props.theme?.colors?.text?.primary || '#ffffff'};
  font-size: 0.9rem;
  line-height: 1.3;
`;

const NotificationMessage = styled.p`
  margin: 0 0 0.5rem 0;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  font-size: 0.8rem;
  line-height: 1.4;
`;

const NotificationMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: ${props => props.theme?.colors?.text?.tertiary || '#666'};
`;

const NotificationTime = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const NotificationActions = styled.div`
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s ease;

  ${NotificationItem}:hover & {
    opacity: 1;
  }
`;

const QuickAction = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme?.colors?.text?.tertiary || '#666'};
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.theme?.colors?.background?.primary || '#0a0a0a'};
    color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  }
`;

const EmptyState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
`;

const LoadingState = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${props => props.theme?.colors?.text?.secondary || '#a0a0a0'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const AgentNotifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const { state } = useAgent();

  // Load notifications when component mounts or panel opens
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate new notifications based on agent status changes
      if (Math.random() < 0.3) { // 30% chance every 10 seconds
        addSimulatedNotification();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Initialize with mock notifications
  useEffect(() => {
    initializeMockNotifications();
  }, []);

  const initializeMockNotifications = () => {
    const mockNotifications = [
      {
        id: '1',
        type: 'success',
        title: 'Agent System Initialized',
        message: 'All 29 agents have been successfully initialized and are ready for operation.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        isRead: false,
        agentId: 'system',
        actionType: 'initialization'
      },
      {
        id: '2',
        type: 'info',
        title: 'Sports Data Collection Complete',
        message: 'Agent "sports_data_collector" has successfully gathered data from 15 sources.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isRead: false,
        agentId: 'sports_data_collector',
        actionType: 'task_completion'
      },
      {
        id: '3',
        type: 'warning',
        title: 'High CPU Usage Detected',
        message: 'Agent "odds_analyzer" is experiencing high CPU usage (85%). Consider optimization.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: true,
        agentId: 'odds_analyzer',
        actionType: 'performance_warning'
      },
      {
        id: '4',
        type: 'success',
        title: 'Optimization Complete',
        message: 'Performance optimization has improved system efficiency by 23%.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        isRead: true,
        agentId: 'optimizer',
        actionType: 'optimization'
      },
      {
        id: '5',
        type: 'error',
        title: 'Connection Error',
        message: 'Agent "external_api_client" failed to connect to external data source. Retrying...',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        isRead: true,
        agentId: 'external_api_client',
        actionType: 'error'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    setLoading(false);
  };

  const addSimulatedNotification = () => {
    const notificationTypes = ['success', 'info', 'warning', 'error'];
    const agentNames = ['data_collector', 'odds_analyzer', 'trend_detector', 'optimizer', 'monitor'];
    const messages = {
      success: [
        'Task completed successfully',
        'Data synchronization complete',
        'Optimization applied successfully',
        'Analysis completed with insights'
      ],
      info: [
        'Starting scheduled analysis',
        'New data available for processing',
        'System health check complete',
        'Performance metrics updated'
      ],
      warning: [
        'High resource usage detected',
        'Slow response time observed',
        'Memory usage approaching limit',
        'Connection timeout experienced'
      ],
      error: [
        'Failed to connect to external API',
        'Data validation error',
        'Processing timeout occurred',
        'Configuration error detected'
      ]
    };

    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const agentId = agentNames[Math.floor(Math.random() * agentNames.length)];
    const messageOptions = messages[type];
    const message = messageOptions[Math.floor(Math.random() * messageOptions.length)];

    const newNotification = {
      id: Date.now().toString(),
      type,
      title: `Agent "${agentId}" Update`,
      message,
      timestamp: new Date(),
      isRead: false,
      agentId,
      actionType: 'real_time_update'
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast for important notifications
    if (type === 'error' || type === 'warning') {
      toast.error(`${newNotification.title}: ${newNotification.message}`);
    }
  };

  const loadNotifications = async () => {
    try {
      // In a real implementation, this would call the API
      // const data = await apiService.getAgentNotifications();
      // setNotifications(data.notifications || []);
      // setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      // In a real implementation, this would call the API
      // await apiService.markNotificationsRead(notificationIds);

      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length > 0) {
      await markAsRead(unreadIds);
    }
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'error': return AlertCircle;
      case 'warning': return AlertTriangle;
      case 'info': return Info;
      default: return Info;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <NotificationsContainer>
      <NotificationBell onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && (
          <NotificationBadge>
            {unreadCount > 99 ? '99+' : unreadCount}
          </NotificationBadge>
        )}
      </NotificationBell>

      <AnimatePresence>
        {isOpen && (
          <NotificationsPanel
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <PanelHeader>
              <PanelTitle>
                <Bell size={16} />
                Notifications
              </PanelTitle>
              <PanelActions>
                {unreadCount > 0 && (
                  <ActionButton onClick={markAllAsRead}>
                    <Eye size={12} />
                    Mark all read
                  </ActionButton>
                )}
                <ActionButton onClick={() => setIsOpen(false)}>
                  <X size={12} />
                </ActionButton>
              </PanelActions>
            </PanelHeader>

            <NotificationsList>
              {loading ? (
                <LoadingState>
                  <Clock size={16} />
                  Loading notifications...
                </LoadingState>
              ) : notifications.length === 0 ? (
                <EmptyState>
                  <Bell size={32} />
                  <p>No notifications yet</p>
                </EmptyState>
              ) : (
                <AnimatePresence>
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type);

                    return (
                      <NotificationItem
                        key={notification.id}
                        isRead={notification.isRead}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          if (!notification.isRead) {
                            markAsRead([notification.id]);
                          }
                        }}
                      >
                        <NotificationHeader>
                          <NotificationInfo>
                            <NotificationIcon type={notification.type}>
                              <IconComponent size={16} />
                            </NotificationIcon>
                            <NotificationContent>
                              <NotificationTitle>
                                {notification.title}
                              </NotificationTitle>
                              <NotificationMessage>
                                {notification.message}
                              </NotificationMessage>
                            </NotificationContent>
                          </NotificationInfo>
                          <NotificationActions>
                            <QuickAction
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 size={12} />
                            </QuickAction>
                          </NotificationActions>
                        </NotificationHeader>
                        <NotificationMeta>
                          <NotificationTime>
                            <Clock size={10} />
                            {formatTimeAgo(notification.timestamp)}
                          </NotificationTime>
                          <span>Agent: {notification.agentId}</span>
                        </NotificationMeta>
                      </NotificationItem>
                    );
                  })}
                </AnimatePresence>
              )}
            </NotificationsList>
          </NotificationsPanel>
        )}
      </AnimatePresence>
    </NotificationsContainer>
  );
};

export default AgentNotifications;
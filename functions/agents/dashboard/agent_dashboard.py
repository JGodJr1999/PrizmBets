# Agent Dashboard
# Real-time monitoring and management interface for all agents

import asyncio
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

from ..core.base_agent import BaseAgent, Task, TaskStatus, TaskPriority, AgentStatus
from ..core.agent_manager import AgentManager
from ..core.config import get_config

class AgentDashboard:
    """Central dashboard for monitoring and managing all agents"""

    def __init__(self, agent_manager: AgentManager):
        self.agent_manager = agent_manager
        self.logger = self._setup_logger()

        # Dashboard state
        self.dashboard_metrics = {
            'total_agents': 0,
            'active_agents': 0,
            'total_tasks_processed': 0,
            'average_response_time': 0.0,
            'system_uptime': 0.0,
            'error_rate': 0.0,
            'last_updated': None
        }

        # Real-time data
        self.real_time_data = {
            'active_tasks': {},
            'recent_events': [],
            'performance_metrics': {},
            'alerts': []
        }

    def _setup_logger(self) -> logging.Logger:
        """Setup dashboard logger"""
        logger = logging.getLogger("agent.dashboard")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - DASHBOARD - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def get_dashboard_overview(self) -> Dict[str, Any]:
        """Get comprehensive dashboard overview"""
        try:
            # Get system status from agent manager
            system_status = await self.agent_manager.get_system_status()

            # Update dashboard metrics
            await self._update_dashboard_metrics(system_status)

            # Get agent performance data
            agent_performance = await self._get_agent_performance_data()

            # Get task queue status
            task_queue_status = await self._get_task_queue_status()

            # Get recent events
            recent_events = await self._get_recent_events()

            # Get system alerts
            alerts = await self._get_system_alerts()

            dashboard_data = {
                'overview': {
                    'system_status': system_status['manager_status'],
                    'uptime_seconds': system_status.get('uptime_seconds', 0),
                    'total_agents': system_status.get('total_agents', 0),
                    'active_agents': system_status.get('active_agents', 0),
                    'last_updated': datetime.utcnow().isoformat()
                },
                'metrics': self.dashboard_metrics,
                'agent_performance': agent_performance,
                'task_queues': task_queue_status,
                'recent_events': recent_events,
                'alerts': alerts,
                'message_bus_stats': system_status.get('message_bus_stats', {}),
                'persistence_stats': system_status.get('persistence_stats', {})
            }

            self.logger.info("Dashboard overview generated successfully")
            return dashboard_data

        except Exception as e:
            self.logger.error(f"Failed to get dashboard overview: {str(e)}")
            return {'error': str(e)}

    async def get_agent_details(self, agent_id: str) -> Dict[str, Any]:
        """Get detailed information about a specific agent"""
        try:
            agent = self.agent_manager.get_agent(agent_id)
            if not agent:
                return {'error': f'Agent {agent_id} not found'}

            # Get agent status
            agent_status = agent.get_status()

            # Get agent task history
            task_history = await self._get_agent_task_history(agent_id)

            # Get agent performance metrics
            performance_metrics = await self._get_agent_performance_metrics(agent_id)

            # Get agent configuration
            agent_config = agent.config

            # Get subagents if any
            subagents = []
            for subagent_id, subagent in agent.subagents.items():
                subagents.append({
                    'id': subagent_id,
                    'name': subagent.name,
                    'status': subagent.status.value,
                    'capabilities': subagent.get_capabilities()
                })

            agent_details = {
                'basic_info': {
                    'id': agent.id,
                    'name': agent.name,
                    'description': agent.description,
                    'status': agent_status['status'],
                    'uptime': agent_status['uptime'],
                    'last_activity': agent_status['last_activity']
                },
                'performance': performance_metrics,
                'task_info': {
                    'queue_size': agent_status['queue_size'],
                    'active_tasks': agent_status['active_tasks'],
                    'task_history': task_history
                },
                'capabilities': agent_status['capabilities'],
                'subagents': subagents,
                'configuration': agent_config,
                'metrics': agent_status['metrics']
            }

            return agent_details

        except Exception as e:
            self.logger.error(f"Failed to get agent details for {agent_id}: {str(e)}")
            return {'error': str(e)}

    async def get_system_health(self) -> Dict[str, Any]:
        """Get comprehensive system health information"""
        try:
            system_status = await self.agent_manager.get_system_status()

            # Calculate health scores
            health_scores = await self._calculate_health_scores(system_status)

            # Get resource utilization
            resource_utilization = await self._get_resource_utilization()

            # Get error rates and issues
            error_analysis = await self._get_error_analysis()

            # Get performance trends
            performance_trends = await self._get_performance_trends()

            health_data = {
                'overall_health_score': health_scores['overall'],
                'component_health': health_scores['components'],
                'resource_utilization': resource_utilization,
                'error_analysis': error_analysis,
                'performance_trends': performance_trends,
                'recommendations': await self._get_health_recommendations(health_scores),
                'last_health_check': datetime.utcnow().isoformat()
            }

            return health_data

        except Exception as e:
            self.logger.error(f"Failed to get system health: {str(e)}")
            return {'error': str(e)}

    async def execute_agent_action(self, agent_id: str, action: str, parameters: Dict = None) -> Dict[str, Any]:
        """Execute an action on a specific agent"""
        try:
            if action == 'start':
                success = await self.agent_manager.start_agent(agent_id)
                return {'success': success, 'action': 'start', 'agent_id': agent_id}

            elif action == 'stop':
                success = await self.agent_manager.stop_agent(agent_id)
                return {'success': success, 'action': 'stop', 'agent_id': agent_id}

            elif action == 'restart':
                # Stop then start
                await self.agent_manager.stop_agent(agent_id)
                await asyncio.sleep(2)  # Brief pause
                success = await self.agent_manager.start_agent(agent_id)
                return {'success': success, 'action': 'restart', 'agent_id': agent_id}

            elif action == 'assign_task':
                if not parameters or 'task_type' not in parameters:
                    return {'success': False, 'error': 'Task type required for assign_task action'}

                task = Task(
                    task_type=parameters['task_type'],
                    data=parameters.get('task_data', {}),
                    priority=TaskPriority(parameters.get('priority', 2))
                )

                success = await self.agent_manager.assign_task(agent_id, task)
                return {'success': success, 'action': 'assign_task', 'agent_id': agent_id, 'task_id': task.id}

            elif action == 'update_config':
                if not parameters:
                    return {'success': False, 'error': 'Configuration parameters required'}

                agent = self.agent_manager.get_agent(agent_id)
                if agent:
                    agent.config.update(parameters)
                    return {'success': True, 'action': 'update_config', 'agent_id': agent_id}
                else:
                    return {'success': False, 'error': f'Agent {agent_id} not found'}

            else:
                return {'success': False, 'error': f'Unknown action: {action}'}

        except Exception as e:
            self.logger.error(f"Failed to execute action {action} on agent {agent_id}: {str(e)}")
            return {'success': False, 'error': str(e)}

    async def get_task_management_view(self) -> Dict[str, Any]:
        """Get task management overview across all agents"""
        try:
            all_tasks = {}
            task_summary = {
                'total_tasks': 0,
                'pending_tasks': 0,
                'active_tasks': 0,
                'completed_tasks': 0,
                'failed_tasks': 0
            }

            # Collect tasks from all agents
            for agent_id, agent in self.agent_manager.agents.items():
                agent_tasks = {
                    'pending': [self._task_to_dict(task) for task in agent.task_queue],
                    'active': [self._task_to_dict(task) for task in agent.active_tasks.values()],
                    'completed': [self._task_to_dict(task) for task in agent.completed_tasks[-10:]]  # Last 10
                }

                all_tasks[agent_id] = {
                    'agent_name': agent.name,
                    'tasks': agent_tasks,
                    'task_count': {
                        'pending': len(agent_tasks['pending']),
                        'active': len(agent_tasks['active']),
                        'completed': len(agent_tasks['completed'])
                    }
                }

                # Update summary
                task_summary['pending_tasks'] += len(agent_tasks['pending'])
                task_summary['active_tasks'] += len(agent_tasks['active'])
                task_summary['completed_tasks'] += len(agent_tasks['completed'])

            task_summary['total_tasks'] = (
                task_summary['pending_tasks'] +
                task_summary['active_tasks'] +
                task_summary['completed_tasks']
            )

            # Get task analytics
            task_analytics = await self._get_task_analytics()

            return {
                'summary': task_summary,
                'agents': all_tasks,
                'analytics': task_analytics,
                'last_updated': datetime.utcnow().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Failed to get task management view: {str(e)}")
            return {'error': str(e)}

    async def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Get analytics dashboard with insights and trends"""
        try:
            # Get performance analytics
            performance_analytics = await self._get_performance_analytics()

            # Get usage analytics
            usage_analytics = await self._get_usage_analytics()

            # Get error analytics
            error_analytics = await self._get_error_analytics()

            # Get trend analysis
            trend_analysis = await self._get_trend_analysis()

            # Get recommendations
            recommendations = await self._get_analytics_recommendations()

            analytics_data = {
                'performance': performance_analytics,
                'usage': usage_analytics,
                'errors': error_analytics,
                'trends': trend_analysis,
                'recommendations': recommendations,
                'generated_at': datetime.utcnow().isoformat()
            }

            return analytics_data

        except Exception as e:
            self.logger.error(f"Failed to get analytics dashboard: {str(e)}")
            return {'error': str(e)}

    # Helper Methods

    async def _update_dashboard_metrics(self, system_status: Dict):
        """Update dashboard metrics based on system status"""
        self.dashboard_metrics.update({
            'total_agents': system_status.get('total_agents', 0),
            'active_agents': system_status.get('active_agents', 0),
            'system_uptime': system_status.get('uptime_seconds', 0),
            'last_updated': datetime.utcnow().isoformat()
        })

        # Calculate additional metrics
        if system_status.get('agents'):
            total_tasks = sum(
                agent_data.get('metrics', {}).get('tasks_completed', 0) +
                agent_data.get('metrics', {}).get('tasks_failed', 0)
                for agent_data in system_status['agents'].values()
            )

            self.dashboard_metrics['total_tasks_processed'] = total_tasks

            # Calculate average response time and error rate
            response_times = []
            error_counts = []

            for agent_data in system_status['agents'].values():
                metrics = agent_data.get('metrics', {})
                if metrics.get('avg_task_duration'):
                    response_times.append(metrics['avg_task_duration'])
                error_counts.append(metrics.get('tasks_failed', 0))

            if response_times:
                self.dashboard_metrics['average_response_time'] = sum(response_times) / len(response_times)

            if total_tasks > 0:
                self.dashboard_metrics['error_rate'] = (sum(error_counts) / total_tasks) * 100

    async def _get_agent_performance_data(self) -> Dict[str, Any]:
        """Get performance data for all agents"""
        performance_data = {}

        for agent_id, agent in self.agent_manager.agents.items():
            metrics = agent.metrics

            performance_data[agent_id] = {
                'name': agent.name,
                'status': agent.status.value,
                'tasks_completed': metrics.get('tasks_completed', 0),
                'tasks_failed': metrics.get('tasks_failed', 0),
                'success_rate': self._calculate_success_rate(metrics),
                'avg_response_time': metrics.get('avg_task_duration', 0),
                'uptime_percentage': metrics.get('uptime_percentage', 0),
                'performance_score': metrics.get('performance_score', 0),
                'last_error': metrics.get('last_error'),
                'queue_size': len(agent.task_queue),
                'active_tasks': len(agent.active_tasks)
            }

        return performance_data

    async def _get_task_queue_status(self) -> Dict[str, Any]:
        """Get task queue status across all agents"""
        queue_status = {}

        for agent_id, agent in self.agent_manager.agents.items():
            queue_info = {
                'pending_count': len(agent.task_queue),
                'active_count': len(agent.active_tasks),
                'completed_count': len(agent.completed_tasks),
                'priority_breakdown': self._analyze_task_priorities(agent.task_queue)
            }

            queue_status[agent_id] = {
                'agent_name': agent.name,
                'queue_info': queue_info
            }

        return queue_status

    async def _get_recent_events(self, limit: int = 50) -> List[Dict]:
        """Get recent system events"""
        # This would typically pull from a centralized event log
        # For now, we'll generate some sample events
        events = []

        for agent_id, agent in self.agent_manager.agents.items():
            # Add agent status events
            events.append({
                'timestamp': agent.last_activity.isoformat(),
                'type': 'agent_activity',
                'agent_id': agent_id,
                'agent_name': agent.name,
                'description': f'Agent {agent.name} last activity',
                'severity': 'info'
            })

        # Sort by timestamp and limit
        events.sort(key=lambda x: x['timestamp'], reverse=True)
        return events[:limit]

    async def _get_system_alerts(self) -> List[Dict]:
        """Get current system alerts"""
        alerts = []

        for agent_id, agent in self.agent_manager.agents.items():
            # Check for agent-specific alerts
            if agent.status == AgentStatus.ERROR:
                alerts.append({
                    'id': f'agent_error_{agent_id}',
                    'type': 'agent_error',
                    'severity': 'critical',
                    'agent_id': agent_id,
                    'agent_name': agent.name,
                    'message': f'Agent {agent.name} is in error state',
                    'timestamp': datetime.utcnow().isoformat()
                })

            # Check for high queue sizes
            if len(agent.task_queue) > 50:
                alerts.append({
                    'id': f'high_queue_{agent_id}',
                    'type': 'high_queue',
                    'severity': 'warning',
                    'agent_id': agent_id,
                    'agent_name': agent.name,
                    'message': f'Agent {agent.name} has high queue size: {len(agent.task_queue)}',
                    'timestamp': datetime.utcnow().isoformat()
                })

            # Check for low performance
            performance_score = agent.metrics.get('performance_score', 100)
            if performance_score < 70:
                alerts.append({
                    'id': f'low_performance_{agent_id}',
                    'type': 'low_performance',
                    'severity': 'warning',
                    'agent_id': agent_id,
                    'agent_name': agent.name,
                    'message': f'Agent {agent.name} has low performance score: {performance_score}',
                    'timestamp': datetime.utcnow().isoformat()
                })

        return alerts

    async def _get_agent_task_history(self, agent_id: str, limit: int = 20) -> List[Dict]:
        """Get task history for a specific agent"""
        agent = self.agent_manager.get_agent(agent_id)
        if not agent:
            return []

        # Get recent completed tasks
        recent_tasks = agent.completed_tasks[-limit:] if agent.completed_tasks else []

        return [self._task_to_dict(task) for task in recent_tasks]

    async def _get_agent_performance_metrics(self, agent_id: str) -> Dict[str, Any]:
        """Get detailed performance metrics for a specific agent"""
        agent = self.agent_manager.get_agent(agent_id)
        if not agent:
            return {}

        metrics = agent.metrics

        return {
            'tasks_completed': metrics.get('tasks_completed', 0),
            'tasks_failed': metrics.get('tasks_failed', 0),
            'success_rate': self._calculate_success_rate(metrics),
            'avg_task_duration': metrics.get('avg_task_duration', 0),
            'uptime_percentage': metrics.get('uptime_percentage', 0),
            'performance_score': metrics.get('performance_score', 0),
            'last_error': metrics.get('last_error'),
            'error_count_24h': self._get_recent_error_count(agent),
            'throughput': self._calculate_throughput(agent),
            'efficiency_score': self._calculate_efficiency_score(metrics)
        }

    def _task_to_dict(self, task) -> Dict:
        """Convert task object to dictionary"""
        if hasattr(task, 'to_dict'):
            return task.to_dict()
        else:
            # Fallback for basic task representation
            return {
                'id': getattr(task, 'id', 'unknown'),
                'type': getattr(task, 'type', 'unknown'),
                'status': getattr(task, 'status', 'unknown'),
                'created_at': getattr(task, 'created_at', datetime.utcnow()).isoformat(),
                'priority': getattr(task, 'priority', 'medium')
            }

    def _calculate_success_rate(self, metrics: Dict) -> float:
        """Calculate success rate from metrics"""
        completed = metrics.get('tasks_completed', 0)
        failed = metrics.get('tasks_failed', 0)
        total = completed + failed

        if total == 0:
            return 100.0

        return (completed / total) * 100

    def _analyze_task_priorities(self, task_queue: List) -> Dict[str, int]:
        """Analyze task priorities in queue"""
        priority_counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}

        for task in task_queue:
            priority = getattr(task, 'priority', TaskPriority.MEDIUM)
            if hasattr(priority, 'value'):
                priority_value = priority.value
            else:
                priority_value = priority

            if priority_value == 4:
                priority_counts['critical'] += 1
            elif priority_value == 3:
                priority_counts['high'] += 1
            elif priority_value == 2:
                priority_counts['medium'] += 1
            else:
                priority_counts['low'] += 1

        return priority_counts

    async def _calculate_health_scores(self, system_status: Dict) -> Dict[str, Any]:
        """Calculate health scores for system components"""
        # Overall system health based on multiple factors
        agent_health = (system_status.get('active_agents', 0) / max(1, system_status.get('total_agents', 1))) * 100

        # Component health scores
        components = {
            'agent_manager': 100 if system_status.get('manager_status') == 'active' else 0,
            'message_bus': 100 if system_status.get('message_bus_stats', {}).get('is_running') else 0,
            'persistence': 100 if 'error' not in str(system_status.get('persistence_stats', {})) else 0,
            'agents': agent_health
        }

        # Calculate overall health as weighted average
        weights = {'agent_manager': 0.3, 'message_bus': 0.2, 'persistence': 0.2, 'agents': 0.3}
        overall = sum(score * weights.get(component, 0.25) for component, score in components.items())

        return {
            'overall': round(overall, 1),
            'components': components
        }

    async def _get_resource_utilization(self) -> Dict[str, Any]:
        """Get resource utilization metrics"""
        # This would integrate with actual system monitoring
        # For now, we'll return simulated data
        return {
            'cpu_usage': 45.2,
            'memory_usage': 62.8,
            'disk_usage': 34.1,
            'network_io': 12.5,
            'firebase_functions_usage': 23.7,
            'firestore_operations': 156
        }

    async def _get_error_analysis(self) -> Dict[str, Any]:
        """Get error analysis data"""
        error_data = {
            'total_errors_24h': 0,
            'error_rate': 0.0,
            'top_errors': [],
            'error_trends': 'stable'
        }

        # Collect errors from all agents
        for agent in self.agent_manager.agents.values():
            error_data['total_errors_24h'] += agent.metrics.get('tasks_failed', 0)

        # Calculate error rate
        total_tasks = sum(
            agent.metrics.get('tasks_completed', 0) + agent.metrics.get('tasks_failed', 0)
            for agent in self.agent_manager.agents.values()
        )

        if total_tasks > 0:
            error_data['error_rate'] = (error_data['total_errors_24h'] / total_tasks) * 100

        return error_data

    async def _get_performance_trends(self) -> Dict[str, Any]:
        """Get performance trend data"""
        # This would typically analyze historical data
        # For now, we'll return simulated trends
        return {
            'response_time_trend': 'improving',
            'throughput_trend': 'stable',
            'error_rate_trend': 'improving',
            'availability_trend': 'stable'
        }

    async def _get_health_recommendations(self, health_scores: Dict) -> List[str]:
        """Get health-based recommendations"""
        recommendations = []

        overall_health = health_scores['overall']
        components = health_scores['components']

        if overall_health < 80:
            recommendations.append('System health is below optimal. Review component statuses.')

        if components.get('agents', 100) < 90:
            recommendations.append('Some agents are not active. Check agent configurations.')

        if components.get('message_bus', 100) < 100:
            recommendations.append('Message bus issues detected. Check communication system.')

        if components.get('persistence', 100) < 100:
            recommendations.append('Persistence layer issues detected. Check Firestore connectivity.')

        return recommendations

    async def _get_task_analytics(self) -> Dict[str, Any]:
        """Get task analytics across the system"""
        # Aggregate task data from all agents
        total_pending = sum(len(agent.task_queue) for agent in self.agent_manager.agents.values())
        total_active = sum(len(agent.active_tasks) for agent in self.agent_manager.agents.values())

        return {
            'average_queue_length': total_pending / max(1, len(self.agent_manager.agents)),
            'total_active_tasks': total_active,
            'task_distribution': self._get_task_distribution(),
            'bottlenecks': self._identify_bottlenecks()
        }

    def _get_task_distribution(self) -> Dict[str, int]:
        """Get distribution of tasks by type"""
        # This would analyze actual task types
        # For now, return simulated data
        return {
            'analytics': 15,
            'security': 8,
            'testing': 12,
            'marketing': 6,
            'monitoring': 10
        }

    def _identify_bottlenecks(self) -> List[str]:
        """Identify system bottlenecks"""
        bottlenecks = []

        for agent_id, agent in self.agent_manager.agents.items():
            if len(agent.task_queue) > 20:
                bottlenecks.append(f'High queue in {agent.name}')

            if len(agent.active_tasks) > 5:
                bottlenecks.append(f'Many active tasks in {agent.name}')

        return bottlenecks

    def _get_recent_error_count(self, agent) -> int:
        """Get recent error count for agent"""
        # This would analyze recent error logs
        # For now, return the current failed count
        return agent.metrics.get('tasks_failed', 0)

    def _calculate_throughput(self, agent) -> float:
        """Calculate agent throughput"""
        # Tasks completed per hour (simplified)
        uptime_hours = max(1, (datetime.utcnow() - agent.created_at).total_seconds() / 3600)
        return agent.metrics.get('tasks_completed', 0) / uptime_hours

    def _calculate_efficiency_score(self, metrics: Dict) -> float:
        """Calculate efficiency score"""
        success_rate = self._calculate_success_rate(metrics)
        performance_score = metrics.get('performance_score', 100)
        uptime = metrics.get('uptime_percentage', 100)

        # Weighted average
        return (success_rate * 0.4 + performance_score * 0.4 + uptime * 0.2)

    # Additional analytics methods
    async def _get_performance_analytics(self) -> Dict[str, Any]:
        """Get detailed performance analytics"""
        return {
            'avg_response_time': self.dashboard_metrics.get('average_response_time', 0),
            'throughput': self._calculate_system_throughput(),
            'availability': self._calculate_system_availability(),
            'efficiency': self._calculate_system_efficiency()
        }

    async def _get_usage_analytics(self) -> Dict[str, Any]:
        """Get usage analytics"""
        return {
            'total_requests': self.dashboard_metrics.get('total_tasks_processed', 0),
            'active_sessions': len(self.agent_manager.agents),
            'peak_usage_times': ['14:00-16:00', '19:00-21:00'],
            'usage_trends': 'increasing'
        }

    async def _get_error_analytics(self) -> Dict[str, Any]:
        """Get error analytics"""
        error_rate = self.dashboard_metrics.get('error_rate', 0)
        return {
            'error_rate': error_rate,
            'error_categories': ['timeout', 'validation', 'system'],
            'resolution_time': 'avg 2.5 minutes',
            'error_trend': 'decreasing' if error_rate < 5 else 'stable'
        }

    async def _get_trend_analysis(self) -> Dict[str, Any]:
        """Get trend analysis"""
        return {
            'performance_trend': 'improving',
            'usage_trend': 'growing',
            'error_trend': 'stable',
            'capacity_trend': 'adequate'
        }

    async def _get_analytics_recommendations(self) -> List[str]:
        """Get analytics-based recommendations"""
        recommendations = []

        if self.dashboard_metrics.get('error_rate', 0) > 5:
            recommendations.append('Error rate is elevated. Review error logs and implement fixes.')

        if self.dashboard_metrics.get('average_response_time', 0) > 5:
            recommendations.append('Response times are high. Consider optimizing agent performance.')

        active_ratio = (
            self.dashboard_metrics.get('active_agents', 0) /
            max(1, self.dashboard_metrics.get('total_agents', 1))
        )

        if active_ratio < 0.8:
            recommendations.append('Many agents are inactive. Check agent health and configurations.')

        return recommendations

    def _calculate_system_throughput(self) -> float:
        """Calculate overall system throughput"""
        total_completed = sum(
            agent.metrics.get('tasks_completed', 0)
            for agent in self.agent_manager.agents.values()
        )

        # Calculate uptime in hours
        uptime_seconds = self.dashboard_metrics.get('system_uptime', 0)
        uptime_hours = max(1, uptime_seconds / 3600)

        return total_completed / uptime_hours

    def _calculate_system_availability(self) -> float:
        """Calculate system availability percentage"""
        if not self.agent_manager.agents:
            return 0.0

        total_uptime = sum(
            agent.metrics.get('uptime_percentage', 0)
            for agent in self.agent_manager.agents.values()
        )

        return total_uptime / len(self.agent_manager.agents)

    def _calculate_system_efficiency(self) -> float:
        """Calculate overall system efficiency"""
        if not self.agent_manager.agents:
            return 0.0

        total_efficiency = sum(
            self._calculate_efficiency_score(agent.metrics)
            for agent in self.agent_manager.agents.values()
        )

        return total_efficiency / len(self.agent_manager.agents)
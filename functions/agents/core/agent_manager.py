# Agent Manager - Central coordination and management of all agents
# Handles agent lifecycle, task routing, and system coordination

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Type
from enum import Enum

from .base_agent import BaseAgent, Task, TaskStatus, TaskPriority, AgentStatus
from .communication import MessageBus, MessageType, MessagePriority, AgentCoordinator
from .persistence import AgentPersistence

class AgentManagerStatus(Enum):
    INACTIVE = "inactive"
    STARTING = "starting"
    ACTIVE = "active"
    STOPPING = "stopping"
    ERROR = "error"

class AgentManager:
    """Central manager for all PrizmBets AI agents"""

    def __init__(self, firebase_app=None):
        self.firebase_app = firebase_app
        self.status = AgentManagerStatus.INACTIVE

        # Core components
        self.persistence = AgentPersistence(firebase_app)
        self.message_bus = MessageBus(self.persistence)
        self.coordinator = AgentCoordinator(self.message_bus)

        # Agent registry
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_classes: Dict[str, Type[BaseAgent]] = {}

        # System state
        self.start_time = None
        self.health_check_task = None
        self.cleanup_task = None

        # Configuration
        self.config = {
            'auto_start_agents': True,
            'health_check_interval': 30,  # seconds
            'cleanup_interval': 3600,    # 1 hour
            'max_retry_attempts': 3,
            'agent_timeout': 300,        # 5 minutes
            'enable_monitoring': True
        }

        self.logger = self._setup_logger()

    def _setup_logger(self) -> logging.Logger:
        """Setup agent manager logger"""
        logger = logging.getLogger("agent.manager")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - AGENT_MANAGER - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def start(self) -> bool:
        """Start the agent manager and all registered agents"""
        try:
            self.logger.info("Starting Agent Manager")
            self.status = AgentManagerStatus.STARTING
            self.start_time = datetime.utcnow()

            # Load configuration
            await self._load_configuration()

            # Start core components
            await self.message_bus.start()

            # Initialize and start all registered agents
            if self.config.get('auto_start_agents', True):
                await self._start_all_agents()

            # Start background tasks
            if self.config.get('enable_monitoring', True):
                self.health_check_task = asyncio.create_task(self._health_check_loop())
                self.cleanup_task = asyncio.create_task(self._cleanup_loop())

            self.status = AgentManagerStatus.ACTIVE
            self.logger.info("Agent Manager started successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to start Agent Manager: {str(e)}")
            self.status = AgentManagerStatus.ERROR
            return False

    async def stop(self) -> bool:
        """Stop the agent manager and all agents"""
        try:
            self.logger.info("Stopping Agent Manager")
            self.status = AgentManagerStatus.STOPPING

            # Cancel background tasks
            if self.health_check_task and not self.health_check_task.done():
                self.health_check_task.cancel()

            if self.cleanup_task and not self.cleanup_task.done():
                self.cleanup_task.cancel()

            # Stop all agents
            await self._stop_all_agents()

            # Stop core components
            await self.message_bus.stop()

            # Save final state
            await self._save_system_state()

            self.status = AgentManagerStatus.INACTIVE
            self.logger.info("Agent Manager stopped successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to stop Agent Manager: {str(e)}")
            return False

    def register_agent_class(self, agent_type: str, agent_class: Type[BaseAgent]):
        """Register an agent class for dynamic instantiation"""
        self.agent_classes[agent_type] = agent_class
        self.logger.info(f"Registered agent class: {agent_type}")

    async def create_agent(self, agent_type: str, agent_id: str, name: str,
                          config: Dict = None, auto_start: bool = True) -> Optional[BaseAgent]:
        """Create and optionally start an agent instance"""
        try:
            if agent_type not in self.agent_classes:
                self.logger.error(f"Unknown agent type: {agent_type}")
                return None

            if agent_id in self.agents:
                self.logger.warning(f"Agent {agent_id} already exists")
                return self.agents[agent_id]

            # Create agent instance
            agent_class = self.agent_classes[agent_type]
            agent = agent_class(
                agent_id=agent_id,
                name=name,
                config=config or {},
                persistence_manager=self.persistence,
                message_bus=self.message_bus
            )

            # Register agent
            self.agents[agent_id] = agent

            # Start agent if requested
            if auto_start:
                success = await agent.start()
                if not success:
                    self.logger.error(f"Failed to start agent {agent_id}")
                    self.agents.pop(agent_id, None)
                    return None

            self.logger.info(f"Created agent {agent_id} ({agent_type})")
            return agent

        except Exception as e:
            self.logger.error(f"Failed to create agent {agent_id}: {str(e)}")
            return None

    async def remove_agent(self, agent_id: str) -> bool:
        """Remove an agent from the system"""
        try:
            if agent_id not in self.agents:
                self.logger.warning(f"Agent {agent_id} not found")
                return False

            agent = self.agents[agent_id]

            # Stop agent if running
            if agent.status != AgentStatus.INACTIVE:
                await agent.stop()

            # Remove from registry
            del self.agents[agent_id]

            self.logger.info(f"Removed agent {agent_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to remove agent {agent_id}: {str(e)}")
            return False

    async def start_agent(self, agent_id: str) -> bool:
        """Start a specific agent"""
        try:
            if agent_id not in self.agents:
                self.logger.error(f"Agent {agent_id} not found")
                return False

            agent = self.agents[agent_id]
            if agent.status == AgentStatus.ACTIVE:
                self.logger.info(f"Agent {agent_id} is already active")
                return True

            success = await agent.start()
            if success:
                self.logger.info(f"Started agent {agent_id}")
            else:
                self.logger.error(f"Failed to start agent {agent_id}")

            return success

        except Exception as e:
            self.logger.error(f"Error starting agent {agent_id}: {str(e)}")
            return False

    async def stop_agent(self, agent_id: str) -> bool:
        """Stop a specific agent"""
        try:
            if agent_id not in self.agents:
                self.logger.error(f"Agent {agent_id} not found")
                return False

            agent = self.agents[agent_id]
            if agent.status == AgentStatus.INACTIVE:
                self.logger.info(f"Agent {agent_id} is already inactive")
                return True

            success = await agent.stop()
            if success:
                self.logger.info(f"Stopped agent {agent_id}")
            else:
                self.logger.error(f"Failed to stop agent {agent_id}")

            return success

        except Exception as e:
            self.logger.error(f"Error stopping agent {agent_id}: {str(e)}")
            return False

    async def assign_task(self, agent_id: str, task: Task) -> bool:
        """Assign a task to a specific agent"""
        try:
            if agent_id not in self.agents:
                self.logger.error(f"Agent {agent_id} not found")
                return False

            agent = self.agents[agent_id]
            success = await agent.add_task(task)

            if success:
                self.logger.info(f"Assigned task {task.id} to agent {agent_id}")
            else:
                self.logger.error(f"Failed to assign task {task.id} to agent {agent_id}")

            return success

        except Exception as e:
            self.logger.error(f"Error assigning task: {str(e)}")
            return False

    async def route_task(self, task_type: str, task_data: Dict = None,
                        priority: TaskPriority = TaskPriority.MEDIUM) -> Optional[str]:
        """Automatically route a task to the best available agent"""
        try:
            # Create task
            task = Task(
                task_type=task_type,
                data=task_data or {},
                priority=priority,
                created_by="system"
            )

            # Find suitable agents
            suitable_agents = []
            for agent_id, agent in self.agents.items():
                if (agent.status == AgentStatus.ACTIVE and
                    await agent.can_handle_task(task)):
                    suitable_agents.append((agent_id, agent))

            if not suitable_agents:
                self.logger.warning(f"No suitable agents found for task type: {task_type}")
                return None

            # Select best agent (least busy)
            best_agent_id, best_agent = min(
                suitable_agents,
                key=lambda x: len(x[1].task_queue) + len(x[1].active_tasks)
            )

            # Assign task
            success = await self.assign_task(best_agent_id, task)
            if success:
                self.logger.info(f"Routed task {task.id} to agent {best_agent_id}")
                return task.id
            else:
                return None

        except Exception as e:
            self.logger.error(f"Error routing task: {str(e)}")
            return None

    async def broadcast_task(self, task_type: str, task_data: Dict = None,
                           target_capabilities: List[str] = None) -> List[str]:
        """Broadcast a task to multiple agents based on capabilities"""
        try:
            task_ids = []

            for agent_id, agent in self.agents.items():
                if agent.status != AgentStatus.ACTIVE:
                    continue

                # Check capabilities if specified
                if target_capabilities:
                    agent_capabilities = agent.get_capabilities()
                    if not any(cap in agent_capabilities for cap in target_capabilities):
                        continue

                # Create and assign task
                task = Task(
                    task_type=task_type,
                    data=task_data or {},
                    priority=TaskPriority.NORMAL,
                    created_by="system"
                )

                if await agent.can_handle_task(task):
                    success = await self.assign_task(agent_id, task)
                    if success:
                        task_ids.append(task.id)

            self.logger.info(f"Broadcasted task to {len(task_ids)} agents")
            return task_ids

        except Exception as e:
            self.logger.error(f"Error broadcasting task: {str(e)}")
            return []

    async def get_system_status(self) -> Dict:
        """Get comprehensive system status"""
        try:
            agent_statuses = {}
            for agent_id, agent in self.agents.items():
                agent_statuses[agent_id] = agent.get_status()

            uptime = (datetime.utcnow() - self.start_time).total_seconds() if self.start_time else 0

            return {
                'manager_status': self.status.value,
                'uptime_seconds': uptime,
                'total_agents': len(self.agents),
                'active_agents': len([a for a in self.agents.values() if a.status == AgentStatus.ACTIVE]),
                'message_bus_stats': self.message_bus.get_message_stats(),
                'persistence_stats': await self.persistence.get_stats(),
                'agents': agent_statuses,
                'config': self.config,
                'last_updated': datetime.utcnow().isoformat()
            }

        except Exception as e:
            self.logger.error(f"Error getting system status: {str(e)}")
            return {'error': str(e)}

    async def _start_all_agents(self):
        """Start all registered agents"""
        for agent_id, agent in self.agents.items():
            try:
                if agent.status == AgentStatus.INACTIVE:
                    await agent.start()
            except Exception as e:
                self.logger.error(f"Failed to start agent {agent_id}: {str(e)}")

    async def _stop_all_agents(self):
        """Stop all agents"""
        stop_tasks = []
        for agent in self.agents.values():
            if agent.status != AgentStatus.INACTIVE:
                stop_tasks.append(agent.stop())

        if stop_tasks:
            await asyncio.gather(*stop_tasks, return_exceptions=True)

    async def _health_check_loop(self):
        """Periodic health check for all agents"""
        while self.status == AgentManagerStatus.ACTIVE:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.config['health_check_interval'])
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Health check error: {str(e)}")
                await asyncio.sleep(30)

    async def _perform_health_checks(self):
        """Perform health checks on all agents"""
        for agent_id, agent in self.agents.items():
            try:
                # Check if agent is responsive
                if agent.status == AgentStatus.ACTIVE:
                    # Check last activity
                    inactive_time = (datetime.utcnow() - agent.last_activity).total_seconds()
                    if inactive_time > self.config['agent_timeout']:
                        self.logger.warning(f"Agent {agent_id} appears unresponsive")
                        # Optionally restart agent
                        await self._restart_agent(agent_id)

                # Update performance metrics
                await self._update_agent_metrics(agent)

            except Exception as e:
                self.logger.error(f"Health check failed for agent {agent_id}: {str(e)}")

    async def _restart_agent(self, agent_id: str) -> bool:
        """Restart an unresponsive agent"""
        try:
            self.logger.info(f"Restarting agent {agent_id}")
            agent = self.agents[agent_id]

            # Stop agent
            await agent.stop()

            # Wait briefly
            await asyncio.sleep(2)

            # Start agent
            success = await agent.start()
            if success:
                self.logger.info(f"Successfully restarted agent {agent_id}")
            else:
                self.logger.error(f"Failed to restart agent {agent_id}")

            return success

        except Exception as e:
            self.logger.error(f"Error restarting agent {agent_id}: {str(e)}")
            return False

    async def _update_agent_metrics(self, agent: BaseAgent):
        """Update performance metrics for an agent"""
        try:
            # Calculate uptime percentage
            if agent.created_at:
                total_time = (datetime.utcnow() - agent.created_at).total_seconds()
                if total_time > 0:
                    # Estimate active time (simplified)
                    active_time = total_time - (agent.metrics.get('downtime', 0))
                    agent.metrics['uptime_percentage'] = (active_time / total_time) * 100

            # Calculate performance score based on success rate
            total_tasks = agent.metrics['tasks_completed'] + agent.metrics['tasks_failed']
            if total_tasks > 0:
                success_rate = agent.metrics['tasks_completed'] / total_tasks
                agent.metrics['performance_score'] = success_rate * 100

        except Exception as e:
            self.logger.error(f"Error updating metrics for {agent.id}: {str(e)}")

    async def _cleanup_loop(self):
        """Periodic cleanup of old data"""
        while self.status == AgentManagerStatus.ACTIVE:
            try:
                await self._perform_cleanup()
                await asyncio.sleep(self.config['cleanup_interval'])
            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error(f"Cleanup error: {str(e)}")
                await asyncio.sleep(3600)

    async def _perform_cleanup(self):
        """Perform system cleanup"""
        try:
            # Clean up old data
            await self.persistence.delete_old_data(days_old=7)

            # Clean up completed tasks in memory
            for agent in self.agents.values():
                if len(agent.completed_tasks) > 100:
                    agent.completed_tasks = agent.completed_tasks[-50:]

            self.logger.info("Performed system cleanup")

        except Exception as e:
            self.logger.error(f"Cleanup error: {str(e)}")

    async def _load_configuration(self):
        """Load configuration from persistence"""
        try:
            config = await self.persistence.load_config('agent_manager')
            if config:
                self.config.update(config)
                self.logger.info("Loaded configuration from persistence")

        except Exception as e:
            self.logger.error(f"Failed to load configuration: {str(e)}")

    async def _save_system_state(self):
        """Save current system state"""
        try:
            state = {
                'status': self.status.value,
                'start_time': self.start_time.isoformat() if self.start_time else None,
                'agents': list(self.agents.keys()),
                'config': self.config
            }

            await self.persistence.save_config('agent_manager_state', state)
            self.logger.info("Saved system state")

        except Exception as e:
            self.logger.error(f"Failed to save system state: {str(e)}")

    # Convenience methods for common operations

    def get_agent(self, agent_id: str) -> Optional[BaseAgent]:
        """Get an agent by ID"""
        return self.agents.get(agent_id)

    def get_agents_by_capability(self, capability: str) -> List[BaseAgent]:
        """Get all agents with a specific capability"""
        return [
            agent for agent in self.agents.values()
            if capability in agent.get_capabilities()
        ]

    def get_active_agents(self) -> List[BaseAgent]:
        """Get all active agents"""
        return [
            agent for agent in self.agents.values()
            if agent.status == AgentStatus.ACTIVE
        ]

    async def update_config(self, new_config: Dict):
        """Update system configuration"""
        self.config.update(new_config)
        await self.persistence.save_config('agent_manager', self.config)
        self.logger.info("Updated system configuration")
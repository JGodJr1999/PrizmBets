# Base Agent Class - Foundation for all PrizmBets AI Agents
# Provides core functionality: task management, communication, persistence, logging

import asyncio
import uuid
import time
import json
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
import logging

class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class AgentStatus(Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class Task:
    """Represents a task that can be executed by an agent"""

    def __init__(self, task_id: str = None, task_type: str = "",
                 data: Dict = None, priority: TaskPriority = TaskPriority.MEDIUM,
                 created_by: str = "system", timeout: int = 300):
        self.id = task_id or str(uuid.uuid4())
        self.type = task_type
        self.data = data or {}
        self.priority = priority
        self.status = TaskStatus.PENDING
        self.created_at = datetime.utcnow()
        self.created_by = created_by
        self.updated_at = self.created_at
        self.timeout = timeout
        self.result = None
        self.error = None
        self.retry_count = 0
        self.max_retries = 3

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'type': self.type,
            'data': self.data,
            'priority': self.priority.value,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'created_by': self.created_by,
            'updated_at': self.updated_at.isoformat(),
            'timeout': self.timeout,
            'result': self.result,
            'error': self.error,
            'retry_count': self.retry_count,
            'max_retries': self.max_retries
        }

    @classmethod
    def from_dict(cls, data: Dict):
        task = cls(
            task_id=data['id'],
            task_type=data['type'],
            data=data.get('data', {}),
            priority=TaskPriority(data.get('priority', 2)),
            created_by=data.get('created_by', 'system'),
            timeout=data.get('timeout', 300)
        )
        task.status = TaskStatus(data.get('status', 'pending'))
        task.created_at = datetime.fromisoformat(data['created_at'])
        task.updated_at = datetime.fromisoformat(data['updated_at'])
        task.result = data.get('result')
        task.error = data.get('error')
        task.retry_count = data.get('retry_count', 0)
        task.max_retries = data.get('max_retries', 3)
        return task

class BaseAgent(ABC):
    """Abstract base class for all PrizmBets AI Agents"""

    def __init__(self, agent_id: str, name: str, description: str = "",
                 config: Dict = None, persistence_manager=None, message_bus=None):
        self.id = agent_id
        self.name = name
        self.description = description
        self.config = config or {}
        self.status = AgentStatus.INACTIVE
        self.created_at = datetime.utcnow()
        self.last_activity = self.created_at
        self.task_queue: List[Task] = []
        self.active_tasks: Dict[str, Task] = {}
        self.completed_tasks: List[Task] = []
        self.capabilities: List[str] = []
        self.subagents: Dict[str, 'BaseAgent'] = {}
        self.parent_agent: Optional['BaseAgent'] = None
        self.metrics = {
            'tasks_completed': 0,
            'tasks_failed': 0,
            'avg_task_duration': 0,
            'uptime_percentage': 0,
            'last_error': None,
            'performance_score': 100
        }

        # External dependencies
        self.persistence = persistence_manager
        self.message_bus = message_bus
        self.logger = self._setup_logger()

        # Task processing
        self._is_running = False
        self._task_processor = None

    def _setup_logger(self) -> logging.Logger:
        """Setup agent-specific logger"""
        logger = logging.getLogger(f"agent.{self.id}")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                f'%(asctime)s - AGENT:{self.id} - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def start(self) -> bool:
        """Start the agent and begin task processing"""
        try:
            self.logger.info(f"Starting agent {self.name}")

            # Initialize agent
            await self.initialize()

            # Start task processor
            self._is_running = True
            self.status = AgentStatus.ACTIVE
            self._task_processor = asyncio.create_task(self._process_tasks())

            # Load persisted state
            if self.persistence:
                await self._load_state()

            # Register with message bus
            if self.message_bus:
                await self.message_bus.register_agent(self)

            self.logger.info(f"Agent {self.name} started successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to start agent {self.name}: {str(e)}")
            self.status = AgentStatus.ERROR
            self.metrics['last_error'] = str(e)
            return False

    async def stop(self) -> bool:
        """Stop the agent and cleanup resources"""
        try:
            self.logger.info(f"Stopping agent {self.name}")

            self._is_running = False
            self.status = AgentStatus.INACTIVE

            # Cancel task processor
            if self._task_processor and not self._task_processor.done():
                self._task_processor.cancel()
                try:
                    await self._task_processor
                except asyncio.CancelledError:
                    pass

            # Save state
            if self.persistence:
                await self._save_state()

            # Unregister from message bus
            if self.message_bus:
                await self.message_bus.unregister_agent(self)

            # Cleanup
            await self.cleanup()

            self.logger.info(f"Agent {self.name} stopped successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to stop agent {self.name}: {str(e)}")
            return False

    async def add_task(self, task: Task) -> bool:
        """Add a task to the agent's queue"""
        try:
            # Validate task
            if not task or not task.type:
                self.logger.warning("Invalid task provided")
                return False

            # Check if we can handle this task type
            if not await self.can_handle_task(task):
                self.logger.warning(f"Cannot handle task type: {task.type}")
                return False

            # Add to queue (sorted by priority)
            self.task_queue.append(task)
            self.task_queue.sort(key=lambda t: t.priority.value, reverse=True)

            # Persist task
            if self.persistence:
                await self.persistence.save_task(self.id, task)

            self.logger.info(f"Task {task.id} added to queue (type: {task.type})")
            return True

        except Exception as e:
            self.logger.error(f"Failed to add task: {str(e)}")
            return False

    async def _process_tasks(self):
        """Main task processing loop"""
        while self._is_running:
            try:
                if self.task_queue and self.status == AgentStatus.ACTIVE:
                    # Get next task
                    task = self.task_queue.pop(0)

                    # Move to active tasks
                    self.active_tasks[task.id] = task
                    task.status = TaskStatus.IN_PROGRESS
                    task.updated_at = datetime.utcnow()
                    self.status = AgentStatus.BUSY

                    self.logger.info(f"Processing task {task.id} (type: {task.type})")

                    start_time = time.time()

                    try:
                        # Execute task with timeout
                        result = await asyncio.wait_for(
                            self.execute_task(task),
                            timeout=task.timeout
                        )

                        # Task completed successfully
                        task.status = TaskStatus.COMPLETED
                        task.result = result
                        task.updated_at = datetime.utcnow()

                        # Update metrics
                        duration = time.time() - start_time
                        self.metrics['tasks_completed'] += 1
                        self._update_avg_duration(duration)

                        self.logger.info(f"Task {task.id} completed successfully")

                    except asyncio.TimeoutError:
                        task.status = TaskStatus.FAILED
                        task.error = "Task timeout"
                        task.updated_at = datetime.utcnow()
                        self.metrics['tasks_failed'] += 1
                        self.logger.error(f"Task {task.id} timed out")

                    except Exception as e:
                        task.status = TaskStatus.FAILED
                        task.error = str(e)
                        task.updated_at = datetime.utcnow()
                        self.metrics['tasks_failed'] += 1
                        self.logger.error(f"Task {task.id} failed: {str(e)}")

                        # Retry logic
                        if task.retry_count < task.max_retries:
                            task.retry_count += 1
                            task.status = TaskStatus.PENDING
                            self.task_queue.append(task)
                            self.logger.info(f"Retrying task {task.id} (attempt {task.retry_count})")

                    finally:
                        # Move to completed tasks
                        if task.status in [TaskStatus.COMPLETED, TaskStatus.FAILED]:
                            self.active_tasks.pop(task.id, None)
                            self.completed_tasks.append(task)

                            # Keep only last 100 completed tasks
                            if len(self.completed_tasks) > 100:
                                self.completed_tasks = self.completed_tasks[-100:]

                        # Update agent status
                        self.status = AgentStatus.ACTIVE if not self.active_tasks else AgentStatus.BUSY
                        self.last_activity = datetime.utcnow()

                        # Persist state
                        if self.persistence:
                            await self.persistence.save_agent_state(self)

                # Sleep briefly before checking for more tasks
                await asyncio.sleep(1)

            except Exception as e:
                self.logger.error(f"Error in task processing loop: {str(e)}")
                self.status = AgentStatus.ERROR
                self.metrics['last_error'] = str(e)
                await asyncio.sleep(5)  # Wait longer on error

    def _update_avg_duration(self, duration: float):
        """Update average task duration metric"""
        completed = self.metrics['tasks_completed']
        if completed == 1:
            self.metrics['avg_task_duration'] = duration
        else:
            current_avg = self.metrics['avg_task_duration']
            self.metrics['avg_task_duration'] = ((current_avg * (completed - 1)) + duration) / completed

    async def _load_state(self):
        """Load agent state from persistence"""
        try:
            state = await self.persistence.load_agent_state(self.id)
            if state:
                # Load metrics
                self.metrics.update(state.get('metrics', {}))

                # Load pending tasks
                pending_tasks = state.get('pending_tasks', [])
                for task_data in pending_tasks:
                    task = Task.from_dict(task_data)
                    if task.status == TaskStatus.PENDING:
                        self.task_queue.append(task)

                self.logger.info(f"Loaded state for agent {self.name}")

        except Exception as e:
            self.logger.error(f"Failed to load state: {str(e)}")

    async def _save_state(self):
        """Save agent state to persistence"""
        try:
            state = {
                'id': self.id,
                'name': self.name,
                'status': self.status.value,
                'last_activity': self.last_activity.isoformat(),
                'metrics': self.metrics,
                'pending_tasks': [task.to_dict() for task in self.task_queue],
                'active_tasks': [task.to_dict() for task in self.active_tasks.values()],
                'config': self.config
            }

            if self.persistence:
                await self.persistence.save_agent_state(self, state)

        except Exception as e:
            self.logger.error(f"Failed to save state: {str(e)}")

    def add_subagent(self, subagent: 'BaseAgent'):
        """Add a subagent to this agent"""
        subagent.parent_agent = self
        self.subagents[subagent.id] = subagent
        self.logger.info(f"Added subagent {subagent.name}")

    def get_status(self) -> Dict:
        """Get comprehensive agent status"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value,
            'uptime': (datetime.utcnow() - self.created_at).total_seconds(),
            'last_activity': self.last_activity.isoformat(),
            'queue_size': len(self.task_queue),
            'active_tasks': len(self.active_tasks),
            'capabilities': self.capabilities,
            'subagents': list(self.subagents.keys()),
            'metrics': self.metrics,
            'config': self.config
        }

    # Abstract methods that must be implemented by specific agents

    @abstractmethod
    async def initialize(self):
        """Initialize the agent - called during startup"""
        pass

    @abstractmethod
    async def cleanup(self):
        """Cleanup resources - called during shutdown"""
        pass

    @abstractmethod
    async def can_handle_task(self, task: Task) -> bool:
        """Check if this agent can handle the given task type"""
        pass

    @abstractmethod
    async def execute_task(self, task: Task) -> Any:
        """Execute a specific task - must be implemented by each agent"""
        pass

    @abstractmethod
    def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        pass
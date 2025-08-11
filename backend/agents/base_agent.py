"""
Base Agent Architecture for SmartBets 2.0
Provides foundational structure for all AI agents
"""

import asyncio
import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

class AgentStatus(Enum):
    INACTIVE = "inactive"
    ACTIVE = "active"
    BUSY = "busy"
    ERROR = "error"
    MAINTENANCE = "maintenance"

class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

@dataclass
class AgentTask:
    id: str
    description: str
    priority: Priority
    created_at: datetime
    deadline: Optional[datetime] = None
    assigned_to: Optional[str] = None
    status: str = "pending"
    result: Optional[Dict] = None
    error: Optional[str] = None

@dataclass
class AgentMessage:
    sender: str
    recipient: str
    message_type: str
    content: Dict
    timestamp: datetime
    priority: Priority = Priority.MEDIUM

class BaseAgent(ABC):
    """Base class for all SmartBets AI agents"""
    
    def __init__(self, agent_id: str, name: str, description: str):
        self.agent_id = agent_id
        self.name = name
        self.description = description
        self.status = AgentStatus.INACTIVE
        self.created_at = datetime.now()
        self.last_activity = datetime.now()
        self.tasks: List[AgentTask] = []
        self.message_queue: List[AgentMessage] = []
        self.metrics: Dict[str, Any] = {
            'tasks_completed': 0,
            'tasks_failed': 0,
            'average_response_time': 0,
            'last_error': None
        }
        self.config: Dict[str, Any] = {}
        self.logger = logging.getLogger(f"agent.{agent_id}")
        
    @abstractmethod
    async def initialize(self) -> bool:
        """Initialize agent and set up required resources"""
        pass
    
    @abstractmethod
    async def execute_task(self, task: AgentTask) -> Dict[str, Any]:
        """Execute a specific task assigned to this agent"""
        pass
    
    @abstractmethod
    async def get_capabilities(self) -> List[str]:
        """Return list of capabilities this agent provides"""
        pass
    
    async def start(self):
        """Start the agent and begin processing tasks"""
        try:
            if await self.initialize():
                self.status = AgentStatus.ACTIVE
                self.logger.info(f"Agent {self.name} started successfully")
                await self._process_tasks()
            else:
                self.status = AgentStatus.ERROR
                self.logger.error(f"Failed to initialize agent {self.name}")
        except Exception as e:
            self.status = AgentStatus.ERROR
            self.logger.error(f"Error starting agent {self.name}: {str(e)}")
    
    async def stop(self):
        """Stop the agent gracefully"""
        self.status = AgentStatus.INACTIVE
        self.logger.info(f"Agent {self.name} stopped")
    
    async def add_task(self, task: AgentTask):
        """Add a new task to the agent's queue"""
        self.tasks.append(task)
        self.tasks.sort(key=lambda t: t.priority.value, reverse=True)
        self.logger.info(f"Task {task.id} added to agent {self.name}")
    
    async def send_message(self, recipient: str, message_type: str, content: Dict, priority: Priority = Priority.MEDIUM):
        """Send a message to another agent"""
        message = AgentMessage(
            sender=self.agent_id,
            recipient=recipient,
            message_type=message_type,
            content=content,
            timestamp=datetime.now(),
            priority=priority
        )
        # This would integrate with the agent communication system
        await self._deliver_message(message)
    
    async def receive_message(self, message: AgentMessage):
        """Receive a message from another agent"""
        self.message_queue.append(message)
        await self._process_message(message)
    
    async def _process_tasks(self):
        """Internal task processing loop"""
        while self.status == AgentStatus.ACTIVE:
            if self.tasks:
                task = self.tasks.pop(0)
                self.status = AgentStatus.BUSY
                
                try:
                    start_time = datetime.now()
                    result = await self.execute_task(task)
                    end_time = datetime.now()
                    
                    task.status = "completed"
                    task.result = result
                    self.metrics['tasks_completed'] += 1
                    
                    # Update response time metric
                    response_time = (end_time - start_time).total_seconds()
                    self.metrics['average_response_time'] = (
                        (self.metrics['average_response_time'] * (self.metrics['tasks_completed'] - 1) + response_time) /
                        self.metrics['tasks_completed']
                    )
                    
                    self.logger.info(f"Task {task.id} completed successfully")
                    
                except Exception as e:
                    task.status = "failed"
                    task.error = str(e)
                    self.metrics['tasks_failed'] += 1
                    self.metrics['last_error'] = str(e)
                    self.logger.error(f"Task {task.id} failed: {str(e)}")
                
                finally:
                    self.status = AgentStatus.ACTIVE
                    self.last_activity = datetime.now()
            
            await asyncio.sleep(1)  # Prevent busy waiting
    
    async def _process_message(self, message: AgentMessage):
        """Process incoming messages"""
        self.logger.info(f"Received message from {message.sender}: {message.message_type}")
        # Override in specific agents for custom message handling
    
    async def _deliver_message(self, message: AgentMessage):
        """Deliver message to recipient (handled by agent manager)"""
        # This will be implemented by the AgentManager
        pass
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status and metrics"""
        return {
            'agent_id': self.agent_id,
            'name': self.name,
            'description': self.description,
            'status': self.status.value,
            'created_at': self.created_at.isoformat(),
            'last_activity': self.last_activity.isoformat(),
            'pending_tasks': len(self.tasks),
            'metrics': self.metrics,
            'capabilities': asyncio.create_task(self.get_capabilities()).result() if asyncio.get_event_loop().is_running() else []
        }
    
    def configure(self, config: Dict[str, Any]):
        """Update agent configuration"""
        self.config.update(config)
        self.logger.info(f"Agent {self.name} configuration updated")
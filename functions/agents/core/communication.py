# Inter-Agent Communication System
# Provides message bus for agent coordination and communication

import asyncio
import json
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Callable
from enum import Enum
import logging

class MessageType(Enum):
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    STATUS_UPDATE = "status_update"
    ALERT = "alert"
    COORDINATION = "coordination"
    BROADCAST = "broadcast"
    HEARTBEAT = "heartbeat"

class MessagePriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

class Message:
    """Represents a message between agents"""

    def __init__(self, msg_type: MessageType, sender_id: str, recipient_id: str = None,
                 data: Dict = None, priority: MessagePriority = MessagePriority.NORMAL,
                 correlation_id: str = None):
        self.id = str(uuid.uuid4())
        self.type = msg_type
        self.sender_id = sender_id
        self.recipient_id = recipient_id  # None for broadcast messages
        self.data = data or {}
        self.priority = priority
        self.correlation_id = correlation_id  # For request/response matching
        self.timestamp = datetime.utcnow()
        self.delivered = False
        self.processed = False

    def to_dict(self) -> Dict:
        return {
            'id': self.id,
            'type': self.type.value,
            'sender_id': self.sender_id,
            'recipient_id': self.recipient_id,
            'data': self.data,
            'priority': self.priority.value,
            'correlation_id': self.correlation_id,
            'timestamp': self.timestamp.isoformat(),
            'delivered': self.delivered,
            'processed': self.processed
        }

    @classmethod
    def from_dict(cls, data: Dict):
        msg = cls(
            msg_type=MessageType(data['type']),
            sender_id=data['sender_id'],
            recipient_id=data.get('recipient_id'),
            data=data.get('data', {}),
            priority=MessagePriority(data.get('priority', 2)),
            correlation_id=data.get('correlation_id')
        )
        msg.id = data['id']
        msg.timestamp = datetime.fromisoformat(data['timestamp'])
        msg.delivered = data.get('delivered', False)
        msg.processed = data.get('processed', False)
        return msg

class MessageBus:
    """Central message bus for inter-agent communication"""

    def __init__(self, persistence_manager=None):
        self.persistence = persistence_manager
        self.agents: Dict[str, Any] = {}  # registered agents
        self.message_handlers: Dict[str, Dict[MessageType, Callable]] = {}
        self.message_queue: List[Message] = []
        self.processed_messages: List[Message] = []
        self.is_running = False
        self.logger = self._setup_logger()
        self._processor_task = None

    def _setup_logger(self) -> logging.Logger:
        """Setup message bus logger"""
        logger = logging.getLogger("agent.message_bus")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - MESSAGE_BUS - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def start(self):
        """Start the message bus"""
        if self.is_running:
            return

        self.is_running = True
        self._processor_task = asyncio.create_task(self._process_messages())
        self.logger.info("Message bus started")

    async def stop(self):
        """Stop the message bus"""
        if not self.is_running:
            return

        self.is_running = False

        if self._processor_task and not self._processor_task.done():
            self._processor_task.cancel()
            try:
                await self._processor_task
            except asyncio.CancelledError:
                pass

        self.logger.info("Message bus stopped")

    async def register_agent(self, agent):
        """Register an agent with the message bus"""
        self.agents[agent.id] = agent
        self.message_handlers[agent.id] = {}
        self.logger.info(f"Registered agent {agent.id} ({agent.name})")

    async def unregister_agent(self, agent):
        """Unregister an agent from the message bus"""
        self.agents.pop(agent.id, None)
        self.message_handlers.pop(agent.id, None)
        self.logger.info(f"Unregistered agent {agent.id} ({agent.name})")

    def register_handler(self, agent_id: str, message_type: MessageType, handler: Callable):
        """Register a message handler for an agent"""
        if agent_id not in self.message_handlers:
            self.message_handlers[agent_id] = {}

        self.message_handlers[agent_id][message_type] = handler
        self.logger.info(f"Registered handler for {agent_id}: {message_type.value}")

    async def send_message(self, message: Message) -> bool:
        """Send a message through the bus"""
        try:
            # Validate message
            if not message.sender_id or message.sender_id not in self.agents:
                self.logger.error(f"Invalid sender: {message.sender_id}")
                return False

            if message.recipient_id and message.recipient_id not in self.agents:
                self.logger.error(f"Invalid recipient: {message.recipient_id}")
                return False

            # Add to queue (sorted by priority)
            self.message_queue.append(message)
            self.message_queue.sort(key=lambda m: m.priority.value, reverse=True)

            # Persist message
            if self.persistence:
                await self.persistence.save_message(message)

            self.logger.info(f"Message queued: {message.id} ({message.type.value})")
            return True

        except Exception as e:
            self.logger.error(f"Failed to send message: {str(e)}")
            return False

    async def _process_messages(self):
        """Main message processing loop"""
        while self.is_running:
            try:
                if self.message_queue:
                    message = self.message_queue.pop(0)
                    await self._deliver_message(message)

                # Brief sleep to prevent busy waiting
                await asyncio.sleep(0.1)

            except Exception as e:
                self.logger.error(f"Error in message processing: {str(e)}")
                await asyncio.sleep(1)

    async def _deliver_message(self, message: Message):
        """Deliver a message to its recipient(s)"""
        try:
            if message.recipient_id:
                # Direct message to specific agent
                await self._deliver_to_agent(message, message.recipient_id)
            else:
                # Broadcast message to all agents
                for agent_id in self.agents.keys():
                    if agent_id != message.sender_id:  # Don't send to sender
                        await self._deliver_to_agent(message, agent_id)

            message.delivered = True
            self.processed_messages.append(message)

            # Keep only last 1000 processed messages
            if len(self.processed_messages) > 1000:
                self.processed_messages = self.processed_messages[-1000:]

        except Exception as e:
            self.logger.error(f"Failed to deliver message {message.id}: {str(e)}")

    async def _deliver_to_agent(self, message: Message, agent_id: str):
        """Deliver a message to a specific agent"""
        try:
            agent = self.agents.get(agent_id)
            if not agent:
                return

            # Check if agent has a handler for this message type
            handlers = self.message_handlers.get(agent_id, {})
            handler = handlers.get(message.type)

            if handler:
                # Call the handler
                try:
                    await handler(message)
                    message.processed = True
                    self.logger.debug(f"Message {message.id} processed by {agent_id}")
                except Exception as e:
                    self.logger.error(f"Handler error for {agent_id}: {str(e)}")
            else:
                # No specific handler, use default message handling
                await self._default_message_handler(agent, message)

        except Exception as e:
            self.logger.error(f"Failed to deliver to agent {agent_id}: {str(e)}")

    async def _default_message_handler(self, agent, message: Message):
        """Default message handler for agents without specific handlers"""
        try:
            # Add common message types to agent's task queue
            if message.type == MessageType.TASK_REQUEST:
                from .base_agent import Task, TaskPriority

                task_data = message.data.get('task', {})
                task = Task(
                    task_type=task_data.get('type', 'unknown'),
                    data=task_data.get('data', {}),
                    priority=TaskPriority(task_data.get('priority', 2)),
                    created_by=message.sender_id
                )

                await agent.add_task(task)
                self.logger.info(f"Created task from message for {agent.id}")

            elif message.type == MessageType.STATUS_UPDATE:
                # Log status updates
                agent.logger.info(f"Status update from {message.sender_id}: {message.data}")

            elif message.type == MessageType.ALERT:
                # Handle alerts
                agent.logger.warning(f"Alert from {message.sender_id}: {message.data}")

        except Exception as e:
            self.logger.error(f"Default handler error: {str(e)}")

    async def send_task_request(self, sender_id: str, recipient_id: str,
                               task_type: str, task_data: Dict = None,
                               priority: MessagePriority = MessagePriority.NORMAL) -> str:
        """Send a task request to another agent"""
        correlation_id = str(uuid.uuid4())

        message = Message(
            msg_type=MessageType.TASK_REQUEST,
            sender_id=sender_id,
            recipient_id=recipient_id,
            data={
                'task': {
                    'type': task_type,
                    'data': task_data or {},
                    'priority': priority.value
                }
            },
            priority=priority,
            correlation_id=correlation_id
        )

        await self.send_message(message)
        return correlation_id

    async def send_task_response(self, sender_id: str, recipient_id: str,
                                correlation_id: str, success: bool, result: Any = None,
                                error: str = None):
        """Send a task response"""
        message = Message(
            msg_type=MessageType.TASK_RESPONSE,
            sender_id=sender_id,
            recipient_id=recipient_id,
            data={
                'success': success,
                'result': result,
                'error': error
            },
            correlation_id=correlation_id
        )

        await self.send_message(message)

    async def send_status_update(self, sender_id: str, status_data: Dict,
                                recipient_id: str = None):
        """Send a status update (broadcast if no recipient)"""
        message = Message(
            msg_type=MessageType.STATUS_UPDATE,
            sender_id=sender_id,
            recipient_id=recipient_id,
            data=status_data
        )

        await self.send_message(message)

    async def send_alert(self, sender_id: str, alert_type: str, alert_data: Dict,
                        priority: MessagePriority = MessagePriority.HIGH):
        """Send an alert message"""
        message = Message(
            msg_type=MessageType.ALERT,
            sender_id=sender_id,
            data={
                'alert_type': alert_type,
                'alert_data': alert_data,
                'timestamp': datetime.utcnow().isoformat()
            },
            priority=priority
        )

        await self.send_message(message)

    async def broadcast(self, sender_id: str, data: Dict,
                       priority: MessagePriority = MessagePriority.NORMAL):
        """Send a broadcast message to all agents"""
        message = Message(
            msg_type=MessageType.BROADCAST,
            sender_id=sender_id,
            data=data,
            priority=priority
        )

        await self.send_message(message)

    def get_message_stats(self) -> Dict:
        """Get message bus statistics"""
        return {
            'registered_agents': len(self.agents),
            'queued_messages': len(self.message_queue),
            'processed_messages': len(self.processed_messages),
            'message_handlers': {
                agent_id: list(handlers.keys())
                for agent_id, handlers in self.message_handlers.items()
            },
            'is_running': self.is_running
        }

class AgentCoordinator:
    """High-level coordination between agents"""

    def __init__(self, message_bus: MessageBus):
        self.message_bus = message_bus
        self.coordination_sessions: Dict[str, Dict] = {}
        self.logger = logging.getLogger("agent.coordinator")

    async def coordinate_task(self, task_type: str, coordinators: List[str],
                            participants: List[str], data: Dict = None) -> str:
        """Coordinate a multi-agent task"""
        session_id = str(uuid.uuid4())

        session = {
            'id': session_id,
            'task_type': task_type,
            'coordinators': coordinators,
            'participants': participants,
            'data': data or {},
            'status': 'active',
            'created_at': datetime.utcnow(),
            'responses': {}
        }

        self.coordination_sessions[session_id] = session

        # Send coordination message to all participants
        coordination_data = {
            'session_id': session_id,
            'task_type': task_type,
            'coordinators': coordinators,
            'data': data or {}
        }

        for participant in participants:
            message = Message(
                msg_type=MessageType.COORDINATION,
                sender_id='coordinator',
                recipient_id=participant,
                data=coordination_data
            )
            await self.message_bus.send_message(message)

        self.logger.info(f"Started coordination session {session_id}")
        return session_id

    async def handle_coordination_response(self, session_id: str, agent_id: str,
                                         response: Dict):
        """Handle response from participating agent"""
        if session_id in self.coordination_sessions:
            session = self.coordination_sessions[session_id]
            session['responses'][agent_id] = response

            # Check if all participants have responded
            if len(session['responses']) == len(session['participants']):
                session['status'] = 'completed'
                self.logger.info(f"Coordination session {session_id} completed")

    def get_coordination_status(self, session_id: str) -> Optional[Dict]:
        """Get status of a coordination session"""
        return self.coordination_sessions.get(session_id)
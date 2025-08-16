"""
Agent Manager for PrizmBets
Coordinates all AI agents and handles inter-agent communication
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from .base_agent import BaseAgent, AgentMessage, AgentTask, Priority

class AgentManager:
    """Central manager for all PrizmBets AI agents"""
    
    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self.message_bus: List[AgentMessage] = []
        self.task_history: List[AgentTask] = []
        self.logger = logging.getLogger("agent_manager")
        self.is_running = False
        
    async def register_agent(self, agent: BaseAgent) -> bool:
        """Register a new agent with the manager"""
        try:
            if agent.agent_id in self.agents:
                self.logger.warning(f"Agent {agent.agent_id} already registered")
                return False
            
            self.agents[agent.agent_id] = agent
            agent._deliver_message = self._deliver_message  # Inject message delivery
            self.logger.info(f"Agent {agent.name} registered successfully")
            return True
        except Exception as e:
            self.logger.error(f"Failed to register agent {agent.name}: {str(e)}")
            return False
    
    async def start_agent(self, agent_id: str) -> bool:
        """Start a specific agent"""
        if agent_id not in self.agents:
            self.logger.error(f"Agent {agent_id} not found")
            return False
        
        try:
            await self.agents[agent_id].start()
            return True
        except Exception as e:
            self.logger.error(f"Failed to start agent {agent_id}: {str(e)}")
            return False
    
    async def stop_agent(self, agent_id: str) -> bool:
        """Stop a specific agent"""
        if agent_id not in self.agents:
            self.logger.error(f"Agent {agent_id} not found")
            return False
        
        try:
            await self.agents[agent_id].stop()
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop agent {agent_id}: {str(e)}")
            return False
    
    async def start_all_agents(self):
        """Start all registered agents"""
        self.is_running = True
        self.logger.info("Starting all agents...")
        
        tasks = []
        for agent in self.agents.values():
            tasks.append(asyncio.create_task(agent.start()))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        
        # Start message processing loop
        asyncio.create_task(self._process_messages())
        
        self.logger.info(f"Started {len(self.agents)} agents")
    
    async def stop_all_agents(self):
        """Stop all agents gracefully"""
        self.is_running = False
        self.logger.info("Stopping all agents...")
        
        tasks = []
        for agent in self.agents.values():
            tasks.append(asyncio.create_task(agent.stop()))
        
        await asyncio.gather(*tasks, return_exceptions=True)
        self.logger.info("All agents stopped")
    
    async def assign_task(self, agent_id: str, task: AgentTask) -> bool:
        """Assign a task to a specific agent"""
        if agent_id not in self.agents:
            self.logger.error(f"Agent {agent_id} not found")
            return False
        
        try:
            await self.agents[agent_id].add_task(task)
            self.task_history.append(task)
            return True
        except Exception as e:
            self.logger.error(f"Failed to assign task to agent {agent_id}: {str(e)}")
            return False
    
    async def broadcast_message(self, sender_id: str, message_type: str, content: Dict, priority: Priority = Priority.MEDIUM):
        """Broadcast a message to all agents"""
        for agent_id in self.agents.keys():
            if agent_id != sender_id:
                await self._deliver_message(AgentMessage(
                    sender=sender_id,
                    recipient=agent_id,
                    message_type=message_type,
                    content=content,
                    timestamp=datetime.now(),
                    priority=priority
                ))
    
    async def _deliver_message(self, message: AgentMessage):
        """Deliver a message to the recipient agent"""
        if message.recipient == "broadcast":
            await self.broadcast_message(message.sender, message.message_type, message.content, message.priority)
            return
        
        if message.recipient not in self.agents:
            self.logger.error(f"Recipient agent {message.recipient} not found")
            return
        
        self.message_bus.append(message)
        self.logger.debug(f"Message queued: {message.sender} -> {message.recipient}")
    
    async def _process_messages(self):
        """Process messages in the message bus"""
        while self.is_running:
            if self.message_bus:
                # Sort messages by priority
                self.message_bus.sort(key=lambda m: m.priority.value, reverse=True)
                message = self.message_bus.pop(0)
                
                try:
                    await self.agents[message.recipient].receive_message(message)
                    self.logger.debug(f"Message delivered: {message.sender} -> {message.recipient}")
                except Exception as e:
                    self.logger.error(f"Failed to deliver message: {str(e)}")
            
            await asyncio.sleep(0.1)  # Small delay to prevent busy waiting
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific agent"""
        if agent_id not in self.agents:
            return None
        return self.agents[agent_id].get_status()
    
    def get_all_agents_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all agents"""
        return {
            agent_id: agent.get_status()
            for agent_id, agent in self.agents.items()
        }
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get overall system metrics"""
        total_tasks = len(self.task_history)
        completed_tasks = sum(1 for task in self.task_history if task.status == "completed")
        failed_tasks = sum(1 for task in self.task_history if task.status == "failed")
        
        return {
            'total_agents': len(self.agents),
            'active_agents': sum(1 for agent in self.agents.values() if agent.status.value == "active"),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'failed_tasks': failed_tasks,
            'success_rate': (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
            'pending_messages': len(self.message_bus),
            'system_uptime': (datetime.now() - min(agent.created_at for agent in self.agents.values())).total_seconds() if self.agents else 0
        }
    
    async def auto_assign_task(self, task_description: str, priority: Priority = Priority.MEDIUM) -> bool:
        """Automatically assign a task to the most suitable agent"""
        # Simple algorithm - can be enhanced with ML in the future
        suitable_agents = []
        
        for agent in self.agents.values():
            capabilities = await agent.get_capabilities()
            
            # Simple keyword matching - can be improved
            for capability in capabilities:
                if any(keyword in task_description.lower() for keyword in capability.lower().split()):
                    suitable_agents.append((agent, len(agent.tasks)))
        
        if not suitable_agents:
            self.logger.warning(f"No suitable agent found for task: {task_description}")
            return False
        
        # Choose agent with least pending tasks
        best_agent = min(suitable_agents, key=lambda x: x[1])[0]
        
        task = AgentTask(
            id=f"auto_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            description=task_description,
            priority=priority,
            created_at=datetime.now()
        )
        
        return await self.assign_task(best_agent.agent_id, task)

# Global agent manager instance
agent_manager = AgentManager()
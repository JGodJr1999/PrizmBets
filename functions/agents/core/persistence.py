# Agent Persistence Layer - Firestore Integration
# Handles agent state, task, and configuration persistence

import asyncio
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import logging

try:
    from firebase_admin import firestore
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    firestore = None

class AgentPersistence:
    """Manages persistence of agent data in Firestore"""

    def __init__(self, firebase_app=None):
        self.db = None
        self.logger = self._setup_logger()

        if FIRESTORE_AVAILABLE and firebase_app:
            try:
                self.db = firestore.client(firebase_app)
                self.logger.info("Firestore client initialized")
            except Exception as e:
                self.logger.error(f"Failed to initialize Firestore: {str(e)}")
        else:
            self.logger.warning("Firestore not available - using in-memory storage")
            # Fallback to in-memory storage
            self._memory_store = {
                'agents': {},
                'tasks': {},
                'messages': {},
                'config': {}
            }

    def _setup_logger(self) -> logging.Logger:
        """Setup persistence logger"""
        logger = logging.getLogger("agent.persistence")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - PERSISTENCE - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def save_agent_state(self, agent, state: Dict = None) -> bool:
        """Save agent state to persistence"""
        try:
            agent_data = state or {
                'id': agent.id,
                'name': agent.name,
                'description': agent.description,
                'status': agent.status.value,
                'created_at': agent.created_at.isoformat(),
                'last_activity': agent.last_activity.isoformat(),
                'metrics': agent.metrics,
                'config': agent.config,
                'capabilities': agent.capabilities,
                'subagents': list(agent.subagents.keys()),
                'parent_agent': agent.parent_agent.id if agent.parent_agent else None,
                'updated_at': datetime.utcnow().isoformat()
            }

            if self.db:
                # Save to Firestore
                doc_ref = self.db.collection('agents').document(agent.id)
                doc_ref.set(agent_data, merge=True)
            else:
                # Save to memory
                self._memory_store['agents'][agent.id] = agent_data

            self.logger.debug(f"Saved state for agent {agent.id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to save agent state for {agent.id}: {str(e)}")
            return False

    async def load_agent_state(self, agent_id: str) -> Optional[Dict]:
        """Load agent state from persistence"""
        try:
            if self.db:
                # Load from Firestore
                doc_ref = self.db.collection('agents').document(agent_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            else:
                # Load from memory
                return self._memory_store['agents'].get(agent_id)

            return None

        except Exception as e:
            self.logger.error(f"Failed to load agent state for {agent_id}: {str(e)}")
            return None

    async def save_task(self, agent_id: str, task) -> bool:
        """Save task to persistence"""
        try:
            task_data = task.to_dict()
            task_data['agent_id'] = agent_id

            if self.db:
                # Save to Firestore
                doc_ref = self.db.collection('tasks').document(task.id)
                doc_ref.set(task_data)
            else:
                # Save to memory
                if agent_id not in self._memory_store['tasks']:
                    self._memory_store['tasks'][agent_id] = {}
                self._memory_store['tasks'][agent_id][task.id] = task_data

            self.logger.debug(f"Saved task {task.id} for agent {agent_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to save task {task.id}: {str(e)}")
            return False

    async def load_agent_tasks(self, agent_id: str, status: str = None) -> List[Dict]:
        """Load tasks for an agent"""
        try:
            tasks = []

            if self.db:
                # Load from Firestore
                query = self.db.collection('tasks').where('agent_id', '==', agent_id)
                if status:
                    query = query.where('status', '==', status)

                docs = query.stream()
                tasks = [doc.to_dict() for doc in docs]
            else:
                # Load from memory
                agent_tasks = self._memory_store['tasks'].get(agent_id, {})
                for task_data in agent_tasks.values():
                    if not status or task_data.get('status') == status:
                        tasks.append(task_data)

            return tasks

        except Exception as e:
            self.logger.error(f"Failed to load tasks for agent {agent_id}: {str(e)}")
            return []

    async def save_message(self, message) -> bool:
        """Save message to persistence"""
        try:
            message_data = message.to_dict()

            if self.db:
                # Save to Firestore
                doc_ref = self.db.collection('messages').document(message.id)
                doc_ref.set(message_data)
            else:
                # Save to memory
                self._memory_store['messages'][message.id] = message_data

            return True

        except Exception as e:
            self.logger.error(f"Failed to save message {message.id}: {str(e)}")
            return False

    async def load_messages(self, agent_id: str = None, limit: int = 100) -> List[Dict]:
        """Load messages (optionally filtered by agent)"""
        try:
            messages = []

            if self.db:
                # Load from Firestore
                query = self.db.collection('messages').order_by('timestamp', direction=firestore.Query.DESCENDING)

                if agent_id:
                    # Get messages sent to or from this agent
                    query1 = query.where('sender_id', '==', agent_id)
                    query2 = query.where('recipient_id', '==', agent_id)

                    # Combine results (Firestore doesn't support OR queries directly)
                    docs1 = list(query1.limit(limit//2).stream())
                    docs2 = list(query2.limit(limit//2).stream())

                    all_docs = docs1 + docs2
                    # Remove duplicates and sort
                    seen_ids = set()
                    unique_docs = []
                    for doc in all_docs:
                        if doc.id not in seen_ids:
                            seen_ids.add(doc.id)
                            unique_docs.append(doc)

                    messages = [doc.to_dict() for doc in unique_docs[:limit]]
                else:
                    docs = query.limit(limit).stream()
                    messages = [doc.to_dict() for doc in docs]
            else:
                # Load from memory
                all_messages = list(self._memory_store['messages'].values())

                if agent_id:
                    # Filter by agent
                    all_messages = [
                        msg for msg in all_messages
                        if msg.get('sender_id') == agent_id or msg.get('recipient_id') == agent_id
                    ]

                # Sort by timestamp and limit
                all_messages.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
                messages = all_messages[:limit]

            return messages

        except Exception as e:
            self.logger.error(f"Failed to load messages: {str(e)}")
            return []

    async def save_config(self, config_key: str, config_data: Dict) -> bool:
        """Save configuration data"""
        try:
            config_data['updated_at'] = datetime.utcnow().isoformat()

            if self.db:
                # Save to Firestore
                doc_ref = self.db.collection('agent_config').document(config_key)
                doc_ref.set(config_data, merge=True)
            else:
                # Save to memory
                self._memory_store['config'][config_key] = config_data

            self.logger.debug(f"Saved config {config_key}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to save config {config_key}: {str(e)}")
            return False

    async def load_config(self, config_key: str) -> Optional[Dict]:
        """Load configuration data"""
        try:
            if self.db:
                # Load from Firestore
                doc_ref = self.db.collection('agent_config').document(config_key)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            else:
                # Load from memory
                return self._memory_store['config'].get(config_key)

            return None

        except Exception as e:
            self.logger.error(f"Failed to load config {config_key}: {str(e)}")
            return None

    async def delete_old_data(self, days_old: int = 30) -> bool:
        """Clean up old data (tasks, messages)"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            cutoff_str = cutoff_date.isoformat()

            if self.db:
                # Delete old tasks
                old_tasks = self.db.collection('tasks').where('created_at', '<', cutoff_str).stream()
                for task in old_tasks:
                    task.reference.delete()

                # Delete old messages
                old_messages = self.db.collection('messages').where('timestamp', '<', cutoff_str).stream()
                for message in old_messages:
                    message.reference.delete()
            else:
                # Clean memory storage
                # Tasks
                for agent_id in list(self._memory_store['tasks'].keys()):
                    agent_tasks = self._memory_store['tasks'][agent_id]
                    for task_id in list(agent_tasks.keys()):
                        task_created = agent_tasks[task_id].get('created_at', '')
                        if task_created < cutoff_str:
                            del agent_tasks[task_id]

                # Messages
                for msg_id in list(self._memory_store['messages'].keys()):
                    msg_timestamp = self._memory_store['messages'][msg_id].get('timestamp', '')
                    if msg_timestamp < cutoff_str:
                        del self._memory_store['messages'][msg_id]

            self.logger.info(f"Cleaned up data older than {days_old} days")
            return True

        except Exception as e:
            self.logger.error(f"Failed to clean up old data: {str(e)}")
            return False

    async def get_stats(self) -> Dict:
        """Get persistence statistics"""
        try:
            stats = {
                'storage_type': 'firestore' if self.db else 'memory',
                'agents_count': 0,
                'tasks_count': 0,
                'messages_count': 0,
                'config_count': 0
            }

            if self.db:
                # Count documents in Firestore
                agents_count = len(list(self.db.collection('agents').stream()))
                tasks_count = len(list(self.db.collection('tasks').stream()))
                messages_count = len(list(self.db.collection('messages').stream()))
                config_count = len(list(self.db.collection('agent_config').stream()))

                stats.update({
                    'agents_count': agents_count,
                    'tasks_count': tasks_count,
                    'messages_count': messages_count,
                    'config_count': config_count
                })
            else:
                # Count items in memory
                stats.update({
                    'agents_count': len(self._memory_store['agents']),
                    'tasks_count': sum(len(tasks) for tasks in self._memory_store['tasks'].values()),
                    'messages_count': len(self._memory_store['messages']),
                    'config_count': len(self._memory_store['config'])
                })

            return stats

        except Exception as e:
            self.logger.error(f"Failed to get stats: {str(e)}")
            return {'error': str(e)}

    async def backup_data(self) -> Optional[Dict]:
        """Create a backup of all agent data"""
        try:
            backup = {
                'timestamp': datetime.utcnow().isoformat(),
                'agents': {},
                'tasks': {},
                'messages': {},
                'config': {}
            }

            if self.db:
                # Backup from Firestore
                # Agents
                agents = self.db.collection('agents').stream()
                backup['agents'] = {doc.id: doc.to_dict() for doc in agents}

                # Tasks
                tasks = self.db.collection('tasks').stream()
                backup['tasks'] = {doc.id: doc.to_dict() for doc in tasks}

                # Messages
                messages = self.db.collection('messages').stream()
                backup['messages'] = {doc.id: doc.to_dict() for doc in messages}

                # Config
                configs = self.db.collection('agent_config').stream()
                backup['config'] = {doc.id: doc.to_dict() for doc in configs}
            else:
                # Backup from memory
                backup.update(self._memory_store)

            self.logger.info("Created data backup")
            return backup

        except Exception as e:
            self.logger.error(f"Failed to create backup: {str(e)}")
            return None

    async def restore_data(self, backup_data: Dict) -> bool:
        """Restore data from backup"""
        try:
            if self.db:
                # Restore to Firestore
                # Agents
                for agent_id, agent_data in backup_data.get('agents', {}).items():
                    self.db.collection('agents').document(agent_id).set(agent_data)

                # Tasks
                for task_id, task_data in backup_data.get('tasks', {}).items():
                    self.db.collection('tasks').document(task_id).set(task_data)

                # Messages
                for msg_id, msg_data in backup_data.get('messages', {}).items():
                    self.db.collection('messages').document(msg_id).set(msg_data)

                # Config
                for config_id, config_data in backup_data.get('config', {}).items():
                    self.db.collection('agent_config').document(config_id).set(config_data)
            else:
                # Restore to memory
                self._memory_store.update({
                    'agents': backup_data.get('agents', {}),
                    'tasks': backup_data.get('tasks', {}),
                    'messages': backup_data.get('messages', {}),
                    'config': backup_data.get('config', {})
                })

            self.logger.info("Restored data from backup")
            return True

        except Exception as e:
            self.logger.error(f"Failed to restore backup: {str(e)}")
            return False
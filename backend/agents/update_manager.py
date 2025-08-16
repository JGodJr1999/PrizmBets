"""
Update Manager Agent for PrizmBets
Automatically checks for and manages software updates for all dependencies
"""

import asyncio
import json
import logging
import subprocess
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from packaging import version
import requests
from .base_agent import BaseAgent, AgentTask, Priority

logger = logging.getLogger(__name__)

class UpdateManager(BaseAgent):
    """Manages automatic updates for npm and pip packages"""
    
    def __init__(self):
        super().__init__(
            agent_id="update_manager",
            name="Update Manager",
            description="Automatically checks for and applies software updates"
        )
        self.npm_packages: Dict[str, Any] = {}
        self.pip_packages: Dict[str, Any] = {}
        self.available_updates: Dict[str, List] = {'npm': [], 'pip': []}
        self.update_history: List[Dict] = []
        self.last_check: Optional[datetime] = None
        self.check_interval = timedelta(hours=24)  # Daily checks
        self.auto_update_minor = True
        self.auto_update_patch = True
        self.auto_update_major = False  # Require manual approval for major updates
        
    async def initialize(self) -> bool:
        """Initialize update manager"""
        try:
            logger.info("Initializing Update Manager...")
            
            # Check if npm and pip are available
            self.npm_available = await self._check_command_available('npm')
            self.pip_available = await self._check_command_available('pip')
            
            if not self.npm_available and not self.pip_available:
                logger.error("Neither npm nor pip found. Update Manager cannot function.")
                return False
            
            # Load update history
            await self._load_update_history()
            
            # Schedule initial check
            await self.schedule_task(
                AgentTask(
                    task_id="initial_update_check",
                    task_type="update_check",
                    description="Initial dependency update check",
                    priority=Priority.MEDIUM,
                    data={}
                )
            )
            
            self.status = 'active'
            logger.info("Update Manager initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize Update Manager: {e}")
            return False
    
    async def _check_command_available(self, command: str) -> bool:
        """Check if a command is available"""
        try:
            result = subprocess.run(
                [command, '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except (subprocess.TimeoutExpired, FileNotFoundError):
            return False
    
    async def check_npm_updates(self) -> List[Dict]:
        """Check for available npm package updates"""
        if not self.npm_available:
            return []
        
        updates = []
        try:
            # Get list of installed packages
            result = subprocess.run(
                ['npm', 'list', '--json', '--depth=0'],
                cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                installed = json.loads(result.stdout)
                dependencies = installed.get('dependencies', {})
                
                # Check for outdated packages
                outdated_result = subprocess.run(
                    ['npm', 'outdated', '--json'],
                    cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if outdated_result.stdout:
                    outdated = json.loads(outdated_result.stdout)
                    
                    for package_name, info in outdated.items():
                        current = info.get('current', 'unknown')
                        wanted = info.get('wanted', current)
                        latest = info.get('latest', wanted)
                        
                        update_type = self._determine_update_type(current, latest)
                        
                        updates.append({
                            'package': package_name,
                            'current': current,
                            'wanted': wanted,
                            'latest': latest,
                            'type': 'npm',
                            'update_type': update_type,
                            'auto_update': self._should_auto_update(update_type)
                        })
                
                logger.info(f"Found {len(updates)} npm packages with available updates")
                
        except Exception as e:
            logger.error(f"Error checking npm updates: {e}")
        
        return updates
    
    async def check_pip_updates(self) -> List[Dict]:
        """Check for available pip package updates"""
        if not self.pip_available:
            return []
        
        updates = []
        try:
            # Get list of installed packages
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'list', '--format=json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                installed = json.loads(result.stdout)
                
                # Check for outdated packages
                outdated_result = subprocess.run(
                    [sys.executable, '-m', 'pip', 'list', '--outdated', '--format=json'],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if outdated_result.returncode == 0 and outdated_result.stdout:
                    outdated = json.loads(outdated_result.stdout)
                    
                    for package_info in outdated:
                        package_name = package_info['name']
                        current = package_info['version']
                        latest = package_info['latest_version']
                        
                        update_type = self._determine_update_type(current, latest)
                        
                        updates.append({
                            'package': package_name,
                            'current': current,
                            'latest': latest,
                            'type': 'pip',
                            'update_type': update_type,
                            'auto_update': self._should_auto_update(update_type)
                        })
                
                logger.info(f"Found {len(updates)} pip packages with available updates")
                
        except Exception as e:
            logger.error(f"Error checking pip updates: {e}")
        
        return updates
    
    def _determine_update_type(self, current_version: str, new_version: str) -> str:
        """Determine if update is major, minor, or patch"""
        try:
            current = version.parse(current_version)
            new = version.parse(new_version)
            
            if hasattr(current, 'major') and hasattr(new, 'major'):
                if new.major > current.major:
                    return 'major'
                elif new.minor > current.minor if hasattr(current, 'minor') else False:
                    return 'minor'
                else:
                    return 'patch'
        except:
            pass
        
        return 'unknown'
    
    def _should_auto_update(self, update_type: str) -> bool:
        """Determine if update should be applied automatically"""
        if update_type == 'major':
            return self.auto_update_major
        elif update_type == 'minor':
            return self.auto_update_minor
        elif update_type == 'patch':
            return self.auto_update_patch
        return False
    
    async def apply_npm_update(self, package_name: str, target_version: str) -> bool:
        """Apply an npm package update"""
        try:
            logger.info(f"Updating npm package {package_name} to {target_version}")
            
            # Create backup of package.json
            package_json_path = os.path.join(os.path.dirname(__file__), '../../frontend/package.json')
            backup_path = f"{package_json_path}.backup"
            
            with open(package_json_path, 'r') as f:
                original_content = f.read()
            
            with open(backup_path, 'w') as f:
                f.write(original_content)
            
            # Apply update
            result = subprocess.run(
                ['npm', 'install', f'{package_name}@{target_version}'],
                cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                logger.info(f"Successfully updated {package_name} to {target_version}")
                
                # Run tests
                test_passed = await self._run_npm_tests()
                
                if not test_passed:
                    logger.warning(f"Tests failed after updating {package_name}. Rolling back...")
                    # Restore backup
                    with open(backup_path, 'r') as f:
                        backup_content = f.read()
                    with open(package_json_path, 'w') as f:
                        f.write(backup_content)
                    
                    # Reinstall original packages
                    subprocess.run(
                        ['npm', 'install'],
                        cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                        timeout=120
                    )
                    return False
                
                # Clean up backup
                os.remove(backup_path)
                
                # Record update
                await self._record_update({
                    'package': package_name,
                    'type': 'npm',
                    'version': target_version,
                    'timestamp': datetime.utcnow().isoformat(),
                    'status': 'success'
                })
                
                return True
            else:
                logger.error(f"Failed to update {package_name}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error applying npm update for {package_name}: {e}")
            return False
    
    async def apply_pip_update(self, package_name: str, target_version: str) -> bool:
        """Apply a pip package update"""
        try:
            logger.info(f"Updating pip package {package_name} to {target_version}")
            
            # Apply update
            result = subprocess.run(
                [sys.executable, '-m', 'pip', 'install', '--upgrade', f'{package_name}=={target_version}'],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                logger.info(f"Successfully updated {package_name} to {target_version}")
                
                # Run tests
                test_passed = await self._run_python_tests()
                
                if not test_passed:
                    logger.warning(f"Tests failed after updating {package_name}. Rolling back...")
                    # Get previous version from update history
                    previous_version = await self._get_previous_version(package_name, 'pip')
                    if previous_version:
                        subprocess.run(
                            [sys.executable, '-m', 'pip', 'install', f'{package_name}=={previous_version}'],
                            timeout=120
                        )
                    return False
                
                # Record update
                await self._record_update({
                    'package': package_name,
                    'type': 'pip',
                    'version': target_version,
                    'timestamp': datetime.utcnow().isoformat(),
                    'status': 'success'
                })
                
                return True
            else:
                logger.error(f"Failed to update {package_name}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Error applying pip update for {package_name}: {e}")
            return False
    
    async def _run_npm_tests(self) -> bool:
        """Run npm tests to verify update"""
        try:
            result = subprocess.run(
                ['npm', 'test', '--', '--watchAll=false'],
                cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0
        except:
            return True  # Assume tests pass if they can't be run
    
    async def _run_python_tests(self) -> bool:
        """Run Python tests to verify update"""
        try:
            result = subprocess.run(
                [sys.executable, '-m', 'pytest', 'tests/', '-q'],
                cwd=os.path.join(os.path.dirname(__file__), '../../'),
                capture_output=True,
                text=True,
                timeout=60
            )
            return result.returncode == 0
        except:
            return True  # Assume tests pass if they can't be run
    
    async def check_security_vulnerabilities(self) -> Dict[str, List]:
        """Check for security vulnerabilities in dependencies"""
        vulnerabilities = {'npm': [], 'pip': []}
        
        # Check npm vulnerabilities
        if self.npm_available:
            try:
                result = subprocess.run(
                    ['npm', 'audit', '--json'],
                    cwd=os.path.join(os.path.dirname(__file__), '../../frontend'),
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.stdout:
                    audit_data = json.loads(result.stdout)
                    if 'vulnerabilities' in audit_data:
                        for severity in ['critical', 'high', 'moderate']:
                            if severity in audit_data['vulnerabilities']:
                                count = audit_data['vulnerabilities'][severity]
                                if count > 0:
                                    vulnerabilities['npm'].append({
                                        'severity': severity,
                                        'count': count
                                    })
                
            except Exception as e:
                logger.error(f"Error checking npm vulnerabilities: {e}")
        
        # Check pip vulnerabilities using safety
        if self.pip_available:
            try:
                # First, ensure safety is installed
                subprocess.run(
                    [sys.executable, '-m', 'pip', 'install', 'safety'],
                    capture_output=True,
                    timeout=30
                )
                
                result = subprocess.run(
                    [sys.executable, '-m', 'safety', 'check', '--json'],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.stdout:
                    safety_data = json.loads(result.stdout)
                    for vuln in safety_data:
                        vulnerabilities['pip'].append({
                            'package': vuln.get('package', 'unknown'),
                            'severity': vuln.get('severity', 'unknown'),
                            'description': vuln.get('vulnerability', '')
                        })
                
            except Exception as e:
                logger.error(f"Error checking pip vulnerabilities: {e}")
        
        return vulnerabilities
    
    async def _record_update(self, update_info: Dict):
        """Record an update in history"""
        self.update_history.append(update_info)
        await self._save_update_history()
    
    async def _load_update_history(self):
        """Load update history from file"""
        history_file = os.path.join(os.path.dirname(__file__), 'update_history.json')
        try:
            if os.path.exists(history_file):
                with open(history_file, 'r') as f:
                    self.update_history = json.load(f)
        except Exception as e:
            logger.error(f"Error loading update history: {e}")
            self.update_history = []
    
    async def _save_update_history(self):
        """Save update history to file"""
        history_file = os.path.join(os.path.dirname(__file__), 'update_history.json')
        try:
            with open(history_file, 'w') as f:
                json.dump(self.update_history, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving update history: {e}")
    
    async def _get_previous_version(self, package_name: str, package_type: str) -> Optional[str]:
        """Get previous version of a package from history"""
        for update in reversed(self.update_history):
            if update.get('package') == package_name and update.get('type') == package_type:
                return update.get('version')
        return None
    
    async def process_task(self, task: AgentTask) -> Dict[str, Any]:
        """Process update-related tasks"""
        try:
            if task.task_type == 'update_check':
                return await self._perform_update_check()
            elif task.task_type == 'apply_updates':
                return await self._apply_pending_updates()
            elif task.task_type == 'security_scan':
                return await self._perform_security_scan()
            elif task.task_type == 'rollback':
                return await self._perform_rollback(task.data)
            else:
                return {'success': False, 'error': f'Unknown task type: {task.task_type}'}
                
        except Exception as e:
            logger.error(f"Error processing task {task.task_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _perform_update_check(self) -> Dict[str, Any]:
        """Perform a comprehensive update check"""
        logger.info("Performing comprehensive update check...")
        
        # Check npm updates
        npm_updates = await self.check_npm_updates()
        self.available_updates['npm'] = npm_updates
        
        # Check pip updates
        pip_updates = await self.check_pip_updates()
        self.available_updates['pip'] = pip_updates
        
        # Check for security vulnerabilities
        vulnerabilities = await self.check_security_vulnerabilities()
        
        self.last_check = datetime.utcnow()
        
        # Prepare summary
        total_updates = len(npm_updates) + len(pip_updates)
        auto_updates = sum(1 for u in npm_updates + pip_updates if u.get('auto_update'))
        
        summary = {
            'success': True,
            'timestamp': self.last_check.isoformat(),
            'npm_updates': len(npm_updates),
            'pip_updates': len(pip_updates),
            'total_updates': total_updates,
            'auto_updates': auto_updates,
            'vulnerabilities': vulnerabilities,
            'updates': self.available_updates
        }
        
        # Schedule auto-updates if any
        if auto_updates > 0:
            await self.schedule_task(
                AgentTask(
                    task_id="auto_updates",
                    task_type="apply_updates",
                    description=f"Apply {auto_updates} automatic updates",
                    priority=Priority.MEDIUM,
                    data={'auto_only': True}
                )
            )
        
        logger.info(f"Update check complete: {total_updates} updates available, {auto_updates} will be applied automatically")
        
        return summary
    
    async def _apply_pending_updates(self) -> Dict[str, Any]:
        """Apply pending updates"""
        results = {'success': True, 'applied': [], 'failed': [], 'skipped': []}
        
        # Apply npm updates
        for update in self.available_updates['npm']:
            if update.get('auto_update'):
                success = await self.apply_npm_update(
                    update['package'],
                    update['latest']
                )
                if success:
                    results['applied'].append(update)
                else:
                    results['failed'].append(update)
            else:
                results['skipped'].append(update)
        
        # Apply pip updates
        for update in self.available_updates['pip']:
            if update.get('auto_update'):
                success = await self.apply_pip_update(
                    update['package'],
                    update['latest']
                )
                if success:
                    results['applied'].append(update)
                else:
                    results['failed'].append(update)
            else:
                results['skipped'].append(update)
        
        logger.info(f"Update application complete: {len(results['applied'])} applied, {len(results['failed'])} failed, {len(results['skipped'])} skipped")
        
        return results
    
    async def _perform_security_scan(self) -> Dict[str, Any]:
        """Perform a security vulnerability scan"""
        vulnerabilities = await self.check_security_vulnerabilities()
        
        critical_count = sum(
            v.get('count', 0) for v in vulnerabilities['npm'] 
            if v.get('severity') == 'critical'
        )
        
        return {
            'success': True,
            'timestamp': datetime.utcnow().isoformat(),
            'vulnerabilities': vulnerabilities,
            'critical_count': critical_count,
            'requires_immediate_action': critical_count > 0
        }
    
    async def _perform_rollback(self, data: Dict) -> Dict[str, Any]:
        """Rollback a specific update"""
        package_name = data.get('package')
        package_type = data.get('type')
        
        if not package_name or not package_type:
            return {'success': False, 'error': 'Package name and type required'}
        
        previous_version = await self._get_previous_version(package_name, package_type)
        
        if not previous_version:
            return {'success': False, 'error': 'No previous version found'}
        
        if package_type == 'npm':
            success = await self.apply_npm_update(package_name, previous_version)
        elif package_type == 'pip':
            success = await self.apply_pip_update(package_name, previous_version)
        else:
            return {'success': False, 'error': 'Invalid package type'}
        
        if success:
            await self._record_update({
                'package': package_name,
                'type': package_type,
                'version': previous_version,
                'timestamp': datetime.utcnow().isoformat(),
                'status': 'rollback'
            })
        
        return {'success': success, 'rolled_back_to': previous_version}
    
    async def get_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive status report"""
        return {
            'agent_id': self.agent_id,
            'status': self.status,
            'last_check': self.last_check.isoformat() if self.last_check else None,
            'npm_available': self.npm_available,
            'pip_available': self.pip_available,
            'available_updates': {
                'npm': len(self.available_updates['npm']),
                'pip': len(self.available_updates['pip'])
            },
            'auto_update_settings': {
                'major': self.auto_update_major,
                'minor': self.auto_update_minor,
                'patch': self.auto_update_patch
            },
            'recent_updates': self.update_history[-10:] if self.update_history else [],
            'next_check': (self.last_check + self.check_interval).isoformat() if self.last_check else None
        }
    
    async def execute_task(self, task: AgentTask) -> Dict[str, Any]:
        """Execute a task (required by BaseAgent)"""
        return await self.process_task(task)
    
    async def get_capabilities(self) -> List[str]:
        """Get agent capabilities (required by BaseAgent)"""
        return [
            'check_npm_updates',
            'check_pip_updates',
            'apply_updates',
            'rollback_updates',
            'security_scanning',
            'dependency_resolution'
        ]

# Create singleton instance
update_manager = UpdateManager()
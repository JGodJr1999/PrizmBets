"""
Update SubAgents for PrizmBets
Specialized agents for different aspects of update management
"""

import asyncio
import json
import logging
import subprocess
import os
import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import aiohttp
from packaging import version

logger = logging.getLogger(__name__)

class PackageScanner:
    """Scans for available package updates"""
    
    def __init__(self):
        self.npm_registry = "https://registry.npmjs.org"
        self.pypi_registry = "https://pypi.org/pypi"
    
    async def scan_npm_package(self, package_name: str, current_version: str) -> Dict[str, Any]:
        """Get latest version info for an npm package"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.npm_registry}/{package_name}") as response:
                    if response.status == 200:
                        data = await response.json()
                        latest = data.get('dist-tags', {}).get('latest', current_version)
                        
                        # Get version history
                        versions = list(data.get('versions', {}).keys())
                        versions.sort(key=lambda v: version.parse(v) if version.parse(v) else v)
                        
                        return {
                            'package': package_name,
                            'current': current_version,
                            'latest': latest,
                            'versions': versions[-10:],  # Last 10 versions
                            'repository': data.get('repository', {}).get('url', ''),
                            'homepage': data.get('homepage', ''),
                            'last_publish': data.get('time', {}).get(latest, '')
                        }
        except Exception as e:
            logger.error(f"Error scanning npm package {package_name}: {e}")
        
        return {'package': package_name, 'current': current_version, 'error': 'Failed to fetch'}
    
    async def scan_pip_package(self, package_name: str, current_version: str) -> Dict[str, Any]:
        """Get latest version info for a pip package"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.pypi_registry}/{package_name}/json") as response:
                    if response.status == 200:
                        data = await response.json()
                        info = data.get('info', {})
                        latest = info.get('version', current_version)
                        
                        # Get version history
                        versions = list(data.get('releases', {}).keys())
                        versions.sort(key=lambda v: version.parse(v) if version.parse(v) else v)
                        
                        return {
                            'package': package_name,
                            'current': current_version,
                            'latest': latest,
                            'versions': versions[-10:],  # Last 10 versions
                            'home_page': info.get('home_page', ''),
                            'project_url': info.get('project_url', ''),
                            'requires_python': info.get('requires_python', ''),
                            'last_publish': info.get('upload_time', '')
                        }
        except Exception as e:
            logger.error(f"Error scanning pip package {package_name}: {e}")
        
        return {'package': package_name, 'current': current_version, 'error': 'Failed to fetch'}
    
    async def batch_scan_packages(self, packages: List[Dict]) -> List[Dict]:
        """Scan multiple packages in parallel"""
        tasks = []
        for pkg in packages:
            if pkg['type'] == 'npm':
                tasks.append(self.scan_npm_package(pkg['name'], pkg['version']))
            elif pkg['type'] == 'pip':
                tasks.append(self.scan_pip_package(pkg['name'], pkg['version']))
        
        results = await asyncio.gather(*tasks)
        return results


class VulnerabilityScanner:
    """Checks for security vulnerabilities in dependencies"""
    
    def __init__(self):
        self.vulnerability_db = "https://nvd.nist.gov/feeds/json/cve/1.1"
        self.npm_advisory = "https://registry.npmjs.org/-/npm/v1/security/advisories"
    
    async def scan_npm_vulnerabilities(self, packages: List[str]) -> List[Dict]:
        """Scan npm packages for known vulnerabilities"""
        vulnerabilities = []
        
        try:
            # Run npm audit for detailed vulnerability info
            result = subprocess.run(
                ['npm', 'audit', '--json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.stdout:
                audit_data = json.loads(result.stdout)
                advisories = audit_data.get('advisories', {})
                
                for advisory_id, advisory in advisories.items():
                    vulnerabilities.append({
                        'id': advisory_id,
                        'package': advisory.get('module_name'),
                        'severity': advisory.get('severity'),
                        'title': advisory.get('title'),
                        'vulnerable_versions': advisory.get('vulnerable_versions'),
                        'patched_versions': advisory.get('patched_versions'),
                        'recommendation': advisory.get('recommendation'),
                        'cves': advisory.get('cves', [])
                    })
        
        except Exception as e:
            logger.error(f"Error scanning npm vulnerabilities: {e}")
        
        return vulnerabilities
    
    async def scan_pip_vulnerabilities(self, packages: List[str]) -> List[Dict]:
        """Scan pip packages for known vulnerabilities"""
        vulnerabilities = []
        
        try:
            # Use safety to check for vulnerabilities
            result = subprocess.run(
                ['safety', 'check', '--json', '--full-report'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.stdout:
                safety_data = json.loads(result.stdout)
                
                for vuln in safety_data:
                    vulnerabilities.append({
                        'package': vuln.get('package'),
                        'installed_version': vuln.get('installed_version'),
                        'affected_versions': vuln.get('affected_versions'),
                        'vulnerability': vuln.get('vulnerability'),
                        'severity': self._map_severity(vuln.get('vulnerability', '')),
                        'cve': vuln.get('cve'),
                        'more_info': vuln.get('more_info_url')
                    })
        
        except Exception as e:
            logger.error(f"Error scanning pip vulnerabilities: {e}")
        
        return vulnerabilities
    
    def _map_severity(self, vulnerability_text: str) -> str:
        """Map vulnerability text to severity level"""
        text_lower = vulnerability_text.lower()
        if 'critical' in text_lower or 'remote code execution' in text_lower:
            return 'critical'
        elif 'high' in text_lower or 'injection' in text_lower:
            return 'high'
        elif 'moderate' in text_lower or 'medium' in text_lower:
            return 'moderate'
        else:
            return 'low'
    
    async def generate_security_report(self, npm_vulns: List, pip_vulns: List) -> Dict:
        """Generate comprehensive security report"""
        critical_count = len([v for v in npm_vulns + pip_vulns if v.get('severity') == 'critical'])
        high_count = len([v for v in npm_vulns + pip_vulns if v.get('severity') == 'high'])
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_vulnerabilities': len(npm_vulns) + len(pip_vulns),
                'critical': critical_count,
                'high': high_count,
                'npm_vulnerabilities': len(npm_vulns),
                'pip_vulnerabilities': len(pip_vulns)
            },
            'npm': npm_vulns,
            'pip': pip_vulns,
            'requires_immediate_action': critical_count > 0,
            'recommendations': self._generate_recommendations(npm_vulns + pip_vulns)
        }
    
    def _generate_recommendations(self, vulnerabilities: List[Dict]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        critical = [v for v in vulnerabilities if v.get('severity') == 'critical']
        if critical:
            recommendations.append(f"URGENT: Update {len(critical)} packages with critical vulnerabilities immediately")
        
        high = [v for v in vulnerabilities if v.get('severity') == 'high']
        if high:
            recommendations.append(f"HIGH PRIORITY: Update {len(high)} packages with high severity vulnerabilities")
        
        return recommendations


class DependencyResolver:
    """Resolves dependency conflicts and compatibility issues"""
    
    async def check_compatibility(self, package: str, new_version: str, package_type: str) -> Dict:
        """Check if updating a package will cause compatibility issues"""
        compatibility = {'compatible': True, 'issues': [], 'warnings': []}
        
        if package_type == 'npm':
            compatibility = await self._check_npm_compatibility(package, new_version)
        elif package_type == 'pip':
            compatibility = await self._check_pip_compatibility(package, new_version)
        
        return compatibility
    
    async def _check_npm_compatibility(self, package: str, new_version: str) -> Dict:
        """Check npm package compatibility"""
        try:
            # Dry run the update to check for conflicts
            result = subprocess.run(
                ['npm', 'install', f'{package}@{new_version}', '--dry-run', '--json'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {
                    'compatible': False,
                    'issues': ['Installation would fail'],
                    'warnings': []
                }
            
            # Check for peer dependency warnings
            if 'peer' in result.stderr.lower():
                return {
                    'compatible': True,
                    'issues': [],
                    'warnings': ['Peer dependency warnings detected']
                }
            
            return {'compatible': True, 'issues': [], 'warnings': []}
            
        except Exception as e:
            logger.error(f"Error checking npm compatibility: {e}")
            return {'compatible': False, 'issues': [str(e)], 'warnings': []}
    
    async def _check_pip_compatibility(self, package: str, new_version: str) -> Dict:
        """Check pip package compatibility"""
        try:
            # Check if package version is compatible with current Python
            result = subprocess.run(
                ['pip', 'install', f'{package}=={new_version}', '--dry-run'],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode != 0:
                return {
                    'compatible': False,
                    'issues': ['Installation would fail'],
                    'warnings': []
                }
            
            # Check for dependency conflicts
            if 'incompatible' in result.stdout.lower() or 'conflict' in result.stdout.lower():
                return {
                    'compatible': False,
                    'issues': ['Dependency conflicts detected'],
                    'warnings': []
                }
            
            return {'compatible': True, 'issues': [], 'warnings': []}
            
        except Exception as e:
            logger.error(f"Error checking pip compatibility: {e}")
            return {'compatible': False, 'issues': [str(e)], 'warnings': []}
    
    async def resolve_conflicts(self, conflicts: List[Dict]) -> List[Dict]:
        """Attempt to resolve dependency conflicts"""
        resolutions = []
        
        for conflict in conflicts:
            resolution = {
                'package': conflict.get('package'),
                'conflict': conflict.get('issue'),
                'resolution': None,
                'action_required': True
            }
            
            # Try to find a compatible version
            if 'version' in conflict:
                compatible_version = await self._find_compatible_version(
                    conflict['package'],
                    conflict.get('type', 'npm')
                )
                if compatible_version:
                    resolution['resolution'] = f"Use version {compatible_version}"
                    resolution['action_required'] = False
            
            resolutions.append(resolution)
        
        return resolutions
    
    async def _find_compatible_version(self, package: str, package_type: str) -> Optional[str]:
        """Find a compatible version of a package"""
        # This would implement logic to find compatible versions
        # For now, return None
        return None


class UpdateScheduler:
    """Schedules and manages update windows"""
    
    def __init__(self):
        self.maintenance_windows = []
        self.blackout_periods = []
    
    def add_maintenance_window(self, start_time: datetime, duration_minutes: int):
        """Add a maintenance window for updates"""
        self.maintenance_windows.append({
            'start': start_time,
            'duration': duration_minutes,
            'end': start_time + timedelta(minutes=duration_minutes)
        })
    
    def add_blackout_period(self, start_time: datetime, end_time: datetime, reason: str):
        """Add a blackout period where no updates should occur"""
        self.blackout_periods.append({
            'start': start_time,
            'end': end_time,
            'reason': reason
        })
    
    def is_update_allowed(self) -> bool:
        """Check if updates are allowed at current time"""
        now = datetime.utcnow()
        
        # Check blackout periods
        for blackout in self.blackout_periods:
            if blackout['start'] <= now <= blackout['end']:
                logger.info(f"Updates blocked due to blackout: {blackout['reason']}")
                return False
        
        # Check maintenance windows (if configured, only allow during windows)
        if self.maintenance_windows:
            for window in self.maintenance_windows:
                if window['start'] <= now <= window['end']:
                    return True
            return False
        
        # If no windows configured, always allow
        return True
    
    def get_next_window(self) -> Optional[datetime]:
        """Get the next available update window"""
        now = datetime.utcnow()
        future_windows = [w for w in self.maintenance_windows if w['start'] > now]
        
        if future_windows:
            future_windows.sort(key=lambda w: w['start'])
            return future_windows[0]['start']
        
        return None
    
    def schedule_update(self, package: str, update_type: str) -> Dict:
        """Schedule an update for the next available window"""
        next_window = self.get_next_window()
        
        if next_window:
            return {
                'scheduled': True,
                'package': package,
                'type': update_type,
                'scheduled_time': next_window.isoformat(),
                'status': 'pending'
            }
        else:
            # No windows configured, can update immediately
            return {
                'scheduled': True,
                'package': package,
                'type': update_type,
                'scheduled_time': datetime.utcnow().isoformat(),
                'status': 'immediate'
            }


class RollbackManager:
    """Manages rollback operations for failed updates"""
    
    def __init__(self):
        self.rollback_points = []
        self.max_rollback_points = 10
    
    def create_rollback_point(self, package: str, version: str, package_type: str) -> str:
        """Create a rollback point before update"""
        rollback_id = f"{package}_{version}_{datetime.utcnow().timestamp()}"
        
        rollback_point = {
            'id': rollback_id,
            'package': package,
            'version': version,
            'type': package_type,
            'timestamp': datetime.utcnow().isoformat(),
            'files_backed_up': []
        }
        
        # Backup relevant files
        if package_type == 'npm':
            rollback_point['files_backed_up'] = self._backup_npm_files()
        elif package_type == 'pip':
            rollback_point['files_backed_up'] = self._backup_pip_files()
        
        self.rollback_points.append(rollback_point)
        
        # Keep only recent rollback points
        if len(self.rollback_points) > self.max_rollback_points:
            self.rollback_points = self.rollback_points[-self.max_rollback_points:]
        
        return rollback_id
    
    def _backup_npm_files(self) -> List[str]:
        """Backup npm-related files"""
        backed_up = []
        files_to_backup = ['package.json', 'package-lock.json']
        
        for file in files_to_backup:
            src = f"frontend/{file}"
            dst = f"frontend/{file}.rollback"
            if os.path.exists(src):
                try:
                    with open(src, 'r') as f:
                        content = f.read()
                    with open(dst, 'w') as f:
                        f.write(content)
                    backed_up.append(dst)
                except Exception as e:
                    logger.error(f"Failed to backup {file}: {e}")
        
        return backed_up
    
    def _backup_pip_files(self) -> List[str]:
        """Backup pip-related files"""
        backed_up = []
        files_to_backup = ['requirements.txt']
        
        for file in files_to_backup:
            src = f"backend/{file}"
            dst = f"backend/{file}.rollback"
            if os.path.exists(src):
                try:
                    with open(src, 'r') as f:
                        content = f.read()
                    with open(dst, 'w') as f:
                        f.write(content)
                    backed_up.append(dst)
                except Exception as e:
                    logger.error(f"Failed to backup {file}: {e}")
        
        return backed_up
    
    async def rollback(self, rollback_id: str) -> Dict:
        """Perform a rollback to a previous state"""
        rollback_point = None
        for point in self.rollback_points:
            if point['id'] == rollback_id:
                rollback_point = point
                break
        
        if not rollback_point:
            return {'success': False, 'error': 'Rollback point not found'}
        
        try:
            # Restore backed up files
            for file in rollback_point['files_backed_up']:
                src = file
                dst = file.replace('.rollback', '')
                if os.path.exists(src):
                    with open(src, 'r') as f:
                        content = f.read()
                    with open(dst, 'w') as f:
                        f.write(content)
            
            # Reinstall dependencies
            if rollback_point['type'] == 'npm':
                subprocess.run(['npm', 'install'], cwd='frontend', timeout=120)
            elif rollback_point['type'] == 'pip':
                subprocess.run(['pip', 'install', '-r', 'requirements.txt'], cwd='backend', timeout=120)
            
            return {
                'success': True,
                'rolled_back_to': rollback_point['version'],
                'package': rollback_point['package']
            }
            
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def get_available_rollbacks(self) -> List[Dict]:
        """Get list of available rollback points"""
        return [
            {
                'id': point['id'],
                'package': point['package'],
                'version': point['version'],
                'timestamp': point['timestamp']
            }
            for point in self.rollback_points
        ]


# Export subagent classes
__all__ = [
    'PackageScanner',
    'VulnerabilityScanner',
    'DependencyResolver',
    'UpdateScheduler',
    'RollbackManager'
]
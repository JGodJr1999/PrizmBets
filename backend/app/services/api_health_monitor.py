"""
API Health Monitoring System
Monitors the health and performance of sports data providers
Provides alerts, rate limit tracking, and automatic failover
"""

import logging
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum
import threading

from .providers import BaseSportsProvider, TheOddsAPIProvider, APISportsProvider
from .models.sports_data import SportType, APIResponse

logger = logging.getLogger(__name__)


class HealthStatus(Enum):
    """Health status levels"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    DOWN = "down"


@dataclass
class ProviderMetrics:
    """Metrics for a single provider"""
    name: str
    status: HealthStatus = HealthStatus.HEALTHY
    last_check: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    response_times: List[float] = field(default_factory=list)
    success_rate: float = 1.0
    requests_made: int = 0
    requests_failed: int = 0
    rate_limit_remaining: Optional[int] = None
    consecutive_failures: int = 0
    last_error: Optional[str] = None
    uptime_percentage: float = 100.0
    
    def add_response_time(self, response_time: float):
        """Add a response time measurement"""
        self.response_times.append(response_time)
        # Keep only last 100 measurements
        if len(self.response_times) > 100:
            self.response_times = self.response_times[-100:]
    
    def get_avg_response_time(self) -> float:
        """Calculate average response time"""
        if not self.response_times:
            return 0.0
        return sum(self.response_times) / len(self.response_times)
    
    def record_success(self, response_time: float = 0.0):
        """Record a successful request"""
        self.requests_made += 1
        self.consecutive_failures = 0
        self.last_error = None
        if response_time > 0:
            self.add_response_time(response_time)
        self._update_success_rate()
        self._update_status()
    
    def record_failure(self, error_message: str):
        """Record a failed request"""
        self.requests_made += 1
        self.requests_failed += 1
        self.consecutive_failures += 1
        self.last_error = error_message
        self._update_success_rate()
        self._update_status()
    
    def _update_success_rate(self):
        """Update success rate based on recent requests"""
        if self.requests_made > 0:
            self.success_rate = 1.0 - (self.requests_failed / self.requests_made)
    
    def _update_status(self):
        """Update health status based on metrics"""
        if self.consecutive_failures >= 5:
            self.status = HealthStatus.DOWN
        elif self.consecutive_failures >= 3:
            self.status = HealthStatus.UNHEALTHY
        elif self.success_rate < 0.8:
            self.status = HealthStatus.DEGRADED
        else:
            self.status = HealthStatus.HEALTHY


class APIHealthMonitor:
    """Monitors health and performance of sports data providers"""
    
    def __init__(self):
        """Initialize the health monitor"""
        
        # Provider instances
        self.providers = {
            'theoddsapi': TheOddsAPIProvider(),
            'apisports': APISportsProvider()
        }
        
        # Metrics for each provider
        self.metrics = {
            name: ProviderMetrics(name=name) 
            for name in self.providers.keys()
        }
        
        # Health check configuration
        self.check_interval = 300  # 5 minutes
        self.timeout = 10  # seconds
        self.is_monitoring = False
        self.monitor_thread = None
        
        # Alerting thresholds
        self.alert_thresholds = {
            'response_time': 5.0,  # seconds
            'success_rate': 0.9,   # 90%
            'consecutive_failures': 3
        }
        
        # Historical data
        self.health_history = []
        
        logger.info("API Health Monitor initialized")
    
    def start_monitoring(self):
        """Start continuous health monitoring"""
        if self.is_monitoring:
            logger.warning("Health monitoring is already running")
            return
        
        self.is_monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitoring_loop, daemon=True)
        self.monitor_thread.start()
        logger.info("Health monitoring started")
    
    def stop_monitoring(self):
        """Stop health monitoring"""
        self.is_monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Health monitoring stopped")
    
    def _monitoring_loop(self):
        """Main monitoring loop"""
        while self.is_monitoring:
            try:
                self.check_all_providers()
                time.sleep(self.check_interval)
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Wait before retrying
    
    def check_all_providers(self) -> Dict[str, ProviderMetrics]:
        """Check health of all providers"""
        
        for provider_name, provider in self.providers.items():
            try:
                self._check_provider_health(provider_name, provider)
            except Exception as e:
                logger.error(f"Failed to check health for {provider_name}: {str(e)}")
                self.metrics[provider_name].record_failure(str(e))
        
        # Store historical snapshot
        self._store_health_snapshot()
        
        # Check for alerts
        self._check_alerts()
        
        return self.metrics
    
    def _check_provider_health(self, name: str, provider: BaseSportsProvider):
        """Check health of a single provider"""
        
        start_time = time.time()
        
        try:
            # Test with a simple request (try to get supported sports)
            supported_sports = provider.get_supported_sports()
            
            if supported_sports:
                # Try a lightweight API call if possible
                if hasattr(provider, 'get_live_games') and supported_sports:
                    test_sport = supported_sports[0]  # Use first supported sport
                    response = provider.get_live_games(test_sport, limit=1)
                    
                    response_time = time.time() - start_time
                    
                    if response.success:
                        self.metrics[name].record_success(response_time)
                        
                        # Extract rate limit info if available
                        if hasattr(response, 'rate_limit_remaining') and response.rate_limit_remaining:
                            self.metrics[name].rate_limit_remaining = response.rate_limit_remaining
                    else:
                        self.metrics[name].record_failure(response.error_message or "API request failed")
                else:
                    # Basic health check passed
                    response_time = time.time() - start_time
                    self.metrics[name].record_success(response_time)
            else:
                self.metrics[name].record_failure("No supported sports found")
                
        except Exception as e:
            self.metrics[name].record_failure(str(e))
        
        # Update last check time
        self.metrics[name].last_check = datetime.now(timezone.utc)
    
    def _store_health_snapshot(self):
        """Store a snapshot of current health metrics"""
        
        snapshot = {
            'timestamp': datetime.now(timezone.utc),
            'providers': {}
        }
        
        for name, metrics in self.metrics.items():
            snapshot['providers'][name] = {
                'status': metrics.status.value,
                'success_rate': metrics.success_rate,
                'avg_response_time': metrics.get_avg_response_time(),
                'requests_made': metrics.requests_made,
                'requests_failed': metrics.requests_failed,
                'rate_limit_remaining': metrics.rate_limit_remaining
            }
        
        self.health_history.append(snapshot)
        
        # Keep only last 24 hours of history (288 snapshots at 5min intervals)
        if len(self.health_history) > 288:
            self.health_history = self.health_history[-288:]
    
    def _check_alerts(self):
        """Check if any metrics exceed alert thresholds"""
        
        for name, metrics in self.metrics.items():
            alerts = []
            
            # Response time alert
            avg_response_time = metrics.get_avg_response_time()
            if avg_response_time > self.alert_thresholds['response_time']:
                alerts.append(f"High response time: {avg_response_time:.2f}s")
            
            # Success rate alert
            if metrics.success_rate < self.alert_thresholds['success_rate']:
                alerts.append(f"Low success rate: {metrics.success_rate:.1%}")
            
            # Consecutive failures alert
            if metrics.consecutive_failures >= self.alert_thresholds['consecutive_failures']:
                alerts.append(f"Consecutive failures: {metrics.consecutive_failures}")
            
            # Rate limit alert
            if metrics.rate_limit_remaining and metrics.rate_limit_remaining < 100:
                alerts.append(f"Low rate limit remaining: {metrics.rate_limit_remaining}")
            
            if alerts:
                logger.warning(f"Health alerts for {name}: {', '.join(alerts)}")
    
    def get_provider_status(self, provider_name: str) -> Optional[ProviderMetrics]:
        """Get detailed status for a specific provider"""
        return self.metrics.get(provider_name)
    
    def get_overall_health(self) -> Dict[str, Any]:
        """Get overall system health summary"""
        
        healthy_providers = sum(1 for m in self.metrics.values() if m.status == HealthStatus.HEALTHY)
        total_providers = len(self.metrics)
        
        overall_status = HealthStatus.HEALTHY
        if healthy_providers == 0:
            overall_status = HealthStatus.DOWN
        elif healthy_providers < total_providers:
            overall_status = HealthStatus.DEGRADED
        
        return {
            'overall_status': overall_status.value,
            'healthy_providers': healthy_providers,
            'total_providers': total_providers,
            'provider_statuses': {
                name: {
                    'status': metrics.status.value,
                    'success_rate': metrics.success_rate,
                    'avg_response_time': metrics.get_avg_response_time(),
                    'last_check': metrics.last_check.isoformat(),
                    'consecutive_failures': metrics.consecutive_failures,
                    'rate_limit_remaining': metrics.rate_limit_remaining
                }
                for name, metrics in self.metrics.items()
            },
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
    
    def get_health_trends(self, hours: int = 24) -> Dict[str, Any]:
        """Get health trends over specified time period"""
        
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        
        # Filter history to requested time period
        relevant_history = [
            snapshot for snapshot in self.health_history
            if snapshot['timestamp'] >= cutoff_time
        ]
        
        if not relevant_history:
            return {'message': 'No historical data available'}
        
        trends = {
            'time_period_hours': hours,
            'data_points': len(relevant_history),
            'provider_trends': {}
        }
        
        for provider_name in self.metrics.keys():
            provider_data = []
            for snapshot in relevant_history:
                if provider_name in snapshot['providers']:
                    provider_data.append(snapshot['providers'][provider_name])
            
            if provider_data:
                trends['provider_trends'][provider_name] = {
                    'avg_success_rate': sum(d['success_rate'] for d in provider_data) / len(provider_data),
                    'avg_response_time': sum(d['avg_response_time'] for d in provider_data) / len(provider_data),
                    'total_requests': sum(d['requests_made'] for d in provider_data),
                    'total_failures': sum(d['requests_failed'] for d in provider_data)
                }
        
        return trends
    
    def force_health_check(self) -> Dict[str, ProviderMetrics]:
        """Force an immediate health check of all providers"""
        logger.info("Forcing immediate health check")
        return self.check_all_providers()
    
    def reset_metrics(self, provider_name: str = None):
        """Reset metrics for a specific provider or all providers"""
        
        if provider_name:
            if provider_name in self.metrics:
                self.metrics[provider_name] = ProviderMetrics(name=provider_name)
                logger.info(f"Reset metrics for {provider_name}")
        else:
            for name in self.metrics.keys():
                self.metrics[name] = ProviderMetrics(name=name)
            logger.info("Reset metrics for all providers")


# Global health monitor instance
health_monitor = APIHealthMonitor()
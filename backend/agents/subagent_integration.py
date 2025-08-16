"""
Subagent Integration System for PrizmBets
Manages coordination between main agents and their specialized subagents
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from .base_agent import BaseAgent, AgentTask, Priority
from .subagents.security_subagents import VulnerabilityScanner, ComplianceMonitor, ThreatDetector, PenetrationTester
from .subagents.testing_subagents import UnitTestManager, IntegrationTester, CodeQualityAnalyzer
from .subagents.analytics_subagents import UserBehaviorAnalyst, RevenueForecastingEngine, MarketIntelligenceAnalyst

class SubagentCoordinator:
    """Coordinates subagents under their parent agents"""
    
    def __init__(self):
        self.subagent_registry: Dict[str, Dict[str, BaseAgent]] = {}
        self.task_routing: Dict[str, str] = {}
        self.logger = logging.getLogger("subagent_coordinator")
        
    async def initialize_subagents(self):
        """Initialize all subagents and register them with their parent agents"""
        try:
            # Security Manager Subagents
            self.subagent_registry['security_manager'] = {
                'vulnerability_scanner': VulnerabilityScanner(),
                'compliance_monitor': ComplianceMonitor(),
                'threat_detector': ThreatDetector(),
                'penetration_tester': PenetrationTester()
            }
            
            # Testing & Quality Manager Subagents
            self.subagent_registry['testing_quality_manager'] = {
                'unit_test_manager': UnitTestManager(),
                'integration_tester': IntegrationTester(),
                'code_quality_analyzer': CodeQualityAnalyzer()
            }
            
            # Data Analytics Manager Subagents
            self.subagent_registry['data_analytics_manager'] = {
                'user_behavior_analyst': UserBehaviorAnalyst(),
                'revenue_forecasting_engine': RevenueForecastingEngine(),
                'market_intelligence_analyst': MarketIntelligenceAnalyst()
            }
            
            # Initialize all subagents
            for parent_agent, subagents in self.subagent_registry.items():
                for subagent_name, subagent in subagents.items():
                    await subagent.initialize()
                    self.logger.info(f"Initialized subagent: {subagent_name} under {parent_agent}")
            
            # Set up task routing rules
            await self._setup_task_routing()
            
            self.logger.info("All subagents initialized successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to initialize subagents: {str(e)}")
            return False
    
    async def route_task_to_subagent(self, parent_agent: str, task: AgentTask) -> Optional[Dict[str, Any]]:
        """Route a task to the appropriate subagent"""
        try:
            # Determine which subagent should handle this task
            subagent_name = await self._determine_subagent_for_task(parent_agent, task)
            
            if subagent_name and parent_agent in self.subagent_registry:
                subagent = self.subagent_registry[parent_agent].get(subagent_name)
                if subagent:
                    self.logger.info(f"Routing task {task.id} to subagent {subagent_name}")
                    result = await subagent.execute_task(task)
                    return result
            
            return None
            
        except Exception as e:
            self.logger.error(f"Error routing task to subagent: {str(e)}")
            return {"error": str(e)}
    
    async def get_subagent_capabilities(self, parent_agent: str) -> Dict[str, List[str]]:
        """Get capabilities of all subagents under a parent agent"""
        capabilities = {}
        
        if parent_agent in self.subagent_registry:
            for subagent_name, subagent in self.subagent_registry[parent_agent].items():
                capabilities[subagent_name] = await subagent.get_capabilities()
        
        return capabilities
    
    async def get_all_subagent_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all subagents"""
        status = {}
        
        for parent_agent, subagents in self.subagent_registry.items():
            status[parent_agent] = {}
            for subagent_name, subagent in subagents.items():
                status[parent_agent][subagent_name] = subagent.get_status()
        
        return status
    
    async def _setup_task_routing(self):
        """Set up task routing rules for different task types"""
        self.task_routing = {
            # Security Manager routing
            'vulnerability_scan': 'vulnerability_scanner',
            'dependency_scan': 'vulnerability_scanner',
            'code_vulnerability_scan': 'vulnerability_scanner',
            'web_application_scan': 'vulnerability_scanner',
            'pci_dss_check': 'compliance_monitor',
            'gdpr_check': 'compliance_monitor',
            'sox_check': 'compliance_monitor',
            'real_time_monitoring': 'threat_detector',
            'threat_hunting': 'threat_detector',
            'incident_analysis': 'threat_detector',
            'web_app_pentest': 'penetration_tester',
            'api_security_test': 'penetration_tester',
            
            # Testing & Quality Manager routing
            'run_frontend_tests': 'unit_test_manager',
            'run_backend_tests': 'unit_test_manager',
            'coverage_analysis': 'unit_test_manager',
            'api_integration_tests': 'integration_tester',
            'e2e_testing': 'integration_tester',
            'contract_testing': 'integration_tester',
            'static_analysis': 'code_quality_analyzer',
            'complexity_analysis': 'code_quality_analyzer',
            'duplication_detection': 'code_quality_analyzer',
            
            # Data Analytics Manager routing
            'behavioral_segmentation': 'user_behavior_analyst',
            'user_journey_analysis': 'user_behavior_analyst',
            'churn_prediction': 'user_behavior_analyst',
            'monthly_forecast': 'revenue_forecasting_engine',
            'ltv_analysis': 'revenue_forecasting_engine',
            'revenue_attribution': 'revenue_forecasting_engine',
            'competitive_analysis': 'market_intelligence_analyst',
            'market_trends': 'market_intelligence_analyst',
            'opportunity_analysis': 'market_intelligence_analyst'
        }
    
    async def _determine_subagent_for_task(self, parent_agent: str, task: AgentTask) -> Optional[str]:
        """Determine which subagent should handle a specific task"""
        task_type = task.description.split(':')[0].lower()
        
        # Check direct routing rules first
        if task_type in self.task_routing:
            return self.task_routing[task_type]
        
        # Use keyword matching for more complex routing
        task_keywords = task.description.lower()
        
        if parent_agent == 'security_manager':
            if any(keyword in task_keywords for keyword in ['vulnerability', 'cve', 'scan', 'exploit']):
                return 'vulnerability_scanner'
            elif any(keyword in task_keywords for keyword in ['compliance', 'audit', 'regulation', 'pci', 'gdpr']):
                return 'compliance_monitor'
            elif any(keyword in task_keywords for keyword in ['threat', 'attack', 'intrusion', 'incident']):
                return 'threat_detector'
            elif any(keyword in task_keywords for keyword in ['pentest', 'penetration', 'exploit', 'security_test']):
                return 'penetration_tester'
        
        elif parent_agent == 'testing_quality_manager':
            if any(keyword in task_keywords for keyword in ['unit', 'coverage', 'jest', 'pytest']):
                return 'unit_test_manager'
            elif any(keyword in task_keywords for keyword in ['integration', 'e2e', 'api_test', 'cypress']):
                return 'integration_tester'
            elif any(keyword in task_keywords for keyword in ['quality', 'lint', 'complexity', 'static']):
                return 'code_quality_analyzer'
        
        elif parent_agent == 'data_analytics_manager':
            if any(keyword in task_keywords for keyword in ['behavior', 'segment', 'journey', 'churn']):
                return 'user_behavior_analyst'
            elif any(keyword in task_keywords for keyword in ['revenue', 'forecast', 'ltv', 'financial']):
                return 'revenue_forecasting_engine'
            elif any(keyword in task_keywords for keyword in ['market', 'competitive', 'intelligence', 'trend']):
                return 'market_intelligence_analyst'
        
        return None

# Enhanced Parent Agent Integration Mixin
class SubagentIntegrationMixin:
    """Mixin class to add subagent integration capabilities to parent agents"""
    
    def __init__(self):
        self.subagent_coordinator = SubagentCoordinator()
        self.subagents_initialized = False
    
    async def initialize_subagents(self):
        """Initialize subagents for this parent agent"""
        if not self.subagents_initialized:
            await self.subagent_coordinator.initialize_subagents()
            self.subagents_initialized = True
    
    async def delegate_to_subagent(self, task: AgentTask) -> Optional[Dict[str, Any]]:
        """Delegate a task to an appropriate subagent"""
        if not self.subagents_initialized:
            await self.initialize_subagents()
        
        return await self.subagent_coordinator.route_task_to_subagent(
            self.agent_id, task
        )
    
    async def get_combined_capabilities(self) -> List[str]:
        """Get combined capabilities of parent agent and all subagents"""
        parent_capabilities = await self.get_capabilities()
        subagent_capabilities = await self.subagent_coordinator.get_subagent_capabilities(self.agent_id)
        
        combined = parent_capabilities.copy()
        for subagent_name, capabilities in subagent_capabilities.items():
            combined.extend([f"{subagent_name}: {cap}" for cap in capabilities])
        
        return combined
    
    async def get_subagent_status_summary(self) -> Dict[str, Any]:
        """Get status summary of all subagents"""
        all_status = await self.subagent_coordinator.get_all_subagent_status()
        return all_status.get(self.agent_id, {})

# Global subagent coordinator instance
subagent_coordinator = SubagentCoordinator()

async def initialize_all_subagents():
    """Initialize all subagents globally"""
    return await subagent_coordinator.initialize_subagents()

def get_subagent_coordinator():
    """Get the global subagent coordinator instance"""
    return subagent_coordinator
# PrizmBets AI Agent System
# Core agent initialization and management

from .core.agent_manager import AgentManager
from .core.base_agent import BaseAgent
from .core.communication import MessageBus
from .core.persistence import AgentPersistence

# Import all main agents
from .main_agents import (
    MarketingManagerAgent,
    UIEnhancementManagerAgent,
    SecurityManagerAgent,
    TestingQualityManagerAgent,
    DataAnalyticsManagerAgent,
    PerformanceManagerAgent,
    ContentManagerAgent,
    UXManagerAgent,
    DevOpsManagerAgent,
    ComplianceManagerAgent
)

# Import existing subagents
from .sub_agents.vulnerability_scanner import VulnerabilityScannerAgent
from .sub_agents.user_behavior_analyst import UserBehaviorAnalystAgent
from .sub_agents.frontend_optimizer import FrontendOptimizerAgent

# Import new Security subagents
from .sub_agents.compliance_monitor import ComplianceMonitorAgent
from .sub_agents.threat_detector import ThreatDetectorAgent
from .sub_agents.penetration_tester import PenetrationTesterAgent

# Import new Testing subagents
from .sub_agents.unit_test_manager import UnitTestManagerAgent
from .sub_agents.integration_tester import IntegrationTesterAgent
from .sub_agents.code_quality_analyzer import CodeQualityAnalyzerAgent

# Import new Data Analytics subagents
from .sub_agents.revenue_forecasting_engine import RevenueForecastingEngineAgent
from .sub_agents.market_intelligence_analyst import MarketIntelligenceAnalystAgent

# Import new Performance subagents
from .sub_agents.database_optimizer import DatabaseOptimizerAgent
from .sub_agents.infrastructure_monitor import InfrastructureMonitorAgent

# Import new Content subagents
from .sub_agents.sports_data_curator import SportsDataCuratorAgent
from .sub_agents.odds_validator import OddsValidatorAgent
from .sub_agents.content_quality_controller import ContentQualityControllerAgent

# Import new UX subagents
from .sub_agents.ab_test_manager import ABTestManagerAgent
from .sub_agents.conversion_optimizer import ConversionOptimizerAgent
from .sub_agents.usability_tester import UsabilityTesterAgent

__version__ = "1.0.0"
__all__ = [
    "AgentManager", "BaseAgent", "MessageBus", "AgentPersistence",
    "initialize_agent_system", "get_agent_manager", "register_all_agents"
]

# Global agent manager instance
agent_manager = None

def initialize_agent_system(firebase_app=None):
    """Initialize the agent system with Firebase app"""
    global agent_manager
    if agent_manager is None:
        agent_manager = AgentManager(firebase_app)
        # Register all agent classes
        register_all_agents(agent_manager)
    return agent_manager

def register_all_agents(manager: AgentManager):
    """Register all available agent classes with the manager"""

    # Register all 10 main agents
    manager.register_agent_class('marketing_manager', MarketingManagerAgent)
    manager.register_agent_class('ui_enhancement_manager', UIEnhancementManagerAgent)
    manager.register_agent_class('security_manager', SecurityManagerAgent)
    manager.register_agent_class('testing_quality_manager', TestingQualityManagerAgent)
    manager.register_agent_class('data_analytics_manager', DataAnalyticsManagerAgent)
    manager.register_agent_class('performance_manager', PerformanceManagerAgent)
    manager.register_agent_class('content_manager', ContentManagerAgent)
    manager.register_agent_class('ux_manager', UXManagerAgent)
    manager.register_agent_class('devops_manager', DevOpsManagerAgent)
    manager.register_agent_class('compliance_manager', ComplianceManagerAgent)

    # Register existing subagents
    manager.register_agent_class('vulnerability_scanner', VulnerabilityScannerAgent)
    manager.register_agent_class('user_behavior_analyst', UserBehaviorAnalystAgent)
    manager.register_agent_class('frontend_optimizer', FrontendOptimizerAgent)

    # Register Security subagents
    manager.register_agent_class('compliance_monitor', ComplianceMonitorAgent)
    manager.register_agent_class('threat_detector', ThreatDetectorAgent)
    manager.register_agent_class('penetration_tester', PenetrationTesterAgent)

    # Register Testing subagents
    manager.register_agent_class('unit_test_manager', UnitTestManagerAgent)
    manager.register_agent_class('integration_tester', IntegrationTesterAgent)
    manager.register_agent_class('code_quality_analyzer', CodeQualityAnalyzerAgent)

    # Register Data Analytics subagents
    manager.register_agent_class('revenue_forecasting_engine', RevenueForecastingEngineAgent)
    manager.register_agent_class('market_intelligence_analyst', MarketIntelligenceAnalystAgent)

    # Register Performance subagents
    manager.register_agent_class('database_optimizer', DatabaseOptimizerAgent)
    manager.register_agent_class('infrastructure_monitor', InfrastructureMonitorAgent)

    # Register Content subagents
    manager.register_agent_class('sports_data_curator', SportsDataCuratorAgent)
    manager.register_agent_class('odds_validator', OddsValidatorAgent)
    manager.register_agent_class('content_quality_controller', ContentQualityControllerAgent)

    # Register UX subagents
    manager.register_agent_class('ab_test_manager', ABTestManagerAgent)
    manager.register_agent_class('conversion_optimizer', ConversionOptimizerAgent)
    manager.register_agent_class('usability_tester', UsabilityTesterAgent)

async def create_default_agents(manager: AgentManager):
    """Create default agent instances for immediate use"""

    # Create all 10 main agents
    main_agents = [
        ('marketing_manager', 'marketing_manager', 'Marketing Manager'),
        ('ui_enhancement_manager', 'ui_enhancement_manager', 'UI Enhancement Manager'),
        ('security_manager', 'security_manager', 'Security Manager'),
        ('testing_quality_manager', 'testing_quality_manager', 'Testing & Quality Manager'),
        ('data_analytics_manager', 'data_analytics_manager', 'Data Analytics Manager'),
        ('performance_manager', 'performance_manager', 'Performance Manager'),
        ('content_manager', 'content_manager', 'Content Manager'),
        ('ux_manager', 'ux_manager', 'UX Manager'),
        ('devops_manager', 'devops_manager', 'DevOps Manager'),
        ('compliance_manager', 'compliance_manager', 'Compliance Manager')
    ]

    created_agents = []
    for agent_type, agent_id, name in main_agents:
        agent = await manager.create_agent(agent_type, agent_id, name, auto_start=False)
        if agent:
            created_agents.append(agent)

    # Create all subagents
    subagents = [
        # Existing subagents
        ('vulnerability_scanner', 'vulnerability_scanner', 'Vulnerability Scanner'),
        ('user_behavior_analyst', 'user_behavior_analyst', 'User Behavior Analyst'),
        ('frontend_optimizer', 'frontend_optimizer', 'Frontend Optimizer'),

        # Security subagents
        ('compliance_monitor', 'compliance_monitor', 'Compliance Monitor'),
        ('threat_detector', 'threat_detector', 'Threat Detector'),
        ('penetration_tester', 'penetration_tester', 'Penetration Tester'),

        # Testing subagents
        ('unit_test_manager', 'unit_test_manager', 'Unit Test Manager'),
        ('integration_tester', 'integration_tester', 'Integration Tester'),
        ('code_quality_analyzer', 'code_quality_analyzer', 'Code Quality Analyzer'),

        # Data Analytics subagents
        ('revenue_forecasting_engine', 'revenue_forecasting_engine', 'Revenue Forecasting Engine'),
        ('market_intelligence_analyst', 'market_intelligence_analyst', 'Market Intelligence Analyst'),

        # Performance subagents
        ('database_optimizer', 'database_optimizer', 'Database Optimizer'),
        ('infrastructure_monitor', 'infrastructure_monitor', 'Infrastructure Monitor'),

        # Content subagents
        ('sports_data_curator', 'sports_data_curator', 'Sports Data Curator'),
        ('odds_validator', 'odds_validator', 'Odds Validator'),
        ('content_quality_controller', 'content_quality_controller', 'Content Quality Controller'),

        # UX subagents
        ('ab_test_manager', 'ab_test_manager', 'A/B Test Manager'),
        ('conversion_optimizer', 'conversion_optimizer', 'Conversion Optimizer'),
        ('usability_tester', 'usability_tester', 'Usability Tester')
    ]

    for agent_type, agent_id, name in subagents:
        agent = await manager.create_agent(agent_type, agent_id, name, auto_start=False)
        if agent:
            created_agents.append(agent)

    return created_agents

def get_agent_manager():
    """Get the global agent manager instance"""
    return agent_manager
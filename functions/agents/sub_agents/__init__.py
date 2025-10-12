"""
Subagents Module

Specialized subagents for handling specific tasks under main agents
"""

# Security Subagents
from .vulnerability_scanner import VulnerabilityScannerAgent
from .compliance_monitor import ComplianceMonitorAgent
from .threat_detector import ThreatDetectorAgent
from .penetration_tester import PenetrationTesterAgent

# Testing & Quality Subagents
from .unit_test_manager import UnitTestManagerAgent
from .integration_tester import IntegrationTesterAgent
from .code_quality_analyzer import CodeQualityAnalyzerAgent

# Data Analytics Subagents
from .user_behavior_analyst import UserBehaviorAnalystAgent
from .revenue_forecasting_engine import RevenueForecastingEngineAgent
from .market_intelligence_analyst import MarketIntelligenceAnalystAgent

# Performance Subagents
from .frontend_optimizer import FrontendOptimizerAgent
from .database_optimizer import DatabaseOptimizerAgent
from .infrastructure_monitor import InfrastructureMonitorAgent

# Content Management Subagents
from .sports_data_curator import SportsDataCuratorAgent
from .odds_validator import OddsValidatorAgent
from .content_quality_controller import ContentQualityControllerAgent

# UX Subagents
from .ab_test_manager import ABTestManagerAgent
from .conversion_optimizer import ConversionOptimizerAgent
from .usability_tester import UsabilityTesterAgent

__all__ = [
    # Security Subagents
    'VulnerabilityScannerAgent',
    'ComplianceMonitorAgent',
    'ThreatDetectorAgent',
    'PenetrationTesterAgent',

    # Testing & Quality Subagents
    'UnitTestManagerAgent',
    'IntegrationTesterAgent',
    'CodeQualityAnalyzerAgent',

    # Data Analytics Subagents
    'UserBehaviorAnalystAgent',
    'RevenueForecastingEngineAgent',
    'MarketIntelligenceAnalystAgent',

    # Performance Subagents
    'FrontendOptimizerAgent',
    'DatabaseOptimizerAgent',
    'InfrastructureMonitorAgent',

    # Content Management Subagents
    'SportsDataCuratorAgent',
    'OddsValidatorAgent',
    'ContentQualityControllerAgent',

    # UX Subagents
    'ABTestManagerAgent',
    'ConversionOptimizerAgent',
    'UsabilityTesterAgent'
]
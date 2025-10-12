# Agent Configuration Management
# Centralized configuration for all agents

import json
import os
from typing import Dict, Any, Optional
from datetime import datetime

class AgentConfig:
    """Configuration management for the agent system"""

    def __init__(self):
        self.config_data = self._load_default_config()

    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration for all agents"""
        return {
            # System-wide settings
            "system": {
                "environment": os.getenv("FLASK_ENV", "production"),
                "debug_mode": os.getenv("FLASK_ENV") == "development",
                "max_concurrent_tasks": 50,
                "task_timeout_seconds": 300,
                "cleanup_interval_hours": 24,
                "health_check_interval_seconds": 30,
                "enable_persistence": True,
                "enable_monitoring": True
            },

            # Agent Manager configuration
            "agent_manager": {
                "auto_start_agents": True,
                "restart_failed_agents": True,
                "max_restart_attempts": 3,
                "agent_startup_timeout": 60,
                "load_balancing_enabled": True
            },

            # Message Bus configuration
            "message_bus": {
                "max_queue_size": 1000,
                "message_retention_hours": 72,
                "priority_processing": True,
                "broadcast_enabled": True
            },

            # Individual agent configurations
            "agents": {
                "marketing_manager": {
                    "enabled": True,
                    "email_service_enabled": True,
                    "campaign_automation": True,
                    "user_segmentation": True,
                    "ab_testing": True,
                    "max_campaigns_per_day": 5,
                    "email_rate_limit": 100,  # emails per hour
                    "analytics_retention_days": 30
                },

                "ui_enhancement_manager": {
                    "enabled": True,
                    "accessibility_checks": True,
                    "performance_monitoring": True,
                    "design_validation": True,
                    "component_optimization": True,
                    "lighthouse_threshold": 90,
                    "wcag_compliance_level": "AA"
                },

                "security_manager": {
                    "enabled": True,
                    "vulnerability_scanning": True,
                    "threat_detection": True,
                    "compliance_monitoring": True,
                    "penetration_testing": False,  # Disabled by default
                    "scan_interval_hours": 6,
                    "alert_threshold": "medium",
                    "auto_remediation": False
                },

                "testing_quality_manager": {
                    "enabled": True,
                    "unit_testing": True,
                    "integration_testing": True,
                    "performance_testing": True,
                    "code_quality_checks": True,
                    "coverage_threshold": 80,
                    "quality_gate_enabled": True,
                    "auto_test_generation": False
                },

                "data_analytics_manager": {
                    "enabled": True,
                    "user_behavior_analysis": True,
                    "revenue_forecasting": True,
                    "market_intelligence": True,
                    "real_time_analytics": True,
                    "data_retention_days": 365,
                    "ml_model_training": False,
                    "prediction_confidence_threshold": 0.8
                },

                "performance_manager": {
                    "enabled": True,
                    "frontend_optimization": True,
                    "backend_optimization": True,
                    "database_optimization": True,
                    "resource_monitoring": True,
                    "auto_scaling": False,
                    "performance_threshold": 95,
                    "alert_on_degradation": True
                },

                "content_manager": {
                    "enabled": True,
                    "sports_data_curation": True,
                    "odds_validation": True,
                    "content_quality_control": True,
                    "automated_updates": True,
                    "data_source_priority": ["primary_api", "backup_api", "demo"],
                    "refresh_interval_minutes": 5,
                    "quality_threshold": 0.95
                },

                "user_experience_manager": {
                    "enabled": True,
                    "journey_optimization": True,
                    "conversion_tracking": True,
                    "usability_testing": True,
                    "personalization": True,
                    "ab_test_duration_days": 14,
                    "conversion_tracking_enabled": True,
                    "user_feedback_collection": True
                },

                "devops_manager": {
                    "enabled": True,
                    "deployment_automation": False,  # Disabled for safety
                    "infrastructure_monitoring": True,
                    "backup_automation": True,
                    "security_updates": False,  # Manual approval required
                    "monitoring_alerts": True,
                    "auto_backup_interval_hours": 24
                },

                "compliance_manager": {
                    "enabled": True,
                    "regulatory_monitoring": True,
                    "data_privacy_checks": True,
                    "audit_logging": True,
                    "policy_enforcement": True,
                    "compliance_frameworks": ["GDPR", "CCPA"],
                    "audit_retention_years": 7,
                    "automated_reporting": True
                }
            },

            # Subagent configurations
            "subagents": {
                "security": {
                    "vulnerability_scanner": {
                        "enabled": True,
                        "scan_frequency_hours": 12,
                        "severity_threshold": "medium",
                        "auto_fix_low_severity": False
                    },
                    "compliance_monitor": {
                        "enabled": True,
                        "frameworks": ["PCI_DSS", "GDPR", "SOX"],
                        "continuous_monitoring": True
                    },
                    "threat_detector": {
                        "enabled": True,
                        "real_time_monitoring": True,
                        "ml_detection": False
                    },
                    "penetration_tester": {
                        "enabled": False,  # Requires special configuration
                        "automated_testing": False
                    }
                },

                "testing": {
                    "unit_test_manager": {
                        "enabled": True,
                        "frontend_testing": True,
                        "backend_testing": True,
                        "coverage_reporting": True
                    },
                    "integration_tester": {
                        "enabled": True,
                        "api_testing": True,
                        "e2e_testing": True,
                        "contract_testing": False
                    },
                    "code_quality_analyzer": {
                        "enabled": True,
                        "static_analysis": True,
                        "complexity_analysis": True,
                        "duplication_detection": True
                    }
                },

                "analytics": {
                    "user_behavior_analyst": {
                        "enabled": True,
                        "session_tracking": True,
                        "funnel_analysis": True,
                        "cohort_analysis": True
                    },
                    "revenue_forecasting_engine": {
                        "enabled": True,
                        "predictive_modeling": True,
                        "scenario_planning": True,
                        "real_time_updates": True
                    },
                    "market_intelligence_analyst": {
                        "enabled": True,
                        "competitor_monitoring": False,  # Requires API keys
                        "trend_analysis": True,
                        "market_sizing": True
                    }
                },

                "performance": {
                    "frontend_optimizer": {
                        "enabled": True,
                        "bundle_optimization": True,
                        "lighthouse_monitoring": True,
                        "image_optimization": True
                    },
                    "database_optimizer": {
                        "enabled": True,
                        "query_optimization": True,
                        "index_analysis": True,
                        "performance_monitoring": True
                    },
                    "infrastructure_monitor": {
                        "enabled": True,
                        "resource_tracking": True,
                        "cost_optimization": True,
                        "scaling_recommendations": True
                    }
                },

                "content": {
                    "sports_data_curator": {
                        "enabled": True,
                        "multi_source_aggregation": True,
                        "data_enrichment": True,
                        "quality_validation": True
                    },
                    "odds_validator": {
                        "enabled": True,
                        "accuracy_checking": True,
                        "arbitrage_detection": True,
                        "historical_tracking": True
                    },
                    "content_quality_controller": {
                        "enabled": True,
                        "automated_qc": True,
                        "user_experience_validation": True,
                        "content_freshness_checks": True
                    }
                },

                "ux": {
                    "ab_test_manager": {
                        "enabled": True,
                        "statistical_analysis": True,
                        "experiment_design": True,
                        "result_interpretation": True
                    },
                    "conversion_optimizer": {
                        "enabled": True,
                        "funnel_analysis": True,
                        "conversion_rate_optimization": True,
                        "user_journey_mapping": True
                    },
                    "usability_tester": {
                        "enabled": True,
                        "automated_usability_checks": True,
                        "user_research": False,  # Requires manual setup
                        "accessibility_testing": True
                    }
                }
            },

            # External service configurations
            "external_services": {
                "email_service": {
                    "provider": "sendgrid",  # or "ses", "mailgun"
                    "api_key_env": "SENDGRID_API_KEY",
                    "from_email": "noreply@prizmbets.com",
                    "rate_limit": 100
                },
                "analytics_service": {
                    "provider": "google_analytics",
                    "tracking_id_env": "GA_TRACKING_ID",
                    "enhanced_ecommerce": True
                },
                "monitoring_service": {
                    "provider": "datadog",  # or "newrelic", "cloudwatch"
                    "api_key_env": "DATADOG_API_KEY",
                    "log_level": "info"
                }
            },

            # Security settings
            "security": {
                "api_rate_limiting": True,
                "jwt_expiry_hours": 24,
                "max_login_attempts": 5,
                "password_complexity": True,
                "two_factor_auth": False,
                "audit_logging": True
            },

            # Performance settings
            "performance": {
                "cache_ttl_seconds": 300,
                "max_concurrent_requests": 100,
                "request_timeout_seconds": 30,
                "enable_compression": True,
                "cdn_enabled": True
            },

            # Feature flags
            "features": {
                "live_betting": True,
                "parlay_builder": True,
                "odds_comparison": True,
                "user_analytics": True,
                "ai_recommendations": True,
                "social_features": False,
                "cryptocurrency_payments": False,
                "advanced_statistics": True
            }
        }

    def get(self, key_path: str, default: Any = None) -> Any:
        """Get configuration value using dot notation (e.g., 'agents.marketing_manager.enabled')"""
        try:
            keys = key_path.split('.')
            value = self.config_data

            for key in keys:
                if isinstance(value, dict) and key in value:
                    value = value[key]
                else:
                    return default

            return value

        except Exception:
            return default

    def set(self, key_path: str, value: Any) -> bool:
        """Set configuration value using dot notation"""
        try:
            keys = key_path.split('.')
            config = self.config_data

            # Navigate to the parent of the target key
            for key in keys[:-1]:
                if key not in config:
                    config[key] = {}
                config = config[key]

            # Set the value
            config[keys[-1]] = value
            return True

        except Exception:
            return False

    def get_agent_config(self, agent_id: str) -> Dict[str, Any]:
        """Get configuration for a specific agent"""
        agent_config = self.get(f"agents.{agent_id}", {})
        system_config = self.get("system", {})

        # Merge with system-wide settings
        merged_config = {
            **system_config,
            **agent_config,
            "agent_id": agent_id
        }

        return merged_config

    def get_subagent_config(self, category: str, subagent_id: str) -> Dict[str, Any]:
        """Get configuration for a specific subagent"""
        subagent_config = self.get(f"subagents.{category}.{subagent_id}", {})
        system_config = self.get("system", {})

        merged_config = {
            **system_config,
            **subagent_config,
            "category": category,
            "subagent_id": subagent_id
        }

        return merged_config

    def is_agent_enabled(self, agent_id: str) -> bool:
        """Check if an agent is enabled"""
        return self.get(f"agents.{agent_id}.enabled", False)

    def is_subagent_enabled(self, category: str, subagent_id: str) -> bool:
        """Check if a subagent is enabled"""
        return self.get(f"subagents.{category}.{subagent_id}.enabled", False)

    def is_feature_enabled(self, feature_name: str) -> bool:
        """Check if a feature is enabled"""
        return self.get(f"features.{feature_name}", False)

    def update_from_env(self):
        """Update configuration from environment variables"""
        env_mappings = {
            "AGENT_DEBUG_MODE": "system.debug_mode",
            "AGENT_MAX_TASKS": "system.max_concurrent_tasks",
            "AGENT_TASK_TIMEOUT": "system.task_timeout_seconds",
            "ENABLE_MARKETING_AGENT": "agents.marketing_manager.enabled",
            "ENABLE_SECURITY_AGENT": "agents.security_manager.enabled",
            "ENABLE_TESTING_AGENT": "agents.testing_quality_manager.enabled",
            "ENABLE_ANALYTICS_AGENT": "agents.data_analytics_manager.enabled",
            "ENABLE_PERFORMANCE_AGENT": "agents.performance_manager.enabled",
            "ENABLE_CONTENT_AGENT": "agents.content_manager.enabled",
            "ENABLE_UX_AGENT": "agents.user_experience_manager.enabled",
            "ENABLE_DEVOPS_AGENT": "agents.devops_manager.enabled",
            "ENABLE_COMPLIANCE_AGENT": "agents.compliance_manager.enabled"
        }

        for env_var, config_path in env_mappings.items():
            env_value = os.getenv(env_var)
            if env_value is not None:
                # Convert string values to appropriate types
                if env_value.lower() in ['true', 'false']:
                    value = env_value.lower() == 'true'
                elif env_value.isdigit():
                    value = int(env_value)
                else:
                    value = env_value

                self.set(config_path, value)

    def validate_config(self) -> List[str]:
        """Validate configuration and return any errors"""
        errors = []

        # Check required system settings
        if not isinstance(self.get("system.max_concurrent_tasks"), int):
            errors.append("system.max_concurrent_tasks must be an integer")

        if not isinstance(self.get("system.task_timeout_seconds"), int):
            errors.append("system.task_timeout_seconds must be an integer")

        # Check agent configurations
        for agent_id in self.config_data.get("agents", {}):
            if not isinstance(self.get(f"agents.{agent_id}.enabled"), bool):
                errors.append(f"agents.{agent_id}.enabled must be a boolean")

        return errors

    def to_dict(self) -> Dict[str, Any]:
        """Return the full configuration as a dictionary"""
        return self.config_data.copy()

    def load_from_dict(self, config_dict: Dict[str, Any]):
        """Load configuration from a dictionary"""
        self.config_data = config_dict

    def load_from_file(self, file_path: str) -> bool:
        """Load configuration from a JSON file"""
        try:
            with open(file_path, 'r') as f:
                config_dict = json.load(f)
                self.load_from_dict(config_dict)
                return True
        except Exception:
            return False

    def save_to_file(self, file_path: str) -> bool:
        """Save configuration to a JSON file"""
        try:
            with open(file_path, 'w') as f:
                json.dump(self.config_data, f, indent=2, default=str)
                return True
        except Exception:
            return False

    def get_runtime_config(self) -> Dict[str, Any]:
        """Get runtime configuration with environment variables applied"""
        # Create a copy of the config
        runtime_config = AgentConfig()
        runtime_config.load_from_dict(self.config_data.copy())

        # Apply environment variables
        runtime_config.update_from_env()

        return runtime_config.to_dict()

# Global configuration instance
agent_config = AgentConfig()

# Convenience functions
def get_config(key_path: str, default: Any = None) -> Any:
    """Get configuration value"""
    return agent_config.get(key_path, default)

def set_config(key_path: str, value: Any) -> bool:
    """Set configuration value"""
    return agent_config.set(key_path, value)

def is_agent_enabled(agent_id: str) -> bool:
    """Check if agent is enabled"""
    return agent_config.is_agent_enabled(agent_id)

def is_feature_enabled(feature_name: str) -> bool:
    """Check if feature is enabled"""
    return agent_config.is_feature_enabled(feature_name)
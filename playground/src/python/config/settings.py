"""Configuration settings for the Python service"""

import os
import logging
from typing import Optional


class ServiceConfig:
    """Configuration management for the Python service"""
    
    def __init__(self):
        """Initialize configuration from environment variables"""
        self.port = int(os.getenv('PYTHON_SERVICE_PORT', '8001'))
        self.host = os.getenv('PYTHON_SERVICE_HOST', 'localhost')
        self.log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        self.strands_model_provider = os.getenv('STRANDS_MODEL_PROVIDER', 'bedrock')
        self.mcp_servers = self._parse_mcp_servers()
        
    def _parse_mcp_servers(self) -> list:
        """Parse MCP server configuration from environment"""
        mcp_config = os.getenv('MCP_SERVERS', '[]')
        try:
            import json
            return json.loads(mcp_config)
        except (json.JSONDecodeError, ImportError):
            return []
    
    def validate(self) -> bool:
        """Validate configuration settings"""
        if not (1024 <= self.port <= 65535):
            raise ValueError(f"Invalid port number: {self.port}")
        
        valid_log_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if self.log_level not in valid_log_levels:
            raise ValueError(f"Invalid log level: {self.log_level}")
        
        return True
    
    def get_log_level(self) -> int:
        """Get numeric log level for logging configuration"""
        return getattr(logging, self.log_level)


# Global configuration instance
config = ServiceConfig()

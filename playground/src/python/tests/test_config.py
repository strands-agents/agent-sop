"""Tests for configuration module"""

import pytest
import os
import logging
from unittest.mock import patch

from config.settings import ServiceConfig


class TestServiceConfig:
    """Test cases for ServiceConfig"""
    
    def test_default_configuration(self):
        """Test default configuration values"""
        config = ServiceConfig()
        
        assert config.port == 8001
        assert config.host == 'localhost'
        assert config.log_level == 'INFO'
        assert config.strands_model_provider == 'bedrock'
        assert config.mcp_servers == []
    
    @patch.dict(os.environ, {
        'PYTHON_SERVICE_PORT': '9000',
        'PYTHON_SERVICE_HOST': '0.0.0.0',
        'LOG_LEVEL': 'DEBUG',
        'STRANDS_MODEL_PROVIDER': 'openai',
        'MCP_SERVERS': '[{"name": "test", "url": "http://localhost:8000"}]'
    })
    def test_environment_configuration(self):
        """Test configuration from environment variables"""
        config = ServiceConfig()
        
        assert config.port == 9000
        assert config.host == '0.0.0.0'
        assert config.log_level == 'DEBUG'
        assert config.strands_model_provider == 'openai'
        assert len(config.mcp_servers) == 1
        assert config.mcp_servers[0]['name'] == 'test'
    
    def test_invalid_port_validation(self):
        """Test validation fails for invalid port"""
        with patch.dict(os.environ, {'PYTHON_SERVICE_PORT': '99999'}):
            config = ServiceConfig()
            with pytest.raises(ValueError, match="Invalid port number"):
                config.validate()
    
    def test_invalid_log_level_validation(self):
        """Test validation fails for invalid log level"""
        with patch.dict(os.environ, {'LOG_LEVEL': 'INVALID'}):
            config = ServiceConfig()
            with pytest.raises(ValueError, match="Invalid log level"):
                config.validate()
    
    def test_valid_configuration(self):
        """Test validation passes for valid configuration"""
        config = ServiceConfig()
        assert config.validate() is True
    
    def test_get_log_level(self):
        """Test get_log_level returns correct numeric value"""
        config = ServiceConfig()
        config.log_level = 'DEBUG'
        assert config.get_log_level() == logging.DEBUG
        
        config.log_level = 'INFO'
        assert config.get_log_level() == logging.INFO
    
    @patch.dict(os.environ, {'MCP_SERVERS': 'invalid_json'})
    def test_invalid_mcp_servers_json(self):
        """Test invalid MCP servers JSON returns empty list"""
        config = ServiceConfig()
        assert config.mcp_servers == []

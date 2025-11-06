"""Integration tests for the Python service"""

import asyncio
import pytest
from unittest.mock import patch

from main import PythonService
from services.agent_service import AgentService
from config.settings import ServiceConfig


class TestIntegration:
    """Integration test cases"""
    
    def test_full_service_initialization(self):
        """Test complete service initialization flow"""
        # Test configuration
        config = ServiceConfig()
        assert config.validate() is True
        
        # Test main service
        service = PythonService()
        health = service.health_check()
        assert health['status'] == 'stopped'
        
        # Test agent service
        agent_service = AgentService()
        assert len(agent_service.agents) == 0
        assert len(agent_service.mcp_clients) == 0
    
    @pytest.mark.asyncio
    async def test_service_lifecycle(self):
        """Test complete service lifecycle"""
        service = PythonService()
        
        # Test initial state
        assert service.running is False
        health = service.health_check()
        assert health['status'] == 'stopped'
        
        # Test that service can be stopped when not running
        await service.stop()
        assert service.running is False
    
    @pytest.mark.asyncio
    async def test_agent_service_operations(self):
        """Test agent service operations flow"""
        service = AgentService()
        
        # Create multiple agents
        agent_configs = [
            {'id': 'agent1', 'config': {'model': 'claude-3'}},
            {'id': 'agent2', 'config': {'model': 'gpt-4'}},
        ]
        
        for agent_config in agent_configs:
            result = await service.create_agent(
                agent_config['id'], 
                agent_config['config']
            )
            assert result is True
        
        # Connect multiple MCP servers
        mcp_configs = [
            {'id': 'server1', 'config': {'url': 'http://localhost:8000'}},
            {'id': 'server2', 'config': {'url': 'http://localhost:8001'}},
        ]
        
        for mcp_config in mcp_configs:
            result = await service.connect_mcp_server(
                mcp_config['id'],
                mcp_config['config']
            )
            assert result is True
        
        # Verify all agents and servers are tracked
        agents = service.list_agents()
        servers = service.list_mcp_servers()
        
        assert len(agents) == 2
        assert len(servers) == 2
        assert 'agent1' in agents
        assert 'agent2' in agents
        assert 'server1' in servers
        assert 'server2' in servers
    
    @patch.dict('os.environ', {
        'PYTHON_SERVICE_PORT': '9999',
        'LOG_LEVEL': 'DEBUG',
        'STRANDS_MODEL_PROVIDER': 'openai'
    })
    def test_environment_integration(self):
        """Test service with environment configuration"""
        config = ServiceConfig()
        service = PythonService()
        
        health = service.health_check()
        
        assert health['port'] == 9999
        assert health['log_level'] == 'DEBUG'
        assert config.strands_model_provider == 'openai'

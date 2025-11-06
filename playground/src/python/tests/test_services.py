"""Tests for services module"""

import pytest
from unittest.mock import patch, MagicMock, mock_open
import os

from services.agent_service import AgentService


class TestAgentService:
    """Test cases for AgentService"""
    
    def test_service_initialization(self):
        """Test agent service initializes correctly"""
        service = AgentService()
        
        assert service.logger is not None
        assert service.agents == {}
        assert service.mcp_manager is not None
        assert service.script_format_integrator is not None
    
    @pytest.mark.asyncio
    async def test_create_agent_success(self):
        """Test successful agent creation"""
        service = AgentService()
        config = {'model': 'claude-3', 'temperature': 0.7}
        
        result = await service.create_agent('test_agent', config)
        
        assert result is True
        assert 'test_agent' in service.agents
        assert service.agents['test_agent']['config'] == config
        assert service.agents['test_agent']['status'] == 'created'
    
    @pytest.mark.asyncio
    async def test_connect_mcp_server_success(self):
        """Test successful MCP server connection"""
        service = AgentService()
        config = {'url': 'http://localhost:8000', 'type': 'http'}
        
        result = await service.connect_mcp_server('test_server', config)
        
        assert result is True
        connections = service.mcp_manager.list_connections()
        assert 'test_server' in connections
    
    def test_get_agent_status_existing(self):
        """Test getting status of existing agent"""
        service = AgentService()
        service.agents['test_agent'] = {'config': {}, 'status': 'created'}
        
        status = service.get_agent_status('test_agent')
        
        assert status is not None
        assert status['status'] == 'created'
    
    def test_get_agent_status_nonexistent(self):
        """Test getting status of non-existent agent"""
        service = AgentService()
        
        status = service.get_agent_status('nonexistent')
        
        assert status is None
    
    def test_get_mcp_status_existing(self):
        """Test getting status of existing MCP server"""
        service = AgentService()
        # Set up mock connection in mcp_manager
        service.mcp_manager.connections['test_server'] = {'config': {}, 'status': 'connected'}
        
        status = service.get_mcp_status('test_server')
        
        assert status is not None
        assert status['status'] == 'connected'
    
    def test_get_mcp_status_nonexistent(self):
        """Test getting status of non-existent MCP server"""
        service = AgentService()
        
        status = service.get_mcp_status('nonexistent')
        
        assert status is None
    
    def test_list_agents(self):
        """Test listing all agents"""
        service = AgentService()
        service.agents['agent1'] = {'status': 'created'}
        service.agents['agent2'] = {'status': 'running'}
        
        agents = service.list_agents()
        
        assert len(agents) == 2
        assert 'agent1' in agents
        assert 'agent2' in agents
        # Ensure it's a copy, not the original
        assert agents is not service.agents
    
    def test_list_mcp_servers(self):
        """Test listing all MCP servers"""
        service = AgentService()
        service.mcp_manager.connections['server1'] = {'status': 'connected'}
        service.mcp_manager.connections['server2'] = {'status': 'disconnected'}
        
        servers = service.list_mcp_servers()
        
        assert len(servers) == 2
        assert 'server1' in servers
        assert 'server2' in servers
        # Ensure it's a copy, not the original
        assert servers is not service.mcp_manager.connections


class TestStrandsAgentService:
    """Test cases for Strands SDK integration"""
    
    @pytest.mark.asyncio
    async def test_load_script_format_rule_success(self):
        """Test successful loading of script format rule"""
        service = AgentService()
        mock_rule_content = "# Agent Script Format\n\nThis is the format rule..."
        
        with patch('builtins.open', mock_open(read_data=mock_rule_content)):
            with patch('os.path.exists', return_value=True):
                await service.load_script_format_rule()
        
        assert service.script_format_rule == mock_rule_content
    
    @pytest.mark.asyncio
    async def test_load_script_format_rule_file_not_found(self):
        """Test handling when script format rule file not found"""
        service = AgentService()
        
        with patch('os.path.exists', return_value=False):
            result = await service.load_script_format_rule()
        
        assert result is False
        assert service.script_format_integrator.get_format_rule() is None
    
    @pytest.mark.asyncio
    async def test_create_agent_with_format_rule_success(self):
        """Test successful agent creation with script format rule"""
        service = AgentService()
        service.script_format_rule = "# Format Rule Content"
        
        config = {'model': 'claude-3', 'temperature': 0.7}
        result = await service.create_agent_with_format_rule('test_agent', config)
        
        assert result is True
        assert 'test_agent' in service.agents
        assert 'strands_agent' in service.agents['test_agent']
        assert service.agents['test_agent']['config'] == config
    
    @pytest.mark.asyncio
    async def test_create_agent_with_format_rule_failure(self):
        """Test agent creation failure handling"""
        service = AgentService()
        service.script_format_rule = "# Format Rule Content"
        
        # Mock the agent creation to raise an exception
        with patch.object(service, '_create_mock_agent', side_effect=Exception("Agent creation failed")):
            config = {'model': 'claude-3', 'temperature': 0.7}
            result = await service.create_agent_with_format_rule('test_agent', config)
            
            assert result is False
            assert 'test_agent' not in service.agents
    
    @pytest.mark.asyncio
    async def test_process_message_success(self):
        """Test successful message processing"""
        service = AgentService()
        
        # Mock agent with call method
        mock_agent = MagicMock()
        mock_agent.return_value = "Generated script content"
        
        service.agents['test_agent'] = {
            'strands_agent': mock_agent,
            'config': {},
            'status': 'created'
        }
        service.conversation_history['test_agent'] = []
        
        response = await service.process_message('test_agent', 'Create a file processor script')
        
        assert response == "Generated script content"
        assert len(service.conversation_history['test_agent']) == 2  # user + agent messages
        mock_agent.assert_called_once_with('Create a file processor script')
    
    @pytest.mark.asyncio
    async def test_process_message_agent_not_found(self):
        """Test message processing when agent doesn't exist"""
        service = AgentService()
        
        response = await service.process_message('nonexistent_agent', 'test message')
        
        assert response is None
    
    @pytest.mark.asyncio
    async def test_process_message_with_conversation_history(self):
        """Test message processing maintains conversation history"""
        service = AgentService()
        
        mock_agent = MagicMock()
        mock_agent.return_value = "Response with context"
        
        service.agents['test_agent'] = {
            'strands_agent': mock_agent,
            'config': {},
            'status': 'created'
        }
        service.conversation_history['test_agent'] = [
            {'role': 'user', 'content': 'Previous message'},
            {'role': 'agent', 'content': 'Previous response'}
        ]
        
        response = await service.process_message('test_agent', 'Follow up message')
        
        assert response == "Response with context"
        assert len(service.conversation_history['test_agent']) == 4  # 2 previous + 2 new
        
        # Check conversation history structure
        history = service.conversation_history['test_agent']
        assert history[-2]['role'] == 'user'
        assert history[-2]['content'] == 'Follow up message'
        assert history[-1]['role'] == 'agent'
        assert history[-1]['content'] == 'Response with context'
    
    def test_get_conversation_history_existing(self):
        """Test retrieving conversation history for existing agent"""
        service = AgentService()
        expected_history = [
            {'role': 'user', 'content': 'Hello'},
            {'role': 'agent', 'content': 'Hi there!'}
        ]
        service.conversation_history['test_agent'] = expected_history
        
        history = service.get_conversation_history('test_agent')
        
        assert history == expected_history
    
    def test_get_conversation_history_nonexistent(self):
        """Test retrieving conversation history for non-existent agent"""
        service = AgentService()
        
        history = service.get_conversation_history('nonexistent_agent')
        
        assert history == []
    
    @pytest.mark.asyncio
    async def test_agent_creation_includes_mcp_tools(self):
        """Test agent creation includes MCP tools when available"""
        service = AgentService()
        service.script_format_rule = "# Format Rule"
        
        # Mock MCP client with tools
        mock_mcp_client = MagicMock()
        mock_mcp_client.list_tools_sync.return_value = [
            {'name': 'file_read', 'description': 'Read files'},
            {'name': 'web_search', 'description': 'Search web'}
        ]
        
        # Mock MCP manager to return tools
        service.mcp_manager.tools_cache['file_server'] = [
            {'name': 'file_read', 'description': 'Read files'},
            {'name': 'web_search', 'description': 'Search web'}
        ]
        service.mcp_manager.connections['file_server'] = {'status': 'connected'}
        
        config = {'model': 'claude-3', 'mcp_servers': ['file_server']}
        result = await service.create_agent_with_format_rule('test_agent', config)
        
        assert result is True
        # Verify agent was created with tools
        agent_info = service.agents['test_agent']
        assert 'tools' in agent_info
        assert len(agent_info['tools']) == 2
        assert agent_info['tools'][0]['name'] == 'file_read'
        assert agent_info['tools'][1]['name'] == 'web_search'
    
    @pytest.mark.asyncio
    async def test_create_agent_with_format_rule_success(self):
        """Test successful agent creation with format rule"""
        service = AgentService()
        config = {'model': 'claude-3', 'temperature': 0.7}
        
        # Mock format rule integration
        with patch.object(service.script_format_integrator, 'get_format_rule', return_value="Format rule content"):
            with patch.object(service.script_format_integrator, 'create_system_prompt_with_format_rule') as mock_prompt:
                mock_prompt.return_value = "You are an agent script authoring assistant.\n\nPlease follow this agent script format:\n\nFormat rule content"
                result = await service.create_agent_with_format_rule('test_agent', config)
        
        assert result is True
        assert 'test_agent' in service.agents
        assert 'Format rule content' in service.agents['test_agent']['system_prompt']
    
    @pytest.mark.asyncio
    async def test_load_script_format_rule_success(self):
        """Test successful format rule loading"""
        service = AgentService()
        
        with patch.object(service.script_format_integrator, 'load_format_rule', return_value=True):
            result = await service.load_script_format_rule()
        
        assert result is True
    
    def test_validate_generated_script(self):
        """Test script validation functionality"""
        service = AgentService()
        script_content = """# Test Script

## Overview
This is a test script.

## Steps
### 1. First Step
Do something.
"""
        
        result = service.validate_generated_script(script_content)
        
        assert 'valid' in result
        assert 'errors' in result
    
    def test_parse_generated_script(self):
        """Test script parsing functionality"""
        service = AgentService()
        script_content = """# Test Script

## Overview
This is a test script.

## Parameters
- **param1** (required): Test parameter

## Steps
### 1. First Step
Do something.
"""
        
        result = service.parse_generated_script(script_content)
        
        assert 'title' in result
        assert 'overview' in result
        assert 'parameters' in result
        assert 'steps' in result

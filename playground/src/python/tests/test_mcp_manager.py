"""Tests for MCP client manager"""

import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from services.mcp_manager import MCPClientManager


class TestMCPClientManager:
    """Test cases for MCPClientManager"""
    
    @pytest.fixture
    def manager(self):
        """Create MCPClientManager instance for testing"""
        return MCPClientManager()
    
    @pytest.fixture
    def stdio_config(self):
        """Sample stdio server configuration"""
        return {
            'type': 'stdio',
            'command': 'python',
            'args': ['test_server.py']
        }
    
    @pytest.fixture
    def http_config(self):
        """Sample HTTP server configuration"""
        return {
            'type': 'http',
            'url': 'http://localhost:8000/mcp',
            'headers': {'Authorization': 'Bearer token'}
        }

    @pytest.mark.asyncio
    async def test_connect_stdio_server_success(self, manager, stdio_config):
        """Test successful stdio server connection"""
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            result = await manager.connect_server('test_server', stdio_config)
            
            assert result is True
            assert 'test_server' in manager.connections
            assert manager.connections['test_server']['status'] == 'connected'

    @pytest.mark.asyncio
    async def test_connect_http_server_success(self, manager, http_config):
        """Test successful HTTP server connection"""
        with patch('services.mcp_manager.streamablehttp_client') as mock_http:
            mock_transport = AsyncMock()
            mock_http.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            result = await manager.connect_server('http_server', http_config)
            
            assert result is True
            assert 'http_server' in manager.connections
            assert manager.connections['http_server']['status'] == 'connected'

    @pytest.mark.asyncio
    async def test_connect_server_failure(self, manager, stdio_config):
        """Test server connection failure handling"""
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_stdio.side_effect = Exception("Connection failed")
            
            result = await manager.connect_server('fail_server', stdio_config)
            
            assert result is False
            assert 'fail_server' not in manager.connections

    @pytest.mark.asyncio
    async def test_disconnect_server(self, manager, stdio_config):
        """Test server disconnection"""
        # First connect
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            await manager.connect_server('test_server', stdio_config)
        
        # Then disconnect
        result = await manager.disconnect_server('test_server')
        
        assert result is True
        assert 'test_server' not in manager.connections

    @pytest.mark.asyncio
    async def test_list_tools_success(self, manager, stdio_config):
        """Test successful tool discovery"""
        mock_tools = [
            {'name': 'test_tool', 'description': 'Test tool', 'inputSchema': {}},
            {'name': 'another_tool', 'description': 'Another tool', 'inputSchema': {}}
        ]
        
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_session = AsyncMock()
            mock_session.list_tools.return_value.tools = mock_tools
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            # Connect first
            await manager.connect_server('test_server', stdio_config)
            manager.connections['test_server']['session'] = mock_session
            
            # List tools
            tools = await manager.list_tools('test_server')
            
            assert len(tools) == 2
            assert tools[0]['name'] == 'test_tool'
            assert 'test_server' in manager.tools_cache

    @pytest.mark.asyncio
    async def test_list_tools_cached(self, manager, stdio_config):
        """Test tool discovery uses cache on subsequent calls"""
        mock_tools = [{'name': 'cached_tool', 'description': 'Cached tool'}]
        
        # Set up cache
        manager.tools_cache['test_server'] = mock_tools
        manager.connections['test_server'] = {'status': 'connected'}
        
        tools = await manager.list_tools('test_server')
        
        assert tools == mock_tools

    @pytest.mark.asyncio
    async def test_execute_tool_success(self, manager, stdio_config):
        """Test successful tool execution"""
        mock_result = {'content': [{'type': 'text', 'text': 'Tool executed successfully'}]}
        
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_session = AsyncMock()
            mock_session.call_tool.return_value = mock_result
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            # Connect and set up session
            await manager.connect_server('test_server', stdio_config)
            manager.connections['test_server']['session'] = mock_session
            
            # Execute tool
            result = await manager.execute_tool('test_server', 'test_tool', {'param': 'value'})
            
            assert result == mock_result
            mock_session.call_tool.assert_called_once_with('test_tool', {'param': 'value'})

    @pytest.mark.asyncio
    async def test_execute_tool_failure(self, manager, stdio_config):
        """Test tool execution failure handling"""
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_session = AsyncMock()
            mock_session.call_tool.side_effect = Exception("Tool execution failed")
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            # Connect and set up session
            await manager.connect_server('test_server', stdio_config)
            manager.connections['test_server']['session'] = mock_session
            
            # Execute tool (should handle error gracefully)
            result = await manager.execute_tool('test_server', 'test_tool', {})
            
            assert result is None

    @pytest.mark.asyncio
    async def test_get_all_tools(self, manager):
        """Test getting tools from all connected servers"""
        # Set up multiple servers with tools
        manager.tools_cache['server1'] = [{'name': 'tool1', 'server_id': 'server1'}]
        manager.tools_cache['server2'] = [{'name': 'tool2', 'server_id': 'server2'}]
        manager.connections['server1'] = {'status': 'connected'}
        manager.connections['server2'] = {'status': 'connected'}
        
        all_tools = await manager.get_all_tools()
        
        assert len(all_tools) == 2
        tool_names = [tool['name'] for tool in all_tools]
        assert 'tool1' in tool_names
        assert 'tool2' in tool_names

    @pytest.mark.asyncio
    async def test_health_check_connected(self, manager, stdio_config):
        """Test health check for connected server"""
        with patch('services.mcp_manager.stdio_client') as mock_stdio:
            mock_session = AsyncMock()
            mock_session.ping = AsyncMock(return_value=True)
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            # Connect and set up session
            await manager.connect_server('test_server', stdio_config)
            manager.connections['test_server']['session'] = mock_session
            
            # Health check
            is_healthy = await manager.health_check('test_server')
            
            assert is_healthy is True

    @pytest.mark.asyncio
    async def test_health_check_disconnected(self, manager):
        """Test health check for disconnected server"""
        is_healthy = await manager.health_check('nonexistent_server')
        assert is_healthy is False

    def test_get_connection_status(self, manager):
        """Test getting connection status"""
        # Set up connection
        manager.connections['test_server'] = {
            'status': 'connected',
            'config': {'type': 'stdio'},
            'last_ping': '2023-01-01T00:00:00Z'
        }
        
        status = manager.get_connection_status('test_server')
        
        assert status['status'] == 'connected'
        assert status['config']['type'] == 'stdio'

    def test_get_connection_status_not_found(self, manager):
        """Test getting status for non-existent connection"""
        status = manager.get_connection_status('nonexistent')
        assert status is None

    @pytest.mark.asyncio
    async def test_multiple_server_management(self, manager, stdio_config, http_config):
        """Test managing multiple servers simultaneously"""
        with patch('services.mcp_manager.stdio_client') as mock_stdio, \
             patch('services.mcp_manager.streamablehttp_client') as mock_http:
            
            # Set up mocks
            mock_transport = AsyncMock()
            mock_stdio.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            mock_http.return_value.__aenter__.return_value = (mock_transport, AsyncMock())
            
            # Connect multiple servers
            result1 = await manager.connect_server('stdio_server', stdio_config)
            result2 = await manager.connect_server('http_server', http_config)
            
            assert result1 is True
            assert result2 is True
            assert len(manager.connections) == 2
            assert 'stdio_server' in manager.connections
            assert 'http_server' in manager.connections

    @pytest.mark.asyncio
    async def test_invalid_server_config(self, manager):
        """Test handling of invalid server configuration"""
        invalid_config = {'type': 'invalid_type'}
        
        result = await manager.connect_server('invalid_server', invalid_config)
        
        assert result is False
        assert 'invalid_server' not in manager.connections

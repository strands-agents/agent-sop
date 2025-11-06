"""MCP client manager for handling connections to MCP servers"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from contextlib import AsyncExitStack
from datetime import datetime

try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
    from mcp.client.streamable_http import streamablehttp_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    logging.warning("MCP libraries not available, using mock implementation")


class MCPClientManager:
    """Manages connections to MCP servers and tool execution"""
    
    def __init__(self):
        """Initialize the MCP client manager"""
        self.logger = logging.getLogger('mcp_manager')
        self.connections: Dict[str, Dict[str, Any]] = {}
        self.tools_cache: Dict[str, List[Dict[str, Any]]] = {}
        self.exit_stack = AsyncExitStack()
        
    async def connect_server(self, server_id: str, config: Dict[str, Any]) -> bool:
        """Connect to an MCP server"""
        self.logger.info(f"Connecting to MCP server: {server_id}")
        
        if not MCP_AVAILABLE:
            return await self._mock_connect_server(server_id, config)
        
        server_type = config.get('type')
        if server_type == 'stdio':
            return await self._connect_stdio_server(server_id, config)
        elif server_type == 'http':
            return await self._connect_http_server(server_id, config)
        else:
            raise ValueError(f"Unsupported server type: {server_type}")
    
    async def _connect_stdio_server(self, server_id: str, config: Dict[str, Any]) -> bool:
        """Connect to stdio MCP server"""
        command = config.get('command')
        args = config.get('args', [])
        
        if not command:
            raise ValueError("Command is required for stdio server")
        
        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=config.get('env')
        )
        
        # Create transport
        stdio_transport = await self.exit_stack.enter_async_context(
            stdio_client(server_params)
        )
        stdio, write = stdio_transport
        
        # Create session
        session = await self.exit_stack.enter_async_context(
            ClientSession(stdio, write)
        )
        
        # Initialize session with timeout
        try:
            await asyncio.wait_for(session.initialize(), timeout=10.0)
        except asyncio.TimeoutError:
            raise ValueError(f"MCP server initialization timeout - server may not support MCP protocol")
        except Exception as e:
            # Catch MCP protocol errors and make them more user-friendly
            if "ValidationError" in str(e) or "Invalid JSON" in str(e):
                raise ValueError(f"Server does not speak MCP protocol (got invalid response)")
            raise ValueError(f"MCP initialization failed: {str(e)}")
        
        # Store connection info
        self.connections[server_id] = {
            'session': session,
            'config': config,
            'status': 'connected',
            'type': 'stdio',
            'last_ping': datetime.now().isoformat()
        }
        
        self.logger.info(f"Successfully connected to stdio server: {server_id}")
        return True
    
    async def _connect_http_server(self, server_id: str, config: Dict[str, Any]) -> bool:
        """Connect to HTTP MCP server"""
        try:
            url = config.get('url')
            headers = config.get('headers', {})
            
            if not url:
                raise ValueError("URL is required for HTTP server")
            
            # Create transport
            http_transport = await self.exit_stack.enter_async_context(
                streamablehttp_client(url, headers=headers)
            )
            http, write = http_transport
            
            # Create session
            session = await self.exit_stack.enter_async_context(
                ClientSession(http, write)
            )
            
            # Initialize session
            await session.initialize()
            
            # Store connection info
            self.connections[server_id] = {
                'session': session,
                'config': config,
                'status': 'connected',
                'type': 'http',
                'last_ping': datetime.now().isoformat()
            }
            
            self.logger.info(f"Successfully connected to HTTP server: {server_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to connect HTTP server {server_id}: {e}")
            return False
    
    async def _mock_connect_server(self, server_id: str, config: Dict[str, Any]) -> bool:
        """Mock server connection for testing when MCP not available"""
        self.logger.info(f"Mock connecting to server: {server_id}")
        
        # Create mock session
        from unittest.mock import MagicMock
        mock_session = MagicMock()
        
        # Mock tools based on server type
        if 'file' in server_id.lower():
            mock_tools = [
                {'name': 'read_file', 'description': 'Read file contents'},
                {'name': 'write_file', 'description': 'Write file contents'},
                {'name': 'list_directory', 'description': 'List directory contents'}
            ]
        elif 'web' in server_id.lower():
            mock_tools = [
                {'name': 'fetch_url', 'description': 'Fetch URL content'},
                {'name': 'search_web', 'description': 'Search the web'}
            ]
        elif 'db' in server_id.lower():
            mock_tools = [
                {'name': 'query_db', 'description': 'Query database'},
                {'name': 'insert_record', 'description': 'Insert database record'}
            ]
        else:
            mock_tools = [
                {'name': 'mock_tool', 'description': 'Mock tool for testing'}
            ]
        
        mock_session.list_tools.return_value.tools = mock_tools
        mock_session.call_tool.return_value = {
            'content': [{'type': 'text', 'text': 'Mock tool execution result'}]
        }
        
        self.connections[server_id] = {
            'session': mock_session,
            'config': config,
            'status': 'connected',
            'type': config.get('type', 'mock'),
            'last_ping': datetime.now().isoformat()
        }
        
        return True
    
    async def disconnect_server(self, server_id: str) -> bool:
        """Disconnect from an MCP server"""
        try:
            if server_id not in self.connections:
                self.logger.warning(f"Server {server_id} not found for disconnection")
                return False
            
            # Remove from connections and cache
            del self.connections[server_id]
            if server_id in self.tools_cache:
                del self.tools_cache[server_id]
            
            self.logger.info(f"Disconnected from server: {server_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to disconnect server {server_id}: {e}")
            return False
    
    async def list_tools(self, server_id: str) -> List[Dict[str, Any]]:
        """List available tools from a specific server"""
        try:
            # Check cache first
            if server_id in self.tools_cache:
                return self.tools_cache[server_id]
            
            if server_id not in self.connections:
                self.logger.error(f"Server {server_id} not connected")
                return []
            
            connection = self.connections[server_id]
            session = connection['session']
            
            # Get tools from server
            if MCP_AVAILABLE:
                response = await session.list_tools()
                tools = response.tools if hasattr(response, 'tools') else []
            else:
                # Mock implementation
                tools = session.list_tools.return_value.tools
            
            # Convert to dict format and add server_id
            tool_list = []
            for tool in tools:
                if hasattr(tool, 'name'):
                    # Real MCP tool object
                    tool_dict = {
                        'name': tool.name,
                        'description': getattr(tool, 'description', ''),
                        'inputSchema': getattr(tool, 'inputSchema', {}),
                        'server_id': server_id
                    }
                else:
                    # Already a dict (mock)
                    tool_dict = dict(tool)
                    tool_dict['server_id'] = server_id
                
                tool_list.append(tool_dict)
            
            # Cache the tools
            self.tools_cache[server_id] = tool_list
            
            self.logger.info(f"Listed {len(tool_list)} tools from server {server_id}")
            return tool_list
            
        except Exception as e:
            self.logger.error(f"Failed to list tools from server {server_id}: {e}")
            return []
    
    async def execute_tool(self, server_id: str, tool_name: str, arguments: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Execute a tool on a specific server"""
        try:
            if server_id not in self.connections:
                self.logger.error(f"Server {server_id} not connected")
                return None
            
            connection = self.connections[server_id]
            session = connection['session']
            
            self.logger.info(f"Executing tool {tool_name} on server {server_id}")
            
            # Execute tool
            if MCP_AVAILABLE:
                result = await session.call_tool(tool_name, arguments)
            else:
                # Mock implementation
                result = session.call_tool.return_value
            
            return result
            
        except Exception as e:
            self.logger.error(f"Failed to execute tool {tool_name} on server {server_id}: {e}")
            return None
    
    async def get_all_tools(self) -> List[Dict[str, Any]]:
        """Get all tools from all connected servers"""
        all_tools = []
        
        for server_id in self.connections:
            if self.connections[server_id]['status'] == 'connected':
                tools = await self.list_tools(server_id)
                all_tools.extend(tools)
        
        return all_tools
    
    async def health_check(self, server_id: str) -> bool:
        """Check if a server connection is healthy"""
        try:
            if server_id not in self.connections:
                return False
            
            connection = self.connections[server_id]
            session = connection['session']
            
            # Try to ping the server (if supported)
            if hasattr(session, 'ping'):
                try:
                    await session.ping()
                    connection['last_ping'] = datetime.now().isoformat()
                    return True
                except Exception:
                    connection['status'] = 'disconnected'
                    return False
            else:
                # For servers without ping, assume healthy if connected
                return connection['status'] == 'connected'
                
        except Exception as e:
            self.logger.error(f"Health check failed for server {server_id}: {e}")
            return False
    
    def get_connection_status(self, server_id: str) -> Optional[Dict[str, Any]]:
        """Get connection status for a specific server"""
        return self.connections.get(server_id)
    
    def list_connections(self) -> Dict[str, Dict[str, Any]]:
        """List all server connections"""
        return self.connections.copy()
    
    async def cleanup(self):
        """Clean up all connections and resources"""
        try:
            self.logger.info("Cleaning up MCP client manager")
            
            # Clear connections and cache
            self.connections.clear()
            self.tools_cache.clear()
            
            # Close exit stack (this will close all MCP connections)
            await self.exit_stack.aclose()
            
        except Exception as e:
            self.logger.error(f"Error during cleanup: {e}")
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.cleanup()

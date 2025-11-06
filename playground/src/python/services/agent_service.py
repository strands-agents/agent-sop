"""Agent service for Strands SDK integration"""

import logging
import os
from typing import Optional, Dict, Any, List
from unittest.mock import MagicMock
from .mcp_manager import MCPClientManager
from .script_format_integration import ScriptFormatIntegrator


class AgentService:
    """Service for managing Strands agents and MCP connections"""
    
    def __init__(self):
        """Initialize the agent service"""
        self.logger = logging.getLogger('agent_service')
        self.agents = {}
        self.mcp_manager = MCPClientManager()
        self.script_format_integrator = ScriptFormatIntegrator()
        self.conversation_history = {}
        
    async def load_script_format_rule(self):
        """Load agent script format rule from file"""
        return await self.script_format_integrator.load_format_rule()
    
    async def create_agent_with_format_rule(self, agent_id: str, config: Dict[str, Any]) -> bool:
        """Create a new Strands agent with script format rule"""
        try:
            self.logger.info(f"Creating Strands agent: {agent_id}")
            
            # Load script format rule if not already loaded
            if self.script_format_integrator.get_format_rule() is None:
                await self.script_format_integrator.load_format_rule()
            
            # Collect MCP tools if specified
            tools = []
            if 'mcp_servers' in config:
                for server_id in config['mcp_servers']:
                    try:
                        server_tools = await self.mcp_manager.list_tools(server_id)
                        tools.extend(server_tools)
                    except Exception as e:
                        self.logger.warning(f"Failed to get tools from MCP server {server_id}: {e}")
            
            # Create system prompt with script format rule
            base_prompt = "You are an agent script authoring assistant."
            system_prompt = self.script_format_integrator.create_system_prompt_with_format_rule(base_prompt)
            
            # Mock Strands agent creation for now (will be replaced with real implementation)
            # from strands import Agent
            # agent = Agent(tools=tools, system_prompt=system_prompt, **config)
            
            # For testing, create a mock agent
            mock_agent = self._create_mock_agent()
            
            self.agents[agent_id] = {
                'strands_agent': mock_agent,
                'config': config,
                'status': 'created',
                'system_prompt': system_prompt,
                'tools': tools
            }
            
            # Initialize conversation history
            self.conversation_history[agent_id] = []
            
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to create agent {agent_id}: {e}")
            return False
    
    async def process_message(self, agent_id: str, message: str) -> Optional[str]:
        """Process chat message and return agent response"""
        try:
            if agent_id not in self.agents:
                self.logger.error(f"Agent {agent_id} not found")
                return None
            
            agent_info = self.agents[agent_id]
            strands_agent = agent_info['strands_agent']
            
            # Add user message to conversation history
            self.conversation_history[agent_id].append({
                'role': 'user',
                'content': message
            })
            
            # Process message with Strands agent
            response = strands_agent(message)
            
            # Add agent response to conversation history
            self.conversation_history[agent_id].append({
                'role': 'agent',
                'content': response
            })
            
            return response
            
        except Exception as e:
            self.logger.error(f"Failed to process message for agent {agent_id}: {e}")
            return None
    
    def validate_generated_script(self, script_content: str) -> Dict[str, Any]:
        """Validate generated script content against format standards"""
        return self.script_format_integrator.validate_script_structure(script_content)
    
    def parse_generated_script(self, script_content: str) -> Dict[str, Any]:
        """Parse generated script content into sections"""
        return self.script_format_integrator.parse_script_sections(script_content)
    
    def get_conversation_history(self, agent_id: str) -> List[Dict[str, str]]:
        """Retrieve conversation history for agent"""
        return self.conversation_history.get(agent_id, [])
        
    async def create_agent(self, agent_id: str, config: Dict[str, Any]) -> bool:
        """Create a new Strands agent (legacy method, delegates to create_agent_with_format_rule)"""
        return await self.create_agent_with_format_rule(agent_id, config)
    
    async def connect_mcp_server(self, server_id: str, server_config: Dict[str, Any]) -> bool:
        """Connect to an MCP server"""
        self.logger.info(f"Connecting to MCP server: {server_id}")
        return await self.mcp_manager.connect_server(server_id, server_config)
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific agent"""
        return self.agents.get(agent_id)
    
    def get_mcp_status(self, server_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific MCP server"""
        return self.mcp_manager.get_connection_status(server_id)
    
    def list_agents(self) -> Dict[str, Dict[str, Any]]:
        """List all agents"""
        return self.agents.copy()
    
    def list_mcp_servers(self) -> Dict[str, Dict[str, Any]]:
        """List all MCP servers"""
        return self.mcp_manager.list_connections()
    
    async def get_all_mcp_tools(self) -> List[Dict[str, Any]]:
        """Get all tools from all connected MCP servers"""
        return await self.mcp_manager.get_all_tools()
    
    async def execute_mcp_tool(self, server_id: str, tool_name: str, arguments: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Execute a tool on a specific MCP server"""
        return await self.mcp_manager.execute_tool(server_id, tool_name, arguments)
    
    async def cleanup(self):
        """Clean up resources"""
        await self.mcp_manager.cleanup()
    
    def _create_mock_agent(self):
        """Helper method to create mock agent (for testing)"""
        mock_agent = MagicMock()
        mock_agent.return_value = "Mock agent response"
        return mock_agent

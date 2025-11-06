"""Main entry point for the Python service"""

import asyncio
import json
import logging
import signal
import sys
from typing import Optional

from config.settings import config
from services.agent_service import AgentService


class PythonService:
    """Main Python service for agent operations"""
    
    def __init__(self):
        """Initialize the service"""
        self.running = False
        self.logger = self._setup_logging()
        self._validate_config()
        self.agent_service = AgentService()
        
    def _setup_logging(self) -> logging.Logger:
        """Set up structured logging"""
        logger = logging.getLogger('python_service')
        logger.setLevel(config.get_log_level())
        
        # Create console handler with formatting
        handler = logging.StreamHandler(sys.stderr)  # Use stderr to avoid mixing with IPC
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
        return logger
    
    def _validate_config(self):
        """Validate service configuration"""
        try:
            config.validate()
            self.logger.info("Configuration validated successfully")
        except ValueError as e:
            self.logger.error(f"Configuration validation failed: {e}")
            raise
    
    async def handle_message(self, message: dict) -> dict:
        """Handle incoming IPC message"""
        try:
            message_type = message.get('type')
            message_id = message.get('id')
            
            if message_type == 'chat':
                return await self._handle_chat_message(message)
            elif message_type == 'mcp_config':
                return await self._handle_mcp_config(message)
            elif message_type == 'health':
                return self._handle_health_check(message)
            else:
                return {
                    'id': message_id,
                    'error': f'Unknown message type: {message_type}'
                }
                
        except Exception as e:
            self.logger.error(f"Error handling message: {e}")
            return {
                'id': message.get('id'),
                'error': str(e)
            }
    
    async def _handle_chat_message(self, message: dict) -> dict:
        """Handle chat message"""
        try:
            data = message.get('data', {})
            user_message = data.get('message', '')
            mcp_config = data.get('mcpConfig', [])
            
            # Create agent with MCP config if needed
            agent_id = 'default_agent'
            if not self.agent_service.get_agent_status(agent_id):
                await self.agent_service.create_agent_with_format_rule(agent_id, {})
            
            # Process message
            response = await self.agent_service.process_message(agent_id, user_message)
            
            return {
                'id': message.get('id'),
                'response': response.get('content', ''),
                'script': response.get('script')
            }
            
        except Exception as e:
            self.logger.error(f"Chat message error: {e}")
            return {
                'id': message.get('id'),
                'error': str(e)
            }
    
    async def _handle_mcp_config(self, message: dict) -> dict:
        """Handle MCP configuration"""
        try:
            data = message.get('data', {})
            servers = data.get('servers', [])
            
            results = []
            for server in servers:
                server_id = server.get('id')
                # Combine type with nested config for MCP manager
                mcp_config = {
                    'type': server.get('type'),
                    **server.get('config', {})
                }
                
                try:
                    success = await self.agent_service.connect_mcp_server(server_id, mcp_config)
                    error_message = None
                    self.logger.info(f"MCP connection succeeded for {server_id}")
                except Exception as e:
                    success = False
                    error_message = str(e)
                    self.logger.error(f"MCP connection error for {server_id}: {e}")
                    self.logger.info(f"Error message captured: {error_message}")
                
                # Get actual tools if connection succeeded
                tools = []
                if success:
                    try:
                        tools = await self.agent_service.mcp_manager.list_tools(server_id)
                        # Extract just the tool names for the response
                        tools = [tool.get('name', 'unknown') for tool in tools]
                    except Exception as e:
                        self.logger.error(f"Failed to list tools for {server_id}: {e}")
                        tools = []
                
                result = {
                    'id': server_id,
                    'connected': success,
                    'tools': tools
                }
                
                # Include error message if connection failed
                if not success and error_message:
                    result['error'] = error_message
                
                results.append(result)
            
            return {
                'id': message.get('id'),
                'results': results
            }
            
        except Exception as e:
            self.logger.error(f"MCP config error: {e}")
            return {
                'id': message.get('id'),
                'error': str(e)
            }
    
    def _handle_health_check(self, message: dict) -> dict:
        """Handle health check"""
        return {
            'id': message.get('id'),
            'status': 'healthy' if self.running else 'stopped',
            'port': config.port,
            'host': config.host,
            'log_level': config.log_level
        }
    
    async def start(self):
        """Start the service"""
        if self.running:
            self.logger.warning("Service is already running")
            return
        
        self.logger.info(f"Starting Python service on {config.host}:{config.port}")
        self.running = True
        
        # Set up signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        try:
            # Main IPC loop - read from stdin, write to stdout
            while self.running:
                try:
                    # Read line from stdin
                    line = await asyncio.get_event_loop().run_in_executor(
                        None, sys.stdin.readline
                    )
                    
                    if not line:  # EOF
                        break
                        
                    line = line.strip()
                    if not line:
                        continue
                    
                    # Parse JSON message
                    try:
                        message = json.loads(line)
                        response = await self.handle_message(message)
                        
                        # Send response to stdout
                        print(json.dumps(response), flush=True)
                        
                    except json.JSONDecodeError as e:
                        self.logger.error(f"Invalid JSON: {e}")
                        error_response = {
                            'error': f'Invalid JSON: {e}'
                        }
                        print(json.dumps(error_response), flush=True)
                        
                except Exception as e:
                    self.logger.error(f"IPC loop error: {e}")
                    
        except Exception as e:
            self.logger.error(f"Service error: {e}")
            raise
        finally:
            await self.stop()
    
    async def stop(self):
        """Stop the service gracefully"""
        if not self.running:
            return
        
        self.logger.info("Stopping Python service")
        self.running = False
    
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        self.logger.info(f"Received signal {signum}, initiating shutdown")
        self.running = False


async def main():
    """Main entry point"""
    service = PythonService()
    
    try:
        print("Service started", flush=True)  # Signal to Node.js that we're ready
        await service.start()
    except KeyboardInterrupt:
        print("\\nShutdown requested by user", file=sys.stderr)
    except Exception as e:
        print(f"Service failed: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())

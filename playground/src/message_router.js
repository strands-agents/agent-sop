const crypto = require('crypto');

/**
 * Handles message routing between WebSocket clients and Python service
 */
class MessageRouter {
  constructor(pythonBridge) {
    this.pythonBridge = pythonBridge;
    this.pendingRequests = new Map();
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Handle incoming WebSocket message and route to appropriate service
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Parsed message object
   */
  async handleMessage(ws, message) {
    try {
      console.log(`Routing message type: ${message.type}`);

      // Check if Python service is available for service-dependent messages
      if (this.requiresPythonService(message.type) && !this.pythonBridge.isRunning()) {
        this.sendError(ws, 'Python service unavailable', message.id);
        return;
      }

      switch (message.type) {
        case 'chat_message':
          await this.handleChatMessage(ws, message);
          break;
        case 'script_execute':
          await this.handleScriptExecution(ws, message);
          break;
        case 'mcp_config':
          await this.handleMCPConfiguration(ws, message);
          break;
        case 'test':
          await this.handleTestMessage(ws, message);
          break;
        default:
          this.sendError(ws, `Unknown message type: ${message.type}`, message.id);
      }
    } catch (error) {
      console.error('Message routing error:', error);
      this.sendError(ws, error.message, message.id);
    }
  }

  /**
   * Check if message type requires Python service
   * @param {string} messageType - Type of message
   * @returns {boolean} - True if Python service is required
   */
  requiresPythonService(messageType) {
    return ['chat_message', 'script_execute', 'mcp_config'].includes(messageType);
  }

  /**
   * Handle chat messages by routing to Python agent service
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object
   */
  async handleChatMessage(ws, message) {
    try {
      const response = await this.pythonBridge.sendMessage({
        type: 'agent_chat',
        data: message.data
      });

      if (response.success) {
        this.sendResponse(ws, 'chat_response', response.data, message.id);
      } else {
        this.sendError(ws, response.error || 'Chat processing failed', message.id);
      }
    } catch (error) {
      console.error('Chat message routing error:', error);
      this.sendError(ws, error.message, message.id);
    }
  }

  /**
   * Handle script execution requests
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object
   */
  async handleScriptExecution(ws, message) {
    try {
      const response = await this.pythonBridge.sendMessage({
        type: 'script_execute',
        data: message.data
      });

      if (response.success) {
        this.sendResponse(ws, 'execution_result', response.data, message.id);
      } else {
        this.sendError(ws, response.error || 'Script execution failed', message.id);
      }
    } catch (error) {
      console.error('Script execution routing error:', error);
      this.sendError(ws, error.message, message.id);
    }
  }

  /**
   * Handle MCP configuration requests
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object
   */
  async handleMCPConfiguration(ws, message) {
    try {
      const response = await this.pythonBridge.sendMessage({
        type: 'mcp_config',
        data: message.data
      });

      if (response.success) {
        this.sendResponse(ws, 'mcp_config_response', response.data, message.id);
      } else {
        this.sendError(ws, response.error || 'MCP configuration failed', message.id);
      }
    } catch (error) {
      console.error('MCP configuration routing error:', error);
      this.sendError(ws, error.message, message.id);
    }
  }

  /**
   * Handle test messages
   * @param {WebSocket} ws - WebSocket connection
   * @param {Object} message - Message object
   */
  async handleTestMessage(ws, message) {
    console.log('Test message received:', message.data);
    this.sendResponse(ws, 'test_response', { 
      echo: message.data,
      timestamp: new Date().toISOString()
    }, message.id);
  }

  /**
   * Send response back to WebSocket client
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} type - Response type
   * @param {Object} data - Response data
   * @param {string} correlationId - Original message ID for correlation
   */
  sendResponse(ws, type, data, correlationId) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      const response = {
        type,
        data,
        timestamp: new Date().toISOString()
      };

      if (correlationId) {
        response.id = correlationId;
      }

      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Send error response back to WebSocket client
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} error - Error message
   * @param {string} correlationId - Original message ID for correlation
   */
  sendError(ws, error, correlationId) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      const response = {
        type: 'error',
        data: { error },
        timestamp: new Date().toISOString()
      };

      if (correlationId) {
        response.id = correlationId;
      }

      ws.send(JSON.stringify(response));
    }
  }

  /**
   * Get routing statistics
   * @returns {Object} - Statistics about message routing
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      pythonServiceRunning: this.pythonBridge.isRunning(),
      pythonServiceHealth: this.pythonBridge.getHealth()
    };
  }
}

module.exports = { MessageRouter };

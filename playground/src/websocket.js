const ws = require('ws');
const { MessageRouter } = require('./message_router');
const { BackendConnectionManager } = require('./backend/ConnectionManager');

/**
 * Creates and configures a WebSocket server alongside an Express app
 * @param {http.Server} httpServer - The HTTP server to attach WebSocket to
 * @param {PythonBridge} pythonBridge - Python service bridge for message routing
 * @returns {Object} - Object containing the configured app and WebSocket server
 */
function createAppWithWebSocket(httpServer, pythonBridge) {
  // Create connection manager and message router
  const connectionManager = new BackendConnectionManager();
  const messageRouter = new MessageRouter(pythonBridge);
  
  // Create WebSocket server that shares the HTTP server
  const wss = new ws.Server({ server: httpServer });

  // Handle new WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected from:', req.socket.remoteAddress);
    
    // Register connection with manager
    const clientId = connectionManager.addConnection(ws);

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data);
        
        // Skip heartbeat messages (handled by connection manager)
        if (message.type === 'heartbeat') {
          return;
        }
        
        // Add client ID to message for routing
        message.clientId = clientId;
        await messageRouter.handleMessage(ws, message);
      } catch (error) {
        console.error('Invalid JSON message received:', error.message);
        // Send error response for invalid JSON
        connectionManager.sendToClient(clientId, {
          type: 'error',
          data: { 
            error: 'Invalid JSON format',
            type: 'protocol',
            recoverable: false,
            suggestion: 'Please refresh the page and try again'
          },
          timestamp: new Date().toISOString()
        });
      }
    });

    // Send initial connection confirmation
    connectionManager.sendToClient(clientId, {
      type: 'connection_established',
      data: { clientId },
      timestamp: new Date().toISOString()
    });
  });

  // Handle WebSocket server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    connectionManager.shutdown();
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    connectionManager.shutdown();
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });

  return { wss, messageRouter, connectionManager };
}

module.exports = { createAppWithWebSocket };

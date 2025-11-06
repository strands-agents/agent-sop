/**
 * Backend connection manager for handling WebSocket connections with health monitoring
 */
class BackendConnectionManager {
  constructor() {
    this.connections = new Map();
    this.heartbeatInterval = 30000; // 30 seconds
    this.heartbeatTimer = null;
    this.startHeartbeatMonitoring();
  }

  /**
   * Register a new WebSocket connection
   * @param {WebSocket} ws - WebSocket connection
   * @param {string} clientId - Unique client identifier
   */
  addConnection(ws, clientId = null) {
    const id = clientId || this.generateClientId();
    const connectionInfo = {
      ws,
      id,
      lastHeartbeat: Date.now(),
      isAlive: true,
      connectedAt: new Date(),
    };

    this.connections.set(id, connectionInfo);
    this.setupConnectionHandlers(connectionInfo);
    
    console.log(`Client ${id} connected. Total connections: ${this.connections.size}`);
    return id;
  }

  /**
   * Remove a WebSocket connection
   * @param {string} clientId - Client identifier
   */
  removeConnection(clientId) {
    const connection = this.connections.get(clientId);
    if (connection) {
      this.connections.delete(clientId);
      console.log(`Client ${clientId} disconnected. Total connections: ${this.connections.size}`);
    }
  }

  /**
   * Get connection information
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Connection information
   */
  getConnection(clientId) {
    return this.connections.get(clientId) || null;
  }

  /**
   * Get all active connections
   * @returns {Array} Array of connection information
   */
  getAllConnections() {
    return Array.from(this.connections.values());
  }

  /**
   * Send message to specific client
   * @param {string} clientId - Client identifier
   * @param {Object} message - Message to send
   * @returns {boolean} Success status
   */
  sendToClient(clientId, message) {
    const connection = this.connections.get(clientId);
    if (connection && connection.ws.readyState === 1) { // WebSocket.OPEN
      try {
        connection.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error(`Failed to send message to client ${clientId}:`, error);
        this.removeConnection(clientId);
        return false;
      }
    }
    return false;
  }

  /**
   * Broadcast message to all connected clients
   * @param {Object} message - Message to broadcast
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let successCount = 0;
    
    for (const [clientId, connection] of this.connections) {
      if (connection.ws.readyState === 1) { // WebSocket.OPEN
        try {
          connection.ws.send(messageStr);
          successCount++;
        } catch (error) {
          console.error(`Failed to broadcast to client ${clientId}:`, error);
          this.removeConnection(clientId);
        }
      }
    }
    
    console.log(`Broadcast sent to ${successCount} clients`);
  }

  /**
   * Setup event handlers for a WebSocket connection
   * @param {Object} connectionInfo - Connection information object
   */
  setupConnectionHandlers(connectionInfo) {
    const { ws, id } = connectionInfo;

    // Handle heartbeat messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'heartbeat') {
          connectionInfo.lastHeartbeat = Date.now();
          connectionInfo.isAlive = true;
          
          // Send heartbeat response
          this.sendToClient(id, {
            type: 'heartbeat_response',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        // Not a heartbeat message, ignore parsing errors here
        // Actual message handling is done elsewhere
      }
    });

    // Handle connection close
    ws.on('close', () => {
      this.removeConnection(id);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${id}:`, error);
      this.removeConnection(id);
    });

    // Set up ping/pong for connection health
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
      connectionInfo.isAlive = true;
      connectionInfo.lastHeartbeat = Date.now();
    });
  }

  /**
   * Start heartbeat monitoring for all connections
   */
  startHeartbeatMonitoring() {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnectionHealth();
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat monitoring
   */
  stopHeartbeatMonitoring() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Check health of all connections and remove stale ones
   */
  checkConnectionHealth() {
    const now = Date.now();
    const staleThreshold = this.heartbeatInterval * 2; // 60 seconds
    
    for (const [clientId, connection] of this.connections) {
      const { ws, lastHeartbeat } = connection;
      
      // Check if connection is stale
      if (now - lastHeartbeat > staleThreshold) {
        console.log(`Removing stale connection: ${clientId}`);
        ws.terminate();
        this.removeConnection(clientId);
        continue;
      }
      
      // Send ping to check if connection is alive
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.isAlive = false;
        ws.ping();
        
        // Check if previous ping was not ponged
        setTimeout(() => {
          if (!ws.isAlive) {
            console.log(`Terminating unresponsive connection: ${clientId}`);
            ws.terminate();
            this.removeConnection(clientId);
          }
        }, 5000); // 5 second timeout for pong response
      }
    }
  }

  /**
   * Generate a unique client identifier
   * @returns {string} Unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   * @returns {Object} Connection statistics
   */
  getStats() {
    const connections = this.getAllConnections();
    const now = Date.now();
    
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.ws.readyState === 1).length,
      averageConnectionTime: connections.length > 0 
        ? connections.reduce((sum, c) => sum + (now - c.connectedAt.getTime()), 0) / connections.length
        : 0,
      oldestConnection: connections.length > 0 
        ? Math.min(...connections.map(c => c.connectedAt.getTime()))
        : null,
    };
  }

  /**
   * Gracefully shutdown all connections
   */
  shutdown() {
    console.log('Shutting down connection manager...');
    this.stopHeartbeatMonitoring();
    
    for (const [clientId, connection] of this.connections) {
      try {
        connection.ws.close(1000, 'Server shutdown');
      } catch (error) {
        console.error(`Error closing connection ${clientId}:`, error);
      }
    }
    
    this.connections.clear();
    console.log('Connection manager shutdown complete');
  }
}

module.exports = { BackendConnectionManager };

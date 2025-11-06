const request = require('supertest');
const express = require('express');
const { PythonBridge } = require('../src/python_bridge');

// Mock PythonBridge
jest.mock('../src/python_bridge');

describe('API Integration', () => {
  let app;
  let mockBridge;

  beforeEach(() => {
    // Create mock bridge
    mockBridge = {
      start: jest.fn().mockResolvedValue(true),
      stop: jest.fn(),
      isRunning: jest.fn().mockReturnValue(true),
      sendMessage: jest.fn(),
      getHealth: jest.fn().mockReturnValue({ status: 'healthy', pid: 12345 })
    };
    
    PythonBridge.mockImplementation(() => mockBridge);

    // Create test app with API routes
    app = express();
    app.use(express.json());
    
    // Import and setup routes (this would be in actual server.js)
    const bridge = new PythonBridge();
    
    app.post('/api/chat', async (req, res) => {
      try {
        if (!bridge.isRunning()) {
          return res.status(503).json({ error: 'Python service unavailable' });
        }
        
        const response = await bridge.sendMessage({
          type: 'agent_chat',
          data: req.body
        });
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    app.get('/api/health', (req, res) => {
      const health = bridge.getHealth();
      res.json(health);
    });
    
    app.post('/api/mcp/config', async (req, res) => {
      try {
        const response = await bridge.sendMessage({
          type: 'mcp_config',
          data: req.body
        });
        
        res.json(response);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  });

  describe('POST /api/chat', () => {
    test('should route chat message to Python service', async () => {
      const chatMessage = { message: 'Hello agent' };
      const expectedResponse = { 
        success: true, 
        data: { response: 'Hello back' } 
      };
      
      mockBridge.sendMessage.mockResolvedValue(expectedResponse);
      
      const response = await request(app)
        .post('/api/chat')
        .send(chatMessage)
        .expect(200);
      
      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: 'agent_chat',
        data: chatMessage
      });
      expect(response.body).toEqual(expectedResponse);
    });

    test('should return 503 when Python service unavailable', async () => {
      mockBridge.isRunning.mockReturnValue(false);
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(503);
      
      expect(response.body.error).toBe('Python service unavailable');
    });

    test('should handle Python service errors', async () => {
      mockBridge.sendMessage.mockRejectedValue(new Error('Service error'));
      
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);
      
      expect(response.body.error).toBe('Service error');
    });
  });

  describe('GET /api/health', () => {
    test('should return service health status', async () => {
      const healthStatus = { 
        status: 'healthy', 
        pid: 12345,
        uptime: 3600
      };
      
      mockBridge.getHealth.mockReturnValue(healthStatus);
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toEqual(healthStatus);
    });

    test('should return failed status when service down', async () => {
      const healthStatus = { 
        status: 'failed', 
        pid: null,
        error: 'Service crashed'
      };
      
      mockBridge.getHealth.mockReturnValue(healthStatus);
      
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body).toEqual(healthStatus);
    });
  });

  describe('POST /api/mcp/config', () => {
    test('should route MCP configuration to Python service', async () => {
      const mcpConfig = { 
        servers: [{ name: 'test', url: 'http://localhost:8000' }] 
      };
      const expectedResponse = { 
        success: true, 
        data: { configured: true } 
      };
      
      mockBridge.sendMessage.mockResolvedValue(expectedResponse);
      
      const response = await request(app)
        .post('/api/mcp/config')
        .send(mcpConfig)
        .expect(200);
      
      expect(mockBridge.sendMessage).toHaveBeenCalledWith({
        type: 'mcp_config',
        data: mcpConfig
      });
      expect(response.body).toEqual(expectedResponse);
    });

    test('should handle MCP configuration errors', async () => {
      mockBridge.sendMessage.mockRejectedValue(new Error('Invalid MCP config'));
      
      const response = await request(app)
        .post('/api/mcp/config')
        .send({ servers: [] })
        .expect(500);
      
      expect(response.body.error).toBe('Invalid MCP config');
    });
  });
});

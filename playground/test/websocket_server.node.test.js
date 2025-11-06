const { createAppWithWebSocket } = require('../src/websocket');
const { PythonBridge } = require('../src/python_bridge');
const { createServer } = require('http');

// Mock PythonBridge
jest.mock('../src/python_bridge');

describe('WebSocket Server Integration', () => {
  let httpServer;
  let wss;
  let messageRouter;
  let mockPythonBridge;

  beforeEach(() => {
    mockPythonBridge = new PythonBridge();
    mockPythonBridge.isRunning = jest.fn().mockReturnValue(true);
    mockPythonBridge.sendMessage = jest.fn();
    mockPythonBridge.getHealth = jest.fn().mockReturnValue({ status: 'healthy' });

    httpServer = createServer();
  });

  afterEach(() => {
    if (wss) {
      wss.close();
    }
    if (httpServer && httpServer.listening) {
      httpServer.close();
    }
  });

  test('should create WebSocket server with message router', () => {
    const result = createAppWithWebSocket(httpServer, mockPythonBridge);
    
    expect(result.wss).toBeDefined();
    expect(result.messageRouter).toBeDefined();
    expect(result.messageRouter.pythonBridge).toBe(mockPythonBridge);
    
    wss = result.wss;
    messageRouter = result.messageRouter;
  });

  test('should return message router with correct configuration', () => {
    const result = createAppWithWebSocket(httpServer, mockPythonBridge);
    messageRouter = result.messageRouter;
    
    const stats = messageRouter.getStats();
    expect(stats.pythonServiceRunning).toBe(true);
    expect(stats.pythonServiceHealth).toEqual({ status: 'healthy' });
    expect(stats.pendingRequests).toBe(0);
  });

  test('should handle WebSocket server creation without errors', () => {
    expect(() => {
      const result = createAppWithWebSocket(httpServer, mockPythonBridge);
      wss = result.wss;
      messageRouter = result.messageRouter;
    }).not.toThrow();
  });
});

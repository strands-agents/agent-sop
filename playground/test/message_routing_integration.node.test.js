const { MessageRouter } = require('../src/message_router');
const { PythonBridge } = require('../src/python_bridge');

// Mock PythonBridge
jest.mock('../src/python_bridge');

describe('Message Routing Integration', () => {
  let messageRouter;
  let mockPythonBridge;
  let mockWebSocket;

  beforeEach(() => {
    mockPythonBridge = new PythonBridge();
    mockPythonBridge.isRunning = jest.fn().mockReturnValue(true);
    mockPythonBridge.sendMessage = jest.fn();
    mockPythonBridge.getHealth = jest.fn().mockReturnValue({ status: 'healthy' });

    mockWebSocket = {
      send: jest.fn(),
      readyState: 1 // WebSocket.OPEN
    };

    messageRouter = new MessageRouter(mockPythonBridge);
  });

  test('should provide routing statistics', () => {
    const stats = messageRouter.getStats();
    
    expect(stats.pythonServiceRunning).toBe(true);
    expect(stats.pythonServiceHealth).toEqual({ status: 'healthy' });
    expect(stats.pendingRequests).toBe(0);
  });

  test('should handle service unavailable gracefully', async () => {
    mockPythonBridge.isRunning.mockReturnValue(false);
    
    const message = {
      type: 'chat_message',
      data: { message: 'Hello' }
    };

    await messageRouter.handleMessage(mockWebSocket, message);

    expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('error');
    expect(sentMessage.data.error).toBe('Python service unavailable');
  });

  test('should handle MCP configuration messages', async () => {
    const message = {
      type: 'mcp_config',
      data: { servers: [] }
    };

    mockPythonBridge.sendMessage.mockResolvedValue({
      success: true,
      data: { configured: true }
    });

    await messageRouter.handleMessage(mockWebSocket, message);

    expect(mockPythonBridge.sendMessage).toHaveBeenCalledWith({
      type: 'mcp_config',
      data: message.data
    });
    
    expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('mcp_config_response');
    expect(sentMessage.data).toEqual({ configured: true });
  });

  test('should handle test messages without Python service', async () => {
    const message = {
      type: 'test',
      data: { message: 'ping' }
    };

    await messageRouter.handleMessage(mockWebSocket, message);

    expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
    const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe('test_response');
    expect(sentMessage.data.echo).toEqual({ message: 'ping' });
    expect(sentMessage.timestamp).toBeDefined();
  });
});

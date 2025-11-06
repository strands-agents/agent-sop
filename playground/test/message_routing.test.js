const { MessageRouter } = require('../src/message_router');
const { PythonBridge } = require('../src/python_bridge');

// Mock PythonBridge
jest.mock('../src/python_bridge');

describe('MessageRouter', () => {
  let messageRouter;
  let mockPythonBridge;
  let mockWebSocket;

  beforeEach(() => {
    mockPythonBridge = new PythonBridge();
    mockPythonBridge.isRunning = jest.fn().mockReturnValue(true);
    mockPythonBridge.sendMessage = jest.fn();
    
    mockWebSocket = {
      send: jest.fn(),
      readyState: 1 // WebSocket.OPEN
    };
    
    messageRouter = new MessageRouter(mockPythonBridge);
  });

  describe('handleMessage', () => {
    test('should route chat messages to Python service', async () => {
      const message = {
        type: 'chat_message',
        data: { message: 'Hello', mcpConfig: [] }
      };

      mockPythonBridge.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Hi there!' }
      });

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockPythonBridge.sendMessage).toHaveBeenCalledWith({
        type: 'agent_chat',
        data: message.data
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('chat_response');
      expect(sentMessage.data).toEqual({ response: 'Hi there!' });
      expect(sentMessage.timestamp).toBeDefined();
    });

    test('should route execution requests to Python service', async () => {
      const message = {
        type: 'script_execute',
        data: { script: 'test script', input: 'test input' }
      };

      mockPythonBridge.sendMessage.mockResolvedValue({
        success: true,
        data: { output: 'execution result' }
      });

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockPythonBridge.sendMessage).toHaveBeenCalledWith({
        type: 'script_execute',
        data: message.data
      });
      
      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('execution_result');
      expect(sentMessage.data).toEqual({ output: 'execution result' });
      expect(sentMessage.timestamp).toBeDefined();
    });

    test('should handle Python service unavailable', async () => {
      mockPythonBridge.isRunning.mockReturnValue(false);
      
      const message = {
        type: 'chat_message',
        data: { message: 'Hello' }
      };

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('error');
      expect(sentMessage.data).toEqual({ error: 'Python service unavailable' });
      expect(sentMessage.timestamp).toBeDefined();
    });

    test('should handle Python service errors', async () => {
      const message = {
        type: 'chat_message',
        data: { message: 'Hello' }
      };

      mockPythonBridge.sendMessage.mockRejectedValue(new Error('Service error'));

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('error');
      expect(sentMessage.data).toEqual({ error: 'Service error' });
      expect(sentMessage.timestamp).toBeDefined();
    });

    test('should handle unknown message types', async () => {
      const message = {
        type: 'unknown_type',
        data: {}
      };

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.type).toBe('error');
      expect(sentMessage.data).toEqual({ error: 'Unknown message type: unknown_type' });
      expect(sentMessage.timestamp).toBeDefined();
    });
  });

  describe('correlation tracking', () => {
    test('should track request-response correlation', async () => {
      const message = {
        id: 'test-123',
        type: 'chat_message',
        data: { message: 'Hello' }
      };

      mockPythonBridge.sendMessage.mockResolvedValue({
        success: true,
        data: { response: 'Hi!' }
      });

      await messageRouter.handleMessage(mockWebSocket, message);

      expect(mockWebSocket.send).toHaveBeenCalledTimes(1);
      const sentMessage = JSON.parse(mockWebSocket.send.mock.calls[0][0]);
      expect(sentMessage.id).toBe('test-123');
      expect(sentMessage.type).toBe('chat_response');
      expect(sentMessage.data).toEqual({ response: 'Hi!' });
      expect(sentMessage.timestamp).toBeDefined();
    });
  });
});

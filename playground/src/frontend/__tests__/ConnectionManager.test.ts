import { ConnectionManager } from '../services/ConnectionManager';

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  simulateError() {
    this.onerror?.(new Event('error'));
  }

  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }));
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let mockOnStateChange: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    mockOnStateChange = jest.fn();
    mockOnError = jest.fn();
    connectionManager = new ConnectionManager('ws://localhost:3001', {
      onStateChange: mockOnStateChange,
      onError: mockOnError,
    });
  });

  afterEach(() => {
    connectionManager.disconnect();
    jest.clearAllMocks();
  });

  describe('Connection Lifecycle', () => {
    test('should start in connecting state', () => {
      expect(connectionManager.getState()).toBe('connecting');
    });

    test('should transition to connected state', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(connectionManager.getState()).toBe('connected');
      expect(mockOnStateChange).toHaveBeenCalledWith('connected');
    });

    test('should handle disconnection', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      connectionManager.disconnect();
      expect(connectionManager.getState()).toBe('disconnected');
    });
  });

  describe('Heartbeat Monitoring', () => {
    test('should send heartbeat messages when connected', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Mock the WebSocket send method
      const mockSend = jest.fn();
      (connectionManager as any).ws = { 
        readyState: 1, // WebSocket.OPEN
        send: mockSend,
        close: jest.fn()
      };
      
      // Manually trigger heartbeat
      (connectionManager as any).sendHeartbeat();
      
      // Check that send was called with a heartbeat message
      expect(mockSend).toHaveBeenCalledTimes(1);
      const sentData = JSON.parse(mockSend.mock.calls[0][0]);
      expect(sentData.type).toBe('heartbeat');
      expect(typeof sentData.timestamp).toBe('number');
    });

    test('should detect stale connections', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate missed heartbeat responses
      (connectionManager as any).lastHeartbeatResponse = Date.now() - 35000; // 35 seconds ago
      (connectionManager as any).checkConnectionHealth();
      
      expect(connectionManager.getState()).toBe('error');
    });
  });

  describe('Error Handling', () => {
    test('should handle WebSocket errors', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const ws = (connectionManager as any).ws as MockWebSocket;
      ws.simulateError();
      
      expect(mockOnError).toHaveBeenCalled();
    });

    test('should classify different error types', () => {
      const networkError = new Error('Network error');
      const serviceError = new Error('Service unavailable');
      
      const networkClassification = (connectionManager as any).classifyError(networkError);
      const serviceClassification = (connectionManager as any).classifyError(serviceError);
      
      expect(networkClassification.type).toBe('network');
      expect(serviceClassification.type).toBe('service');
    });
  });

  describe('Automatic Reconnection', () => {
    test('should attempt reconnection with exponential backoff', async () => {
      const reconnectSpy = jest.spyOn(connectionManager as any, 'scheduleReconnect');
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // Simulate connection loss
      const ws = (connectionManager as any).ws as MockWebSocket;
      ws.close();
      
      expect(reconnectSpy).toHaveBeenCalled();
    });

    test('should respect maximum reconnection attempts', async () => {
      (connectionManager as any).options.maxReconnectAttempts = 2;
      (connectionManager as any).reconnectAttempts = 3; // Exceed max attempts
      
      const shouldReconnect = (connectionManager as any).shouldAttemptReconnect();
      expect(shouldReconnect).toBe(false);
    });
  });

  describe('Message Handling', () => {
    test('should queue messages when disconnected', () => {
      const message = { type: 'test', data: 'test data' };
      connectionManager.sendMessage(message);
      
      const queue = (connectionManager as any).messageQueue;
      expect(queue).toContain(message);
    });

    test('should send queued messages when reconnected', async () => {
      const message = { type: 'test', data: 'test data' };
      connectionManager.sendMessage(message);
      
      await new Promise(resolve => setTimeout(resolve, 20));
      
      const queue = (connectionManager as any).messageQueue;
      expect(queue).toHaveLength(0);
    });
  });
});

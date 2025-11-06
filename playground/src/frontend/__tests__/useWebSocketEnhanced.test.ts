import { renderHook, act } from '@testing-library/preact';
import { useWebSocketEnhanced } from '../hooks/useWebSocketEnhanced';

// Mock ConnectionManager
const mockConnectionManager = {
  getState: jest.fn(() => 'connecting'),
  sendMessage: jest.fn(),
  reconnect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('../services/ConnectionManager', () => ({
  ConnectionManager: jest.fn(() => mockConnectionManager),
}));

describe('useWebSocketEnhanced', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionManager.getState.mockReturnValue('connecting');
  });

  test('should initialize with connecting state', () => {
    const { result } = renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001')
    );

    expect(result.current.connectionState).toBe('connecting');
  });

  test('should pass callbacks to connection manager constructor', () => {
    const { ConnectionManager } = require('../services/ConnectionManager');
    const mockOnMessage = jest.fn();
    const mockOnError = jest.fn();
    const mockOnConnectionChange = jest.fn();
    
    renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001', {
        onMessage: mockOnMessage,
        onError: mockOnError,
        onConnectionChange: mockOnConnectionChange
      })
    );

    // Verify that callbacks are passed to ConnectionManager constructor
    expect(ConnectionManager).toHaveBeenCalledWith('ws://localhost:3001', expect.objectContaining({
      onStateChange: expect.any(Function),
      onError: expect.any(Function),
      onMessage: expect.any(Function),
    }));
  });

  test('should pass options to connection manager', () => {
    const { ConnectionManager } = require('../services/ConnectionManager');
    
    renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001', {
        autoReconnect: false,
        maxReconnectAttempts: 3
      })
    );

    expect(ConnectionManager).toHaveBeenCalledWith('ws://localhost:3001', expect.objectContaining({
      autoReconnect: false,
      maxReconnectAttempts: 3,
      onStateChange: expect.any(Function),
      onError: expect.any(Function),
      onMessage: expect.any(Function),
    }));
  });

  test('should send messages through connection manager', () => {
    const { result } = renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001')
    );

    const message = { type: 'test', data: 'test data' };
    
    act(() => {
      result.current.sendMessage(message);
    });

    expect(mockConnectionManager.sendMessage).toHaveBeenCalledWith(message);
  });

  test('should handle reconnection', () => {
    const { result } = renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001')
    );

    act(() => {
      result.current.reconnect();
    });

    expect(mockConnectionManager.reconnect).toHaveBeenCalled();
  });

  test('should cleanup on unmount', () => {
    const { unmount } = renderHook(() => 
      useWebSocketEnhanced('ws://localhost:3001')
    );

    unmount();

    expect(mockConnectionManager.disconnect).toHaveBeenCalled();
  });
});

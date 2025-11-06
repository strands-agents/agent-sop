import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import { ConnectionManager, ConnectionManagerOptions, ErrorInfo } from '../services/ConnectionManager';
import { ConnectionState, WebSocketMessage } from '../types';

export interface UseWebSocketEnhancedOptions extends Omit<ConnectionManagerOptions, 'onStateChange' | 'onError' | 'onMessage'> {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: ErrorInfo) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export interface UseWebSocketEnhancedReturn {
  connectionState: ConnectionState;
  sendMessage: (message: WebSocketMessage) => void;
  reconnect: () => void;
  disconnect: () => void;
  lastError: ErrorInfo | null;
  isConnected: boolean;
  canReconnect: boolean;
}

export function useWebSocketEnhanced(
  url: string, 
  options: UseWebSocketEnhancedOptions = {}
): UseWebSocketEnhancedReturn {
  const {
    onMessage,
    onError,
    onConnectionChange,
    ...connectionOptions
  } = options;

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [lastError, setLastError] = useState<ErrorInfo | null>(null);
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  const handleStateChange = useCallback((state: ConnectionState) => {
    setConnectionState(state);
    onConnectionChange?.(state);
    
    // Clear error when successfully connected
    if (state === 'connected') {
      setLastError(null);
    }
  }, [onConnectionChange]);

  const handleError = useCallback((error: ErrorInfo) => {
    setLastError(error);
    onError?.(error);
  }, [onError]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    onMessage?.(message);
  }, [onMessage]);

  // Initialize connection manager
  useEffect(() => {
    connectionManagerRef.current = new ConnectionManager(url, {
      ...connectionOptions,
      onStateChange: handleStateChange,
      onError: handleError,
      onMessage: handleMessage,
    });

    return () => {
      connectionManagerRef.current?.disconnect();
      connectionManagerRef.current = null;
    };
  }, [url]); // Remove callback dependencies to prevent infinite recreation

  const sendMessage = useCallback((message: WebSocketMessage) => {
    connectionManagerRef.current?.sendMessage(message);
  }, []);

  const reconnect = useCallback(() => {
    connectionManagerRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    connectionManagerRef.current?.disconnect();
  }, []);

  const isConnected = connectionState === 'connected';
  const canReconnect = connectionState === 'disconnected' || connectionState === 'error';

  return {
    connectionState,
    sendMessage,
    reconnect,
    disconnect,
    lastError,
    isConnected,
    canReconnect,
  };
}

import { useEffect, useRef, useReducer, useCallback } from 'preact/hooks';
import { ConnectionState, WebSocketMessage, WebSocketOptions, WebSocketHook } from '../types';

interface WebSocketState {
  connectionState: ConnectionState;
  messageQueue: WebSocketMessage[];
  reconnectAttempts: number;
}

type WebSocketAction = 
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR' }
  | { type: 'QUEUE_MESSAGE'; message: WebSocketMessage }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'INCREMENT_RECONNECT_ATTEMPTS' }
  | { type: 'RESET_RECONNECT_ATTEMPTS' };

const initialState: WebSocketState = {
  connectionState: 'connecting',
  messageQueue: [],
  reconnectAttempts: 0,
};

function webSocketReducer(state: WebSocketState, action: WebSocketAction): WebSocketState {
  switch (action.type) {
    case 'CONNECTING':
      return { ...state, connectionState: 'connecting' };
    case 'CONNECTED':
      return { ...state, connectionState: 'connected' };
    case 'DISCONNECTED':
      return { ...state, connectionState: 'disconnected' };
    case 'ERROR':
      return { ...state, connectionState: 'error' };
    case 'QUEUE_MESSAGE':
      return { ...state, messageQueue: [...state.messageQueue, action.message] };
    case 'CLEAR_QUEUE':
      return { ...state, messageQueue: [] };
    case 'INCREMENT_RECONNECT_ATTEMPTS':
      return { ...state, reconnectAttempts: state.reconnectAttempts + 1 };
    case 'RESET_RECONNECT_ATTEMPTS':
      return { ...state, reconnectAttempts: 0 };
    default:
      return state;
  }
}

export function useWebSocket(url: string, options: WebSocketOptions = {}): WebSocketHook {
  const {
    autoReconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnectionChange,
  } = options;

  const [state, dispatch] = useReducer(webSocketReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManualDisconnect = useRef(false);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    dispatch({ type: 'CONNECTING' });
    
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Store for testing only if in test environment
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        if (typeof global !== 'undefined') {
          (global as any).lastWebSocketInstance = ws;
        }
      }

      ws.onopen = () => {
        dispatch({ type: 'CONNECTED' });
        dispatch({ type: 'RESET_RECONNECT_ATTEMPTS' });
        reconnectAttemptsRef.current = 0;
        
        // Send queued messages after connection is established
        setTimeout(() => {
          messageQueueRef.current.forEach(message => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(message));
            }
          });
          messageQueueRef.current = [];
          dispatch({ type: 'CLEAR_QUEUE' });
        }, 0);
      };

      ws.onclose = () => {
        dispatch({ type: 'DISCONNECTED' });
        
        if (!isManualDisconnect.current && autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            dispatch({ type: 'INCREMENT_RECONNECT_ATTEMPTS' });
            connect();
          }, delay);
        }
      };

      ws.onerror = () => {
        dispatch({ type: 'ERROR' });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      dispatch({ type: 'ERROR' });
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts, onMessage]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      messageQueueRef.current.push(message);
      dispatch({ type: 'QUEUE_MESSAGE', message });
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    dispatch({ type: 'RESET_RECONNECT_ATTEMPTS' });
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Initial connection
  useEffect(() => {
    connect();
    
    return () => {
      isManualDisconnect.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      // Clean up test references
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
        if (typeof global !== 'undefined') {
          (global as any).lastWebSocketInstance = null;
        }
      }
    };
  }, []);

  // Notify connection state changes
  useEffect(() => {
    onConnectionChange?.(state.connectionState);
  }, [state.connectionState, onConnectionChange]);

  return {
    connectionState: state.connectionState,
    sendMessage,
    reconnect,
    disconnect,
    ws: wsRef.current,
  };
}

import { ConnectionState, WebSocketMessage } from '../types';

export interface ConnectionManagerOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: ErrorInfo) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export interface ErrorInfo {
  type: 'network' | 'service' | 'protocol' | 'timeout';
  message: string;
  recoverable: boolean;
  suggestion?: string;
}

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'connecting';
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private lastHeartbeatResponse = 0;
  private isManualDisconnect = false;
  private eventListeners: Map<string, Function[]> = new Map();

  private readonly options: Required<ConnectionManagerOptions>;

  constructor(private url: string, options: ConnectionManagerOptions = {}) {
    this.options = {
      autoReconnect: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000, // 30 seconds
      heartbeatTimeout: 10000,  // 10 seconds
      onStateChange: () => {},
      onError: () => {},
      onMessage: () => {},
      ...options,
    };

    this.connect();
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public sendMessage(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  public reconnect(): void {
    this.clearReconnectTimeout();
    this.reconnectAttempts = 0;
    this.isManualDisconnect = false;
    this.connect();
  }

  public disconnect(): void {
    this.isManualDisconnect = true;
    this.clearTimeouts();
    this.setState('disconnected');
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setState('connecting');

    try {
      this.ws = new WebSocket(this.url);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      
      if (!this.isManualDisconnect) {
        this.setState('disconnected');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      const error = new Error('WebSocket connection error');
      this.handleError(error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        
        if (message.type === 'heartbeat_response') {
          this.lastHeartbeatResponse = Date.now();
          return;
        }
        
        this.options.onMessage(message);
        this.emit('message', message);
      } catch (error) {
        this.handleError(new Error('Invalid message format'));
      }
    };
  }

  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange(newState);
      this.emit('stateChange', newState);
    }
  }

  private handleError(error: Error): void {
    const errorInfo = this.classifyError(error);
    this.setState('error');
    this.options.onError(errorInfo);
    this.emit('error', errorInfo);
  }

  private classifyError(error: Error): ErrorInfo {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('connection')) {
      return {
        type: 'network',
        message: 'Network connection failed',
        recoverable: true,
        suggestion: 'Check your internet connection and try again',
      };
    }
    
    if (message.includes('service') || message.includes('unavailable')) {
      return {
        type: 'service',
        message: 'Service temporarily unavailable',
        recoverable: true,
        suggestion: 'The service may be restarting. Please wait a moment and try again',
      };
    }
    
    if (message.includes('timeout')) {
      return {
        type: 'timeout',
        message: 'Connection timeout',
        recoverable: true,
        suggestion: 'The connection is taking too long. Try reconnecting',
      };
    }
    
    return {
      type: 'protocol',
      message: error.message,
      recoverable: false,
      suggestion: 'Please refresh the page and try again',
    };
  }

  private scheduleReconnect(): void {
    if (!this.shouldAttemptReconnect()) {
      return;
    }

    const delay = this.calculateReconnectDelay();
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private shouldAttemptReconnect(): boolean {
    return this.options.autoReconnect && 
           this.reconnectAttempts < this.options.maxReconnectAttempts &&
           !this.isManualDisconnect;
  }

  private calculateReconnectDelay(): number {
    return this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts);
  }

  private startHeartbeat(): void {
    this.lastHeartbeatResponse = Date.now();
    
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
      this.scheduleHeartbeatTimeout();
    }, this.options.heartbeatInterval);
  }

  private sendHeartbeat(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
    }
  }

  private scheduleHeartbeatTimeout(): void {
    this.heartbeatTimeout = setTimeout(() => {
      this.checkConnectionHealth();
    }, this.options.heartbeatTimeout);
  }

  private checkConnectionHealth(): void {
    const timeSinceLastResponse = Date.now() - this.lastHeartbeatResponse;
    
    if (timeSinceLastResponse > this.options.heartbeatTimeout + 5000) {
      this.handleError(new Error('Connection timeout - no heartbeat response'));
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private clearTimeouts(): void {
    this.clearReconnectTimeout();
    this.stopHeartbeat();
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

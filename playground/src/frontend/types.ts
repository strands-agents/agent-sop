import { ComponentType } from 'preact';

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export interface SplitLayoutProps {
  leftPanel: ComponentType;
  rightPanel: ComponentType;
  initialLeftWidth?: number;
  minPanelWidth?: number;
}

export interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export interface ScriptPreviewProps {
  content: string;
  onExport?: () => void;
  onTestScript?: () => void;
}

export interface TestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scriptContent: string;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  type: 'stdio' | 'http';
  config: {
    command?: string;
    args?: string[];
    url?: string;
    headers?: Record<string, string>;
  };
  connected: boolean;
  tools?: Tool[];
  error?: string;
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface MCPConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  servers: MCPServerConfig[];
  onAddServer: (server: Omit<MCPServerConfig, 'id' | 'connected'>) => void;
  onRemoveServer: (id: string) => void;
  onTestConnection: (id: string) => Promise<void>;
}

// WebSocket Types
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface WebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

export interface WebSocketHook {
  connectionState: ConnectionState;
  sendMessage: (message: WebSocketMessage) => void;
  reconnect: () => void;
  disconnect: () => void;
  // Expose WebSocket instance for testing
  ws?: WebSocket | null;
}

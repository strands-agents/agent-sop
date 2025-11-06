/**
 * Core message type definitions for Agent Script Playground
 */

// Base message interface
export interface BaseMessage {
  type: string;
  id?: string;
  timestamp: string;
}

// Chat message types
export interface ChatMessageData {
  content: string;
  role: 'user' | 'agent';
  scriptContent?: string;
}

export interface ChatMessage extends BaseMessage {
  type: 'chat_message' | 'chat_response';
  data: ChatMessageData;
}

// Execution message types
export interface ExecutionMessageData {
  script?: string;
  input?: string;
  interactive?: boolean;
  output?: string;
  status?: 'running' | 'complete' | 'error';
  prompt?: string;
}

export interface ExecutionMessage extends BaseMessage {
  type: 'script_execute' | 'execution_result' | 'execution_prompt';
  data: ExecutionMessageData;
}

// MCP Server configuration
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

// Configuration message types
export interface ConfigMessageData {
  action: 'add' | 'remove' | 'test' | 'list';
  server?: MCPServerConfig;
  servers?: MCPServerConfig[];
  result?: boolean;
  error?: string;
}

export interface ConfigMessage extends BaseMessage {
  type: 'mcp_config' | 'mcp_config_response';
  data: ConfigMessageData;
}

// Error message type
export interface ErrorMessageData {
  error: string;
  details?: any;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  data: ErrorMessageData;
}

// Union type for all messages
export type Message = ChatMessage | ExecutionMessage | ConfigMessage | ErrorMessage;

// Message type constants
export const MESSAGE_TYPES = {
  CHAT_MESSAGE: 'chat_message',
  CHAT_RESPONSE: 'chat_response',
  SCRIPT_EXECUTE: 'script_execute',
  EXECUTION_RESULT: 'execution_result',
  EXECUTION_PROMPT: 'execution_prompt',
  MCP_CONFIG: 'mcp_config',
  MCP_CONFIG_RESPONSE: 'mcp_config_response',
  ERROR: 'error'
} as const;

export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

/**
 * Message factory functions for creating type-safe messages
 */
import { v4 as uuidv4 } from 'uuid';
import { 
  ChatMessage, 
  ExecutionMessage, 
  ConfigMessage, 
  ErrorMessage,
  MESSAGE_TYPES,
  MCPServerConfig,
  ExecutionMessageData,
  ConfigMessageData
} from '../types/messages';

/**
 * Create a chat message
 * @param role - Message role (user or agent)
 * @param content - Message content
 * @param scriptContent - Optional script content for agent responses
 * @param id - Optional message ID
 * @returns ChatMessage
 */
export function createChatMessage(
  role: 'user' | 'agent', 
  content: string, 
  scriptContent?: string,
  id?: string
): ChatMessage {
  return {
    type: role === 'user' ? MESSAGE_TYPES.CHAT_MESSAGE : MESSAGE_TYPES.CHAT_RESPONSE,
    id: id || uuidv4(),
    timestamp: new Date().toISOString(),
    data: {
      content,
      role,
      ...(scriptContent && { scriptContent })
    }
  };
}

/**
 * Create an execution message
 * @param type - Execution message type
 * @param data - Execution data
 * @param id - Optional message ID
 * @returns ExecutionMessage
 */
export function createExecutionMessage(
  type: 'script_execute' | 'execution_result' | 'execution_prompt',
  data: ExecutionMessageData,
  id?: string
): ExecutionMessage {
  return {
    type,
    id: id || uuidv4(),
    timestamp: new Date().toISOString(),
    data
  };
}

/**
 * Create a configuration message
 * @param action - Configuration action
 * @param data - Additional configuration data
 * @param id - Optional message ID
 * @returns ConfigMessage
 */
export function createConfigMessage(
  action: 'add' | 'remove' | 'test' | 'list',
  data: Partial<ConfigMessageData> = {},
  id?: string
): ConfigMessage {
  return {
    type: MESSAGE_TYPES.MCP_CONFIG,
    id: id || uuidv4(),
    timestamp: new Date().toISOString(),
    data: {
      action,
      ...data
    }
  };
}

/**
 * Create a configuration response message
 * @param data - Configuration response data
 * @param id - Optional message ID (usually correlation ID)
 * @returns ConfigMessage
 */
export function createConfigResponse(
  data: ConfigMessageData,
  id?: string
): ConfigMessage {
  return {
    type: MESSAGE_TYPES.MCP_CONFIG_RESPONSE,
    id: id || uuidv4(),
    timestamp: new Date().toISOString(),
    data
  };
}

/**
 * Create an error message
 * @param error - Error message
 * @param correlationId - Optional correlation ID from original message
 * @param details - Optional error details
 * @returns ErrorMessage
 */
export function createErrorMessage(
  error: string, 
  correlationId?: string,
  details?: any
): ErrorMessage {
  return {
    type: MESSAGE_TYPES.ERROR,
    id: correlationId || uuidv4(),
    timestamp: new Date().toISOString(),
    data: {
      error,
      ...(details && { details })
    }
  };
}

/**
 * Create a script execution request
 * @param script - Agent script content
 * @param input - User input for the script
 * @param interactive - Whether to run in interactive mode
 * @param id - Optional message ID
 * @returns ExecutionMessage
 */
export function createScriptExecuteMessage(
  script: string,
  input: string,
  interactive: boolean = false,
  id?: string
): ExecutionMessage {
  return createExecutionMessage(MESSAGE_TYPES.SCRIPT_EXECUTE, {
    script,
    input,
    interactive
  }, id);
}

/**
 * Create an execution result message
 * @param output - Execution output
 * @param status - Execution status
 * @param correlationId - Correlation ID from original request
 * @returns ExecutionMessage
 */
export function createExecutionResult(
  output: string,
  status: 'running' | 'complete' | 'error',
  correlationId?: string
): ExecutionMessage {
  return createExecutionMessage(MESSAGE_TYPES.EXECUTION_RESULT, {
    output,
    status
  }, correlationId);
}

/**
 * Create an execution prompt message for interactive scripts
 * @param prompt - Prompt text for user
 * @param correlationId - Correlation ID from original request
 * @returns ExecutionMessage
 */
export function createExecutionPrompt(
  prompt: string,
  correlationId?: string
): ExecutionMessage {
  return createExecutionMessage(MESSAGE_TYPES.EXECUTION_PROMPT, {
    prompt
  }, correlationId);
}

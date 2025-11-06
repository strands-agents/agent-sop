/**
 * Type guard functions for runtime type checking
 */
import { 
  Message, 
  ChatMessage, 
  ExecutionMessage, 
  ConfigMessage, 
  ErrorMessage,
  MESSAGE_TYPES 
} from '../types/messages';

/**
 * Check if a message is a chat message
 * @param message - Message to check
 * @returns True if message is a ChatMessage
 */
export function isChatMessage(message: Message): message is ChatMessage {
  return message.type === MESSAGE_TYPES.CHAT_MESSAGE || 
         message.type === MESSAGE_TYPES.CHAT_RESPONSE;
}

/**
 * Check if a message is an execution message
 * @param message - Message to check
 * @returns True if message is an ExecutionMessage
 */
export function isExecutionMessage(message: Message): message is ExecutionMessage {
  return message.type === MESSAGE_TYPES.SCRIPT_EXECUTE ||
         message.type === MESSAGE_TYPES.EXECUTION_RESULT ||
         message.type === MESSAGE_TYPES.EXECUTION_PROMPT;
}

/**
 * Check if a message is a configuration message
 * @param message - Message to check
 * @returns True if message is a ConfigMessage
 */
export function isConfigMessage(message: Message): message is ConfigMessage {
  return message.type === MESSAGE_TYPES.MCP_CONFIG ||
         message.type === MESSAGE_TYPES.MCP_CONFIG_RESPONSE;
}

/**
 * Check if a message is an error message
 * @param message - Message to check
 * @returns True if message is an ErrorMessage
 */
export function isErrorMessage(message: Message): message is ErrorMessage {
  return message.type === MESSAGE_TYPES.ERROR;
}

/**
 * Check if a message is a user chat message
 * @param message - Message to check
 * @returns True if message is a user chat message
 */
export function isUserMessage(message: Message): message is ChatMessage {
  return isChatMessage(message) && 
         message.type === MESSAGE_TYPES.CHAT_MESSAGE &&
         message.data.role === 'user';
}

/**
 * Check if a message is an agent response
 * @param message - Message to check
 * @returns True if message is an agent response
 */
export function isAgentResponse(message: Message): message is ChatMessage {
  return isChatMessage(message) && 
         message.type === MESSAGE_TYPES.CHAT_RESPONSE &&
         message.data.role === 'agent';
}

/**
 * Check if a message is a script execution request
 * @param message - Message to check
 * @returns True if message is a script execution request
 */
export function isScriptExecuteMessage(message: Message): message is ExecutionMessage {
  return message.type === MESSAGE_TYPES.SCRIPT_EXECUTE;
}

/**
 * Check if a message is an execution result
 * @param message - Message to check
 * @returns True if message is an execution result
 */
export function isExecutionResult(message: Message): message is ExecutionMessage {
  return message.type === MESSAGE_TYPES.EXECUTION_RESULT;
}

/**
 * Check if a message is an execution prompt (interactive)
 * @param message - Message to check
 * @returns True if message is an execution prompt
 */
export function isExecutionPrompt(message: Message): message is ExecutionMessage {
  return message.type === MESSAGE_TYPES.EXECUTION_PROMPT;
}

/**
 * Check if a message has a correlation ID
 * @param message - Message to check
 * @returns True if message has an ID
 */
export function hasCorrelationId(message: Message): message is Message & { id: string } {
  return typeof message.id === 'string' && message.id.length > 0;
}

/**
 * Type guard to narrow message type based on type string
 * @param message - Message to check
 * @param type - Expected message type
 * @returns True if message matches the specified type
 */
export function isMessageOfType<T extends Message['type']>(
  message: Message, 
  type: T
): message is Extract<Message, { type: T }> {
  return message.type === type;
}

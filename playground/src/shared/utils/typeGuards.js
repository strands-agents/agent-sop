/**
 * Type guard functions for runtime type checking
 */
const { MESSAGE_TYPES } = require('./messageFactory');

/**
 * Check if a message is a chat message
 */
function isChatMessage(message) {
  return message.type === MESSAGE_TYPES.CHAT_MESSAGE || 
         message.type === MESSAGE_TYPES.CHAT_RESPONSE;
}

/**
 * Check if a message is an execution message
 */
function isExecutionMessage(message) {
  return message.type === MESSAGE_TYPES.SCRIPT_EXECUTE ||
         message.type === MESSAGE_TYPES.EXECUTION_RESULT ||
         message.type === MESSAGE_TYPES.EXECUTION_PROMPT;
}

/**
 * Check if a message is a configuration message
 */
function isConfigMessage(message) {
  return message.type === MESSAGE_TYPES.MCP_CONFIG ||
         message.type === MESSAGE_TYPES.MCP_CONFIG_RESPONSE;
}

/**
 * Check if a message is an error message
 */
function isErrorMessage(message) {
  return message.type === MESSAGE_TYPES.ERROR;
}

/**
 * Check if a message is a user chat message
 */
function isUserMessage(message) {
  return isChatMessage(message) && 
         message.type === MESSAGE_TYPES.CHAT_MESSAGE &&
         message.data.role === 'user';
}

/**
 * Check if a message is an agent response
 */
function isAgentResponse(message) {
  return isChatMessage(message) && 
         message.type === MESSAGE_TYPES.CHAT_RESPONSE &&
         message.data.role === 'agent';
}

/**
 * Check if a message is a script execution request
 */
function isScriptExecuteMessage(message) {
  return message.type === MESSAGE_TYPES.SCRIPT_EXECUTE;
}

/**
 * Check if a message is an execution result
 */
function isExecutionResult(message) {
  return message.type === MESSAGE_TYPES.EXECUTION_RESULT;
}

/**
 * Check if a message is an execution prompt (interactive)
 */
function isExecutionPrompt(message) {
  return message.type === MESSAGE_TYPES.EXECUTION_PROMPT;
}

/**
 * Check if a message has a correlation ID
 */
function hasCorrelationId(message) {
  return typeof message.id === 'string' && message.id.length > 0;
}

/**
 * Type guard to narrow message type based on type string
 */
function isMessageOfType(message, type) {
  return message.type === type;
}

module.exports = {
  isChatMessage,
  isExecutionMessage,
  isConfigMessage,
  isErrorMessage,
  isUserMessage,
  isAgentResponse,
  isScriptExecuteMessage,
  isExecutionResult,
  isExecutionPrompt,
  hasCorrelationId,
  isMessageOfType
};

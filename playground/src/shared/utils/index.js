/**
 * Shared utilities for message handling
 */

// Import JavaScript modules
const { validateMessage } = require('./validation');
const { 
  createChatMessage, 
  createExecutionMessage, 
  createConfigMessage,
  createErrorMessage,
  createScriptExecuteMessage,
  createExecutionResult,
  createExecutionPrompt,
  createConfigResponse
} = require('./messageFactory');
const {
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
} = require('./typeGuards');
const {
  serializeMessage,
  deserializeMessage,
  safeSerializeMessage,
  safeDeserializeMessage,
  serializeMessages,
  deserializeMessages,
  cloneMessage,
  isValidMessageJson
} = require('./serialization');

// Re-export all utilities
module.exports = {
  // Validation
  validateMessage,
  
  // Factory functions
  createChatMessage,
  createExecutionMessage,
  createConfigMessage,
  createErrorMessage,
  createScriptExecuteMessage,
  createExecutionResult,
  createExecutionPrompt,
  createConfigResponse,
  
  // Type guards
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
  isMessageOfType,
  
  // Serialization
  serializeMessage,
  deserializeMessage,
  safeSerializeMessage,
  safeDeserializeMessage,
  serializeMessages,
  deserializeMessages,
  cloneMessage,
  isValidMessageJson
};

/**
 * Message factory functions for creating type-safe messages
 */

// Simple UUID v4 generator for compatibility
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Message type constants
const MESSAGE_TYPES = {
  CHAT_MESSAGE: 'chat_message',
  CHAT_RESPONSE: 'chat_response',
  SCRIPT_EXECUTE: 'script_execute',
  EXECUTION_RESULT: 'execution_result',
  EXECUTION_PROMPT: 'execution_prompt',
  MCP_CONFIG: 'mcp_config',
  MCP_CONFIG_RESPONSE: 'mcp_config_response',
  ERROR: 'error'
};

/**
 * Create a chat message
 */
function createChatMessage(role, content, scriptContent, id) {
  return {
    type: role === 'user' ? MESSAGE_TYPES.CHAT_MESSAGE : MESSAGE_TYPES.CHAT_RESPONSE,
    id: id || generateId(),
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
 */
function createExecutionMessage(type, data, id) {
  return {
    type,
    id: id || generateId(),
    timestamp: new Date().toISOString(),
    data
  };
}

/**
 * Create a configuration message
 */
function createConfigMessage(action, data = {}, id) {
  return {
    type: MESSAGE_TYPES.MCP_CONFIG,
    id: id || generateId(),
    timestamp: new Date().toISOString(),
    data: {
      action,
      ...data
    }
  };
}

/**
 * Create a configuration response message
 */
function createConfigResponse(data, id) {
  return {
    type: MESSAGE_TYPES.MCP_CONFIG_RESPONSE,
    id: id || generateId(),
    timestamp: new Date().toISOString(),
    data
  };
}

/**
 * Create an error message
 */
function createErrorMessage(error, correlationId, details) {
  return {
    type: MESSAGE_TYPES.ERROR,
    id: correlationId || generateId(),
    timestamp: new Date().toISOString(),
    data: {
      error,
      ...(details && { details })
    }
  };
}

/**
 * Create a script execution request
 */
function createScriptExecuteMessage(script, input, interactive = false, id) {
  return createExecutionMessage(MESSAGE_TYPES.SCRIPT_EXECUTE, {
    script,
    input,
    interactive
  }, id);
}

/**
 * Create an execution result message
 */
function createExecutionResult(output, status, correlationId) {
  return createExecutionMessage(MESSAGE_TYPES.EXECUTION_RESULT, {
    output,
    status
  }, correlationId);
}

/**
 * Create an execution prompt message for interactive scripts
 */
function createExecutionPrompt(prompt, correlationId) {
  return createExecutionMessage(MESSAGE_TYPES.EXECUTION_PROMPT, {
    prompt
  }, correlationId);
}

module.exports = {
  MESSAGE_TYPES,
  createChatMessage,
  createExecutionMessage,
  createConfigMessage,
  createConfigResponse,
  createErrorMessage,
  createScriptExecuteMessage,
  createExecutionResult,
  createExecutionPrompt
};

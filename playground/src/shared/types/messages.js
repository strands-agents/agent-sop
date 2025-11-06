"use strict";
/**
 * Core message type definitions for Agent Script Playground
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MESSAGE_TYPES = void 0;
// Message type constants
exports.MESSAGE_TYPES = {
    CHAT_MESSAGE: 'chat_message',
    CHAT_RESPONSE: 'chat_response',
    SCRIPT_EXECUTE: 'script_execute',
    EXECUTION_RESULT: 'execution_result',
    EXECUTION_PROMPT: 'execution_prompt',
    MCP_CONFIG: 'mcp_config',
    MCP_CONFIG_RESPONSE: 'mcp_config_response',
    ERROR: 'error'
};

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServerConfigSchema = exports.MessageSchema = exports.ErrorMessageSchema = exports.ConfigMessageSchema = exports.ExecutionMessageSchema = exports.ChatMessageSchema = exports.BaseMessageSchema = void 0;
exports.validateMessage = validateMessage;
exports.parseMessage = parseMessage;
/**
 * Message validation schemas using zod
 */
const zod_1 = require("zod");
// Base message schema
const BaseMessageSchema = zod_1.z.object({
    type: zod_1.z.string(),
    id: zod_1.z.string().optional(),
    timestamp: zod_1.z.string()
});
exports.BaseMessageSchema = BaseMessageSchema;
// Chat message schemas
const ChatMessageDataSchema = zod_1.z.object({
    content: zod_1.z.string(),
    role: zod_1.z.enum(['user', 'agent']),
    scriptContent: zod_1.z.string().optional()
});
const ChatMessageSchema = BaseMessageSchema.extend({
    type: zod_1.z.enum(['chat_message', 'chat_response']),
    data: ChatMessageDataSchema
});
exports.ChatMessageSchema = ChatMessageSchema;
// Execution message schemas
const ExecutionMessageDataSchema = zod_1.z.object({
    script: zod_1.z.string().optional(),
    input: zod_1.z.string().optional(),
    interactive: zod_1.z.boolean().optional(),
    output: zod_1.z.string().optional(),
    status: zod_1.z.enum(['running', 'complete', 'error']).optional(),
    prompt: zod_1.z.string().optional()
});
const ExecutionMessageSchema = BaseMessageSchema.extend({
    type: zod_1.z.enum(['script_execute', 'execution_result', 'execution_prompt']),
    data: ExecutionMessageDataSchema
});
exports.ExecutionMessageSchema = ExecutionMessageSchema;
// MCP Server config schema
const MCPServerConfigSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['stdio', 'http']),
    config: zod_1.z.object({
        command: zod_1.z.string().optional(),
        args: zod_1.z.array(zod_1.z.string()).optional(),
        url: zod_1.z.string().optional(),
        headers: zod_1.z.record(zod_1.z.string()).optional()
    }),
    connected: zod_1.z.boolean(),
    tools: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string().optional(),
        inputSchema: zod_1.z.any().optional()
    })).optional(),
    error: zod_1.z.string().optional()
});
exports.MCPServerConfigSchema = MCPServerConfigSchema;
// Configuration message schemas
const ConfigMessageDataSchema = zod_1.z.object({
    action: zod_1.z.enum(['add', 'remove', 'test', 'list']),
    server: MCPServerConfigSchema.optional(),
    servers: zod_1.z.array(MCPServerConfigSchema).optional(),
    result: zod_1.z.boolean().optional(),
    error: zod_1.z.string().optional()
});
const ConfigMessageSchema = BaseMessageSchema.extend({
    type: zod_1.z.enum(['mcp_config', 'mcp_config_response']),
    data: ConfigMessageDataSchema
});
exports.ConfigMessageSchema = ConfigMessageSchema;
// Error message schema
const ErrorMessageDataSchema = zod_1.z.object({
    error: zod_1.z.string(),
    details: zod_1.z.any().optional()
});
const ErrorMessageSchema = BaseMessageSchema.extend({
    type: zod_1.z.literal('error'),
    data: ErrorMessageDataSchema
});
exports.ErrorMessageSchema = ErrorMessageSchema;
// Union schema for all messages
const MessageSchema = zod_1.z.union([
    ChatMessageSchema,
    ExecutionMessageSchema,
    ConfigMessageSchema,
    ErrorMessageSchema
]);
exports.MessageSchema = MessageSchema;
/**
 * Validate a message against the appropriate schema
 * @param message - Message to validate
 * @throws {Error} - If validation fails
 */
function validateMessage(message) {
    try {
        MessageSchema.parse(message);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            throw new Error(`Message validation failed: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Validate and parse a message, returning the typed result
 * @param message - Message to validate and parse
 * @returns Parsed and validated message
 */
function parseMessage(message) {
    return MessageSchema.parse(message);
}

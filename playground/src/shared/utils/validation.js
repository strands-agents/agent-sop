/**
 * Message validation using zod schemas
 */
const { z } = require('zod');

// Base message schema
const BaseMessageSchema = z.object({
  type: z.string(),
  id: z.string().optional(),
  timestamp: z.string()
});

// Chat message schemas
const ChatMessageDataSchema = z.object({
  content: z.string(),
  role: z.enum(['user', 'agent']),
  scriptContent: z.string().optional()
});

const ChatMessageSchema = BaseMessageSchema.extend({
  type: z.enum(['chat_message', 'chat_response']),
  data: ChatMessageDataSchema
});

// Execution message schemas
const ExecutionMessageDataSchema = z.object({
  script: z.string().optional(),
  input: z.string().optional(),
  interactive: z.boolean().optional(),
  output: z.string().optional(),
  status: z.enum(['running', 'complete', 'error']).optional(),
  prompt: z.string().optional()
});

const ExecutionMessageSchema = BaseMessageSchema.extend({
  type: z.enum(['script_execute', 'execution_result', 'execution_prompt']),
  data: ExecutionMessageDataSchema
});

// MCP Server config schema
const MCPServerConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['stdio', 'http']),
  config: z.object({
    command: z.string().optional(),
    args: z.array(z.string()).optional(),
    url: z.string().optional(),
    headers: z.record(z.string()).optional()
  }),
  connected: z.boolean(),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    inputSchema: z.any().optional()
  })).optional(),
  error: z.string().optional()
});

// Configuration message schemas
const ConfigMessageDataSchema = z.object({
  action: z.enum(['add', 'remove', 'test', 'list']),
  server: MCPServerConfigSchema.optional(),
  servers: z.array(MCPServerConfigSchema).optional(),
  result: z.boolean().optional(),
  error: z.string().optional()
});

const ConfigMessageSchema = BaseMessageSchema.extend({
  type: z.enum(['mcp_config', 'mcp_config_response']),
  data: ConfigMessageDataSchema
});

// Error message schema
const ErrorMessageDataSchema = z.object({
  error: z.string(),
  details: z.any().optional()
});

const ErrorMessageSchema = BaseMessageSchema.extend({
  type: z.literal('error'),
  data: ErrorMessageDataSchema
});

// Union schema for all messages
const MessageSchema = z.union([
  ChatMessageSchema,
  ExecutionMessageSchema,
  ConfigMessageSchema,
  ErrorMessageSchema
]);

/**
 * Validate a message against the appropriate schema
 */
function validateMessage(message) {
  try {
    MessageSchema.parse(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Message validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Validate and parse a message, returning the typed result
 */
function parseMessage(message) {
  return MessageSchema.parse(message);
}

module.exports = {
  validateMessage,
  parseMessage,
  BaseMessageSchema,
  ChatMessageSchema,
  ExecutionMessageSchema,
  ConfigMessageSchema,
  ErrorMessageSchema,
  MessageSchema,
  MCPServerConfigSchema
};

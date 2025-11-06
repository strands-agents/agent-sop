# Agent Script Playground - Message Protocol Documentation

## Overview

This document defines the structured message protocol used for communication between the frontend, Node.js backend, and Python service in the Agent Script Playground. All messages follow a standardized format with type-safe validation and serialization.

## Message Structure

All messages follow this base structure:

```typescript
interface BaseMessage {
  type: string;           // Message type identifier
  id?: string;           // Optional correlation ID for request/response matching
  timestamp: string;     // ISO 8601 timestamp
  data: any;            // Message-specific payload
}
```

## Message Types

### Chat Messages

Used for conversation between user and agent during script authoring.

#### Chat Message (User → Agent)
```typescript
{
  type: 'chat_message',
  id: 'uuid-string',
  timestamp: '2025-01-01T12:00:00.000Z',
  data: {
    content: 'Create a file processing script',
    role: 'user'
  }
}
```

#### Chat Response (Agent → User)
```typescript
{
  type: 'chat_response',
  id: 'correlation-id',
  timestamp: '2025-01-01T12:00:01.000Z',
  data: {
    content: 'I\'ll help you create a file processing script...',
    role: 'agent',
    scriptContent?: '# File Processing Script\n...'  // Optional script content
  }
}
```

### Execution Messages

Used for script execution with streaming support and interactive prompts.

#### Script Execute Request
```typescript
{
  type: 'script_execute',
  id: 'uuid-string',
  timestamp: '2025-01-01T12:00:00.000Z',
  data: {
    script: '# Agent Script Content\n...',
    input: 'file_path: /path/to/file.txt',
    interactive: true
  }
}
```

#### Execution Result (Streaming)
```typescript
{
  type: 'execution_result',
  id: 'correlation-id',
  timestamp: '2025-01-01T12:00:01.000Z',
  data: {
    output: 'Processing file...\n',
    status: 'running' | 'complete' | 'error'
  }
}
```

#### Execution Prompt (Interactive)
```typescript
{
  type: 'execution_prompt',
  id: 'correlation-id',
  timestamp: '2025-01-01T12:00:02.000Z',
  data: {
    prompt: 'Do you want to overwrite the existing file? (y/n)'
  }
}
```

### Configuration Messages

Used for MCP server configuration and management.

#### MCP Configuration Request
```typescript
{
  type: 'mcp_config',
  id: 'uuid-string',
  timestamp: '2025-01-01T12:00:00.000Z',
  data: {
    action: 'add' | 'remove' | 'test' | 'list',
    server?: {
      id: 'server-id',
      name: 'File System Server',
      type: 'stdio' | 'http',
      config: {
        command?: 'python',
        args?: ['mcp_server.py'],
        url?: 'http://localhost:8000/mcp',
        headers?: { 'Authorization': 'Bearer token' }
      },
      connected: false
    }
  }
}
```

#### MCP Configuration Response
```typescript
{
  type: 'mcp_config_response',
  id: 'correlation-id',
  timestamp: '2025-01-01T12:00:01.000Z',
  data: {
    action: 'add',
    result: true,
    servers?: [...],  // List of servers for 'list' action
    error?: 'Connection failed'
  }
}
```

### Error Messages

Used for error reporting across all operations.

```typescript
{
  type: 'error',
  id: 'correlation-id',
  timestamp: '2025-01-01T12:00:01.000Z',
  data: {
    error: 'Script execution failed',
    details?: {
      code: 'EXECUTION_ERROR',
      stack: '...'
    }
  }
}
```

## Message Validation

All messages are validated using Zod schemas before processing:

```javascript
const { validateMessage } = require('./src/shared/utils');

try {
  validateMessage(incomingMessage);
  // Process valid message
} catch (error) {
  // Handle validation error
  console.error('Invalid message:', error.message);
}
```

## Message Factory Functions

Use factory functions to create type-safe messages:

```javascript
const { 
  createChatMessage, 
  createExecutionMessage, 
  createConfigMessage,
  createErrorMessage 
} = require('./src/shared/utils');

// Create user chat message
const userMessage = createChatMessage('user', 'Hello agent');

// Create script execution request
const execMessage = createScriptExecuteMessage(
  '# My Script\n...',
  'param1: value1',
  true  // interactive
);

// Create error response
const errorMessage = createErrorMessage(
  'Something went wrong',
  'original-message-id'
);
```

## Type Guards

Use type guards for runtime type checking:

```javascript
const { 
  isChatMessage, 
  isExecutionMessage, 
  isConfigMessage,
  isErrorMessage 
} = require('./src/shared/utils');

function handleMessage(message) {
  if (isChatMessage(message)) {
    // Handle chat message
    console.log('Chat:', message.data.content);
  } else if (isExecutionMessage(message)) {
    // Handle execution message
    console.log('Execution:', message.data.status);
  } else if (isConfigMessage(message)) {
    // Handle configuration message
    console.log('Config:', message.data.action);
  } else if (isErrorMessage(message)) {
    // Handle error message
    console.error('Error:', message.data.error);
  }
}
```

## Serialization

Messages are automatically serialized/deserialized for transport:

```javascript
const { 
  serializeMessage, 
  deserializeMessage,
  safeSerializeMessage,
  safeDeserializeMessage 
} = require('./src/shared/utils');

// Safe serialization (returns null on error)
const json = safeSerializeMessage(message);
if (json) {
  websocket.send(json);
}

// Safe deserialization (returns null on error)
const message = safeDeserializeMessage(receivedJson);
if (message) {
  handleMessage(message);
}
```

## WebSocket Integration

Messages are sent over WebSocket connections with automatic correlation:

```javascript
// Frontend sending message
const message = createChatMessage('user', 'Create a script');
websocket.send(serializeMessage(message));

// Backend handling message
websocket.on('message', (data) => {
  const message = deserializeMessage(data);
  if (message) {
    messageRouter.handleMessage(websocket, message);
  }
});
```

## Error Handling

The protocol includes comprehensive error handling:

1. **Validation Errors**: Invalid message structure
2. **Serialization Errors**: JSON parsing failures
3. **Processing Errors**: Business logic failures
4. **Network Errors**: Connection issues

All errors are reported using standardized error messages with correlation IDs for request tracking.

## Message Flow Examples

### Script Authoring Flow
1. User sends `chat_message` with script request
2. Agent responds with `chat_response` containing script content
3. User can continue conversation to refine script

### Script Execution Flow
1. User sends `script_execute` with script and parameters
2. Backend streams `execution_result` messages with output
3. If interactive, backend sends `execution_prompt` for user input
4. User responds with `chat_message` containing answer
5. Execution continues until completion

### MCP Configuration Flow
1. User sends `mcp_config` with 'add' action and server details
2. Backend attempts connection and responds with `mcp_config_response`
3. If successful, server is available for script execution

## Constants

Message type constants are available for consistency:

```javascript
const { MESSAGE_TYPES } = require('./src/shared/utils/messageFactory');

console.log(MESSAGE_TYPES.CHAT_MESSAGE);      // 'chat_message'
console.log(MESSAGE_TYPES.SCRIPT_EXECUTE);    // 'script_execute'
console.log(MESSAGE_TYPES.ERROR);             // 'error'
```

## Testing

Comprehensive tests cover all message types and utilities:

```bash
# Run message type tests
npm test -- --testPathPattern=message-types.test.js

# Run all tests
npm test
```

The test suite validates:
- Message creation and validation
- Type guards and serialization
- Error handling and edge cases
- Integration with existing systems

const { describe, it, expect, beforeEach } = require('@jest/globals');
const { 
  validateMessage, 
  createChatMessage, 
  createExecutionMessage, 
  createConfigMessage,
  isChatMessage,
  isExecutionMessage,
  isConfigMessage,
  serializeMessage,
  deserializeMessage
} = require('../src/shared/utils');

describe('Message Types', () => {
  describe('Message Validation', () => {
    it('should validate valid chat messages', () => {
      const message = {
        type: 'chat_message',
        id: 'test-id',
        timestamp: new Date().toISOString(),
        data: {
          content: 'Hello',
          role: 'user'
        }
      };

      expect(() => validateMessage(message)).not.toThrow();
    });

    it('should reject invalid chat messages', () => {
      const message = {
        type: 'chat_message',
        data: {
          content: 'Hello'
          // Missing required role field
        }
      };

      expect(() => validateMessage(message)).toThrow();
    });

    it('should validate execution messages', () => {
      const message = {
        type: 'script_execute',
        timestamp: new Date().toISOString(),
        data: {
          script: '# Test script',
          input: 'test input',
          interactive: false
        }
      };

      expect(() => validateMessage(message)).not.toThrow();
    });

    it('should validate config messages', () => {
      const message = {
        type: 'mcp_config',
        timestamp: new Date().toISOString(),
        data: {
          action: 'add',
          server: {
            id: 'test-server',
            name: 'Test Server',
            type: 'stdio',
            config: { command: 'python', args: ['server.py'] },
            connected: false
          }
        }
      };

      expect(() => validateMessage(message)).not.toThrow();
    });
  });

  describe('Message Factory Functions', () => {
    it('should create valid chat messages', () => {
      const message = createChatMessage('user', 'Hello world');
      
      expect(message.type).toBe('chat_message');
      expect(message.data.content).toBe('Hello world');
      expect(message.data.role).toBe('user');
      expect(message.timestamp).toBeDefined();
      expect(message.id).toBeDefined();
    });

    it('should create chat responses with script content', () => {
      const message = createChatMessage('agent', 'Here is your script', 'script content');
      
      expect(message.type).toBe('chat_response');
      expect(message.data.scriptContent).toBe('script content');
    });

    it('should create execution messages', () => {
      const message = createExecutionMessage('script_execute', {
        script: '# Test',
        input: 'test',
        interactive: true
      });

      expect(message.type).toBe('script_execute');
      expect(message.data.script).toBe('# Test');
      expect(message.data.interactive).toBe(true);
    });

    it('should create config messages', () => {
      const server = {
        id: 'test',
        name: 'Test',
        type: 'stdio',
        config: { command: 'python' },
        connected: false
      };

      const message = createConfigMessage('add', { server });

      expect(message.type).toBe('mcp_config');
      expect(message.data.action).toBe('add');
      expect(message.data.server).toEqual(server);
    });
  });

  describe('Type Guards', () => {
    it('should identify chat messages', () => {
      const chatMessage = createChatMessage('user', 'Hello');
      const execMessage = createExecutionMessage('script_execute', { script: '# Test' });

      expect(isChatMessage(chatMessage)).toBe(true);
      expect(isChatMessage(execMessage)).toBe(false);
    });

    it('should identify execution messages', () => {
      const execMessage = createExecutionMessage('script_execute', { script: '# Test' });
      const chatMessage = createChatMessage('user', 'Hello');

      expect(isExecutionMessage(execMessage)).toBe(true);
      expect(isExecutionMessage(chatMessage)).toBe(false);
    });

    it('should identify config messages', () => {
      const configMessage = createConfigMessage('list');
      const chatMessage = createChatMessage('user', 'Hello');

      expect(isConfigMessage(configMessage)).toBe(true);
      expect(isConfigMessage(chatMessage)).toBe(false);
    });
  });

  describe('Message Serialization', () => {
    it('should serialize and deserialize messages', () => {
      const original = createChatMessage('user', 'Hello world');
      const serialized = serializeMessage(original);
      const deserialized = deserializeMessage(serialized);

      expect(deserialized).toEqual(original);
    });

    it('should handle serialization errors', () => {
      const circular = {};
      circular.self = circular;

      expect(() => serializeMessage(circular)).toThrow();
    });

    it('should handle deserialization errors', () => {
      expect(() => deserializeMessage('invalid json')).toThrow();
    });

    it('should preserve date objects in timestamps', () => {
      const message = createChatMessage('user', 'Hello');
      const serialized = serializeMessage(message);
      const deserialized = deserializeMessage(serialized);

      expect(typeof deserialized.timestamp).toBe('string');
      expect(new Date(deserialized.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Error Messages', () => {
    it('should create error responses', () => {
      const { createErrorMessage } = require('../src/shared/utils');
      const error = createErrorMessage('Test error', 'original-id');

      expect(error.type).toBe('error');
      expect(error.data.error).toBe('Test error');
      expect(error.id).toBe('original-id');
    });
  });
});

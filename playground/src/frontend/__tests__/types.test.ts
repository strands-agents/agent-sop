import { Message } from '../types';

describe('Types', () => {
  describe('Message interface', () => {
    test('should accept valid message objects', () => {
      const userMessage: Message = {
        id: '123',
        role: 'user',
        content: 'Hello world',
        timestamp: new Date()
      };

      const agentMessage: Message = {
        id: '456',
        role: 'agent',
        content: 'Hello back!',
        timestamp: new Date()
      };

      expect(userMessage.role).toBe('user');
      expect(agentMessage.role).toBe('agent');
      expect(typeof userMessage.id).toBe('string');
      expect(typeof userMessage.content).toBe('string');
      expect(userMessage.timestamp).toBeInstanceOf(Date);
    });

    test('should handle empty content', () => {
      const message: Message = {
        id: '123',
        role: 'user',
        content: '',
        timestamp: new Date()
      };

      expect(message.content).toBe('');
    });

    test('should handle long content', () => {
      const longContent = 'A'.repeat(10000);
      const message: Message = {
        id: '123',
        role: 'agent',
        content: longContent,
        timestamp: new Date()
      };

      expect(message.content).toHaveLength(10000);
    });

    test('should handle special characters in content', () => {
      const specialContent = '🤖 Hello! This has émojis and spëcial chars: <>&"\'';
      const message: Message = {
        id: '123',
        role: 'agent',
        content: specialContent,
        timestamp: new Date()
      };

      expect(message.content).toBe(specialContent);
    });

    test('should handle different timestamp formats', () => {
      const now = new Date();
      const message: Message = {
        id: '123',
        role: 'user',
        content: 'Test',
        timestamp: now
      };

      expect(message.timestamp).toBe(now);
      expect(message.timestamp.getTime()).toBe(now.getTime());
    });
  });

  describe('Type constraints', () => {
    test('should only allow valid roles', () => {
      // This test ensures TypeScript compilation catches invalid roles
      // In a real scenario, TypeScript would prevent compilation with invalid roles
      
      const validRoles = ['user', 'agent'] as const;
      
      validRoles.forEach(role => {
        const message: Message = {
          id: '123',
          role: role,
          content: 'Test',
          timestamp: new Date()
        };
        
        expect(['user', 'agent']).toContain(message.role);
      });
    });

    test('should require all mandatory fields', () => {
      // This test documents the required fields
      const requiredFields = ['id', 'role', 'content', 'timestamp'];
      
      const message: Message = {
        id: '123',
        role: 'user',
        content: 'Test',
        timestamp: new Date()
      };

      requiredFields.forEach(field => {
        expect(message).toHaveProperty(field);
        expect(message[field as keyof Message]).toBeDefined();
      });
    });
  });
});

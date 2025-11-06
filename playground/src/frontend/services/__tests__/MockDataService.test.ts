import { MockDataService } from '../MockDataService';
import { Message } from '../../types';

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('sendMessage', () => {
    it('should return agent response after delay', async () => {
      const userMessage = 'Create a simple file reader script';
      
      const responsePromise = service.sendMessage(userMessage);
      jest.advanceTimersByTime(1500);
      
      const response = await responsePromise;
      
      expect(response.role).toBe('agent');
      expect(response.content).toContain('script');
      expect(response.timestamp).toBeInstanceOf(Date);
      expect(response.id).toBeDefined();
    });

    it('should handle empty messages', async () => {
      const responsePromise = service.sendMessage('');
      jest.advanceTimersByTime(1500);
      
      const response = await responsePromise;
      
      expect(response.content).toContain('help');
    });

    it('should generate different responses for different inputs', async () => {
      const response1Promise = service.sendMessage('Create a file reader');
      jest.advanceTimersByTime(1500);
      const response1 = await response1Promise;
      
      const response2Promise = service.sendMessage('Create an API client');
      jest.advanceTimersByTime(1500);
      const response2 = await response2Promise;
      
      expect(response1.content).not.toBe(response2.content);
    });
  });

  describe('getConversationHistory', () => {
    it('should return empty array initially', () => {
      const history = service.getConversationHistory();
      expect(history).toEqual([]);
    });

    it('should track conversation history', async () => {
      const userMessage = 'Test message';
      
      const responsePromise = service.sendMessage(userMessage);
      jest.advanceTimersByTime(1500);
      await responsePromise;
      
      const history = service.getConversationHistory();
      expect(history).toHaveLength(2);
      expect(history[0].content).toBe(userMessage);
      expect(history[0].role).toBe('user');
      expect(history[1].role).toBe('agent');
    });
  });

  describe('getCurrentScript', () => {
    it('should return empty string initially', () => {
      const script = service.getCurrentScript();
      expect(script).toBe('');
    });

    it('should return script content after generation', async () => {
      const responsePromise = service.sendMessage('Create a file reader script');
      jest.advanceTimersByTime(1500);
      await responsePromise;
      
      const script = service.getCurrentScript();
      expect(script).toContain('# Create a file processor Agent Script');
      expect(script).toContain('## Overview');
      expect(script).toContain('## Parameters');
      expect(script).toContain('## Steps');
    });
  });

  describe('resetConversation', () => {
    it('should clear conversation history and script', async () => {
      const responsePromise = service.sendMessage('Test message');
      jest.advanceTimersByTime(1500);
      await responsePromise;
      
      service.resetConversation();
      
      expect(service.getConversationHistory()).toEqual([]);
      expect(service.getCurrentScript()).toBe('');
    });
  });

  describe('error scenarios', () => {
    it('should handle service timeout simulation', async () => {
      const responsePromise = service.sendMessage('trigger timeout error');
      jest.advanceTimersByTime(5000);
      
      const response = await responsePromise;
      expect(response.content).toContain('timeout');
    });

    it('should handle invalid script format requests', async () => {
      const responsePromise = service.sendMessage('generate invalid format');
      jest.advanceTimersByTime(1500);
      
      const response = await responsePromise;
      expect(response.content).toContain('format');
    });
  });
});

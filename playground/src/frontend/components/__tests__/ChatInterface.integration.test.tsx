/**
 * Integration tests for ChatInterface critical functionality
 * These tests ensure the input clearing and focus issues don't regress
 */

// Setup polyfills for JSDOM
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

import { render } from 'preact';
import { ChatInterface } from '../ChatInterface';

describe('ChatInterface Integration Tests', () => {
  let container: HTMLElement;
  let mockOnSendMessage: jest.Mock;

  beforeEach(() => {
    // Create container
    document.body.innerHTML = '<div id="test-container"></div>';
    container = document.getElementById('test-container')!;
    mockOnSendMessage = jest.fn();
  });

  afterEach(() => {
    if (container) {
      container.innerHTML = '';
    }
  });

  describe('Enter Key Functionality', () => {
    it('should send message and clear input when Enter is pressed', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={false} 
        />, 
        container
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();

      // Type message
      textarea.value = 'test message';

      // Press Enter
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
        bubbles: true
      });
      textarea.dispatchEvent(enterEvent);

      // Should send message and clear input
      expect(mockOnSendMessage).toHaveBeenCalledWith('test message');
      expect(textarea.value).toBe('');
    });

    it('should not send empty messages when Enter is pressed', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={false} 
        />, 
        container
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      
      // Press Enter with empty input
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
        bubbles: true
      });
      textarea.dispatchEvent(enterEvent);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });

    it('should not send when Shift+Enter is pressed', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={false} 
        />, 
        container
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'test message';

      // Press Shift+Enter
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true
      });
      textarea.dispatchEvent(shiftEnterEvent);

      expect(mockOnSendMessage).not.toHaveBeenCalled();
      expect(textarea.value).toBe('test message');
    });
  });

  describe('Send Button Functionality', () => {
    it('should send message and clear input when Send button is clicked', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={false} 
        />, 
        container
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      const sendButton = container.querySelector('button') as HTMLButtonElement;
      
      expect(textarea).toBeTruthy();
      expect(sendButton).toBeTruthy();

      // Type message
      textarea.value = 'button test';

      // Click Send
      sendButton.click();

      // Should send message and clear input
      expect(mockOnSendMessage).toHaveBeenCalledWith('button test');
      expect(textarea.value).toBe('');
    });

    it('should not send empty messages when Send button is clicked', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={false} 
        />, 
        container
      );

      const sendButton = container.querySelector('button') as HTMLButtonElement;
      sendButton.click();

      expect(mockOnSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Loading State Behavior', () => {
    it('should not send messages when loading', () => {
      render(
        <ChatInterface 
          messages={[]} 
          onSendMessage={mockOnSendMessage} 
          isLoading={true} 
        />, 
        container
      );

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
      const sendButton = container.querySelector('button') as HTMLButtonElement;
      
      textarea.value = 'loading test';

      // Try Enter key
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
        bubbles: true
      });
      textarea.dispatchEvent(enterEvent);
      expect(mockOnSendMessage).not.toHaveBeenCalled();

      // Try Send button
      sendButton.click();
      expect(mockOnSendMessage).not.toHaveBeenCalled();

      // Input should not be cleared
      expect(textarea.value).toBe('loading test');
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { App } from '../App';

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock WebSocket to simulate agent responses
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  sentMessages: string[] = [];

  constructor(public url: string) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
    
    // Simulate agent response after a delay
    setTimeout(() => {
      try {
        const message = JSON.parse(data);
        if (message.type === 'chat_message') {
          const userMessage = message.data.message;
          if (userMessage.includes('log analyzer')) {
            this.simulateMessage({
              type: 'chat_response',
              data: {
                message: "I'll help you create powerful agent scripts! Let me generate a log analyzer script for you.",
                script: "# Create a log analyzer script Agent Script\n\n## Overview\nA comprehensive log analysis script.\n\n## Parameters\n- **log_file** (required): Path to log file"
              }
            });
          } else if (userMessage.includes('file processor')) {
            this.simulateMessage({
              type: 'chat_response',
              data: {
                message: "I'll help you create powerful agent scripts! Let me generate a file processor script for you.",
                script: "# Create a file processor Agent Script\n\n## Overview\nA comprehensive file processing script.\n\n## Parameters\n- **file_path** (required): Path to file"
              }
            });
          } else if (userMessage.includes('test script')) {
            this.simulateMessage({
              type: 'chat_response',
              data: {
                message: "I'll help you create powerful agent scripts! Let me generate a test script for you.",
                script: "# Create a test script Agent Script\n\n## Overview\nA test script for validation.\n\n## Parameters\n- **test_input** (required): Test input"
              }
            });
          } else {
            // Generic response for other messages
            this.simulateMessage({
              type: 'chat_response',
              data: {
                message: "I'll help you create powerful agent scripts! Let me refine the script for you.",
                script: "# Updated Agent Script\n\n## Overview\nAn updated script with your requested changes."
              }
            });
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }, 100);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.(new CloseEvent('close'));
  }

  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

describe('App Integration Tests', () => {
  let originalWebSocket: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalWebSocket = (global as any).WebSocket;
    (global as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    cleanup();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    (global as any).WebSocket = originalWebSocket;
  });

  describe('Message Flow', () => {
    test('should handle complete message and script generation workflow', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // User types and sends a message
      await user.type(input, 'Create a log analyzer script');
      await user.click(sendButton);
      
      // User message appears
      expect(screen.getByText('Create a log analyzer script')).toBeInTheDocument();
      
      // Fast-forward to get agent response
      jest.advanceTimersByTime(200);
      
      // Agent responds and script is generated
      await waitFor(() => {
        expect(screen.getByText(/I'll help you create powerful agent scripts/)).toBeInTheDocument();
      });
      
      // Export functionality should be available (Test button appears when script is generated)
      await waitFor(() => {
        expect(screen.getByLabelText(/Test agent script/)).toBeInTheDocument();
      });
    });

    test('should handle multiple conversation turns', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // First message
      await user.type(input, 'Create a file processor');
      await user.click(sendButton);
      
      jest.advanceTimersByTime(200);
      
      await waitFor(() => {
        expect(screen.getByText('Create a file processor')).toBeInTheDocument();
      });
      
      // Second message
      await user.clear(input);
      await user.type(input, 'Add error handling');
      await user.click(sendButton);
      
      jest.advanceTimersByTime(200);
      
      await waitFor(() => {
        expect(screen.getByText('Add error handling')).toBeInTheDocument();
      });
      
      // Both messages should remain visible
      expect(screen.getByText('Create a file processor')).toBeInTheDocument();
      expect(screen.getByText('Add error handling')).toBeInTheDocument();
    });
  });

  describe('Keyboard Interactions', () => {
    test('should handle Enter key for sending messages', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      
      // Type message and press Enter
      await user.type(input, 'Test message');
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    test('should handle Shift+Enter for new lines without sending', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      
      // Type message with Shift+Enter (should not send)
      await user.type(input, 'Multi-line{Shift>}{Enter}{/Shift}message');
      
      // Message should not be sent
      expect(screen.queryByText('Multi-line\nmessage')).not.toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    test('should disable send button during processing', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Send first message
      await user.type(input, 'First message');
      await user.click(sendButton);
      
      // Button should be disabled while processing
      expect(sendButton).toBeDisabled();
      
      // Try to send another message immediately
      await user.type(input, 'Second message');
      expect(sendButton).toBeDisabled();
    });

    test('should handle empty message gracefully', () => {
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      
      // Clicking with empty input should not cause errors
      fireEvent.click(sendButton);
      
      // Should not create any new messages
      const messages = screen.queryAllByText(/Create a file processor/);
      expect(messages).toHaveLength(0);
    });
  });

  describe('Focus Management', () => {
    test('should maintain focus on input after sending message', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      const input = screen.getByRole('textbox');
      
      // Send message
      await user.type(input, 'Test message');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      // Input should be focused and cleared
      expect(input).toHaveFocus();
      expect(input).toHaveValue('');
    });
  });

  describe('Export Functionality', () => {
    test('should enable export after script generation', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      render(<App />);
      
      // Wait for WebSocket to connect
      jest.advanceTimersByTime(20);
      
      // Send message to generate script
      const input = screen.getByRole('textbox');
      await user.type(input, 'Create a test script');
      await user.click(screen.getByRole('button', { name: /send/i }));
      
      jest.advanceTimersByTime(200);
      
      await waitFor(() => {
        // Test button should appear when script is generated
        const testButton = screen.getByLabelText(/Test agent script/);
        expect(testButton).toBeInTheDocument();
        
        // Should be able to click test button
        fireEvent.click(testButton);
      });
    });
  });
});

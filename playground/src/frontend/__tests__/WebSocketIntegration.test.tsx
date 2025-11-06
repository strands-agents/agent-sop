import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { App } from '../App';

// Mock the useWebSocketEnhanced hook
const mockSendMessage = jest.fn();
const mockReconnect = jest.fn();

jest.mock('../hooks/useWebSocketEnhanced', () => ({
  useWebSocketEnhanced: jest.fn(() => ({
    connectionState: 'connected',
    sendMessage: mockSendMessage,
    reconnect: mockReconnect,
    lastError: null,
    isConnected: true
  }))
}));

describe('WebSocket Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMessage.mockClear();
    
    // Reset the mock to return connected state by default
    const { useWebSocketEnhanced } = require('../hooks/useWebSocketEnhanced');
    useWebSocketEnhanced.mockReturnValue({
      connectionState: 'connected',
      sendMessage: mockSendMessage,
      reconnect: mockReconnect,
      lastError: null,
      isConnected: true
    });
  });

  test('should send chat messages via WebSocket', async () => {
    render(<App />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Agent Script Playground/)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Create a test script' } });
    fireEvent.click(sendButton);

    // Verify message was sent via the hook with mcpServers included
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'chat_message',
      data: { 
        message: 'Create a test script',
        mcpServers: []
      }
    });
  });

  test('should handle script execution via WebSocket', async () => {
    let messageHandler: ((message: any) => void) | null = null;
    
    // Capture the onMessage handler
    const { useWebSocketEnhanced } = require('../hooks/useWebSocketEnhanced');
    useWebSocketEnhanced.mockImplementation((url: string, options: any) => {
      messageHandler = options.onMessage;
      return {
        connectionState: 'connected',
        sendMessage: mockSendMessage,
        reconnect: mockReconnect,
        lastError: null,
        isConnected: true
      };
    });
    
    render(<App />);

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText(/Agent Script Playground/)).toBeInTheDocument();
    });

    // First add some script content by simulating a response
    if (messageHandler) {
      messageHandler({
        type: 'chat_response',
        data: {
          message: "Here's your script!",
          script: "# Test Script\n\n## Overview\nA test script"
        }
      });
    }

    // Wait for script content to appear - use getAllByText to handle multiple instances
    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: /Test Script/ });
      expect(headings.length).toBeGreaterThan(0);
    });

    // Open testing modal using the button with specific aria-label
    const testButton = screen.getByRole('button', { name: /test agent script/i });
    fireEvent.click(testButton);

    // Wait for modal to open
    await waitFor(() => {
      expect(screen.getByText(/Test Agent Script/)).toBeInTheDocument();
    });

    // Fill in test parameters - use onInput event since that's what the component uses
    const paramInput = screen.getByPlaceholderText(/enter test parameters/i);
    fireEvent.input(paramInput, { target: { value: 'test input' } });

    // Wait for the input to be processed
    await waitFor(() => {
      expect(paramInput).toHaveValue('test input');
    });

    // Click run script
    const runButton = screen.getByRole('button', { name: /run script/i });
    fireEvent.click(runButton);

    // Check that script execution message was sent via the hook
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'script_execute',
      data: {
        script: "# Test Script\n\n## Overview\nA test script",
        input: 'test input',
        interactive: false,
        mcpServers: []
      }
    });
  });

  test('should show connection status in UI', async () => {
    // Start with disconnected state
    const { useWebSocketEnhanced } = require('../hooks/useWebSocketEnhanced');
    useWebSocketEnhanced.mockReturnValue({
      connectionState: 'disconnected',
      sendMessage: mockSendMessage,
      reconnect: mockReconnect,
      lastError: null,
      isConnected: false
    });
    
    render(<App />);

    // Should show disconnected status (capitalized)
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
  });

  test('should handle connection errors gracefully', async () => {
    let errorHandler: ((error: any) => void) | null = null;
    
    // Capture the onError handler
    const { useWebSocketEnhanced } = require('../hooks/useWebSocketEnhanced');
    useWebSocketEnhanced.mockImplementation((url: string, options: any) => {
      errorHandler = options.onError;
      return {
        connectionState: 'connected',
        sendMessage: mockSendMessage,
        reconnect: mockReconnect,
        lastError: null,
        isConnected: true
      };
    });
    
    render(<App />);

    // Simulate error by calling the error handler directly
    if (errorHandler) {
      errorHandler({
        type: 'network',
        message: 'Connection failed',
        recoverable: true,
        suggestion: 'Check your connection'
      });
    }

    // Error notification should appear - use getAllByText since there might be multiple instances
    await waitFor(() => {
      const errorElements = screen.getAllByText(/connection failed/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { App } from '../App';

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

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

describe('App', () => {
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

  afterEach(() => {
    cleanup();
  });

  test('renders main components', () => {
    render(<App />);
    
    expect(screen.getByText('Agent Script Playground')).toBeInTheDocument();
    expect(screen.getByText('Configure MCP')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
  });

  test('handles message sending workflow', async () => {
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
    
    const input = screen.getByPlaceholderText(/type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    // Type a message
    fireEvent.change(input, { target: { value: 'Create a file processor' } });
    fireEvent.click(sendButton);
    
    // Verify message was sent
    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'chat_message',
      data: { 
        message: 'Create a file processor',
        mcpServers: []
      }
    });

    // Simulate agent response
    if (messageHandler) {
      messageHandler({
        type: 'chat_response',
        data: {
          message: "I'll help you create powerful agent scripts! Let me generate a file processor script for you.",
          script: "# Create a file processor Agent Script\n\n## Overview\nA comprehensive file processing script that handles file operations with proper error handling.\n\n## Parameters\n- **file_path** (required): Path to the file to process"
        }
      });
    }

    // Script content should be generated - check for the title in the preview
    await waitFor(() => {
      expect(screen.getByText(/Create a file processor Agent Script/)).toBeInTheDocument();
    }, { timeout: 100 });
  });

  test('opens and closes MCP configuration modal', async () => {
    render(<App />);
    
    const mcpButton = screen.getByText('Configure MCP');
    fireEvent.click(mcpButton);
    
    await waitFor(() => {
      expect(screen.getByText(/MCP Server Configuration/)).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/MCP Server Configuration/)).not.toBeInTheDocument();
    });
  });

  test('opens and closes testing panel', async () => {
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
    
    // Simulate script content being added
    if (messageHandler) {
      messageHandler({
        type: 'chat_response',
        data: {
          message: "Here's your script!",
          script: "# Test Script\n\n## Overview\nA test script"
        }
      });
    }

    // Wait for script content to appear - check for the heading specifically
    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: /Test Script/ });
      expect(headings.length).toBeGreaterThan(0);
    });
    
    const testButton = screen.getByRole('button', { name: /test agent script/i });
    fireEvent.click(testButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Test Agent Script/)).toBeInTheDocument();
    });
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Test Agent Script/)).not.toBeInTheDocument();
    });
  });

  test('shows connection status', () => {
    render(<App />);
    
    // Should show connected status (capitalized)
    expect(screen.getByText(/Connected/)).toBeInTheDocument();
  });

  test('handles disconnected state', () => {
    // Mock disconnected state
    const { useWebSocketEnhanced } = require('../hooks/useWebSocketEnhanced');
    useWebSocketEnhanced.mockReturnValue({
      connectionState: 'disconnected',
      sendMessage: mockSendMessage,
      reconnect: mockReconnect,
      lastError: null,
      isConnected: false
    });
    
    render(<App />);
    
    // Should show disconnected status and disable MCP button
    expect(screen.getByText(/Disconnected/)).toBeInTheDocument();
    
    const mcpButton = screen.getByText('Configure MCP');
    expect(mcpButton).toBeDisabled();
  });
});

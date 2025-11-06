/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { ChatInterface } from '../ChatInterface';
import { Message } from '../../types';

describe('ChatInterface', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Hello, I need help creating a script',
      timestamp: new Date('2023-01-01T10:00:00Z')
    },
    {
      id: '2',
      role: 'agent',
      content: 'I can help you create an agent script. What would you like it to do?',
      timestamp: new Date('2023-01-01T10:01:00Z')
    }
  ];

  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    mockOnSendMessage.mockClear();
  });

  it('displays message history correctly', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
      />
    );

    expect(screen.getByText('Hello, I need help creating a script')).toBeInTheDocument();
    expect(screen.getByText('I can help you create an agent script. What would you like it to do?')).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    // Should show empty messages area - look for the scrollable container
    const messagesArea = document.querySelector('.overflow-y-auto');
    expect(messagesArea).toBeInTheDocument();
    expect(messagesArea?.children).toHaveLength(1); // Just the messages end ref div
  });

  it('handles message input submission', async () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByText('Send');

    fireEvent.change(input, { target: { value: 'Create a file processor' } });
    fireEvent.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith('Create a file processor');
  });

  it('handles Enter key submission', async () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });

    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('allows Shift+Enter for new line without submission', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
      />
    );

    const input = screen.getByRole('textbox');
    
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('shows loading indicator when isLoading is true', () => {
    render(
      <ChatInterface
        messages={mockMessages}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    expect(document.querySelector('.typing-indicator')).toBeInTheDocument();
  });

  it('disables input when loading', () => {
    render(
      <ChatInterface
        messages={[]}
        onSendMessage={mockOnSendMessage}
        isLoading={true}
      />
    );

    const input = screen.getByRole('textbox');
    const sendButton = screen.getByText('Send');

    // Only the button should be disabled, not the textarea
    expect(input).not.toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('formats timestamps correctly', () => {
    const testMessage: Message = {
      id: '1',
      role: 'user',
      content: 'Test message',
      timestamp: new Date('2023-01-01T14:30:00Z')
    };

    render(
      <ChatInterface
        messages={[testMessage]}
        onSendMessage={mockOnSendMessage}
      />
    );

    // Check that timestamp is displayed (format may vary by locale)
    const timestampElement = document.querySelector('.text-xs.opacity-70');
    expect(timestampElement).toBeInTheDocument();
    expect(timestampElement?.textContent).toMatch(/\d{1,2}:\d{2}/);
  });
});

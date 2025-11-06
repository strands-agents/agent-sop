import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { MockDataService } from '../MockDataService';
import { ChatInterface } from '../../components/ChatInterface';
import { ScriptPreview } from '../../components/ScriptPreview';
import { Message } from '../../types';

describe('MockDataService Integration', () => {
  let service: MockDataService;
  let messages: Message[];
  let scriptContent: string;
  let onSendMessage: (message: string) => void;

  beforeEach(() => {
    service = new MockDataService();
    messages = [];
    scriptContent = '';
    
    onSendMessage = async (message: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      messages.push(userMessage);
      
      // Start the async operation
      const responsePromise = service.sendMessage(message);
      
      // Advance timers based on message type
      if (message.includes('trigger timeout error')) {
        jest.advanceTimersByTime(5000);
      } else {
        jest.advanceTimersByTime(1500);
      }
      
      const agentResponse = await responsePromise;
      messages.push(agentResponse);
      scriptContent = service.getCurrentScript();
    };
    
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should integrate with ChatInterface for conversation flow', async () => {
    const TestComponent = () => (
      <ChatInterface 
        messages={messages} 
        onSendMessage={onSendMessage}
        isLoading={false}
      />
    );

    render(<TestComponent />);
    
    const input = screen.getByPlaceholderText('Type your message here...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Create a file reader script' } });
    fireEvent.click(sendButton);
    
    jest.advanceTimersByTime(1500);
    
    await waitFor(() => {
      expect(screen.getByText('Create a file reader script')).toBeInTheDocument();
    });
  });

  it('should integrate with ScriptPreview for content updates', async () => {
    await onSendMessage('Create a simple utility script');
    
    const TestComponent = () => (
      <ScriptPreview content={scriptContent} />
    );

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });
  });

  it('should handle complete authoring workflow', async () => {
    // Initial script request
    await onSendMessage('Create a file processing script');
    
    expect(messages).toHaveLength(2);
    expect(scriptContent).toContain('# Create a file processor Agent Script');
    
    // Script refinement
    await onSendMessage('Add error handling to the script');
    
    expect(messages).toHaveLength(4);
    expect(scriptContent).toContain('error');
  });

  it('should handle error scenarios gracefully', async () => {
    await onSendMessage('trigger timeout error');
    
    expect(messages).toHaveLength(2);
    expect(messages[1].content).toContain('timeout');
  });

  it('should maintain conversation state across multiple interactions', async () => {
    await onSendMessage('Create a basic script');
    
    await onSendMessage('Add parameters to it');
    
    await onSendMessage('Include validation steps');
    
    const history = service.getConversationHistory();
    expect(history).toHaveLength(6); // 3 user + 3 agent messages
    
    const finalScript = service.getCurrentScript();
    expect(finalScript).toContain('Parameters');
    expect(finalScript).toContain('Validate Input Parameters');
  });
});

import { useState, useRef, useEffect } from 'preact/hooks';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

export function ChatInterface({ messages, onSendMessage, isLoading = false }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const textareaValue = inputRef.current?.value || '';
    const trimmedValue = textareaValue.trim();
    if (trimmedValue && !isLoading) {
      onSendMessage(trimmedValue);
      setInputValue('');
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const trimmedValue = target.value.trim();
      if (trimmedValue && !isLoading) {
        onSendMessage(trimmedValue);
        setInputValue('');
        target.value = '';
      }
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900" role="main" aria-label="Chat interface">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 items-start ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 ${
                  message.role === 'user' ? 'bg-blue-500' : 'bg-green-500'
                }`}
                aria-label={message.role === 'user' ? 'User message' : 'Agent message'}
              >
                {message.role === 'user' ? 'U' : 'A'}
              </div>
              
              <div
                className={`max-w-[70%] p-3 rounded-2xl break-words whitespace-pre-wrap ${
                  message.role === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-white'
                }`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                <div
                  className={`text-xs opacity-70 mt-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        }
        
        {isLoading && (
          <div className="flex gap-2 items-start">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-semibold">
              A
            </div>
            <div className="p-3 rounded-2xl bg-gray-700 text-white">
              <div className="typing-indicator">
                <span className="animate-typing">•</span>
                <span className="animate-typing">•</span>
                <span className="animate-typing">•</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            onChange={(e) => {
              const newValue = (e.target as HTMLTextAreaElement).value;
              setInputValue(newValue);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="flex-1 min-h-[40px] max-h-[120px] p-3 border border-gray-600 rounded-2xl resize-none text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            aria-label="Message input"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className={`px-4 py-2.5 text-white border-none rounded-2xl text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              !isLoading 
                ? 'bg-blue-500 hover:bg-blue-600 cursor-pointer' 
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            aria-label="Send message"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}

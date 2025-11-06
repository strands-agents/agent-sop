import { useState, useEffect } from 'preact/hooks';
import { SplitLayout, ChatInterface, ScriptPreview, TestingPanel, MCPConfigModal, ConnectionStatus, ErrorNotification } from './components';
import { Message, MCPServerConfig, WebSocketMessage } from './types';
import { useWebSocketEnhanced } from './hooks/useWebSocketEnhanced';
import { ErrorInfo } from './services/ConnectionManager';

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [scriptContent, setScriptContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingModalOpen, setIsTestingModalOpen] = useState(false);
  const [isMCPModalOpen, setIsMCPModalOpen] = useState(false);
  const [mcpServers, setMcpServers] = useState<MCPServerConfig[]>([]);
  const [executionOutput, setExecutionOutput] = useState('');
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);

  // Enhanced WebSocket connection with error handling
  const { 
    connectionState, 
    sendMessage, 
    reconnect, 
    lastError, 
    isConnected 
  } = useWebSocketEnhanced(
    `ws://${window.location.host}`,
    {
      onMessage: handleWebSocketMessage,
      onError: handleConnectionError,
      autoReconnect: true,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
    }
  );

  function handleConnectionError(error: ErrorInfo) {
    console.error('WebSocket connection error:', error);
    setCurrentError(error);
  }

  function handleWebSocketMessage(message: WebSocketMessage) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'connection_established':
        // Connection confirmation - no action needed
        console.log('WebSocket connection established:', message.data.clientId);
        break;
        
      case 'chat_response':
        const agentMessage: Message = {
          id: Date.now().toString(),
          role: 'agent',
          content: message.data.message || message.data,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, agentMessage]);
        
        if (message.data.script) {
          setScriptContent(message.data.script);
        }
        setIsLoading(false);
        break;
        
      case 'execution_output':
        // Handle streaming execution output
        setExecutionOutput(prev => prev + message.data.output + '\n');
        break;
        
      case 'error':
        console.error('WebSocket error:', message.data);
        setIsLoading(false);
        break;
        
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'agent',
      content: `Welcome to the Agent Script Authoring Assistant! 🤖

I'll help you create powerful agent scripts using natural language. Here are some examples to get you started:

• "Create a script that analyzes log files for errors"
• "Build a script to automate code reviews"  
• "Generate a script for processing customer feedback"
• "Create a script that monitors system health"

What kind of agent script would you like to create?`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Send message via WebSocket
      sendMessage({
        type: 'chat_message',
        data: {
          message: content,
          mcpServers: mcpServers.filter(s => s.connected)
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleExportScript = () => {
    if (scriptContent) {
      const blob = new Blob([scriptContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-script.script.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleTestScript = () => {
    setIsTestingModalOpen(true);
  };

  const handleCloseTestingModal = () => {
    setIsTestingModalOpen(false);
    setExecutionOutput(''); // Reset execution output when closing
  };

  const handleExecuteScript = (input: string, interactive: boolean) => {
    sendMessage({
      type: 'script_execute',
      data: {
        script: scriptContent,
        input,
        interactive,
        mcpServers: mcpServers.filter(s => s.connected)
      }
    });
  };

  const handleOpenMCPModal = () => {
    setIsMCPModalOpen(true);
  };

  const handleCloseMCPModal = () => {
    setIsMCPModalOpen(false);
  };

  const handleAddServer = (server: Omit<MCPServerConfig, 'id' | 'connected'>) => {
    const newServer: MCPServerConfig = {
      ...server,
      id: Date.now().toString(),
      connected: false
    };
    setMcpServers(prev => [...prev, newServer]);
    
    // Automatically connect the new server
    handleConnectServer(newServer);
  };

  const handleConnectServer = async (server: MCPServerConfig) => {
    try {
      const response = await fetch('/api/mcp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverConfig: server }),
      });

      const result = await response.json();

      setMcpServers(prev => prev.map(s => 
        s.id === server.id 
          ? { 
              ...s, 
              connected: result.connected,
              tools: result.tools || [],
              error: result.error
            }
          : s
      ));
    } catch (error) {
      setMcpServers(prev => prev.map(s => 
        s.id === server.id 
          ? { ...s, connected: false, error: 'Failed to connect to server' }
          : s
      ));
    }
  };

  const handleRemoveServer = (id: string) => {
    setMcpServers(prev => prev.filter(server => server.id !== id));
  };

  const handleTestConnection = async (id: string) => {
    const server = mcpServers.find(s => s.id === id);
    if (!server) return;

    // Set loading state
    setMcpServers(prev => prev.map(s => 
      s.id === id 
        ? { ...s, connected: false, error: undefined }
        : s
    ));

    try {
      const response = await fetch('/api/mcp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverConfig: server }),
      });

      const result = await response.json();

      setMcpServers(prev => prev.map(s => 
        s.id === id 
          ? { 
              ...s, 
              connected: result.connected,
              tools: result.tools || [],
              error: result.error
            }
          : s
      ));
    } catch (error) {
      setMcpServers(prev => prev.map(s => 
        s.id === id 
          ? { ...s, connected: false, error: 'Failed to test connection' }
          : s
      ));
    }
  };

  const leftPanel = (
    <ChatInterface
      messages={messages}
      onSendMessage={handleSendMessage}
      isLoading={isLoading}
    />
  );

  const rightPanel = (
    <ScriptPreview
      content={scriptContent}
      onExport={handleExportScript}
      onTestScript={handleTestScript}
    />
  );

  return (
    <div className="h-screen font-sans m-0 p-0 overflow-hidden bg-gray-900 dark text-white flex flex-col">
      {/* Header with MCP Config Button and Connection Status */}
      <div className="flex justify-between items-center p-4 border-b border-gray-700 flex-shrink-0">
        <h1 className="text-xl font-semibold">Agent Script Playground</h1>
        <div className="flex items-center gap-3">
          {/* Enhanced Connection Status */}
          <ConnectionStatus
            connectionState={connectionState}
            lastError={lastError}
            onReconnect={reconnect}
            className="text-sm"
          />
          <button
            onClick={handleOpenMCPModal}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
            disabled={!isConnected}
          >
            Configure MCP
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <SplitLayout
          leftPanel={leftPanel}
          rightPanel={rightPanel}
          initialLeftWidth={50}
          minPanelWidth={30}
        />
      </div>

      {/* Modals */}
      <TestingPanel
        isOpen={isTestingModalOpen}
        onClose={handleCloseTestingModal}
        scriptContent={scriptContent}
        onExecute={handleExecuteScript}
        executionOutput={executionOutput}
        isConnected={isConnected}
      />

      <MCPConfigModal
        isOpen={isMCPModalOpen}
        onClose={handleCloseMCPModal}
        servers={mcpServers}
        onAddServer={handleAddServer}
        onRemoveServer={handleRemoveServer}
        onTestConnection={handleTestConnection}
      />

      {/* Error Notification */}
      <ErrorNotification
        error={currentError}
        onDismiss={() => setCurrentError(null)}
        onRetry={reconnect}
        autoHideDelay={currentError?.recoverable ? 8000 : 0}
      />
    </div>
  );
}

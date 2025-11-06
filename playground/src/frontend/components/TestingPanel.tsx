import { useState, useEffect, useRef } from 'preact/hooks';
import { MockExecutionEngine, ExecutionState } from '../services/MockExecutionEngine';

interface TestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  scriptContent: string;
  executionOutput?: string;
  onExecute?: (input: string, interactive: boolean) => void;
  isConnected?: boolean;
}

export function TestingPanel({ 
  isOpen, 
  onClose, 
  scriptContent, 
  executionOutput: externalOutput, 
  onExecute,
  isConnected = true 
}: TestingPanelProps) {
  const [parameterInput, setParameterInput] = useState('');
  const [interactiveMode, setInteractiveMode] = useState(false);
  const [executionState, setExecutionState] = useState<ExecutionState>(ExecutionState.IDLE);
  const [executionOutput, setExecutionOutput] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [userResponse, setUserResponse] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MockExecutionEngine | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new MockExecutionEngine();
      
      engineRef.current.onStateChange((state) => {
        setExecutionState(state);
      });
      
      engineRef.current.onOutput((output) => {
        setExecutionOutput(prev => prev + output);
      });
      
      engineRef.current.onInteractivePrompt((prompt) => {
        setCurrentPrompt(prompt);
      });
      
      engineRef.current.onError((error) => {
        setExecutionOutput(prev => prev + `❌ Error: ${error}\n`);
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.cancel();
      }
    };
  }, []);

  // Use external execution output when available
  useEffect(() => {
    if (externalOutput) {
      setExecutionOutput(externalOutput);
    }
  }, [externalOutput]);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      modalRef.current?.focus();
      // Reset modal state when opened
      if (engineRef.current) {
        engineRef.current.cancel();
      }
      setExecutionState(ExecutionState.IDLE);
      // Only reset execution output if no external output is provided
      if (!externalOutput) {
        setExecutionOutput('');
      }
      setCurrentPrompt('');
      setUserResponse('');
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleRunScript = async () => {
    if (!parameterInput.trim()) return;

    setExecutionOutput('');
    setCurrentPrompt('');

    // Use WebSocket callback if available, otherwise use mock engine
    if (onExecute) {
      onExecute(parameterInput, interactiveMode);
    } else if (engineRef.current) {
      // Fallback to mock engine for testing
      const scriptType = getScriptType(scriptContent);
      
      try {
        switch (scriptType) {
          case 'simple':
            await engineRef.current.executeSimpleScript(parameterInput);
            break;
          case 'complex':
            await engineRef.current.executeComplexScript(parameterInput);
            break;
          case 'long-running':
            await engineRef.current.executeLongRunningScript(parameterInput);
            break;
          default:
            await engineRef.current.execute(parameterInput, interactiveMode);
        }
      } catch (error) {
        console.error('Execution error:', error);
      }
    }
  };

  const handleCancel = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setExecutionOutput('');
    setCurrentPrompt('');
  };

  const handleUserResponseSubmit = () => {
    if (engineRef.current && userResponse.trim()) {
      engineRef.current.provideUserInput(userResponse);
      setUserResponse('');
      setCurrentPrompt('');
    }
  };

  const handleClose = () => {
    if (engineRef.current) {
      engineRef.current.cancel();
    }
    setParameterInput('');
    setInteractiveMode(false);
    setExecutionOutput('');
    setCurrentPrompt('');
    setUserResponse('');
    onClose();
  };

  const getScriptType = (content: string): 'simple' | 'complex' | 'long-running' => {
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('tool') || lowerContent.includes('reasoning') || lowerContent.includes('complex')) {
      return 'complex';
    }
    if (lowerContent.includes('long') || lowerContent.includes('process') || lowerContent.includes('analyze')) {
      return 'long-running';
    }
    return 'simple';
  };

  const isExecuting = executionState === ExecutionState.RUNNING;
  const isPaused = executionState === ExecutionState.PAUSED;
  const isCompleted = executionState === ExecutionState.COMPLETED;
  const hasError = executionState === ExecutionState.ERROR;
  const isCancelled = executionState === ExecutionState.CANCELLED;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      data-testid="modal-backdrop"
    >
      <div
        ref={modalRef}
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 id="modal-title" className="text-xl font-semibold text-white">
            Test Agent Script
            {executionState !== ExecutionState.IDLE && (
              <span className={`ml-2 text-sm px-2 py-1 rounded ${
                isExecuting ? 'bg-blue-500' :
                isPaused ? 'bg-yellow-500' :
                isCompleted ? 'bg-green-500' :
                hasError ? 'bg-red-500' :
                isCancelled ? 'bg-gray-500' : 'bg-gray-600'
              }`}>
                {executionState}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          {/* Form Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="parameter-input" className="block text-sm font-medium text-gray-300 mb-2">
                Test Parameters
              </label>
              <textarea
                id="parameter-input"
                value={parameterInput}
                onInput={(e) => setParameterInput((e.target as HTMLTextAreaElement).value)}
                placeholder="Enter test parameters for your script (e.g., file paths, configuration values, etc.)"
                className="w-full h-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isExecuting || isPaused}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="interactive-mode"
                checked={interactiveMode}
                onInput={(e) => setInteractiveMode((e.target as HTMLInputElement).checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                disabled={isExecuting || isPaused}
              />
              <label htmlFor="interactive-mode" className="text-sm text-gray-300">
                Interactive Mode
              </label>
              <span className="text-xs text-gray-500">
                (Allow user prompts during execution)
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRunScript}
                disabled={!parameterInput.trim() || isExecuting || isPaused || !isConnected}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                title={!isConnected ? 'Connection required to run scripts' : ''}
              >
                {isExecuting ? 'Running...' : 'Run Script'}
              </button>
              <button
                onClick={handleCancel}
                disabled={!isExecuting && !isPaused}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Interactive Prompt Section */}
          {isPaused && currentPrompt && (
            <div className="bg-yellow-900 border border-yellow-600 rounded-md p-4">
              <h3 className="text-yellow-200 font-medium mb-2">Interactive Prompt</h3>
              <p className="text-yellow-100 mb-3">{currentPrompt}</p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userResponse}
                  onChange={(e) => setUserResponse((e.target as HTMLInputElement).value)}
                  placeholder="Enter your response..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleUserResponseSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleUserResponseSubmit}
                  disabled={!userResponse.trim()}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {/* Output Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Execution Output
            </label>
            <div
              data-testid="execution-output"
              className="flex-1 bg-gray-900 border border-gray-600 rounded-md p-3 overflow-y-auto font-mono text-sm text-gray-300"
            >
              {executionOutput || (
                <div className="text-gray-500 italic">
                  Execution output will appear here when you run the script...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

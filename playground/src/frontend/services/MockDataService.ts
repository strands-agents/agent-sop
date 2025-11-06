import { Message } from '../types';
import { conversationTemplates, scriptTemplates, responsePatterns } from './mockData';

export class MockDataService {
  private messages: Message[] = [];
  private currentScript: string = '';
  private conversationState: 'initial' | 'generating' | 'refining' = 'initial';

  async sendMessage(userMessage: string): Promise<Message> {
    // Add user message to history
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    this.messages.push(userMsg);

    // Simulate processing delay
    const delay = this.getResponseDelay(userMessage);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const agentResponse = this.generateAgentResponse(userMessage);
        this.messages.push(agentResponse);
        resolve(agentResponse);
      }, delay);
    });
  }

  getConversationHistory(): Message[] {
    return [...this.messages];
  }

  getCurrentScript(): string {
    return this.currentScript;
  }

  resetConversation(): void {
    this.messages = [];
    this.currentScript = '';
    this.conversationState = 'initial';
  }

  private getResponseDelay(message: string): number {
    // Simulate realistic response times
    if (message.includes('trigger timeout error')) return 5000; // Simulate timeout
    if (message.length > 100) return 2000; // Longer messages take more time
    return 1500; // Fixed delay for predictable testing
  }

  private generateAgentResponse(userMessage: string): Message {
    const message = userMessage.toLowerCase();
    let content: string;
    let shouldUpdateScript = false;

    // Handle special test cases
    if (message.includes('trigger timeout error')) {
      content = 'I apologize, but I encountered a timeout while processing your request. Please try again.';
    } else if (message.includes('generate invalid format')) {
      content = 'There seems to be an issue with the script format. Let me correct that for you.';
    } else if (message.trim() === '') {
      content = this.getRandomResponse(responsePatterns.help);
    } else if (this.isGreeting(message)) {
      content = this.getRandomResponse(responsePatterns.greetings);
      this.conversationState = 'initial';
    } else if (this.isScriptRequest(message)) {
      content = this.getRandomResponse(responsePatterns.scriptGeneration);
      shouldUpdateScript = true;
      this.conversationState = 'generating';
    } else if (this.isRefinementRequest(message)) {
      content = this.getRandomResponse(responsePatterns.refinement);
      shouldUpdateScript = true;
      this.conversationState = 'refining';
    } else {
      // Default response based on current state
      if (this.conversationState === 'initial') {
        content = this.getRandomResponse(responsePatterns.greetings);
      } else {
        content = this.getRandomResponse(responsePatterns.refinement);
        shouldUpdateScript = true;
      }
    }

    // Update script if needed
    if (shouldUpdateScript) {
      this.updateScript(userMessage);
    }

    return {
      id: `agent-${Date.now()}`,
      role: 'agent',
      content,
      timestamp: new Date()
    };
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hello', 'hi', 'hey', 'start', 'begin'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private isScriptRequest(message: string): boolean {
    const scriptKeywords = ['create', 'generate', 'build', 'make', 'script', 'automation', 'workflow'];
    return scriptKeywords.some(keyword => message.includes(keyword));
  }

  private isRefinementRequest(message: string): boolean {
    const refinementKeywords = ['add', 'modify', 'change', 'update', 'improve', 'enhance', 'include'];
    return refinementKeywords.some(keyword => message.includes(keyword)) && this.currentScript !== '';
  }

  private updateScript(userMessage: string): void {
    const message = userMessage.toLowerCase();
    
    // Determine which script template to use based on message content
    if (message.includes('file') || message.includes('read') || message.includes('processor')) {
      this.currentScript = this.generateScriptVariation(scriptTemplates[0], userMessage);
    } else if (message.includes('api') || message.includes('http') || message.includes('client')) {
      this.currentScript = this.generateScriptVariation(scriptTemplates[1], userMessage);
    } else if (message.includes('log') || message.includes('analyzer')) {
      this.currentScript = this.generateLogAnalyzerScript(userMessage);
    } else if (this.currentScript === '') {
      // Default to file reader for generic requests
      this.currentScript = this.generateScriptVariation(scriptTemplates[0], userMessage);
    } else {
      // Refine existing script
      this.currentScript = this.refineExistingScript(this.currentScript, userMessage);
    }
  }

  private generateScriptVariation(template: any, userMessage: string): string {
    let script = template.content;
    const message = userMessage.toLowerCase();

    // Generate title based on user request
    let title = this.generateScriptTitle(userMessage);
    script = script.replace(/^# .+$/m, `# ${title}`);

    // Customize script based on user request
    if (message.includes('error') || message.includes('handling')) {
      script = script.replace(
        '- You SHOULD validate file permissions',
        '- You SHOULD validate file permissions\n- You MUST implement comprehensive error handling'
      );
    }

    if (message.includes('parameter') || message.includes('validation')) {
      script = script.replace(
        '### 1. Validate Input Parameters',
        '### 1. Validate Input Parameters\nPerform comprehensive parameter validation with detailed error messages.'
      );
    }

    if (message.includes('timeout') && template.name === 'API Client') {
      script = script.replace(
        '- **timeout** (optional, default: 30): Request timeout in seconds',
        '- **timeout** (optional, default: 30): Request timeout in seconds\n- **retry_count** (optional, default: 3): Number of retry attempts'
      );
    }

    return script;
  }

  private generateLogAnalyzerScript(userMessage: string): string {
    const title = this.generateScriptTitle(userMessage);
    return `# ${title}

## Overview
A comprehensive log analysis script that processes log files to identify patterns, errors, and anomalies.

## Parameters
- **log_file_path** (required): Path to the log file to analyze
- **error_patterns** (optional): Custom error patterns to search for
- **output_format** (optional, default: "json"): Output format for results
- **max_lines** (optional, default: 10000): Maximum number of lines to process

## Steps

### 1. Validate Input Parameters
Verify that the log file path is provided and accessible.

**Constraints:**
- You MUST check that log_file_path parameter is not empty
- You MUST verify the log file exists before attempting to read
- You SHOULD validate file permissions and size

### 2. Parse Log Entries
Read and parse log entries with proper error handling.

**Constraints:**
- You MUST handle malformed log entries gracefully
- You MUST respect the max_lines limit
- You SHOULD detect common log formats automatically

### 3. Analyze Log Patterns
Analyze log entries for errors, warnings, and patterns.

**Constraints:**
- You MUST identify error and warning messages
- You MUST count occurrences of different log levels
- You SHOULD detect anomalous patterns

### 4. Generate Analysis Report
Create a comprehensive analysis report.

**Constraints:**
- You MUST return analysis results in the specified format
- You SHOULD include summary statistics
- You MAY provide recommendations based on findings`;
  }

  private generateScriptTitle(userMessage: string): string {
    const message = userMessage.toLowerCase();
    
    // Extract key terms and generate appropriate title
    if (message.includes('file') && message.includes('processor')) {
      return 'Create a file processor Agent Script';
    } else if (message.includes('log') && message.includes('analyzer')) {
      return 'Create a log analyzer script Agent Script';
    } else if (message.includes('file') || message.includes('read')) {
      return 'Create a file processor Agent Script';
    } else if (message.includes('api') || message.includes('http')) {
      return 'Create an API client Agent Script';
    } else {
      // Default title based on generic request
      return 'Create a file processor Agent Script';
    }
  }

  private refineExistingScript(currentScript: string, userMessage: string): string {
    const message = userMessage.toLowerCase();
    let refinedScript = currentScript;

    if (message.includes('error') || message.includes('handling')) {
      if (!refinedScript.includes('error handling')) {
        refinedScript = refinedScript.replace(
          '## Steps',
          '## Steps\n\n### Error Handling\nImplement comprehensive error handling throughout the script execution.'
        );
      }
    }

    if (message.includes('parameter')) {
      if (!refinedScript.includes('validation')) {
        refinedScript = refinedScript.replace(
          'Verify that the file path is provided and accessible.',
          'Verify that the file path is provided and accessible. Include comprehensive parameter validation.'
        );
      }
    }

    if (message.includes('logging') || message.includes('log')) {
      if (!refinedScript.includes('logging')) {
        refinedScript = refinedScript.replace(
          '- You MAY apply basic text processing if needed',
          '- You MAY apply basic text processing if needed\n- You SHOULD implement logging for debugging and monitoring'
        );
      }
    }

    return refinedScript;
  }

  private getRandomResponse(responses: string[]): string {
    // Use message content hash for deterministic selection in tests
    const index = this.messages.length % responses.length;
    return responses[index];
  }
}

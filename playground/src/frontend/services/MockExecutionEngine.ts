export enum ExecutionState {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface ExecutionScenario {
  type: 'simple' | 'complex' | 'interactive' | 'error' | 'long-running';
  steps: string[];
  duration: number;
  hasInteractivePrompts: boolean;
  errorRate: number;
}

export class MockExecutionEngine {
  private state: ExecutionState = ExecutionState.IDLE;
  private scenario: ExecutionScenario | null = null;
  private currentExecution: Promise<void> | null = null;
  private cancelled = false;
  private stateChangeListeners: ((state: ExecutionState) => void)[] = [];
  private outputListeners: ((output: string) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];
  private interactivePromptListeners: ((prompt: string) => void)[] = [];
  private userInputResolver: ((input: string) => void) | null = null;

  getState(): ExecutionState {
    return this.state;
  }

  getScenario(): ExecutionScenario | null {
    return this.scenario;
  }

  setScenario(scenario: ExecutionScenario): void {
    this.scenario = scenario;
  }

  onStateChange(listener: (state: ExecutionState) => void): void {
    this.stateChangeListeners.push(listener);
  }

  onOutput(listener: (output: string) => void): void {
    this.outputListeners.push(listener);
  }

  onError(listener: (error: string) => void): void {
    this.errorListeners.push(listener);
  }

  onInteractivePrompt(listener: (prompt: string) => void): void {
    this.interactivePromptListeners.push(listener);
  }

  private setState(newState: ExecutionState): void {
    this.state = newState;
    this.stateChangeListeners.forEach(listener => listener(newState));
  }

  private emitOutput(output: string): void {
    this.outputListeners.forEach(listener => listener(output));
  }

  private emitError(error: string): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  private emitInteractivePrompt(prompt: string): void {
    this.interactivePromptListeners.forEach(listener => listener(prompt));
  }

  async execute(input: string, interactiveMode: boolean): Promise<void> {
    if (this.state === ExecutionState.RUNNING) {
      throw new Error('Execution already in progress');
    }

    this.cancelled = false;
    this.setState(ExecutionState.RUNNING);

    try {
      if (this.scenario) {
        await this.executeScenario(this.scenario, input, interactiveMode);
      } else {
        await this.executeDefault(input, interactiveMode);
      }

      if (!this.cancelled) {
        this.setState(ExecutionState.COMPLETED);
      }
    } catch (error) {
      if (!this.cancelled) {
        this.setState(ExecutionState.ERROR);
        this.emitError(error instanceof Error ? error.message : String(error));
      }
    }
  }

  private async executeScenario(scenario: ExecutionScenario, input: string, interactiveMode: boolean): Promise<void> {
    this.emitOutput(`Starting ${scenario.type} script execution...\n`);
    await this.delay(200);

    if (this.cancelled) return;

    this.emitOutput(`Processing input: ${input}\n`);
    await this.delay(100); // Reduced delay for faster interactive prompt

    for (let i = 0; i < scenario.steps.length; i++) {
      if (this.cancelled) return;

      const step = scenario.steps[i];
      this.emitOutput(`Executing: ${step}\n`);

      // Check for error injection
      if (Math.random() < scenario.errorRate) {
        throw new Error(`Execution error at step: ${step}`);
      }

      // Check for interactive prompt
      if (scenario.hasInteractivePrompts && interactiveMode && step.includes('Interactive')) {
        await this.handleInteractivePrompt(`Please provide input for: ${step}`);
      }

      await this.delay(scenario.duration / scenario.steps.length);
    }

    if (!this.cancelled) {
      this.emitOutput(`${scenario.type} script execution completed successfully!\n`);
    }
  }

  private async executeDefault(input: string, interactiveMode: boolean): Promise<void> {
    this.emitOutput('Starting script execution...\n');
    await this.delay(500);

    if (this.cancelled) return;

    this.emitOutput('Initializing agent...\n');
    await this.delay(800);

    if (this.cancelled) return;

    this.emitOutput(`Processing parameters: ${input}\n`);
    await this.delay(600);

    if (this.cancelled) return;

    this.emitOutput('Executing script steps...\n');
    await this.delay(1000);

    if (this.cancelled) return;

    if (interactiveMode) {
      await this.handleInteractivePrompt('Do you want to continue with the next step? (yes/no)');
    }

    if (!this.cancelled) {
      this.emitOutput('Script execution completed successfully!\n');
    }
  }

  private async handleInteractivePrompt(prompt: string): Promise<void> {
    this.setState(ExecutionState.PAUSED);
    this.emitOutput(`\n🤖 ${prompt}\n`);
    this.emitInteractivePrompt(prompt);

    return new Promise<void>((resolve) => {
      this.userInputResolver = (input: string) => {
        this.emitOutput(`👤 User: ${input}\n`);
        this.setState(ExecutionState.RUNNING);
        this.userInputResolver = null;
        resolve();
      };
    });
  }

  provideUserInput(input: string): void {
    if (this.userInputResolver) {
      this.userInputResolver(input);
    }
  }

  cancel(): void {
    this.cancelled = true;
    if (this.state === ExecutionState.RUNNING || this.state === ExecutionState.PAUSED) {
      this.setState(ExecutionState.CANCELLED);
      this.emitOutput('\nExecution cancelled by user.\n');
    }
    if (this.userInputResolver) {
      this.userInputResolver('');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Predefined execution methods for different script types
  async executeSimpleScript(input: string): Promise<void> {
    const scenario: ExecutionScenario = {
      type: 'simple',
      steps: [
        'Validate parameters',
        'Process input data',
        'Generate output'
      ],
      duration: 1000,
      hasInteractivePrompts: false,
      errorRate: 0
    };

    this.setScenario(scenario);
    await this.execute(input, false);
  }

  async executeComplexScript(input: string): Promise<void> {
    const scenario: ExecutionScenario = {
      type: 'complex',
      steps: [
        'Initialize agent context',
        'Load tool definitions',
        'Parse complex parameters',
        'Execute reasoning loop',
        'Call external tools',
        'Process tool responses',
        'Generate final output'
      ],
      duration: 2500,
      hasInteractivePrompts: false,
      errorRate: 0
    };

    this.setScenario(scenario);
    await this.execute(input, false);
  }

  async executeLongRunningScript(input: string): Promise<void> {
    const scenario: ExecutionScenario = {
      type: 'long-running',
      steps: [
        'Initialize long-running process',
        'Process large dataset',
        'Perform complex calculations',
        'Generate intermediate results',
        'Validate outputs',
        'Finalize processing'
      ],
      duration: 3000,
      hasInteractivePrompts: false,
      errorRate: 0.05
    };

    this.setScenario(scenario);
    await this.execute(input, false);
  }
}

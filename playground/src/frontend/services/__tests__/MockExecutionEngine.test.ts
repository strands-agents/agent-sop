import { MockExecutionEngine, ExecutionState, ExecutionScenario } from '../MockExecutionEngine';

describe('MockExecutionEngine', () => {
  let engine: MockExecutionEngine;

  beforeEach(() => {
    engine = new MockExecutionEngine();
  });

  afterEach(() => {
    engine.cancel();
  });

  describe('Engine Creation and Configuration', () => {
    it('should initialize with idle state', () => {
      expect(engine.getState()).toBe(ExecutionState.IDLE);
    });

    it('should accept execution scenarios', () => {
      const scenario: ExecutionScenario = {
        type: 'simple',
        steps: ['Step 1', 'Step 2'],
        duration: 1000,
        hasInteractivePrompts: false,
        errorRate: 0
      };
      
      engine.setScenario(scenario);
      expect(engine.getScenario()).toEqual(scenario);
    });
  });

  describe('State Management', () => {
    it('should transition from idle to running', async () => {
      const stateChanges: ExecutionState[] = [];
      engine.onStateChange((state) => stateChanges.push(state));

      engine.execute('test input', false);
      expect(engine.getState()).toBe(ExecutionState.RUNNING);
    });

    it('should transition to completed on successful execution', async () => {
      const scenario: ExecutionScenario = {
        type: 'simple',
        steps: ['Quick step'],
        duration: 100,
        hasInteractivePrompts: false,
        errorRate: 0
      };

      engine.setScenario(scenario);
      
      const promise = engine.execute('test input', false);
      await promise;
      
      expect(engine.getState()).toBe(ExecutionState.COMPLETED);
    });

    it('should transition to cancelled when cancelled', () => {
      engine.execute('test input', false);
      engine.cancel();
      expect(engine.getState()).toBe(ExecutionState.CANCELLED);
    });
  });

  describe('Streaming Output', () => {
    it('should generate progressive output', async () => {
      const outputs: string[] = [];
      engine.onOutput((output) => outputs.push(output));

      const scenario: ExecutionScenario = {
        type: 'simple',
        steps: ['Step 1', 'Step 2'],
        duration: 200,
        hasInteractivePrompts: false,
        errorRate: 0
      };

      engine.setScenario(scenario);
      await engine.execute('test input', false);

      expect(outputs.length).toBeGreaterThan(2);
      expect(outputs[0]).toContain('Starting');
      expect(outputs[outputs.length - 1]).toContain('completed');
    });

    it('should include realistic timing between outputs', async () => {
      const timestamps: number[] = [];
      engine.onOutput(() => timestamps.push(Date.now()));

      const scenario: ExecutionScenario = {
        type: 'simple',
        steps: ['Step 1', 'Step 2'],
        duration: 300,
        hasInteractivePrompts: false,
        errorRate: 0
      };

      engine.setScenario(scenario);
      await engine.execute('test input', false);

      // Check that there are delays between outputs
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i] - timestamps[i-1]).toBeGreaterThan(50);
      }
    });
  });

  describe('Interactive Prompts', () => {
    it('should pause execution on interactive prompt', async () => {
      const scenario: ExecutionScenario = {
        type: 'interactive',
        steps: ['Interactive prompt'],
        duration: 300,
        hasInteractivePrompts: true,
        errorRate: 0
      };

      engine.setScenario(scenario);
      
      const executionPromise = engine.execute('test input', true);
      
      // Wait for interactive prompt
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(engine.getState()).toBe(ExecutionState.PAUSED);
      
      // Provide user input
      engine.provideUserInput('user response');
      
      await executionPromise;
      expect(engine.getState()).toBe(ExecutionState.COMPLETED);
    });

    it('should handle user input in interactive mode', async () => {
      let promptReceived = false;
      engine.onInteractivePrompt(() => {
        promptReceived = true;
      });

      const scenario: ExecutionScenario = {
        type: 'interactive',
        steps: ['Interactive step'],
        duration: 200,
        hasInteractivePrompts: true,
        errorRate: 0
      };

      engine.setScenario(scenario);
      
      const executionPromise = engine.execute('test input', true);
      
      await new Promise(resolve => setTimeout(resolve, 350));
      expect(promptReceived).toBe(true);
      
      engine.provideUserInput('test response');
      await executionPromise;
    });
  });

  describe('Error Scenarios', () => {
    it('should handle execution errors', async () => {
      const scenario: ExecutionScenario = {
        type: 'error',
        steps: ['Step 1', 'Error step'],
        duration: 200,
        hasInteractivePrompts: false,
        errorRate: 1.0 // 100% error rate
      };

      engine.setScenario(scenario);
      
      await engine.execute('test input', false);
      expect(engine.getState()).toBe(ExecutionState.ERROR);
    });

    it('should provide error messages', async () => {
      let errorMessage = '';
      engine.onError((message) => {
        errorMessage = message;
      });

      const scenario: ExecutionScenario = {
        type: 'error',
        steps: ['Error step'],
        duration: 100,
        hasInteractivePrompts: false,
        errorRate: 1.0
      };

      engine.setScenario(scenario);
      await engine.execute('test input', false);

      expect(errorMessage).toBeTruthy();
      expect(errorMessage).toContain('error');
    });
  });

  describe('Execution Scenarios', () => {
    it('should handle simple script execution', async () => {
      const outputs: string[] = [];
      engine.onOutput((output) => outputs.push(output));

      await engine.executeSimpleScript('test input');
      
      expect(outputs.some(output => output.includes('parameter'))).toBe(true);
      expect(outputs.some(output => output.includes('completed'))).toBe(true);
    });

    it('should handle complex script execution', async () => {
      const outputs: string[] = [];
      engine.onOutput((output) => outputs.push(output));

      await engine.executeComplexScript('test input');
      
      expect(outputs.some(output => output.includes('tool'))).toBe(true);
      expect(outputs.some(output => output.includes('reasoning'))).toBe(true);
    });

    it('should handle long running execution', async () => {
      const startTime = Date.now();
      await engine.executeLongRunningScript('test input');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeGreaterThan(500); // Should take some time
    });
  });

  describe('Cancellation', () => {
    it('should cancel running execution', async () => {
      const executionPromise = engine.execute('test input', false);
      
      setTimeout(() => engine.cancel(), 100);
      
      await executionPromise;
      expect(engine.getState()).toBe(ExecutionState.CANCELLED);
    });

    it('should clean up resources on cancellation', () => {
      engine.execute('test input', false);
      engine.cancel();
      
      // Should be able to start new execution after cancellation
      expect(() => engine.execute('new input', false)).not.toThrow();
    });
  });
});

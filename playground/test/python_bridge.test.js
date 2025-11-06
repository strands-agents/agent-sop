const { PythonBridge } = require('../src/python_bridge');
const { spawn } = require('child_process');
const EventEmitter = require('events');

// Mock child_process.spawn
jest.mock('child_process');

describe('PythonBridge', () => {
  let bridge;
  let mockProcess;

  beforeEach(() => {
    // Create mock process
    mockProcess = new EventEmitter();
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.stdin = {
      write: jest.fn(),
      end: jest.fn()
    };
    mockProcess.kill = jest.fn();
    mockProcess.pid = 12345;

    spawn.mockReturnValue(mockProcess);
    bridge = new PythonBridge();
  });

  afterEach(() => {
    jest.clearAllMocks();
    if (bridge) {
      bridge.stop();
    }
  });

  describe('Process Management', () => {
    test('should start Python service successfully', async () => {
      const startPromise = bridge.start();
      
      // Simulate successful startup
      process.nextTick(() => {
        mockProcess.stdout.emit('data', 'Service started\n');
      });

      const result = await startPromise;
      expect(result).toBe(true);
      expect(spawn).toHaveBeenCalledWith(expect.stringContaining('python'), expect.any(Array), expect.any(Object));
      expect(bridge.isRunning()).toBe(true);
    });

    test('should handle Python service startup failure', async () => {
      const startPromise = bridge.start();
      
      // Simulate startup failure
      process.nextTick(() => {
        mockProcess.emit('error', new Error('Python not found'));
      });

      const result = await startPromise;
      expect(result).toBe(false);
      expect(bridge.isRunning()).toBe(false);
    });

    test('should stop service gracefully', async () => {
      const startPromise = bridge.start();
      process.nextTick(() => {
        mockProcess.stdout.emit('data', 'Service started\n');
      });
      
      await startPromise;
      
      bridge.stop();
      
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      expect(bridge.isRunning()).toBe(false);
    });
  });

  describe('Message Protocol', () => {
    beforeEach(async () => {
      const startPromise = bridge.start();
      process.nextTick(() => {
        mockProcess.stdout.emit('data', 'Service started\n');
      });
      await startPromise;
    });

    test('should send message and receive response', async () => {
      const message = { type: 'agent_chat', data: { message: 'Hello' } };
      const responsePromise = bridge.sendMessage(message);
      
      // Get the sent message ID and simulate response
      process.nextTick(() => {
        const sentMessage = JSON.parse(mockProcess.stdin.write.mock.calls[0][0]);
        const response = {
          id: sentMessage.id,
          type: 'response',
          data: { response: 'Hello back' },
          success: true
        };
        mockProcess.stdout.emit('data', JSON.stringify(response) + '\n');
      });

      const result = await responsePromise;
      expect(result.success).toBe(true);
      expect(result.data.response).toBe('Hello back');
    });

    test('should handle message timeout', async () => {
      const message = { type: 'agent_chat', data: { message: 'Hello' } };
      
      // Set short timeout for test
      bridge.messageTimeout = 100;
      
      await expect(bridge.sendMessage(message)).rejects.toThrow('Message timeout');
    });
  });

  describe('Health Monitoring', () => {
    test('should report healthy status when running', async () => {
      const startPromise = bridge.start();
      process.nextTick(() => {
        mockProcess.stdout.emit('data', 'Service started\n');
      });
      await startPromise;
      
      const health = bridge.getHealth();
      expect(health.status).toBe('healthy');
      expect(health.pid).toBe(12345);
    });

    test('should report unhealthy status when stopped', () => {
      const health = bridge.getHealth();
      expect(health.status).toBe('stopped');
      expect(health.pid).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should handle Python service stderr output', async () => {
      const startPromise = bridge.start();
      process.nextTick(() => {
        mockProcess.stdout.emit('data', 'Service started\n');
      });
      await startPromise;
      
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockProcess.stderr.emit('data', 'Python error message\n');
      
      expect(errorSpy).toHaveBeenCalledWith(
        'Python service error:', 'Python error message'
      );
      
      errorSpy.mockRestore();
    });
  });
});

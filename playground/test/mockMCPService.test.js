const MockMCPService = require('../src/services/MockMCPService');

describe('MockMCPService', () => {
  let mockService;

  beforeEach(() => {
    mockService = new MockMCPService();
  });

  describe('testConnection', () => {
    test('should return success for valid stdio server', async () => {
      const serverConfig = {
        id: 'test-stdio',
        name: 'Test Stdio Server',
        type: 'stdio',
        config: { command: 'node', args: ['server.js'] }
      };

      // Mock Math.random to ensure no random failure
      const originalRandom = Math.random;
      Math.random = () => 0.1; // Above 0.05 threshold

      const result = await mockService.testConnection(serverConfig);
      
      // Restore Math.random
      Math.random = originalRandom;
      
      expect(result.connected).toBe(true);
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    test('should return success for valid HTTP server', async () => {
      // Mock Math.random to ensure no random failure
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.1); // Above 0.05 threshold

      const serverConfig = {
        id: 'test-http',
        name: 'Test HTTP Server',
        type: 'http',
        config: { url: 'http://localhost:8000/mcp' }
      };

      const result = await mockService.testConnection(serverConfig);
      
      expect(result.connected).toBe(true);
      expect(result.tools).toBeDefined();
      expect(result.tools.length).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();

      // Restore original Math.random
      Math.random = originalRandom;
    });

    test('should return error for invalid stdio command', async () => {
      const serverConfig = {
        id: 'test-invalid',
        name: 'Invalid Server',
        type: 'stdio',
        config: { command: 'nonexistent-command' }
      };

      const result = await mockService.testConnection(serverConfig);
      
      expect(result.connected).toBe(false);
      expect(result.error).toContain('Command not found');
      expect(result.tools).toBeUndefined();
    });

    test('should return error for unreachable HTTP server', async () => {
      const serverConfig = {
        id: 'test-unreachable',
        name: 'Unreachable Server',
        type: 'http',
        config: { url: 'http://nonexistent.example.com/mcp' }
      };

      const result = await mockService.testConnection(serverConfig);
      
      expect(result.connected).toBe(false);
      expect(result.error).toContain('Connection failed');
      expect(result.tools).toBeUndefined();
    });

    test('should simulate realistic connection delay', async () => {
      const serverConfig = {
        id: 'test-delay',
        name: 'Test Server',
        type: 'stdio',
        config: { command: 'python', args: ['server.py'] }
      };

      const startTime = Date.now();
      await mockService.testConnection(serverConfig);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThan(100); // At least 100ms delay
    });
  });

  describe('getAvailableTools', () => {
    test('should return file system tools for file server', () => {
      const tools = mockService.getAvailableTools('file-server');
      
      expect(tools).toContainEqual(
        expect.objectContaining({ name: 'read_file' })
      );
      expect(tools).toContainEqual(
        expect.objectContaining({ name: 'write_file' })
      );
    });

    test('should return web tools for web server', () => {
      const tools = mockService.getAvailableTools('web-server');
      
      expect(tools).toContainEqual(
        expect.objectContaining({ name: 'fetch_url' })
      );
      expect(tools).toContainEqual(
        expect.objectContaining({ name: 'search_web' })
      );
    });

    test('should return empty array for unknown server', () => {
      const tools = mockService.getAvailableTools('unknown-server');
      expect(tools).toEqual([]);
    });
  });

  describe('generateMockError', () => {
    test('should generate appropriate error for command not found', () => {
      const error = mockService.generateMockError('command_not_found', 'nonexistent-cmd');
      expect(error).toContain('Command not found');
      expect(error).toContain('nonexistent-cmd');
    });

    test('should generate appropriate error for connection timeout', () => {
      const error = mockService.generateMockError('timeout', 'http://example.com');
      expect(error).toContain('Connection timeout');
      expect(error).toContain('http://example.com');
    });
  });

  describe('simulateLatency', () => {
    test('should add realistic delay', async () => {
      const startTime = Date.now();
      await mockService.simulateLatency();
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThan(50);
      expect(endTime - startTime).toBeLessThan(2000);
    });
  });
});

class MockMCPService {
  constructor() {
    this.mockServers = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    // Predefined mock tool sets for different server types
    this.toolSets = {
      'file-server': [
        {
          name: 'read_file',
          description: 'Read contents of a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to read' }
            },
            required: ['path']
          }
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to write' },
              content: { type: 'string', description: 'Content to write' }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'list_directory',
          description: 'List files in a directory',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to list' }
            },
            required: ['path']
          }
        }
      ],
      'web-server': [
        {
          name: 'fetch_url',
          description: 'Fetch content from a URL',
          inputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to fetch' },
              headers: { type: 'object', description: 'Optional headers' }
            },
            required: ['url']
          }
        },
        {
          name: 'search_web',
          description: 'Search the web for information',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Number of results' }
            },
            required: ['query']
          }
        }
      ],
      'database-server': [
        {
          name: 'query_db',
          description: 'Execute a database query',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'SQL query to execute' },
              params: { type: 'array', description: 'Query parameters' }
            },
            required: ['query']
          }
        },
        {
          name: 'insert_record',
          description: 'Insert a record into the database',
          inputSchema: {
            type: 'object',
            properties: {
              table: { type: 'string', description: 'Table name' },
              data: { type: 'object', description: 'Record data' }
            },
            required: ['table', 'data']
          }
        }
      ],
      'utility-server': [
        {
          name: 'calculate',
          description: 'Perform mathematical calculations',
          inputSchema: {
            type: 'object',
            properties: {
              expression: { type: 'string', description: 'Mathematical expression' }
            },
            required: ['expression']
          }
        },
        {
          name: 'format_text',
          description: 'Format text according to specified rules',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to format' },
              format: { type: 'string', description: 'Format type' }
            },
            required: ['text', 'format']
          }
        }
      ]
    };
  }

  async testConnection(serverConfig) {
    await this.simulateLatency();

    // Simulate different failure scenarios based on server configuration
    if (this.shouldSimulateFailure(serverConfig)) {
      return this.generateFailureResponse(serverConfig);
    }

    // Generate success response with appropriate tools
    const toolSet = this.determineToolSet(serverConfig);
    const tools = this.getAvailableTools(toolSet);

    return {
      connected: true,
      tools,
      latency: Math.floor(Math.random() * 200) + 50 // 50-250ms
    };
  }

  shouldSimulateFailure(serverConfig) {
    const { type, config } = serverConfig;

    // Simulate command not found for stdio servers
    if (type === 'stdio' && config.command) {
      const invalidCommands = ['nonexistent-command', 'invalid-cmd', 'missing-exe'];
      if (invalidCommands.includes(config.command)) {
        return true;
      }
    }

    // Simulate connection failures for HTTP servers
    if (type === 'http' && config.url) {
      const unreachableHosts = ['nonexistent.example.com', 'unreachable.local', 'invalid-host'];
      if (unreachableHosts.some(host => config.url.includes(host))) {
        return true;
      }
    }

    // Random failure simulation (5% chance)
    return Math.random() < 0.05;
  }

  generateFailureResponse(serverConfig) {
    const { type, config } = serverConfig;
    let errorType, errorContext;

    if (type === 'stdio') {
      if (config.command && ['nonexistent-command', 'invalid-cmd', 'missing-exe'].includes(config.command)) {
        errorType = 'command_not_found';
        errorContext = config.command;
      } else {
        errorType = 'permission_denied';
        errorContext = config.command;
      }
    } else if (type === 'http') {
      if (config.url && ['nonexistent.example.com', 'unreachable.local', 'invalid-host'].some(host => config.url.includes(host))) {
        errorType = 'connection_failed';
        errorContext = config.url;
      } else {
        errorType = 'timeout';
        errorContext = config.url;
      }
    }

    return {
      connected: false,
      error: this.generateMockError(errorType, errorContext)
    };
  }

  determineToolSet(serverConfig) {
    const { name, config } = serverConfig;
    
    // Determine tool set based on server name or configuration
    if (name.toLowerCase().includes('file') || (config.command && config.command.includes('file'))) {
      return 'file-server';
    } else if (name.toLowerCase().includes('web') || (config.url && config.url.includes('web'))) {
      return 'web-server';
    } else if (name.toLowerCase().includes('database') || name.toLowerCase().includes('db')) {
      return 'database-server';
    } else {
      return 'utility-server';
    }
  }

  getAvailableTools(serverType) {
    return this.toolSets[serverType] || [];
  }

  generateMockError(errorType, context = '') {
    const errorMessages = {
      command_not_found: `Command not found: '${context}'. Please check that the command exists and is in your PATH.`,
      permission_denied: `Permission denied when executing '${context}'. Check file permissions and user access rights.`,
      connection_failed: `Connection failed to '${context}'. The server may be unreachable or the URL may be incorrect.`,
      timeout: `Connection timeout when connecting to '${context}'. The server may be overloaded or network connectivity issues exist.`,
      authentication_failed: `Authentication failed for '${context}'. Please check your credentials and access permissions.`,
      invalid_config: `Invalid configuration for server '${context}'. Please verify all required fields are provided.`
    };

    return errorMessages[errorType] || `Unknown error occurred with '${context}'.`;
  }

  async simulateLatency() {
    // Simulate realistic network/process latency (100-1500ms)
    const delay = Math.floor(Math.random() * 1400) + 100;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Additional methods for state management
  getServerState(serverId) {
    return this.mockServers.get(serverId) || { connected: false };
  }

  setServerState(serverId, state) {
    this.mockServers.set(serverId, state);
  }

  disconnectServer(serverId) {
    this.mockServers.delete(serverId);
  }

  getAllConnectedServers() {
    const connected = [];
    for (const [id, state] of this.mockServers.entries()) {
      if (state.connected) {
        connected.push({ id, ...state });
      }
    }
    return connected;
  }
}

module.exports = MockMCPService;

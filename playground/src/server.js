const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { execSync, spawn } = require('child_process');
const { createServer } = require('http');
const MockMCPService = require('./services/MockMCPService');
const { PythonBridge } = require('./python_bridge');
const { createAppWithWebSocket } = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const mockMCPService = new MockMCPService();
const pythonBridge = new PythonBridge();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// JSON error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      error: 'Invalid JSON format',
      details: error.message
    });
  }
  next(error);
});

// API Routes

// Chat endpoint - routes to Python service
app.post('/api/chat', async (req, res) => {
  try {
    if (!pythonBridge.isRunning()) {
      return res.status(503).json({ 
        error: 'Python service unavailable',
        details: 'Agent service is not running'
      });
    }
    
    const response = await pythonBridge.sendMessage({
      type: 'agent_chat',
      data: req.body
    });
    
    res.json(response);
  } catch (error) {
    console.error('Chat API error:', error.message);
    res.status(500).json({ 
      error: error.message,
      type: 'chat_error'
    });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  const health = pythonBridge.getHealth();
  res.json({
    ...health,
    timestamp: new Date().toISOString(),
    server: 'running'
  });
});

// MCP configuration endpoint
app.post('/api/mcp/config', async (req, res) => {
  try {
    if (!pythonBridge.isRunning()) {
      return res.status(503).json({ 
        error: 'Python service unavailable',
        details: 'Cannot configure MCP servers while agent service is down'
      });
    }
    
    const response = await pythonBridge.sendMessage({
      type: 'mcp_config',
      data: req.body
    });
    
    res.json(response);
  } catch (error) {
    console.error('MCP config API error:', error.message);
    res.status(500).json({ 
      error: error.message,
      type: 'mcp_config_error'
    });
  }
});

// Script execution endpoint
app.post('/api/execute', async (req, res) => {
  try {
    if (!pythonBridge.isRunning()) {
      return res.status(503).json({ 
        error: 'Python service unavailable',
        details: 'Cannot execute scripts while agent service is down'
      });
    }
    
    const response = await pythonBridge.sendMessage({
      type: 'script_execute',
      data: req.body
    });
    
    res.json(response);
  } catch (error) {
    console.error('Script execution API error:', error.message);
    res.status(500).json({ 
      error: error.message,
      type: 'execution_error'
    });
  }
});

// Mock MCP endpoints (fallback for development)
app.get('/api/mcp/servers', (req, res) => {
  res.json(mockMCPService.getServers());
});

app.post('/api/mcp/servers', (req, res) => {
  try {
    const server = mockMCPService.addServer(req.body);
    res.json(server);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/mcp/servers/:id', (req, res) => {
  try {
    mockMCPService.removeServer(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  // Stop Python service
  if (pythonBridge) {
    pythonBridge.stop();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  
  // Stop Python service
  if (pythonBridge) {
    pythonBridge.stop();
  }
  
  process.exit(0);
});

// Start server
async function installPythonDependencies() {
  try {
    const pythonDir = path.join(__dirname, 'python');
    const requirementsPath = path.join(pythonDir, 'requirements.txt');
    const venvPath = path.join(pythonDir, 'venv');
    
    if (!fs.existsSync(requirementsPath)) {
      console.log('⚠️  No requirements.txt found, skipping Python dependency installation');
      return true;
    }
    
    console.log('📦 Checking Python dependencies...');
    
    // Check if virtual environment exists
    if (!fs.existsSync(venvPath)) {
      console.log('🔧 Creating Python virtual environment...');
      execSync('python3 -m venv venv', {
        cwd: pythonDir,
        stdio: 'inherit'
      });
    }
    
    // Check if dependencies are installed in venv
    const pythonExe = process.platform === 'win32' 
      ? path.join(venvPath, 'Scripts', 'python.exe')
      : path.join(venvPath, 'bin', 'python');
    
    try {
      execSync(`"${pythonExe}" -c "import mcp"`, { 
        cwd: pythonDir,
        stdio: 'pipe'
      });
      console.log('✅ Python dependencies already installed');
      return true;
    } catch (error) {
      // Dependencies not installed, install them in venv
      console.log('📦 Installing Python dependencies in virtual environment...');
      
      const pipExe = process.platform === 'win32'
        ? path.join(venvPath, 'Scripts', 'pip.exe') 
        : path.join(venvPath, 'bin', 'pip');
      
      try {
        execSync(`"${pipExe}" install -r requirements.txt`, {
          cwd: pythonDir,
          stdio: 'inherit',
          timeout: 120000 // 2 minute timeout
        });
        
        console.log('✅ Python dependencies installed successfully');
        return true;
      } catch (installError) {
        console.error('❌ Failed to install Python dependencies:', installError.message);
        console.log('💡 Try manually running: cd playground/src/python && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Error setting up Python environment:', error.message);
    console.log('⚠️  Continuing without Python dependencies - some features may not work');
    return false;
  }
}

async function startServer() {
  try {
    // Install Python dependencies first
    await installPythonDependencies();
    
    // Start Python service
    console.log('🐍 Starting Python service...');
    const pythonStarted = await pythonBridge.start();
    
    if (pythonStarted) {
      console.log('✅ Python service started successfully');
    } else {
      console.log('⚠️  Python service failed to start, continuing with mock services only');
    }
    
    // Start Express server with WebSocket support
    const httpServer = createServer(app);
    const { wss, messageRouter } = createAppWithWebSocket(httpServer, pythonBridge);
    
    const server = httpServer.listen(PORT, async () => {
      const url = `http://localhost:${PORT}`;
      console.log(`🚀 Server running on ${url}`);
      console.log(`🔌 WebSocket server: Available`);
      console.log(`📊 Health check: ${url}/api/health`);
      
      if (pythonStarted) {
        console.log('🤖 Agent service: Available');
      } else {
        console.log('🤖 Agent service: Unavailable (using mock services)');
      }
      
      // Open browser
      try {
        const { default: open } = await import('open');
        await open(url);
      } catch (openErr) {
        console.log('ℹ️  Could not open browser automatically. Please visit:', url);
      }
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Export for CLI usage
module.exports = { startServer };

// Start server if called directly
if (require.main === module) {
  startServer();
}

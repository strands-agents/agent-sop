const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class PythonBridge {
  constructor(options = {}) {
    this.pythonProcess = null;
    this.isServiceRunning = false;
    this.pendingMessages = new Map();
    this.messageTimeout = options.timeout || 30000; // 30 seconds default
    this.restartAttempts = 0;
    this.maxRestartAttempts = options.maxRestartAttempts || 3;
    this.restartDelay = options.restartDelay || 5000; // 5 seconds
    this.serviceStatus = 'stopped';
    this.lastError = null;
    
    // Bind methods to preserve context
    this.handleProcessExit = this.handleProcessExit.bind(this);
    this.handleProcessError = this.handleProcessError.bind(this);
    this.handleStdoutData = this.handleStdoutData.bind(this);
    this.handleStderrData = this.handleStderrData.bind(this);
  }

  async start() {
    if (this.isServiceRunning) {
      console.log('Python service is already running');
      return true;
    }

    const pythonServicePath = path.join(__dirname, 'python', 'start_service.py');
    
    if (!fs.existsSync(pythonServicePath)) {
      console.error('Python service not found at:', pythonServicePath);
      this.serviceStatus = 'failed';
      this.lastError = 'Python service file not found';
      return false;
    }

    try {
      const venvPath = path.join(__dirname, 'python', 'venv');
      
      // Use venv python if available, otherwise fall back to system python
      let pythonExe = 'python3';
      if (fs.existsSync(venvPath)) {
        pythonExe = process.platform === 'win32' 
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
      }
      
      console.log('Starting Python service...');
      
      this.pythonProcess = spawn(pythonExe, [pythonServicePath], {
        env: {
          ...process.env,
          PYTHON_SERVICE_PORT: process.env.PYTHON_SERVICE_PORT || '8001',
          PYTHON_SERVICE_HOST: 'localhost'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Set up event handlers
      this.pythonProcess.on('exit', this.handleProcessExit);
      this.pythonProcess.on('error', this.handleProcessError);
      this.pythonProcess.stdout.on('data', this.handleStdoutData);
      this.pythonProcess.stderr.on('data', this.handleStderrData);

      // Wait for service to start
      return new Promise((resolve) => {
        const startupTimeout = setTimeout(() => {
          console.error('Python service startup timeout');
          this.serviceStatus = 'failed';
          this.lastError = 'Startup timeout';
          resolve(false);
        }, 10000);

        const checkStartup = (data) => {
          const output = data.toString();
          if (output.includes('Service started')) {
            clearTimeout(startupTimeout);
            this.pythonProcess.stdout.removeListener('data', checkStartup);
            this.isServiceRunning = true;
            this.serviceStatus = 'healthy';
            this.restartAttempts = 0;
            this.lastError = null;
            console.log('Python service started successfully');
            resolve(true);
          }
        };

        const handleError = (error) => {
          clearTimeout(startupTimeout);
          this.serviceStatus = 'failed';
          this.lastError = error.message;
          this.isServiceRunning = false;
          resolve(false);
        };

        this.pythonProcess.stdout.on('data', checkStartup);
        this.pythonProcess.once('error', handleError);
      });
    } catch (error) {
      console.error('Failed to start Python service:', error.message);
      this.serviceStatus = 'failed';
      this.lastError = error.message;
      return false;
    }
  }

  stop() {
    if (!this.pythonProcess) {
      return;
    }

    console.log('Stopping Python service...');
    this.isServiceRunning = false;
    this.serviceStatus = 'stopped';
    
    // Reject all pending messages
    this.pendingMessages.forEach((resolve, id) => {
      resolve({ success: false, error: 'Service stopped' });
    });
    this.pendingMessages.clear();

    // Kill the process
    this.pythonProcess.kill('SIGTERM');
    
    // Force kill after timeout
    setTimeout(() => {
      if (this.pythonProcess && !this.pythonProcess.killed) {
        this.pythonProcess.kill('SIGKILL');
      }
    }, 5000);

    this.pythonProcess = null;
  }

  async restart() {
    console.log('Restarting Python service...');
    this.stop();
    
    // Wait before restarting
    await new Promise(resolve => setTimeout(resolve, this.restartDelay));
    
    this.restartAttempts++;
    if (this.restartAttempts > this.maxRestartAttempts) {
      console.error('Max restart attempts reached, giving up');
      this.serviceStatus = 'failed';
      this.lastError = 'Max restart attempts exceeded';
      return false;
    }

    return await this.start();
  }

  async sendMessage(message) {
    if (!this.isServiceRunning || !this.pythonProcess) {
      throw new Error('Python service is not running');
    }

    const messageId = crypto.randomUUID();
    const fullMessage = {
      id: messageId,
      timestamp: new Date().toISOString(),
      ...message
    };

    return new Promise((resolve, reject) => {
      // Set up timeout
      const timeout = setTimeout(() => {
        this.pendingMessages.delete(messageId);
        reject(new Error('Message timeout'));
      }, this.messageTimeout);

      // Store pending message
      this.pendingMessages.set(messageId, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });

      // Send message to Python service
      try {
        const messageJson = JSON.stringify(fullMessage) + '\n';
        this.pythonProcess.stdin.write(messageJson);
      } catch (error) {
        clearTimeout(timeout);
        this.pendingMessages.delete(messageId);
        reject(new Error(`Failed to send message: ${error.message}`));
      }
    });
  }

  isRunning() {
    return this.isServiceRunning && this.pythonProcess && !this.pythonProcess.killed;
  }

  getHealth() {
    return {
      status: this.serviceStatus,
      pid: this.pythonProcess ? this.pythonProcess.pid : null,
      uptime: this.isServiceRunning ? process.uptime() : 0,
      restartAttempts: this.restartAttempts,
      lastError: this.lastError,
      pendingMessages: this.pendingMessages.size
    };
  }

  handleProcessExit(code, signal) {
    console.log(`Python service exited with code ${code}, signal ${signal}`);
    this.isServiceRunning = false;
    this.serviceStatus = code === 0 ? 'stopped' : 'failed';
    
    if (code !== 0) {
      this.lastError = `Process exited with code ${code}`;
      
      // Attempt restart if not intentionally stopped
      if (this.restartAttempts < this.maxRestartAttempts) {
        console.log('Attempting to restart Python service...');
        setTimeout(() => this.restart(), this.restartDelay);
      }
    }

    // Reject all pending messages
    this.pendingMessages.forEach((resolve) => {
      resolve({ success: false, error: 'Service disconnected' });
    });
    this.pendingMessages.clear();
  }

  handleProcessError(error) {
    console.error('Python service error:', error.message);
    this.serviceStatus = 'failed';
    this.lastError = error.message;
    this.isServiceRunning = false;
  }

  handleStdoutData(data) {
    const output = data.toString();
    
    // Try to parse JSON responses
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        
        if (response.id && this.pendingMessages.has(response.id)) {
          const resolve = this.pendingMessages.get(response.id);
          this.pendingMessages.delete(response.id);
          resolve(response);
        } else {
          // Log non-response messages
          console.log('Python service:', line);
        }
      } catch (error) {
        // Not JSON, treat as log output
        console.log('Python service:', line);
      }
    }
  }

  handleStderrData(data) {
    const error = data.toString().trim();
    console.error('Python service error:', error);
    
    // Update service status if critical error
    if (error.includes('CRITICAL') || error.includes('FATAL')) {
      this.serviceStatus = 'failed';
      this.lastError = error;
    }
  }
}

module.exports = { PythonBridge };

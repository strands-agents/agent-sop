#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function startPlayground() {
  try {
    console.log('🚀 Starting Agent Script Playground...');
    
    // Check if dist directory exists, if not build the frontend
    const distPath = path.join(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      console.log('📦 Building frontend...');
      try {
        execSync('npm run build', { 
          cwd: path.join(__dirname, '..'), 
          stdio: 'inherit' 
        });
        console.log('✅ Frontend built successfully');
      } catch (buildError) {
        console.error('❌ Failed to build frontend:', buildError.message);
        process.exit(1);
      }
    }
    
    // Use the startServer function from server.js
    const { startServer } = require('../src/server.js');
    const server = await startServer();
    
    // Graceful shutdown
    let shutdownInProgress = false;
    process.on('SIGINT', () => {
      if (shutdownInProgress) return;
      shutdownInProgress = true;
      
      console.log('\n🛑 Shutting down Agent Script Playground...');
      
      server.closeAllConnections?.();
      
      server.close((err) => {
        if (err) {
          console.log('❌ Error during server close:', err.message);
        } else {
          console.log('✅ Server closed');
        }
        process.exit(0);
      });
      
      setTimeout(() => {
        console.log('⚠️  Force closing...');
        process.exit(1);
      }, 1000);
    });

  } catch (error) {
    console.error('❌ Failed to start Agent Script Playground:', error);
    process.exit(1);
  }
}

startPlayground();

/**
 * @jest-environment node
 */
const WebSocket = require('ws');
const { createServer } = require('http');
const express = require('express');
const { createAppWithWebSocket } = require('../src/websocket');

describe('WebSocket Server (Node Environment)', () => {
  let server;
  let app;
  let httpServer;
  let wss;
  let port;

  beforeEach((done) => {
    // Create app and server for testing
    app = express();
    httpServer = createServer(app);
    
    // Create WebSocket server
    ({ wss } = createAppWithWebSocket(httpServer));
    
    // Start server on random port
    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterEach((done) => {
    if (wss) {
      wss.close(() => {
        if (httpServer) {
          httpServer.close(done);
        } else {
          done();
        }
      });
    } else if (httpServer) {
      httpServer.close(done);
    } else {
      done();
    }
  });

  describe('WebSocket Server Creation', () => {
    test('should create WebSocket server that listens on same port as HTTP server', (done) => {
      expect(wss).toBeDefined();
      expect(wss.address()).toBeTruthy();
      done();
    });

    test('should accept WebSocket connections', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      ws.on('open', () => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
        done();
      });

      ws.on('error', done);
    });
  });

  describe('Client Connection Handling', () => {
    test('should handle client connections and log them', (done) => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      ws.on('open', () => {
        // Give time for connection logging
        setTimeout(() => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'WebSocket client connected from:', expect.any(String)
          );
          consoleSpy.mockRestore();
          ws.close();
          done();
        }, 10);
      });

      ws.on('error', done);
    });

    test('should track active connections', (done) => {
      const ws1 = new WebSocket(`ws://localhost:${port}`);
      const ws2 = new WebSocket(`ws://localhost:${port}`);
      
      let openCount = 0;
      const checkBothOpen = () => {
        openCount++;
        if (openCount === 2) {
          // Both connections should be tracked
          expect(wss.clients.size).toBe(2);
          ws1.close();
          ws2.close();
          done();
        }
      };

      ws1.on('open', checkBothOpen);
      ws2.on('open', checkBothOpen);
      ws1.on('error', done);
      ws2.on('error', done);
    });
  });

  describe('Message Reception', () => {
    test('should receive and process client messages', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      ws.on('open', () => {
        const testMessage = { type: 'test', data: 'hello' };
        ws.send(JSON.stringify(testMessage));
        
        // Give time for message processing
        setTimeout(() => {
          ws.close();
          done();
        }, 10);
      });

      ws.on('error', done);
    });

    test('should handle invalid JSON messages gracefully', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      ws.on('open', () => {
        ws.send('invalid json');
        
        // Connection should remain open after invalid message
        setTimeout(() => {
          expect(ws.readyState).toBe(WebSocket.OPEN);
          ws.close();
          done();
        }, 10);
      });

      ws.on('error', done);
    });
  });

  describe('Connection Cleanup', () => {
    test('should clean up connections on disconnect', (done) => {
      const ws = new WebSocket(`ws://localhost:${port}`);
      
      ws.on('open', () => {
        expect(wss.clients.size).toBe(1);
        ws.close();
      });

      ws.on('close', () => {
        // Give time for cleanup
        setTimeout(() => {
          expect(wss.clients.size).toBe(0);
          done();
        }, 10);
      });

      ws.on('error', done);
    });
  });
});

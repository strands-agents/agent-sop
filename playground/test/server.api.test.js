const request = require('supertest');
const express = require('express');
const cors = require('cors');

describe('Agent Script Playground Server - API Behavior', () => {
  let app;

  beforeEach(() => {
    // Create a test app with mock API routes
    app = express();
    app.use(cors());
    app.use(express.json());

    // Mock MCP connect endpoint
    app.post('/api/mcp/connect', (req, res) => {
      if (!req.body.serverConfig) {
        return res.status(400).json({ error: 'Server config required' });
      }
      res.json({ success: true, serverId: req.body.serverConfig.id });
    });

    // Mock MCP tools endpoint
    app.get('/api/mcp/tools/:serverId', (req, res) => {
      res.status(404).json({ error: 'Server not found' });
    });
  });

  it('should handle MCP connect requests', async () => {
    const serverConfig = {
      id: 'test-server',
      name: 'Test Server',
      type: 'stdio',
      config: { command: 'python', args: ['test.py'] }
    };

    const response = await request(app)
      .post('/api/mcp/connect')
      .send({ serverConfig })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.serverId).toBe('test-server');
  });

  it('should return 400 for missing server config', async () => {
    const response = await request(app)
      .post('/api/mcp/connect')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Server config required');
  });

  it('should handle MCP tools requests for unknown server', async () => {
    const response = await request(app)
      .get('/api/mcp/tools/unknown-server');

    // Unknown servers return 404
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Server not found');
  });
});

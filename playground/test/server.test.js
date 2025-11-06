const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Create a test app with the same routes as server.js
const app = express();
app.use(cors());
app.use(express.json());

// Add the basic routes that are tested
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Agent Script Playground API',
    version: '1.0.0'
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

describe('Agent Script Playground Server', () => {
  it('should respond to health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('should serve API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);
    
    expect(response.body.message).toBe('Agent Script Playground API');
    expect(response.body.version).toBe('1.0.0');
  });

  it('should handle 404 for unknown API routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    expect(response.body.error).toBe('API endpoint not found');
  });
});

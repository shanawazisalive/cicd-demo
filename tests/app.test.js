const request = require('supertest');
const app = require('../src/app');

describe('CI/CD Demo Application', () => {

  describe('GET /', () => {
    it('should return welcome message with endpoints list', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Welcome');
      expect(res.body).toHaveProperty('endpoints');
      expect(res.body.endpoints).toHaveProperty('health');
      expect(res.body.endpoints).toHaveProperty('info');
    });
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should return valid ISO timestamp', async () => {
      const res = await request(app).get('/health');

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });
  });

  describe('GET /ready', () => {
    it('should return ready status', async () => {
      const res = await request(app).get('/ready');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'ready');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /info', () => {
    it('should return application info', async () => {
      const res = await request(app).get('/info');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('app', 'cicd-demo');
      expect(res.body).toHaveProperty('version');
      expect(res.body).toHaveProperty('environment');
      expect(res.body).toHaveProperty('node_version');
    });

    it('should return valid semantic version', async () => {
      const res = await request(app).get('/info');

      const versionRegex = /^\d+\.\d+\.\d+$/;
      expect(res.body.version).toMatch(versionRegex);
    });

    it('should include node version starting with v', async () => {
      const res = await request(app).get('/info');

      expect(res.body.node_version).toMatch(/^v\d+\.\d+\.\d+$/);
    });
  });

  describe('POST /echo', () => {
    it('should echo back the request body', async () => {
      const testData = { message: 'Hello, World!', number: 42 };

      const res = await request(app)
        .post('/echo')
        .send(testData)
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('received');
      expect(res.body.received).toEqual(testData);
      expect(res.body).toHaveProperty('timestamp');
    });

    it('should handle empty body', async () => {
      const res = await request(app)
        .post('/echo')
        .send({})
        .set('Content-Type', 'application/json');

      expect(res.statusCode).toBe(200);
      expect(res.body.received).toEqual({});
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Not Found');
      expect(res.body).toHaveProperty('path', '/unknown-route');
    });
  });

  describe('Response Headers', () => {
    it('should return JSON content type', async () => {
      const res = await request(app).get('/health');

      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });

});

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should use default environment when APP_ENV not set', async () => {
    const res = await request(app).get('/info');
    // Default is 'development' when APP_ENV is not set
    expect(res.body.environment).toBeDefined();
  });
});


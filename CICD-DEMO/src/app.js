const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_ENV = process.env.APP_ENV || 'development';

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint - used by Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Readiness check - more detailed health check
app.get('/ready', (req, res) => {
  // Add any dependency checks here (database, cache, etc.)
  const isReady = true; // In production, check actual dependencies

  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString()
    });
  }
});

// Application info endpoint
app.get('/info', (req, res) => {
  res.status(200).json({
    app: 'cicd-demo',
    version: '1.0.0',
    environment: APP_ENV,
    timestamp: new Date().toISOString(),
    node_version: process.version
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to CI/CD Demo Application',
    environment: APP_ENV,
    endpoints: {
      health: '/health',
      ready: '/ready',
      info: '/info',
      echo: '/echo (POST)'
    }
  });
});

// Echo endpoint for testing
app.post('/echo', (req, res) => {
  res.status(200).json({
    received: req.body,
    timestamp: new Date().toISOString(),
    environment: APP_ENV
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server only if this file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           CI/CD Demo Application Started                   ║
╠═══════════════════════════════════════════════════════════╣
║  Environment: ${APP_ENV.padEnd(42)}║
║  Port:        ${PORT.toString().padEnd(42)}║
║  Node:        ${process.version.padEnd(42)}║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

// Export for testing
module.exports = app;


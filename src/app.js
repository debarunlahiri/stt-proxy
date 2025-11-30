/**
 * STT Proxy Server - Main Application Entry Point
 * 
 * This file is the main entry point for the STT (Speech-to-Text) Proxy Server.
 * It sets up an Express.js application that acts as a proxy between Android clients
 * and a Python backend service. The server handles:
 * - CORS configuration for cross-origin requests
 * - Request body parsing with size limits
 * - Static file serving for audio recordings
 * - Route registration
 * - Error handling middleware
 * - Graceful shutdown handling
 * 
 * @author Debarun Lahiri
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

// Initialize Express application
const app = express();

// Configure CORS (Cross-Origin Resource Sharing) middleware
// Allows requests from configured origins with credentials support
app.use(cors({
  origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Configure body parsing middleware
// Supports JSON and URL-encoded payloads up to 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve audio files statically if audio saving is enabled
// This allows clients to access saved audio recordings via HTTP
if (config.audio.saveAudioFiles) {
  const audioStoragePath = path.resolve(config.audio.storageDir);
  app.use('/audio', express.static(audioStoragePath));
  logger.info(`Serving audio files from: ${audioStoragePath}`);
}

// Register application routes
app.use(routes);

// Register error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    detail: `Route ${req.method} ${req.path} not found`
  });
});

// Start the HTTP server
// Listens on the configured host and port
const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`${config.app.name} v${config.app.version} started`);
  logger.info(`Server running on http://${config.server.host}:${config.server.port}`);
  logger.info(`Python backend URL: ${config.pythonBackend.url}`);
  logger.info(`Environment: ${config.env}`);
});

/**
 * Graceful shutdown handler
 * 
 * Handles SIGTERM and SIGINT signals to gracefully shut down the server.
 * Gives active connections up to 10 seconds to complete before forcing shutdown.
 * This ensures that ongoing requests are not abruptly terminated.
 */
const gracefulShutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if graceful shutdown doesn't complete
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register signal handlers for graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;


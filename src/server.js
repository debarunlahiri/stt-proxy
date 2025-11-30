const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({
  origin: config.cors.origin === '*' ? '*' : config.cors.origin.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (config.audio.saveAudioFiles) {
  const audioStoragePath = path.resolve(config.audio.storageDir);
  app.use('/audio', express.static(audioStoragePath));
  logger.info(`Serving audio files from: ${audioStoragePath}`);
}

app.use(routes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    detail: `Route ${req.method} ${req.path} not found`
  });
});

const server = app.listen(config.server.port, config.server.host, () => {
  logger.info(`${config.app.name} v${config.app.version} started`);
  logger.info(`Server running on http://${config.server.host}:${config.server.port}`);
  logger.info(`Python backend URL: ${config.pythonBackend.url}`);
  logger.info(`Environment: ${config.env}`);
});

const gracefulShutdown = () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;

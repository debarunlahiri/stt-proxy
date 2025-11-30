const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const data = err.data || null;

  const errorResponse = {
    error: statusCode >= 500 ? 'Internal server error' : 'Request error',
    detail: message
  };

  if (data && typeof data === 'object') {
    Object.assign(errorResponse, data);
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;

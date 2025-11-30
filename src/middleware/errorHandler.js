/**
 * Error Handler Middleware
 * 
 * This middleware handles all errors that occur during request processing.
 * It logs errors with context information and sends appropriate error responses
 * to the client. The middleware distinguishes between client errors (4xx) and
 * server errors (5xx) and formats the response accordingly.
 * 
 * @author Debarun Lahiri
 */

const logger = require('../utils/logger');

/**
 * Global error handler middleware
 * 
 * This function is called by Express when an error is passed to the next() function.
 * It:
 * 1. Logs the error with stack trace and request context
 * 2. Determines the appropriate HTTP status code
 * 3. Formats a user-friendly error response
 * 4. Sends the error response to the client
 * 
 * @param {Error} err - The error object passed from previous middleware/controllers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function (required for error handlers)
 * @returns {void} Sends JSON error response
 */
const errorHandler = (err, req, res, next) => {
  // Log error with full context for debugging
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Extract error information
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  const data = err.data || null;

  // Build error response
  const errorResponse = {
    error: statusCode >= 500 ? 'Internal server error' : 'Request error',
    detail: message
  };

  // Merge additional error data if provided
  if (data && typeof data === 'object') {
    Object.assign(errorResponse, data);
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;

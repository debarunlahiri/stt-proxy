/**
 * Logger Utility
 * 
 * This module configures and exports a Winston logger instance for the application.
 * The logger supports both file and console output with different formatting:
 * - File logs: JSON format for structured logging and easy parsing
 * - Console logs: Colorized, human-readable format for development
 * 
 * The logger automatically creates the log directory if it doesn't exist and
 * implements log rotation with file size limits.
 * 
 * @author Debarun Lahiri
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Ensure log directory exists
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Winston Logger Instance
 * 
 * Configured with:
 * - Log level from configuration (default: 'info')
 * - Timestamp format: YYYY-MM-DD HH:mm:ss
 * - Error stack traces included
 * - JSON format for file logs
 * - Colorized console output for development
 * - File rotation: 5MB max file size, keep 5 files
 * 
 * Transports:
 * 1. File transport: Writes structured JSON logs to configured log file
 * 2. Console transport: Outputs colorized logs to console for development
 */
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), // Include stack traces for errors
    winston.format.splat(), // Enable string interpolation
    winston.format.json() // JSON format for structured logging
  ),
  defaultMeta: { service: 'stt-proxy' },
  transports: [
    // File transport: Write logs to file with rotation
    new winston.transports.File({ 
      filename: config.logging.file,
      maxsize: 5242880, // 5MB max file size
      maxFiles: 5 // Keep 5 rotated log files
    }),
    // Console transport: Output colorized logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(), // Add colors to log levels
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          // Append metadata if present
          if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
          }
          return msg;
        })
      )
    })
  ]
});

module.exports = logger;

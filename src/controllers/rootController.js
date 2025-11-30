/**
 * Root Controller
 * 
 * This controller handles requests to the root endpoint of the API. It provides
 * information about the service, including its name, version, status, and available
 * API endpoints. This is useful for API discovery and service information.
 * 
 * @author Debarun Lahiri
 */

const config = require('../config');

/**
 * Get root endpoint information
 * 
 * Returns basic information about the STT Proxy service including:
 * - Service name and version
 * - Current status
 * - Available API endpoints
 * 
 * This endpoint is typically used to verify the service is running and to discover
 * available endpoints.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void} Sends JSON response with service information
 */
const getRoot = (req, res) => {
  res.json({
    service: config.app.name,
    version: config.app.version,
    status: 'online',
    endpoints: {
      health: '/health',
      transcribe: '/v1/transcribe',
      translate: '/v1/translate',
      detect_language: '/v1/detect-language',
      recordings: '/recordings',
      recordings_api: '/api/recordings',
      docs: '/docs'
    }
  });
};

module.exports = {
  getRoot
};

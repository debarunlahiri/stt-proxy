/**
 * Health Check Controller
 * 
 * This controller handles health check requests to verify the status of the proxy server
 * and its connection to the Python backend. It proxies the health check request to the
 * Python backend and returns the backend's health status.
 * 
 * @author Debarun Lahiri
 */

const proxyService = require('../services/proxyService');

/**
 * Get health status of the proxy server and Python backend
 * 
 * This endpoint checks the health of both the proxy server and the Python backend.
 * It forwards the health check request to the Python backend and returns the response.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with health data or forwards error to error handler
 */
const getHealth = async (req, res, next) => {
  try {
    const healthData = await proxyService.healthCheck();
    res.json(healthData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth
};

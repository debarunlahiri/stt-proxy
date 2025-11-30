/**
 * Language Detection Controller
 * 
 * This controller handles language detection requests. It receives text input from the client
 * and forwards it to the Python backend to detect the language of the text. The controller
 * validates the input before processing.
 * 
 * @author Debarun Lahiri
 */

const proxyService = require('../services/proxyService');

/**
 * Detect the language of the provided text
 * 
 * This endpoint accepts text input and determines its language by forwarding the request
 * to the Python backend's language detection service. It validates that the text is
 * provided and not empty before processing.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.text - The text to detect the language for
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with detected language information or error
 */
const detectLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;

    // Validate that text is provided and not empty
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Text field is required and cannot be empty'
      });
    }

    // Forward language detection request to Python backend
    const result = await proxyService.detectLanguage(text);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detectLanguage
};

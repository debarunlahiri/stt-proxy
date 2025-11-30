/**
 * Translation Controller
 * 
 * This controller handles text translation requests. It receives text input along with
 * optional source and target language parameters, validates the input, and forwards the
 * translation request to the Python backend service.
 * 
 * @author Debarun Lahiri
 */

const proxyService = require('../services/proxyService');

/**
 * Translate text to multiple languages
 * 
 * This endpoint accepts text input and translates it to multiple languages (typically
 * English, Hindi, and Bengali) using the Python backend translation service.
 * 
 * The API now returns translations in all supported languages regardless of the
 * target_language parameter, but the parameter is still accepted for backward compatibility.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.body.text - The text to translate (required)
 * @param {string} req.body.source_language - Source language code (optional, for hinting)
 * @param {string} req.body.target_language - Target language code (optional, deprecated but accepted for backward compatibility)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with translation results in multiple languages or error
 */
const translate = async (req, res, next) => {
  try {
    const { text, source_language, target_language } = req.body;

    // Validate that text is provided and not empty
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Text field is required and cannot be empty'
      });
    }

    // Forward translation request to Python backend
    // Note: target_language is deprecated - API always returns all 3 languages
    // But we still accept it for backward compatibility
    const result = await proxyService.translate(
      text,
      source_language || null,
      target_language || 'en' // Default for backward compatibility
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  translate
};

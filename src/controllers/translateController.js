const proxyService = require('../services/proxyService');

const translate = async (req, res, next) => {
  try {
    const { text, source_language, target_language } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Text field is required and cannot be empty'
      });
    }

    // target_language is now deprecated - API always returns all 3 languages
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

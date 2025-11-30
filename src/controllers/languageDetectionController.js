const proxyService = require('../services/proxyService');

const detectLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Text field is required and cannot be empty'
      });
    }

    const result = await proxyService.detectLanguage(text);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  detectLanguage
};

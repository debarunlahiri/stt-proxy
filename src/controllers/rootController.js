const config = require('../config');

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
      docs: '/docs'
    }
  });
};

module.exports = {
  getRoot
};

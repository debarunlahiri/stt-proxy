const proxyService = require('../services/proxyService');

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

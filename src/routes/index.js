const express = require('express');
const router = express.Router();

const rootController = require('../controllers/rootController');
const healthController = require('../controllers/healthController');
const transcribeController = require('../controllers/transcribeController');
const translateController = require('../controllers/translateController');
const languageDetectionController = require('../controllers/languageDetectionController');
const uploadMiddleware = require('../middleware/upload');

router.get('/', rootController.getRoot);

router.get('/health', healthController.getHealth);

router.post('/v1/transcribe', uploadMiddleware, transcribeController.transcribe);

router.post('/v1/translate', translateController.translate);

router.post('/v1/detect-language', languageDetectionController.detectLanguage);

module.exports = router;

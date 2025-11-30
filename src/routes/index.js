/**
 * Application Routes
 * 
 * This file defines all the API routes for the STT Proxy Server. It sets up the
 * Express router and maps HTTP endpoints to their corresponding controller functions.
 * 
 * Available routes:
 * - GET  /              - Root endpoint with service information
 * - GET  /health        - Health check endpoint
 * - POST /v1/transcribe - Speech-to-text transcription endpoint
 * - POST /v1/translate  - Text translation endpoint
 * - POST /v1/detect-language - Language detection endpoint
 * - GET  /recordings    - HTML page listing all recordings
 * - GET  /recordings/:filename - HTML page for individual recording
 * - GET  /api/recordings - JSON API listing all recordings
 * - GET  /api/recordings/:filename - JSON API for individual recording
 * - GET  /translate     - HTML page for translating text
 * 
 * @author Debarun Lahiri
 */

const express = require('express');
const router = express.Router();

// Import controllers
const rootController = require('../controllers/rootController');
const healthController = require('../controllers/healthController');
const transcribeController = require('../controllers/transcribeController');
const translateController = require('../controllers/translateController');
const languageDetectionController = require('../controllers/languageDetectionController');
const recordingsController = require('../controllers/recordingsController');

// Import middleware
const uploadMiddleware = require('../middleware/upload');

// Root endpoint - Returns service information and available endpoints
router.get('/', rootController.getRoot);

// Health check endpoint - Checks server and backend health
router.get('/health', healthController.getHealth);

// Transcription endpoint - Accepts audio file upload and returns transcription
// Uses uploadMiddleware to handle multipart/form-data file uploads
router.post('/v1/transcribe', uploadMiddleware, transcribeController.transcribe);

// Translation endpoint - Translates text to multiple languages
router.post('/v1/translate', translateController.translate);

// Translation page - HTML page for translating text
router.get('/translate', translateController.getTranslatePage);

// Language detection endpoint - Detects the language of provided text
router.post('/v1/detect-language', languageDetectionController.detectLanguage);

// Recordings endpoints - View and manage audio recordings
router.get('/recordings', recordingsController.getRecordingsPage);
router.get('/recordings/:filename', recordingsController.getRecordingPage);
router.get('/api/recordings', recordingsController.listRecordings);
router.get('/api/recordings/:filename', recordingsController.getRecording);

module.exports = router;

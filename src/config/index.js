/**
 * Application Configuration
 * 
 * This module loads and exports all application configuration settings.
 * Configuration values are loaded from environment variables with sensible defaults.
 * Uses dotenv to load environment variables from .env file if present.
 * 
 * Configuration sections:
 * - env: Application environment (development, production, etc.)
 * - server: HTTP server host and port settings
 * - pythonBackend: Python backend service URL
 * - audio: Audio file storage and processing settings
 * - logging: Logging level and file path
 * - cors: Cross-origin resource sharing settings
 * - app: Application metadata (name, version)
 * 
 * @author Debarun Lahiri
 */

require('dotenv').config();
const path = require('path');

/**
 * Application Configuration Object
 * 
 * Contains all configuration settings for the STT Proxy Server.
 * Values are read from environment variables with fallback defaults.
 */
const config = {
  // Application environment (development, production, test, etc.)
  env: process.env.NODE_ENV || 'development',
  
  // HTTP server configuration
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0', // Listen on all interfaces
    port: parseInt(process.env.SERVER_PORT || '3000', 10)
  },
  
  // Python backend service configuration
  pythonBackend: {
    url: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  },
  
  // Audio file handling configuration
  audio: {
    storageDir: process.env.AUDIO_STORAGE_DIR || './audio_recordings', // Directory to save audio files
    saveAudioFiles: process.env.SAVE_AUDIO_FILES !== 'false', // Whether to save uploaded audio files
    mp3Bitrate: process.env.AUDIO_MP3_BITRATE || '192k', // MP3 bitrate for audio processing
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10), // Maximum audio file size in MB
    maxDurationSeconds: parseInt(process.env.MAX_AUDIO_DURATION_SECONDS || '60', 10) // Maximum audio duration in seconds
  },
  
  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info', // Log level: error, warn, info, debug
    file: process.env.LOG_FILE || './logs/stt-proxy.log' // Log file path
  },
  
  // CORS (Cross-Origin Resource Sharing) configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*' // Allowed origins (comma-separated or '*' for all)
  },
  
  // Application metadata
  app: {
    name: 'STT Proxy Server',
    version: '1.0.0'
  }
};

module.exports = config;

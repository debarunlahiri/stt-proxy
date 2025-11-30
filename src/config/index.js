require('dotenv').config();
const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  
  server: {
    host: process.env.SERVER_HOST || '0.0.0.0',
    port: parseInt(process.env.SERVER_PORT || '3000', 10)
  },
  
  pythonBackend: {
    url: process.env.PYTHON_BACKEND_URL || 'http://localhost:8000'
  },
  
  audio: {
    storageDir: process.env.AUDIO_STORAGE_DIR || './audio_recordings',
    saveAudioFiles: process.env.SAVE_AUDIO_FILES !== 'false',
    mp3Bitrate: process.env.AUDIO_MP3_BITRATE || '192k',
    maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '500', 10),
    maxDurationSeconds: parseInt(process.env.MAX_AUDIO_DURATION_SECONDS || '60', 10)
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/stt-proxy.log'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*'
  },
  
  app: {
    name: 'STT Proxy Server',
    version: '1.0.0'
  }
};

module.exports = config;

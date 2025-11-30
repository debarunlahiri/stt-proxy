const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');

class ProxyService {
  constructor() {
    this.baseURL = config.pythonBackend.url;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  async transcribe(audioBuffer, originalFilename, mimeType, params) {
    try {
      const formData = new FormData();
      
      formData.append('audio_file', audioBuffer, {
        filename: originalFilename || 'audio',
        contentType: mimeType || 'application/octet-stream'
      });

      const queryParams = new URLSearchParams();
      if (params.language) {
        queryParams.append('language', params.language);
      }
      if (params.enable_word_timestamps !== undefined) {
        queryParams.append('enable_word_timestamps', params.enable_word_timestamps.toString());
      }
      if (params.enable_diarization !== undefined) {
        queryParams.append('enable_diarization', params.enable_diarization.toString());
      }

      const url = `/v1/transcribe${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await this.client.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      return response.data;
    } catch (error) {
      logger.error(`Transcription failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  async translate(text, sourceLanguage, targetLanguage) {
    try {
      const response = await this.client.post('/v1/translate', {
        text,
        source_language: sourceLanguage || null,
        target_language: targetLanguage
      });

      return response.data;
    } catch (error) {
      logger.error(`Translation failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  async detectLanguage(text) {
    try {
      const response = await this.client.post('/v1/detect-language', {
        text
      });

      return response.data;
    } catch (error) {
      logger.error(`Language detection failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      const customError = new Error(errorData.detail || errorData.error || error.message);
      customError.statusCode = statusCode;
      customError.data = errorData;
      
      return customError;
    } else if (error.request) {
      const customError = new Error('Python backend is not reachable');
      customError.statusCode = 503;
      
      return customError;
    } else {
      const customError = new Error(error.message || 'Internal server error');
      customError.statusCode = 500;
      
      return customError;
    }
  }
}

module.exports = new ProxyService();

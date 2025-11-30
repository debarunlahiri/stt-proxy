/**
 * Proxy Service
 * 
 * This service acts as a proxy between the Node.js server and the Python backend.
 * It handles all HTTP communication with the Python backend service, including:
 * - Health checks
 * - Audio transcription requests
 * - Text translation requests
 * - Language detection requests
 * 
 * The service uses axios for HTTP requests and handles errors appropriately,
 * converting Python backend errors into Node.js error objects with proper
 * status codes and messages.
 * 
 * @author Debarun Lahiri
 */

const axios = require('axios');
const FormData = require('form-data');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * ProxyService Class
 * 
 * Manages all communication with the Python backend service.
 */
class ProxyService {
  /**
   * Initialize ProxyService
   * 
   * Creates an axios client instance configured with the Python backend URL
   * and appropriate timeout settings for long-running operations like transcription.
   */
  constructor() {
    this.baseURL = config.pythonBackend.url;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // 5 minutes timeout for transcription operations
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Check health status of Python backend
   * 
   * Sends a GET request to the Python backend's health endpoint to verify
   * that the backend service is running and accessible.
   * 
   * @returns {Promise<Object>} Health status data from Python backend
   * @throws {Error} If health check fails or backend is unreachable
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      logger.error(`Health check failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Transcribe audio file to text
   * 
   * Sends an audio file to the Python backend for transcription. The audio
   * is sent as multipart/form-data with query parameters for transcription options.
   * 
   * @param {Buffer} audioBuffer - Audio file buffer to transcribe
   * @param {string} originalFilename - Original filename of the audio file
   * @param {string} mimeType - MIME type of the audio file
   * @param {Object} params - Transcription parameters
   * @param {string} params.language - Language code or 'auto' for automatic detection
   * @param {boolean} params.enable_word_timestamps - Enable word-level timestamps
   * @param {boolean} params.enable_diarization - Enable speaker diarization
   * @returns {Promise<Object>} Transcription result from Python backend
   * @throws {Error} If transcription fails or backend is unreachable
   */
  async transcribe(audioBuffer, originalFilename, mimeType, params) {
    try {
      // Create multipart form data for file upload
      const formData = new FormData();
      
      // Append audio file to form data
      formData.append('audio_file', audioBuffer, {
        filename: originalFilename || 'audio',
        contentType: mimeType || 'application/octet-stream'
      });

      // Build query parameters for transcription options
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

      // Construct URL with query parameters
      const url = `/v1/transcribe${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Send POST request with form data
      const response = await this.client.post(url, formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        },
        maxContentLength: Infinity, // Allow large file uploads
        maxBodyLength: Infinity
      });

      return response.data;
    } catch (error) {
      logger.error(`Transcription failed: ${error.message}`);
      throw this.handleError(error);
    }
  }

  /**
   * Translate text to multiple languages
   * 
   * Sends text to the Python backend for translation. The backend returns
   * translations in multiple languages (typically English, Hindi, and Bengali).
   * 
   * @param {string} text - Text to translate
   * @param {string|null} sourceLanguage - Source language code (optional, for hinting)
   * @param {string} targetLanguage - Target language code (deprecated, kept for backward compatibility)
   * @returns {Promise<Object>} Translation result with translations in multiple languages
   * @throws {Error} If translation fails or backend is unreachable
   */
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

  /**
   * Detect language of text
   * 
   * Sends text to the Python backend to detect its language.
   * 
   * @param {string} text - Text to detect language for
   * @returns {Promise<Object>} Language detection result with detected language code
   * @throws {Error} If language detection fails or backend is unreachable
   */
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

  /**
   * Handle and transform errors from axios requests
   * 
   * Converts axios errors into standardized error objects with appropriate
   * status codes and messages. Handles three types of errors:
   * 1. Response errors (backend returned error response)
   * 2. Request errors (backend is unreachable)
   * 3. Other errors (configuration or other issues)
   * 
   * @param {Error} error - Error object from axios request
   * @returns {Error} Transformed error object with statusCode and data properties
   */
  handleError(error) {
    // Backend responded with error status
    if (error.response) {
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      const customError = new Error(errorData.detail || errorData.error || error.message);
      customError.statusCode = statusCode;
      customError.data = errorData;
      
      return customError;
    } 
    // Request was made but no response received (backend unreachable)
    else if (error.request) {
      const customError = new Error('Python backend is not reachable');
      customError.statusCode = 503; // Service Unavailable
      
      return customError;
    } 
    // Error in request setup
    else {
      const customError = new Error(error.message || 'Internal server error');
      customError.statusCode = 500; // Internal Server Error
      
      return customError;
    }
  }
}

// Export singleton instance
module.exports = new ProxyService();

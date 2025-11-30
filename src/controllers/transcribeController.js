/**
 * Transcription Controller
 * 
 * This controller handles speech-to-text transcription requests. It processes uploaded
 * audio files, optionally saves them to disk, and forwards them to the Python backend
 * for transcription. The controller supports various transcription parameters including
 * language selection, word timestamps, and speaker diarization.
 * 
 * @author Debarun Lahiri
 */

const proxyService = require('../services/proxyService');
const audioService = require('../services/audioService');
const logger = require('../utils/logger');

/**
 * Transcribe audio file to text
 * 
 * This endpoint accepts an audio file upload and transcribes it to text using the
 * Python backend service. The audio file is processed through multer middleware
 * before reaching this controller.
 * 
 * Supported query parameters:
 * - language: Language code (e.g., 'en', 'es') or 'auto' for automatic detection (default: 'auto')
 * - enable_word_timestamps: Enable word-level timestamps in response (default: true)
 * - enable_diarization: Enable speaker diarization to identify different speakers (default: false)
 * 
 * The controller:
 * 1. Validates that an audio file was uploaded
 * 2. Extracts audio buffer, filename, and MIME type
 * 3. Parses query parameters for transcription options
 * 4. Optionally saves the audio file to disk (if configured)
 * 5. Forwards the audio to Python backend for transcription
 * 6. Returns transcription result with optional audio file URL
 * 
 * @param {Object} req - Express request object
 * @param {Buffer} req.file.buffer - The uploaded audio file buffer
 * @param {string} req.file.originalname - Original filename of the uploaded audio
 * @param {string} req.file.mimetype - MIME type of the uploaded audio
 * @param {string} req.query.language - Language code for transcription
 * @param {string} req.query.enable_word_timestamps - Enable word timestamps ('true'/'false')
 * @param {string} req.query.enable_diarization - Enable speaker diarization ('true'/'false')
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with transcription result or error
 */
const transcribe = async (req, res, next) => {
  try {
    // Validate that an audio file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Audio file is required'
      });
    }

    // Extract audio file information
    const audioBuffer = req.file.buffer;
    const originalFilename = req.file.originalname || 'audio';
    const mimeType = req.file.mimetype;

    // Parse transcription parameters from query string
    const params = {
      language: req.query.language || 'auto',
      enable_word_timestamps: req.query.enable_word_timestamps !== undefined 
        ? req.query.enable_word_timestamps === 'true'
        : true,
      enable_diarization: req.query.enable_diarization !== undefined
        ? req.query.enable_diarization === 'true'
        : false
    };

    // Optionally save audio file to disk (if configured)
    // Continue with transcription even if saving fails
    let savedFilename = null;
    try {
      savedFilename = await audioService.saveAudioFile(audioBuffer, originalFilename);
    } catch (error) {
      logger.warn(`Failed to save audio file, continuing with transcription: ${error.message}`);
    }

    // Forward transcription request to Python backend
    const transcriptionResult = await proxyService.transcribe(
      audioBuffer,
      originalFilename,
      mimeType,
      params
    );

    // Generate audio file URL if file was saved
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const audioFileUrl = savedFilename ? audioService.getAudioUrl(savedFilename, baseUrl) : null;

    // Combine transcription result with audio file URL
    const response = {
      ...transcriptionResult,
      audio_file_url: audioFileUrl || null
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  transcribe
};

const proxyService = require('../services/proxyService');
const audioService = require('../services/audioService');
const logger = require('../utils/logger');

const transcribe = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Audio file is required'
      });
    }

    const audioBuffer = req.file.buffer;
    const originalFilename = req.file.originalname || 'audio';
    const mimeType = req.file.mimetype;

    const params = {
      language: req.query.language || 'auto',
      enable_word_timestamps: req.query.enable_word_timestamps !== undefined 
        ? req.query.enable_word_timestamps === 'true'
        : true,
      enable_diarization: req.query.enable_diarization !== undefined
        ? req.query.enable_diarization === 'true'
        : false
    };

    let savedFilename = null;
    try {
      savedFilename = await audioService.saveAudioFile(audioBuffer, originalFilename);
    } catch (error) {
      logger.warn(`Failed to save audio file, continuing with transcription: ${error.message}`);
    }

    const transcriptionResult = await proxyService.transcribe(
      audioBuffer,
      originalFilename,
      mimeType,
      params
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const audioFileUrl = savedFilename ? audioService.getAudioUrl(savedFilename, baseUrl) : null;

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

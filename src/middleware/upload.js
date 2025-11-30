/**
 * File Upload Middleware
 * 
 * This middleware handles multipart/form-data file uploads for audio files.
 * It uses multer to process file uploads, validates file types and sizes,
 * and stores files in memory as buffers. The middleware supports various
 * audio formats and enforces file size limits.
 * 
 * @author Debarun Lahiri
 */

const multer = require('multer');
const config = require('../config');
const logger = require('../utils/logger');

// Calculate maximum file size in bytes from MB configuration
const maxFileSize = config.audio.maxFileSizeMB * 1024 * 1024;

// Configure multer to store files in memory as buffers
// This allows the file to be processed without writing to disk first
const storage = multer.memoryStorage();

/**
 * File type filter function
 * 
 * Validates that uploaded files are of supported audio/video types.
 * Accepts common audio formats and some video formats that may contain audio.
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - Multer file object with file metadata
 * @param {Function} cb - Callback function (error, accept)
 */
const fileFilter = (req, file, cb) => {
  // List of allowed MIME types for audio and video files
  const allowedMimeTypes = [
    'audio/wav', 'audio/wave', 'audio/x-wav',
    'audio/mpeg', 'audio/mp3',
    'audio/mp4', 'audio/m4a',
    'audio/aac',
    'audio/flac',
    'audio/ogg', 'audio/vorbis', 'audio/opus',
    'audio/webm',
    'video/webm', 'video/mp4',
    'audio/aiff', 'audio/x-aiff',
    'audio/amr',
    'application/octet-stream'
  ];

  // Accept file if MIME type is in allowed list or starts with 'audio/'
  if (!file.mimetype || allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Configure multer instance with storage, file size limits, and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: fileFilter
});

/**
 * Upload middleware function
 * 
 * This middleware processes single file uploads with the field name 'audio_file'.
 * It handles multer errors and file validation errors, returning appropriate
 * HTTP error responses for client errors.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() on success or sends error response
 */
const uploadMiddleware = (req, res, next) => {
  // Process single file upload with field name 'audio_file'
  upload.single('audio_file')(req, res, (err) => {
    if (err) {
      // Handle multer-specific errors
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'Bad Request',
            detail: `File size exceeds maximum allowed size of ${config.audio.maxFileSizeMB} MB`
          });
        }
        return res.status(400).json({
          error: 'Bad Request',
          detail: err.message
        });
      }
      // Forward other errors to error handler middleware
      return next(err);
    }
    // File uploaded successfully, continue to next middleware
    next();
  });
};

module.exports = uploadMiddleware;

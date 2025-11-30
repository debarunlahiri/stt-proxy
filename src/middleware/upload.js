const multer = require('multer');
const config = require('../config');
const logger = require('../utils/logger');

const maxFileSize = config.audio.maxFileSizeMB * 1024 * 1024;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
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

  if (!file.mimetype || allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Supported types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize
  },
  fileFilter: fileFilter
});

const uploadMiddleware = (req, res, next) => {
  upload.single('audio_file')(req, res, (err) => {
    if (err) {
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
      return next(err);
    }
    next();
  });
};

module.exports = uploadMiddleware;

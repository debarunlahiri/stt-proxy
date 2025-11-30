/**
 * Audio Service
 * 
 * This service handles audio file management operations including saving, retrieving,
 * and deleting audio files. It manages the audio storage directory and provides
 * utilities for generating unique filenames and constructing audio file URLs.
 * 
 * The service can be configured to save or skip saving audio files based on
 * configuration settings. When enabled, audio files are always saved in MP3 format
 * with timestamped and UUID-based filenames for uniqueness.
 * 
 * @author Debarun Lahiri
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * AudioService Class
 * 
 * Manages audio file storage and retrieval operations.
 */
class AudioService {
  /**
   * Initialize AudioService
   * 
   * Sets up storage directory path and configuration, then ensures
   * the storage directory exists.
   */
  constructor() {
    this.storageDir = path.resolve(config.audio.storageDir);
    this.saveAudioFiles = config.audio.saveAudioFiles;
    this.ensureStorageDir();
  }

  /**
   * Ensure audio storage directory exists
   * 
   * Creates the audio storage directory if it doesn't exist.
   * Uses recursive option to create parent directories if needed.
   * 
   * @throws {Error} If directory creation fails
   */
  async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info(`Audio storage directory ready: ${this.storageDir}`);
    } catch (error) {
      logger.error(`Failed to create audio storage directory: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate unique filename for audio file
   * 
   * Creates a filename using timestamp and UUID to ensure uniqueness.
   * Always uses .mp3 extension regardless of original file format.
   * 
   * Format: YYYY-MM-DD_HH-MM-SS_XXXXXXXX.mp3
   * 
   * @param {string} originalFilename - Original filename (used for logging purposes only)
   * @returns {string} Generated unique filename with .mp3 extension
   */
  generateFileName(originalFilename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
    const uniqueId = uuidv4().substring(0, 8);
    
    // Always save as MP3 format
    return `${timestamp}_${uniqueId}.mp3`;
  }

  /**
   * Save audio file to disk
   * 
   * Saves the audio buffer to disk with a generated unique filename.
   * All audio files are saved with .mp3 extension regardless of original format.
   * Returns null if audio saving is disabled in configuration.
   * 
   * @param {Buffer} buffer - Audio file buffer to save
   * @param {string} originalFilename - Original filename (used for logging purposes only)
   * @returns {Promise<string|null>} Saved filename with .mp3 extension or null if saving is disabled
   * @throws {Error} If file saving fails
   */
  async saveAudioFile(buffer, originalFilename) {
    // Skip saving if disabled in configuration
    if (!this.saveAudioFiles) {
      return null;
    }

    try {
      // Generate filename with .mp3 extension
      const filename = this.generateFileName(originalFilename);
      const filePath = path.join(this.storageDir, filename);
      
      // Write buffer to file (saved as MP3 format)
      await fs.writeFile(filePath, buffer);
      logger.info(`Audio file saved as MP3: ${filename}`);
      
      return filename;
    } catch (error) {
      logger.error(`Failed to save audio file: ${error.message}`);
      throw new Error(`Failed to save audio file: ${error.message}`);
    }
  }

  /**
   * Get URL for accessing saved audio file
   * 
   * Constructs a full URL that can be used to access the saved audio file
   * via the static file serving endpoint. If baseUrl is not provided, it
   * constructs one from the server configuration.
   * 
   * @param {string} filename - Name of the saved audio file
   * @param {string|null} baseUrl - Base URL of the server (optional)
   * @returns {string|null} Full URL to access the audio file or null if filename is not provided
   */
  getAudioUrl(filename, baseUrl = null) {
    if (!filename) {
      return null;
    }
    
    // Construct base URL if not provided
    if (!baseUrl) {
      baseUrl = config.server.host === '0.0.0.0' 
        ? `http://localhost:${config.server.port}`
        : `http://${config.server.host}:${config.server.port}`;
    }
    
    // Remove trailing slash if present
    const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${url}/audio/${filename}`;
  }

  /**
   * Get file system path for audio file
   * 
   * Returns the full file system path for a saved audio file.
   * Checks if the file exists before returning the path.
   * 
   * @param {string} filename - Name of the audio file
   * @returns {Promise<string|null>} Full file path or null if file doesn't exist
   */
  async getAudioFilePath(filename) {
    const filePath = path.join(this.storageDir, filename);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      logger.warn(`Audio file not found: ${filename}`);
      return null;
    }
  }

  /**
   * Delete audio file from disk
   * 
   * Removes an audio file from the storage directory.
   * Logs a warning if deletion fails but doesn't throw an error.
   * 
   * @param {string} filename - Name of the audio file to delete
   * @returns {Promise<void>}
   */
  async deleteAudioFile(filename) {
    try {
      const filePath = path.join(this.storageDir, filename);
      await fs.unlink(filePath);
      logger.info(`Audio file deleted: ${filename}`);
    } catch (error) {
      logger.warn(`Failed to delete audio file ${filename}: ${error.message}`);
    }
  }

  /**
   * List all audio files in storage directory
   * 
   * Returns an array of all audio files with their metadata including
   * filename, size, and creation date.
   * 
   * @returns {Promise<Array>} Array of audio file objects with metadata
   */
  async listAllRecordings() {
    try {
      const files = await fs.readdir(this.storageDir);
      const recordings = [];

      for (const file of files) {
        const filePath = path.join(this.storageDir, file);
        try {
          const stats = await fs.stat(filePath);
          // Only include files (not directories) and filter for audio files
          if (stats.isFile() && (file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav') || file.endsWith('.aac') || file.endsWith('.flac') || file.endsWith('.ogg'))) {
            recordings.push({
              filename: file,
              size: stats.size,
              sizeFormatted: this.formatFileSize(stats.size),
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            });
          }
        } catch (error) {
          logger.warn(`Failed to get stats for file ${file}: ${error.message}`);
        }
      }

      // Sort by creation date, newest first
      recordings.sort((a, b) => b.createdAt - a.createdAt);

      return recordings;
    } catch (error) {
      logger.error(`Failed to list recordings: ${error.message}`);
      throw new Error(`Failed to list recordings: ${error.message}`);
    }
  }

  /**
   * Get recording metadata by filename
   * 
   * Returns detailed metadata for a specific audio file.
   * 
   * @param {string} filename - Name of the audio file
   * @returns {Promise<Object|null>} Recording metadata or null if not found
   */
  async getRecordingMetadata(filename) {
    try {
      const filePath = path.join(this.storageDir, filename);
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) {
        return null;
      }

      return {
        filename: filename,
        size: stats.size,
        sizeFormatted: this.formatFileSize(stats.size),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      logger.warn(`Failed to get metadata for file ${filename}: ${error.message}`);
      return null;
    }
  }

  /**
   * Format file size in human-readable format
   * 
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size (e.g., "1.5 MB")
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
module.exports = new AudioService();

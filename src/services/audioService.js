const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');

class AudioService {
  constructor() {
    this.storageDir = path.resolve(config.audio.storageDir);
    this.saveAudioFiles = config.audio.saveAudioFiles;
    this.ensureStorageDir();
  }

  async ensureStorageDir() {
    try {
      await fs.mkdir(this.storageDir, { recursive: true });
      logger.info(`Audio storage directory ready: ${this.storageDir}`);
    } catch (error) {
      logger.error(`Failed to create audio storage directory: ${error.message}`);
      throw error;
    }
  }

  generateFileName(originalFilename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19).replace('T', '_');
    const uniqueId = uuidv4().substring(0, 8);
    const ext = path.extname(originalFilename || '').toLowerCase() || '.mp3';
    
    return `${timestamp}_${uniqueId}${ext}`;
  }

  async saveAudioFile(buffer, originalFilename) {
    if (!this.saveAudioFiles) {
      return null;
    }

    try {
      const filename = this.generateFileName(originalFilename);
      const filePath = path.join(this.storageDir, filename);
      
      await fs.writeFile(filePath, buffer);
      logger.info(`Audio file saved: ${filename}`);
      
      return filename;
    } catch (error) {
      logger.error(`Failed to save audio file: ${error.message}`);
      throw new Error(`Failed to save audio file: ${error.message}`);
    }
  }

  getAudioUrl(filename, baseUrl = null) {
    if (!filename) {
      return null;
    }
    
    if (!baseUrl) {
      baseUrl = config.server.host === '0.0.0.0' 
        ? `http://localhost:${config.server.port}`
        : `http://${config.server.host}:${config.server.port}`;
    }
    
    const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${url}/audio/${filename}`;
  }

  async getAudioFilePath(filename) {
    const filePath = path.join(this.storageDir, filename);
    
    try {
      await fs.access(filePath);
      return filePath;
    } catch (error) {
      logger.warn(`Audio file not found: ${filename}`);
      return null;
    }
  }

  async deleteAudioFile(filename) {
    try {
      const filePath = path.join(this.storageDir, filename);
      await fs.unlink(filePath);
      logger.info(`Audio file deleted: ${filename}`);
    } catch (error) {
      logger.warn(`Failed to delete audio file ${filename}: ${error.message}`);
    }
  }
}

module.exports = new AudioService();

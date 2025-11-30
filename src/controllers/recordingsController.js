/**
 * Recordings Controller
 * 
 * This controller handles requests related to audio recordings management.
 * It provides endpoints to list all recordings, get individual recording details,
 * and serve HTML pages for viewing and playing recordings.
 * 
 * @author Debarun Lahiri
 */

const fs = require('fs').promises;
const path = require('path');
const audioService = require('../services/audioService');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Get list of all recordings
 * 
 * Returns a JSON array of all audio recordings with their metadata.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with recordings list or error
 */
const listRecordings = async (req, res, next) => {
  try {
    const recordings = await audioService.listAllRecordings();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Add URL for each recording
    const recordingsWithUrls = recordings.map(recording => ({
      ...recording,
      url: audioService.getAudioUrl(recording.filename, baseUrl),
      downloadUrl: audioService.getAudioUrl(recording.filename, baseUrl)
    }));

    res.json({
      count: recordingsWithUrls.length,
      recordings: recordingsWithUrls
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get individual recording details
 * 
 * Returns metadata for a specific recording by filename.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.filename - Name of the audio file
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Promise<void>} Sends JSON response with recording details or error
 */
const getRecording = async (req, res, next) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        error: 'Bad Request',
        detail: 'Filename parameter is required'
      });
    }

    const metadata = await audioService.getRecordingMetadata(filename);
    
    if (!metadata) {
      return res.status(404).json({
        error: 'Not Found',
        detail: `Recording ${filename} not found`
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const response = {
      ...metadata,
      url: audioService.getAudioUrl(filename, baseUrl),
      downloadUrl: audioService.getAudioUrl(filename, baseUrl)
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
};

/**
 * Serve recordings list HTML page
 * 
 * Returns an HTML page displaying all recordings with play and download options.
 * Supports pagination via query parameters.
 * 
 * @param {Object} req - Express request object
 * @param {number} req.query.page - Page number (default: 1)
 * @param {number} req.query.limit - Items per page (default: 10)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends HTML response
 */
const getRecordingsPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const allRecordings = await audioService.listAllRecordings();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const totalRecordings = allRecordings.length;
    const totalPages = Math.ceil(totalRecordings / limit);
    
    // Get recordings for current page
    const paginatedRecordings = allRecordings.slice(offset, offset + limit);
    
    const recordingsWithUrls = paginatedRecordings.map(recording => ({
      ...recording,
      url: audioService.getAudioUrl(recording.filename, baseUrl),
      downloadUrl: audioService.getAudioUrl(recording.filename, baseUrl)
    }));

    const html = await generateRecordingsListHTML(recordingsWithUrls, baseUrl, page, totalPages, totalRecordings, limit);
    res.send(html);
  } catch (error) {
    logger.error(`Failed to generate recordings page: ${error.message}`);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error loading recordings</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
};

/**
 * Serve individual recording HTML page
 * 
 * Returns an HTML page for viewing and playing a specific recording.
 * 
 * @param {Object} req - Express request object
 * @param {string} req.params.filename - Name of the audio file
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends HTML response
 */
const getRecordingPage = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).send(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Bad Request</h1>
            <p>Filename parameter is required</p>
          </body>
        </html>
      `);
    }

    const metadata = await audioService.getRecordingMetadata(filename);
    
    if (!metadata) {
      return res.status(404).send(`
        <html>
          <head><title>Not Found</title></head>
          <body>
            <h1>Recording Not Found</h1>
            <p>Recording ${filename} not found</p>
            <a href="/recordings">Back to Recordings</a>
          </body>
        </html>
      `);
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const audioUrl = audioService.getAudioUrl(filename, baseUrl);
    const html = await generateRecordingDetailHTML(metadata, audioUrl, baseUrl);
    res.send(html);
  } catch (error) {
    logger.error(`Failed to generate recording page: ${error.message}`);
    res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error loading recording</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
};

/**
 * Generate HTML for recordings list page
 * 
 * @param {Array} recordings - Array of recording objects with metadata
 * @param {string} baseUrl - Base URL of the server
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} totalRecordings - Total number of recordings
 * @param {number} limit - Items per page
 * @returns {Promise<string>} HTML content
 */
async function generateRecordingsListHTML(recordings, baseUrl, currentPage = 1, totalPages = 1, totalRecordings = 0, limit = 10) {
  const templatePath = path.join(__dirname, '../templates/recordings-list.html');
  let template = await fs.readFile(templatePath, 'utf-8');
  
  const recordingsList = recordings.map((recording, index) => {
    const date = new Date(recording.createdAt).toLocaleString();
    const safeId = `audio-${index}-${recording.filename.replace(/[^a-zA-Z0-9]/g, '_')}`;
    return `
      <div class="recording-item">
        <div class="recording-info">
          <h3>${recording.filename}</h3>
          <p class="recording-meta">Size: ${recording.sizeFormatted} | Created: ${date}</p>
          <div class="audio-player-wrapper active" id="player-${safeId}">
            <audio id="${safeId}" preload="metadata" data-src="${recording.url}">
              <source src="${recording.url}" type="audio/mpeg">
              Your browser does not support the audio element.
            </audio>
            <div class="audio-controls">
              <button class="play-pause-btn" onclick="togglePlay('${safeId}')">
                <span class="play-icon">▶</span>
                <span class="pause-icon" style="display:none;">⏸</span>
              </button>
              <div class="progress-container">
                <div class="progress-bar" id="progress-${safeId}">
                  <div class="progress-filled" id="progress-filled-${safeId}"></div>
                </div>
                <div class="time-display">
                  <span id="current-time-${safeId}">0:00</span> / <span id="duration-${safeId}">0:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="recording-actions">
          <a href="/recordings/${encodeURIComponent(recording.filename)}" class="btn btn-view">View</a>
          <a href="${recording.downloadUrl}" class="btn btn-download" download>Download</a>
        </div>
      </div>
    `;
  }).join('');

  const showingRange = recordings.length > 0 
    ? `${(currentPage - 1) * limit + 1} - ${Math.min(currentPage * limit, totalRecordings)}`
    : '0 - 0';
  
  const paginationHTML = totalPages > 1 ? generatePaginationHTML(currentPage, totalPages, limit) : '';
  const recordingsListHTML = recordings.length > 0 
    ? `<div class="recordings-list">${recordingsList}</div>${paginationHTML}`
    : `<div class="empty-state"><h2>No Recordings Found</h2><p>No audio recordings have been saved yet.</p></div>`;

  template = template.replace(/\{\{totalRecordings\}\}/g, totalRecordings);
  template = template.replace(/\{\{showingRange\}\}/g, showingRange);
  template = template.replace(/\{\{recordingsList\}\}/g, recordingsListHTML);
  template = template.replace(/\{\{pagination\}\}/g, '');

  return template;
}

/**
 * Generate pagination HTML
 * 
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {number} limit - Items per page
 * @returns {string} HTML content for pagination
 */
function generatePaginationHTML(currentPage, totalPages, limit = 10) {
  const maxVisible = 5; // Maximum visible page numbers
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  let paginationHTML = '<div class="pagination">';
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<a href="/recordings?page=${currentPage - 1}&limit=${limit}" class="pagination-btn">Previous</a>`;
  } else {
    paginationHTML += `<span class="pagination-btn disabled">Previous</span>`;
  }
  
  // First page
  if (startPage > 1) {
    paginationHTML += `<a href="/recordings?page=1&limit=${limit}" class="pagination-btn">1</a>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-info">...</span>`;
    }
  }
  
  // Page numbers
  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      paginationHTML += `<span class="pagination-btn active">${i}</span>`;
    } else {
      paginationHTML += `<a href="/recordings?page=${i}&limit=${limit}" class="pagination-btn">${i}</a>`;
    }
  }
  
  // Last page
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-info">...</span>`;
    }
    paginationHTML += `<a href="/recordings?page=${totalPages}&limit=${limit}" class="pagination-btn">${totalPages}</a>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<a href="/recordings?page=${currentPage + 1}&limit=${limit}" class="pagination-btn">Next</a>`;
  } else {
    paginationHTML += `<span class="pagination-btn disabled">Next</span>`;
  }
  
  paginationHTML += '</div>';
  
  return paginationHTML;
}

/**
 * Generate HTML for individual recording page
 * 
 * @param {Object} metadata - Recording metadata
 * @param {string} audioUrl - URL to access the audio file
 * @param {string} baseUrl - Base URL of the server
 * @returns {Promise<string>} HTML content
 */
async function generateRecordingDetailHTML(metadata, audioUrl, baseUrl) {
  const templatePath = path.join(__dirname, '../templates/recording-detail.html');
  let template = await fs.readFile(templatePath, 'utf-8');
  
  const date = new Date(metadata.createdAt).toLocaleString();
  const modifiedDate = new Date(metadata.modifiedAt).toLocaleString();

  template = template.replace(/{{filename}}/g, metadata.filename);
  template = template.replace(/{{audioUrl}}/g, audioUrl);
  template = template.replace(/{{sizeFormatted}}/g, metadata.sizeFormatted);
  template = template.replace(/{{createdAt}}/g, date);
  template = template.replace(/{{modifiedAt}}/g, modifiedDate);
  template = template.replace(/{{sizeBytes}}/g, metadata.size.toLocaleString());

  return template;
}

module.exports = {
  listRecordings,
  getRecording,
  getRecordingsPage,
  getRecordingPage
};


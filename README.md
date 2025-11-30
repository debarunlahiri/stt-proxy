# STT Proxy Server

Node.js proxy server that acts as an intermediary between Android clients and the Python STT (Speech-to-Text) backend. This proxy handles audio file storage in Node.js while forwarding processing requests to the Python backend.

## Overview

The STT Proxy Server provides:
- **Audio File Management**: Audio files are saved and served from Node.js, not Python
- **API Compatibility**: Maintains the same API structure and response format as the Python backend
- **Request Routing**: Proxies requests between Android clients and Python backend
- **Error Handling**: Comprehensive error handling and logging

## Architecture

```
Android Client
     ↓
Node.js Proxy Server (Port 3000)
     ├── Saves audio files locally
     ├── Serves audio files via /audio endpoint
     ↓
Python STT Backend (Port 8000)
     ├── Processes audio transcription
     ├── Handles translation and language detection
     ↓
Response with audio_file_url pointing to Node.js server
```

## Features

- ✅ Audio file storage and serving in Node.js
- ✅ Full API compatibility with Python backend
- ✅ CORS support for cross-origin requests
- ✅ Structured logging with Winston
- ✅ Environment-based configuration
- ✅ Error handling and validation
- ✅ File upload handling with size limits

## Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Python STT backend running on port 8000 (default)

## Installation

1. Clone or navigate to the project directory:
   ```bash
   cd stt-proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your configuration (see Configuration section)

## Configuration

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development

SERVER_HOST=0.0.0.0
SERVER_PORT=3000

PYTHON_BACKEND_URL=http://localhost:8000

AUDIO_STORAGE_DIR=./audio_recordings
SAVE_AUDIO_FILES=true
AUDIO_MP3_BITRATE=192k

MAX_FILE_SIZE_MB=500
MAX_AUDIO_DURATION_SECONDS=60

LOG_LEVEL=info
LOG_FILE=./logs/stt-proxy.log

CORS_ORIGIN=*
```

### Configuration Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVER_HOST` | Server bind address | `0.0.0.0` |
| `SERVER_PORT` | Server port | `3000` |
| `PYTHON_BACKEND_URL` | Python backend URL | `http://localhost:8000` |
| `AUDIO_STORAGE_DIR` | Directory to save audio files | `./audio_recordings` |
| `SAVE_AUDIO_FILES` | Enable/disable audio file saving | `true` |
| `MAX_FILE_SIZE_MB` | Maximum audio file size in MB | `500` |
| `MAX_AUDIO_DURATION_SECONDS` | Maximum audio duration in seconds | `60` |
| `LOG_LEVEL` | Logging level (error, warn, info, debug) | `info` |
| `LOG_FILE` | Log file path | `./logs/stt-proxy.log` |
| `CORS_ORIGIN` | CORS allowed origins (* for all) | `*` |

## Running the Server

### Development Mode

```bash
npm run dev
```

This uses nodemon for auto-reload on file changes.

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured port).

## Project Structure

```
stt-proxy/
├── src/
│   ├── config/
│   │   └── index.js              # Configuration management
│   ├── controllers/
│   │   ├── rootController.js     # Root endpoint
│   │   ├── healthController.js   # Health check
│   │   ├── transcribeController.js # Transcription
│   │   ├── translateController.js  # Translation
│   │   └── languageDetectionController.js # Language detection
│   ├── middleware/
│   │   ├── errorHandler.js       # Error handling
│   │   └── upload.js             # File upload middleware
│   ├── routes/
│   │   └── index.js              # Route definitions
│   ├── services/
│   │   ├── audioService.js       # Audio file management
│   │   └── proxyService.js       # Python backend proxy
│   ├── utils/
│   │   └── logger.js             # Winston logger
│   └── server.js                 # Main server file
├── package.json
├── .env                          # Environment configuration
├── .env.example                  # Example configuration
└── README.md                     # This file
```

## API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API documentation.

### Quick Reference

- `GET /` - Root endpoint with service information
- `GET /health` - Health check
- `POST /v1/transcribe` - Transcribe audio file
- `POST /v1/translate` - Translate text
- `POST /v1/detect-language` - Detect language

## How It Works

### Audio Transcription Flow

1. Android client sends audio file to Node.js proxy via `POST /v1/transcribe`
2. Node.js proxy:
   - Saves audio file to local storage (`./audio_recordings/`)
   - Forwards audio file and parameters to Python backend
3. Python backend processes the audio and returns transcription
4. Node.js proxy:
   - Returns response with transcription data
   - Includes `audio_file_url` pointing to Node.js server (`http://nodejs-server:3000/audio/{filename}`)

### Translation & Language Detection Flow

1. Android client sends request to Node.js proxy
2. Node.js proxy forwards request to Python backend
3. Python backend processes and returns result
4. Node.js proxy returns response to Android client

## Audio File Management

- Audio files are saved in the directory specified by `AUDIO_STORAGE_DIR`
- Files are named with format: `{timestamp}_{uuid}.{ext}`
- Files are accessible via: `http://server:port/audio/{filename}`
- The `audio_file_url` in transcription responses always points to the Node.js server

## Logging

Logs are written to:
- Console (with colors in development)
- Log file (specified in `LOG_FILE`)

Log levels:
- `error` - Errors only
- `warn` - Warnings and errors
- `info` - Informational messages (default)
- `debug` - Detailed debug information

## Error Handling

The server provides consistent error responses:

```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

HTTP status codes:
- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Python backend not available

## Troubleshooting

### Python Backend Not Reachable

Error: `Python backend is not reachable`

**Solution**: Ensure the Python backend is running on the configured URL. Check `PYTHON_BACKEND_URL` in `.env`.

### Audio Files Not Saving

**Solution**: Check that:
1. `SAVE_AUDIO_FILES=true` in `.env`
2. `AUDIO_STORAGE_DIR` directory has write permissions
3. Sufficient disk space available

### Port Already in Use

Error: `EADDRINUSE: address already in use`

**Solution**: Change `SERVER_PORT` in `.env` to an available port.

### File Upload Size Limit

Error: `File size exceeds maximum allowed size`

**Solution**: Increase `MAX_FILE_SIZE_MB` in `.env` or reduce file size.

## Development

### Adding New Endpoints

1. Create controller in `src/controllers/`
2. Add route in `src/routes/index.js`
3. Update proxy service if backend communication needed

### Testing

Test endpoints using curl or Postman. See API documentation for examples.

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Configure proper `CORS_ORIGIN` (not `*`)
3. Set up reverse proxy (nginx) if needed
4. Configure log rotation
5. Set up process manager (PM2, systemd)

## License

MIT

## Author

Debarun Lahiri

## Support

For issues related to:
- **Node.js Proxy**: Check this repository
- **Python Backend**: Check Python STT backend repository


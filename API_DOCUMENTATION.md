# STT Proxy Server API Documentation

Complete API documentation for the STT Proxy Server. This proxy maintains the same API structure as the Python backend.

## Base URL

```
http://localhost:3000
```

Default port is `3000`, configurable via `SERVER_PORT` environment variable.

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error type",
  "detail": "Detailed error message"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `400 Bad Request` - Invalid request parameters or data
- `500 Internal Server Error` - Server error during processing
- `503 Service Unavailable` - Python backend not available

---

## Endpoints

### 1. Root Endpoint

**GET** `/`

Get basic service information and available endpoints.

**Request Example:**
```bash
curl -X GET "http://localhost:3000/"
```

**Response:**
```json
{
  "service": "STT Proxy Server",
  "version": "1.0.0",
  "status": "online",
  "endpoints": {
    "health": "/health",
    "transcribe": "/v1/transcribe",
    "translate": "/v1/translate",
    "detect_language": "/v1/detect-language",
    "docs": "/docs"
  }
}
```

**Status Code:** `200 OK`

---

### 2. Health Check

**GET** `/health`

Check server status and Python backend connectivity. This endpoint proxies the health check from the Python backend.

**Request Example:**
```bash
curl -X GET "http://localhost:3000/health"
```

**Response (CPU Mode):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cpu",
  "supported_languages": ["en", "hi", "ko"],
  "supported_audio_formats": ["aac", "ac3", "aif", "aiff", "amr", "au", "avi", "flac", "m4a", "mkv", "mov", "mp2", "mp3", "mp4", "ogg", "opus", "wav", "webm", "wma"],
  "model_size": "large-v3",
  "gpu_available": false,
  "gpu_name": null
}
```

**Response (GPU Mode):**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "device": "cuda",
  "supported_languages": ["en", "hi", "ko"],
  "supported_audio_formats": ["aac", "ac3", "aif", "aiff", "amr", "au", "avi", "flac", "m4a", "mkv", "mov", "mp2", "mp3", "mp4", "ogg", "opus", "wav", "webm", "wma"],
  "model_size": "large-v3",
  "gpu_available": true,
  "gpu_name": "NVIDIA GeForce RTX 3080"
}
```

**Response Fields:**
- `status` (string): Service health status (`healthy` or `unhealthy`)
- `model_loaded` (boolean): Whether the Whisper model is loaded
- `device` (string): Processing device (`cpu` or `cuda`)
- `supported_languages` (array): List of supported language codes
- `supported_audio_formats` (array): List of supported audio file formats
- `model_size` (string): Currently loaded model size
- `gpu_available` (boolean): Whether GPU is available
- `gpu_name` (string, nullable): GPU name if available

**Status Code:** `200 OK`

**Error Response (Service Unavailable):**
```json
{
  "error": "Internal server error",
  "detail": "Python backend is not reachable"
}
```
**Status Code:** `503 Service Unavailable`

---

### 3. Transcribe Audio

**POST** `/v1/transcribe`

Transcribe audio file to text with optional word-level timestamps and language detection. The transcribed text is automatically translated to all 3 languages (English, Hindi, Korean), and all translations are included in the response.

**Request:**
- **Content-Type**: `multipart/form-data`
- **Method**: POST

**Parameters:**

| Parameter | Type | Location | Required | Default | Description |
|-----------|------|----------|----------|---------|-------------|
| `audio_file` | File | Form Data | Yes | - | Audio file to transcribe |
| `language` | String | Query | No | `auto` | Language code: `en`, `hi`, `ko`, or `auto` for auto-detection |
| `enable_word_timestamps` | Boolean | Query | No | `true` | Include word-level timestamps in response |
| `enable_diarization` | Boolean | Query | No | `false` | Enable speaker diarization (not yet implemented) |

**Supported Audio Formats:**
- Common: WAV, MP3, M4A, AAC, FLAC, OGG, OPUS, WEBM
- Additional: AIFF, AMR, WMA, MP2, MP4, 3GP, GSM, and all formats supported by FFmpeg

**Limitations:**
- Maximum file size: 500 MB (configurable via `MAX_FILE_SIZE_MB`)
- Maximum audio duration: 60 seconds (1 minute)
- Files exceeding these limits will be rejected with a 400 error

**Request Examples:**

**cURL - Auto Language Detection:**
```bash
curl -X POST "http://localhost:3000/v1/transcribe?language=auto&enable_word_timestamps=true" \
  -H "Accept: application/json" \
  -F "audio_file=@sample.wav"
```

**cURL - Specific Language (Hindi):**
```bash
curl -X POST "http://localhost:3000/v1/transcribe?language=hi&enable_word_timestamps=true" \
  -H "Accept: application/json" \
  -F "audio_file=@hindi_audio.mp3"
```

**cURL - Without Word Timestamps (Faster):**
```bash
curl -X POST "http://localhost:3000/v1/transcribe?language=auto&enable_word_timestamps=false" \
  -H "Accept: application/json" \
  -F "audio_file=@sample.wav"
```

**JavaScript/Node.js Example:**
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('audio_file', fs.createReadStream('sample.wav'));

axios.post('http://localhost:3000/v1/transcribe', form, {
  headers: {
    ...form.getHeaders(),
    'Accept': 'application/json'
  },
  params: {
    language: 'auto',
    enable_word_timestamps: true
  }
})
.then(response => {
  const data = response.data;
  console.log('Transcribed text:', data.text);
  console.log('English:', data.english_text);
  console.log('Hindi:', data.hindi_text);
  console.log('Korean:', data.korean_text);
  console.log('Detected language:', data.detected_language);
  console.log('Processing time:', data.processing_time_sec, 's');
  console.log('Real-time factor:', data.real_time_factor);
  console.log('Confidence:', data.confidence);
  console.log('Word count:', data.word_count);
  console.log('Audio file URL:', data.audio_file_url);
})
.catch(error => {
  if (error.response) {
    console.error('Error:', error.response.status);
    console.error('Details:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
});
```

**Python Example:**
```python
import requests

url = "http://localhost:3000/v1/transcribe"

with open("sample.wav", "rb") as audio_file:
    files = {"audio_file": ("sample.wav", audio_file, "audio/wav")}
    params = {
        "language": "auto",
        "enable_word_timestamps": True
    }
    
    response = requests.post(url, files=files, params=params)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Transcribed text: {result['text']}")
        print(f"English: {result['english_text']}")
        print(f"Hindi: {result['hindi_text']}")
        print(f"Korean: {result['korean_text']}")
        print(f"Detected language: {result['detected_language']}")
        print(f"Processing time: {result['processing_time_sec']:.2f}s")
        print(f"Real-time factor: {result['real_time_factor']:.2f}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Word count: {result['word_count']}")
        print(f"Audio file URL: {result['audio_file_url']}")
        print(f"Hindi: {result['hindi_text']}")
        print(f"Korean: {result['korean_text']}")
        print(f"Detected language: {result['detected_language']}")
        print(f"Processing time: {result['processing_time_sec']:.2f}s")
        print(f"Real-time factor: {result['real_time_factor']:.2f}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Word count: {result['word_count']}")
        print(f"Audio file URL: {result['audio_file_url']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
```

**Response (With Word Timestamps and Translations):**
```json
{
  "text": "नमस्ते, hello, 안녕하세요",
  "language": "hi",
  "detected_language": "hi",
  "segments": [
    {
      "start": 0.0,
      "end": 2.1,
      "text": "नमस्ते",
      "words": [
        {
          "word": "नमस्ते",
          "start": 0.0,
          "end": 1.5,
          "confidence": 0.95
        }
      ],
      "speaker": null,
      "language": "hi"
    },
    {
      "start": 2.1,
      "end": 4.5,
      "text": "hello",
      "words": [
        {
          "word": "hello",
          "start": 2.1,
          "end": 3.2,
          "confidence": 0.98
        }
      ],
      "speaker": null,
      "language": "en"
    },
    {
      "start": 4.5,
      "end": 8.1,
      "text": "안녕하세요",
      "words": [
        {
          "word": "안녕하세요",
          "start": 4.5,
          "end": 6.8,
          "confidence": 0.92
        }
      ],
      "speaker": null,
      "language": "ko"
    }
  ],
  "english_text": "Hello, hello, hello",
  "hindi_text": "नमस्ते, नमस्ते, नमस्ते",
  "korean_text": "안녕하세요, 안녕하세요, 안녕하세요",
  "processing_time_sec": 3.4,
  "real_time_factor": 0.42,
  "audio_duration_sec": 8.1,
  "confidence": 0.92,
  "word_count": 3,
  "audio_file_url": "http://localhost:3000/audio/2024-11-24_21-26-27_a1b2c3d4.mp3"
}
```

**Response (Without Word Timestamps):**
```json
{
  "text": "Hello, how are you today?",
  "language": "en",
  "detected_language": "en",
  "segments": [
    {
      "start": 0.0,
      "end": 3.5,
      "text": "Hello, how are you today?",
      "words": null,
      "speaker": null,
      "language": "en"
    }
  ],
  "english_text": "Hello, how are you today?",
  "hindi_text": "नमस्ते, आप आज कैसे हैं?",
  "korean_text": "안녕하세요, 오늘 어떻게 지내세요?",
  "processing_time_sec": 2.1,
  "real_time_factor": 0.60,
  "audio_duration_sec": 3.5,
  "confidence": null,
  "word_count": 5,
  "audio_file_url": "http://localhost:3000/audio/2024-11-24_21-26-27_a1b2c3d4.mp3"
}
```

**Response Fields:**
- `text` (string): Full transcribed text
- `language` (string): Detected language code
- `detected_language` (string): Detected language code (same as `language`)
- `segments` (array): Array of transcription segments with timestamps
  - `start` (float): Start time in seconds
  - `end` (float): End time in seconds
  - `text` (string): Segment text
  - `words` (array, optional): Word-level timestamps (if enabled)
    - `word` (string): Word text
    - `start` (float): Word start time in seconds
    - `end` (float): Word end time in seconds
    - `confidence` (float, optional): Word confidence score (0.0-1.0)
  - `speaker` (string, nullable): Speaker identifier (if diarization enabled)
  - `language` (string, optional): Language code for this segment
- `english_text` (string): Translation of transcribed text in English
- `hindi_text` (string): Translation of transcribed text in Hindi
- `korean_text` (string): Translation of transcribed text in Korean
- `processing_time_sec` (float): Time taken to process the audio in seconds
- `real_time_factor` (float): Processing speed ratio (RTF < 1.0 means faster than real-time)
- `audio_duration_sec` (float): Duration of the audio file in seconds
- `confidence` (float, nullable): Overall confidence score (average of word confidences)
- `word_count` (integer): Total number of words in the transcription
- `audio_file_url` (string, nullable): URL to access the saved audio file on Node.js server

**Note:** The `audio_file_url` points to the Node.js proxy server, not the Python backend. Audio files are stored and served from Node.js.

**Status Code:** `200 OK`

**Error Responses:**

**400 Bad Request - File too large:**
```json
{
  "error": "Bad Request",
  "detail": "File size exceeds maximum allowed size of 500 MB"
}
```

**400 Bad Request - Audio too long:**
```json
{
  "error": "Bad Request",
  "detail": "Audio duration exceeds maximum allowed duration of 60 seconds"
}
```

**400 Bad Request - Missing audio file:**
```json
{
  "error": "Bad Request",
  "detail": "Audio file is required"
}
```

**503 Service Unavailable - Python backend not reachable:**
```json
{
  "error": "Internal server error",
  "detail": "Python backend is not reachable"
}
```

---

### 4. Translate Text

**POST** `/v1/translate`

Translate text to all 3 languages (English, Hindi, Korean). The API always returns translations in all supported languages regardless of the target_language parameter.

**Request:**
- **Content-Type**: `application/json`
- **Method**: POST

**Request Body:**
```json
{
  "text": "Text to translate",
  "source_language": "auto" | "en" | "hi" | "ko",
  "target_language": "en" | "hi" | "ko"
}
```

**Request Fields:**
- `text` (string, required): Text to translate
- `source_language` (string, optional): Source language code (`en`, `hi`, `ko`) or `auto` for auto-detection. Default: `auto`
- `target_language` (string, optional): Deprecated - translations are always returned in all languages. Default: `en`

**Supported Languages:**
- English (`en`)
- Hindi (`hi`)
- Korean (`ko`)

**Note:** The API automatically translates the input text to all 3 languages and returns all translations in the response.

**Request Examples:**

**cURL - Hindi text (returns all 3 languages):**
```bash
curl -X POST "http://localhost:3000/v1/translate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "text": "नमस्ते, आप कैसे हैं?",
    "source_language": "hi"
  }'
```

**Response:**
```json
{
  "english_text": "Hello, how are you?",
  "hindi_text": "नमस्ते, आप कैसे हैं?",
  "korean_text": "안녕하세요, 어떻게 지내세요?",
  "source_language": "hi",
  "detected_language": "hi",
  "detection_confidence": 0.99,
  "processing_time_sec": 0.23,
  "translation_applied": true
}
```

**cURL - Auto-detect language (returns all 3 languages):**
```bash
curl -X POST "http://localhost:3000/v1/translate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "source_language": "auto"
  }'
```

**Response:**
```json
{
  "english_text": "Hello, how are you?",
  "hindi_text": "नमस्ते, आप कैसे हैं?",
  "korean_text": "안녕하세요, 어떻게 지내세요?",
  "source_language": "en",
  "detected_language": "en",
  "detection_confidence": 0.98,
  "processing_time_sec": 0.25,
  "translation_applied": true
}
```

**cURL - Korean text (returns all 3 languages):**
```bash
curl -X POST "http://localhost:3000/v1/translate" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "text": "안녕하세요",
    "source_language": "ko"
  }'
```

**Python - Complete Example:**
```python
import requests

url = "http://localhost:3000/v1/translate"

# Example: Hindi text - get translations in all 3 languages
data = {
    "text": "नमस्ते, आप कैसे हैं?",
    "source_language": "hi"
}

response = requests.post(url, json=data, headers={"Accept": "application/json"})

if response.status_code == 200:
    result = response.json()
    print(f"Original: {data['text']}")
    print(f"English: {result['english_text']}")
    print(f"Hindi: {result['hindi_text']}")
    print(f"Korean: {result['korean_text']}")
    print(f"Source language: {result['source_language']}")
    print(f"Detected language: {result['detected_language']}")
    print(f"Detection confidence: {result['detection_confidence']:.2%}")
    print(f"Processing time: {result['processing_time_sec']:.3f}s")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**JavaScript/Node.js - Complete Example:**
```javascript
const axios = require('axios');

// Example: Hindi text - get translations in all 3 languages
axios.post('http://localhost:3000/v1/translate', {
  text: 'नमस्ते, आप कैसे हैं?',
  source_language: 'hi'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
.then(response => {
  const data = response.data;
  console.log('Original:', 'नमस्ते, आप कैसे हैं?');
  console.log('English:', data.english_text);
  console.log('Hindi:', data.hindi_text);
  console.log('Korean:', data.korean_text);
  console.log('Source language:', data.source_language);
  console.log('Detected language:', data.detected_language);
  console.log('Detection confidence:', data.detection_confidence);
  console.log('Processing time:', data.processing_time_sec, 's');
})
.catch(error => {
  if (error.response) {
    console.error('Error:', error.response.status);
    console.error('Details:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
});
```

**Response Fields:**
- `english_text` (string): Translation in English
- `hindi_text` (string): Translation in Hindi
- `korean_text` (string): Translation in Korean
- `source_language` (string): Source language code (detected or specified)
- `detected_language` (string): Detected source language code
- `detection_confidence` (float): Confidence score for language detection (0.0-1.0)
- `processing_time_sec` (float): Time taken to process all translations in seconds
- `translation_applied` (boolean): Whether translation was applied (always true for supported languages)

**Status Code:** `200 OK`

**Error Responses:**

**400 Bad Request - Empty text:**
```json
{
  "error": "Bad Request",
  "detail": "Text field is required and cannot be empty"
}
```


**503 Service Unavailable:**
```json
{
  "error": "Internal server error",
  "detail": "Python backend is not reachable"
}
```

---

### 5. Detect Language

**POST** `/v1/detect-language`

Detect the language of input text. Supports English, Hindi, and Korean.

**Request:**
- **Content-Type**: `application/json`
- **Method**: POST

**Request Body:**
```json
{
  "text": "Text to detect language for"
}
```

**Request Fields:**
- `text` (string, required): Text to detect language for

**Request Examples:**

**cURL - Detect Hindi:**
```bash
curl -X POST "http://localhost:3000/v1/detect-language" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "text": "नमस्ते, आप कैसे हैं?"
  }'
```

**cURL - Detect English:**
```bash
curl -X POST "http://localhost:3000/v1/detect-language" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "text": "Hello, how are you?"
  }'
```

**JavaScript/Node.js Example:**
```javascript
const axios = require('axios');

axios.post('http://localhost:3000/v1/detect-language', {
  text: 'नमस्ते, आप कैसे हैं?'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})
.then(response => {
  const data = response.data;
  console.log('Detected language:', data.language_name);
  console.log('Language code:', data.detected_language);
  console.log('Confidence:', data.confidence);
})
.catch(error => {
  if (error.response) {
    console.error('Error:', error.response.status);
    console.error('Details:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
});
```

**Python Example:**
```python
import requests

url = "http://localhost:3000/v1/detect-language"

data = {
    "text": "नमस्ते, आप कैसे हैं?"
}

response = requests.post(url, json=data, headers={"Accept": "application/json"})

if response.status_code == 200:
    result = response.json()
    print(f"Detected language: {result['language_name']} ({result['detected_language']})")
    print(f"Confidence: {result['confidence']:.2%}")
else:
    print(f"Error: {response.status_code}")
    print(response.json())
```

**Response (Hindi):**
```json
{
  "detected_language": "hi",
  "language_name": "Hindi",
  "confidence": 0.99
}
```

**Response (English):**
```json
{
  "detected_language": "en",
  "language_name": "English",
  "confidence": 0.98
}
```

**Response Fields:**
- `detected_language` (string): Detected language code (`en`, `hi`, or `ko`)
- `language_name` (string): Human-readable language name
- `confidence` (float): Confidence score for the detection (0.0-1.0)
- `all_detections` (array, optional): All possible language detections with confidence scores

**Status Code:** `200 OK`

**Error Responses:**

**400 Bad Request - Empty text:**
```json
{
  "error": "Bad Request",
  "detail": "Text field is required and cannot be empty"
}
```

**503 Service Unavailable:**
```json
{
  "error": "Internal server error",
  "detail": "Python backend is not reachable"
}
```

---

## Language Codes

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi | Devanagari |
| `ko` | Korean | Hangul |
| `auto` | Auto-detect | - |

---

## Audio File URLs

When audio files are saved (when `SAVE_AUDIO_FILES=true`), they are accessible via:

```
http://{server_host}:{server_port}/audio/{filename}
```

Example:
```
http://localhost:3000/audio/2024-11-24_21-26-27_a1b2c3d4.mp3
```

The filename format is: `{timestamp}_{uuid}.{extension}`

---

## Response Times

Typical response times for different operations:

| Operation | Typical Time | Notes |
|-----------|-------------|-------|
| Health Check | < 50ms | Includes Python backend check |
| Language Detection | 50-200ms | Depends on text length |
| Translation | 100-500ms | Depends on text length |
| Transcription | 1-10 seconds | Depends on audio duration and model size |

**Real-Time Factor (RTF):**
- RTF < 1.0: Faster than real-time (good)
- RTF = 1.0: Real-time processing
- RTF > 1.0: Slower than real-time

Typical RTF values:
- CPU mode (large-v3): 1.5-3.0
- GPU mode (large-v3): 0.1-0.5

---

## Best Practices

### Audio Transcription

1. **Audio Quality**: Use clear, high-quality audio for best results
2. **File Format**: WAV or FLAC formats typically provide best quality
3. **Duration**: Keep audio files under 60 seconds for optimal performance
4. **Language Specification**: Specify the language explicitly if known for better accuracy
5. **Word Timestamps**: Disable word timestamps (`enable_word_timestamps=false`) for faster processing if not needed

### Translation

1. **Text Quality**: Ensure input text is well-formed and clear
2. **Language Detection**: Use `auto` for source language when uncertain
3. **Batch Processing**: For multiple translations, make separate API calls
4. **Error Handling**: Always check for error responses and handle them appropriately

### Error Handling

1. **Check Status Codes**: Always check HTTP status codes
2. **Read Error Details**: Error responses contain detailed messages
3. **Retry Logic**: Implement retry logic for 500 errors
4. **Validation**: Validate input data before sending requests

---

## CORS

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:
- **Allowed Origins**: All origins (`*`) by default, configurable via `CORS_ORIGIN`
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization, Accept
- **Credentials**: Allowed

---

## Rate Limiting

Rate limiting is not implemented in the Node.js proxy. Any rate limiting is handled by the Python backend.

---

## Support

For issues related to:
- **Node.js Proxy**: Check the repository README.md
- **Python Backend**: Check Python STT backend repository

---

## Changelog

### Version 1.0.0
- Initial release
- Audio transcription with word-level timestamps
- Text translation between English, Hindi, and Korean
- Language detection
- Audio file storage and serving in Node.js
- Full API compatibility with Python backend


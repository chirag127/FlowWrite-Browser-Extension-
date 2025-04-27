# FlowWrite Backend

This is the backend service for the FlowWrite browser extension. It handles API requests from the extension, forwards them to the Google Gemini API, and returns suggestions.

## Overview

The FlowWrite backend is a Node.js/Express server that:

1. Receives text context and API key from the extension
2. Forwards the request to Google Gemini API
3. Returns the suggestion to the extension
4. Optionally collects anonymous telemetry data

## Installation

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file based on `.env.example`
5. Start the server:

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## Configuration

Configuration is done through environment variables in the `.env` file:

- `PORT`: The port on which the server will run (default: 3000)
- `MONGODB_URI`: MongoDB connection URI (optional, for telemetry)
- `NODE_ENV`: Environment (development/production)

## API Endpoints

### POST /api/suggest

Generates a text suggestion based on the provided context.

**Request Body:**
```json
{
  "context": "The text context to complete",
  "apiKey": "Your Google Gemini API key"
}
```

**Response:**
```json
{
  "suggestion": "Generated suggestion text"
}
```

**Error Responses:**
- 400: Missing required parameters
- 401: Invalid API key
- 429: API quota exceeded
- 503: Service unavailable
- 500: Generic error

### POST /api/telemetry

Records anonymous telemetry data about suggestion acceptance.

**Request Body:**
```json
{
  "accepted": true
}
```

**Response:**
```json
{
  "message": "Telemetry recorded"
}
```

## Security Considerations

- **API Key Handling**: API keys are used only for the immediate request to the Google Gemini API and are never stored on the backend.
- **HTTPS**: All communication should be over HTTPS in production.
- **Helmet**: The server uses Helmet middleware to set various HTTP headers for security.
- **CORS**: CORS is configured to allow requests only from the extension.
- **No User Data**: No user-identifiable data or text content is stored.

## License

MIT

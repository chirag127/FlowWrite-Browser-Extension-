# AI Provider Service Manager

A comprehensive service manager for handling multiple AI providers with automatic fallback, rate limiting, and health monitoring.

## Features

- **Multi-Provider Support**: Gemini, Cerebras, and Groq
- **Model Definitions**: Models sorted by size (tiny, small, medium, large)
- **Rate Limit Tracking**: Per-model rate limiting (requests per minute and per day)
- **Automatic Fallback**: Intelligently falls back to alternative providers/models
- **Health Monitoring**: Real-time health status for all providers
- **REST API Clients**: Native API clients for each provider

## Supported Providers

### Gemini (Google)
- **Models**:
  - `gemini-2.0-flash-lite` (tiny) - 15 RPM, 1500 RPD
  - `gemini-2.5-flash-preview-04-17` (small) - 10 RPM, 1000 RPD
  - `gemini-1.5-flash` (medium) - 15 RPM, 1500 RPD
  - `gemini-1.5-pro` (large) - 2 RPM, 50 RPD
- **API Key**: `GEMINI_API_KEY` or user-provided per request

### Cerebras
- **Models**:
  - `llama3.1-8b` (small) - 30 RPM, 14400 RPD
  - `llama-3.3-70b` (large) - 30 RPM, 14400 RPD
- **API Key**: `CEREBRAS_API_KEY`
- **Format**: OpenAI-compatible API

### Groq
- **Models**:
  - `llama-3.1-8b-instant` (small) - 30 RPM, 14400 RPD
  - `mixtral-8x7b-32768` (medium) - 30 RPM, 14400 RPD
  - `llama-3.3-70b-versatile` (large) - 30 RPM, 14400 RPD
- **API Key**: `GROQ_API_KEY`
- **Format**: OpenAI-compatible API

## Configuration

Add API keys to your `.env` file:

```env
# At least one required
GEMINI_API_KEY=your_gemini_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
GROQ_API_KEY=your_groq_key_here
```

## Usage

### Basic Usage

```javascript
const aiProviders = require('./services/aiProviders');

// Generate with automatic fallback
const suggestion = await aiProviders.generateWithFallback(
    'The quick brown fox',
    { preferredSize: 'small' }
);
```

### Advanced Options

```javascript
// Force specific provider and model
const result = await aiProviders.generateWithFallback(prompt, {
    providerId: 'gemini',
    modelName: 'gemini-2.5-flash-preview-04-17',
    userApiKey: 'user_specific_key' // Optional, for Gemini
});

// Prefer larger models
const result = await aiProviders.generateWithFallback(prompt, {
    preferredSize: 'large' // tiny, small, medium, large
});
```

### Check Available Providers

```javascript
const providers = aiProviders.getAvailableProviders();
console.log(providers);
// [
//   {
//     id: 'gemini',
//     name: 'Gemini',
//     models: [...]
//   },
//   ...
// ]
```

### Monitor Health Status

```javascript
const health = aiProviders.getHealthStatus();
console.log(health);
// {
//   availableProviders: 2,
//   providers: {
//     gemini: {
//       name: 'Gemini',
//       models: [
//         {
//           name: 'gemini-2.5-flash-preview-04-17',
//           size: 'small',
//           canMakeRequest: true,
//           requestsThisMinute: 3,
//           requestsToday: 45
//         }
//       ]
//     }
//   }
// }
```

## API Endpoints

### GET /api/providers
Returns list of available AI providers and their models.

```json
{
  "providers": [
    {
      "id": "gemini",
      "name": "Gemini",
      "models": [
        {
          "name": "gemini-2.5-flash-preview-04-17",
          "size": "small",
          "rpm": 10,
          "rpd": 1000
        }
      ]
    }
  ]
}
```

### GET /api/health
Returns health status of all providers including rate limit info.

```json
{
  "availableProviders": 2,
  "providers": {
    "gemini": {
      "name": "Gemini",
      "models": [
        {
          "name": "gemini-2.5-flash-preview-04-17",
          "size": "small",
          "canMakeRequest": true,
          "requestsThisMinute": 3,
          "requestsToday": 45
        }
      ]
    }
  }
}
```

### POST /api/suggest
Generate text suggestions with automatic fallback.

**Request:**
```json
{
  "context": "The quick brown fox",
  "apiKey": "optional_user_key",
  "providerId": "gemini",
  "modelName": "gemini-2.5-flash-preview-04-17",
  "preferredSize": "small",
  "pageContext": {
    "pageTitle": "Example",
    "pageUrl": "https://example.com"
  }
}
```

**Response:**
```json
{
  "suggestion": " jumps over the lazy dog"
}
```

## Fallback Logic

The fallback system works as follows:

1. **Specific Model**: If `providerId` and `modelName` are provided, uses that combination
2. **Size Preference**: Otherwise, sorts all models by proximity to `preferredSize`
3. **Sequential Attempts**: Tries models in order until one succeeds
4. **Rate Limiting**: Automatically skips models that have hit rate limits
5. **Error Handling**: Collects all errors and returns comprehensive error if all fail

### Size Preference Examples

- `preferredSize: 'small'` → Tries small models first, then tiny, then medium, then large
- `preferredSize: 'large'` → Tries large models first, then medium, then small, then tiny

## Rate Limiting

Rate limits are tracked per provider per model:
- **RPM**: Requests per minute (rolling 60-second window)
- **RPD**: Requests per day (rolling 24-hour window)

Rate limit info is cleaned up automatically on each check.

## Error Handling

The service handles various error types:
- API key missing/invalid
- Rate limits exceeded
- Service unavailable
- Invalid responses
- Network errors

All errors are logged with provider and model information.

## Testing

```bash
# Test basic loading and health
node backend/test-providers.js

# Test with actual API calls (requires API keys)
node backend/services/aiProviders.test.js
```

## Development Notes

- All providers use REST API clients (no SDK dependencies except Gemini's existing one for backward compatibility)
- Rate limits are stored in-memory and reset on server restart
- User-provided API keys (for Gemini) are only used for the immediate request
- The service is a singleton instance for shared rate limit tracking

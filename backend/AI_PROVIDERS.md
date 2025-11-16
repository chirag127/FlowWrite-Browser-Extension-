# AI Provider Service Manager

## Overview

The AI Provider Service Manager is a comprehensive system for managing multiple AI providers with automatic fallback, rate limiting, and health monitoring. It replaces the previous single-provider (Gemini only) implementation with a robust multi-provider architecture.

## Architecture

```
backend/
├── services/
│   ├── aiProviders.js       # Main service manager (singleton)
│   ├── aiProviders.test.js  # Integration test examples
│   └── README.md            # Detailed documentation
├── examples/
│   └── api-usage.js         # API usage examples for extension integration
├── routes/
│   └── api.js               # Updated with new endpoints
└── .env.example             # Updated with new API key configs
```

## Key Features

### 1. Multi-Provider Support
- **Gemini (Google)**: 4 models (tiny to large)
- **Cerebras**: 2 Llama models (small, large)
- **Groq**: 3 models (small, medium, large)

### 2. Model Definitions Sorted by Size
Models are categorized by size for intelligent selection:
- **tiny**: Ultra-fast, minimal latency
- **small**: Fast, good for most use cases
- **medium**: Balanced performance
- **large**: Most capable, higher latency

### 3. Rate Limit Tracking
- Per-provider, per-model tracking
- Requests per minute (RPM) limits
- Requests per day (RPD) limits
- Rolling window implementation
- Automatic cleanup of old timestamps

### 4. Automatic Fallback Logic
Intelligent fallback system that:
- Tries preferred model size first
- Falls back to similar-sized models from other providers
- Skips models that hit rate limits
- Returns comprehensive error if all providers fail
- Logs each attempt for debugging

## API Changes

### New Endpoints

#### GET /api/providers
Returns list of available providers and their models.

**Response:**
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

#### GET /api/health
Returns health status including rate limit info.

**Response:**
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

### Updated Endpoint

#### POST /api/suggest
Now supports multiple providers with fallback.

**New Request Parameters:**
```json
{
  "context": "Hello, my name is",
  "apiKey": "optional_user_key",           // Still supported for Gemini
  "providerId": "gemini",                   // NEW: Force specific provider
  "modelName": "gemini-2.5-flash-preview-04-17", // NEW: Force specific model
  "preferredSize": "small",                 // NEW: Prefer model size
  "pageContext": { ... }                    // Existing parameter
}
```

**Backward Compatibility:**
- Existing requests without new parameters work as before
- If `apiKey` is provided without `providerId`, uses Gemini
- If neither provider nor size is specified, defaults to 'small' size preference

## Configuration

### Environment Variables (.env)

```env
# At least one required for server-side API keys
GEMINI_API_KEY=your_gemini_key_here
CEREBRAS_API_KEY=your_cerebras_key_here
GROQ_API_KEY=your_groq_key_here
```

**Notes:**
- User-provided API keys (via request) only work for Gemini
- Other providers require server-side API keys in .env
- System works with any combination of providers configured

## Provider Details

### Gemini (Google)
| Model | Size | RPM | RPD | Notes |
|-------|------|-----|-----|-------|
| gemini-2.0-flash-lite | tiny | 15 | 1500 | Ultra-fast |
| gemini-2.5-flash-preview-04-17 | small | 10 | 1000 | Current default |
| gemini-1.5-flash | medium | 15 | 1500 | Balanced |
| gemini-1.5-pro | large | 2 | 50 | Most capable |

**API Format:** Google GenAI native format
**User Keys:** Supported (via `apiKey` parameter)

### Cerebras
| Model | Size | RPM | RPD | Notes |
|-------|------|-----|-----|-------|
| llama3.1-8b | small | 30 | 14400 | Fast Llama |
| llama-3.3-70b | large | 30 | 14400 | Large Llama |

**API Format:** OpenAI-compatible (chat/completions)
**User Keys:** Not supported (server-side only)

### Groq
| Model | Size | RPM | RPD | Notes |
|-------|------|-----|-----|-------|
| llama-3.1-8b-instant | small | 30 | 14400 | Ultra-fast |
| mixtral-8x7b-32768 | medium | 30 | 14400 | Good balance |
| llama-3.3-70b-versatile | large | 30 | 14400 | Most capable |

**API Format:** OpenAI-compatible (chat/completions)
**User Keys:** Not supported (server-side only)

## Fallback Behavior Examples

### Example 1: Size Preference
```javascript
// Request with preferredSize: 'small'
// Tries in order:
// 1. gemini-2.5-flash-preview-04-17 (small)
// 2. llama3.1-8b (small)
// 3. llama-3.1-8b-instant (small)
// 4. gemini-2.0-flash-lite (tiny)
// 5. gemini-1.5-flash (medium)
// 6. mixtral-8x7b-32768 (medium)
// 7. gemini-1.5-pro (large)
// 8. llama-3.3-70b (large)
// 9. llama-3.3-70b-versatile (large)
```

### Example 2: Rate Limit Fallback
```javascript
// If gemini-2.5-flash-preview-04-17 hits rate limit:
// - Automatically skips to next available small model
// - Tries llama3.1-8b from Cerebras
// - Falls back through list until success
```

### Example 3: Specific Model
```javascript
// Request with providerId and modelName:
// - Uses only that specific model
// - No fallback attempted
// - Returns error if that model fails
```

## Testing

### Basic Validation
```bash
node backend/test-providers.js
```

### Integration Tests (requires API keys)
```bash
node backend/services/aiProviders.test.js
```

### Syntax Check
```bash
node --check backend/services/aiProviders.js
node --check backend/routes/api.js
```

## Migration Guide

### For Existing Extension Code

**Before:**
```javascript
const response = await fetch('/api/suggest', {
    method: 'POST',
    body: JSON.stringify({
        context: text,
        apiKey: userApiKey
    })
});
```

**After (backward compatible):**
```javascript
// Option 1: Keep existing code (works as before with Gemini)
const response = await fetch('/api/suggest', {
    method: 'POST',
    body: JSON.stringify({
        context: text,
        apiKey: userApiKey  // Still works for Gemini
    })
});

// Option 2: Use new features
const response = await fetch('/api/suggest', {
    method: 'POST',
    body: JSON.stringify({
        context: text,
        preferredSize: 'small',  // Let system choose best provider
        apiKey: userApiKey       // Optional, falls back to server keys
    })
});

// Option 3: Force specific provider
const response = await fetch('/api/suggest', {
    method: 'POST',
    body: JSON.stringify({
        context: text,
        providerId: 'cerebras',
        modelName: 'llama3.1-8b'
    })
});
```

## Performance Considerations

### Latency by Provider
- **Groq**: Fastest (optimized inference hardware)
- **Cerebras**: Very fast (custom AI chips)
- **Gemini**: Fast (Flash models), slower (Pro models)

### Cost by Provider
- **Gemini**: Pay-per-use (free tier available)
- **Cerebras**: Free tier available
- **Groq**: Free tier available

### Recommendation
Use `preferredSize: 'small'` for best balance of speed and quality in real-time suggestions.

## Troubleshooting

### No Providers Available
```json
{
  "error": "No AI providers configured"
}
```
**Solution:** Add at least one API key to `.env` file

### Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded for gemini:gemini-2.5-flash-preview-04-17"
}
```
**Solution:** System automatically falls back to other providers if available

### All Providers Failed
```json
{
  "error": "All providers failed: [...]"
}
```
**Solution:** Check API keys, network connection, and provider status

## Future Enhancements

Potential improvements:
- [ ] Persistent rate limit storage (Redis)
- [ ] Provider cost tracking
- [ ] Latency monitoring and automatic provider ranking
- [ ] A/B testing framework
- [ ] Streaming support for longer completions
- [ ] Caching layer for common suggestions
- [ ] User preference learning

## Dependencies

**New:**
- `axios` (^1.13.2) - HTTP client for REST API calls

**Existing:**
- `@google/genai` (^0.10.0) - Still used for Gemini (backward compatibility)
- `express`, `cors`, `dotenv`, etc. - Unchanged

## Security Notes

- User API keys are never stored or logged
- Server API keys are stored in environment variables only
- All requests are validated before processing
- Rate limits prevent abuse
- CORS and Helmet security headers configured

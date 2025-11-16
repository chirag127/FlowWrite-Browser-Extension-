# AI Provider Service

## Overview

The AI Provider Service is a unified service manager for multiple AI providers with intelligent model selection, rate limiting, exponential backoff, and automatic fallback.

## Key Features

### 1. Unified Model Registry
Models are ranked by capability and speed in a single registry:

| Rank | Model | Provider | Category | Capabilities |
|------|-------|----------|----------|--------------|
| 1 | Qwen 3 Coder 32B | Cerebras | coding-premium | Specialized for code completion/refactoring |
| 2 | Gemini 2.0 Flash (Exp) | Gemini | general-premium | Best reasoning and context |
| 3 | Llama 3.3 70B | Groq | general-fast | Fast, high-quality completions |
| 4 | Llama 3.3 70B | Cerebras | general-fast | High-quality, good speed |
| 5 | Gemini 2.5 Flash | Gemini | balanced | Good balance of speed/quality |
| 6 | Mixtral 8x7B | Groq | balanced | Fast, versatile |
| 7 | Llama 3.1 8B | Cerebras | fast | Quick responses |
| 8 | Llama 3.1 8B | Groq | fast | Ultra-fast responses |
| 9 | Gemini 1.5 Flash | Gemini | fast | Fast Gemini model |
| 10 | Gemini 2.0 Flash Lite | Gemini | ultra-fast | Fastest Gemini model |

### 2. REST API Clients
Supports three providers with unified interface:
- **Cerebras**: OpenAI-compatible API format
- **Gemini**: Google GenAI native format
- **Groq**: OpenAI-compatible API format

### 3. Rate Limit Tracking
- Per-model tracking with rolling windows
- Requests per minute (RPM) limits
- Requests per day (RPD) limits
- Automatic cleanup of old timestamps
- Models automatically skipped when at limit

### 4. Exponential Backoff
- Tracks failures per model
- Starts at 1 second, doubles on each failure
- Maximum backoff of 5 minutes
- Automatically resets on success
- Models in backoff are skipped during selection

### 5. Intelligent Model Selection
- Tries models in rank order by default
- Filter by category (coding-premium, general-premium, balanced, fast, ultra-fast)
- Automatically skips rate-limited or backed-off models
- Falls back to next available model on error
- Returns detailed error if all models fail

## API

### Basic Usage

```javascript
const aiService = require('./services/ai-provider-service');

// Simple generation (uses best available model)
const result = await aiService.generate('Complete: function add(a, b) {');
console.log(result.text);
console.log(result.model.displayName); // e.g., "Cerebras Qwen 3 Coder 32B"
```

### Category-Based Selection

```javascript
// Use best coding model
const result = await aiService.generate('Complete: const factorial = (n) => {', {
    category: 'coding-premium',
});

// Use fastest model
const result = await aiService.generate('Say hello', {
    category: 'ultra-fast',
});
```

### Specific Model

```javascript
// Force a specific model
const result = await aiService.generate('Hello', {
    modelName: 'qwen-coder-32b-preview',
});
```

### Limit Retries

```javascript
// Try only first 3 models
const result = await aiService.generate('Hello', {
    maxRetries: 3,
});
```

### User API Key (Gemini Only)

```javascript
// Use user-provided Gemini API key
const result = await aiService.generate('Hello', {
    userApiKey: 'user-gemini-key',
});
```

## Methods

### `generate(prompt, options)`
Generate content with automatic model selection and fallback.

**Parameters:**
- `prompt` (string): The text prompt
- `options` (object):
  - `category` (string): Filter by category (e.g., 'coding-premium')
  - `modelName` (string): Force specific model
  - `userApiKey` (string): User API key (Gemini only)
  - `maxRetries` (number): Maximum models to try

**Returns:** `{ text, model: { name, displayName, provider, rank } }`

**Throws:** Error if all models fail

### `generateWithModel(modelName, prompt, userApiKey)`
Generate with a specific model.

**Parameters:**
- `modelName` (string): Model name from registry
- `prompt` (string): The text prompt
- `userApiKey` (string, optional): User API key (Gemini only)

**Returns:** `string` (the generated text)

**Throws:** Error if model fails, is rate limited, or in backoff

### `getAvailableModels()`
Get all models with configured API keys.

**Returns:** Array of model objects

### `getModelsByCategory(category)`
Get models filtered by category.

**Parameters:**
- `category` (string): Category name

**Returns:** Array of model objects

### `getModelRegistry()`
Get the full model registry with metadata.

**Returns:** Array of model objects with rank, capabilities, latency, etc.

### `getHealthStatus()`
Get detailed health status including rate limits and backoff state.

**Returns:** Object with health information for all models

## Configuration

Set API keys in `.env` file:

```env
CEREBRAS_API_KEY=your_cerebras_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

At least one API key is required. The service works with any combination of providers.

## Model Categories

- **coding-premium**: Best for code completion, refactoring
- **general-premium**: Best for reasoning, complex tasks
- **general-fast**: Good quality, fast responses
- **balanced**: Balance of speed and quality
- **fast**: Prioritize speed
- **ultra-fast**: Fastest possible responses

## Rate Limits

Models have different rate limits (RPM = requests per minute, RPD = requests per day):

- **Cerebras**: 30 RPM, 14400 RPD
- **Groq**: 30 RPM, 14400 RPD
- **Gemini Flash**: 10-15 RPM, 1000-1500 RPD
- **Gemini Pro**: 2 RPM, 50 RPD

## Exponential Backoff

When a model fails:
1. Failure count increments
2. Backoff time doubles (1s → 2s → 4s → 8s → ...)
3. Maximum backoff: 5 minutes
4. Model is skipped during backoff period
5. On success, backoff resets

This prevents hammering failed models and allows time for transient issues to resolve.

## Error Handling

### Rate Limit Exceeded
```
Error: Rate limit exceeded: qwen-coder-32b-preview
```
Service automatically tries next available model.

### Model in Backoff
```
Error: Model in backoff: qwen-coder-32b-preview (45s remaining)
```
Service automatically tries next available model.

### All Models Failed
```
Error: All models failed: Cerebras Qwen 3 Coder 32B: Rate limit exceeded; Gemini 2.0 Flash: Timeout; ...
```
Returns detailed error with all failure reasons.

### No Models Available
```
Error: No AI models available
```
No API keys configured or all models filtered out by category.

## Testing

### Syntax Check
```bash
node --check backend/services/ai-provider-service.js
```

### Basic Validation
```bash
node backend/test-providers.js
```

### Integration Tests
```bash
node backend/services/test-ai-provider-service.js
```

The integration test demonstrates:
- Basic generation
- Category selection
- Specific model selection
- Rate limit behavior
- Automatic fallback
- Health status monitoring

## Performance

### Latency by Provider (avg)
- Groq: 250-400ms (fastest)
- Cerebras: 300-500ms (very fast)
- Gemini: 600-1000ms (fast to moderate)

### Recommendations
- **For real-time suggestions**: Use `category: 'fast'` or `'ultra-fast'`
- **For code completion**: Use `category: 'coding-premium'`
- **For complex reasoning**: Use `category: 'general-premium'`
- **For balance**: Use default (no category) to leverage full ranking

## Migration from aiProviders.js

The new service maintains backward compatibility while adding new features:

**Old way:**
```javascript
const aiProviders = require('./services/aiProviders');
const result = await aiProviders.generateWithFallback(prompt, {
    preferredSize: 'small',
});
```

**New way:**
```javascript
const aiService = require('./services/ai-provider-service');
const result = await aiService.generate(prompt, {
    category: 'fast',
});
// Returns { text, model } instead of just text
```

Key differences:
- Unified model registry (no more separate provider objects)
- Ranked by capability/speed instead of size
- Category-based selection instead of size-based
- Exponential backoff added
- Returns model information with result
- More detailed health status

## Dependencies

- `axios` (^1.13.2) - HTTP client for REST API calls
- `dotenv` (^16.0.3) - Environment variable management
- `express` (^4.18.2) - For server integration

## Security

- User API keys never stored or logged
- Server API keys only in environment variables
- All requests validated before processing
- Rate limits prevent abuse
- Timeout protection (30s per request)

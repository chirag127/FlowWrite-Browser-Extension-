# Agent Commands & Guidelines

## Setup
```bash
npm install                    # Install root dependencies (only needed for icon generation)
```

## Commands
- **Build**: `npm run generate-icons` (generates icons from SVG)
- **Lint**: No linter configured
- **Test**: No tests configured
- **Dev Server**: Not applicable (pure client-side extension)

## Tech Stack
- **Frontend**: Vanilla JavaScript Chrome Extension (Manifest v3)
- **AI Providers**: Google Gemini API, OpenAI API, Anthropic Claude API (multi-provider support)
- **Tools**: Sharp (icon generation)
- **Architecture**: Pure client-side, no backend server required

## Architecture
- `extension/`: Chrome extension code (content scripts, background worker, popup, options)
- **Client-Side Only**: Extension makes direct API calls to AI providers from the browser
- Content script injects into all pages, detects typing, calls AI provider APIs directly
- Background service worker handles extension lifecycle and message passing
- All API keys stored locally in browser storage, never sent to third parties

## Code Style
- No TypeScript, pure JavaScript
- Inline CSS classes with `flowwrite-` prefix
- Debug logging with `debugLog()` utility
- Store config in `chrome.storage.local`
- Direct API calls to AI providers (no backend proxy)

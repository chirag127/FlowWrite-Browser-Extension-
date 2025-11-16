# AGENTS.md

## Commands

### Setup
```bash
npm install                    # Install root dependencies
cd backend && npm install      # Install backend dependencies
```

### Build
```bash
npm run generate-icons         # Generate PNG icons from SVG
```

### Lint
No linter configured.

### Test
```bash
npm test                       # Root tests (currently not implemented)
cd backend && npm test         # Backend tests (currently not implemented)
```

### Dev Server
```bash
cd backend && npm run dev      # Start backend with nodemon
```

## Tech Stack
- **Extension**: Chrome Extension Manifest V3, vanilla JavaScript
- **Backend**: Node.js, Express, Google Gemini API, MongoDB (optional)
- **Dev Tools**: Sharp (icon generation), nodemon

## Architecture
- `extension/`: Chrome extension with content scripts, background service worker, popup, and options UI
- `backend/`: Express API server that proxies requests to Google Gemini API
- Content script detects typing, sends context to backend, displays inline/popup/side panel suggestions

## Code Style
- Vanilla JS (no build step or transpilation)
- Inline documentation for complex logic
- Configuration via `chrome.storage.local`
- API key stored client-side only, never on backend

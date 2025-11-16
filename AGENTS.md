# FlowWrite - Agent Guide

## Setup
```bash
npm install                    # Install root dependencies (Sharp for icon generation)
cd backend && npm install      # Install backend dependencies (Express, Google Gemini API, MongoDB)
```

## Commands
- **Build**: N/A (no build step required)
- **Lint**: N/A (no linter configured)
- **Test**: N/A (no tests configured)
- **Dev Server**: `cd backend && npm run dev` (nodemon on port 3000)
- **Generate Icons**: `npm run generate-icons` (converts SVG to PNG icons)

## Tech Stack
- **Frontend**: Vanilla JavaScript (Chrome Extension Manifest v3)
- **Backend**: Node.js, Express, MongoDB (optional telemetry), Google Gemini API
- **No build tooling**: Direct JS files, no TypeScript/bundler

## Architecture
- `extension/`: Chrome extension (manifest.json, content scripts, background service worker, popup, options page)
- `backend/`: Express API server (suggestion endpoint, telemetry collection)
- Content script injects into all pages, detects typing, shows inline/popup/side panel AI suggestions

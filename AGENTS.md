# AGENTS.md

## Commands

**Setup:**
```bash
npm install
cd backend && npm install && cd ..
```

**Build:** `npm run generate-icons` (generates PNG icons from SVG)

**Lint:** Not configured

**Test:** Not configured

**Dev Server:** `cd backend && npm run dev` (runs on port 3000)

## Tech Stack

- **Frontend:** Chrome Extension (Manifest V3), vanilla JS
- **Backend:** Node.js/Express, MongoDB (optional telemetry), Google Gemini API
- **Tools:** Sharp (icon generation)

## Architecture

- `extension/`: Chrome extension (content scripts, background service worker, popup, options)
- `backend/`: Express API server that proxies requests to Gemini API
- Content script detects typing, sends context to backend, displays inline/popup/side-panel suggestions

## Code Style

- Vanilla JavaScript (no frameworks in extension)
- API keys stored locally in browser, never on server
- Debounced typing detection (configurable delay)
- CSS injected via content script

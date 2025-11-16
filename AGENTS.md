# FlowWrite Browser Extension - Agent Guide

## Commands

**Setup:**
```bash
npm install
cd backend && npm install && cd ..
npm run generate-icons
```

**Dev Server:** `cd backend && npm run dev` (runs on port 3000)  
**Build:** N/A (extension loads directly from `extension/` folder)  
**Lint:** No linter configured  
**Test:** No tests configured

## Tech Stack

- **Frontend:** Vanilla JavaScript (Chrome Extension Manifest V3)
- **Backend:** Node.js/Express, MongoDB (optional telemetry), Google Gemini API
- **Build Tools:** npm, Sharp (icon generation)

## Architecture

- `extension/` - Chrome extension (manifest.json, content scripts, background service worker, popup/options UI)
- `backend/` - Express API server (routes, models, config)
- Content script injects into pages, detects typing, sends context to backend
- Backend forwards requests to Gemini API, returns suggestions
- Suggestions displayed inline/popup/side panel based on user preference

## Code Style

- No formal linter/formatter configured
- Uses JSDoc comments for function documentation
- Tab key accepts suggestions, Esc dismisses
- API key stored in chrome.storage.local

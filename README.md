# FlowWrite Browser Extension

FlowWrite is a **fully client-side** Chrome browser extension that provides real-time, inline AI-powered writing suggestions as you type in web forms and text fields. It's designed to be the "GitHub Copilot for everyday writing," seamlessly integrating into your workflow with support for multiple AI providers (Groq, Cerebras, and Gemini).

![FlowWrite Logo](extension/icons/icon128.png)

## ✨ Features

-   **Multi-Provider AI Support**: Seamlessly switch between Groq (fastest), Cerebras (fast), and Gemini (fallback)
-   **Real-time AI Suggestions**: Get intelligent writing suggestions as you type
-   **Automatic Fallback**: Intelligently rotates through providers with automatic fallback on failure or rate limits
-   **Completely Client-Side**: No backend required - all API calls are direct from your browser
-   **Privacy-First**: Your API keys are stored securely in your browser only
-   **Rate Limit Tracking**: Automatic model rotation based on rate limits and availability
-   **Customizable**: Choose suggestion delay, presentation style, and site-specific settings

## 🚀 Getting Started

### Prerequisites

-   Google Chrome/Chromium browser
-   One or more of the following API keys:
    -   [Google Gemini API Key](https://aistudio.google.com/app/apikey)
    -   [Cerebras API Key](https://cloud.cerebras.ai)
    -   [Groq API Key](https://console.groq.com)

### Installation for Users

1. Install the extension from the Chrome Web Store (coming soon)
2. Click on the FlowWrite icon in your browser toolbar
3. Go to Options and configure your API keys in priority order:
    - **Groq** (Priority #1 - Fastest)
    - **Cerebras** (Priority #2 - Fast)
    - **Gemini** (Priority #3 - Fallback)
4. Start typing and enjoy AI-powered suggestions!

### Installation for Developers

```bash
# Clone the repository
git clone https://github.com/chirag127/FlowWrite-Browser-Extension-.git
cd FlowWrite-Browser-Extension-

# Install dependencies (optional, only for icon generation)
npm install

# Generate icons (optional)
npm run generate-icons

# Load in Chrome Developer Mode
# 1. Open chrome://extensions/
# 2. Enable "Developer mode" (top right)
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

## 🔄 Architecture

FlowWrite v2.0+ is **100% client-side** with no backend dependency:

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Page (Browser)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Content Script (content.js)                │   │
│  │  • Detects user typing                               │   │
│  │  • Extracts text context                             │   │
│  │  • Displays suggestions                              │   │
│  └─────────────────────┬──────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼──────────────────────────────┐   │
│  │    AI Provider Manager (ai-provider-manager.js)     │   │
│  │  • Model registry (sorted by speed)                 │   │
│  │  • Rate limit tracking                              │   │
│  │  • Automatic fallback logic                         │   │
│  │  • Direct REST API calls                            │   │
│  └─────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
    ┌────────┐      ┌─────────┐      ┌────────┐
    │ Groq   │      │Cerebras │      │ Gemini │
    │ API    │      │ API     │      │ API    │
    └────────┘      └─────────┘      └────────┘
```

## 🎯 Model Selection & Fallback

Models are sorted by **speed** across all providers:

### Groq Models (Very Fast - Priority #1)

-   Groq Compound (70,000 tokens/min) ⚡⚡⚡
-   Llama 3.3 70B (12,000 tokens/min) ⚡⚡⚡
-   Mixtral 8x7B (6,000 tokens/min) ⚡⚡⚡

### Cerebras Models (Fast - Priority #2)

-   Qwen 3 Coder 480B (150,000 tokens/min) ⚡⚡
-   **Suggestion Delay**: Adjust how long to wait before showing suggestions (100ms-2000ms)
-   **Presentation Style**: Choose how suggestions appear (inline, popup, or side panel)
-   **Page Context**: Enable/disable page analysis for improved suggestions
-   **Site Management**: Disable FlowWrite on specific websites
-   **Debug Mode**: Enable detailed console logging

## 📁 Project Structure

```
FlowWrite-Browser-Extension/
├── extension/                      # Chrome extension (client-side only)
│   ├── manifest.json               # Extension manifest
│   ├── background.js               # Service worker
│   ├── content.js                  # Main content script
│   ├── ai-provider-manager.js      # Multi-provider AI manager
│   ├── mutation-observer.js        # DOM mutation detection
│   ├── debug-utils.js              # Debugging utilities
│   ├── content.css                 # Suggestion styling
│   ├── popup/                      # Popup UI
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   ├── options/                    # Settings page
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   └── icons/                      # Extension icons
├── README.md                       # This file
├── CHANGELOG.md                    # Version history
├── package.json                    # Dev dependencies
└── generate-icons.js               # Icon generation script
```

## 🏗️ Architecture

### Client-Side Only

FlowWrite is entirely client-side with no backend required:

1. **Content Script** (`content.js`):

    - Detects typing in text fields
    - Requests suggestions from AI Provider Manager
    - Displays suggestions in real-time

2. **AI Provider Manager** (`ai-provider-manager.js`):

    - Unified model registry sorted by speed
    - Direct REST API calls to all three providers
    - Rate limit tracking per model
    - Intelligent fallback logic
    - Automatic model rotation

3. **Storage**:
    - API keys stored securely in `chrome.storage.local`
    - No data sent to external servers
    - All state managed locally

## 🔐 Security & Privacy

✅ **Fully Privacy-Preserving**:

-   No backend server collects your data
-   API keys stored only in your browser
-   Text is only sent to selected AI provider (Groq, Cerebras, or Gemini)
-   No tracking or analytics
-   No third-party data collection

## 💡 Usage

1. **Type in any text field** on any website
2. **Wait briefly** for AI suggestion to appear
3. **Accept suggestions**:
    - `Tab` - Accept entire suggestion
    - `Ctrl + Right Arrow` - Accept one word at a time
    - `Click` - Click on suggestion to accept
    - `Esc` - Dismiss suggestion

## 🔄 Fallback System

If configured with multiple providers, FlowWrite uses intelligent fallback:

**Default Priority** (based on speed):

1. Groq (fastest)
2. Cerebras (fast)
3. Gemini (reliable fallback)

**When to fallback**:

-   API key missing or invalid
-   Rate limits exceeded
-   API request fails
-   Timeout occurred

Each provider is tried in order until success.

## 📊 Supported Models

### Groq (Very Fast)

-   Groq Compound - 70k tokens/min
-   Llama 3.3 70B - 12k tokens/min
-   Mixtral 8x7B - 6k tokens/min

### Cerebras (Fast)

-   Qwen 3 Coder 480B - 150k tokens/min
-   Qwen 3 235B - 60k tokens/min
-   Llama 3.3 70B - 64k tokens/min

### Gemini (Reliable)

-   Gemini 2.5 Pro - 125k tokens/min
-   Gemini 2.0 Flash - 1M tokens/min
-   Gemini 1.5 Pro - 2M tokens/min

## 🚀 Performance

-   **Suggestion latency**: 200-500ms (configurable delay)
-   **Model rotation**: Instant (<10ms)
-   **Rate limit check**: <5ms
-   **Memory usage**: ~5-10MB

## 🛠️ Development

### Setup

```bash
npm install
npm run generate-icons
```

### Loading in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

### Debugging

-   Enable "Debug Mode" in options
-   Check browser console (F12) for logs
-   Look for `[AIProviderManager]` and `[FlowWrite]` prefixed messages

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Credits

-   [Google Gemini API](https://ai.google.dev/)
-   [Cerebras API](https://cerebras.ai/)
-   [Groq](https://groq.com/)
-   Built with ❤️ for developers and writers

---

**Questions or Issues?** Check out the [GitHub Issues](https://github.com/chirag127/FlowWrite-Browser-Extension-/issues)

## 🪪 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

-   Inspired by GitHub Copilot
-   Powered by Google Gemini AI
-   Built with Chrome Extension APIs

# FlowWrite Browser Extension

FlowWrite is a Chrome browser extension that provides real-time, inline AI-powered writing suggestions as you type in web forms and text fields. It's designed to be the "GitHub Copilot for everyday writing," seamlessly integrating into your workflow by offering intelligent, context-aware suggestions directly within the text field you're using.

![FlowWrite Logo](extension/icons/icon128.png)

## 🚀 Live Demo

Visit our [FlowWrite Website](https://chirag127.github.io/FlowWrite-Browser-Extension-/) to learn more about the extension and see it in action.

## ✨ Features

-   **Real-time AI Suggestions**: Get intelligent writing suggestions as you type, triggered by a brief pause.
-   **Multi-Provider Support**: Choose from multiple AI providers including Google Gemini, OpenAI, Anthropic Claude, and more.
-   **Client-Side Architecture**: All AI requests are made directly from your browser - no backend server required.
-   **Seamless Integration**: Accept suggestions instantly with the 'Tab' key or by clicking directly on them.
-   **Customizable Experience**: Configure suggestion delay, presentation style, AI provider, and site-specific settings.
-   **Privacy-Focused**: Your API keys are stored securely in your browser and never sent to any third-party servers.
-   **Site-Specific Control**: Enable or disable FlowWrite on specific websites.

## 🚀 Getting Started

### 📋 Prerequisites

-   Google Chrome browser
-   An API key from your preferred AI provider:
    -   [Google Gemini](https://aistudio.google.com/app/apikey)
    -   [OpenAI](https://platform.openai.com/api-keys)
    -   [Anthropic Claude](https://console.anthropic.com/settings/keys)
-   For development: Node.js and npm (only for icon generation)

### 💻 Installation for Users

1. Install the extension from the Chrome Web Store (link coming soon)
2. Click on the FlowWrite icon in your browser toolbar
3. Open the options page and configure your settings:
   - Select your preferred AI provider
   - Enter your API key
   - Customize other preferences
4. Start typing in any text field on the web!

### 🛠️ Installation for Developers

1. Clone the repository:

    ```bash
    git clone https://github.com/chirag127/FlowWrite-Browser-Extension-.git
    cd FlowWrite-Browser-Extension-
    ```

2. (Optional) Generate icons:

    ```bash
    npm install
    npm run generate-icons
    ```

3. Load the extension in Chrome:

    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top-right corner
    - Click "Load unpacked" and select the `extension` folder

## 🔧 Usage

1. Type in any text field on the web
2. Pause briefly to see AI-powered suggestions
3. Accept suggestions in one of three ways:
    - Press the 'Tab' key to accept the entire suggestion
    - Press 'Ctrl + Right Arrow' to accept only the next word of the suggestion (press and hold Ctrl, then press Right Arrow). You can press this repeatedly to accept multiple words one by one.
    - Click directly on the suggestion (works for all suggestion types: inline, popup, and side panel)
4. Press 'Esc' to dismiss a suggestion, or continue typing to ignore it

## ⚙️ Configuration Options

-   **AI Provider**: Select your preferred AI provider (Gemini, OpenAI, Claude, etc.)
-   **API Key**: Enter your API key for the selected provider
-   **Enable/Disable**: Toggle FlowWrite on or off globally
-   **Site Management**: Enable/disable FlowWrite for specific websites
-   **Suggestion Delay**: Adjust how long to wait before showing suggestions (200ms-2000ms)
-   **Presentation Style**: Choose how suggestions appear (inline, popup, side panel, or dual)
-   **Page Context**: Enable/disable page content analysis for more relevant suggestions

## 🔒 Privacy

FlowWrite takes your privacy seriously:

-   Your API keys are stored securely in your browser using `chrome.storage.local`
-   Your API keys are never sent to any third-party servers
-   All AI requests are made directly from your browser to your chosen AI provider
-   Only the text you type is sent to the AI provider for generating suggestions
-   No user-identifiable data is collected or stored
-   No backend server - completely client-side architecture

## 👨‍💻 Development

### Project Structure

```
FlowWrite-Browser-Extension/
├── extension/                  # Chrome extension code
│   ├── manifest.json           # Extension manifest file
│   ├── background.js           # Service worker for background tasks
│   ├── content.js              # Content script for text field detection and suggestions
│   ├── popup/                  # Popup UI
│   │   ├── popup.html          # Popup HTML
│   │   ├── popup.js            # Popup JavaScript
│   │   └── popup.css           # Popup styles
│   ├── options/                # Options page
│   │   ├── options.html        # Options page HTML
│   │   ├── options.js          # Options page JavaScript
│   │   └── options.css         # Options page styles
│   └── icons/                  # Extension icons
│       ├── icon16.png          # 16x16 icon
│       ├── icon48.png          # 48x48 icon
│       ├── icon128.png         # 128x128 icon
│       └── icon.svg            # Source SVG icon
├── index.html                  # Landing page for GitHub Pages
├── privacy-policy.html         # Privacy policy page for GitHub Pages
├── package.json                # Root package.json for development tools
├── generate-icons.js           # Script to generate PNG icons from SVG
└── README.md                   # Project documentation
```

### Architecture

FlowWrite uses a pure client-side architecture:

1. **Content Script (`content.js`)**:

    - Detects typing in text fields across web pages
    - Makes direct API calls to configured AI provider
    - Displays suggestions inline, in popup, or side panel
    - Handles user interactions with suggestions

2. **Background Service Worker (`background.js`)**:

    - Manages extension configuration storage
    - Handles communication between components
    - Manages extension lifecycle

3. **Options Page**:

    - Allows users to configure AI provider and API keys
    - Customize presentation and behavior settings
    - Manage site-specific permissions

4. **Popup UI**:
    - Provides quick access to enable/disable toggle
    - Shows current status and quick settings

### Multi-Provider Support

FlowWrite supports multiple AI providers through a unified interface. Each provider's API is called directly from the browser with the user's API key. Supported providers include:

-   Google Gemini (gemini-1.5-flash, gemini-1.5-pro)
-   OpenAI (gpt-4, gpt-3.5-turbo)
-   Anthropic Claude (claude-3-5-sonnet, claude-3-opus)
-   And more...

### Built With

-   [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
-   [Google Gemini API](https://ai.google.dev/docs)
-   [OpenAI API](https://platform.openai.com/docs)
-   [Anthropic API](https://docs.anthropic.com/)
-   [Sharp](https://sharp.pixelplumbing.com/) (for icon generation)

## 🙌 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🪪 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👏 Acknowledgments

-   Inspired by GitHub Copilot
-   Powered by multiple AI providers (Google Gemini, OpenAI, Anthropic, and more)
-   Built with Chrome Extension APIs

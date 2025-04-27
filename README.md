# FlowWrite Browser Extension

FlowWrite is a Chrome browser extension that provides real-time, inline AI-powered writing suggestions as you type in web forms and text fields. It's designed to be the "GitHub Copilot for everyday writing," seamlessly integrating into your workflow by offering intelligent, context-aware suggestions directly within the text field you're using.

![FlowWrite Logo](extension/icons/icon128.png)

## Features

-   **Real-time AI Suggestions**: Get intelligent writing suggestions as you type, triggered by a brief pause.
-   **Seamless Integration**: Accept suggestions instantly with the 'Tab' key.
-   **Customizable Experience**: Configure suggestion delay, presentation style, and site-specific settings.
-   **Privacy-Focused**: Your API key is stored securely in your browser and never on our servers.
-   **Site-Specific Control**: Enable or disable FlowWrite on specific websites.

## Getting Started

### Prerequisites

-   Google Chrome browser
-   A Google Gemini API key (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))
-   For development: Node.js and npm

### Installation for Users

1. Install the extension from the Chrome Web Store (link coming soon)
2. Click on the FlowWrite icon in your browser toolbar
3. Open the options page and enter your Google Gemini API key
4. Configure your preferences
5. Start typing in any text field on the web!

### Installation for Developers

1. Clone the repository:

    ```bash
    git clone https://github.com/chirag127/FlowWrite-Browser-Extension-.git
    cd FlowWrite-Browser-Extension-
    ```

2. Install dependencies:

    ```bash
    npm install
    cd backend
    npm install
    cd ..
    ```

3. Generate icons (if needed):

    ```bash
    npm run generate-icons
    ```

4. Load the extension in Chrome:

    - Open Chrome and navigate to `chrome://extensions/`
    - Enable "Developer mode" in the top-right corner
    - Click "Load unpacked" and select the `extension` folder

5. Start the backend server:
    ```bash
    cd backend
    npm run dev
    ```

## Usage

1. Type in any text field on the web
2. Pause briefly to see AI-powered suggestions
3. Press 'Tab' to accept a suggestion or continue typing to ignore it
4. Press 'Esc' to dismiss a suggestion

## Configuration Options

-   **API Key**: Enter your Google Gemini API key
-   **Enable/Disable**: Toggle FlowWrite on or off globally
-   **Site Management**: Enable/disable FlowWrite for specific websites
-   **Suggestion Delay**: Adjust how long to wait before showing suggestions (200ms-2000ms)
-   **Presentation Style**: Choose how suggestions appear (inline, popup, or side panel)

## Privacy

FlowWrite takes your privacy seriously:

-   Your API key is stored securely in your browser using `chrome.storage.local`
-   Your API key is never stored on our servers
-   Your text is only sent to Google Gemini API for generating suggestions
-   No user-identifiable data is collected

## Development

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
├── backend/                    # Node.js backend
│   ├── server.js               # Main server file
│   ├── routes/                 # API routes
│   │   └── api.js              # API endpoints
│   ├── models/                 # MongoDB models
│   │   └── telemetry.js        # Telemetry data model
│   ├── config/                 # Configuration files
│   │   └── db.js               # Database configuration
│   ├── package.json            # Backend dependencies
│   └── README.md               # Backend documentation
├── package.json                # Root package.json for development tools
├── generate-icons.js           # Script to generate PNG icons from SVG
└── README.md                   # Project documentation
```

### Architecture

FlowWrite follows a client-server architecture:

1. **Frontend (Chrome Extension)**:

    - **Content Script**: Detects typing in text fields, sends context to the backend, and displays suggestions
    - **Background Service Worker**: Handles communication and extension lifecycle
    - **Options Page**: Allows users to configure the extension
    - **Popup UI**: Provides quick access to common functions

2. **Backend (Node.js/Express)**:
    - **API Endpoints**: Handle requests from the extension
    - **Gemini API Integration**: Forwards requests to Google Gemini API
    - **Telemetry Collection**: Optionally collects anonymous usage data

### API Endpoints

-   **POST /api/suggest**: Generates text suggestions

    -   Request: `{ context: string, apiKey: string }`
    -   Response: `{ suggestion: string }`

-   **POST /api/telemetry**: Records anonymous telemetry data
    -   Request: `{ accepted: boolean }`
    -   Response: `{ message: string }`

### Built With

-   [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
-   [Google Gemini API](https://ai.google.dev/docs)
-   [Node.js](https://nodejs.org/)
-   [Express](https://expressjs.com/)
-   [MongoDB](https://www.mongodb.com/)
-   [Sharp](https://sharp.pixelplumbing.com/) (for icon generation)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   Inspired by GitHub Copilot
-   Powered by Google Gemini AI
-   Built with Chrome Extension APIs

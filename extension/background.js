/**
 * FlowWrite Background Service Worker
 *
 * This service worker:
 * 1. Handles communication between the content script and the options page
 * 2. Initializes the extension
 * 3. Handles browser action clicks
 */

// Default configuration
const DEFAULT_CONFIG = {
    apiKey: "",
    providers: {
        gemini: {
            enabled: false,
            apiKey: "",
            model: "gemini-1.5-flash"
        },
        cerebras: {
            enabled: false,
            apiKey: "",
            model: "llama3.1-8b"
        },
        groq: {
            enabled: false,
            apiKey: "",
            model: "llama-3.3-70b-versatile"
        }
    },
    isEnabled: true,
    disabledSites: [],
    suggestionDelay: 500,
    presentationMode: "inline",
    enablePageContext: true,
    debugMode: false,
};

/**
 * Initialize the extension
 */
function init() {
    chrome.storage.local.get(
        [
            "apiKey",
            "providers",
            "isEnabled",
            "disabledSites",
            "suggestionDelay",
            "presentationMode",
            "enablePageContext",
            "debugMode",
        ],
        (result) => {
            const updates = {};

            if (result.apiKey === undefined)
                updates.apiKey = DEFAULT_CONFIG.apiKey;
            if (result.providers === undefined)
                updates.providers = DEFAULT_CONFIG.providers;
            if (result.isEnabled === undefined)
                updates.isEnabled = DEFAULT_CONFIG.isEnabled;
            if (result.disabledSites === undefined)
                updates.disabledSites = DEFAULT_CONFIG.disabledSites;
            if (result.suggestionDelay === undefined)
                updates.suggestionDelay = DEFAULT_CONFIG.suggestionDelay;
            if (result.presentationMode === undefined)
                updates.presentationMode = DEFAULT_CONFIG.presentationMode;
            if (result.enablePageContext === undefined)
                updates.enablePageContext = DEFAULT_CONFIG.enablePageContext;
            if (result.debugMode === undefined)
                updates.debugMode = DEFAULT_CONFIG.debugMode;

            if (Object.keys(updates).length > 0) {
                chrome.storage.local.set(updates);
            }
        }
    );
}

/**
 * Handle browser action clicks
 */
chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage();
});

/**
 * Handle messages from content scripts or options page
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    switch (message.type) {
        case "GET_CONFIG":
            chrome.storage.local.get(
                [
                    "apiKey",
                    "providers",
                    "isEnabled",
                    "disabledSites",
                    "suggestionDelay",
                    "presentationMode",
                    "enablePageContext",
                    "debugMode",
                ],
                (result) => {
                    sendResponse(result);
                }
            );
            return true;

        case "SET_CONFIG":
            chrome.storage.local.set(message.config, () => {
                sendResponse({ success: true });
            });
            return true;

        case "CLEAR_CONFIG":
            chrome.storage.local.set(DEFAULT_CONFIG, () => {
                sendResponse({ success: true });
            });
            return true;

        case "CHECK_API_KEY":
            validateProviderApiKey(message.provider, message.apiKey, sendResponse);
            return true;

        default:
            sendResponse({ error: "Unknown message type" });
            return false;
    }
});

/**
 * Validate API key for a specific provider
 * @param {string} provider - Provider name (gemini, cerebras, groq)
 * @param {string} apiKey - API key to validate
 * @param {Function} sendResponse - Callback function
 */
function validateProviderApiKey(provider, apiKey, sendResponse) {
    if (!apiKey) {
        sendResponse({ valid: false, error: "API key is empty" });
        return;
    }

    // Basic validation - just check format
    switch (provider) {
        case "gemini":
            // Gemini API keys typically start with "AI" and are 39 characters
            if (apiKey.length < 20) {
                sendResponse({ valid: false, error: "API key appears to be too short" });
            } else {
                sendResponse({ valid: true });
            }
            break;

        case "cerebras":
            // Cerebras API keys format validation
            if (apiKey.length < 20) {
                sendResponse({ valid: false, error: "API key appears to be too short" });
            } else {
                sendResponse({ valid: true });
            }
            break;

        case "groq":
            // Groq API keys typically start with "gsk_"
            if (apiKey.startsWith("gsk_") && apiKey.length > 20) {
                sendResponse({ valid: true });
            } else if (apiKey.length < 20) {
                sendResponse({ valid: false, error: "API key appears to be too short" });
            } else {
                sendResponse({ valid: true });
            }
            break;

        default:
            sendResponse({ valid: false, error: "Unknown provider" });
            break;
    }
}

// Initialize the extension when the service worker starts
init();

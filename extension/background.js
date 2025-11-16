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
    // Initialize storage with default values if not set
    chrome.storage.local.get(
        [
            "apiKey",
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

            // Only update if there are changes
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
    // Open the options page
    chrome.runtime.openOptionsPage();
});

/**
 * Handle messages from content scripts or options page
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Handle different message types
    switch (message.type) {
        case "GET_CONFIG":
            // Get the configuration from storage
            chrome.storage.local.get(
                [
                    "apiKey",
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
            return true; // Keep the message channel open for the async response

        case "SET_CONFIG":
            // Update the configuration in storage
            chrome.storage.local.set(message.config, () => {
                sendResponse({ success: true });
            });
            return true; // Keep the message channel open for the async response

        case "CLEAR_CONFIG":
            // Reset the configuration to defaults
            chrome.storage.local.set(DEFAULT_CONFIG, () => {
                sendResponse({ success: true });
            });
            return true; // Keep the message channel open for the async response

        case "CHECK_API_KEY":
            // Check if the API key is valid
            if (!message.apiKey) {
                sendResponse({ valid: false, error: "API key is empty" });
            } else {
                sendResponse({ valid: true });
            }
            return false; // No async response needed

        default:
            // Unknown message type
            sendResponse({ error: "Unknown message type" });
            return false; // No async response needed
    }
});

// Initialize the extension when the service worker starts
init();

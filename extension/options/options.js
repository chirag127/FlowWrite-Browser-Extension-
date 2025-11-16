/**
 * FlowWrite Options Page Script
 *
 * This script handles the options page functionality:
 * 1. Loading and saving options
 * 2. Handling user interactions
 * 3. Validating inputs
 * 4. Displaying status messages
 */

// DOM Elements - Provider Configuration
const geminiEnabledToggle = document.getElementById("geminiEnabled");
const geminiApiKeyInput = document.getElementById("geminiApiKey");
const geminiModelSelect = document.getElementById("geminiModel");
const geminiStatus = document.getElementById("geminiStatus");

const cerebrasEnabledToggle = document.getElementById("cerebrasEnabled");
const cerebrasApiKeyInput = document.getElementById("cerebrasApiKey");
const cerebrasModelSelect = document.getElementById("cerebrasModel");
const cerebrasStatus = document.getElementById("cerebrasStatus");

const groqEnabledToggle = document.getElementById("groqEnabled");
const groqApiKeyInput = document.getElementById("groqApiKey");
const groqModelSelect = document.getElementById("groqModel");
const groqStatus = document.getElementById("groqStatus");

// DOM Elements - General Settings
const isEnabledToggle = document.getElementById("isEnabled");
const suggestionDelaySlider = document.getElementById("suggestionDelay");
const suggestionDelayValue = document.getElementById("suggestionDelayValue");
const presentationModeSelect = document.getElementById("presentationMode");
const enablePageContextToggle = document.getElementById("enablePageContext");
const debugModeToggle = document.getElementById("debugMode");
const disabledSitesTextarea = document.getElementById("disabledSites");
const saveOptionsButton = document.getElementById("saveOptions");
const clearOptionsButton = document.getElementById("clearOptions");
const toast = document.getElementById("toast");

// Default configuration
const DEFAULT_CONFIG = {
    // Legacy API key (for backward compatibility)
    apiKey: "",
    
    // Provider configurations
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
    
    // General settings
    isEnabled: true,
    disabledSites: [],
    suggestionDelay: 500,
    presentationMode: "inline",
    enablePageContext: true,
    debugMode: false,
};

/**
 * Initialize the options page
 */
function init() {
    loadOptions();
    setupEventListeners();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Toggle key visibility buttons
    document.querySelectorAll(".toggle-key").forEach(button => {
        button.addEventListener("click", () => {
            const targetId = button.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (input.type === "password") {
                input.type = "text";
                button.textContent = "🔒";
                button.title = "Hide API Key";
            } else {
                input.type = "password";
                button.textContent = "👁️";
                button.title = "Show API Key";
            }
        });
    });

    // Validate key buttons
    document.querySelectorAll(".validate-key").forEach(button => {
        button.addEventListener("click", () => {
            const provider = button.getAttribute("data-provider");
            validateApiKey(provider);
        });
    });

    // General settings listeners
    suggestionDelaySlider.addEventListener("input", updateSuggestionDelayValue);
    saveOptionsButton.addEventListener("click", saveOptions);
    clearOptionsButton.addEventListener("click", clearOptions);
}

/**
 * Load options from storage
 */
function loadOptions() {
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
            // Handle legacy API key migration
            const providers = result.providers || DEFAULT_CONFIG.providers;
            
            // If there's a legacy apiKey and no providers configured, migrate it
            if (result.apiKey && !providers.gemini.apiKey) {
                providers.gemini.apiKey = result.apiKey;
                providers.gemini.enabled = true;
            }

            // Load provider configurations
            geminiEnabledToggle.checked = providers.gemini?.enabled || false;
            geminiApiKeyInput.value = providers.gemini?.apiKey || "";
            geminiModelSelect.value = providers.gemini?.model || "gemini-1.5-flash";

            cerebrasEnabledToggle.checked = providers.cerebras?.enabled || false;
            cerebrasApiKeyInput.value = providers.cerebras?.apiKey || "";
            cerebrasModelSelect.value = providers.cerebras?.model || "llama3.1-8b";

            groqEnabledToggle.checked = providers.groq?.enabled || false;
            groqApiKeyInput.value = providers.groq?.apiKey || "";
            groqModelSelect.value = providers.groq?.model || "llama-3.3-70b-versatile";

            // Load general settings
            isEnabledToggle.checked =
                result.isEnabled !== undefined
                    ? result.isEnabled
                    : DEFAULT_CONFIG.isEnabled;
            suggestionDelaySlider.value =
                result.suggestionDelay || DEFAULT_CONFIG.suggestionDelay;
            updateSuggestionDelayValue();
            presentationModeSelect.value =
                result.presentationMode || DEFAULT_CONFIG.presentationMode;

            enablePageContextToggle.checked =
                result.enablePageContext !== undefined
                    ? result.enablePageContext
                    : DEFAULT_CONFIG.enablePageContext;

            const disabledSites =
                result.disabledSites || DEFAULT_CONFIG.disabledSites;
            disabledSitesTextarea.value = disabledSites.join("\n");

            debugModeToggle.checked =
                result.debugMode !== undefined
                    ? result.debugMode
                    : DEFAULT_CONFIG.debugMode;
        }
    );
}

/**
 * Save options to storage
 */
function saveOptions() {
    // Get provider configurations
    const providers = {
        gemini: {
            enabled: geminiEnabledToggle.checked,
            apiKey: geminiApiKeyInput.value.trim(),
            model: geminiModelSelect.value
        },
        cerebras: {
            enabled: cerebrasEnabledToggle.checked,
            apiKey: cerebrasApiKeyInput.value.trim(),
            model: cerebrasModelSelect.value
        },
        groq: {
            enabled: groqEnabledToggle.checked,
            apiKey: groqApiKeyInput.value.trim(),
            model: groqModelSelect.value
        }
    };

    // Get general settings
    const isEnabled = isEnabledToggle.checked;
    const suggestionDelay = parseInt(suggestionDelaySlider.value);
    const presentationMode = presentationModeSelect.value;

    const disabledSitesText = disabledSitesTextarea.value.trim();
    const disabledSites = disabledSitesText
        ? disabledSitesText
              .split("\n")
              .map((site) => site.trim())
              .filter((site) => site)
        : [];

    const enablePageContext = enablePageContextToggle.checked;
    const debugMode = debugModeToggle.checked;

    // For backward compatibility, set apiKey to the first enabled provider's key
    let apiKey = "";
    if (providers.gemini.enabled && providers.gemini.apiKey) {
        apiKey = providers.gemini.apiKey;
    } else if (providers.cerebras.enabled && providers.cerebras.apiKey) {
        apiKey = providers.cerebras.apiKey;
    } else if (providers.groq.enabled && providers.groq.apiKey) {
        apiKey = providers.groq.apiKey;
    }

    // Create config object
    const config = {
        apiKey,
        providers,
        isEnabled,
        disabledSites,
        suggestionDelay,
        presentationMode,
        enablePageContext,
        debugMode,
    };

    // Save to storage
    chrome.storage.local.set(config, () => {
        showToast("Options saved successfully");
    });
}

/**
 * Clear options and reset to defaults
 */
function clearOptions() {
    if (
        confirm(
            "Are you sure you want to reset all options to defaults? This will remove all API keys."
        )
    ) {
        chrome.storage.local.set(DEFAULT_CONFIG, () => {
            loadOptions();
            showToast("Options reset to defaults");
        });
    }
}

/**
 * Update suggestion delay value display
 */
function updateSuggestionDelayValue() {
    suggestionDelayValue.textContent = `${suggestionDelaySlider.value} ms`;
}

/**
 * Validate API key for a specific provider
 * @param {string} provider - The provider name (gemini, cerebras, groq)
 */
function validateApiKey(provider) {
    let apiKeyInput, statusElement, apiKey;

    // Get the appropriate elements based on provider
    switch (provider) {
        case "gemini":
            apiKeyInput = geminiApiKeyInput;
            statusElement = geminiStatus;
            break;
        case "cerebras":
            apiKeyInput = cerebrasApiKeyInput;
            statusElement = cerebrasStatus;
            break;
        case "groq":
            apiKeyInput = groqApiKeyInput;
            statusElement = groqStatus;
            break;
        default:
            return;
    }

    apiKey = apiKeyInput.value.trim();

    // Clear previous status
    statusElement.textContent = "";
    statusElement.className = "status-message";

    // If API key is empty, show warning
    if (!apiKey) {
        statusElement.textContent = "Please enter an API key";
        statusElement.classList.add("status-warning");
        return;
    }

    // Show loading status
    statusElement.textContent = "Validating API key...";

    // Send message to background script to check API key
    chrome.runtime.sendMessage(
        { type: "CHECK_API_KEY", provider, apiKey },
        (response) => {
            if (chrome.runtime.lastError) {
                statusElement.textContent = "Error: Could not validate API key";
                statusElement.classList.add("status-error");
                return;
            }

            if (response && response.valid) {
                statusElement.textContent = "✓ API key is valid";
                statusElement.classList.add("status-success");
            } else {
                statusElement.textContent = response?.error || "✗ Invalid API key";
                statusElement.classList.add("status-error");
            }
        }
    );
}

/**
 * Show a toast notification
 * @param {string} message - The message to show
 */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// Initialize the options page
document.addEventListener("DOMContentLoaded", init);

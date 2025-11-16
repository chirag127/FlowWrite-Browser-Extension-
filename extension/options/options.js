/**
 * FlowWrite Options Page Script
 *
 * This script handles the options page functionality:
 * 1. Loading and saving options
 * 2. Handling user interactions
 * 3. Validating inputs
 * 4. Displaying status messages
 */

// Model metadata with capability information
const MODEL_METADATA = {
    // Gemini Models
    'gemini-2.0-flash-exp': {
        name: 'Gemini 2.0 Flash (Experimental)',
        badges: ['experimental', 'speed', 'quality'],
        description: 'Latest experimental model with enhanced speed and quality. Best for real-time suggestions.'
    },
    'gemini-2.0-flash-thinking-exp-1219': {
        name: 'Gemini 2.0 Flash Thinking',
        badges: ['experimental', 'thinking', 'quality'],
        description: 'Experimental model with enhanced reasoning capabilities. Ideal for complex writing tasks.'
    },
    'gemini-1.5-flash': {
        name: 'Gemini 1.5 Flash',
        badges: ['speed', 'quality'],
        description: 'Fast and balanced model for everyday writing. Stable and reliable.'
    },
    'gemini-1.5-flash-8b': {
        name: 'Gemini 1.5 Flash 8B',
        badges: ['speed', 'size-small'],
        description: 'Ultra-fast smaller model. Ideal for quick suggestions with minimal latency.'
    },
    'gemini-1.5-pro': {
        name: 'Gemini 1.5 Pro',
        badges: ['quality', 'size-large'],
        description: 'High-quality model for professional writing. Best accuracy and coherence.'
    },
    'gemini-1.5-pro-002': {
        name: 'Gemini 1.5 Pro 002',
        badges: ['quality', 'size-large'],
        description: 'Updated Pro model with improved performance and accuracy.'
    },
    'gemini-1.0-pro': {
        name: 'Gemini 1.0 Pro',
        badges: ['quality'],
        description: 'Legacy stable model. Reliable for general writing tasks.'
    },
    'gemini-exp-1206': {
        name: 'Gemini Experimental 1206',
        badges: ['experimental', 'quality'],
        description: 'Cutting-edge experimental model. May have breaking changes.'
    },
    'gemini-exp-1121': {
        name: 'Gemini Experimental 1121',
        badges: ['experimental', 'quality'],
        description: 'Earlier experimental release. Testing new capabilities.'
    },

    // Cerebras Models
    'qwen2.5-coder-32b': {
        name: 'Qwen 2.5 Coder 32B',
        badges: ['coding', 'speed', 'size-medium'],
        description: 'Specialized for code and technical writing. Fast inference on Cerebras hardware.'
    },
    'qwq-32b-preview': {
        name: 'QwQ 32B Preview',
        badges: ['experimental', 'thinking', 'size-medium'],
        description: 'Preview model with advanced reasoning. Experimental release.'
    },
    'llama-3.3-70b': {
        name: 'Llama 3.3 70B',
        badges: ['quality', 'size-large', 'speed'],
        description: 'Latest Llama model with excellent quality. Optimized for Cerebras.'
    },
    'llama3.1-8b': {
        name: 'Llama 3.1 8B',
        badges: ['speed', 'size-small'],
        description: 'Fast and efficient smaller model. Great for quick suggestions.'
    },
    'llama3.1-70b': {
        name: 'Llama 3.1 70B',
        badges: ['quality', 'size-large'],
        description: 'High-quality large model. Excellent for complex writing.'
    },
    'deepseek-r1-distill-llama-70b': {
        name: 'DeepSeek R1 Distill Llama 70B',
        badges: ['thinking', 'quality', 'size-large'],
        description: 'Advanced reasoning model. Excels at complex and nuanced writing.'
    },

    // Groq Models
    'llama-3.3-70b-versatile': {
        name: 'Llama 3.3 70B Versatile',
        badges: ['quality', 'speed', 'size-large'],
        description: 'Latest versatile model with exceptional speed on Groq. Best all-around choice.'
    },
    'llama-3.3-70b-specdec': {
        name: 'Llama 3.3 70B SpecDec',
        badges: ['speed', 'quality', 'size-large'],
        description: 'Speculative decoding for ultra-fast inference. Fastest large model.'
    },
    'llama-3.1-70b-versatile': {
        name: 'Llama 3.1 70B Versatile',
        badges: ['quality', 'size-large'],
        description: 'Versatile model for various writing tasks. Stable and reliable.'
    },
    'llama-3.1-8b-instant': {
        name: 'Llama 3.1 8B Instant',
        badges: ['speed', 'size-small'],
        description: 'Instant responses with minimal latency. Perfect for real-time suggestions.'
    },
    'mixtral-8x7b-32768': {
        name: 'Mixtral 8x7B',
        badges: ['quality', 'size-medium'],
        description: 'Mixture of Experts model. Good balance of speed and quality.'
    },
    'gemma2-9b-it': {
        name: 'Gemma 2 9B',
        badges: ['speed', 'size-small'],
        description: 'Efficient instruction-tuned model. Fast and lightweight.'
    },
    'gemma-7b-it': {
        name: 'Gemma 7B',
        badges: ['speed', 'size-small'],
        description: 'Lightweight instruction-tuned model. Very fast responses.'
    }
};

const BADGE_LABELS = {
    'speed': '⚡ Fast',
    'quality': '🎯 High Quality',
    'size-small': '💎 Compact',
    'size-medium': '📦 Medium',
    'size-large': '🏰 Large',
    'experimental': '🔬 Experimental',
    'coding': '💻 Code',
    'thinking': '🧠 Reasoning'
};

// DOM Elements - Provider Configuration
const geminiEnabledToggle = document.getElementById("geminiEnabled");
const geminiApiKeyInput = document.getElementById("geminiApiKey");
const geminiModelSelect = document.getElementById("geminiModel");
const geminiStatus = document.getElementById("geminiStatus");
const geminiModelInfo = document.getElementById("geminiModelInfo");

const cerebrasEnabledToggle = document.getElementById("cerebrasEnabled");
const cerebrasApiKeyInput = document.getElementById("cerebrasApiKey");
const cerebrasModelSelect = document.getElementById("cerebrasModel");
const cerebrasStatus = document.getElementById("cerebrasStatus");
const cerebrasModelInfo = document.getElementById("cerebrasModelInfo");

const groqEnabledToggle = document.getElementById("groqEnabled");
const groqApiKeyInput = document.getElementById("groqApiKey");
const groqModelSelect = document.getElementById("groqModel");
const groqStatus = document.getElementById("groqStatus");
const groqModelInfo = document.getElementById("groqModelInfo");

const fallbackOrderContainer = document.getElementById("fallbackOrder");

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
 * Initialize the options page
 */
function init() {
    loadOptions();
    setupEventListeners();
    updateModelInfo('gemini', geminiModelSelect.value);
    updateModelInfo('cerebras', cerebrasModelSelect.value);
    updateModelInfo('groq', groqModelSelect.value);
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

    // Model selection listeners
    geminiModelSelect.addEventListener("change", (e) => {
        updateModelInfo('gemini', e.target.value);
    });
    cerebrasModelSelect.addEventListener("change", (e) => {
        updateModelInfo('cerebras', e.target.value);
    });
    groqModelSelect.addEventListener("change", (e) => {
        updateModelInfo('groq', e.target.value);
    });

    // Provider toggle listeners
    geminiEnabledToggle.addEventListener("change", updateFallbackOrder);
    cerebrasEnabledToggle.addEventListener("change", updateFallbackOrder);
    groqEnabledToggle.addEventListener("change", updateFallbackOrder);

    // General settings listeners
    suggestionDelaySlider.addEventListener("input", updateSuggestionDelayValue);
    saveOptionsButton.addEventListener("click", saveOptions);
    clearOptionsButton.addEventListener("click", clearOptions);
}

/**
 * Update model information display
 */
function updateModelInfo(provider, modelId) {
    let infoElement;
    
    switch (provider) {
        case 'gemini':
            infoElement = geminiModelInfo;
            break;
        case 'cerebras':
            infoElement = cerebrasModelInfo;
            break;
        case 'groq':
            infoElement = groqModelInfo;
            break;
        default:
            return;
    }

    const metadata = MODEL_METADATA[modelId];
    if (!metadata) {
        infoElement.style.display = 'none';
        return;
    }

    infoElement.style.display = 'block';

    const badgesContainer = infoElement.querySelector('.capability-badges');
    const descriptionContainer = infoElement.querySelector('.model-description');

    badgesContainer.innerHTML = metadata.badges
        .map(badge => {
            const label = BADGE_LABELS[badge] || badge;
            const badgeClass = badge.startsWith('size-') ? 'badge-size' : `badge-${badge}`;
            return `<span class="badge ${badgeClass}">${label}</span>`;
        })
        .join('');

    descriptionContainer.textContent = metadata.description;
}

/**
 * Update fallback order visualization
 */
function updateFallbackOrder() {
    const enabledProviders = [];

    if (geminiEnabledToggle.checked && geminiApiKeyInput.value.trim()) {
        enabledProviders.push({
            name: 'Google Gemini',
            model: MODEL_METADATA[geminiModelSelect.value]?.name || geminiModelSelect.value,
            provider: 'gemini'
        });
    }

    if (cerebrasEnabledToggle.checked && cerebrasApiKeyInput.value.trim()) {
        enabledProviders.push({
            name: 'Cerebras',
            model: MODEL_METADATA[cerebrasModelSelect.value]?.name || cerebrasModelSelect.value,
            provider: 'cerebras'
        });
    }

    if (groqEnabledToggle.checked && groqApiKeyInput.value.trim()) {
        enabledProviders.push({
            name: 'Groq',
            model: MODEL_METADATA[groqModelSelect.value]?.name || groqModelSelect.value,
            provider: 'groq'
        });
    }

    if (enabledProviders.length === 0) {
        fallbackOrderContainer.innerHTML = '<div class="fallback-empty">No providers enabled. Enable at least one provider above.</div>';
        return;
    }

    fallbackOrderContainer.innerHTML = enabledProviders
        .map((provider, index) => {
            const isPrimary = index === 0;
            return `
                <div class="fallback-item ${isPrimary ? 'primary' : ''}">
                    <div class="fallback-number">${index + 1}</div>
                    <div class="fallback-provider">
                        <div class="fallback-provider-name">${provider.name}</div>
                        <div class="fallback-provider-model">${provider.model}</div>
                    </div>
                    <div class="fallback-status ${isPrimary ? 'primary' : 'fallback'}">
                        ${isPrimary ? '● Primary' : '○ Fallback'}
                    </div>
                </div>
            `;
        })
        .join('');
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
            const providers = result.providers || DEFAULT_CONFIG.providers;
            
            if (result.apiKey && !providers.gemini.apiKey) {
                providers.gemini.apiKey = result.apiKey;
                providers.gemini.enabled = true;
            }

            geminiEnabledToggle.checked = providers.gemini?.enabled || false;
            geminiApiKeyInput.value = providers.gemini?.apiKey || "";
            geminiModelSelect.value = providers.gemini?.model || "gemini-1.5-flash";

            cerebrasEnabledToggle.checked = providers.cerebras?.enabled || false;
            cerebrasApiKeyInput.value = providers.cerebras?.apiKey || "";
            cerebrasModelSelect.value = providers.cerebras?.model || "llama3.1-8b";

            groqEnabledToggle.checked = providers.groq?.enabled || false;
            groqApiKeyInput.value = providers.groq?.apiKey || "";
            groqModelSelect.value = providers.groq?.model || "llama-3.3-70b-versatile";

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

            updateFallbackOrder();
        }
    );
}

/**
 * Save options to storage
 */
function saveOptions() {
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

    let apiKey = "";
    if (providers.gemini.enabled && providers.gemini.apiKey) {
        apiKey = providers.gemini.apiKey;
    } else if (providers.cerebras.enabled && providers.cerebras.apiKey) {
        apiKey = providers.cerebras.apiKey;
    } else if (providers.groq.enabled && providers.groq.apiKey) {
        apiKey = providers.groq.apiKey;
    }

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

    chrome.storage.local.set(config, () => {
        showToast("Options saved successfully");
        updateFallbackOrder();
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
 */
async function validateApiKey(provider) {
    let apiKeyInput, statusElement, modelSelect, apiKey;

    switch (provider) {
        case "gemini":
            apiKeyInput = geminiApiKeyInput;
            statusElement = geminiStatus;
            modelSelect = geminiModelSelect;
            break;
        case "cerebras":
            apiKeyInput = cerebrasApiKeyInput;
            statusElement = cerebrasStatus;
            modelSelect = cerebrasModelSelect;
            break;
        case "groq":
            apiKeyInput = groqApiKeyInput;
            statusElement = groqStatus;
            modelSelect = groqModelSelect;
            break;
        default:
            return;
    }

    apiKey = apiKeyInput.value.trim();

    statusElement.textContent = "";
    statusElement.className = "status-message";

    if (!apiKey) {
        statusElement.textContent = "Please enter an API key";
        statusElement.classList.add("status-warning");
        return;
    }

    statusElement.textContent = "🔄 Testing API connection...";

    const model = modelSelect.value;

    try {
        const result = await testProviderAPI(provider, apiKey, model);
        
        if (result.success) {
            statusElement.textContent = `✓ API key is valid • Response time: ${result.responseTime}ms`;
            statusElement.classList.add("status-success");
        } else {
            statusElement.textContent = `✗ ${result.error}`;
            statusElement.classList.add("status-error");
        }
    } catch (error) {
        statusElement.textContent = `✗ Validation failed: ${error.message}`;
        statusElement.classList.add("status-error");
    }
}

/**
 * Test provider API with a simple request
 */
async function testProviderAPI(provider, apiKey, model) {
    const startTime = Date.now();

    try {
        let endpoint, requestBody, headers;

        switch (provider) {
            case 'gemini':
                endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                headers = { 'Content-Type': 'application/json' };
                requestBody = {
                    contents: [{
                        parts: [{ text: 'Hello' }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 10
                    }
                };
                break;

            case 'cerebras':
                endpoint = 'https://api.cerebras.ai/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10,
                    temperature: 0.7
                };
                break;

            case 'groq':
                endpoint = 'https://api.groq.com/openai/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                };
                requestBody = {
                    model: model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 10,
                    temperature: 0.7
                };
                break;

            default:
                throw new Error('Unknown provider');
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`,
                responseTime
            };
        }

        return {
            success: true,
            responseTime
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            responseTime: Date.now() - startTime
        };
    }
}

/**
 * Show a toast notification
 */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

document.addEventListener("DOMContentLoaded", init);

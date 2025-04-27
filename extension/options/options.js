/**
 * FlowWrite Options Page Script
 * 
 * This script handles the options page functionality:
 * 1. Loading and saving options
 * 2. Handling user interactions
 * 3. Validating inputs
 * 4. Displaying status messages
 */

// DOM Elements
const apiKeyInput = document.getElementById('apiKey');
const toggleApiKeyButton = document.getElementById('toggleApiKey');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const isEnabledToggle = document.getElementById('isEnabled');
const suggestionDelaySlider = document.getElementById('suggestionDelay');
const suggestionDelayValue = document.getElementById('suggestionDelayValue');
const presentationModeSelect = document.getElementById('presentationMode');
const disabledSitesTextarea = document.getElementById('disabledSites');
const saveOptionsButton = document.getElementById('saveOptions');
const clearOptionsButton = document.getElementById('clearOptions');
const toast = document.getElementById('toast');

// Default configuration
const DEFAULT_CONFIG = {
  apiKey: '',
  isEnabled: true,
  disabledSites: [],
  suggestionDelay: 500,
  presentationMode: 'inline'
};

/**
 * Initialize the options page
 */
function init() {
  // Load options from storage
  loadOptions();
  
  // Add event listeners
  toggleApiKeyButton.addEventListener('click', toggleApiKeyVisibility);
  suggestionDelaySlider.addEventListener('input', updateSuggestionDelayValue);
  saveOptionsButton.addEventListener('click', saveOptions);
  clearOptionsButton.addEventListener('click', clearOptions);
  apiKeyInput.addEventListener('blur', validateApiKey);
}

/**
 * Load options from storage
 */
function loadOptions() {
  chrome.storage.local.get(
    ['apiKey', 'isEnabled', 'disabledSites', 'suggestionDelay', 'presentationMode'],
    (result) => {
      // Set values in the form
      apiKeyInput.value = result.apiKey || '';
      isEnabledToggle.checked = result.isEnabled !== undefined ? result.isEnabled : DEFAULT_CONFIG.isEnabled;
      suggestionDelaySlider.value = result.suggestionDelay || DEFAULT_CONFIG.suggestionDelay;
      updateSuggestionDelayValue();
      presentationModeSelect.value = result.presentationMode || DEFAULT_CONFIG.presentationMode;
      
      // Convert disabledSites array to string
      const disabledSites = result.disabledSites || DEFAULT_CONFIG.disabledSites;
      disabledSitesTextarea.value = disabledSites.join('\n');
      
      // Validate API key
      if (result.apiKey) {
        validateApiKey();
      }
    }
  );
}

/**
 * Save options to storage
 */
function saveOptions() {
  // Get values from the form
  const apiKey = apiKeyInput.value.trim();
  const isEnabled = isEnabledToggle.checked;
  const suggestionDelay = parseInt(suggestionDelaySlider.value);
  const presentationMode = presentationModeSelect.value;
  
  // Convert disabledSites string to array
  const disabledSitesText = disabledSitesTextarea.value.trim();
  const disabledSites = disabledSitesText
    ? disabledSitesText.split('\n').map(site => site.trim()).filter(site => site)
    : [];
  
  // Create config object
  const config = {
    apiKey,
    isEnabled,
    disabledSites,
    suggestionDelay,
    presentationMode
  };
  
  // Save to storage
  chrome.storage.local.set(config, () => {
    showToast('Options saved');
  });
}

/**
 * Clear options and reset to defaults
 */
function clearOptions() {
  // Confirm with the user
  if (confirm('Are you sure you want to reset all options to defaults? This will remove your API key.')) {
    // Reset to defaults
    chrome.storage.local.set(DEFAULT_CONFIG, () => {
      // Reload options
      loadOptions();
      showToast('Options reset to defaults');
    });
  }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility() {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    toggleApiKeyButton.textContent = '🔒';
    toggleApiKeyButton.title = 'Hide API Key';
  } else {
    apiKeyInput.type = 'password';
    toggleApiKeyButton.textContent = '👁️';
    toggleApiKeyButton.title = 'Show API Key';
  }
}

/**
 * Update suggestion delay value display
 */
function updateSuggestionDelayValue() {
  suggestionDelayValue.textContent = `${suggestionDelaySlider.value} ms`;
}

/**
 * Validate API key
 */
function validateApiKey() {
  const apiKey = apiKeyInput.value.trim();
  
  // Clear previous status
  apiKeyStatus.textContent = '';
  apiKeyStatus.className = 'status-message';
  
  // If API key is empty, show warning
  if (!apiKey) {
    apiKeyStatus.textContent = 'Please enter your Google Gemini API key';
    apiKeyStatus.classList.add('status-warning');
    return;
  }
  
  // Show loading status
  apiKeyStatus.textContent = 'Validating API key...';
  
  // Send message to background script to check API key
  chrome.runtime.sendMessage(
    { type: 'CHECK_API_KEY', apiKey },
    (response) => {
      if (response.valid) {
        apiKeyStatus.textContent = 'API key is valid';
        apiKeyStatus.classList.add('status-success');
      } else {
        apiKeyStatus.textContent = response.error || 'Invalid API key';
        apiKeyStatus.classList.add('status-error');
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
  toast.classList.add('show');
  
  // Hide the toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Initialize the options page
document.addEventListener('DOMContentLoaded', init);

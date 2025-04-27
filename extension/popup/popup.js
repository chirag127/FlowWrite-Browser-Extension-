/**
 * FlowWrite Popup Script
 * 
 * This script handles the popup UI functionality:
 * 1. Displaying extension status
 * 2. Enabling/disabling the extension
 * 3. Managing site-specific settings
 * 4. Opening the options page
 */

// DOM Elements
const statusText = document.getElementById('statusText');
const apiKeyStatus = document.getElementById('apiKeyStatus');
const isEnabledToggle = document.getElementById('isEnabled');
const currentSiteElement = document.getElementById('currentSite');
const toggleSiteButton = document.getElementById('toggleSite');
const openOptionsButton = document.getElementById('openOptions');

// Current site information
let currentSite = '';
let config = {
  apiKey: '',
  isEnabled: true,
  disabledSites: [],
  suggestionDelay: 500,
  presentationMode: 'inline'
};

/**
 * Initialize the popup
 */
function init() {
  // Get the current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      // Get the current site
      const url = new URL(tabs[0].url);
      currentSite = url.hostname;
      currentSiteElement.textContent = currentSite;
      
      // Load configuration
      loadConfig();
    }
  });
  
  // Add event listeners
  isEnabledToggle.addEventListener('change', toggleExtension);
  toggleSiteButton.addEventListener('click', toggleSite);
  openOptionsButton.addEventListener('click', openOptions);
}

/**
 * Load configuration from storage
 */
function loadConfig() {
  chrome.storage.local.get(
    ['apiKey', 'isEnabled', 'disabledSites', 'suggestionDelay', 'presentationMode'],
    (result) => {
      // Update config
      config.apiKey = result.apiKey || '';
      config.isEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
      config.disabledSites = result.disabledSites || [];
      config.suggestionDelay = result.suggestionDelay || 500;
      config.presentationMode = result.presentationMode || 'inline';
      
      // Update UI
      updateUI();
    }
  );
}

/**
 * Update the UI based on the current configuration
 */
function updateUI() {
  // Update API key status
  if (config.apiKey) {
    apiKeyStatus.textContent = 'Set';
    apiKeyStatus.className = 'status-active';
  } else {
    apiKeyStatus.textContent = 'Not set';
    apiKeyStatus.className = 'status-warning';
  }
  
  // Update enabled status
  isEnabledToggle.checked = config.isEnabled;
  
  // Update status text
  if (config.isEnabled) {
    if (isSiteDisabled()) {
      statusText.textContent = 'Disabled for this site';
      statusText.className = 'status-inactive';
    } else {
      statusText.textContent = 'Active';
      statusText.className = 'status-active';
    }
  } else {
    statusText.textContent = 'Disabled';
    statusText.className = 'status-inactive';
  }
  
  // Update toggle site button
  if (isSiteDisabled()) {
    toggleSiteButton.textContent = 'Enable for this site';
  } else {
    toggleSiteButton.textContent = 'Disable for this site';
  }
}

/**
 * Check if the current site is disabled
 * @returns {boolean} - Whether the current site is disabled
 */
function isSiteDisabled() {
  return config.disabledSites.includes(currentSite);
}

/**
 * Toggle the extension on/off
 */
function toggleExtension() {
  // Update config
  config.isEnabled = isEnabledToggle.checked;
  
  // Save to storage
  chrome.storage.local.set({ isEnabled: config.isEnabled }, () => {
    // Update UI
    updateUI();
  });
}

/**
 * Toggle the current site in the disabled sites list
 */
function toggleSite() {
  // Check if the site is already disabled
  const isDisabled = isSiteDisabled();
  
  // Update the disabled sites list
  if (isDisabled) {
    // Remove the site from the disabled sites list
    config.disabledSites = config.disabledSites.filter(site => site !== currentSite);
  } else {
    // Add the site to the disabled sites list
    config.disabledSites.push(currentSite);
  }
  
  // Save to storage
  chrome.storage.local.set({ disabledSites: config.disabledSites }, () => {
    // Update UI
    updateUI();
  });
}

/**
 * Open the options page
 */
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', init);

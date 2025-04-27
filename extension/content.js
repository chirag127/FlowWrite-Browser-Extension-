/**
 * FlowWrite Content Script
 * 
 * This script is injected into web pages to:
 * 1. Detect user typing in text fields
 * 2. Implement debounce mechanism
 * 3. Extract context from the input field
 * 4. Send context to the backend
 * 5. Display suggestions
 * 6. Handle user interactions (Tab key to accept, Esc to dismiss)
 */

// Configuration (will be loaded from storage)
let config = {
  apiKey: '',
  isEnabled: true,
  disabledSites: [],
  suggestionDelay: 500,
  presentationMode: 'inline'
};

// State variables
let debounceTimer = null;
let currentSuggestion = null;
let currentField = null;
let suggestionElement = null;
let isWaitingForSuggestion = false;

// Backend API URL (should be configurable in production)
const API_URL = 'http://localhost:3000/api';

/**
 * Initialize the content script
 */
function init() {
  // Load configuration from storage
  chrome.storage.local.get(
    ['apiKey', 'isEnabled', 'disabledSites', 'suggestionDelay', 'presentationMode'],
    (result) => {
      if (result.apiKey) config.apiKey = result.apiKey;
      if (result.isEnabled !== undefined) config.isEnabled = result.isEnabled;
      if (result.disabledSites) config.disabledSites = result.disabledSites;
      if (result.suggestionDelay) config.suggestionDelay = result.suggestionDelay;
      if (result.presentationMode) config.presentationMode = result.presentationMode;
      
      // Check if the extension is enabled and the current site is not disabled
      if (isExtensionEnabledForSite()) {
        // Add event listeners
        addEventListeners();
      }
    }
  );
  
  // Listen for configuration changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.apiKey) config.apiKey = changes.apiKey.newValue;
      if (changes.isEnabled !== undefined) {
        config.isEnabled = changes.isEnabled.newValue;
        if (config.isEnabled) {
          addEventListeners();
        } else {
          removeEventListeners();
        }
      }
      if (changes.disabledSites) {
        config.disabledSites = changes.disabledSites.newValue;
        if (isExtensionEnabledForSite()) {
          addEventListeners();
        } else {
          removeEventListeners();
        }
      }
      if (changes.suggestionDelay) config.suggestionDelay = changes.suggestionDelay.newValue;
      if (changes.presentationMode) config.presentationMode = changes.presentationMode.newValue;
    }
  });
}

/**
 * Check if the extension is enabled for the current site
 * @returns {boolean} - Whether the extension is enabled for the current site
 */
function isExtensionEnabledForSite() {
  if (!config.isEnabled) return false;
  
  const currentHost = window.location.hostname;
  return !config.disabledSites.some(site => 
    currentHost === site || 
    currentHost.endsWith('.' + site)
  );
}

/**
 * Add event listeners to the page
 */
function addEventListeners() {
  // Listen for input events on text fields
  document.addEventListener('input', handleInput);
  
  // Listen for keydown events to handle Tab and Esc keys
  document.addEventListener('keydown', handleKeydown);
  
  // Listen for focus events to track the current field
  document.addEventListener('focusin', handleFocusIn);
}

/**
 * Remove event listeners from the page
 */
function removeEventListeners() {
  document.removeEventListener('input', handleInput);
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('focusin', handleFocusIn);
  
  // Remove any active suggestions
  removeSuggestion();
}

/**
 * Handle input events
 * @param {Event} event - The input event
 */
function handleInput(event) {
  // Check if the target is a text field
  if (!isTextField(event.target)) return;
  
  // Update the current field
  currentField = event.target;
  
  // Remove any existing suggestion
  removeSuggestion();
  
  // Clear any existing debounce timer
  if (debounceTimer) clearTimeout(debounceTimer);
  
  // Set a new debounce timer
  debounceTimer = setTimeout(() => {
    // Get the context from the field
    const context = getContext(currentField);
    
    // If there's enough context, request a suggestion
    if (context && context.length > 5) {
      requestSuggestion(context);
    }
  }, config.suggestionDelay);
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeydown(event) {
  // If there's no current suggestion, do nothing
  if (!currentSuggestion) return;
  
  // If Tab is pressed, accept the suggestion
  if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    acceptSuggestion();
    
    // Send telemetry data
    sendTelemetry(true);
  }
  
  // If Esc is pressed, dismiss the suggestion
  if (event.key === 'Escape') {
    event.preventDefault();
    removeSuggestion();
    
    // Send telemetry data
    sendTelemetry(false);
  }
  
  // If any other key is pressed, remove the suggestion
  if (event.key !== 'Tab' && event.key !== 'Escape') {
    removeSuggestion();
  }
}

/**
 * Handle focus in events
 * @param {FocusEvent} event - The focus event
 */
function handleFocusIn(event) {
  // Check if the target is a text field
  if (!isTextField(event.target)) {
    // If not, remove any existing suggestion
    removeSuggestion();
    currentField = null;
    return;
  }
  
  // Update the current field
  currentField = event.target;
}

/**
 * Check if an element is a text field
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Whether the element is a text field
 */
function isTextField(element) {
  // Check if the element is null
  if (!element) return false;
  
  // Check if the element is an input or textarea
  if (element.tagName === 'INPUT') {
    const type = element.type.toLowerCase();
    return type === 'text' || type === 'search' || type === 'email' || type === 'url';
  }
  
  if (element.tagName === 'TEXTAREA') return true;
  
  // Check if the element is contentEditable
  if (element.isContentEditable) return true;
  
  return false;
}

/**
 * Get the context from a text field
 * @param {HTMLElement} field - The text field
 * @returns {string} - The context
 */
function getContext(field) {
  if (!field) return '';
  
  let text = '';
  
  // Get text from input or textarea
  if (field.tagName === 'INPUT' || field.tagName === 'TEXTAREA') {
    text = field.value;
  }
  // Get text from contentEditable
  else if (field.isContentEditable) {
    text = field.textContent;
  }
  
  return text;
}

/**
 * Request a suggestion from the backend
 * @param {string} context - The context to complete
 */
function requestSuggestion(context) {
  // Check if the API key is set
  if (!config.apiKey) {
    console.error('FlowWrite: API key not set');
    return;
  }
  
  // Check if we're already waiting for a suggestion
  if (isWaitingForSuggestion) return;
  
  // Set the waiting flag
  isWaitingForSuggestion = true;
  
  // Show loading indicator
  showLoadingIndicator();
  
  // Send the request to the backend
  fetch(`${API_URL}/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      context,
      apiKey: config.apiKey
    })
  })
    .then(response => {
      // Check if the response is ok
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Hide loading indicator
      hideLoadingIndicator();
      
      // If there's a suggestion, show it
      if (data.suggestion) {
        currentSuggestion = data.suggestion;
        showSuggestion(currentSuggestion);
      }
    })
    .catch(error => {
      console.error('FlowWrite: Error requesting suggestion:', error);
      
      // Hide loading indicator
      hideLoadingIndicator();
      
      // Show error indicator
      showErrorIndicator();
    })
    .finally(() => {
      // Reset the waiting flag
      isWaitingForSuggestion = false;
    });
}

/**
 * Show a suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showSuggestion(suggestion) {
  // If there's no current field, do nothing
  if (!currentField) return;
  
  // Remove any existing suggestion
  removeSuggestion();
  
  // Choose the presentation mode
  switch (config.presentationMode) {
    case 'inline':
      showInlineSuggestion(suggestion);
      break;
    case 'popup':
      showPopupSuggestion(suggestion);
      break;
    case 'sidepanel':
      showSidePanelSuggestion(suggestion);
      break;
    default:
      showInlineSuggestion(suggestion);
  }
}

/**
 * Show an inline suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showInlineSuggestion(suggestion) {
  // If the field is an input or textarea
  if (currentField.tagName === 'INPUT' || currentField.tagName === 'TEXTAREA') {
    // Create a span element for the suggestion
    suggestionElement = document.createElement('span');
    suggestionElement.className = 'flowwrite-suggestion';
    suggestionElement.textContent = suggestion;
    suggestionElement.style.position = 'absolute';
    suggestionElement.style.color = '#999';
    suggestionElement.style.backgroundColor = 'transparent';
    suggestionElement.style.pointerEvents = 'none';
    suggestionElement.style.whiteSpace = 'pre';
    suggestionElement.style.zIndex = '9999';
    
    // Position the suggestion after the cursor
    const fieldRect = currentField.getBoundingClientRect();
    const fieldStyle = window.getComputedStyle(currentField);
    const fieldPaddingLeft = parseFloat(fieldStyle.paddingLeft);
    const fieldPaddingTop = parseFloat(fieldStyle.paddingTop);
    
    // Calculate cursor position
    const cursorPosition = getCursorPosition(currentField);
    const textBeforeCursor = currentField.value.substring(0, cursorPosition);
    const textWidth = getTextWidth(textBeforeCursor, fieldStyle.font);
    
    // Position the suggestion
    suggestionElement.style.left = `${fieldRect.left + fieldPaddingLeft + textWidth}px`;
    suggestionElement.style.top = `${fieldRect.top + fieldPaddingTop}px`;
    
    // Add the suggestion to the page
    document.body.appendChild(suggestionElement);
  }
  // If the field is contentEditable
  else if (currentField.isContentEditable) {
    // Create a span element for the suggestion
    suggestionElement = document.createElement('span');
    suggestionElement.className = 'flowwrite-suggestion';
    suggestionElement.textContent = suggestion;
    suggestionElement.style.color = '#999';
    suggestionElement.style.backgroundColor = 'transparent';
    suggestionElement.style.pointerEvents = 'none';
    
    // Insert the suggestion after the cursor
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(suggestionElement);
    }
  }
}

/**
 * Show a popup suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showPopupSuggestion(suggestion) {
  // Create a popup element
  suggestionElement = document.createElement('div');
  suggestionElement.className = 'flowwrite-suggestion-popup';
  suggestionElement.textContent = suggestion;
  suggestionElement.style.position = 'absolute';
  suggestionElement.style.backgroundColor = '#fff';
  suggestionElement.style.border = '1px solid #ccc';
  suggestionElement.style.borderRadius = '4px';
  suggestionElement.style.padding = '8px';
  suggestionElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
  suggestionElement.style.zIndex = '9999';
  suggestionElement.style.maxWidth = '300px';
  
  // Position the popup near the cursor
  const fieldRect = currentField.getBoundingClientRect();
  suggestionElement.style.left = `${fieldRect.left}px`;
  suggestionElement.style.top = `${fieldRect.bottom + 5}px`;
  
  // Add the popup to the page
  document.body.appendChild(suggestionElement);
}

/**
 * Show a side panel suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showSidePanelSuggestion(suggestion) {
  // Create a side panel element
  suggestionElement = document.createElement('div');
  suggestionElement.className = 'flowwrite-suggestion-sidepanel';
  suggestionElement.textContent = suggestion;
  suggestionElement.style.position = 'fixed';
  suggestionElement.style.top = '20px';
  suggestionElement.style.right = '20px';
  suggestionElement.style.width = '250px';
  suggestionElement.style.backgroundColor = '#fff';
  suggestionElement.style.border = '1px solid #ccc';
  suggestionElement.style.borderRadius = '4px';
  suggestionElement.style.padding = '16px';
  suggestionElement.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
  suggestionElement.style.zIndex = '9999';
  
  // Add a header
  const header = document.createElement('div');
  header.textContent = 'FlowWrite Suggestion';
  header.style.fontWeight = 'bold';
  header.style.marginBottom = '8px';
  suggestionElement.prepend(header);
  
  // Add the side panel to the page
  document.body.appendChild(suggestionElement);
}

/**
 * Accept the current suggestion
 */
function acceptSuggestion() {
  // If there's no current suggestion or field, do nothing
  if (!currentSuggestion || !currentField) return;
  
  // If the field is an input or textarea
  if (currentField.tagName === 'INPUT' || currentField.tagName === 'TEXTAREA') {
    // Get the cursor position
    const cursorPosition = getCursorPosition(currentField);
    
    // Insert the suggestion at the cursor position
    const newValue = currentField.value.substring(0, cursorPosition) + 
                     currentSuggestion + 
                     currentField.value.substring(cursorPosition);
    
    // Update the field value
    currentField.value = newValue;
    
    // Move the cursor to the end of the suggestion
    setCursorPosition(currentField, cursorPosition + currentSuggestion.length);
  }
  // If the field is contentEditable
  else if (currentField.isContentEditable) {
    // Remove the suggestion element
    if (suggestionElement) {
      // Replace the suggestion element with its text content
      const textNode = document.createTextNode(currentSuggestion);
      suggestionElement.parentNode.replaceChild(textNode, suggestionElement);
      suggestionElement = null;
    }
  }
  
  // Clear the current suggestion
  currentSuggestion = null;
}

/**
 * Remove the current suggestion
 */
function removeSuggestion() {
  // If there's no suggestion element, do nothing
  if (!suggestionElement) return;
  
  // Remove the suggestion element
  if (suggestionElement.parentNode) {
    suggestionElement.parentNode.removeChild(suggestionElement);
  }
  
  // Clear the suggestion element and current suggestion
  suggestionElement = null;
  currentSuggestion = null;
}

/**
 * Show a loading indicator
 */
function showLoadingIndicator() {
  // If there's no current field, do nothing
  if (!currentField) return;
  
  // Create a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'flowwrite-loading';
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.width = '16px';
  loadingIndicator.style.height = '16px';
  loadingIndicator.style.border = '2px solid #f3f3f3';
  loadingIndicator.style.borderTop = '2px solid #3498db';
  loadingIndicator.style.borderRadius = '50%';
  loadingIndicator.style.animation = 'flowwrite-spin 1s linear infinite';
  loadingIndicator.style.zIndex = '9999';
  
  // Add the animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes flowwrite-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  // Position the loading indicator
  const fieldRect = currentField.getBoundingClientRect();
  loadingIndicator.style.left = `${fieldRect.right - 24}px`;
  loadingIndicator.style.top = `${fieldRect.top + 4}px`;
  
  // Add the loading indicator to the page
  document.body.appendChild(loadingIndicator);
  
  // Store the loading indicator
  suggestionElement = loadingIndicator;
}

/**
 * Hide the loading indicator
 */
function hideLoadingIndicator() {
  // Remove the suggestion (which is the loading indicator)
  removeSuggestion();
}

/**
 * Show an error indicator
 */
function showErrorIndicator() {
  // If there's no current field, do nothing
  if (!currentField) return;
  
  // Create an error indicator
  const errorIndicator = document.createElement('div');
  errorIndicator.className = 'flowwrite-error';
  errorIndicator.style.position = 'absolute';
  errorIndicator.style.width = '16px';
  errorIndicator.style.height = '16px';
  errorIndicator.style.backgroundColor = '#e74c3c';
  errorIndicator.style.borderRadius = '50%';
  errorIndicator.style.zIndex = '9999';
  
  // Position the error indicator
  const fieldRect = currentField.getBoundingClientRect();
  errorIndicator.style.left = `${fieldRect.right - 24}px`;
  errorIndicator.style.top = `${fieldRect.top + 4}px`;
  
  // Add the error indicator to the page
  document.body.appendChild(errorIndicator);
  
  // Store the error indicator
  suggestionElement = errorIndicator;
  
  // Remove the error indicator after 3 seconds
  setTimeout(() => {
    if (suggestionElement === errorIndicator) {
      removeSuggestion();
    }
  }, 3000);
}

/**
 * Send telemetry data to the backend
 * @param {boolean} accepted - Whether the suggestion was accepted
 */
function sendTelemetry(accepted) {
  // Send the telemetry data
  fetch(`${API_URL}/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accepted })
  }).catch(error => {
    console.error('FlowWrite: Error sending telemetry:', error);
  });
}

/**
 * Get the cursor position in a text field
 * @param {HTMLElement} field - The text field
 * @returns {number} - The cursor position
 */
function getCursorPosition(field) {
  if (!field) return 0;
  
  if (field.selectionStart !== undefined) {
    return field.selectionStart;
  }
  
  return 0;
}

/**
 * Set the cursor position in a text field
 * @param {HTMLElement} field - The text field
 * @param {number} position - The cursor position
 */
function setCursorPosition(field, position) {
  if (!field) return;
  
  if (field.setSelectionRange) {
    field.focus();
    field.setSelectionRange(position, position);
  }
}

/**
 * Get the width of text with a given font
 * @param {string} text - The text
 * @param {string} font - The font
 * @returns {number} - The width of the text
 */
function getTextWidth(text, font) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Set the font
  context.font = font;
  
  // Measure the text
  const metrics = context.measureText(text);
  
  return metrics.width;
}

// Initialize the content script
init();

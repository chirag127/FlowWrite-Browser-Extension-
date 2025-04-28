/**
 * ContentScript - Main content script for GhostTyper extension
 * 
 * This script is injected into web pages and handles:
 * 1. Detecting text input fields
 * 2. Monitoring user typing
 * 3. Requesting suggestions from the API
 * 4. Displaying suggestions via the SuggestionOverlay
 */

class GhostTyper {
  constructor() {
    this.enabled = true;
    this.currentInput = null;
    this.debounceTimer = null;
    this.userToneId = null;
    this.settings = ENV.DEFAULT_SETTINGS;
    
    // Bind methods
    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleInput = this.handleInput.bind(this);
    this.observeDOMChanges = this.observeDOMChanges.bind(this);
    
    // Initialize
    this.init();
  }

  /**
   * Initialize the GhostTyper
   */
  async init() {
    // Load settings from storage
    await this.loadSettings();
    
    // Add event listeners for existing input fields
    this.addEventListenersToInputs();
    
    // Set up MutationObserver to detect new input fields
    this.setupMutationObserver();
    
    // Listen for messages from popup
    this.setupMessageListener();
  }

  /**
   * Load settings from browser storage
   */
  async loadSettings() {
    try {
      const storage = await browser.storage.local.get(['ghosttyper_settings', 'userToneId']);
      if (storage.ghosttyper_settings) {
        this.settings = { ...ENV.DEFAULT_SETTINGS, ...storage.ghosttyper_settings };
      }
      if (storage.userToneId) {
        this.userToneId = storage.userToneId;
      }
      this.enabled = this.settings.enabled;
    } catch (error) {
      console.error('GhostTyper: Error loading settings', error);
    }
  }

  /**
   * Set up listener for messages from popup
   */
  setupMessageListener() {
    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'settingsUpdated') {
        this.loadSettings();
      }
    });
  }

  /**
   * Add event listeners to all input fields on the page
   */
  addEventListenersToInputs() {
    // Find all text inputs, textareas, and contenteditable elements
    const inputs = document.querySelectorAll('input[type="text"], input[type="search"], input[type="email"], textarea');
    const editables = document.querySelectorAll('[contenteditable="true"]');
    
    // Add event listeners to inputs and textareas
    inputs.forEach(input => {
      input.addEventListener('focus', this.handleFocus);
      input.addEventListener('blur', this.handleBlur);
      input.addEventListener('input', this.handleInput);
    });
    
    // Add event listeners to contenteditable elements
    editables.forEach(editable => {
      editable.addEventListener('focus', this.handleFocus);
      editable.addEventListener('blur', this.handleBlur);
      editable.addEventListener('input', this.handleInput);
    });
  }

  /**
   * Set up MutationObserver to detect new input fields
   */
  setupMutationObserver() {
    const observer = new MutationObserver(this.observeDOMChanges);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Handle DOM changes to detect new input fields
   * @param {MutationRecord[]} mutations - The DOM mutations
   */
  observeDOMChanges(mutations) {
    let shouldAddListeners = false;
    
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length) {
        shouldAddListeners = true;
      }
    });
    
    if (shouldAddListeners) {
      this.addEventListenersToInputs();
    }
  }

  /**
   * Handle focus event on input fields
   * @param {FocusEvent} event - The focus event
   */
  handleFocus(event) {
    if (!this.enabled) return;
    
    this.currentInput = event.target;
    keyboardHandler.startListening(this.currentInput);
  }

  /**
   * Handle blur event on input fields
   * @param {FocusEvent} event - The blur event
   */
  handleBlur(event) {
    suggestionOverlay.hideSuggestion();
    keyboardHandler.stopListening();
    this.currentInput = null;
  }

  /**
   * Handle input event (typing) on input fields
   * @param {InputEvent} event - The input event
   */
  handleInput(event) {
    if (!this.enabled || !this.currentInput) return;
    
    // Clear previous debounce timer
    clearTimeout(this.debounceTimer);
    
    // Hide any existing suggestion
    suggestionOverlay.hideSuggestion();
    
    // Set a new debounce timer
    this.debounceTimer = setTimeout(() => {
      this.requestSuggestion();
    }, this.settings.suggestionDelay || ENV.DEBOUNCE_DELAY);
  }

  /**
   * Request a suggestion from the API
   */
  async requestSuggestion() {
    if (!this.currentInput) return;
    
    try {
      // Get the text content and cursor position
      const inputType = this.getInputType(this.currentInput);
      let text = '';
      let cursorPosition = 0;
      
      if (inputType === 'contenteditable') {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;
        
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.currentInput);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPosition = preCaretRange.toString().length;
        
        text = this.currentInput.innerText;
      } else {
        text = this.currentInput.value;
        cursorPosition = this.currentInput.selectionStart;
      }
      
      // Don't request if there's no text or cursor is at the beginning
      if (!text || cursorPosition === 0) return;
      
      // Get the text before the cursor
      const textBeforeCursor = text.substring(0, cursorPosition);
      
      // Make API request
      const response = await fetch(`${ENV.API_BASE_URL}${ENV.ENDPOINTS.GENERATE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textBeforeCursor,
          userToneId: this.userToneId,
          tonePreference: this.settings.tonePreference
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.suggestion && data.suggestion.trim() !== '') {
        suggestionOverlay.showSuggestion(this.currentInput, data.suggestion);
      }
    } catch (error) {
      console.error('GhostTyper: Error requesting suggestion', error);
    }
  }

  /**
   * Get the type of input element
   * @param {HTMLElement} element - The element to check
   * @returns {string} - The type of input ('input', 'textarea', 'contenteditable')
   */
  getInputType(element) {
    if (element.getAttribute('contenteditable') === 'true') {
      return 'contenteditable';
    } else if (element.tagName.toLowerCase() === 'textarea') {
      return 'textarea';
    } else if (element.tagName.toLowerCase() === 'input' && 
              (element.type === 'text' || element.type === 'search' || element.type === 'email')) {
      return 'input';
    }
    return 'unknown';
  }
}

// Initialize GhostTyper when the page is loaded
document.addEventListener('DOMContentLoaded', () => {
  const ghostTyper = new GhostTyper();
});

// Also initialize immediately in case DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  const ghostTyper = new GhostTyper();
}

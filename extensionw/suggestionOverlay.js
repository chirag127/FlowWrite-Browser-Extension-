/**
 * SuggestionOverlay - Handles displaying inline suggestions
 * 
 * This module creates and manages the overlay element that displays
 * suggestions as gray text after the user's cursor.
 */

class SuggestionOverlay {
  constructor() {
    this.overlay = null;
    this.currentInput = null;
    this.currentSuggestion = '';
    this.isVisible = false;
    this.init();
  }

  /**
   * Initialize the overlay element
   */
  init() {
    // Create overlay element if it doesn't exist
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'ghosttyper-suggestion-overlay';
      this.overlay.style.position = 'absolute';
      this.overlay.style.zIndex = '9999';
      this.overlay.style.pointerEvents = 'none';
      this.overlay.style.color = '#888';
      this.overlay.style.fontFamily = 'inherit';
      this.overlay.style.fontSize = 'inherit';
      this.overlay.style.whiteSpace = 'pre';
      document.body.appendChild(this.overlay);
    }
  }

  /**
   * Show a suggestion for the given input element
   * @param {HTMLElement} inputElement - The input element
   * @param {string} suggestion - The suggestion text
   */
  showSuggestion(inputElement, suggestion) {
    if (!inputElement || !suggestion) {
      this.hideSuggestion();
      return;
    }

    this.currentInput = inputElement;
    this.currentSuggestion = suggestion;
    
    // Position the overlay
    this.positionOverlay();
    
    // Set the suggestion text
    this.overlay.textContent = suggestion;
    this.overlay.style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Hide the suggestion overlay
   */
  hideSuggestion() {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
      this.currentSuggestion = '';
    }
  }

  /**
   * Position the overlay at the current cursor position
   */
  positionOverlay() {
    if (!this.currentInput) return;

    const inputType = this.getInputType(this.currentInput);
    
    if (inputType === 'contenteditable') {
      this.positionForContentEditable();
    } else if (inputType === 'textarea' || inputType === 'input') {
      this.positionForInputElement();
    }
  }

  /**
   * Position overlay for contenteditable elements
   */
  positionForContentEditable() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Get computed styles of the input element
    const computedStyle = window.getComputedStyle(this.currentInput);
    
    // Set font properties to match the input
    this.overlay.style.fontFamily = computedStyle.fontFamily;
    this.overlay.style.fontSize = computedStyle.fontSize;
    this.overlay.style.fontWeight = computedStyle.fontWeight;
    
    // Position the overlay
    this.overlay.style.top = `${window.scrollY + rect.bottom}px`;
    this.overlay.style.left = `${window.scrollX + rect.right}px`;
  }

  /**
   * Position overlay for input and textarea elements
   */
  positionForInputElement() {
    // Create a temporary element to measure text width
    const temp = document.createElement('div');
    temp.style.position = 'absolute';
    temp.style.visibility = 'hidden';
    temp.style.whiteSpace = 'pre';
    
    // Get computed styles of the input element
    const computedStyle = window.getComputedStyle(this.currentInput);
    
    // Copy font styles to the temp element
    temp.style.fontFamily = computedStyle.fontFamily;
    temp.style.fontSize = computedStyle.fontSize;
    temp.style.fontWeight = computedStyle.fontWeight;
    temp.style.letterSpacing = computedStyle.letterSpacing;
    
    // Get cursor position
    const cursorPosition = this.currentInput.selectionStart;
    const textBeforeCursor = this.currentInput.value.substring(0, cursorPosition);
    
    // Measure the width of text before cursor
    temp.textContent = textBeforeCursor;
    document.body.appendChild(temp);
    const textWidth = temp.getBoundingClientRect().width;
    document.body.removeChild(temp);
    
    // Get input element position
    const rect = this.currentInput.getBoundingClientRect();
    
    // Calculate padding
    const paddingLeft = parseInt(computedStyle.paddingLeft, 10);
    
    // Set font properties to match the input
    this.overlay.style.fontFamily = computedStyle.fontFamily;
    this.overlay.style.fontSize = computedStyle.fontSize;
    this.overlay.style.fontWeight = computedStyle.fontWeight;
    
    // Position the overlay
    this.overlay.style.top = `${window.scrollY + rect.top}px`;
    this.overlay.style.left = `${window.scrollX + rect.left + paddingLeft + textWidth}px`;
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

  /**
   * Get the current suggestion
   * @returns {string} - The current suggestion
   */
  getCurrentSuggestion() {
    return this.currentSuggestion;
  }

  /**
   * Check if a suggestion is currently visible
   * @returns {boolean} - True if a suggestion is visible
   */
  isSuggestionVisible() {
    return this.isVisible;
  }
}

// Create a singleton instance
const suggestionOverlay = new SuggestionOverlay();

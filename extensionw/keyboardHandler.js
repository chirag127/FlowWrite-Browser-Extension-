/**
 * KeyboardHandler - Handles keyboard events for accepting/rejecting suggestions
 * 
 * This module listens for Tab and Esc key presses to accept or reject
 * suggestions displayed by the SuggestionOverlay.
 */

class KeyboardHandler {
  constructor() {
    this.activeElement = null;
    this.isListening = false;
    this.handlers = {
      keydown: this.handleKeyDown.bind(this)
    };
  }

  /**
   * Start listening for keyboard events on the given element
   * @param {HTMLElement} element - The element to listen on
   */
  startListening(element) {
    if (!element) return;
    
    // Stop listening on previous element if any
    this.stopListening();
    
    this.activeElement = element;
    document.addEventListener('keydown', this.handlers.keydown, true);
    this.isListening = true;
  }

  /**
   * Stop listening for keyboard events
   */
  stopListening() {
    if (this.isListening) {
      document.removeEventListener('keydown', this.handlers.keydown, true);
      this.isListening = false;
      this.activeElement = null;
    }
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event - The keyboard event
   */
  handleKeyDown(event) {
    // Only process if we have an active element
    if (!this.activeElement) return;
    
    // Check if suggestion overlay has a visible suggestion
    if (!suggestionOverlay.isSuggestionVisible()) return;
    
    // Handle Tab key to accept suggestion
    if (event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
      const suggestion = suggestionOverlay.getCurrentSuggestion();
      if (suggestion) {
        this.acceptSuggestion(suggestion);
        event.preventDefault();
        event.stopPropagation();
      }
    }
    
    // Handle Esc key to reject suggestion
    if (event.key === 'Escape') {
      suggestionOverlay.hideSuggestion();
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Accept the current suggestion
   * @param {string} suggestion - The suggestion to accept
   */
  acceptSuggestion(suggestion) {
    if (!this.activeElement || !suggestion) return;
    
    const inputType = this.getInputType(this.activeElement);
    
    if (inputType === 'contenteditable') {
      this.insertTextIntoContentEditable(suggestion);
    } else if (inputType === 'textarea' || inputType === 'input') {
      this.insertTextIntoInput(suggestion);
    }
    
    // Hide the suggestion after accepting
    suggestionOverlay.hideSuggestion();
  }

  /**
   * Insert text into a contenteditable element
   * @param {string} text - The text to insert
   */
  insertTextIntoContentEditable(text) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    
    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(text);
    
    range.insertNode(textNode);
    
    // Move cursor to end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Dispatch input event to trigger any listeners
    const inputEvent = new Event('input', { bubbles: true });
    this.activeElement.dispatchEvent(inputEvent);
  }

  /**
   * Insert text into an input or textarea element
   * @param {string} text - The text to insert
   */
  insertTextIntoInput(text) {
    const element = this.activeElement;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const value = element.value;
    
    // Insert the suggestion at cursor position
    element.value = value.substring(0, start) + text + value.substring(end);
    
    // Move cursor to end of inserted text
    const newCursorPos = start + text.length;
    element.setSelectionRange(newCursorPos, newCursorPos);
    
    // Dispatch input event to trigger any listeners
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
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

// Create a singleton instance
const keyboardHandler = new KeyboardHandler();

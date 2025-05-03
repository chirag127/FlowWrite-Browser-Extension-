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
        this.currentSuggestion = "";
        this.isVisible = false;
        this.init();
    }

    /**
     * Initialize the overlay element
     */
    init() {
        // Create overlay element if it doesn't exist
        if (!this.overlay) {
            this.overlay = document.createElement("div");
            this.overlay.className = "ghosttyper-suggestion-overlay";
            this.overlay.style.position = "absolute";
            this.overlay.style.zIndex = "9999";
            this.overlay.style.pointerEvents = "none";
            this.overlay.style.color = "#888";
            this.overlay.style.fontFamily = "inherit";
            this.overlay.style.fontSize = "inherit";
            this.overlay.style.whiteSpace = "pre";
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
        this.overlay.style.display = "block";
        this.isVisible = true;
    }

    /**
     * Hide the suggestion overlay
     */
    hideSuggestion() {
        if (this.overlay) {
            this.overlay.style.display = "none";
            this.isVisible = false;
            this.currentSuggestion = "";
        }
    }

    /**
     * Position the overlay at the current cursor position
     */
    positionOverlay() {
        if (!this.currentInput) return;

        const inputType = this.getInputType(this.currentInput);

        if (inputType === "contenteditable") {
            this.positionForContentEditable();
        } else if (inputType === "textarea" || inputType === "input") {
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
        const input = this.currentInput;
        const computedStyle = window.getComputedStyle(input);

        // Set font properties to match the input
        this.overlay.style.fontFamily = computedStyle.fontFamily;
        this.overlay.style.fontSize = computedStyle.fontSize;
        this.overlay.style.fontWeight = computedStyle.fontWeight;

        // Get cursor position
        const cursorPosition = input.selectionStart;

        // For single-line inputs, use the simple approach
        if (input.tagName.toLowerCase() === "input") {
            this.positionForSingleLineInput(
                input,
                computedStyle,
                cursorPosition
            );
            return;
        }

        // For textareas, we need to handle line wrapping
        // Create a mirror div to accurately calculate cursor position
        const mirror = document.createElement("div");
        mirror.style.position = "absolute";
        mirror.style.visibility = "hidden";
        mirror.style.whiteSpace = "pre-wrap";
        mirror.style.wordWrap = "break-word";
        mirror.style.overflow = "hidden";
        mirror.style.width = `${input.clientWidth}px`;

        // Copy styles from the textarea
        mirror.style.fontFamily = computedStyle.fontFamily;
        mirror.style.fontSize = computedStyle.fontSize;
        mirror.style.fontWeight = computedStyle.fontWeight;
        mirror.style.lineHeight = computedStyle.lineHeight;
        mirror.style.paddingTop = computedStyle.paddingTop;
        mirror.style.paddingRight = computedStyle.paddingRight;
        mirror.style.paddingBottom = computedStyle.paddingBottom;
        mirror.style.paddingLeft = computedStyle.paddingLeft;
        mirror.style.borderTop = computedStyle.borderTop;
        mirror.style.borderRight = computedStyle.borderRight;
        mirror.style.borderBottom = computedStyle.borderBottom;
        mirror.style.borderLeft = computedStyle.borderLeft;

        // Create a span to mark the cursor position
        const textBeforeCursor = input.value.substring(0, cursorPosition);
        const textAfterCursor = input.value.substring(cursorPosition);

        mirror.innerHTML =
            this.escapeHTML(textBeforeCursor) +
            '<span id="cursor"></span>' +
            this.escapeHTML(textAfterCursor);
        document.body.appendChild(mirror);

        // Get the position of the cursor marker
        const cursorMarker = mirror.querySelector("#cursor");
        const cursorRect = cursorMarker.getBoundingClientRect();
        const inputRect = input.getBoundingClientRect();

        // Clean up
        document.body.removeChild(mirror);

        // Calculate the position relative to the viewport
        const top =
            window.scrollY + cursorRect.top - inputRect.top + input.scrollTop;
        const left =
            window.scrollX +
            cursorRect.left -
            inputRect.left +
            input.scrollLeft;

        // Position the overlay
        this.overlay.style.top = `${top}px`;
        this.overlay.style.left = `${left}px`;
    }

    /**
     * Position overlay for single-line input elements
     * @param {HTMLElement} input - The input element
     * @param {CSSStyleDeclaration} computedStyle - The computed style of the input
     * @param {number} cursorPosition - The cursor position
     */
    positionForSingleLineInput(input, computedStyle, cursorPosition) {
        // Create a temporary element to measure text width
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.whiteSpace = "pre";

        // Copy font styles to the temp element
        temp.style.fontFamily = computedStyle.fontFamily;
        temp.style.fontSize = computedStyle.fontSize;
        temp.style.fontWeight = computedStyle.fontWeight;
        temp.style.letterSpacing = computedStyle.letterSpacing;

        // Get text before cursor
        const textBeforeCursor = input.value.substring(0, cursorPosition);

        // Measure the width of text before cursor
        temp.textContent = textBeforeCursor;
        document.body.appendChild(temp);
        const textWidth = temp.getBoundingClientRect().width;
        document.body.removeChild(temp);

        // Get input element position
        const rect = input.getBoundingClientRect();

        // Calculate padding
        const paddingLeft = parseInt(computedStyle.paddingLeft, 10);

        // Position the overlay
        this.overlay.style.top = `${window.scrollY + rect.top}px`;
        this.overlay.style.left = `${
            window.scrollX +
            rect.left +
            paddingLeft +
            textWidth -
            input.scrollLeft
        }px`;
    }

    /**
     * Helper method to escape HTML
     * @param {string} text - The text to escape
     * @returns {string} - The escaped text
     */
    escapeHTML(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    }

    /**
     * Get the type of input element
     * @param {HTMLElement} element - The element to check
     * @returns {string} - The type of input ('input', 'textarea', 'contenteditable')
     */
    getInputType(element) {
        if (element.getAttribute("contenteditable") === "true") {
            return "contenteditable";
        } else if (element.tagName.toLowerCase() === "textarea") {
            return "textarea";
        } else if (
            element.tagName.toLowerCase() === "input" &&
            (element.type === "text" ||
                element.type === "search" ||
                element.type === "email")
        ) {
            return "input";
        }
        return "unknown";
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

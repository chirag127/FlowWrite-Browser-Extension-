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
            keydown: this.handleKeyDown.bind(this),
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
        document.addEventListener("keydown", this.handlers.keydown, true);
        this.isListening = true;
    }

    /**
     * Stop listening for keyboard events
     */
    stopListening() {
        if (this.isListening) {
            document.removeEventListener(
                "keydown",
                this.handlers.keydown,
                true
            );
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
        if (
            event.key === "Tab" &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.altKey
        ) {
            const suggestion = suggestionOverlay.getCurrentSuggestion();
            if (suggestion) {
                this.acceptSuggestion(suggestion);
                event.preventDefault();
                event.stopPropagation();
            }
        }

        // Handle Esc key to reject suggestion
        if (event.key === "Escape") {
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

        if (inputType === "contenteditable") {
            this.insertTextIntoContentEditable(suggestion);
        } else if (inputType === "textarea" || inputType === "input") {
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
        const inputEvent = new Event("input", { bubbles: true });
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

        // Ensure cursor is visible by scrolling if necessary
        this.scrollToEnsureCursorVisible(element);

        // Dispatch input event to trigger any listeners
        const inputEvent = new Event("input", { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    /**
     * Ensure the cursor is visible in the input element by scrolling if necessary
     * @param {HTMLElement} element - The input element
     */
    scrollToEnsureCursorVisible(element) {
        // Only applicable for textarea elements and inputs with overflow
        if (
            element.tagName.toLowerCase() !== "textarea" &&
            element.tagName.toLowerCase() !== "input"
        )
            return;

        if (element.tagName.toLowerCase() === "textarea") {
            // Create a mirror div to calculate cursor position
            const computedStyle = window.getComputedStyle(element);
            const mirror = document.createElement("div");
            mirror.style.position = "absolute";
            mirror.style.visibility = "hidden";
            mirror.style.whiteSpace = "pre-wrap";
            mirror.style.wordWrap = "break-word";
            mirror.style.overflow = "hidden";
            mirror.style.width = `${element.clientWidth}px`;

            // Copy styles from the textarea
            mirror.style.fontFamily = computedStyle.fontFamily;
            mirror.style.fontSize = computedStyle.fontSize;
            mirror.style.fontWeight = computedStyle.fontWeight;
            mirror.style.lineHeight = computedStyle.lineHeight;
            mirror.style.paddingTop = computedStyle.paddingTop;
            mirror.style.paddingRight = computedStyle.paddingRight;
            mirror.style.paddingBottom = computedStyle.paddingBottom;
            mirror.style.paddingLeft = computedStyle.paddingLeft;

            // Create a span to mark the cursor position
            const cursorPosition = element.selectionStart;
            const textBeforeCursor = element.value.substring(0, cursorPosition);

            mirror.innerHTML =
                this.escapeHTML(textBeforeCursor) + '<span id="cursor"></span>';
            document.body.appendChild(mirror);

            // Get the position of the cursor marker
            const cursorMarker = mirror.querySelector("#cursor");
            const cursorRect = cursorMarker.getBoundingClientRect();

            // Clean up
            document.body.removeChild(mirror);

            // Calculate the cursor's vertical position within the textarea
            const cursorTop =
                cursorRect.top -
                element.getBoundingClientRect().top +
                element.scrollTop;
            const cursorBottom =
                cursorTop + parseInt(computedStyle.lineHeight, 10);

            // Scroll if cursor is outside the visible area
            if (cursorTop < element.scrollTop) {
                // Cursor is above visible area
                element.scrollTop = cursorTop;
            } else if (
                cursorBottom >
                element.scrollTop + element.clientHeight
            ) {
                // Cursor is below visible area
                element.scrollTop = cursorBottom - element.clientHeight;
            }
        }

        // For horizontal scrolling (for both input and textarea)
        const cursorPosition = element.selectionStart;
        const textBeforeCursor = element.value.substring(0, cursorPosition);

        // Create a temporary element to measure text width
        const temp = document.createElement("div");
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.whiteSpace = "pre";

        const computedStyle = window.getComputedStyle(element);
        temp.style.fontFamily = computedStyle.fontFamily;
        temp.style.fontSize = computedStyle.fontSize;
        temp.style.fontWeight = computedStyle.fontWeight;
        temp.style.letterSpacing = computedStyle.letterSpacing;

        temp.textContent = textBeforeCursor;
        document.body.appendChild(temp);
        const textWidth = temp.getBoundingClientRect().width;
        document.body.removeChild(temp);

        const paddingLeft = parseInt(computedStyle.paddingLeft, 10);
        const cursorLeft = paddingLeft + textWidth;

        // Ensure the cursor is visible horizontally
        if (cursorLeft < element.scrollLeft + 20) {
            // Add some padding
            element.scrollLeft = Math.max(0, cursorLeft - 20);
        } else if (cursorLeft > element.scrollLeft + element.clientWidth - 20) {
            element.scrollLeft = cursorLeft - element.clientWidth + 40; // Add some padding
        }
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
}

// Create a singleton instance
const keyboardHandler = new KeyboardHandler();

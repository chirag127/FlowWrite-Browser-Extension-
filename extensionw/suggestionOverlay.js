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
            this.overlay.style.zIndex = "99999"; // Extremely high z-index
            this.overlay.style.pointerEvents = "auto"; // Changed from 'none' to 'auto' to allow clicks
            this.overlay.style.color = "#888";
            this.overlay.style.fontFamily = "inherit";
            this.overlay.style.fontSize = "inherit";
            this.overlay.style.whiteSpace = "pre";
            this.overlay.style.cursor = "pointer"; // Add pointer cursor to indicate clickability
            this.overlay.style.backgroundColor = "rgba(255, 255, 255, 0.1)"; // Slight background
            this.overlay.style.padding = "2px"; // Add slight padding

            // Add multiple event listeners to ensure clicks are captured
            this.overlay.addEventListener(
                "click",
                this.handleClick.bind(this),
                true
            ); // Capture phase
            this.overlay.addEventListener(
                "mousedown",
                this.handleMouseDown.bind(this),
                true
            ); // Capture phase

            // Add a debug attribute to identify the element
            this.overlay.setAttribute("data-ghosttyper", "suggestion-overlay");

            // Log that the overlay was created
            console.log(
                "GhostTyper: Suggestion overlay created and initialized"
            );

            document.body.appendChild(this.overlay);
        }
    }

    /**
     * Handle mousedown events on the suggestion overlay
     * This is an alternative to click that might work better in some browsers
     * @param {MouseEvent} event - The mousedown event
     */
    handleMouseDown(event) {
        console.log(
            "GhostTyper: Mousedown event on suggestion overlay detected"
        );

        // Prevent default behavior
        event.preventDefault();
        event.stopPropagation();

        // Get the current suggestion
        const suggestion = this.getCurrentSuggestion();

        // If there's a suggestion and an input element, accept the suggestion
        if (suggestion && this.currentInput) {
            // Directly implement suggestion acceptance logic
            this.acceptSuggestion(suggestion);

            // Focus back on the input element
            this.currentInput.focus();

            // Log for debugging
            console.log(
                "GhostTyper: Suggestion accepted via mousedown:",
                suggestion
            );
        }
    }

    /**
     * Show a suggestion for the given input element
     * @param {HTMLElement} inputElement - The input element
     * @param {string} suggestion - The suggestion text
     */
    showSuggestion(inputElement, suggestion) {
        console.log("GhostTyper: Showing suggestion", {
            suggestion,
            inputElement,
        });

        if (!inputElement || !suggestion) {
            this.hideSuggestion();
            console.warn("GhostTyper: Invalid input element or suggestion");
            return;
        }

        this.currentInput = inputElement;
        this.currentSuggestion = suggestion;

        // Ensure the overlay exists
        if (!this.overlay) {
            console.warn("GhostTyper: Overlay doesn't exist, reinitializing");
            this.init();
        }

        // Position the overlay
        this.positionOverlay();

        // Set the suggestion text with a wrapper span to make it more clickable
        this.overlay.innerHTML = `<span style="display:inline-block; padding:2px;">${suggestion}</span>`;
        this.overlay.style.display = "block";
        this.overlay.classList.add("visible"); // Add visible class for animation

        // Add a tooltip to indicate clickability
        this.overlay.title = "Click to accept suggestion";

        // Add a data attribute with the suggestion text for debugging
        this.overlay.setAttribute("data-suggestion", suggestion);

        // Add inline onclick attribute as a fallback
        this.overlay.setAttribute(
            "onclick",
            "console.log('GhostTyper: Inline click handler triggered'); this.classList.add('clicked');"
        );

        // Add a class to make it easier to target with CSS
        this.overlay.classList.add("ghosttyper-clickable");

        // Ensure the overlay has the correct styles
        this.overlay.style.position = "absolute";
        this.overlay.style.zIndex = "99999";
        this.overlay.style.pointerEvents = "auto";
        this.overlay.style.cursor = "pointer";
        this.overlay.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        this.overlay.style.padding = "2px";

        // Log the overlay's position and dimensions for debugging
        const rect = this.overlay.getBoundingClientRect();
        console.log("GhostTyper: Overlay positioned", {
            top: this.overlay.style.top,
            left: this.overlay.style.left,
            width: rect.width,
            height: rect.height,
            text: this.overlay.textContent,
        });

        this.isVisible = true;

        // Add a click handler directly to the document to catch all clicks
        // This is a fallback in case the overlay's click handler doesn't work
        if (!this._documentClickHandler) {
            this._documentClickHandler = (e) => {
                // Check if the click is within the overlay's bounds
                const overlayRect = this.overlay.getBoundingClientRect();
                if (
                    e.clientX >= overlayRect.left &&
                    e.clientX <= overlayRect.right &&
                    e.clientY >= overlayRect.top &&
                    e.clientY <= overlayRect.bottom &&
                    this.isVisible
                ) {
                    console.log(
                        "GhostTyper: Document click handler detected click on overlay"
                    );
                    this.handleClick(e);
                }
            };

            document.addEventListener(
                "click",
                this._documentClickHandler,
                true
            );
            console.log("GhostTyper: Added document click handler");
        }
    }

    /**
     * Hide the suggestion overlay
     */
    hideSuggestion() {
        console.log("GhostTyper: Hiding suggestion");

        if (this.overlay) {
            this.overlay.style.display = "none";
            this.overlay.classList.remove("visible"); // Remove visible class
            this.isVisible = false;
            this.currentSuggestion = "";

            // Remove the document click handler if it exists
            if (this._documentClickHandler) {
                document.removeEventListener(
                    "click",
                    this._documentClickHandler,
                    true
                );
                this._documentClickHandler = null;
                console.log("GhostTyper: Removed document click handler");
            }
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

    /**
     * Handle click events on the suggestion overlay
     * @param {MouseEvent} event - The click event
     */
    handleClick(event) {
        console.log("GhostTyper: Click event on suggestion overlay detected", {
            target: event.target,
            currentTarget: event.currentTarget,
            eventPhase: event.eventPhase,
            suggestion: this.getCurrentSuggestion(),
            hasInput: !!this.currentInput,
        });

        // Prevent the event from propagating to avoid triggering other click handlers
        event.preventDefault();
        event.stopPropagation();

        // Get the current suggestion
        const suggestion = this.getCurrentSuggestion();

        // If there's a suggestion and an input element, accept the suggestion
        if (suggestion && this.currentInput) {
            try {
                // Directly implement suggestion acceptance logic
                this.acceptSuggestion(suggestion);

                // Focus back on the input element
                this.currentInput.focus();

                // Log for debugging
                console.log(
                    "GhostTyper: Suggestion accepted via click:",
                    suggestion
                );

                // Add a visual feedback that the click was registered
                this.showClickFeedback();

                // Send telemetry data if available (similar to Tab key acceptance)
                try {
                    // Check if we're in the extension environment with telemetry
                    if (typeof sendTelemetry === "function") {
                        sendTelemetry(true, "click");
                    }
                } catch (e) {
                    // Ignore errors if telemetry function is not available
                    console.log("GhostTyper: Telemetry not available");
                }
            } catch (error) {
                // Log any errors that occur during suggestion acceptance
                console.error(
                    "GhostTyper: Error accepting suggestion via click:",
                    error
                );
            }
        } else {
            console.warn(
                "GhostTyper: Click detected but no suggestion or input available",
                {
                    suggestion: suggestion,
                    currentInput: this.currentInput,
                }
            );
        }
    }

    /**
     * Show visual feedback that the click was registered
     * Creates a temporary element that fades out
     */
    showClickFeedback() {
        // Create a feedback element
        const feedback = document.createElement("div");
        feedback.textContent = "✓"; // Checkmark
        feedback.style.position = "absolute";
        feedback.style.zIndex = "999999";
        feedback.style.color = "#4a6ee0";
        feedback.style.fontSize = "24px";
        feedback.style.fontWeight = "bold";
        feedback.style.pointerEvents = "none";
        feedback.style.opacity = "1";
        feedback.style.transition = "opacity 0.5s ease, transform 0.5s ease";

        // Position near the overlay
        if (this.overlay) {
            const rect = this.overlay.getBoundingClientRect();
            feedback.style.top = `${window.scrollY + rect.top - 10}px`;
            feedback.style.left = `${
                window.scrollX + rect.left + rect.width / 2
            }px`;
        } else {
            // Fallback position
            feedback.style.top = "50%";
            feedback.style.left = "50%";
        }

        // Add to the document
        document.body.appendChild(feedback);

        // Animate and remove
        setTimeout(() => {
            feedback.style.opacity = "0";
            feedback.style.transform = "translateY(-20px)";

            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 500);
        }, 100);
    }

    /**
     * Accept the current suggestion
     * @param {string} suggestion - The suggestion to accept
     */
    acceptSuggestion(suggestion) {
        if (!this.currentInput || !suggestion) return;

        const inputType = this.getInputType(this.currentInput);

        if (inputType === "contenteditable") {
            this.insertTextIntoContentEditable(suggestion);
        } else if (inputType === "textarea" || inputType === "input") {
            this.insertTextIntoInput(suggestion);
        }

        // Hide the suggestion after accepting
        this.hideSuggestion();
    }

    /**
     * Insert text into an input or textarea element
     * @param {string} text - The text to insert
     */
    insertTextIntoInput(text) {
        const element = this.currentInput;
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
     * Insert text into a contenteditable element
     * @param {string} text - The text to insert
     */
    insertTextIntoContentEditable(text) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents();

        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // Move cursor to end of inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        // Dispatch input event to trigger any listeners
        const inputEvent = new Event("input", { bubbles: true });
        this.currentInput.dispatchEvent(inputEvent);
    }

    /**
     * Ensure cursor is visible by scrolling if necessary
     * @param {HTMLElement} element - The input element
     */
    scrollToEnsureCursorVisible(element) {
        // For textarea elements, ensure the cursor is visible
        if (element.tagName.toLowerCase() === "textarea") {
            // Get cursor position
            const cursorPosition = element.selectionStart;

            // Create a temporary element to measure text height
            const temp = document.createElement("div");
            temp.style.position = "absolute";
            temp.style.visibility = "hidden";
            temp.style.whiteSpace = "pre-wrap";
            temp.style.wordWrap = "break-word";
            temp.style.fontFamily = window.getComputedStyle(element).fontFamily;
            temp.style.fontSize = window.getComputedStyle(element).fontSize;

            // Get text before cursor
            const textBeforeCursor = element.value.substring(0, cursorPosition);
            temp.textContent = textBeforeCursor;

            document.body.appendChild(temp);
            const textHeight = temp.scrollHeight;
            document.body.removeChild(temp);

            // Scroll to ensure cursor is visible
            element.scrollTop = textHeight - element.clientHeight / 2;
        }
    }
}

// Create a singleton instance
const suggestionOverlay = new SuggestionOverlay();

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
    apiKey: "",
    isEnabled: true,
    disabledSites: [],
    suggestionDelay: 500,
    presentationMode: "inline",
    debugMode: false,
};

// State variables
let debounceTimer = null;
let currentSuggestion = null;
let currentField = null;
let suggestionElement = null;
let isWaitingForSuggestion = false;
let currentRequestId = 0; // Track the most recent request
let suggestionAbortController = null; // For cancelling in-flight fetch requests

// Backend API URL (should be configurable in production)
// const API_URL = "http://192.168.31.232:3000/api";
const API_URL = "https://flowwrite-browser-extension.onrender.com/api";

/**
 * Initialize the content script
 */
function init() {
    // Load configuration from storage
    chrome.storage.local.get(
        [
            "apiKey",
            "isEnabled",
            "disabledSites",
            "suggestionDelay",
            "presentationMode",
            "debugMode",
        ],
        (result) => {
            if (result.apiKey) {
                config.apiKey = result.apiKey;
            }
            if (result.isEnabled !== undefined)
                config.isEnabled = result.isEnabled;
            if (result.disabledSites)
                config.disabledSites = result.disabledSites;
            if (result.suggestionDelay)
                config.suggestionDelay = result.suggestionDelay;
            if (result.presentationMode)
                config.presentationMode = result.presentationMode;
            if (result.debugMode !== undefined)
                config.debugMode = result.debugMode;

            // Check if the extension is enabled and the current site is not disabled
            if (isExtensionEnabledForSite()) {
                // Add event listeners
                addEventListeners();

                // Set up mutation observer to detect dynamically added text fields
                setupMutationObserver();
            }
        }
    );

    // Listen for configuration changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === "local") {
            if (changes.apiKey) config.apiKey = changes.apiKey.newValue;
            if (changes.isEnabled !== undefined) {
                config.isEnabled = changes.isEnabled.newValue;
                if (config.isEnabled) {
                    addEventListeners();
                    setupMutationObserver();
                } else {
                    removeEventListeners();
                    disconnectMutationObserver();
                }
            }
            if (changes.disabledSites) {
                config.disabledSites = changes.disabledSites.newValue;
                if (isExtensionEnabledForSite()) {
                    addEventListeners();
                    setupMutationObserver();
                } else {
                    removeEventListeners();
                    disconnectMutationObserver();
                }
            }
            if (changes.suggestionDelay)
                config.suggestionDelay = changes.suggestionDelay.newValue;
            if (changes.presentationMode)
                config.presentationMode = changes.presentationMode.newValue;
            if (changes.debugMode !== undefined)
                config.debugMode = changes.debugMode.newValue;
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
    return !config.disabledSites.some(
        (site) => currentHost === site || currentHost.endsWith("." + site)
    );
}

/**
 * Add event listeners to the page
 */
function addEventListeners() {
    // Listen for input events on text fields
    document.addEventListener("input", handleInput);

    // Listen for keydown events to handle Tab and Esc keys
    document.addEventListener("keydown", handleKeydown);

    // Listen for focus events to track the current field
    document.addEventListener("focusin", handleFocusIn);
}

/**
 * Remove event listeners from the page
 */
function removeEventListeners() {
    document.removeEventListener("input", handleInput);
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("focusin", handleFocusIn);

    // Remove any active suggestions
    removeSuggestion();

    // Disconnect mutation observer
    disconnectMutationObserver();
}

/**
 * Handle input events
 * @param {Event} event - The input event
 */
function handleInput(event) {
    // Check if the target is a text field
    if (!isTextField(event.target)) return;

    // Debug logging
    debugLogTextField(event.target, "handleInput");
    debugLog("Input event detected", { element: event.target });

    // Update the current field
    currentField = event.target;

    // Immediately remove any existing suggestion
    // This is critical to prevent ghost text from lingering when the user types
    removeSuggestion();

    // Also clear the current suggestion variable to ensure we don't have stale data
    currentSuggestion = null;

    // Clear any existing debounce timer
    if (debounceTimer) clearTimeout(debounceTimer);

    // If there's an in-flight request, abort it
    if (suggestionAbortController) {
        suggestionAbortController.abort();
        suggestionAbortController = null;
        debugLog("Aborted in-flight request due to new input");
    }

    // Set a new debounce timer
    debounceTimer = setTimeout(() => {
        // Double-check that we still have the current field
        if (!currentField) {
            debugLog("Current field lost, not requesting suggestion");
            return;
        }

        // Get the context from the field
        const context = getContext(currentField);

        // Debug logging
        debugLog("Context extracted", {
            context: context,
            contextLength: context ? context.length : 0,
        });

        // If there's enough context, request a suggestion
        if (context && context.length > 5) {
            // Increment the request ID to invalidate any pending requests
            // This ensures that if multiple requests are triggered in quick succession,
            // only the most recent one will be processed
            requestSuggestion(context);
        } else {
            debugLog("Context too short, not requesting suggestion", {
                length: context ? context.length : 0,
            });
        }
    }, config.suggestionDelay);
}

/**
 * Handle keydown events
 * @param {KeyboardEvent} event - The keydown event
 */
function handleKeydown(event) {
    // If there's no current suggestion, check if we need to clean up any lingering ghost text
    if (!currentSuggestion) {
        // Check if there are any suggestion elements that need to be removed
        const allSuggestions = document.querySelectorAll(
            ".flowwrite-suggestion, .flowwrite-suggestion-popup, .flowwrite-suggestion-sidepanel"
        );
        if (allSuggestions.length > 0) {
            debugLog("Found lingering ghost text elements, removing", {
                count: allSuggestions.length,
            });
            removeSuggestion();
        }
        return;
    }

    // If Tab is pressed, accept the suggestion
    if (
        event.key === "Tab" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.altKey
    ) {
        event.preventDefault();
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true);
    }

    // If Esc is pressed, dismiss the suggestion
    else if (event.key === "Escape") {
        event.preventDefault();
        removeSuggestion();

        // Send telemetry data
        sendTelemetry(false);
    }

    // If any other key is pressed, remove the suggestion
    else if (event.key !== "Tab" && event.key !== "Escape") {
        debugLog("Key pressed, removing suggestion", { key: event.key });
        removeSuggestion();

        // Also abort any in-flight requests
        if (suggestionAbortController) {
            suggestionAbortController.abort();
            suggestionAbortController = null;
            debugLog("Aborted in-flight request due to keypress");
        }
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
    if (element.tagName === "INPUT") {
        const type = element.type ? element.type.toLowerCase() : "";
        return (
            type === "text" ||
            type === "search" ||
            type === "email" ||
            type === "url" ||
            type === ""
        );
    }

    if (element.tagName === "TEXTAREA") return true;

    // Check if the element is contentEditable
    if (element.isContentEditable) return true;

    // Check for role attributes (used by many modern web apps)
    if (
        element.getAttribute("role") === "textbox" ||
        element.getAttribute("role") === "combobox" ||
        element.getAttribute("role") === "searchbox"
    ) {
        return true;
    }

    // Check for common class names and attributes used in chat applications
    const className = element.className || "";
    if (
        className.includes("textbox") ||
        className.includes("input") ||
        className.includes("editor") ||
        className.includes("composer") ||
        className.includes("text-area") ||
        className.includes("chat-input")
    ) {
        return true;
    }

    // Special handling for WhatsApp
    if (window.location.hostname.includes("web.whatsapp.com")) {
        // WhatsApp message input has a specific data attribute
        if (
            element.getAttribute("data-tab") === "6" ||
            element.getAttribute("title") === "Type a message" ||
            element.getAttribute("data-testid") ===
                "conversation-compose-box-input"
        ) {
            return true;
        }

        // Check for WhatsApp's contenteditable div
        if (
            element.getAttribute("contenteditable") === "true" &&
            (element.getAttribute("data-lexical-editor") === "true" ||
                element.closest('[data-testid="conversation-panel-wrapper"]'))
        ) {
            return true;
        }
    }

    // Special handling for Discord
    if (window.location.hostname.includes("discord.com")) {
        // Discord message input has specific class names
        if (
            className.includes("slateTextArea") ||
            className.includes("editor-") ||
            className.includes("channelTextArea-") ||
            element.getAttribute("role") === "textbox"
        ) {
            return true;
        }

        // Check for Discord's contenteditable div
        if (
            element.getAttribute("contenteditable") === "true" &&
            element.closest('[class*="channelTextArea-"]')
        ) {
            return true;
        }
    }

    // Check if element is in Shadow DOM
    if (element.shadowRoot) {
        // If element has Shadow DOM, check its children
        const shadowTextFields = element.shadowRoot.querySelectorAll(
            'input, textarea, [contenteditable="true"]'
        );
        return shadowTextFields.length > 0;
    }

    return false;
}

/**
 * Get the context from a text field
 * @param {HTMLElement} field - The text field
 * @returns {string} - The context
 */
function getContext(field) {
    if (!field) return "";

    let text = "";

    // Get text from input or textarea
    if (field.tagName === "INPUT" || field.tagName === "TEXTAREA") {
        text = field.value;
    }
    // Get text from contentEditable
    else if (field.isContentEditable) {
        text = field.textContent;
    }
    // Get text from elements with role attributes
    else if (
        field.getAttribute("role") === "textbox" ||
        field.getAttribute("role") === "combobox" ||
        field.getAttribute("role") === "searchbox"
    ) {
        // Try to get value first, then textContent
        text = field.value || field.textContent || "";
    }
    // Special handling for WhatsApp
    else if (window.location.hostname.includes("web.whatsapp.com")) {
        // Try to find the actual input field
        const whatsappInput =
            field.querySelector('[contenteditable="true"]') ||
            field.querySelector(
                '[data-testid="conversation-compose-box-input"]'
            );
        if (whatsappInput) {
            text = whatsappInput.textContent || "";
        } else {
            text = field.textContent || "";
        }
    }
    // Special handling for Discord
    else if (window.location.hostname.includes("discord.com")) {
        // Try to find the actual input field
        const discordInput =
            field.querySelector('[class*="slateTextArea"]') ||
            field.querySelector('[class*="editor-"]') ||
            field.querySelector('[contenteditable="true"]');
        if (discordInput) {
            text = discordInput.textContent || "";
        } else {
            text = field.textContent || "";
        }
    }
    // For other elements, try various properties
    else {
        text = field.value || field.textContent || field.innerText || "";
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
        console.error("FlowWrite: API key not set");
        debugLog("API key not set, cannot request suggestion");
        return;
    }

    // Generate a new request ID for this request
    const requestId = ++currentRequestId;

    debugLog("Requesting suggestion from backend", {
        contextLength: context.length,
        requestId: requestId,
    });

    // Always remove any existing suggestion before showing the loading indicator
    // This ensures previous ghost text is removed when a new request starts
    removeSuggestion();

    // Show loading indicator
    showLoadingIndicator();

    // Set the waiting flag
    isWaitingForSuggestion = true;

    // Cancel any previous suggestion request if exists and create a new AbortController instance
    if (suggestionAbortController) {
        suggestionAbortController.abort();
        debugLog("Aborted previous fetch request", {
            requestId: requestId - 1,
        });
    }
    suggestionAbortController = new AbortController();

    // Send the request to the backend
    fetch(`${API_URL}/suggest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            context,
            apiKey: config.apiKey,
        }),
        signal: suggestionAbortController.signal,
    })
        .then((response) => {
            // Check if the response is ok
            if (!response.ok) {
                debugLog("Backend response not OK", {
                    status: response.status,
                    requestId: requestId,
                });
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            // Only process this response if it's from the most recent request
            if (requestId !== currentRequestId) {
                debugLog("Ignoring outdated suggestion response", {
                    requestId: requestId,
                    currentRequestId: currentRequestId,
                });
                return;
            }

            // Hide loading indicator
            hideLoadingIndicator();

            // If there's a suggestion, show it
            if (data.suggestion) {
                currentSuggestion = data.suggestion;
                debugLog("Received suggestion from backend", {
                    suggestion:
                        data.suggestion.substring(0, 50) +
                        (data.suggestion.length > 50 ? "..." : ""),
                    requestId: requestId,
                });
                showSuggestion(currentSuggestion);
            } else {
                debugLog("No suggestion received from backend", {
                    requestId: requestId,
                });
            }
        })
        .catch((error) => {
            // Check if this is an abort error (request was cancelled)
            if (error.name === "AbortError") {
                debugLog("Fetch request was aborted", {
                    requestId: requestId,
                });
                return; // Don't show error for aborted requests
            }

            // Only process this error if it's from the most recent request
            if (requestId !== currentRequestId) {
                return;
            }

            console.error("FlowWrite: Error requesting suggestion:", error);
            debugLog("Error requesting suggestion", {
                error: error.message,
                errorName: error.name,
                requestId: requestId,
            });

            // Hide loading indicator
            hideLoadingIndicator();

            // Show error indicator
            showErrorIndicator();
        })
        .finally(() => {
            // Only reset the waiting flag if this is the most recent request
            if (requestId === currentRequestId) {
                isWaitingForSuggestion = false;

                // Clear the abort controller reference if this was the most recent request
                // This helps with garbage collection
                if (
                    suggestionAbortController &&
                    suggestionAbortController.signal.aborted
                ) {
                    suggestionAbortController = null;
                }
            }
        });
}

/**
 * Show a suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showSuggestion(suggestion) {
    // If there's no current field, do nothing
    if (!currentField) return;

    // Always ensure any existing suggestion is removed first
    // This is critical to prevent ghost text from previous suggestions from lingering
    removeSuggestion();

    // Ensure the cursor is in the right position before showing the suggestion
    // This is especially important for contentEditable elements
    if (currentField.isContentEditable) {
        // For contentEditable elements, ensure we have focus
        currentField.focus();
    } else if (
        currentField.tagName === "INPUT" ||
        currentField.tagName === "TEXTAREA"
    ) {
        // For input/textarea elements, ensure we have focus and the cursor is at the right position
        const cursorPosition = getCursorPosition(currentField);
        currentField.focus();
        setCursorPosition(currentField, cursorPosition);
    }

    // Choose the presentation mode
    switch (config.presentationMode) {
        case "inline":
            showInlineSuggestion(suggestion);
            break;
        case "popup":
            showPopupSuggestion(suggestion);
            break;
        case "sidepanel":
            showSidePanelSuggestion(suggestion);
            break;
        default:
            showInlineSuggestion(suggestion);
    }

    debugLog("Suggestion displayed", {
        mode: config.presentationMode,
        suggestionLength: suggestion.length,
        requestId: currentRequestId,
        fieldType:
            currentField.tagName ||
            (currentField.isContentEditable ? "contentEditable" : "unknown"),
    });
}

/**
 * Show an inline suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showInlineSuggestion(suggestion) {
    // If the field is an input or textarea
    if (
        currentField.tagName === "INPUT" ||
        currentField.tagName === "TEXTAREA"
    ) {
        // Create a span element for the suggestion
        suggestionElement = document.createElement("span");
        suggestionElement.className = "flowwrite-suggestion";
        suggestionElement.textContent = suggestion;
        suggestionElement.style.position = "absolute";
        suggestionElement.style.color = "#999";
        suggestionElement.style.backgroundColor = "transparent";
        suggestionElement.style.pointerEvents = "none";
        suggestionElement.style.whiteSpace = "pre";
        suggestionElement.style.zIndex = "9999";

        // Position the suggestion after the cursor
        const fieldRect = currentField.getBoundingClientRect();
        const fieldStyle = window.getComputedStyle(currentField);
        const fieldPaddingLeft = parseFloat(fieldStyle.paddingLeft);
        const fieldPaddingTop = parseFloat(fieldStyle.paddingTop);

        // Calculate cursor position
        const cursorPosition = getCursorPosition(currentField);
        const textBeforeCursor = currentField.value.substring(
            0,
            cursorPosition
        );

        // Get the width of the text before the cursor
        const textWidth = getTextWidth(textBeforeCursor, fieldStyle.font);

        // Get line height for proper vertical alignment
        const lineHeight =
            parseFloat(fieldStyle.lineHeight) ||
            parseFloat(fieldStyle.fontSize) * 1.2;

        // Calculate font metrics for better vertical alignment
        const fontSizeInPx = parseFloat(fieldStyle.fontSize);

        // Position the suggestion - ensure it's exactly at the cursor position
        suggestionElement.style.left = `${
            fieldRect.left + fieldPaddingLeft + textWidth
        }px`;

        // Adjust vertical position to align with text baseline
        suggestionElement.style.top = `${
            fieldRect.top + fieldPaddingTop + (lineHeight - fontSizeInPx) / 2
        }px`;

        // Match the font properties exactly
        suggestionElement.style.fontFamily = fieldStyle.fontFamily;
        suggestionElement.style.fontSize = fieldStyle.fontSize;
        suggestionElement.style.fontWeight = fieldStyle.fontWeight;
        suggestionElement.style.lineHeight = fieldStyle.lineHeight;

        debugLog("Positioned suggestion for input/textarea", {
            cursorPosition: cursorPosition,
            textWidth: textWidth,
            left: fieldRect.left + fieldPaddingLeft + textWidth,
            top: fieldRect.top + fieldPaddingTop,
        });

        // Add the suggestion to the page
        document.body.appendChild(suggestionElement);
    }
    // If the field is contentEditable
    else if (currentField.isContentEditable) {
        // Create a span element for the suggestion
        suggestionElement = document.createElement("span");
        suggestionElement.className = "flowwrite-suggestion";
        suggestionElement.textContent = suggestion;
        suggestionElement.style.color = "#999";
        suggestionElement.style.backgroundColor = "transparent";
        suggestionElement.style.pointerEvents = "none";
        suggestionElement.style.display = "inline"; // Ensure inline display
        suggestionElement.style.whiteSpace = "pre"; // Preserve whitespace

        // Get computed style of the field to match font properties
        const fieldStyle = window.getComputedStyle(currentField);
        suggestionElement.style.fontFamily = fieldStyle.fontFamily;
        suggestionElement.style.fontSize = fieldStyle.fontSize;
        suggestionElement.style.fontWeight = fieldStyle.fontWeight;
        suggestionElement.style.lineHeight = fieldStyle.lineHeight;

        // Insert the suggestion after the cursor
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            // Store the original selection to restore it later
            const originalRange = selection.getRangeAt(0).cloneRange();

            // Create a new range at the cursor position
            const range = originalRange.cloneRange();

            // Ensure we're at the exact cursor position
            range.collapse(false); // Collapse to the end point (cursor position)

            // Insert the suggestion at the cursor position
            range.insertNode(suggestionElement);

            // Move the cursor back to where it was before inserting the suggestion
            // This ensures the cursor stays where it was and the suggestion appears after it
            selection.removeAllRanges();
            selection.addRange(originalRange);

            debugLog("Positioned suggestion in contentEditable", {
                cursorPosition: "at cursor",
                suggestionElement:
                    suggestionElement.textContent.substring(0, 20) +
                    (suggestionElement.textContent.length > 20 ? "..." : ""),
            });
        }
    }
}

/**
 * Show a popup suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showPopupSuggestion(suggestion) {
    // Create a popup element
    suggestionElement = document.createElement("div");
    suggestionElement.className = "flowwrite-suggestion-popup";
    suggestionElement.textContent = suggestion;
    suggestionElement.style.position = "absolute";
    suggestionElement.style.backgroundColor = "#fff";
    suggestionElement.style.border = "1px solid #ccc";
    suggestionElement.style.borderRadius = "4px";
    suggestionElement.style.padding = "8px";
    suggestionElement.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
    suggestionElement.style.zIndex = "9999";
    suggestionElement.style.maxWidth = "300px";

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
    suggestionElement = document.createElement("div");
    suggestionElement.className = "flowwrite-suggestion-sidepanel";
    suggestionElement.textContent = suggestion;
    suggestionElement.style.position = "fixed";
    suggestionElement.style.top = "20px";
    suggestionElement.style.right = "20px";
    suggestionElement.style.width = "250px";
    suggestionElement.style.backgroundColor = "#fff";
    suggestionElement.style.border = "1px solid #ccc";
    suggestionElement.style.borderRadius = "4px";
    suggestionElement.style.padding = "16px";
    suggestionElement.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
    suggestionElement.style.zIndex = "9999";

    // Add a header
    const header = document.createElement("div");
    header.textContent = "FlowWrite Suggestion";
    header.style.fontWeight = "bold";
    header.style.marginBottom = "8px";
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
    if (
        currentField.tagName === "INPUT" ||
        currentField.tagName === "TEXTAREA"
    ) {
        // Get the cursor position
        const cursorPosition = getCursorPosition(currentField);

        // Insert the suggestion at the cursor position
        const newValue =
            currentField.value.substring(0, cursorPosition) +
            currentSuggestion +
            currentField.value.substring(cursorPosition);

        // Update the field value
        currentField.value = newValue;

        // Move the cursor to the end of the suggestion
        setCursorPosition(
            currentField,
            cursorPosition + currentSuggestion.length
        );

        // Dispatch input event to trigger any listeners
        const inputEvent = new Event("input", { bubbles: true });
        currentField.dispatchEvent(inputEvent);
    }
    // If the field is contentEditable
    else if (currentField.isContentEditable) {
        // Remove the suggestion element
        if (suggestionElement) {
            // Replace the suggestion element with its text content
            const textNode = document.createTextNode(currentSuggestion);
            suggestionElement.parentNode.replaceChild(
                textNode,
                suggestionElement
            );
            suggestionElement = null;

            // Dispatch input event to trigger any listeners
            const inputEvent = new Event("input", { bubbles: true });
            currentField.dispatchEvent(inputEvent);
        }
    }
    // Special handling for WhatsApp
    else if (window.location.hostname.includes("web.whatsapp.com")) {
        // Try to find the actual input field
        const whatsappInput =
            currentField.querySelector('[contenteditable="true"]') ||
            currentField.querySelector(
                '[data-testid="conversation-compose-box-input"]'
            ) ||
            currentField;

        if (whatsappInput.isContentEditable) {
            // Insert text at cursor position
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Ensure we're at the cursor position
                range.collapse(false); // Collapse to the end point (cursor position)

                const textNode = document.createTextNode(currentSuggestion);
                range.insertNode(textNode);

                // Move cursor to before the inserted text
                // This ensures the cursor stays where it was and the suggestion appears after it
                range.setStartBefore(textNode);
                range.setEndBefore(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                whatsappInput.dispatchEvent(inputEvent);
            }
        }
    }
    // Special handling for Discord
    else if (window.location.hostname.includes("discord.com")) {
        // Try to find the actual input field
        const discordInput =
            currentField.querySelector('[class*="slateTextArea"]') ||
            currentField.querySelector('[class*="editor-"]') ||
            currentField.querySelector('[contenteditable="true"]') ||
            currentField;

        if (discordInput.isContentEditable) {
            // Insert text at cursor position
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Ensure we're at the cursor position
                range.collapse(false); // Collapse to the end point (cursor position)

                const textNode = document.createTextNode(currentSuggestion);
                range.insertNode(textNode);

                // Move cursor to before the inserted text
                // This ensures the cursor stays where it was and the suggestion appears after it
                range.setStartBefore(textNode);
                range.setEndBefore(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                discordInput.dispatchEvent(inputEvent);
            }
        }
    }
    // For elements with role attributes
    else if (
        currentField.getAttribute("role") === "textbox" ||
        currentField.getAttribute("role") === "combobox" ||
        currentField.getAttribute("role") === "searchbox"
    ) {
        // Try to handle as input first
        if (currentField.value !== undefined) {
            const cursorPosition = getCursorPosition(currentField);
            const newValue =
                currentField.value.substring(0, cursorPosition) +
                currentSuggestion +
                currentField.value.substring(cursorPosition);

            currentField.value = newValue;
            setCursorPosition(
                currentField,
                cursorPosition + currentSuggestion.length
            );

            // Dispatch input event
            const inputEvent = new Event("input", { bubbles: true });
            currentField.dispatchEvent(inputEvent);
        }
        // Otherwise try to handle as contentEditable
        else {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);

                // Ensure we're at the cursor position
                range.collapse(false); // Collapse to the end point (cursor position)

                const textNode = document.createTextNode(currentSuggestion);
                range.insertNode(textNode);

                // Move cursor to before the inserted text
                // This ensures the cursor stays where it was and the suggestion appears after it
                range.setStartBefore(textNode);
                range.setEndBefore(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                currentField.dispatchEvent(inputEvent);
            }
        }
    }

    // Clear the current suggestion
    currentSuggestion = null;

    // Remove the suggestion element if it still exists
    removeSuggestion();
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

    // Find and remove any other suggestion elements that might be lingering
    // This ensures we don't have multiple ghost texts appearing
    const allSuggestions = document.querySelectorAll(
        ".flowwrite-suggestion, .flowwrite-suggestion-popup, .flowwrite-suggestion-sidepanel"
    );
    allSuggestions.forEach((element) => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
            debugLog("Removed additional ghost text element", {
                className: element.className,
            });
        }
    });
}

/**
 * Show a loading indicator
 */
function showLoadingIndicator() {
    // If there's no current field, do nothing
    if (!currentField) return;

    // Create a loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "flowwrite-loading";
    loadingIndicator.style.position = "absolute";
    loadingIndicator.style.width = "16px";
    loadingIndicator.style.height = "16px";
    loadingIndicator.style.border = "2px solid #f3f3f3";
    loadingIndicator.style.borderTop = "2px solid #3498db";
    loadingIndicator.style.borderRadius = "50%";
    loadingIndicator.style.animation = "flowwrite-spin 1s linear infinite";
    loadingIndicator.style.zIndex = "9999";

    // Add the animation
    const style = document.createElement("style");
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
    const errorIndicator = document.createElement("div");
    errorIndicator.className = "flowwrite-error";
    errorIndicator.style.position = "absolute";
    errorIndicator.style.width = "16px";
    errorIndicator.style.height = "16px";
    errorIndicator.style.backgroundColor = "#e74c3c";
    errorIndicator.style.borderRadius = "50%";
    errorIndicator.style.zIndex = "9999";

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
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ accepted }),
    }).catch((error) => {
        console.error("FlowWrite: Error sending telemetry:", error);
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
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    // Set the font
    context.font = font;

    // Measure the text
    const metrics = context.measureText(text);

    return metrics.width;
}

// Initialize the content script
init();

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
    enablePageContext: true,
    debugMode: false,
};

// State variables
let debounceTimer = null;
let currentSuggestion = null;
let currentField = null;
let suggestionElement = null;
let inlineSuggestionElement = null; // For tracking the inline suggestion element in dual mode
let isWaitingForSuggestion = false;
let currentRequestId = 0; // Track the most recent request
let suggestionAbortController = null; // For cancelling in-flight fetch requests

// Backend API URL (should be configurable in production)
// const API_URL = "http://192.168.31.232:3000/api";
const API_URL = "https://flowwrite-browser-extension.onrender.com/api";

/**
 * Inject the CSS file into the page
 */
function injectCSS() {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href = chrome.runtime.getURL("content.css");
    document.head.appendChild(link);
    debugLog("CSS injected");
}

/**
 * Initialize the content script
 */
function init() {
    // Inject CSS
    injectCSS();

    // Load configuration from storage
    chrome.storage.local.get(
        [
            "apiKey",
            "isEnabled",
            "disabledSites",
            "suggestionDelay",
            "presentationMode",
            "enablePageContext",
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
            if (result.enablePageContext !== undefined)
                config.enablePageContext = result.enablePageContext;
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
            if (changes.enablePageContext !== undefined)
                config.enablePageContext = changes.enablePageContext.newValue;
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

    // Add a global click handler to catch clicks on suggestions
    document.addEventListener("click", handleGlobalClick, true);

    // Add a global mousedown handler as a fallback for click detection
    document.addEventListener("mousedown", handleGlobalMouseDown, true);
}

/**
 * Handle global click events to catch clicks on suggestions
 * @param {MouseEvent} event - The click event
 */
function handleGlobalClick(event) {
    // If there's no current suggestion, do nothing
    if (!currentSuggestion) return;

    // Check if the click target is a suggestion element or its child
    const target = event.target;
    if (
        target &&
        (target.classList.contains("flowwrite-suggestion") ||
            target.classList.contains("flowwrite-suggestion-popup") ||
            target.classList.contains("flowwrite-suggestion-sidepanel") ||
            target.closest(".flowwrite-suggestion") ||
            target.closest(".flowwrite-suggestion-popup") ||
            target.closest(".flowwrite-suggestion-sidepanel"))
    ) {
        debugLog("Global click handler detected click on suggestion", {
            target: target,
            tagName: target.tagName,
            className: target.className,
            eventPhase: event.eventPhase,
            suggestion:
                currentSuggestion.substring(0, 20) +
                (currentSuggestion.length > 20 ? "..." : ""),
        });

        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();

        // Accept the suggestion
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true, "global-click");
    }
}

/**
 * Handle global mousedown events as a fallback for click detection
 * @param {MouseEvent} event - The mousedown event
 */
function handleGlobalMouseDown(event) {
    // If there's no current suggestion, do nothing
    if (!currentSuggestion) return;

    // Check if the mousedown target is a suggestion element or its child
    const target = event.target;
    if (
        target &&
        (target.classList.contains("flowwrite-suggestion") ||
            target.classList.contains("flowwrite-suggestion-popup") ||
            target.classList.contains("flowwrite-suggestion-sidepanel") ||
            target.closest(".flowwrite-suggestion") ||
            target.closest(".flowwrite-suggestion-popup") ||
            target.closest(".flowwrite-suggestion-sidepanel"))
    ) {
        debugLog("Global mousedown handler detected click on suggestion", {
            target: target,
            tagName: target.tagName,
            className: target.className,
            eventPhase: event.eventPhase,
            suggestion:
                currentSuggestion.substring(0, 20) +
                (currentSuggestion.length > 20 ? "..." : ""),
        });

        // Prevent default behavior and stop propagation
        event.preventDefault();
        event.stopPropagation();

        // Accept the suggestion
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true, "global-mousedown");
    }
}

/**
 * Remove event listeners from the page
 */
function removeEventListeners() {
    document.removeEventListener("input", handleInput);
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("focusin", handleFocusIn);
    document.removeEventListener("click", handleGlobalClick, true);
    document.removeEventListener("mousedown", handleGlobalMouseDown, true);

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
        sendTelemetry(true, "tab");
    }

    // If Esc is pressed, dismiss the suggestion
    else if (event.key === "Escape") {
        event.preventDefault();
        removeSuggestion();

        // Send telemetry data
        sendTelemetry(false, "escape");
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
 * Extract page context from the current page
 * @returns {Object} - The page context object
 */
function extractPageContext() {
    try {
        // If page context is disabled, return null
        if (!config.enablePageContext) {
            debugLog("Page context extraction disabled");
            return null;
        }

        debugLog("Extracting page context");

        // Get the page title
        const pageTitle = document.title || "";

        // Get the page URL
        const pageUrl = window.location.href || "";

        // Get the meta description
        const metaDescription =
            document.querySelector('meta[name="description"]')?.content ||
            document.querySelector('meta[property="og:description"]')
                ?.content ||
            "";

        // Get the input field context (parent container text)
        let inputFieldContext = "";
        if (currentField) {
            // Try to get the parent section or container
            const parentContainer = findParentContainer(currentField);
            if (parentContainer) {
                // Get text content excluding the input field itself
                inputFieldContext = getContainerText(
                    parentContainer,
                    currentField
                );
            }
        }

        // Get relevant section headings
        const relevantSections = [];
        if (currentField) {
            // Find nearby headings
            const headings = document.querySelectorAll(
                "h1, h2, h3, h4, h5, h6"
            );
            const fieldRect = currentField.getBoundingClientRect();

            // Get headings that are above or near the input field
            for (const heading of headings) {
                const headingRect = heading.getBoundingClientRect();
                // If heading is above or close to the input field
                if (headingRect.bottom <= fieldRect.bottom + 200) {
                    relevantSections.push(heading.textContent.trim());
                }
            }
        }

        // Get visible page content
        let pageContent = "";
        const visibleTextNodes = getVisibleTextNodes();
        // Include the full page content without truncation
        pageContent = visibleTextNodes.join(" ");

        // Create the page context object
        const pageContext = {
            pageTitle,
            pageUrl,
            pageMeta: metaDescription,
            inputFieldContext: inputFieldContext.substring(0, 500), // Limit to 500 chars
            pageContent,
            relevantSections: relevantSections.slice(0, 5), // Limit to 5 most relevant sections
        };

        // Limit the total size to 8KB to accommodate larger page content
        const pageContextString = JSON.stringify(pageContext);
        if (pageContextString.length > 8192) {
            debugLog("Page context too large, adjusting", {
                originalSize: pageContextString.length,
            });

            // First try to truncate input field context to preserve page content
            pageContext.inputFieldContext =
                pageContext.inputFieldContext.substring(0, 200);

            // If still too large, reduce the number of relevant sections
            const updatedContextString = JSON.stringify(pageContext);
            if (updatedContextString.length > 8192) {
                pageContext.relevantSections =
                    pageContext.relevantSections.slice(0, 3);
            }

            // As a last resort, if still too large, truncate page content
            const finalContextString = JSON.stringify(pageContext);
            if (finalContextString.length > 8192) {
                const excessBytes = finalContextString.length - 8192;
                const contentLength = pageContext.pageContent.length;
                const newContentLength = Math.max(
                    contentLength - excessBytes - 100,
                    contentLength / 2
                );

                debugLog("Truncating page content as last resort", {
                    originalContentLength: contentLength,
                    newContentLength: newContentLength,
                });

                pageContext.pageContent = pageContext.pageContent.substring(
                    0,
                    newContentLength
                );
            }
        }

        debugLog("Page context extracted", {
            contextSize: JSON.stringify(pageContext).length,
            pageContentSize: pageContext.pageContent.length,
            inputFieldContextSize: pageContext.inputFieldContext.length,
            relevantSectionsCount: pageContext.relevantSections.length,
        });

        return pageContext;
    } catch (error) {
        console.error("FlowWrite: Error extracting page context:", error);
        debugLog("Error extracting page context", { error: error.message });
        return null;
    }
}

/**
 * Find the parent container of an element
 * @param {HTMLElement} element - The element
 * @returns {HTMLElement} - The parent container
 */
function findParentContainer(element) {
    if (!element) return null;

    // Try to find a semantic parent container
    let parent = element.parentElement;
    while (parent && parent !== document.body) {
        // Check if this is a likely container
        if (
            parent.tagName === "SECTION" ||
            parent.tagName === "ARTICLE" ||
            parent.tagName === "FORM" ||
            (parent.tagName === "DIV" &&
                (parent.className.includes("container") ||
                    parent.className.includes("section") ||
                    parent.className.includes("form") ||
                    parent.className.includes("card") ||
                    parent.className.includes("box") ||
                    parent.id.includes("container") ||
                    parent.id.includes("section") ||
                    parent.id.includes("form")))
        ) {
            return parent;
        }
        parent = parent.parentElement;
    }

    // If no semantic container found, return the immediate parent
    return element.parentElement;
}

/**
 * Get text content from a container, excluding the input field
 * @param {HTMLElement} container - The container
 * @param {HTMLElement} inputField - The input field to exclude
 * @returns {string} - The text content
 */
function getContainerText(container, inputField) {
    if (!container) return "";

    // Clone the container to avoid modifying the original
    const clone = container.cloneNode(true);

    // Find and remove the input field from the clone
    const inputInClone = findEquivalentElement(clone, inputField);
    if (inputInClone) {
        inputInClone.remove();
    }

    // Get all text nodes
    const textNodes = [];
    const walker = document.createTreeWalker(
        clone,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while ((node = walker.nextNode())) {
        const text = node.textContent.trim();
        if (text) {
            textNodes.push(text);
        }
    }

    return textNodes.join(" ");
}

/**
 * Find the equivalent element in a cloned node
 * @param {HTMLElement} clonedParent - The cloned parent
 * @param {HTMLElement} originalElement - The original element
 * @returns {HTMLElement} - The equivalent element in the clone
 */
function findEquivalentElement(clonedParent, originalElement) {
    // Try to find by ID first
    if (originalElement.id) {
        const byId = clonedParent.querySelector(`#${originalElement.id}`);
        if (byId) return byId;
    }

    // Try to find by class and tag
    const className = originalElement.className;
    const tagName = originalElement.tagName;

    if (className && tagName) {
        // Convert className to a selector-friendly format
        const classSelector = className
            .split(" ")
            .filter((c) => c)
            .map((c) => `.${c}`)
            .join("");

        if (classSelector) {
            const byClassAndTag = clonedParent.querySelector(
                `${tagName}${classSelector}`
            );
            if (byClassAndTag) return byClassAndTag;
        }
    }

    // Fallback: try to find by tag and position
    if (tagName) {
        const elements = clonedParent.querySelectorAll(tagName);
        // This is a simplistic approach that might not always work
        for (const element of elements) {
            if (element.textContent === originalElement.textContent) {
                return element;
            }
        }
    }

    return null;
}

/**
 * Get visible text nodes from the page
 * @returns {string[]} - Array of visible text content
 */
function getVisibleTextNodes() {
    const textNodes = [];

    // Get all headings, paragraphs, and list items
    const elements = document.querySelectorAll(
        "h1, h2, h3, h4, h5, h6, p, li, label, span"
    );

    for (const element of elements) {
        // Check if the element is visible
        const style = window.getComputedStyle(element);
        if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.opacity === "0"
        ) {
            continue;
        }

        // Check if the element is in the viewport or close to it
        const rect = element.getBoundingClientRect();
        const windowHeight =
            window.innerHeight || document.documentElement.clientHeight;

        // Element is visible if it's within the viewport or just outside it
        if (!(rect.bottom < -300 || rect.top > windowHeight + 300)) {
            const text = element.textContent.trim();
            if (text) {
                textNodes.push(text);
            }
        }
    }

    return textNodes;
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

    // Extract page context if enabled
    const pageContext = config.enablePageContext ? extractPageContext() : null;

    // Prepare request payload
    const payload = {
        context,
        apiKey: config.apiKey,
    };

    // Add page context if available
    if (pageContext) {
        payload.pageContext = pageContext;
        debugLog("Including page context in request", {
            pageContextSize: JSON.stringify(pageContext).length,
            requestId: requestId,
        });
    }

    // Send the request to the backend
    fetch(`${API_URL}/suggest`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
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
        case "dual":
            showDualSuggestion(suggestion);
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
        suggestionElement.className =
            "flowwrite-suggestion flowwrite-suggestion-base";
        suggestionElement.textContent = suggestion;
        suggestionElement.style.position = "absolute";
        suggestionElement.style.color = "#999";
        suggestionElement.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        suggestionElement.style.pointerEvents = "auto"; // Make it clickable
        suggestionElement.style.cursor = "pointer"; // Show pointer cursor
        suggestionElement.style.whiteSpace = "pre";
        suggestionElement.style.zIndex = "9999";
        suggestionElement.style.userSelect = "none"; // Prevent text selection
        suggestionElement.style.padding = "2px"; // Add padding to increase clickable area

        // Add tooltip to indicate clickability
        suggestionElement.title = "Click to accept suggestion";

        // Add click event listener
        suggestionElement.addEventListener(
            "click",
            function (event) {
                debugLog("Inline suggestion clicked", {
                    suggestion:
                        suggestion.substring(0, 20) +
                        (suggestion.length > 20 ? "..." : ""),
                    target: event.target,
                });

                // Prevent the event from propagating
                event.preventDefault();
                event.stopPropagation();

                // Accept the suggestion
                acceptSuggestion();

                // Send telemetry data
                sendTelemetry(true, "click");
            },
            true
        ); // Use capture phase

        // Add mousedown event as a fallback
        suggestionElement.addEventListener(
            "mousedown",
            function (event) {
                debugLog("Inline suggestion mousedown", {
                    suggestion:
                        suggestion.substring(0, 20) +
                        (suggestion.length > 20 ? "..." : ""),
                    target: event.target,
                });

                // Prevent the event from propagating
                event.preventDefault();
                event.stopPropagation();

                // Accept the suggestion
                acceptSuggestion();

                // Send telemetry data
                sendTelemetry(true, "mousedown");
            },
            true
        ); // Use capture phase

        // Also store in inlineSuggestionElement for dual mode
        inlineSuggestionElement = suggestionElement;

        // Calculate cursor position
        const cursorPosition = getCursorPosition(currentField);
        const textBeforeCursor = currentField.value.substring(
            0,
            cursorPosition
        );

        // Get the visible boundaries of the field
        const boundaries = calculateVisibleBoundaries(currentField);
        if (!boundaries) return;

        // Get the width of the text before the cursor
        const textWidth = getTextWidth(
            textBeforeCursor,
            boundaries.fieldStyle.font
        );

        // Get line height for proper vertical alignment
        const lineHeight =
            parseFloat(boundaries.fieldStyle.lineHeight) ||
            parseFloat(boundaries.fieldStyle.fontSize) * 1.2;

        // Calculate font metrics for better vertical alignment
        const fontSizeInPx = parseFloat(boundaries.fieldStyle.fontSize);

        // Check if we should move the suggestion to the next line for multiline textareas
        let shouldWrapToNextLine = false;
        if (currentField.tagName === "TEXTAREA") {
            shouldWrapToNextLine = shouldMoveToNextLine(
                currentField,
                cursorPosition,
                suggestion,
                boundaries
            );
        }

        // Position the suggestion
        if (shouldWrapToNextLine) {
            // Position at the beginning of the next line
            // Account for window scroll position
            suggestionElement.style.left = `${
                window.scrollX +
                boundaries.fieldRect.left +
                boundaries.paddingLeft -
                currentField.scrollLeft
            }px`;

            // Calculate the vertical position for the next line
            const currentLineTop =
                boundaries.fieldRect.top +
                boundaries.paddingTop +
                (lineHeight - fontSizeInPx) / 2;

            // Account for window scroll position
            suggestionElement.style.top = `${
                window.scrollY + currentLineTop + lineHeight
            }px`;

            debugLog("Positioned suggestion at beginning of next line", {
                cursorPosition: cursorPosition,
                left:
                    window.scrollX +
                    boundaries.fieldRect.left +
                    boundaries.paddingLeft -
                    currentField.scrollLeft,
                top: window.scrollY + currentLineTop + lineHeight,
                shouldWrapToNextLine: true,
                windowScroll: { x: window.scrollX, y: window.scrollY },
            });
        } else {
            // Position after the cursor on the same line
            // Account for window scroll position
            suggestionElement.style.left = `${
                window.scrollX +
                boundaries.fieldRect.left +
                boundaries.paddingLeft +
                textWidth -
                currentField.scrollLeft
            }px`;

            // Adjust vertical position to align with text baseline
            // Account for window scroll position
            suggestionElement.style.top = `${
                window.scrollY +
                boundaries.fieldRect.top +
                boundaries.paddingTop +
                (lineHeight - fontSizeInPx) / 2
            }px`;

            debugLog("Positioned suggestion after cursor on same line", {
                cursorPosition: cursorPosition,
                textWidth: textWidth,
                scrollLeft: currentField.scrollLeft,
                left:
                    window.scrollX +
                    boundaries.fieldRect.left +
                    boundaries.paddingLeft +
                    textWidth -
                    currentField.scrollLeft,
                top:
                    window.scrollY +
                    boundaries.fieldRect.top +
                    boundaries.paddingTop +
                    (lineHeight - fontSizeInPx) / 2,
                shouldWrapToNextLine: false,
                windowScroll: { x: window.scrollX, y: window.scrollY },
            });
        }

        // Match the font properties exactly
        suggestionElement.style.fontFamily = boundaries.fieldStyle.fontFamily;
        suggestionElement.style.fontSize = boundaries.fieldStyle.fontSize;
        suggestionElement.style.fontWeight = boundaries.fieldStyle.fontWeight;
        suggestionElement.style.lineHeight = boundaries.fieldStyle.lineHeight;

        // Add the suggestion to the page
        document.body.appendChild(suggestionElement);

        // Ensure the cursor and suggestion are visible by scrolling if necessary
        // This is critical to ensure the suggestion is visible immediately when displayed
        ensureCursorAndSuggestionVisible(
            currentField,
            cursorPosition,
            suggestion.length
        );
    }
    // If the field is contentEditable
    else if (currentField.isContentEditable) {
        // Create a span element for the suggestion
        suggestionElement = document.createElement("span");
        suggestionElement.className =
            "flowwrite-suggestion flowwrite-suggestion-base";
        suggestionElement.textContent = suggestion;
        suggestionElement.style.color = "#999";
        suggestionElement.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        suggestionElement.style.pointerEvents = "auto"; // Make it clickable
        suggestionElement.style.cursor = "pointer"; // Show pointer cursor
        suggestionElement.style.display = "inline"; // Ensure inline display
        suggestionElement.style.whiteSpace = "pre"; // Preserve whitespace
        suggestionElement.style.userSelect = "none"; // Prevent text selection
        suggestionElement.style.padding = "2px"; // Add padding to increase clickable area
        suggestionElement.style.zIndex = "9999"; // Ensure it's on top

        // Add tooltip to indicate clickability
        suggestionElement.title = "Click to accept suggestion";

        // Add click event listener
        suggestionElement.addEventListener(
            "click",
            function (event) {
                debugLog("Inline contentEditable suggestion clicked", {
                    suggestion:
                        suggestion.substring(0, 20) +
                        (suggestion.length > 20 ? "..." : ""),
                    target: event.target,
                });

                // Prevent the event from propagating
                event.preventDefault();
                event.stopPropagation();

                // Accept the suggestion
                acceptSuggestion();

                // Send telemetry data
                sendTelemetry(true, "click");
            },
            true
        ); // Use capture phase

        // Add mousedown event as a fallback
        suggestionElement.addEventListener(
            "mousedown",
            function (event) {
                debugLog("Inline contentEditable suggestion mousedown", {
                    suggestion:
                        suggestion.substring(0, 20) +
                        (suggestion.length > 20 ? "..." : ""),
                    target: event.target,
                });

                // Prevent the event from propagating
                event.preventDefault();
                event.stopPropagation();

                // Accept the suggestion
                acceptSuggestion();

                // Send telemetry data
                sendTelemetry(true, "mousedown");
            },
            true
        ); // Use capture phase

        // Also store in inlineSuggestionElement for dual mode
        inlineSuggestionElement = suggestionElement;

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

            // For contentEditable elements, we need to ensure the suggestion is visible
            // by scrolling the element if necessary
            // This is critical to ensure the suggestion is visible immediately when displayed
            ensureContentEditableSuggestionVisible(
                currentField,
                suggestionElement
            );
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
    suggestionElement.className =
        "flowwrite-suggestion-popup flowwrite-suggestion-base";
    suggestionElement.textContent = suggestion;
    suggestionElement.style.position = "absolute";
    suggestionElement.style.maxWidth = "300px";

    // Add tooltip to indicate clickability
    suggestionElement.title = "Click to accept suggestion";

    // Add multiple event listeners to ensure clicks are captured
    suggestionElement.addEventListener(
        "click",
        function (event) {
            debugLog("Popup suggestion clicked", {
                suggestion:
                    suggestion.substring(0, 20) +
                    (suggestion.length > 20 ? "..." : ""),
                target: event.target,
                currentTarget: event.currentTarget,
                eventPhase: event.eventPhase,
            });

            // Prevent the event from propagating
            event.preventDefault();
            event.stopPropagation();

            // Accept the suggestion
            acceptSuggestion();

            // Send telemetry data
            sendTelemetry(true, "click");
        },
        true
    ); // Use capture phase

    // Add mousedown event as a fallback
    suggestionElement.addEventListener(
        "mousedown",
        function (event) {
            debugLog("Popup suggestion mousedown", {
                suggestion:
                    suggestion.substring(0, 20) +
                    (suggestion.length > 20 ? "..." : ""),
                target: event.target,
                currentTarget: event.currentTarget,
                eventPhase: event.eventPhase,
            });

            // Prevent the event from propagating
            event.preventDefault();
            event.stopPropagation();

            // Accept the suggestion
            acceptSuggestion();

            // Send telemetry data
            sendTelemetry(true, "mousedown");

            // Add visual feedback for the click
            suggestionElement.style.backgroundColor = "#e0e9ff";
            suggestionElement.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
        },
        true
    ); // Use capture phase

    // Position the popup near the cursor
    const fieldRect = currentField.getBoundingClientRect();
    // Account for window scroll position
    suggestionElement.style.left = `${window.scrollX + fieldRect.left}px`;
    suggestionElement.style.top = `${window.scrollY + fieldRect.bottom + 5}px`;

    // Add the popup to the page
    document.body.appendChild(suggestionElement);

    debugLog("Popup suggestion element created with click handlers", {
        suggestion:
            suggestion.substring(0, 20) + (suggestion.length > 20 ? "..." : ""),
    });
}

/**
 * Show both inline and popup suggestions simultaneously
 * @param {string} suggestion - The suggestion to show
 */
function showDualSuggestion(suggestion) {
    // First show the inline suggestion
    showInlineSuggestion(suggestion);

    // Store the inline suggestion element
    const inlineElement = inlineSuggestionElement;

    // Create a popup element
    const popupElement = document.createElement("div");
    popupElement.className =
        "flowwrite-suggestion-popup flowwrite-suggestion-base";
    popupElement.textContent = suggestion;
    popupElement.style.position = "absolute";
    popupElement.style.maxWidth = "300px";

    // Add tooltip to indicate clickability
    popupElement.title = "Click to accept suggestion";

    // Add click event listener
    popupElement.addEventListener("click", function (event) {
        debugLog("Popup suggestion clicked in dual mode", {
            suggestion:
                suggestion.substring(0, 20) +
                (suggestion.length > 20 ? "..." : ""),
            target: event.target,
        });

        // Prevent the event from propagating
        event.preventDefault();
        event.stopPropagation();

        // Accept the suggestion
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true, "click");
    });

    // Add mousedown event listener as a fallback
    popupElement.addEventListener("mousedown", function (event) {
        debugLog("Popup suggestion mousedown in dual mode", {
            suggestion:
                suggestion.substring(0, 20) +
                (suggestion.length > 20 ? "..." : ""),
            target: event.target,
        });

        // Prevent the event from propagating
        event.preventDefault();
        event.stopPropagation();

        // Accept the suggestion
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true, "click");
    });

    // Position the popup near the cursor
    const fieldRect = currentField.getBoundingClientRect();
    // Account for window scroll position
    popupElement.style.left = `${window.scrollX + fieldRect.left}px`;
    popupElement.style.top = `${window.scrollY + fieldRect.bottom + 5}px`;

    // Add the popup to the page
    document.body.appendChild(popupElement);

    // Set the popup element as the main suggestion element
    suggestionElement = popupElement;

    debugLog("Dual suggestion elements created with click handlers", {
        suggestion:
            suggestion.substring(0, 20) + (suggestion.length > 20 ? "..." : ""),
        inlineElement: inlineElement ? true : false,
        popupElement: popupElement ? true : false,
    });
}

/**
 * Show a side panel suggestion
 * @param {string} suggestion - The suggestion to show
 */
function showSidePanelSuggestion(suggestion) {
    // Create a side panel element
    suggestionElement = document.createElement("div");
    suggestionElement.className =
        "flowwrite-suggestion-sidepanel flowwrite-suggestion-base";
    suggestionElement.style.position = "fixed";
    suggestionElement.style.top = "20px";
    suggestionElement.style.right = "20px";
    suggestionElement.style.width = "250px";

    // Add a header
    const header = document.createElement("div");
    header.textContent = "FlowWrite Suggestion";
    header.style.fontWeight = "bold";
    header.style.marginBottom = "8px";

    // Add the suggestion text in a separate element
    const content = document.createElement("div");
    content.textContent = suggestion;
    content.style.marginTop = "8px";

    // Add an accept button
    const acceptButton = document.createElement("button");
    acceptButton.textContent = "Accept Suggestion";
    acceptButton.className = "flowwrite-button";

    // Add click event to the button
    acceptButton.addEventListener("click", function (event) {
        debugLog("Side panel accept button clicked", {
            suggestion:
                suggestion.substring(0, 20) +
                (suggestion.length > 20 ? "..." : ""),
        });

        // Prevent the event from propagating
        event.preventDefault();
        event.stopPropagation();

        // Accept the suggestion
        acceptSuggestion();

        // Send telemetry data
        sendTelemetry(true, "click");
    });

    // Add click event to the entire panel
    suggestionElement.addEventListener("click", function (event) {
        // Only accept if the click is directly on the panel or content, not on the button
        if (event.target === suggestionElement || event.target === content) {
            debugLog("Side panel suggestion clicked", {
                suggestion:
                    suggestion.substring(0, 20) +
                    (suggestion.length > 20 ? "..." : ""),
                target: event.target,
            });

            // Accept the suggestion
            acceptSuggestion();

            // Send telemetry data
            sendTelemetry(true, "click");
        }
    });

    // Add tooltip to indicate clickability
    suggestionElement.title = "Click to accept suggestion";

    // Assemble the panel
    suggestionElement.appendChild(header);
    suggestionElement.appendChild(content);
    suggestionElement.appendChild(acceptButton);

    // Add the side panel to the page
    document.body.appendChild(suggestionElement);

    debugLog("Side panel suggestion element created with click handlers", {
        suggestion:
            suggestion.substring(0, 20) + (suggestion.length > 20 ? "..." : ""),
    });
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

        // Calculate the new cursor position (at the end of the inserted suggestion)
        const newCursorPosition = cursorPosition + currentSuggestion.length;

        // Move the cursor to the end of the suggestion
        setCursorPosition(currentField, newCursorPosition);

        // Ensure the cursor is visible after accepting the suggestion
        // This is critical to fix the issue where the cursor becomes invisible
        // after accepting a suggestion
        ensureCursorAndSuggestionVisible(currentField, newCursorPosition, 0);

        // Dispatch input event to trigger any listeners
        const inputEvent = new Event("input", { bubbles: true });
        currentField.dispatchEvent(inputEvent);

        debugLog("Accepted suggestion in input/textarea", {
            originalCursorPosition: cursorPosition,
            newCursorPosition: newCursorPosition,
            suggestionLength: currentSuggestion.length,
        });
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

            // Position cursor after the inserted text
            const selection = window.getSelection();
            const range = document.createRange();
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // Store the range for debugging
            const cursorRect = range.getBoundingClientRect();

            debugLog("Accepted suggestion in contentEditable", {
                cursorPosition: "after text node",
                cursorRect: {
                    left: cursorRect.left,
                    top: cursorRect.top,
                    right: cursorRect.right,
                    bottom: cursorRect.bottom,
                },
            });

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

                // Move cursor after the inserted text
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure the cursor is visible after insertion
                ensureContentEditableSuggestionVisible(whatsappInput, textNode);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                whatsappInput.dispatchEvent(inputEvent);

                debugLog("Accepted suggestion in WhatsApp", {
                    inputType: "contentEditable",
                    suggestionLength: currentSuggestion.length,
                });
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

                // Move cursor after the inserted text
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure the cursor is visible after insertion
                ensureContentEditableSuggestionVisible(discordInput, textNode);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                discordInput.dispatchEvent(inputEvent);

                debugLog("Accepted suggestion in Discord", {
                    inputType: "contentEditable",
                    suggestionLength: currentSuggestion.length,
                });
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

            // Calculate the new cursor position
            const newCursorPosition = cursorPosition + currentSuggestion.length;

            // Set the cursor position
            setCursorPosition(currentField, newCursorPosition);

            // Ensure the cursor is visible
            ensureCursorAndSuggestionVisible(
                currentField,
                newCursorPosition,
                0
            );

            // Dispatch input event
            const inputEvent = new Event("input", { bubbles: true });
            currentField.dispatchEvent(inputEvent);

            debugLog("Accepted suggestion in role-based input", {
                originalCursorPosition: cursorPosition,
                newCursorPosition: newCursorPosition,
                suggestionLength: currentSuggestion.length,
            });
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

                // Move cursor after the inserted text
                range.setStartAfter(textNode);
                range.setEndAfter(textNode);
                selection.removeAllRanges();
                selection.addRange(range);

                // Ensure the cursor is visible after insertion
                ensureContentEditableSuggestionVisible(currentField, textNode);

                // Dispatch input event
                const inputEvent = new Event("input", { bubbles: true });
                currentField.dispatchEvent(inputEvent);

                debugLog("Accepted suggestion in role-based contentEditable", {
                    inputType: "contentEditable",
                    suggestionLength: currentSuggestion.length,
                });
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
    // If there's no suggestion element and no inline suggestion element, do nothing
    if (!suggestionElement && !inlineSuggestionElement) return;

    // Remove the main suggestion element
    if (suggestionElement && suggestionElement.parentNode) {
        suggestionElement.parentNode.removeChild(suggestionElement);
    }

    // Remove the inline suggestion element if it exists
    if (inlineSuggestionElement && inlineSuggestionElement.parentNode) {
        inlineSuggestionElement.parentNode.removeChild(inlineSuggestionElement);
    }

    // Clear the suggestion elements and current suggestion
    suggestionElement = null;
    inlineSuggestionElement = null;
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
 * @param {string} interactionType - How the suggestion was accepted (tab, click, etc.)
 */
function sendTelemetry(accepted, interactionType = "tab") {
    // Send the telemetry data
    fetch(`${API_URL}/telemetry`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            accepted,
            interactionType,
        }),
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

/**
 * Calculate the visible boundaries of an input field
 * @param {HTMLElement} field - The input field
 * @returns {Object} - The visible boundaries
 */
function calculateVisibleBoundaries(field) {
    if (!field) return null;

    const fieldStyle = window.getComputedStyle(field);
    const fieldWidth = field.clientWidth;
    const fieldHeight = field.clientHeight;
    const paddingLeft = parseFloat(fieldStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(fieldStyle.paddingRight) || 0;
    const paddingTop = parseFloat(fieldStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(fieldStyle.paddingBottom) || 0;
    const borderLeft = parseFloat(fieldStyle.borderLeftWidth) || 0;
    const borderRight = parseFloat(fieldStyle.borderRightWidth) || 0;
    const borderTop = parseFloat(fieldStyle.borderTopWidth) || 0;
    const borderBottom = parseFloat(fieldStyle.borderBottomWidth) || 0;

    // Calculate the visible area dimensions
    const visibleAreaWidth =
        fieldWidth - paddingLeft - paddingRight - borderLeft - borderRight;
    const visibleAreaHeight =
        fieldHeight - paddingTop - paddingBottom - borderTop - borderBottom;

    // Get the current scroll position
    const scrollLeft = field.scrollLeft || 0;
    const scrollTop = field.scrollTop || 0;

    // Add a buffer margin (20px) to prevent suggestions from appearing too close to the edge
    const bufferMargin = 20;

    // Calculate the visible area boundaries with buffer margin
    const visibleLeft = scrollLeft;
    const visibleRight = scrollLeft + visibleAreaWidth - bufferMargin;
    const visibleTop = scrollTop;
    const visibleBottom = scrollTop + visibleAreaHeight - bufferMargin;

    // Get the field's position on the page
    const fieldRect = field.getBoundingClientRect();

    return {
        visibleLeft,
        visibleRight,
        visibleTop,
        visibleBottom,
        visibleAreaWidth,
        visibleAreaHeight,
        fieldRect,
        paddingLeft,
        paddingRight,
        paddingTop,
        paddingBottom,
        scrollLeft,
        scrollTop,
        fieldStyle,
        bufferMargin,
    };
}

/**
 * Determine if a suggestion should be moved to the next line
 * @param {HTMLElement} field - The input field
 * @param {number} cursorPosition - The cursor position
 * @param {string} suggestionText - The suggestion text
 * @param {Object} boundaries - The visible boundaries
 * @returns {boolean} - Whether the suggestion should be moved to the next line
 */
function shouldMoveToNextLine(
    field,
    cursorPosition,
    suggestionText,
    boundaries
) {
    if (!field || !boundaries) return false;

    // Only applicable for textarea elements
    if (field.tagName !== "TEXTAREA") return false;

    // Get text before cursor
    const textBeforeCursor = field.value.substring(0, cursorPosition);

    // Check if we're near the end of a line
    const textBeforeCursorWidth = getTextWidth(
        textBeforeCursor,
        boundaries.fieldStyle.font
    );
    const suggestionWidth = getTextWidth(
        suggestionText,
        boundaries.fieldStyle.font
    );

    // Calculate the cursor position in pixels from the left edge of the content
    const cursorLeft = boundaries.paddingLeft + textBeforeCursorWidth;

    // Calculate the right edge of the suggestion
    const suggestionRight = cursorLeft + suggestionWidth;

    // Check if the suggestion would extend beyond the visible area
    const wouldExtendBeyondVisible =
        suggestionRight > boundaries.visibleRight - 20;

    // Check if we're near the end of the textarea width
    // This helps determine if we're at the end of a line in a multiline textarea
    const isNearEndOfLine = cursorLeft > boundaries.visibleAreaWidth * 0.8;

    // Check if the text before cursor contains a newline character
    // and if the cursor is at the end of the current line
    const lastNewlineIndex = textBeforeCursor.lastIndexOf("\n");
    const textAfterLastNewline =
        lastNewlineIndex >= 0
            ? textBeforeCursor.substring(lastNewlineIndex + 1)
            : textBeforeCursor;

    // Check if the text after the last newline is approaching the width of the visible area
    const isNearEndOfCurrentLine =
        getTextWidth(textAfterLastNewline, boundaries.fieldStyle.font) >
        boundaries.visibleAreaWidth * 0.8;

    // If the cursor is near the end of a line and the suggestion would extend beyond visible area
    // or if we're in a multiline textarea and near the end of the current line
    return (
        (wouldExtendBeyondVisible && isNearEndOfLine) ||
        (field.tagName === "TEXTAREA" && isNearEndOfCurrentLine)
    );
}

/**
 * Ensure the cursor and suggestion are visible by scrolling if necessary
 * @param {HTMLElement} field - The input field
 * @param {number} cursorPosition - The cursor position
 * @param {number} suggestionLength - The length of the suggestion
 */
function ensureCursorAndSuggestionVisible(
    field,
    cursorPosition,
    suggestionLength
) {
    if (!field) return;

    // Only applicable for input and textarea elements
    if (field.tagName !== "INPUT" && field.tagName !== "TEXTAREA") return;

    // Calculate the visible boundaries
    const boundaries = calculateVisibleBoundaries(field);
    if (!boundaries) return;

    // Get text before cursor
    const textBeforeCursor = field.value.substring(0, cursorPosition);

    // Get text of the suggestion
    const suggestionText = field.value.substring(
        cursorPosition,
        cursorPosition + suggestionLength
    );

    // Measure the width of text before cursor and the suggestion
    const textBeforeCursorWidth = getTextWidth(
        textBeforeCursor,
        boundaries.fieldStyle.font
    );
    const suggestionWidth = getTextWidth(
        suggestionText,
        boundaries.fieldStyle.font
    );

    // Calculate the cursor position in pixels from the left edge of the content
    const cursorLeft = boundaries.paddingLeft + textBeforeCursorWidth;

    // Calculate the right edge of the suggestion
    const suggestionRight = cursorLeft + suggestionWidth;

    debugLog("Checking cursor and suggestion visibility", {
        cursorLeft,
        suggestionRight,
        visibleLeft: boundaries.visibleLeft,
        visibleRight: boundaries.visibleRight,
        scrollLeft: boundaries.scrollLeft,
        visibleAreaWidth: boundaries.visibleAreaWidth,
        isMultiline: field.tagName === "TEXTAREA",
    });

    // Function to smoothly scroll the field
    const smoothScroll = (element, newScrollLeft) => {
        // Check if the browser supports smooth scrolling
        if ("scrollBehavior" in document.documentElement.style) {
            // Use scrollTo with smooth behavior
            element.scrollTo({
                left: newScrollLeft,
                behavior: "smooth",
            });
        } else {
            // Fallback for browsers that don't support smooth scrolling
            element.scrollLeft = newScrollLeft;
        }
    };

    // If the cursor is to the left of the visible area, scroll to make it visible
    if (cursorLeft < boundaries.visibleLeft + boundaries.bufferMargin) {
        // Add buffer margin for better visibility
        const newScrollLeft = Math.max(0, cursorLeft - boundaries.bufferMargin);
        smoothScroll(field, newScrollLeft);

        debugLog("Scrolling to make cursor visible (left)", {
            newScrollLeft,
            smoothScrolling: true,
        });
    }
    // If the suggestion extends beyond the right edge of the visible area, scroll to make it visible
    else if (suggestionRight > boundaries.visibleRight) {
        // For multiline textareas, check if we should move to the next line instead of scrolling
        if (
            field.tagName === "TEXTAREA" &&
            shouldMoveToNextLine(
                field,
                cursorPosition,
                suggestionText,
                boundaries
            )
        ) {
            // For multiline textareas, we might want to position the suggestion at the beginning of the next line
            // This is handled in the showInlineSuggestion function
            debugLog(
                "Suggestion would extend beyond visible area in textarea",
                {
                    shouldMoveToNextLine: true,
                }
            );
        } else {
            // For single-line inputs or when we don't want to move to the next line,
            // scroll horizontally to make the suggestion visible
            const newScrollLeft = Math.max(
                0,
                suggestionRight -
                    boundaries.visibleAreaWidth +
                    boundaries.bufferMargin
            );

            // Use smooth scrolling
            smoothScroll(field, newScrollLeft);

            debugLog("Scrolling to make suggestion visible (right)", {
                newScrollLeft,
                smoothScrolling: true,
            });
        }
    }

    // Update the position of the suggestion element after scrolling
    if (suggestionElement) {
        // Use a small delay to allow the smooth scrolling to take effect before updating position
        setTimeout(() => {
            const fieldRect = field.getBoundingClientRect();
            const newTextWidth = getTextWidth(
                textBeforeCursor,
                boundaries.fieldStyle.font
            );

            // Check if we should move the suggestion to the next line for multiline textareas
            if (
                field.tagName === "TEXTAREA" &&
                shouldMoveToNextLine(
                    field,
                    cursorPosition,
                    suggestionText,
                    boundaries
                )
            ) {
                // Calculate the position for the next line
                const lineHeight =
                    parseFloat(boundaries.fieldStyle.lineHeight) ||
                    parseFloat(boundaries.fieldStyle.fontSize) * 1.2;

                // Position at the beginning of the next line
                suggestionElement.style.left = `${
                    fieldRect.left + boundaries.paddingLeft - field.scrollLeft
                }px`;

                suggestionElement.style.top = `${
                    parseFloat(suggestionElement.style.top) + lineHeight
                }px`;

                debugLog("Moved suggestion to next line", {
                    left:
                        fieldRect.left +
                        boundaries.paddingLeft -
                        field.scrollLeft,
                    top: parseFloat(suggestionElement.style.top),
                    lineHeight: lineHeight,
                });
            } else {
                // Update the position to account for the new scroll position
                suggestionElement.style.left = `${
                    fieldRect.left +
                    boundaries.paddingLeft +
                    newTextWidth -
                    field.scrollLeft
                }px`;

                debugLog("Updated suggestion position after scrolling", {
                    left:
                        fieldRect.left +
                        boundaries.paddingLeft +
                        newTextWidth -
                        field.scrollLeft,
                });
            }
        }, 50); // Small delay to allow smooth scrolling to take effect
    }
}

/**
 * Ensure the suggestion is visible in a contentEditable element by scrolling if necessary
 * @param {HTMLElement} field - The contentEditable element
 * @param {HTMLElement} suggestionEl - The suggestion element
 */
function ensureContentEditableSuggestionVisible(field, suggestionEl) {
    if (!field || !suggestionEl) return;

    // Get the field and suggestion element rectangles
    const fieldRect = field.getBoundingClientRect();
    const suggestionRect = suggestionEl.getBoundingClientRect();

    // Get computed style of the field
    const fieldStyle = window.getComputedStyle(field);
    const paddingLeft = parseFloat(fieldStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(fieldStyle.paddingRight) || 0;
    const paddingTop = parseFloat(fieldStyle.paddingTop) || 0;
    const paddingBottom = parseFloat(fieldStyle.paddingBottom) || 0;

    // Add a buffer margin (20px) to prevent suggestions from appearing too close to the edge
    const bufferMargin = 20;

    // Calculate the visible area boundaries accounting for padding and buffer margin
    const visibleLeft = fieldRect.left + paddingLeft;
    const visibleRight = fieldRect.right - paddingRight - bufferMargin;
    const visibleTop = fieldRect.top + paddingTop;
    const visibleBottom = fieldRect.bottom - paddingBottom - bufferMargin;

    // Check if the suggestion is within the visible area of the field
    const isVisible =
        suggestionRect.left >= visibleLeft &&
        suggestionRect.right <= visibleRight &&
        suggestionRect.top >= visibleTop &&
        suggestionRect.bottom <= visibleBottom;

    debugLog("Checking contentEditable suggestion visibility", {
        isVisible,
        suggestionRect: {
            left: suggestionRect.left,
            right: suggestionRect.right,
            top: suggestionRect.top,
            bottom: suggestionRect.bottom,
        },
        visibleBoundaries: {
            left: visibleLeft,
            right: visibleRight,
            top: visibleTop,
            bottom: visibleBottom,
        },
        bufferMargin,
    });

    // Function to smoothly scroll an element
    const smoothScroll = (element, direction, amount) => {
        if (!element) return;

        // Check if the browser supports smooth scrolling
        if (
            "scrollBehavior" in document.documentElement.style &&
            element.scrollBy
        ) {
            // Use scrollBy with smooth behavior
            const scrollOptions = {
                behavior: "smooth",
            };

            if (direction === "horizontal") {
                scrollOptions.left = amount;
            } else {
                scrollOptions.top = amount;
            }

            element.scrollBy(scrollOptions);
            return true;
        }
        // Fallback for browsers or elements that don't support smooth scrolling
        else {
            if (
                direction === "horizontal" &&
                element.scrollLeft !== undefined
            ) {
                element.scrollLeft += amount;
                return true;
            } else if (
                direction === "vertical" &&
                element.scrollTop !== undefined
            ) {
                element.scrollTop += amount;
                return true;
            }
        }

        return false;
    };

    if (!isVisible) {
        // If the suggestion is not visible, we need to scroll the field
        // This is more complex for contentEditable elements as they don't have a standard scrollLeft property

        // Calculate how much we need to scroll horizontally
        if (suggestionRect.right > visibleRight) {
            // Suggestion extends beyond the right edge
            const scrollAmount =
                suggestionRect.right - visibleRight + bufferMargin;

            // Try to scroll the field directly
            let scrolled = smoothScroll(field, "horizontal", scrollAmount);

            // If direct scrolling didn't work, try to find a scrollable parent
            if (!scrolled) {
                const scrollableParent = findScrollableParent(field);
                if (scrollableParent) {
                    scrolled = smoothScroll(
                        scrollableParent,
                        "horizontal",
                        scrollAmount
                    );

                    if (scrolled) {
                        debugLog(
                            "Scrolled contentEditable parent horizontally",
                            {
                                scrollAmount,
                                smoothScrolling: true,
                            }
                        );
                    }
                }
            } else {
                debugLog("Scrolled contentEditable horizontally", {
                    scrollAmount,
                    smoothScrolling: true,
                });
            }
        }
        // If suggestion is to the left of the visible area
        else if (suggestionRect.left < visibleLeft) {
            const scrollAmount =
                visibleLeft - suggestionRect.left + bufferMargin;

            // Try to scroll the field directly
            let scrolled = smoothScroll(field, "horizontal", -scrollAmount);

            // If direct scrolling didn't work, try to find a scrollable parent
            if (!scrolled) {
                const scrollableParent = findScrollableParent(field);
                if (scrollableParent) {
                    scrolled = smoothScroll(
                        scrollableParent,
                        "horizontal",
                        -scrollAmount
                    );

                    if (scrolled) {
                        debugLog(
                            "Scrolled contentEditable parent horizontally (left)",
                            {
                                scrollAmount: -scrollAmount,
                                smoothScrolling: true,
                            }
                        );
                    }
                }
            } else {
                debugLog("Scrolled contentEditable horizontally (left)", {
                    scrollAmount: -scrollAmount,
                    smoothScrolling: true,
                });
            }
        }

        // Calculate how much we need to scroll vertically
        if (suggestionRect.bottom > visibleBottom) {
            // Suggestion extends beyond the bottom edge
            const scrollAmount =
                suggestionRect.bottom - visibleBottom + bufferMargin;

            // Try to scroll the field directly
            let scrolled = smoothScroll(field, "vertical", scrollAmount);

            // If direct scrolling didn't work, try to find a scrollable parent
            if (!scrolled) {
                const scrollableParent = findScrollableParent(field);
                if (scrollableParent) {
                    scrolled = smoothScroll(
                        scrollableParent,
                        "vertical",
                        scrollAmount
                    );

                    if (scrolled) {
                        debugLog("Scrolled contentEditable parent vertically", {
                            scrollAmount,
                            smoothScrolling: true,
                        });
                    }
                }
            } else {
                debugLog("Scrolled contentEditable vertically", {
                    scrollAmount,
                    smoothScrolling: true,
                });
            }
        }
        // If suggestion is above the visible area
        else if (suggestionRect.top < visibleTop) {
            const scrollAmount = visibleTop - suggestionRect.top + bufferMargin;

            // Try to scroll the field directly
            let scrolled = smoothScroll(field, "vertical", -scrollAmount);

            // If direct scrolling didn't work, try to find a scrollable parent
            if (!scrolled) {
                const scrollableParent = findScrollableParent(field);
                if (scrollableParent) {
                    scrolled = smoothScroll(
                        scrollableParent,
                        "vertical",
                        -scrollAmount
                    );

                    if (scrolled) {
                        debugLog(
                            "Scrolled contentEditable parent vertically (up)",
                            {
                                scrollAmount: -scrollAmount,
                                smoothScrolling: true,
                            }
                        );
                    }
                }
            } else {
                debugLog("Scrolled contentEditable vertically (up)", {
                    scrollAmount: -scrollAmount,
                    smoothScrolling: true,
                });
            }
        }
    }
}

/**
 * Find the nearest scrollable parent of an element
 * @param {HTMLElement} element - The element
 * @returns {HTMLElement|null} - The scrollable parent or null if none found
 */
function findScrollableParent(element) {
    if (!element) return null;

    // Check if the element itself is scrollable
    if (isElementScrollable(element)) {
        return element;
    }

    let parent = element.parentElement;
    while (parent && parent !== document.body) {
        if (isElementScrollable(parent)) {
            return parent;
        }
        parent = parent.parentElement;
    }

    // If no scrollable parent found, return the document.body
    return document.body;
}

/**
 * Check if an element is scrollable
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} - Whether the element is scrollable
 */
function isElementScrollable(element) {
    if (!element) return false;

    const style = window.getComputedStyle(element);

    // Check if the element has overflow that allows scrolling
    const hasScrollableOverflow =
        style.overflowX === "auto" ||
        style.overflowX === "scroll" ||
        style.overflowY === "auto" ||
        style.overflowY === "scroll";

    // Check if the element actually has content that overflows
    const hasOverflowingContent =
        element.scrollWidth > element.clientWidth ||
        element.scrollHeight > element.clientHeight;

    return hasScrollableOverflow && hasOverflowingContent;
}

// Initialize the content script
init();

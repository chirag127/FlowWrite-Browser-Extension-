/**
 * Mutation Observer for FlowWrite
 *
 * This file contains functions to detect dynamically added text fields
 * using a MutationObserver, which is especially useful for modern web apps
 * like WhatsApp and Discord that dynamically create input fields.
 */

// Mutation observer to detect dynamically added text fields
let mutationObserver = null;

/**
 * Set up mutation observer to detect dynamically added text fields
 */
function setupMutationObserver() {
    // Disconnect any existing observer
    disconnectMutationObserver();

    // Create a new observer
    mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // Check for added nodes
            if (
                mutation.type === "childList" &&
                mutation.addedNodes.length > 0
            ) {
                for (const node of mutation.addedNodes) {
                    // Check if the node is an element
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check if the node is a text field
                        if (isTextField(node)) {
                            // Add event listeners to the node
                            node.addEventListener("input", handleInput);
                            node.addEventListener("keydown", handleKeydown);
                            node.addEventListener("focusin", handleFocusIn);
                        }

                        // Check child nodes recursively
                        const textFields = node.querySelectorAll(
                            'input, textarea, [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"]'
                        );
                        for (const textField of textFields) {
                            textField.addEventListener("input", handleInput);
                            textField.addEventListener(
                                "keydown",
                                handleKeydown
                            );
                            textField.addEventListener(
                                "focusin",
                                handleFocusIn
                            );
                        }

                        // Special handling for WhatsApp
                        if (
                            window.location.hostname.includes(
                                "web.whatsapp.com"
                            )
                        ) {
                            const whatsappInputs = node.querySelectorAll(
                                '[data-testid="conversation-compose-box-input"], [data-tab="6"], [title="Type a message"]'
                            );
                            for (const input of whatsappInputs) {
                                input.addEventListener("input", handleInput);
                                input.addEventListener(
                                    "keydown",
                                    handleKeydown
                                );
                                input.addEventListener(
                                    "focusin",
                                    handleFocusIn
                                );
                            }
                        }

                        // Special handling for Discord
                        if (window.location.hostname.includes("discord.com")) {
                            const discordInputs = node.querySelectorAll(
                                '[class*="slateTextArea"], [class*="editor-"], [class*="channelTextArea-"]'
                            );
                            for (const input of discordInputs) {
                                input.addEventListener("input", handleInput);
                                input.addEventListener(
                                    "keydown",
                                    handleKeydown
                                );
                                input.addEventListener(
                                    "focusin",
                                    handleFocusIn
                                );
                            }
                        }
                    }
                }
            }
        }
    });

    // Start observing
    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

/**
 * Disconnect mutation observer
 */
function disconnectMutationObserver() {
    if (mutationObserver) {
        mutationObserver.disconnect();
        mutationObserver = null;
    }
}

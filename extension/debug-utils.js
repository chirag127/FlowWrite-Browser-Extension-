/**
 * Debug Utilities for FlowWrite
 * 
 * This file contains utility functions for debugging the extension.
 */

/**
 * Log a debug message to the console if debug mode is enabled
 * @param {string} message - The message to log
 * @param {any} data - Optional data to log
 */
function debugLog(message, data) {
    if (config.debugMode) {
        if (data) {
            console.log(`FlowWrite Debug: ${message}`, data);
        } else {
            console.log(`FlowWrite Debug: ${message}`);
        }
    }
}

/**
 * Log information about a text field
 * @param {HTMLElement} element - The text field element
 * @param {string} source - The source of the log (e.g., 'handleInput', 'handleFocusIn')
 */
function debugLogTextField(element, source) {
    if (!config.debugMode) return;
    
    const info = {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        type: element.type,
        contentEditable: element.isContentEditable,
        role: element.getAttribute('role'),
        value: element.value ? element.value.substring(0, 50) + (element.value.length > 50 ? '...' : '') : null,
        textContent: element.textContent ? element.textContent.substring(0, 50) + (element.textContent.length > 50 ? '...' : '') : null,
        attributes: {},
        source: source
    };
    
    // Get all attributes
    for (const attr of element.attributes) {
        info.attributes[attr.name] = attr.value;
    }
    
    console.log(`FlowWrite Debug: Text Field Detected`, info);
}

/**
 * Create a debug overlay to show information about the extension
 */
function createDebugOverlay() {
    if (!config.debugMode) return;
    
    // Remove any existing overlay
    removeDebugOverlay();
    
    // Create the overlay
    const overlay = document.createElement('div');
    overlay.id = 'flowwrite-debug-overlay';
    overlay.style.position = 'fixed';
    overlay.style.bottom = '10px';
    overlay.style.right = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    overlay.style.color = 'white';
    overlay.style.padding = '10px';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '9999999';
    overlay.style.fontSize = '12px';
    overlay.style.fontFamily = 'monospace';
    overlay.style.maxWidth = '300px';
    overlay.style.maxHeight = '200px';
    overlay.style.overflow = 'auto';
    
    // Add content
    overlay.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">FlowWrite Debug</div>
        <div>Status: ${config.isEnabled ? 'Enabled' : 'Disabled'}</div>
        <div>Site: ${window.location.hostname}</div>
        <div>Site Disabled: ${config.disabledSites.includes(window.location.hostname)}</div>
        <div>Delay: ${config.suggestionDelay}ms</div>
        <div>Mode: ${config.presentationMode}</div>
        <div>API Key: ${config.apiKey ? '✓ Set' : '✗ Not Set'}</div>
        <div>Current Field: ${currentField ? `${currentField.tagName}${currentField.id ? '#' + currentField.id : ''}` : 'None'}</div>
        <div>Suggestion: ${currentSuggestion ? '✓ Available' : '✗ None'}</div>
    `;
    
    // Add a close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.marginTop = '5px';
    closeButton.style.padding = '2px 5px';
    closeButton.style.backgroundColor = '#333';
    closeButton.style.border = '1px solid #666';
    closeButton.style.borderRadius = '3px';
    closeButton.style.color = 'white';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', removeDebugOverlay);
    overlay.appendChild(closeButton);
    
    // Add the overlay to the page
    document.body.appendChild(overlay);
}

/**
 * Remove the debug overlay
 */
function removeDebugOverlay() {
    const overlay = document.getElementById('flowwrite-debug-overlay');
    if (overlay) {
        overlay.parentNode.removeChild(overlay);
    }
}

/**
 * Toggle the debug overlay
 */
function toggleDebugOverlay() {
    if (document.getElementById('flowwrite-debug-overlay')) {
        removeDebugOverlay();
    } else {
        createDebugOverlay();
    }
}

// Add keyboard shortcut for debug overlay (Alt+Shift+D)
document.addEventListener('keydown', (event) => {
    if (event.altKey && event.shiftKey && event.key === 'D') {
        toggleDebugOverlay();
    }
});

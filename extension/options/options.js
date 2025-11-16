// FlowWrite Options Management - Comprehensive Settings Handler

const DEFAULT_CONFIG = {
    isEnabled: true,
    apiKeys: {
        gemini: '',
        cerebras: '',
        groq: ''
    },
    models: {
        gemini: 'gemini-2.0-flash-exp',
        cerebras: 'qwen2.5-coder-32b',
        groq: 'llama-3.3-70b-versatile'
    },
    suggestionDelay: 500,
    presentationMode: 'inline',
    enablePageContext: true,
    overrideKeyboard: false,
    suggestionLength: 'medium',
    requestTimeout: 8000,
    qualityMode: 'balanced',
    batchProcessing: true,
    contextWindow: 'medium',
    includePageTitle: true,
    includeMetaInfo: true,
    cacheSize: 'medium',
    debugMode: false,
    customUserAgent: '',
    enableStatistics: true,
    disabledSites: 'example.com\nmail.google.com'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', initializeOptions);

async function initializeOptions() {
    // Setup tab navigation
    setupTabNavigation();
    
    // Load options from storage
    await loadOptions();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup visibility toggles
    setupVisibilityToggles();
    
    // Setup slider handlers
    setupSliders();
    
    console.log('[FlowWrite] Options page initialized');
}

// ===== TAB NAVIGATION =====
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabContent = document.getElementById(`tab-${tabName}`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}

// ===== LOAD OPTIONS =====
async function loadOptions() {
    try {
        const result = await chrome.storage.local.get(['config']);
        const config = result.config || DEFAULT_CONFIG;
        
        // UI Elements
        document.getElementById('isEnabled').checked = config.isEnabled !== false;
        document.getElementById('groqEnabled').checked = !!config.apiKeys?.groq;
        document.getElementById('cerebrasEnabled').checked = !!config.apiKeys?.cerebras;
        document.getElementById('geminiEnabled').checked = !!config.apiKeys?.gemini;
        
        // API Keys
        document.getElementById('groqApiKey').value = config.apiKeys?.groq || '';
        document.getElementById('cerebrasApiKey').value = config.apiKeys?.cerebras || '';
        document.getElementById('geminiApiKey').value = config.apiKeys?.gemini || '';
        
        // Models
        document.getElementById('groqModel').value = config.models?.groq || 'llama-3.3-70b-versatile';
        document.getElementById('cerebrasModel').value = config.models?.cerebras || 'qwen2.5-coder-32b';
        document.getElementById('geminiModel').value = config.models?.gemini || 'gemini-2.0-flash-exp';
        
        // General Settings
        document.getElementById('suggestionDelay').value = config.suggestionDelay || 500;
        document.getElementById('suggestionDelayValue').textContent = `${config.suggestionDelay || 500} ms`;
        
        document.getElementById('presentationMode').value = config.presentationMode || 'inline';
        document.getElementById('enablePageContext').checked = config.enablePageContext !== false;
        document.getElementById('overrideKeyboard').checked = config.overrideKeyboard === true;
        document.getElementById('debugMode').checked = config.debugMode === true;
        
        // Performance Settings
        document.getElementById('suggestionLength').value = config.suggestionLength || 'medium';
        document.getElementById('requestTimeout').value = config.requestTimeout || 8000;
        document.getElementById('requestTimeoutValue').textContent = `${(config.requestTimeout || 8000) / 1000} seconds`;
        document.getElementById('qualityMode').value = config.qualityMode || 'balanced';
        document.getElementById('batchProcessing').checked = config.batchProcessing !== false;
        
        // Context Settings
        document.getElementById('contextWindow').value = config.contextWindow || 'medium';
        document.getElementById('includePageTitle').checked = config.includePageTitle !== false;
        document.getElementById('includeMetaInfo').checked = config.includeMetaInfo !== false;
        document.getElementById('cacheSize').value = config.cacheSize || 'medium';
        
        // Advanced Settings
        document.getElementById('disabledSites').value = config.disabledSites || '';
        document.getElementById('customUserAgent').value = config.customUserAgent || '';
        document.getElementById('enableStatistics').checked = config.enableStatistics !== false;
        
        updateFallbackStatus(config);
    } catch (error) {
        console.error('[FlowWrite] Error loading options:', error);
        showStatus('Error loading settings', 'error');
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Save button
    document.getElementById('saveButton').addEventListener('click', saveOptions);
    document.getElementById('resetButton').addEventListener('click', resetOptions);
    
    // Clear buttons
    const clearStatisticsBtn = document.getElementById('clearStatistics');
    const clearCacheBtn = document.getElementById('clearCache');
    const resetAllBtn = document.getElementById('resetAll');
    
    if (clearStatisticsBtn) {
        clearStatisticsBtn.addEventListener('click', clearStatistics);
    }
    if (clearCacheBtn) {
        clearCacheBtn.addEventListener('click', clearCache);
    }
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', resetAllSettings);
    }
}

// ===== VISIBILITY TOGGLES =====
function setupVisibilityToggles() {
    const toggleButtons = document.querySelectorAll('.toggle-visibility');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                btn.textContent = '🙈';
            } else {
                input.type = 'password';
                btn.textContent = '👁️';
            }
        });
    });
}

// ===== SLIDERS =====
function setupSliders() {
    const delaySlider = document.getElementById('suggestionDelay');
    const timeoutSlider = document.getElementById('requestTimeout');
    
    if (delaySlider) {
        delaySlider.addEventListener('input', (e) => {
            document.getElementById('suggestionDelayValue').textContent = `${e.target.value} ms`;
        });
    }
    
    if (timeoutSlider) {
        timeoutSlider.addEventListener('input', (e) => {
            document.getElementById('requestTimeoutValue').textContent = `${(e.target.value / 1000).toFixed(1)} seconds`;
        });
    }
}

// ===== SAVE OPTIONS =====
async function saveOptions() {
    try {
        const groqApiKey = document.getElementById('groqApiKey').value.trim();
        const cerebrasApiKey = document.getElementById('cerebrasApiKey').value.trim();
        const geminiApiKey = document.getElementById('geminiApiKey').value.trim();
        
        // Validate at least one provider is configured
        if (!groqApiKey && !cerebrasApiKey && !geminiApiKey) {
            showStatus('Please configure at least one AI provider', 'error');
            return;
        }
        
        const config = {
            isEnabled: document.getElementById('isEnabled').checked,
            apiKeys: {
                groq: groqApiKey,
                cerebras: cerebrasApiKey,
                gemini: geminiApiKey
            },
            models: {
                groq: document.getElementById('groqModel').value,
                cerebras: document.getElementById('cerebrasModel').value,
                gemini: document.getElementById('geminiModel').value
            },
            suggestionDelay: parseInt(document.getElementById('suggestionDelay').value),
            presentationMode: document.getElementById('presentationMode').value,
            enablePageContext: document.getElementById('enablePageContext').checked,
            overrideKeyboard: document.getElementById('overrideKeyboard').checked,
            suggestionLength: document.getElementById('suggestionLength').value,
            requestTimeout: parseInt(document.getElementById('requestTimeout').value),
            qualityMode: document.getElementById('qualityMode').value,
            batchProcessing: document.getElementById('batchProcessing').checked,
            contextWindow: document.getElementById('contextWindow').value,
            includePageTitle: document.getElementById('includePageTitle').checked,
            includeMetaInfo: document.getElementById('includeMetaInfo').checked,
            cacheSize: document.getElementById('cacheSize').value,
            debugMode: document.getElementById('debugMode').checked,
            customUserAgent: document.getElementById('customUserAgent').value.trim(),
            enableStatistics: document.getElementById('enableStatistics').checked,
            disabledSites: document.getElementById('disabledSites').value
        };
        
        await chrome.storage.local.set({ config });
        
        // Notify all tabs of configuration update
        const tabs = await chrome.tabs.query({});
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'configUpdated',
                config: config
            }).catch(() => {
                // Silently fail for tabs that don't have content script
            });
        });
        
        showStatus('✓ Settings saved successfully', 'success');
        updateFallbackStatus(config);
    } catch (error) {
        console.error('[FlowWrite] Error saving options:', error);
        showStatus('Error saving settings', 'error');
    }
}

// ===== RESET OPTIONS =====
async function resetOptions() {
    if (!confirm('Are you sure you want to reset settings to defaults?')) {
        return;
    }
    
    try {
        await chrome.storage.local.set({ config: DEFAULT_CONFIG });
        await loadOptions();
        showStatus('Settings reset to defaults', 'success');
    } catch (error) {
        console.error('[FlowWrite] Error resetting options:', error);
        showStatus('Error resetting settings', 'error');
    }
}

// ===== CLEAR STATISTICS =====
async function clearStatistics() {
    if (!confirm('Clear all usage statistics?')) {
        return;
    }
    
    try {
        await chrome.storage.local.remove(['statistics']);
        showStatus('Statistics cleared', 'success');
    } catch (error) {
        console.error('[FlowWrite] Error clearing statistics:', error);
        showStatus('Error clearing statistics', 'error');
    }
}

// ===== CLEAR CACHE =====
async function clearCache() {
    if (!confirm('Clear all cached suggestions? This cannot be undone.')) {
        return;
    }
    
    try {
        await chrome.storage.local.remove(['suggestionCache', 'contextCache']);
        showStatus('Cache cleared', 'success');
    } catch (error) {
        console.error('[FlowWrite] Error clearing cache:', error);
        showStatus('Error clearing cache', 'error');
    }
}

// ===== RESET ALL =====
async function resetAllSettings() {
    if (!confirm('⚠️ This will delete ALL settings, data, and cache. This cannot be undone. Continue?')) {
        return;
    }
    
    if (!confirm('Are you absolutely sure? This action cannot be reversed.')) {
        return;
    }
    
    try {
        await chrome.storage.local.clear();
        await loadOptions();
        showStatus('All settings have been reset', 'success');
        setTimeout(() => {
            location.reload();
        }, 1000);
    } catch (error) {
        console.error('[FlowWrite] Error resetting all:', error);
        showStatus('Error resetting all settings', 'error');
    }
}

// ===== FALLBACK STATUS =====
function updateFallbackStatus(config) {
    const fallbackStatus = document.getElementById('fallbackStatus');
    if (!fallbackStatus) return;
    
    const providers = [
        { name: 'Groq', key: 'groq', priority: 1, model: config.models?.groq },
        { name: 'Cerebras', key: 'cerebras', priority: 2, model: config.models?.cerebras },
        { name: 'Google Gemini', key: 'gemini', priority: 3, model: config.models?.gemini }
    ];
    
    let html = '';
    let enabledCount = 0;
    
    providers.forEach(provider => {
        const hasKey = !!config.apiKeys?.[provider.key];
        if (hasKey) enabledCount++;
        
        html += `
            <div class="fallback-item ${hasKey ? 'primary' : ''}" style="opacity: ${hasKey ? '1' : '0.5'}">
                <div class="fallback-number">${provider.priority}</div>
                <div class="fallback-provider">
                    <div class="fallback-provider-name">${provider.name}</div>
                    <div class="fallback-provider-model">${provider.model || 'N/A'}</div>
                </div>
                <div class="fallback-status ${hasKey ? 'primary' : 'fallback'}">
                    ${hasKey ? '✓ Enabled' : '○ Disabled'}
                </div>
            </div>
        `;
    });
    
    if (enabledCount === 0) {
        html = '<div style="padding: 16px; text-align: center; color: #5f6368; font-size: 13px;">No providers enabled. Configure at least one provider above.</div>';
    }
    
    fallbackStatus.innerHTML = html;
}

// ===== STATUS MESSAGE =====
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status-footer ${type}`;
        
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusElement.textContent = '';
                statusElement.className = 'status-footer';
            }, 3000);
        }
    }
}

// ===== STORAGE LISTENERS =====
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.config) {
        console.log('[FlowWrite] Configuration updated from another tab');
        loadOptions();
    }
});

console.log('[FlowWrite] Options script loaded');

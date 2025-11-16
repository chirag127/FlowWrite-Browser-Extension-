/**
 * API Usage Examples
 * 
 * Demonstrates how to use the AI Provider Service Manager from the extension
 */

// Example 1: Basic suggestion request with automatic fallback
async function basicSuggestion() {
    const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: 'Hello, my name is'
        })
    });
    
    const data = await response.json();
    console.log('Suggestion:', data.suggestion);
}

// Example 2: Request with size preference
async function suggestionWithSizePreference() {
    const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: 'The capital of France is',
            preferredSize: 'small' // tiny, small, medium, large
        })
    });
    
    const data = await response.json();
    console.log('Suggestion:', data.suggestion);
}

// Example 3: Request with specific provider and model
async function suggestionWithSpecificModel() {
    const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: 'In the year 2024,',
            providerId: 'gemini',
            modelName: 'gemini-2.5-flash-preview-04-17'
        })
    });
    
    const data = await response.json();
    console.log('Suggestion:', data.suggestion);
}

// Example 4: Request with user-provided API key (for Gemini)
async function suggestionWithUserApiKey() {
    const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: 'The weather today is',
            apiKey: 'user_gemini_api_key_here',
            providerId: 'gemini'
        })
    });
    
    const data = await response.json();
    console.log('Suggestion:', data.suggestion);
}

// Example 5: Request with page context
async function suggestionWithContext() {
    const response = await fetch('http://localhost:3000/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            context: 'I would like to',
            preferredSize: 'small',
            pageContext: {
                pageTitle: 'Contact Us - Example Corp',
                pageUrl: 'https://example.com/contact',
                pageMeta: 'Get in touch with our team',
                inputFieldContext: 'Message:',
                pageContent: 'Contact us for support and inquiries'
            }
        })
    });
    
    const data = await response.json();
    console.log('Suggestion:', data.suggestion);
}

// Example 6: Get available providers
async function getProviders() {
    const response = await fetch('http://localhost:3000/api/providers');
    const data = await response.json();
    
    console.log('Available Providers:', JSON.stringify(data.providers, null, 2));
}

// Example 7: Check health status
async function checkHealth() {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    console.log('System Health:', JSON.stringify(data, null, 2));
}

// Example 8: Extension content script integration
class FlowWriteAPI {
    constructor(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
        this.preferredSize = 'small';
        this.userApiKey = null;
    }

    async getSuggestion(context, pageContext = null) {
        try {
            const response = await fetch(`${this.serverUrl}/api/suggest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context,
                    preferredSize: this.preferredSize,
                    apiKey: this.userApiKey,
                    pageContext
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.suggestion;
        } catch (error) {
            console.error('Failed to get suggestion:', error);
            return null;
        }
    }

    async getAvailableProviders() {
        try {
            const response = await fetch(`${this.serverUrl}/api/providers`);
            const data = await response.json();
            return data.providers;
        } catch (error) {
            console.error('Failed to get providers:', error);
            return [];
        }
    }

    async checkHealth() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            return await response.json();
        } catch (error) {
            console.error('Failed to check health:', error);
            return null;
        }
    }

    setPreferredSize(size) {
        this.preferredSize = size;
    }

    setUserApiKey(apiKey) {
        this.userApiKey = apiKey;
    }
}

// Example usage in content script
async function contentScriptExample() {
    const api = new FlowWriteAPI('http://localhost:3000');
    
    // Set preferences from user settings
    api.setPreferredSize('small');
    api.setUserApiKey(null); // Use server keys
    
    // Get suggestion with context
    const suggestion = await api.getSuggestion(
        'Hello, my name is',
        {
            pageTitle: document.title,
            pageUrl: window.location.href,
            pageMeta: document.querySelector('meta[name="description"]')?.content || ''
        }
    );
    
    console.log('Suggestion:', suggestion);
}

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FlowWriteAPI;
}

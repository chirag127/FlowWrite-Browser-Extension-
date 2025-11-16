/**
 * AI Provider Service Manager
 * 
 * Manages multiple AI providers (Gemini, Cerebras, Groq) with:
 * - REST API clients for each provider
 * - Model definitions sorted by size
 * - Rate limit tracking
 * - Automatic fallback logic
 */

const axios = require('axios');

class AIProviderManager {
    constructor() {
        this.providers = this.initializeProviders();
        this.rateLimits = new Map();
    }

    /**
     * Initialize provider configurations
     */
    initializeProviders() {
        return {
            gemini: {
                name: 'Gemini',
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                models: [
                    { name: 'gemini-2.0-flash-lite', size: 'tiny', rpm: 15, rpd: 1500 },
                    { name: 'gemini-2.5-flash-preview-04-17', size: 'small', rpm: 10, rpd: 1000 },
                    { name: 'gemini-1.5-flash', size: 'medium', rpm: 15, rpd: 1500 },
                    { name: 'gemini-1.5-pro', size: 'large', rpm: 2, rpd: 50 },
                ],
                enabled: () => !!process.env.GEMINI_API_KEY,
                apiKey: () => process.env.GEMINI_API_KEY,
            },
            cerebras: {
                name: 'Cerebras',
                baseUrl: 'https://api.cerebras.ai/v1',
                models: [
                    { name: 'llama3.1-8b', size: 'small', rpm: 30, rpd: 14400 },
                    { name: 'llama-3.3-70b', size: 'large', rpm: 30, rpd: 14400 },
                ],
                enabled: () => !!process.env.CEREBRAS_API_KEY,
                apiKey: () => process.env.CEREBRAS_API_KEY,
            },
            groq: {
                name: 'Groq',
                baseUrl: 'https://api.groq.com/openai/v1',
                models: [
                    { name: 'llama-3.3-70b-versatile', size: 'large', rpm: 30, rpd: 14400 },
                    { name: 'llama-3.1-8b-instant', size: 'small', rpm: 30, rpd: 14400 },
                    { name: 'mixtral-8x7b-32768', size: 'medium', rpm: 30, rpd: 14400 },
                ],
                enabled: () => !!process.env.GROQ_API_KEY,
                apiKey: () => process.env.GROQ_API_KEY,
            },
        };
    }

    /**
     * Get all available providers (those with API keys configured)
     */
    getAvailableProviders() {
        return Object.entries(this.providers)
            .filter(([_, config]) => config.enabled())
            .map(([id, config]) => ({
                id,
                name: config.name,
                models: config.models,
            }));
    }

    /**
     * Get rate limit info for a specific provider and model
     */
    getRateLimitInfo(providerId, modelName) {
        const key = `${providerId}:${modelName}`;
        const now = Date.now();
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                requestsThisMinute: [],
                requestsToday: [],
            });
        }

        const limits = this.rateLimits.get(key);
        
        // Clean up old timestamps
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        limits.requestsThisMinute = limits.requestsThisMinute.filter(t => t > oneMinuteAgo);
        limits.requestsToday = limits.requestsToday.filter(t => t > oneDayAgo);

        const provider = this.providers[providerId];
        const model = provider.models.find(m => m.name === modelName);

        if (!model) {
            return null;
        }

        return {
            requestsThisMinute: limits.requestsThisMinute.length,
            requestsToday: limits.requestsToday.length,
            rpm: model.rpm,
            rpd: model.rpd,
            canMakeRequest: limits.requestsThisMinute.length < model.rpm && 
                           limits.requestsToday.length < model.rpd,
        };
    }

    /**
     * Record a request for rate limiting
     */
    recordRequest(providerId, modelName) {
        const key = `${providerId}:${modelName}`;
        const now = Date.now();

        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, {
                requestsThisMinute: [],
                requestsToday: [],
            });
        }

        const limits = this.rateLimits.get(key);
        limits.requestsThisMinute.push(now);
        limits.requestsToday.push(now);
    }

    /**
     * Generate content using Gemini API
     */
    async generateWithGemini(modelName, prompt, apiKey = null) {
        const key = apiKey || this.providers.gemini.apiKey();
        if (!key) {
            throw new Error('Gemini API key not configured');
        }

        const url = `${this.providers.gemini.baseUrl}/models/${modelName}:generateContent?key=${key}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
            },
        });

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        return response.data.candidates[0].content.parts[0].text;
    }

    /**
     * Generate content using Cerebras API (OpenAI-compatible)
     */
    async generateWithCerebras(modelName, prompt) {
        const key = this.providers.cerebras.apiKey();
        if (!key) {
            throw new Error('Cerebras API key not configured');
        }

        const url = `${this.providers.cerebras.baseUrl}/chat/completions`;
        
        const response = await axios.post(url, {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from Cerebras API');
        }

        return response.data.choices[0].message.content;
    }

    /**
     * Generate content using Groq API (OpenAI-compatible)
     */
    async generateWithGroq(modelName, prompt) {
        const key = this.providers.groq.apiKey();
        if (!key) {
            throw new Error('Groq API key not configured');
        }

        const url = `${this.providers.groq.baseUrl}/chat/completions`;
        
        const response = await axios.post(url, {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from Groq API');
        }

        return response.data.choices[0].message.content;
    }

    /**
     * Generate content with a specific provider and model
     */
    async generateContent(providerId, modelName, prompt, userApiKey = null) {
        // Check rate limits
        const rateLimitInfo = this.getRateLimitInfo(providerId, modelName);
        if (rateLimitInfo && !rateLimitInfo.canMakeRequest) {
            throw new Error(`Rate limit exceeded for ${providerId}:${modelName}`);
        }

        // Record the request
        this.recordRequest(providerId, modelName);

        // Generate content based on provider
        try {
            let result;
            switch (providerId) {
                case 'gemini':
                    result = await this.generateWithGemini(modelName, prompt, userApiKey);
                    break;
                case 'cerebras':
                    result = await this.generateWithCerebras(modelName, prompt);
                    break;
                case 'groq':
                    result = await this.generateWithGroq(modelName, prompt);
                    break;
                default:
                    throw new Error(`Unknown provider: ${providerId}`);
            }
            return result;
        } catch (error) {
            console.error(`Error with ${providerId}:${modelName}:`, error.message);
            throw error;
        }
    }

    /**
     * Generate content with automatic fallback
     * Tries providers in order of preference based on size preference
     */
    async generateWithFallback(prompt, options = {}) {
        const {
            preferredSize = 'small', // tiny, small, medium, large
            userApiKey = null, // For Gemini user-provided API keys
            providerId = null, // Force a specific provider
            modelName = null, // Force a specific model
        } = options;

        // If specific provider and model are specified, use them
        if (providerId && modelName) {
            try {
                return await this.generateContent(providerId, modelName, prompt, userApiKey);
            } catch (error) {
                console.error(`Failed to generate with ${providerId}:${modelName}:`, error.message);
                throw error;
            }
        }

        // Build a prioritized list of providers and models
        const available = this.getAvailableProviders();
        
        if (available.length === 0) {
            throw new Error('No AI providers configured');
        }

        // Sort models by size preference
        const sizeOrder = ['tiny', 'small', 'medium', 'large'];
        const preferredIndex = sizeOrder.indexOf(preferredSize);
        
        const sortedModels = [];
        available.forEach(provider => {
            provider.models.forEach(model => {
                const modelIndex = sizeOrder.indexOf(model.size);
                sortedModels.push({
                    providerId: provider.id,
                    modelName: model.name,
                    size: model.size,
                    priority: Math.abs(modelIndex - preferredIndex),
                });
            });
        });

        // Sort by priority (closest to preferred size), then by size
        sortedModels.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
        });

        // Try each model in order until one succeeds
        const errors = [];
        for (const { providerId, modelName } of sortedModels) {
            try {
                const result = await this.generateContent(providerId, modelName, prompt, userApiKey);
                console.log(`Successfully generated with ${providerId}:${modelName}`);
                return result;
            } catch (error) {
                console.error(`Failed with ${providerId}:${modelName}:`, error.message);
                errors.push({ providerId, modelName, error: error.message });
            }
        }

        // All providers failed
        throw new Error(`All providers failed: ${JSON.stringify(errors)}`);
    }

    /**
     * Get system health status
     */
    getHealthStatus() {
        const available = this.getAvailableProviders();
        const status = {
            availableProviders: available.length,
            providers: {},
        };

        available.forEach(provider => {
            status.providers[provider.id] = {
                name: provider.name,
                models: provider.models.map(model => {
                    const rateLimitInfo = this.getRateLimitInfo(provider.id, model.name);
                    return {
                        name: model.name,
                        size: model.size,
                        canMakeRequest: rateLimitInfo?.canMakeRequest ?? true,
                        requestsThisMinute: rateLimitInfo?.requestsThisMinute ?? 0,
                        requestsToday: rateLimitInfo?.requestsToday ?? 0,
                    };
                }),
            };
        });

        return status;
    }
}

// Export singleton instance
module.exports = new AIProviderManager();

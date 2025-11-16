/**
 * AI Provider Service with Unified Model Registry
 * 
 * Features:
 * - Unified model registry ranked by capability/speed
 * - REST API clients for Cerebras, Gemini, and Groq
 * - Rate limit tracking per model with exponential backoff
 * - Intelligent model selection with automatic fallback
 * 
 * Priority Order:
 * 1. Cerebras Qwen 3 Coder 480B (best coding capability)
 * 2. Gemini 2.5 Pro (best general capability)
 * 3. Other models ranked by capability/speed
 */

const axios = require('axios');

class AIProviderService {
    constructor() {
        this.modelRegistry = this.initializeModelRegistry();
        this.rateLimits = new Map();
        this.backoffState = new Map();
        
        this.MIN_BACKOFF_MS = 1000;
        this.MAX_BACKOFF_MS = 300000;
        this.BACKOFF_MULTIPLIER = 2;
    }

    /**
     * Initialize unified model registry ranked by capability/speed
     * 
     * Ranking criteria:
     * - Coding capability (for code-focused models)
     * - General capability (reasoning, context understanding)
     * - Speed/latency
     * - Reliability
     */
    initializeModelRegistry() {
        return [
            {
                rank: 1,
                name: 'qwen-coder-32b-preview',
                displayName: 'Cerebras Qwen 3 Coder 32B',
                provider: 'cerebras',
                category: 'coding-premium',
                rpm: 30,
                rpd: 14400,
                capabilities: ['coding', 'completion', 'refactoring'],
                avgLatencyMs: 500,
                enabled: () => !!process.env.CEREBRAS_API_KEY,
            },
            {
                rank: 2,
                name: 'gemini-2.0-flash-exp',
                displayName: 'Gemini 2.0 Flash (Experimental)',
                provider: 'gemini',
                category: 'general-premium',
                rpm: 15,
                rpd: 1500,
                capabilities: ['reasoning', 'context', 'completion'],
                avgLatencyMs: 800,
                enabled: () => !!process.env.GEMINI_API_KEY,
            },
            {
                rank: 3,
                name: 'llama-3.3-70b-versatile',
                displayName: 'Groq Llama 3.3 70B',
                provider: 'groq',
                category: 'general-fast',
                rpm: 30,
                rpd: 14400,
                capabilities: ['reasoning', 'completion', 'conversation'],
                avgLatencyMs: 400,
                enabled: () => !!process.env.GROQ_API_KEY,
            },
            {
                rank: 4,
                name: 'llama-3.3-70b',
                displayName: 'Cerebras Llama 3.3 70B',
                provider: 'cerebras',
                category: 'general-fast',
                rpm: 30,
                rpd: 14400,
                capabilities: ['reasoning', 'completion'],
                avgLatencyMs: 500,
                enabled: () => !!process.env.CEREBRAS_API_KEY,
            },
            {
                rank: 5,
                name: 'gemini-2.5-flash-preview-04-17',
                displayName: 'Gemini 2.5 Flash',
                provider: 'gemini',
                category: 'balanced',
                rpm: 10,
                rpd: 1000,
                capabilities: ['completion', 'context'],
                avgLatencyMs: 1000,
                enabled: () => !!process.env.GEMINI_API_KEY,
            },
            {
                rank: 6,
                name: 'mixtral-8x7b-32768',
                displayName: 'Groq Mixtral 8x7B',
                provider: 'groq',
                category: 'balanced',
                rpm: 30,
                rpd: 14400,
                capabilities: ['reasoning', 'completion'],
                avgLatencyMs: 350,
                enabled: () => !!process.env.GROQ_API_KEY,
            },
            {
                rank: 7,
                name: 'llama3.1-8b',
                displayName: 'Cerebras Llama 3.1 8B',
                provider: 'cerebras',
                category: 'fast',
                rpm: 30,
                rpd: 14400,
                capabilities: ['completion', 'conversation'],
                avgLatencyMs: 300,
                enabled: () => !!process.env.CEREBRAS_API_KEY,
            },
            {
                rank: 8,
                name: 'llama-3.1-8b-instant',
                displayName: 'Groq Llama 3.1 8B',
                provider: 'groq',
                category: 'fast',
                rpm: 30,
                rpd: 14400,
                capabilities: ['completion', 'conversation'],
                avgLatencyMs: 250,
                enabled: () => !!process.env.GROQ_API_KEY,
            },
            {
                rank: 9,
                name: 'gemini-1.5-flash',
                displayName: 'Gemini 1.5 Flash',
                provider: 'gemini',
                category: 'fast',
                rpm: 15,
                rpd: 1500,
                capabilities: ['completion'],
                avgLatencyMs: 900,
                enabled: () => !!process.env.GEMINI_API_KEY,
            },
            {
                rank: 10,
                name: 'gemini-2.0-flash-lite',
                displayName: 'Gemini 2.0 Flash Lite',
                provider: 'gemini',
                category: 'ultra-fast',
                rpm: 15,
                rpd: 1500,
                capabilities: ['completion'],
                avgLatencyMs: 600,
                enabled: () => !!process.env.GEMINI_API_KEY,
            },
        ];
    }

    /**
     * Provider configurations for REST API clients
     */
    getProviderConfig(provider) {
        const configs = {
            cerebras: {
                baseUrl: 'https://api.cerebras.ai/v1',
                apiKey: () => process.env.CEREBRAS_API_KEY,
                format: 'openai',
            },
            gemini: {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey: () => process.env.GEMINI_API_KEY,
                format: 'google',
            },
            groq: {
                baseUrl: 'https://api.groq.com/openai/v1',
                apiKey: () => process.env.GROQ_API_KEY,
                format: 'openai',
            },
        };
        return configs[provider];
    }

    /**
     * Get available models (those with API keys configured)
     */
    getAvailableModels() {
        return this.modelRegistry.filter(model => model.enabled());
    }

    /**
     * Get models by category
     */
    getModelsByCategory(category) {
        return this.getAvailableModels().filter(model => model.category === category);
    }

    /**
     * Get rate limit info for a model
     */
    getRateLimitInfo(modelName) {
        const now = Date.now();
        
        if (!this.rateLimits.has(modelName)) {
            this.rateLimits.set(modelName, {
                requestsThisMinute: [],
                requestsToday: [],
            });
        }

        const limits = this.rateLimits.get(modelName);
        
        // Clean up old timestamps
        const oneMinuteAgo = now - 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        
        limits.requestsThisMinute = limits.requestsThisMinute.filter(t => t > oneMinuteAgo);
        limits.requestsToday = limits.requestsToday.filter(t => t > oneDayAgo);

        const model = this.modelRegistry.find(m => m.name === modelName);

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
    recordRequest(modelName) {
        const now = Date.now();

        if (!this.rateLimits.has(modelName)) {
            this.rateLimits.set(modelName, {
                requestsThisMinute: [],
                requestsToday: [],
            });
        }

        const limits = this.rateLimits.get(modelName);
        limits.requestsThisMinute.push(now);
        limits.requestsToday.push(now);
    }

    /**
     * Get backoff state for a model
     */
    getBackoffState(modelName) {
        if (!this.backoffState.has(modelName)) {
            this.backoffState.set(modelName, {
                failureCount: 0,
                backoffUntil: 0,
                currentBackoffMs: this.MIN_BACKOFF_MS,
            });
        }
        return this.backoffState.get(modelName);
    }

    /**
     * Check if a model is in backoff period
     */
    isInBackoff(modelName) {
        const state = this.getBackoffState(modelName);
        return Date.now() < state.backoffUntil;
    }

    /**
     * Record a failure and apply exponential backoff
     */
    recordFailure(modelName) {
        const state = this.getBackoffState(modelName);
        state.failureCount++;
        state.currentBackoffMs = Math.min(
            state.currentBackoffMs * this.BACKOFF_MULTIPLIER,
            this.MAX_BACKOFF_MS
        );
        state.backoffUntil = Date.now() + state.currentBackoffMs;
        
        console.log(`[Backoff] ${modelName}: ${state.failureCount} failures, backing off for ${state.currentBackoffMs}ms`);
    }

    /**
     * Reset backoff state on success
     */
    resetBackoff(modelName) {
        const state = this.getBackoffState(modelName);
        if (state.failureCount > 0) {
            console.log(`[Backoff] ${modelName}: Success, resetting backoff state`);
        }
        state.failureCount = 0;
        state.backoffUntil = 0;
        state.currentBackoffMs = this.MIN_BACKOFF_MS;
    }

    /**
     * Generate content using Cerebras API (OpenAI-compatible)
     */
    async generateWithCerebras(modelName, prompt) {
        const config = this.getProviderConfig('cerebras');
        const apiKey = config.apiKey();
        
        if (!apiKey) {
            throw new Error('Cerebras API key not configured');
        }

        const url = `${config.baseUrl}/chat/completions`;
        
        const response = await axios.post(url, {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from Cerebras API');
        }

        return response.data.choices[0].message.content;
    }

    /**
     * Generate content using Gemini API
     */
    async generateWithGemini(modelName, prompt, userApiKey = null) {
        const config = this.getProviderConfig('gemini');
        const apiKey = userApiKey || config.apiKey();
        
        if (!apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const url = `${config.baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
            },
        }, {
            timeout: 30000,
        });

        if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response from Gemini API');
        }

        return response.data.candidates[0].content.parts[0].text;
    }

    /**
     * Generate content using Groq API (OpenAI-compatible)
     */
    async generateWithGroq(modelName, prompt) {
        const config = this.getProviderConfig('groq');
        const apiKey = config.apiKey();
        
        if (!apiKey) {
            throw new Error('Groq API key not configured');
        }

        const url = `${config.baseUrl}/chat/completions`;
        
        const response = await axios.post(url, {
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
        }, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        if (!response.data?.choices?.[0]?.message?.content) {
            throw new Error('Invalid response from Groq API');
        }

        return response.data.choices[0].message.content;
    }

    /**
     * Generate content with a specific model
     */
    async generateWithModel(modelName, prompt, userApiKey = null) {
        const model = this.modelRegistry.find(m => m.name === modelName);
        
        if (!model) {
            throw new Error(`Model not found: ${modelName}`);
        }

        if (!model.enabled()) {
            throw new Error(`Provider not configured for model: ${modelName}`);
        }

        // Check backoff
        if (this.isInBackoff(modelName)) {
            const state = this.getBackoffState(modelName);
            const remainingMs = state.backoffUntil - Date.now();
            throw new Error(`Model in backoff: ${modelName} (${Math.ceil(remainingMs / 1000)}s remaining)`);
        }

        // Check rate limits
        const rateLimitInfo = this.getRateLimitInfo(modelName);
        if (rateLimitInfo && !rateLimitInfo.canMakeRequest) {
            throw new Error(`Rate limit exceeded: ${modelName}`);
        }

        // Record the request
        this.recordRequest(modelName);

        try {
            let result;
            switch (model.provider) {
                case 'cerebras':
                    result = await this.generateWithCerebras(modelName, prompt);
                    break;
                case 'gemini':
                    result = await this.generateWithGemini(modelName, prompt, userApiKey);
                    break;
                case 'groq':
                    result = await this.generateWithGroq(modelName, prompt);
                    break;
                default:
                    throw new Error(`Unknown provider: ${model.provider}`);
            }
            
            // Reset backoff on success
            this.resetBackoff(modelName);
            return result;
        } catch (error) {
            // Record failure and apply backoff
            this.recordFailure(modelName);
            throw error;
        }
    }

    /**
     * Intelligent model selection with automatic fallback
     * 
     * Selection logic:
     * 1. Filter by category if specified
     * 2. Skip models in backoff or at rate limit
     * 3. Try models in rank order
     * 4. Fallback to next available model on error
     */
    async generate(prompt, options = {}) {
        const {
            category = null,
            userApiKey = null,
            modelName = null,
            maxRetries = null,
        } = options;

        // If specific model is requested, use it
        if (modelName) {
            try {
                return await this.generateWithModel(modelName, prompt, userApiKey);
            } catch (error) {
                console.error(`[Generate] Failed with ${modelName}:`, error.message);
                throw error;
            }
        }

        // Get available models, optionally filtered by category
        let availableModels = this.getAvailableModels();
        
        if (category) {
            availableModels = availableModels.filter(m => m.category === category);
        }

        if (availableModels.length === 0) {
            throw new Error('No AI models available');
        }

        // Filter out models in backoff or at rate limit
        const eligibleModels = availableModels.filter(model => {
            if (this.isInBackoff(model.name)) {
                return false;
            }
            const rateLimitInfo = this.getRateLimitInfo(model.name);
            return !rateLimitInfo || rateLimitInfo.canMakeRequest;
        });

        if (eligibleModels.length === 0) {
            throw new Error('All models are rate limited or in backoff');
        }

        // Try models in rank order
        const errors = [];
        const modelsToTry = maxRetries 
            ? eligibleModels.slice(0, maxRetries)
            : eligibleModels;

        for (const model of modelsToTry) {
            try {
                console.log(`[Generate] Trying ${model.displayName} (rank ${model.rank})`);
                const result = await this.generateWithModel(model.name, prompt, userApiKey);
                console.log(`[Generate] Success with ${model.displayName}`);
                return {
                    text: result,
                    model: {
                        name: model.name,
                        displayName: model.displayName,
                        provider: model.provider,
                        rank: model.rank,
                    },
                };
            } catch (error) {
                console.error(`[Generate] Failed with ${model.displayName}:`, error.message);
                errors.push({
                    model: model.name,
                    displayName: model.displayName,
                    error: error.message,
                });
            }
        }

        // All models failed
        const errorDetails = errors.map(e => `${e.displayName}: ${e.error}`).join('; ');
        throw new Error(`All models failed: ${errorDetails}`);
    }

    /**
     * Get service health status
     */
    getHealthStatus() {
        const allModels = this.modelRegistry;
        const availableModels = this.getAvailableModels();
        
        const modelStatuses = availableModels.map(model => {
            const rateLimitInfo = this.getRateLimitInfo(model.name);
            const backoffState = this.getBackoffState(model.name);
            const inBackoff = this.isInBackoff(model.name);
            
            return {
                rank: model.rank,
                name: model.name,
                displayName: model.displayName,
                provider: model.provider,
                category: model.category,
                capabilities: model.capabilities,
                avgLatencyMs: model.avgLatencyMs,
                canMakeRequest: !inBackoff && (rateLimitInfo?.canMakeRequest ?? true),
                rateLimits: {
                    requestsThisMinute: rateLimitInfo?.requestsThisMinute ?? 0,
                    requestsToday: rateLimitInfo?.requestsToday ?? 0,
                    rpm: model.rpm,
                    rpd: model.rpd,
                },
                backoff: {
                    inBackoff,
                    failureCount: backoffState.failureCount,
                    backoffUntil: inBackoff ? new Date(backoffState.backoffUntil).toISOString() : null,
                    currentBackoffMs: backoffState.currentBackoffMs,
                },
            };
        });

        return {
            totalModels: allModels.length,
            availableModels: availableModels.length,
            healthyModels: modelStatuses.filter(m => m.canMakeRequest).length,
            models: modelStatuses,
        };
    }

    /**
     * Get model registry information
     */
    getModelRegistry() {
        const availableModels = this.getAvailableModels();
        
        return availableModels.map(model => ({
            rank: model.rank,
            name: model.name,
            displayName: model.displayName,
            provider: model.provider,
            category: model.category,
            capabilities: model.capabilities,
            avgLatencyMs: model.avgLatencyMs,
            rateLimits: {
                rpm: model.rpm,
                rpd: model.rpd,
            },
        }));
    }
}

// Export singleton instance
module.exports = new AIProviderService();

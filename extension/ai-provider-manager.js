/**
 * AI Provider Service Manager
 *
 * Manages multiple AI provider services with:
 * - Client-side REST API calls directly to provider endpoints
 * - Comprehensive model registry sorted by speed/capability
 * - Rate limiting and error recovery with exponential backoff
 * - Support for Gemini, Cerebras, and Groq
 * - Intelligent model rotation with automatic fallback
 */

class AIProviderManager {
    constructor() {
        // Models sorted by SPEED (fastest first across all providers)
        // Order: Groq (fastest) → Cerebras → Gemini
        this.models = [
            // ========== GROQ (Fastest) ==========
            {
                provider: "groq",
                id: "groq/compound",
                name: "Groq Compound",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 70000,
                requestsPerDay: 250,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "groq/compound-mini",
                name: "Groq Compound Mini",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 70000,
                requestsPerDay: 250,
                requestsPerMinute: 30,
                modelSize: "large",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "llama-3.3-70b-versatile",
                name: "Llama 3.3 70B (Groq)",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 12000,
                requestsPerDay: 1000,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "llama-3.1-8b-instant",
                name: "Llama 3.1 8B (Groq)",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 6000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "medium",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "llama-3.1-70b-versatile",
                name: "Llama 3.1 70B (Groq)",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 6000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "llama-4-scout-instruct",
                name: "Llama 4 Scout (Groq)",
                speed: "very-fast",
                contextSize: 8192,
                tokensPerMinute: 30000,
                requestsPerDay: 1000,
                requestsPerMinute: 30,
                modelSize: "medium",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },
            {
                provider: "groq",
                id: "mixtral-8x7b-32768",
                name: "Mixtral 8x7B (Groq)",
                speed: "very-fast",
                contextSize: 32768,
                tokensPerMinute: 6000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.groq.com/openai/v1/chat/completions",
            },

            // ========== CEREBRAS (Fast) ==========
            {
                provider: "cerebras",
                id: "qwen3-coder-480b",
                name: "Qwen 3 Coder 480B (Cerebras)",
                speed: "fast",
                contextSize: 65536,
                tokensPerMinute: 150000,
                requestsPerDay: 100,
                requestsPerMinute: 10,
                modelSize: "xxxlarge",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },
            {
                provider: "cerebras",
                id: "qwen3-235b-instruct",
                name: "Qwen 3 235B Instruct (Cerebras)",
                speed: "fast",
                contextSize: 65536,
                tokensPerMinute: 60000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "xxxlarge",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },
            {
                provider: "cerebras",
                id: "llama-3.3-70b",
                name: "Llama 3.3 70B (Cerebras)",
                speed: "fast",
                contextSize: 8192,
                tokensPerMinute: 64000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },
            {
                provider: "cerebras",
                id: "qwen3-32b",
                name: "Qwen 3 32B (Cerebras)",
                speed: "fast",
                contextSize: 32768,
                tokensPerMinute: 64000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "large",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },
            {
                provider: "cerebras",
                id: "llama-3.1-8b",
                name: "Llama 3.1 8B (Cerebras)",
                speed: "fast",
                contextSize: 8192,
                tokensPerMinute: 60000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "medium",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },
            {
                provider: "cerebras",
                id: "gpt-oss-120b",
                name: "GPT OSS 120B (Cerebras)",
                speed: "fast",
                contextSize: 8192,
                tokensPerMinute: 60000,
                requestsPerDay: 14400,
                requestsPerMinute: 30,
                modelSize: "xlarge",
                endpoint: "https://api.cerebras.ai/v1/chat/completions",
            },

            // ========== GEMINI (Moderate-Fast) ==========
            {
                provider: "gemini",
                id: "gemini-2.5-pro",
                name: "Gemini 2.5 Pro",
                speed: "moderate-fast",
                contextSize: 1000000,
                tokensPerMinute: 125000,
                requestsPerDay: 50,
                requestsPerMinute: 2,
                modelSize: "xlarge",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-2.0-flash",
                name: "Gemini 2.0 Flash",
                speed: "moderate-fast",
                contextSize: 1000000,
                tokensPerMinute: 1000000,
                requestsPerDay: 200,
                requestsPerMinute: 15,
                modelSize: "large",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-2.5-flash",
                name: "Gemini 2.5 Flash",
                speed: "moderate-fast",
                contextSize: 1000000,
                tokensPerMinute: 250000,
                requestsPerDay: 250,
                requestsPerMinute: 10,
                modelSize: "large",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-2.5-flash-lite",
                name: "Gemini 2.5 Flash Lite",
                speed: "moderate-fast",
                contextSize: 100000,
                tokensPerMinute: 250000,
                requestsPerDay: 1000,
                requestsPerMinute: 15,
                modelSize: "medium",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-2.0-flash-lite",
                name: "Gemini 2.0 Flash Lite",
                speed: "moderate-fast",
                contextSize: 100000,
                tokensPerMinute: 1000000,
                requestsPerDay: 200,
                requestsPerMinute: 30,
                modelSize: "medium",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-1.5-pro",
                name: "Gemini 1.5 Pro",
                speed: "moderate-fast",
                contextSize: 1000000,
                tokensPerMinute: 2000000,
                requestsPerDay: 50,
                requestsPerMinute: 2,
                modelSize: "xlarge",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
            },
            {
                provider: "gemini",
                id: "gemini-1.5-flash",
                name: "Gemini 1.5 Flash",
                speed: "moderate-fast",
                contextSize: 1000000,
                tokensPerMinute: 1000000,
                requestsPerDay: 1000,
                requestsPerMinute: 15,
                modelSize: "large",
                endpoint:
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
            },
        ];

        // Initialize rate limit tracking
        this.rateLimitTracking = {};
        this.models.forEach((model) => {
            this.rateLimitTracking[model.id] = {
                tokensUsedToday: 0,
                requestsToday: 0,
                tokensUsedThisMinute: 0,
                requestsThisMinute: 0,
                lastMinuteReset: Date.now(),
                lastDayReset: Date.now(),
                consecutiveFailures: 0,
                lastFailureTime: null,
            };
        });

        this.currentModelIndex = 0;
        this.maxFailuresBeforeRotation = 2;
        this.failureCooldownMs = 30000;
        this.requestTimeout = 8000;
        this.apiKeys = {
            gemini: null,
            cerebras: null,
            groq: null,
        };
        this.legacyApiKey = null;
    }

    /**
     * Load API keys from chrome storage
     */
    async loadConfiguration() {
        return new Promise((resolve) => {
            // First try to load from new "config" structure (from options.js)
            chrome.storage.local.get(
                ["config", "apiKeys", "apiKey"],
                (result) => {
                    if (result.config && result.config.apiKeys) {
                        // New structure from options.js
                        this.apiKeys = {
                            gemini: result.config.apiKeys.gemini || null,
                            cerebras: result.config.apiKeys.cerebras || null,
                            groq: result.config.apiKeys.groq || null,
                        };
                        if (result.config.debugMode) {
                            console.log(
                                "[FlowWrite] Loaded API keys from config object:",
                                {
                                    gemini: !!this.apiKeys.gemini,
                                    cerebras: !!this.apiKeys.cerebras,
                                    groq: !!this.apiKeys.groq,
                                }
                            );
                        }
                    } else if (result.apiKeys) {
                        // Direct apiKeys structure (legacy)
                        this.apiKeys = {
                            gemini: result.apiKeys.gemini || null,
                            cerebras: result.apiKeys.cerebras || null,
                            groq: result.apiKeys.groq || null,
                        };
                    } else if (result.apiKey) {
                        // Backward compatibility with legacy single API key (assume Gemini)
                        this.legacyApiKey = result.apiKey;
                        this.apiKeys.gemini = result.apiKey;
                    }
                    resolve();
                }
            );
        });
    }

    /**
     * Get the current model object
     */
    getCurrentModel() {
        return this.models[this.currentModelIndex];
    }

    /**
     * Find the next available model with API key configured
     */
    getNextAvailableModel() {
        const startIndex = this.currentModelIndex;
        let index = (startIndex + 1) % this.models.length;

        while (index !== startIndex) {
            const model = this.models[index];
            if (this.apiKeys[model.provider]) {
                return model;
            }
            index = (index + 1) % this.models.length;
        }

        return null;
    }

    /**
     * Check if API key is available for a model
     */
    hasApiKey(model) {
        return !!this.apiKeys[model.provider];
    }

    /**
     * Check if model is available and not rate limited
     */
    isModelAvailable(model) {
        if (!this.hasApiKey(model)) {
            return false;
        }

        const tracking = this.rateLimitTracking[model.id];
        if (!tracking) {
            return false;
        }

        // Check if in cooldown after failure
        if (tracking.consecutiveFailures > 0 && tracking.lastFailureTime) {
            const timeSinceFailure = Date.now() - tracking.lastFailureTime;
            if (timeSinceFailure < this.failureCooldownMs) {
                return false;
            }
        }

        // Check daily limits
        if (tracking.requestsToday >= model.requestsPerDay) {
            return false;
        }

        // Check minute limits
        this.resetMinuteCountersIfNeeded(model);
        if (tracking.requestsThisMinute >= model.requestsPerMinute) {
            return false;
        }

        return true;
    }

    /**
     * Reset minute counters if a minute has passed
     */
    resetMinuteCountersIfNeeded(model) {
        const tracking = this.rateLimitTracking[model.id];
        const now = Date.now();
        const timeSinceLastReset = now - tracking.lastMinuteReset;

        if (timeSinceLastReset >= 60000) {
            tracking.tokensUsedThisMinute = 0;
            tracking.requestsThisMinute = 0;
            tracking.lastMinuteReset = now;
        }
    }

    /**
     * Select the best available model
     */
    selectBestModel() {
        // Find first available model in speed-sorted order
        for (let i = 0; i < this.models.length; i++) {
            if (this.isModelAvailable(this.models[i])) {
                this.currentModelIndex = i;
                return this.models[i];
            }
        }

        return null;
    }

    /**
     * Record successful API call
     */
    recordSuccess(model, tokensUsed = 0) {
        const tracking = this.rateLimitTracking[model.id];
        tracking.tokensUsedToday += tokensUsed;
        tracking.requestsToday += 1;
        tracking.tokensUsedThisMinute += tokensUsed;
        tracking.requestsThisMinute += 1;
        tracking.consecutiveFailures = 0;
        tracking.lastFailureTime = null;
    }

    /**
     * Record failed API call
     */
    recordFailure(model) {
        const tracking = this.rateLimitTracking[model.id];
        tracking.consecutiveFailures += 1;
        tracking.lastFailureTime = Date.now();
    }

    /**
     * Get rate limit status for current model
     */
    getRateLimitStatus(model) {
        const tracking = this.rateLimitTracking[model.id];
        return {
            tokensUsedToday: tracking.tokensUsedToday,
            tokensPerDay: model.tokensPerMinute * 1440,
            requestsUsedToday: tracking.requestsToday,
            requestsPerDay: model.requestsPerDay,
            requestsUsedThisMinute: tracking.requestsThisMinute,
            requestsPerMinute: model.requestsPerMinute,
        };
    }

    /**
     * Build system prompt for suggestion generation
     */
    buildSystemPrompt(pageContext = null) {
        let prompt = `**Role:** You are an AI inline writing assistant, like GitHub Copilot for general text.
**Goal:** Predict the most likely and helpful text continuation based on the user's input. The suggestion should be contextually relevant and natural-sounding.
**Context:** This suggestion will appear inline in real-time as the user types in any web text field (email, chat, form, etc.). The user accepts it by pressing the **Tab** key or by clicking directly on the suggestion.
**Output Requirements:**
*   Return *only* the raw predicted text continuation after the user's cursor.
*   Do *not* include any preamble, labels, explanations, or markdown formatting.
*   Include a leading space *if and only if* it is grammatically appropriate to follow the provided input text.
*   Avoid suggestions that are too generic or unrelated to the context.
*   IMPORTANT: only send the suggestion if you are more confident than 80% that it is correct. If you are not confident, return an empty string.
*   Avoid excessive repetition of the same word or phrase.`;

        if (pageContext) {
            prompt += `\n\n**Page Context:**
* Page Title: "${pageContext.pageTitle || ""}"
* Page URL: "${pageContext.pageUrl || ""}"
* Input Field Context: "${pageContext.inputFieldContext || ""}"`;
        }

        return prompt;
    }

    /**
     * Generate suggestion using best available model with fallback
     */
    async generateSuggestion(context, pageContext = null, abortSignal = null) {
        await this.loadConfiguration();

        const maxAttempts = 5;
        let attempt = 0;

        while (attempt < maxAttempts) {
            const model = this.selectBestModel();

            if (!model) {
                throw new Error(
                    "No available AI providers. Please configure at least one API key (Gemini, Cerebras, or Groq)."
                );
            }

            try {
                console.log(
                    `[AIProviderManager] Attempt ${attempt + 1}: Using ${
                        model.name
                    } (${model.provider})`
                );

                let suggestion;
                if (model.provider === "gemini") {
                    suggestion = await this.generateGeminiSuggestion(
                        model,
                        context,
                        pageContext,
                        abortSignal
                    );
                } else if (model.provider === "cerebras") {
                    suggestion = await this.generateCerebrasSuggestion(
                        model,
                        context,
                        pageContext,
                        abortSignal
                    );
                } else if (model.provider === "groq") {
                    suggestion = await this.generateGroqSuggestion(
                        model,
                        context,
                        pageContext,
                        abortSignal
                    );
                }

                this.recordSuccess(model, 0);
                return suggestion;
            } catch (error) {
                console.error(
                    `[AIProviderManager] Error with ${model.name}:`,
                    error
                );
                this.recordFailure(model);
                attempt++;

                if (attempt < maxAttempts) {
                    // Small delay before trying next model
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }
        }

        throw new Error(
            "Failed to generate suggestion after trying all available models"
        );
    }

    /**
     * Generate suggestion using Gemini API
     */
    async generateGeminiSuggestion(model, context, pageContext, abortSignal) {
        const apiKey = this.apiKeys.gemini;
        if (!apiKey) {
            throw new Error("Gemini API key not configured");
        }

        const systemPrompt = this.buildSystemPrompt(pageContext);
        const url = `${model.endpoint}?key=${encodeURIComponent(apiKey)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.requestTimeout
        );
        const signal = abortSignal || controller.signal;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `${systemPrompt}\n\n**User Input:**\n"${context}"`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: 100,
                        temperature: 0.7,
                    },
                }),
                signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Gemini API error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            const suggestion =
                data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return suggestion.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Generate suggestion using Cerebras API
     */
    async generateCerebrasSuggestion(model, context, pageContext, abortSignal) {
        const apiKey = this.apiKeys.cerebras;
        if (!apiKey) {
            throw new Error("Cerebras API key not configured");
        }

        const systemPrompt = this.buildSystemPrompt(pageContext);
        const { endpoint } = model;

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.requestTimeout
        );
        const signal = abortSignal || controller.signal;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model.id,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt,
                        },
                        {
                            role: "user",
                            content: `User Input: "${context}"`,
                        },
                    ],
                    max_tokens: 100,
                    temperature: 0.7,
                }),
                signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Cerebras API error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            const suggestion = data?.choices?.[0]?.message?.content || "";
            return suggestion.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Generate suggestion using Groq API
     */
    async generateGroqSuggestion(model, context, pageContext, abortSignal) {
        const apiKey = this.apiKeys.groq;
        if (!apiKey) {
            throw new Error("Groq API key not configured");
        }

        const systemPrompt = this.buildSystemPrompt(pageContext);
        const { endpoint } = model;

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            this.requestTimeout
        );
        const signal = abortSignal || controller.signal;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model.id,
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt,
                        },
                        {
                            role: "user",
                            content: `User Input: "${context}"`,
                        },
                    ],
                    max_tokens: 100,
                    temperature: 0.7,
                }),
                signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Groq API error: ${response.status} ${errorText}`
                );
            }

            const data = await response.json();
            const suggestion = data?.choices?.[0]?.message?.content || "";
            return suggestion.trim();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Get all models for display/selection
     */
    getAllModels() {
        return this.models.map((model, index) => ({
            ...model,
            isAvailable: this.isModelAvailable(model),
            hasApiKey: this.hasApiKey(model),
        }));
    }

    /**
     * Get models by provider
     */
    getModelsByProvider(provider) {
        return this.models
            .filter((model) => model.provider === provider)
            .map((model) => ({
                ...model,
                isAvailable: this.isModelAvailable(model),
                hasApiKey: this.hasApiKey(model),
            }));
    }
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = AIProviderManager;
}

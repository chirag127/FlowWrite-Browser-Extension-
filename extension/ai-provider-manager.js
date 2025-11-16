/**
 * AI Provider Service Manager
 *
 * Manages multiple AI provider services with:
 * - Client-side API calls directly to provider endpoints
 * - Model rotation for fallback handling
 * - Rate limiting and error recovery
 * - Support for multiple providers (Gemini, OpenAI, etc.)
 */

class AIProviderManager {
    constructor() {
        this.providers = {
            gemini: {
                name: 'Google Gemini',
                models: [
                    'gemini-2.0-flash-exp',
                    'gemini-2.0-flash-thinking-exp-1219',
                    'gemini-exp-1206'
                ],
                currentModelIndex: 0,
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
                failureCount: 0,
                lastFailureTime: null,
                enabled: true
            }
        };

        this.currentProvider = 'gemini';
        this.maxFailuresBeforeRotation = 2;
        this.failureCooldownMs = 60000;
        this.requestTimeout = 10000;
    }

    getCurrentModel() {
        const provider = this.providers[this.currentProvider];
        return provider.models[provider.currentModelIndex];
    }

    getNextModel() {
        const provider = this.providers[this.currentProvider];
        provider.currentModelIndex = (provider.currentModelIndex + 1) % provider.models.length;
        provider.failureCount = 0;
        return provider.models[provider.currentModelIndex];
    }

    shouldRotateModel() {
        const provider = this.providers[this.currentProvider];
        return provider.failureCount >= this.maxFailuresBeforeRotation;
    }

    recordFailure() {
        const provider = this.providers[this.currentProvider];
        provider.failureCount++;
        provider.lastFailureTime = Date.now();

        if (this.shouldRotateModel()) {
            const oldModel = this.getCurrentModel();
            const newModel = this.getNextModel();
            console.log(`[AIProviderManager] Rotating from ${oldModel} to ${newModel} due to failures`);
        }
    }

    recordSuccess() {
        const provider = this.providers[this.currentProvider];
        provider.failureCount = 0;
        provider.lastFailureTime = null;
    }

    buildSystemPrompt(pageContext) {
        let prompt = `**Role:** You are an AI inline writing assistant, like GitHub Copilot for general text.
**Goal:** Predict the most likely and helpful text continuation based on the user's input. The suggestion should be contextually relevant, and natural-sounding.
**Context:** This suggestion will appear inline in real-time as the user types in any web text field (email, chat, form, etc.). The user accepts it by pressing the **Tab** key or by clicking directly on the suggestion.
**Output Requirements:**
*   Return *only* the raw predicted text continuation after the user's cursor.
*   Do *not* include any preamble, labels, explanations, or markdown formatting.
*   Include a leading space *if and only if* it is grammatically appropriate to follow the provided input text (e.g., if the input doesn't end in a space).
*   Avoid suggestions that are too generic or unrelated to the context.
*   IMPORTANT: only send the suggestion if you are more confident than 80% that it is correct. If you are not confident, return an empty string.
*   Avoid excessive repetition of the same word or phrase.`;

        if (pageContext) {
            prompt += `\n\n**Page Context:**
* Page Title: "${pageContext.pageTitle || ""}"
* Page URL: "${pageContext.pageUrl || ""}"
* Meta Description: "${pageContext.pageMeta || ""}"
* Input Field Context: "${pageContext.inputFieldContext || ""}"
* Relevant Sections: ${JSON.stringify(pageContext.relevantSections || [])}
* Page Content: "${pageContext.pageContent || ""}"`;
        }

        return prompt;
    }

    async generateSuggestion(context, apiKey, pageContext = null, abortSignal = null) {
        const provider = this.providers[this.currentProvider];

        if (!provider) {
            throw new Error(`Provider ${this.currentProvider} not found`);
        }

        if (!provider.enabled) {
            throw new Error(`Provider ${this.currentProvider} is disabled`);
        }

        const model = this.getCurrentModel();
        const systemPrompt = this.buildSystemPrompt(pageContext);
        const userPrompt = `**Text before caret:**\n"${context}"`;

        try {
            const suggestion = await this.callGeminiAPI(
                model,
                systemPrompt,
                userPrompt,
                apiKey,
                abortSignal
            );

            this.recordSuccess();
            return { suggestion, model, provider: this.currentProvider };
        } catch (error) {
            console.error(`[AIProviderManager] Error with model ${model}:`, error);
            this.recordFailure();

            if (this.shouldRotateModel() && provider.models.length > 1) {
                const newModel = this.getCurrentModel();
                console.log(`[AIProviderManager] Retrying with model ${newModel}`);

                try {
                    const suggestion = await this.callGeminiAPI(
                        newModel,
                        systemPrompt,
                        userPrompt,
                        apiKey,
                        abortSignal
                    );

                    this.recordSuccess();
                    return { suggestion, model: newModel, provider: this.currentProvider };
                } catch (retryError) {
                    console.error(`[AIProviderManager] Retry failed with model ${newModel}:`, retryError);
                    this.recordFailure();
                    throw retryError;
                }
            }

            throw error;
        }
    }

    async callGeminiAPI(model, systemPrompt, userPrompt, apiKey, abortSignal) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: systemPrompt + '\n\n' + userPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 200,
                topP: 0.95,
                topK: 40
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE"
                }
            ]
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

        if (abortSignal) {
            abortSignal.addEventListener('abort', () => controller.abort());
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                return '';
            }

            const candidate = data.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                return '';
            }

            return candidate.content.parts[0].text || '';
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Request timeout or cancelled');
            }

            throw error;
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIProviderManager;
}

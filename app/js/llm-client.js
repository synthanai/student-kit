/* ═══════════════════════════════════════
   LLM Client — BYOK Multi-Provider AI Interface
   Priority: User Key → Proxy → Manual fallback
   Supports: OpenRouter, Gemini, OpenAI-compatible
   ═══════════════════════════════════════ */

const LLMClient = (() => {
    // Proxy endpoint (Cloudflare Worker)
    const PROXY_URL = 'https://arivar-proxy.synthanai.workers.dev/v1/chat/completions';

    // Provider configs
    const PROVIDERS = {
        openrouter: {
            name: 'OpenRouter',
            baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
            models: {
                primary: 'moonshotai/kimi-k2:free',
                fallback: 'meta-llama/llama-3.3-70b-instruct:free',
                reasoning: 'deepseek/deepseek-r1-0528:free'
            },
            authHeader: (key) => ({ 'Authorization': `Bearer ${key}` })
        },
        gemini: {
            name: 'Gemini',
            // Gemini uses a different API shape, we adapt
            baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models/',
            models: {
                primary: 'gemini-2.0-flash',
                fallback: 'gemini-2.0-flash-lite',
                reasoning: 'gemini-2.5-flash-preview-05-20'
            },
            authHeader: () => ({}) // key goes in URL param
        },
        openai: {
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1/chat/completions',
            models: {
                primary: 'gpt-4o-mini',
                fallback: 'gpt-4o-mini',
                reasoning: 'gpt-4o'
            },
            authHeader: (key) => ({ 'Authorization': `Bearer ${key}` })
        }
    };

    // State
    let mode = 'proxy';       // 'byok' | 'proxy' | 'manual'
    let byokProvider = null;  // 'openrouter' | 'gemini' | 'openai'
    let byokKey = null;

    function setMode(newMode) {
        mode = newMode;
    }

    function setBYOK(provider, key) {
        if (provider && key) {
            byokProvider = provider;
            byokKey = key;
            mode = 'byok';
        } else {
            byokProvider = null;
            byokKey = null;
            if (mode === 'byok') mode = 'proxy';
        }
    }

    function getMode() {
        return { mode, provider: byokProvider };
    }

    async function chat(messages, options = {}) {
        const { maxTokens = 2000, temperature = 0.7, useReasoning = false } = options;

        if (mode === 'manual') {
            return manualFallback(messages);
        }

        // BYOK takes priority
        if (mode === 'byok' && byokProvider && byokKey) {
            try {
                const providerConfig = PROVIDERS[byokProvider];
                const model = useReasoning
                    ? providerConfig.models.reasoning
                    : (options.model || providerConfig.models.primary);
                return await callProvider(byokProvider, byokKey, messages, model, maxTokens, temperature);
            } catch (err) {
                console.warn(`BYOK ${byokProvider} failed, falling back to proxy:`, err.message);
                // Fall through to proxy
            }
        }

        // Proxy mode (OpenRouter free tier via Cloudflare Worker)
        if (mode === 'proxy' || mode === 'byok') {
            try {
                const model = useReasoning
                    ? PROVIDERS.openrouter.models.reasoning
                    : (options.model || PROVIDERS.openrouter.models.primary);
                return await callProxy(messages, model, maxTokens, temperature);
            } catch (err) {
                console.warn('Proxy failed, trying fallback model:', err.message);
                try {
                    return await callProxy(messages, PROVIDERS.openrouter.models.fallback, maxTokens, temperature);
                } catch (err2) {
                    console.warn('All API calls failed, using manual mode:', err2.message);
                    return manualFallback(messages);
                }
            }
        }

        return manualFallback(messages);
    }

    async function callProxy(messages, model, maxTokens, temperature) {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature })
        });

        if (!response.ok) {
            throw new Error(`Proxy error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'Proxy error');
        return data.choices[0].message.content;
    }

    async function callProvider(providerId, key, messages, model, maxTokens, temperature) {
        if (providerId === 'gemini') {
            return callGemini(key, messages, model, maxTokens, temperature);
        }

        // OpenRouter / OpenAI (both use OpenAI-compatible API)
        const config = PROVIDERS[providerId];
        const response = await fetch(config.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...config.authHeader(key)
            },
            body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature })
        });

        if (!response.ok) {
            throw new Error(`${config.name} error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || `${config.name} error`);
        return data.choices[0].message.content;
    }

    async function callGemini(key, messages, model, maxTokens, temperature) {
        // Convert OpenAI messages format → Gemini format
        const systemInstruction = messages.find(m => m.role === 'system');
        const conversationMessages = messages.filter(m => m.role !== 'system');

        const contents = conversationMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        const body = {
            contents,
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature
            }
        };

        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
        }

        const url = `${PROVIDERS.gemini.baseUrl}${model}:generateContent?key=${key}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Gemini error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        if (data.error) throw new Error(data.error.message || 'Gemini error');

        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    // Manual fallback: no API calls
    function manualFallback(messages) {
        return Promise.resolve(
            'Thank you for sharing that. I\'ve captured your answer. Let me continue with the next question.'
        );
    }

    // Synthesize profile from conversation history
    async function synthesizeProfile(systemPrompt, conversationHistory) {
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            {
                role: 'user',
                content: 'Based on our entire conversation, produce my CORE Profile now as a JSON object. Follow the synthesis format exactly.'
            }
        ];

        const response = await chat(messages, {
            maxTokens: 3000,
            temperature: 0.3,
            useReasoning: true
        });

        // Extract JSON from response
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('Failed to parse synthesis JSON, returning raw:', e);
        }
        return { raw: response };
    }

    return { chat, synthesizeProfile, setMode, setBYOK, getMode };
})();

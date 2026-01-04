/**
 * Azure GPT-5.2 Provider for Volcano SDK
 * 
 * Configured for specific Azure OpenAI deployment:
 * Endpoint: https://aineu-marcus.cognitiveservices.azure.com/
 * Deployment: gpt-5.2-chat
 * API Version: 2024-12-01-preview
 */

import { llmOpenAI } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AzureGPT52Config {
    /** Path to api-keys.json file (default: ./api-keys.json) */
    apiKeysPath?: string;
    /** Override API key directly */
    apiKey?: string;
    /** Temperature for generation (default: 0.7) */
    temperature?: number;
    /** Max tokens for response */
    maxTokens?: number;
}

function loadApiKey(apiKeysPath: string): string {
    try {
        const content = readFileSync(apiKeysPath, 'utf-8');
        const keys = JSON.parse(content);
        if (keys.azure?.apiKey) return keys.azure.apiKey;
        throw new Error('Missing azure.apiKey in api-keys.json');
    } catch (error: any) {
        if (process.env.AZURE_OPENAI_API_KEY) return process.env.AZURE_OPENAI_API_KEY;
        if (error.code === 'ENOENT') {
            throw new Error(`API keys file not found at: ${apiKeysPath}`);
        }
        throw error;
    }
}

/**
 * Custom fetch wrapper that adds Azure-style API key header
 */
function createAzureFetch(apiKey: string) {
    return async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
        const headers = new Headers(init?.headers);
        headers.set('api-key', apiKey);
        headers.delete('Authorization'); // Remove OpenAI-style auth

        // DEBUG: Uncomment to see requests
        // console.log('DEBUG: Azure Request URL:', url.toString());

        return fetch(url, {
            ...init,
            headers,
        });
    };
}

export function createAzureGPT52Provider(cfg: AzureGPT52Config = {}): LLMHandle {
    const apiKeysPath = cfg.apiKeysPath || join(process.cwd(), 'api-keys.json');
    const apiKey = cfg.apiKey || loadApiKey(apiKeysPath);

    const resourceUrl = 'https://aineu-marcus.cognitiveservices.azure.com';
    const deployment = 'gpt-5.2-chat';
    const apiVersion = '2024-12-01-preview';

    // Exact URL pattern verified in debug script
    const baseURL = `${resourceUrl}/openai/deployments/${deployment}`;

    return llmOpenAI({
        apiKey,
        model: deployment,
        baseURL,
        options: {
            temperature: cfg.temperature ?? 0.7,
            // Pass api-version via defaultQuery (supported by OpenAI client)
            defaultQuery: { 'api-version': apiVersion },
            // Use custom fetch for headers
            fetch: createAzureFetch(apiKey),

            // PARAMETER FIX:
            // This model rejects 'max_tokens'. We disable it by passing undefined (if SDK allows),
            // and try to pass 'max_completion_tokens' via extra params if possible.
            // Note: Volcano might filter unknown options. If this fails, we need to specific method.
            // For now, mapping maxTokens to max_completion_tokens by type coercion.
            max_tokens: undefined,
            max_completion_tokens: cfg.maxTokens || 2048,
        } as any // Force cast to bypass strict SDK types if needed
    });
}

export default createAzureGPT52Provider;

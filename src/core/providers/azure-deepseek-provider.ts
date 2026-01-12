/**
 * Azure AI Provider for Volcano SDK (DeepSeek-V3.2)
 * 
 * Uses OpenAI-compatible format since Azure DeepSeek models use the
 * Chat Completions API format (messages/choices), not Azure AI Inference format.
 * 
 * Usage:
 *   import { createAzureProvider } from './providers/azure-deepseek-provider';
 *   const llm = createAzureProvider();
 *   const result = await agent({ llm }).then({ prompt: '...' }).run();
 */

import { llmOpenAI } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AzureDeepSeekConfig {
    /** Path to api-keys.json file (default: ./api-keys.json) */
    apiKeysPath?: string;
    /** Override API key directly (not recommended, use api-keys.json) */
    apiKey?: string;
    /** Temperature for generation (default: 0.7) */
    temperature?: number;
    /** Max tokens for response */
    maxTokens?: number;
    /** Enable debug logging of prompts and responses */
    debug?: boolean;
}

/**
 * Load API key from api-keys.json
 */
function loadApiKey(apiKeysPath: string): string {
    try {
        const content = readFileSync(apiKeysPath, 'utf-8');
        const keys = JSON.parse(content);

        if (!keys.azure?.apiKey) {
            throw new Error('Missing azure.apiKey in api-keys.json');
        }

        if (keys.azure.apiKey === 'YOUR_AZURE_API_KEY_HERE') {
            throw new Error(
                'Please update api-keys.json with your actual Azure API key.\n' +
                'The file is gitignored so it won\'t be committed.'
            );
        }

        return keys.azure.apiKey;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            throw new Error(
                `API keys file not found at: ${apiKeysPath}\n` +
                'Please create api-keys.json with your Azure API key.'
            );
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
        // Remove standard Authorization header if present (OpenAI style)
        headers.delete('Authorization');

        return fetch(url, {
            ...init,
            headers,
        });
    };
}

/**
 * Create an Azure AI provider for DeepSeek-V3.2
 * 
 * Uses llmOpenAI with custom baseURL since Azure DeepSeek uses
 * OpenAI-compatible Chat Completions API format.
 * 
 * @example
 * import { agent } from 'volcano-sdk';
 * import { createAzureProvider } from './providers/azure-deepseek-provider';
 * 
 * const llm = createAzureProvider();
 * 
 * const results = await agent({ llm })
 *   .then({ prompt: 'Analyze this code' })
 *   .run();
 */
export function createAzureProvider(cfg: AzureDeepSeekConfig = {}): LLMHandle {
    const apiKeysPath = cfg.apiKeysPath || join(process.cwd(), 'api-keys.json');
    const apiKey = cfg.apiKey || loadApiKey(apiKeysPath);

    // Azure OpenAI endpoint - use the /openai/v1 path as user specified
    // OpenAI SDK appends /chat/completions automatically
    const baseURL = 'https://aineu-marcus.services.ai.azure.com/openai/v1';

    // Use llmOpenAI with Azure endpoint (OpenAI-compatible format)
    const baseLlm = llmOpenAI({
        apiKey,
        model: 'DeepSeek-V3.2',
        baseURL,
        options: {
            temperature: cfg.temperature ?? 0.7,
            max_tokens: cfg.maxTokens,
        },
    });

    // If debug is enabled, wrap with logging
    if (cfg.debug) {
        let callCount = 0;
        const getTimestamp = () => new Date().toISOString();

        return {
            ...baseLlm,
            gen: async (prompt: string) => {
                callCount++;
                console.log('\n' + '='.repeat(80));
                const ts = getTimestamp();
                console.log(`[${ts}] [DeepSeek Call #${callCount}]`);
                console.log('='.repeat(80));
                console.log('PROMPT:');
                console.log(prompt);
                console.log('-'.repeat(80));

                const response = await baseLlm.gen(prompt);

                console.log('RESPONSE:');
                console.log(response);
                console.log('='.repeat(80) + '\n');

                return response;
            },
            genStream: baseLlm.genStream ? async function* (prompt: string) {
                callCount++;
                console.log('\n' + '='.repeat(80));
                const ts = getTimestamp();
                console.log(`[${ts}] [DeepSeek Stream #${callCount}]`);
                console.log('='.repeat(80));
                console.log('PROMPT:');
                console.log(prompt);
                console.log('-'.repeat(80));
                console.log('RESPONSE (streaming):');

                const tokens: string[] = [];
                for await (const token of baseLlm.genStream!(prompt)) {
                    tokens.push(token);
                    process.stdout.write(token);
                    yield token;
                }

                console.log('\n' + '='.repeat(80) + '\n');
            } : undefined
        };
    }

    return baseLlm;
}

export default createAzureProvider;

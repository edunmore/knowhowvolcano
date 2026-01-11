/**
 * Azure OpenAI GPT-5-nano Provider (FIXED)
 * 
 * Fast, cost-effective model for chunking/gating tasks.
 * Uses standard OpenAI client with baseURL for Azure.
 */

import OpenAI from 'openai';
import type { LLMHandle } from 'volcano-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface AzureGPT5Config {
    apiKeysPath?: string;
    apiKey?: string;
    maxTokens?: number;
}

function loadApiKey(apiKeysPath: string): string {
    const content = readFileSync(apiKeysPath, 'utf-8');
    const keys = JSON.parse(content);
    if (!keys.azure?.apiKey || keys.azure.apiKey === 'YOUR_AZURE_API_KEY_HERE') {
        throw new Error('Please update api-keys.json with your Azure API key');
    }
    return keys.azure.apiKey;
}

/**
 * Create Azure GPT-5-nano provider for fast, cheap tasks (chunking, gating)
 */
export function createAzureGPT5Nano(cfg: AzureGPT5Config = {}): LLMHandle {
    const apiKeysPath = cfg.apiKeysPath || join(process.cwd(), 'api-keys.json');
    const apiKey = cfg.apiKey || loadApiKey(apiKeysPath);

    const endpoint = "https://aineu-marcus.cognitiveservices.azure.com/openai/v1/";
    const modelName = "gpt-5-nano";

    const client = new OpenAI({
        baseURL: endpoint,
        apiKey
    });

    let lastUsage: any = null;

    const handle: LLMHandle = {
        id: 'GPT-5-nano',
        model: modelName,
        client,

        async gen(prompt: string): Promise<string> {
            try {
                const response = await client.chat.completions.create({
                    messages: [
                        { role: "developer", content: "You are a helpful assistant that outputs only valid JSON." },
                        { role: "user", content: prompt }
                    ],
                    model: modelName,
                });

                lastUsage = response.usage;

                const content = response.choices[0]?.message?.content || '';

                if (!content) {
                    console.error('[Azure GPT-5-nano] Empty response. Usage:', response.usage);
                    console.error('[Azure GPT-5-nano] Choices:', response.choices);
                }

                return content;
            } catch (error: any) {
                console.error('[Azure GPT-5-nano] API Error:', error.message);
                if (error.response) {
                    console.error('[Azure GPT-5-nano] Response status:', error.response.status);
                    console.error('[Azure GPT-5-nano] Response data:', error.response.data);
                }
                throw error;
            }
        },

        async genWithTools(prompt: string, tools: any[]): Promise<any> {
            // GPT-5-nano supports tool calling
            const formattedTools = tools.map(t => ({
                type: 'function' as const,
                function: {
                    name: t.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
                    description: t.description,
                    parameters: t.parameters,
                },
            }));

            const response = await client.chat.completions.create({
                messages: [
                    { role: "developer", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
                model: modelName,
                tools: formattedTools,
                tool_choice: 'auto'
            });

            lastUsage = response.usage;

            const content = response.choices[0]?.message?.content || '';
            const toolCalls = response.choices[0]?.message?.tool_calls || [];

            if (toolCalls.length > 0) {
                return {
                    content,
                    toolCalls: toolCalls.map((tc: any) => ({
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments || '{}'),
                    })),
                    usage: lastUsage,
                };
            }

            return { content, toolCalls: [], usage: lastUsage };
        },

        async *genStream(prompt: string): AsyncGenerator<string, void, unknown> {
            const stream = await client.chat.completions.create({
                messages: [
                    { role: "developer", content: "You are a helpful assistant." },
                    { role: "user", content: prompt }
                ],
                model: modelName,
                stream: true
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    yield content;
                }
                if (chunk.usage) {
                    lastUsage = chunk.usage;
                }
            }
        },

        getUsage() {
            return lastUsage;
        },
    };

    return handle;
}

export default createAzureGPT5Nano;

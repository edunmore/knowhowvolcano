/**
 * Ollama Local Provider for Volcano SDK
 * 
 * Uses local Ollama instance with qwen3:8b model.
 * Ollama provides OpenAI-compatible API at localhost:11434/v1
 * 
 * Usage:
 *   import { createOllamaProvider } from './providers/ollama-provider';
 *   const llm = createOllamaProvider();
 *   const result = await agent({ llm }).then({ prompt: '...' }).run();
 */

import { llmOpenAI } from 'volcano-sdk';
import type { LLMHandle } from 'volcano-sdk';

export interface OllamaConfig {
    /** Model to use (default: qwen3:8b) */
    model?: string;
    /** Ollama server URL (default: http://localhost:11434) */
    host?: string;
    /** Temperature for generation (default: 0.7) */
    temperature?: number;
    /** Max tokens for response */
    maxTokens?: number;
}

/**
 * Create an Ollama provider for local LLM inference
 * 
 * Requires Ollama to be running locally with the model pulled.
 * Start Ollama: ollama serve
 * Pull model: ollama pull qwen3:8b
 * 
 * @example
 * import { agent } from 'volcano-sdk';
 * import { createOllamaProvider } from './providers/ollama-provider';
 * 
 * const llm = createOllamaProvider();
 * // or with custom model:
 * const llm = createOllamaProvider({ model: 'llama3.2:latest' });
 * 
 * const results = await agent({ llm })
 *   .then({ prompt: 'Explain this code' })
 *   .run();
 */
export function createOllamaProvider(cfg: OllamaConfig = {}): LLMHandle {
    const model = cfg.model || 'qwen3:8b';
    const host = cfg.host || 'http://localhost:11434';

    // Ollama provides OpenAI-compatible API at /v1
    const baseURL = `${host}/v1`;

    // Use llmOpenAI with Ollama endpoint
    // Ollama doesn't require an API key
    return llmOpenAI({
        apiKey: 'ollama', // Ollama accepts any string as API key
        model,
        baseURL,
        options: {
            temperature: cfg.temperature ?? 0.7,
            max_tokens: cfg.maxTokens,
        },
    });
}

export default createOllamaProvider;

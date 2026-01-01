/**
 * Gemini CLI Custom Provider for Volcano SDK
 * 
 * Wraps the Gemini CLI headless mode to provide an LLM interface that
 * leverages Gemini's built-in agentic capabilities (file reading, tool use).
 * 
 * Usage:
 *   const llm = llmGeminiCLI({ model: 'gemini-2.5-pro', workingDir: './myproject' });
 *   const result = await agent({ llm }).then({ prompt: 'Analyze the codebase' }).run();
 */

import { execSync, exec } from 'node:child_process';
import type { LLMHandle, ToolDefinition, LLMToolResult } from 'volcano-sdk';

// TokenUsage type (defined locally as it's not exported from volcano-sdk)
export type TokenUsage = {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
};

export interface GeminiCLIConfig {
    /** Model to use (default: gemini-2.5-pro) */
    model?: string;
    /** Working directory for Gemini CLI (affects file context) */
    workingDir?: string;
    /** Timeout in milliseconds (default: 120000 = 2 min) */
    timeout?: number;
    /** Auto-accept tool calls without prompting (default: true) */
    yolo?: boolean;
    /** Path to gemini CLI binary (default: 'gemini') */
    binaryPath?: string;
}

export interface GeminiCLIResponse {
    response: string;
    stats?: {
        models?: Record<string, {
            api?: { totalRequests?: number; totalErrors?: number; totalLatencyMs?: number };
            tokens?: { prompt?: number; candidates?: number; total?: number; cached?: number };
        }>;
        tools?: {
            totalCalls?: number;
            totalSuccess?: number;
            totalFail?: number;
            totalDurationMs?: number;
        };
        files?: { totalLinesAdded?: number; totalLinesRemoved?: number };
    };
    error?: { type?: string; message?: string; code?: number };
}

/**
 * Execute a prompt via Gemini CLI headless mode
 */
function executeGeminiCLI(
    prompt: string,
    config: Required<GeminiCLIConfig>
): GeminiCLIResponse {
    const args: string[] = [
        '-p', prompt,
        '--output-format', 'json',
        '-m', config.model,
    ];

    if (config.yolo) {
        args.push('-y');
    }

    const command = `${config.binaryPath} ${args.map(a =>
        a.includes(' ') || a.includes('"') ? `'${a.replace(/'/g, "'\\''")}'` : a
    ).join(' ')}`;

    try {
        const output = execSync(command, {
            cwd: config.workingDir,
            timeout: config.timeout,
            encoding: 'utf-8',
            maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large responses
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        // Parse JSON response
        try {
            return JSON.parse(output) as GeminiCLIResponse;
        } catch {
            // If not valid JSON, wrap the raw output
            return { response: output.trim() };
        }
    } catch (error: any) {
        const errorMessage = error.stderr?.toString() || error.message || 'Unknown error';
        return {
            response: '',
            error: {
                type: 'ExecutionError',
                message: errorMessage,
                code: error.status || -1,
            },
        };
    }
}

/**
 * Extract token usage from Gemini CLI response stats
 */
function extractUsage(response: GeminiCLIResponse): TokenUsage | undefined {
    if (!response.stats?.models) return undefined;

    let inputTokens = 0;
    let outputTokens = 0;

    for (const model of Object.values(response.stats.models)) {
        inputTokens += model.tokens?.prompt || 0;
        outputTokens += model.tokens?.candidates || 0;
    }

    if (inputTokens === 0 && outputTokens === 0) return undefined;

    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
    };
}

/**
 * Create a Gemini CLI LLM provider for Volcano SDK
 * 
 * @example
 * import { agent } from 'volcano-sdk';
 * import { llmGeminiCLI } from './providers/gemini-cli-provider';
 * 
 * const llm = llmGeminiCLI({
 *   model: 'gemini-2.5-pro',
 *   workingDir: '/path/to/project',
 *   yolo: true, // auto-accept tool calls
 * });
 * 
 * const results = await agent({ llm })
 *   .then({ prompt: 'List all TypeScript files and summarize the architecture' })
 *   .run();
 */
export function llmGeminiCLI(cfg: GeminiCLIConfig = {}): LLMHandle {
    const config: Required<GeminiCLIConfig> = {
        model: cfg.model || 'gemini-2.5-pro',
        workingDir: cfg.workingDir || process.cwd(),
        timeout: cfg.timeout || 120000,
        yolo: cfg.yolo ?? true,
        binaryPath: cfg.binaryPath || 'gemini',
    };

    let lastUsage: TokenUsage | null = null;

    const handle: LLMHandle = {
        id: `GeminiCLI-${config.model}`,
        model: config.model,
        client: { config }, // expose config as client for debugging

        /**
         * Simple text generation
         */
        async gen(prompt: string): Promise<string> {
            const response = executeGeminiCLI(prompt, config);

            if (response.error) {
                throw new Error(`Gemini CLI error: ${response.error.message}`);
            }

            lastUsage = extractUsage(response) || null;
            return response.response;
        },

        /**
         * Generation with tool calling support
         * 
         * Note: Gemini CLI handles tools internally via MCP, so we just pass
         * the prompt and let Gemini decide which tools to use. The tools
         * parameter is used to format the prompt with available tool descriptions.
         */
        async genWithTools(prompt: string, tools: ToolDefinition[]): Promise<LLMToolResult> {
            // Format tool descriptions into the prompt
            let enhancedPrompt = prompt;

            if (tools.length > 0) {
                const toolDescriptions = tools
                    .map(t => `- ${t.name}: ${t.description}`)
                    .join('\n');
                enhancedPrompt = `Available tools:\n${toolDescriptions}\n\n${prompt}`;
            }

            const response = executeGeminiCLI(enhancedPrompt, config);

            if (response.error) {
                throw new Error(`Gemini CLI error: ${response.error.message}`);
            }

            lastUsage = extractUsage(response) || null;

            // Gemini CLI executes tools internally, so we return the final response
            // without explicit tool calls (they were already executed)
            return {
                content: response.response,
                toolCalls: [], // Tools already executed by Gemini CLI
                usage: lastUsage || undefined,
            };
        },

        /**
         * Streaming generation (simulated via polling)
         * 
         * Note: Gemini CLI doesn't support true streaming in headless mode,
         * so we yield the complete response as a single chunk.
         */
        async *genStream(prompt: string): AsyncGenerator<string, void, unknown> {
            const response = executeGeminiCLI(prompt, config);

            if (response.error) {
                throw new Error(`Gemini CLI error: ${response.error.message}`);
            }

            lastUsage = extractUsage(response) || null;

            // Yield the complete response as one chunk
            yield response.response;
        },

        /**
         * Get usage from the last request
         */
        getUsage(): TokenUsage | null {
            return lastUsage;
        },
    };

    return handle;
}

export default llmGeminiCLI;

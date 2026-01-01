/**
 * Verbose Logger - Provider-level logging wrapper
 * 
 * Wraps any LLM provider to log all calls when verbose mode is enabled.
 * This works for ALL providers (Gemini, DeepSeek, Ollama, etc.)
 */

import type { LLMHandle, ToolDefinition, LLMToolResult } from 'volcano-sdk';

export interface LLMCallLog {
    timestamp: string;
    provider: string;
    method: 'gen' | 'genWithTools' | 'genStream';
    promptLength: number;
    prompt: string;
    responseLength: number;
    response: string;
    durationMs: number;
    metadata?: Record<string, any>;
}

/**
 * Global verbose state and logs
 */
let verboseMode = false;
let callLogs: LLMCallLog[] = [];

/**
 * Enable/disable verbose logging
 */
export function setVerbose(enabled: boolean): void {
    verboseMode = enabled;
    if (enabled) {
        console.log('[VERBOSE] Verbose logging enabled - all LLM calls will be recorded');
    }
}

/**
 * Check if verbose mode is enabled
 */
export function isVerbose(): boolean {
    return verboseMode;
}

/**
 * Get all logged calls
 */
export function getCallLogs(): LLMCallLog[] {
    return [...callLogs];
}

/**
 * Clear all logs
 */
export function clearCallLogs(): void {
    callLogs = [];
}

/**
 * Format logs for run.log file
 */
export function formatLogsForFile(): string {
    if (!verboseMode || callLogs.length === 0) {
        return '';
    }

    let output = '\n\n' + '='.repeat(80) + '\n';
    output += '=== VERBOSE LLM CALL LOGS ===\n';
    output += '='.repeat(80) + '\n';
    output += `Total LLM calls: ${callLogs.length}\n\n`;

    for (let i = 0; i < callLogs.length; i++) {
        const log = callLogs[i];
        output += `--- Call ${i + 1}/${callLogs.length} ---\n`;
        output += `Timestamp: ${log.timestamp}\n`;
        output += `Provider: ${log.provider}\n`;
        output += `Method: ${log.method}\n`;
        output += `Duration: ${log.durationMs}ms\n`;
        if (log.metadata) {
            output += `Metadata: ${JSON.stringify(log.metadata, null, 2)}\n`;
        }
        output += `\n>>> PROMPT (${log.promptLength} chars) >>>\n`;
        output += log.prompt;
        output += `\n\n<<< RESPONSE (${log.responseLength} chars) <<<\n`;
        output += log.response;
        output += '\n\n' + '-'.repeat(80) + '\n\n';
    }

    return output;
}

/**
 * Wrap an LLM provider with verbose logging
 * All calls to gen(), genWithTools(), genStream() will be logged
 */
export function wrapWithVerboseLogging(
    llm: LLMHandle,
    metadata?: Record<string, any>
): LLMHandle {
    const originalGen = llm.gen.bind(llm);
    const originalGenWithTools = llm.genWithTools.bind(llm);
    const originalGenStream = llm.genStream.bind(llm);

    // Wrap gen()
    llm.gen = async (prompt: string) => {
        const startTime = Date.now();
        const result = await originalGen(prompt);
        const durationMs = Date.now() - startTime;

        if (verboseMode) {
            const response = typeof result === 'string' ? result : JSON.stringify(result);
            callLogs.push({
                timestamp: new Date().toISOString(),
                provider: llm.id,
                method: 'gen',
                promptLength: prompt.length,
                prompt,
                responseLength: response.length,
                response,
                durationMs,
                metadata,
            });
            console.log(`[VERBOSE] gen() call to ${llm.id}: ${prompt.length} chars → ${response.length} chars (${durationMs}ms)`);
        }

        return result;
    };

    // Wrap genWithTools()
    llm.genWithTools = async (prompt: string, tools: ToolDefinition[]) => {
        const startTime = Date.now();
        const result = await originalGenWithTools(prompt, tools);
        const durationMs = Date.now() - startTime;

        if (verboseMode) {
            const response = JSON.stringify(result);
            callLogs.push({
                timestamp: new Date().toISOString(),
                provider: llm.id,
                method: 'genWithTools',
                promptLength: prompt.length,
                prompt,
                responseLength: response.length,
                response,
                durationMs,
                metadata: { ...metadata, toolCount: tools.length },
            });
            console.log(`[VERBOSE] genWithTools() call to ${llm.id}: ${prompt.length} chars → ${response.length} chars (${durationMs}ms)`);
        }

        return result;
    };

    // Wrap genStream() - note: streaming is harder to log, we log the prompt only
    llm.genStream = async function* (prompt: string) {
        const startTime = Date.now();
        let fullResponse = '';

        if (verboseMode) {
            console.log(`[VERBOSE] genStream() call to ${llm.id}: ${prompt.length} chars`);
        }

        for await (const chunk of originalGenStream(prompt)) {
            fullResponse += chunk;
            yield chunk;
        }

        const durationMs = Date.now() - startTime;

        if (verboseMode) {
            callLogs.push({
                timestamp: new Date().toISOString(),
                provider: llm.id,
                method: 'genStream',
                promptLength: prompt.length,
                prompt,
                responseLength: fullResponse.length,
                response: fullResponse,
                durationMs,
                metadata,
            });
            console.log(`[VERBOSE] genStream() complete: ${fullResponse.length} chars (${durationMs}ms)`);
        }
    };

    return llm;
}

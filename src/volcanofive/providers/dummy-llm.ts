/**
 * dummyLLM Provider
 * 
 * For testing: simulates tool calling behavior.
 * Parses the prompt to decide which MCP tools to call.
 */

import type { LLMHandle } from 'volcano-sdk';

/**
 * Create a dummy LLM that simulates tool calling
 * 
 * It looks for tool hints in the prompt and generates appropriate tool calls.
 */
export function dummyLLM(): LLMHandle {
    return {
        id: 'dummy-llm',
        model: 'dummy',
        client: null,

        async gen(prompt: string): Promise<string> {
            console.log('[dummyLLM] gen called with prompt:', prompt.slice(0, 100));

            // Simple echo response
            if (prompt.includes('extract') || prompt.includes('sourceId')) {
                // Try to extract sourceId from previous results
                const match = prompt.match(/"sourceId"\s*:\s*"([^"]+)"/);
                if (match) {
                    return `The sourceId is: ${match[1]}`;
                }
            }

            return `[dummy response] Processed: ${prompt.slice(0, 50)}...`;
        },

        async genWithTools(prompt: string, tools: any[]): Promise<any> {
            console.log('[dummyLLM] genWithTools called');
            console.log('[dummyLLM] Available tools:', tools.map(t => t.name).join(', '));

            // Parse prompt to decide which tool to call
            const toolCalls: any[] = [];

            // Look for ingest hint
            if (prompt.includes('ingest') || prompt.includes('SOURCE FILE')) {
                // Find ingest tool
                const ingestTool = tools.find(t => t.name.includes('ingest'));
                if (ingestTool) {
                    // Extract sourcePath and vaultDir from prompt
                    const sourceMatch = prompt.match(/SOURCE FILE:\s*(.+)/);
                    const vaultMatch = prompt.match(/VAULT DIR:\s*(.+)/);

                    if (sourceMatch && vaultMatch) {
                        toolCalls.push({
                            name: ingestTool.name,
                            arguments: {
                                sourcePath: sourceMatch[1].trim(),
                                vaultDir: vaultMatch[1].trim()
                            },
                            mcpHandle: ingestTool.mcpHandle  // REQUIRED!
                        });
                        console.log('[dummyLLM] Calling tool:', ingestTool.name);
                    }
                }
            }

            // Look for chunk hint (if we have sourceId in context)
            if (prompt.includes('chunk') || prompt.includes('sourceId')) {
                const chunkTool = tools.find(t => t.name.includes('chunk'));
                const sourceIdMatch = prompt.match(/"sourceId"\s*:\s*"([^"]+)"/);
                const vaultMatch = prompt.match(/VAULT DIR:\s*(.+)/) || prompt.match(/"vaultDir"\s*:\s*"([^"]+)"/);

                if (chunkTool && sourceIdMatch) {
                    toolCalls.push({
                        name: chunkTool.name,
                        arguments: {
                            sourceId: sourceIdMatch[1],
                            vaultDir: vaultMatch ? vaultMatch[1].trim() : ''
                        },
                        mcpHandle: chunkTool.mcpHandle  // REQUIRED!
                    });
                    console.log('[dummyLLM] Calling tool:', chunkTool.name);
                }
            }

            if (toolCalls.length > 0) {
                return {
                    content: '',
                    toolCalls
                };
            }

            // No tools to call
            return {
                content: '[dummy] No tools matched the prompt',
                toolCalls: []
            };
        },

        async *genStream(prompt: string): AsyncGenerator<string, void, unknown> {
            yield `[dummy stream] ${prompt.slice(0, 50)}`;
        }
    };
}

export default dummyLLM;

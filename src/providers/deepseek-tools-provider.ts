/**
 * Azure DeepSeek Provider with Tool Calling Support
 * 
 * DeepSeek on Azure outputs tool calls in a text format:
 *   tool_call_name{name}
 *   tool_call_arguments{json}
 * 
 * This provider parses that format and executes the tools.
 */

import { agent, mcpStdio, type MCPHandle } from 'volcano-sdk';
import type { LLMHandle, LLMToolResult, ToolDefinition } from 'volcano-sdk';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DeepSeekConfig {
    apiKeysPath?: string;
    apiKey?: string;
    temperature?: number;
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

interface DeepSeekMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    tool_call_id?: string;
    name?: string;
}

interface DeepSeekToolCall {
    name: string;
    arguments: Record<string, any>;
}

/**
 * Parse DeepSeek's text-based tool call format
 * Handles formats like:
 *   tool_call_name
 *   mcp_xxx_read_text_file
 *   tool_call_arguments
 *   {"path": "file.txt"}
 */
function parseToolCalls(content: string): DeepSeekToolCall[] {
    const calls: DeepSeekToolCall[] = [];

    // Split by lines and find tool_call patterns
    const lines = content.split('\n').map(l => l.trim()).filter(l => l);

    let currentName: string | null = null;
    let captureArgs = false;
    let argsBuffer = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for tool_call_name marker
        if (line === 'tool_call_name' || line.startsWith('tool_call_name')) {
            // Next non-empty line should be the tool name
            if (line === 'tool_call_name' && i + 1 < lines.length) {
                currentName = lines[i + 1].trim();
            } else {
                // Handle tool_call_name{name} format (no space)
                const match = line.match(/tool_call_name\s*(.+)/);
                if (match) currentName = match[1].trim();
            }
            continue;
        }

        // Check for tool_call_arguments marker
        if (line === 'tool_call_arguments' || line.startsWith('tool_call_arguments')) {
            captureArgs = true;
            // Handle tool_call_arguments{json} format
            const match = line.match(/tool_call_arguments\s*(\{[\s\S]*)/);
            if (match) argsBuffer = match[1];
            continue;
        }

        // If capturing args, collect JSON
        if (captureArgs) {
            argsBuffer += line;
            // Check if we have complete JSON
            try {
                const args = JSON.parse(argsBuffer);
                if (currentName) {
                    calls.push({ name: currentName, arguments: args });
                    currentName = null;
                }
                captureArgs = false;
                argsBuffer = '';
            } catch {
                // Not complete JSON yet, continue collecting
            }
        }
    }

    // Fallback: try regex patterns
    if (calls.length === 0) {
        // Pattern: mcp_xxx_toolname with JSON block
        const mcpMatch = content.match(/mcp_[a-f0-9]+_([a-zA-Z_]+)/);
        const jsonMatch = content.match(/\{[^{}]*"path"[^{}]*\}/);

        if (mcpMatch && jsonMatch) {
            try {
                calls.push({
                    name: mcpMatch[0], // Use full MCP name
                    arguments: JSON.parse(jsonMatch[0])
                });
            } catch { }
        }
    }

    return calls;
}


/**
 * Create DeepSeek provider with proper tool calling support
 */
export function createDeepSeekWithTools(cfg: DeepSeekConfig = {}): LLMHandle {
    const apiKeysPath = cfg.apiKeysPath || join(process.cwd(), 'api-keys.json');
    const apiKey = cfg.apiKey || loadApiKey(apiKeysPath);
    const baseURL = 'https://aineu-marcus.services.ai.azure.com/openai/v1';

    let lastUsage: any = null;

    async function callAPI(messages: DeepSeekMessage[], tools?: any[]): Promise<any> {
        const body: any = {
            model: 'DeepSeek-V3.2',
            messages,
            temperature: cfg.temperature ?? 0.7,
            max_tokens: cfg.maxTokens ?? 2000,
        };

        if (tools && tools.length > 0) {
            body.tools = tools;
            body.tool_choice = 'auto';
        }

        const response = await fetch(`${baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            throw new Error(`DeepSeek API error: ${response.status}`);
        }

        return response.json();
    }

    const handle: LLMHandle = {
        id: 'DeepSeek-V3.2-Tools',
        model: 'DeepSeek-V3.2',
        client: { apiKey: '***' },

        async gen(prompt: string): Promise<string> {
            const resp = await callAPI([{ role: 'user', content: prompt }]);
            lastUsage = resp.usage;
            return resp.choices[0]?.message?.content || '';
        },

        async genWithTools(prompt: string, tools: ToolDefinition[]): Promise<LLMToolResult> {
            // Format tools for OpenAI API
            const formattedTools = tools.map(t => ({
                type: 'function' as const,
                function: {
                    name: t.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
                    description: t.description,
                    parameters: t.parameters,
                },
            }));

            // Create a tool name mapping
            const toolMap = new Map<string, ToolDefinition>();
            tools.forEach((t, i) => {
                const safeName = t.name.replace(/[^a-zA-Z0-9_-]/g, '_');
                toolMap.set(safeName, t);
                toolMap.set(t.name, t);
            });

            // First API call
            const resp = await callAPI(
                [{ role: 'user', content: prompt }],
                formattedTools
            );
            lastUsage = resp.usage;

            const content = resp.choices[0]?.message?.content || '';

            // Check for structured tool_calls in response (proper OpenAI format)
            const structuredToolCalls = resp.choices[0]?.message?.tool_calls;
            if (structuredToolCalls && structuredToolCalls.length > 0) {
                // Standard OpenAI tool calling format
                return {
                    content,
                    toolCalls: structuredToolCalls.map((tc: any) => ({
                        name: tc.function.name,
                        arguments: JSON.parse(tc.function.arguments || '{}'),
                    })),
                    usage: lastUsage,
                };
            }

            // Parse text-based tool calls from DeepSeek
            const parsedCalls = parseToolCalls(content);

            if (parsedCalls.length === 0) {
                // No tool calls, just return the content
                return { content, toolCalls: [], usage: lastUsage };
            }

            // Return parsed tool calls for Volcano SDK to execute
            return {
                content,
                toolCalls: parsedCalls.map(tc => {
                    const tool = toolMap.get(tc.name);
                    return {
                        name: tc.name,
                        arguments: tc.arguments,
                        mcpHandle: tool?.mcpHandle,
                    };
                }),
                usage: lastUsage,
            };
        },

        async *genStream(prompt: string): AsyncGenerator<string, void, unknown> {
            const resp = await callAPI([{ role: 'user', content: prompt }]);
            lastUsage = resp.usage;
            yield resp.choices[0]?.message?.content || '';
        },

        getUsage() {
            return lastUsage;
        },
    };

    return handle;
}

export default createDeepSeekWithTools;

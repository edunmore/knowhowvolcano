# DeepSeek MCP Tool Calling Workaround

DeepSeek on Azure does not return proper OpenAI-style `tool_calls` in its API responses. Instead, it outputs tool calls as **text** in the message content.

## The Problem

When you give DeepSeek tools and ask it to use them, instead of returning:
```json
{
  "tool_calls": [{ "function": { "name": "write_file", "arguments": "{...}" }}]
}
```

It returns:
```
I'll create that file for you.

tool_call_name
mcp_4e14c9f8_write_file
tool_call_arguments
{"path": "/path/to/file.txt", "content": "Hello"}
```

## The Solution

The `deepseek-tools-provider.ts` handles this by:

1. **Parsing text-based tool calls** from the LLM response
2. **Executing MCP tools directly** using `mcpHandle.callTool()`
3. **Returning results** to Volcano SDK

### Key Code

```typescript
// Parse DeepSeek's text-based tool call format
const parsedCalls = parseToolCalls(content);

for (const tc of parsedCalls) {
    const tool = toolMap.get(tc.name);
    
    if (tool?.mcpHandle) {
        // Extract actual tool name from mcp_<hash>_<name> format
        const actualToolName = tc.name.replace(/^mcp_[a-f0-9]+_/, '');
        
        // Execute the MCP tool directly
        const result = await (tool.mcpHandle as any).callTool(actualToolName, tc.arguments);
        
        executedToolCalls.push({
            name: tc.name,
            arguments: tc.arguments,
            result: result,
            mcpHandle: tool.mcpHandle,
        });
    }
}
```

## Usage

No changes needed in your agent code - just use `createDeepSeekWithTools()`:

```typescript
import { agent, mcpStdio } from 'volcano-sdk';
import { createDeepSeekWithTools } from './core/providers/deepseek-tools-provider.js';

const filesystem = mcpStdio({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/vault'],
});

const llm = createDeepSeekWithTools();

const results = await agent({ llm })
    .then({
        prompt: 'Create a file at /path/to/vault/test.txt with "Hello World"',
        mcps: [filesystem],
    })
    .run();

await filesystem.cleanup?.();
```

## Provider Portability

The same code works with native providers (no changes needed):

| Provider | Tool Calling | Notes |
|----------|-------------|-------|
| DeepSeek | Text-based → parsed & executed | Our provider handles it |
| GPT-4/Claude | Native | Volcano SDK handles automatically |
| Ollama | Native (llama.cpp) | Volcano SDK handles automatically |

## Future Improvements

1. **Custom Vault MCP Server** - Create vault-specific tools:
   - `search_notes(query)` - semantic search
   - `get_index()` - return canon index
   - `check_duplicates(concept)` - duplicate detection
   - `get_vault_stats()` - counts and metrics

2. **Multi-tool Support** - Handle multiple tool calls in one response

3. **Streaming** - Parse tool calls from streaming responses

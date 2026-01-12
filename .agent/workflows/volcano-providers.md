---
description: How to use Volcano SDK LLM providers (Gemini, DeepSeek, Ollama)
---

# Volcano SDK Provider Usage

## Available Providers

| Provider      | Speed      | Cost   | Use Case           |
| ------------- | ---------- | ------ | ------------------ |
| DeepSeek V3.2 | Fast (1s)  | Low    | Development, crews |
| GPT-5-nano    | Slow (10s) | Medium | Production crews   |
| Gemini CLI    | Fast       | Free   | File operations    |
| Ollama        | Medium     | Free   | Local dev          |

## Azure DeepSeek (Recommended)

```typescript
import { createAzureProvider } from './core/providers/azure-deepseek-provider.js';

const llm = createAzureProvider({
    maxTokens: 400,
    temperature: 0.1,
    debug: true  // Log prompts/responses
});
```

**Debug mode:** Logs all prompts and responses with timestamps.

## Azure GPT-5-nano

```typescript
import { createAzureGPT5Nano } from './core/providers/azure-gpt5-nano-provider.js';

const llm = createAzureGPT5Nano({ maxTokens: 400 });
```

## Gemini CLI (File Operations)

```typescript
import { llmGeminiCLI } from './providers/gemini-cli-provider.js';

const llm = llmGeminiCLI({ model: 'gemini-2.5-flash' });
```

## Ollama (Local)

```bash
ollama serve  # Start server first
```

```typescript
import { createOllamaProvider } from './providers/ollama-provider.js';

const llm = createOllamaProvider({ model: 'qwen3:8b' });
```

## MCP for File Access

```typescript
import { mcpStdio } from 'volcano-sdk';

const filesystem = mcpStdio({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
});

// Use with LLM
await agent({ llm })
    .then({ prompt: 'Read file.txt', mcps: [filesystem] })
    .run();

await filesystem.cleanup?.();
```

## API Keys

Store in `api-keys.json` (gitignored):
```json
{
    "azure_deepseek_key": "...",
    "azure_gpt5_key": "..."
}
```

## Test Commands

```bash
npx tsx src/volcanosix/test-stateful-tasklist.ts  # Crew pattern
npx tsx src/volcanosix/test-loop-pattern.ts       # Loop pattern
```

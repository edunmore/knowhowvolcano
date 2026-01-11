---
description: How to use Volcano SDK LLM providers (Gemini, DeepSeek, Ollama)
---

# Volcano SDK Provider Usage

This project has 3 configured LLM providers. See `VOLCANO_SDK/NOTES.md` for full documentation.

## Quick Test Commands

// turbo-all
```bash
npm test                              # Test Gemini CLI provider
npx tsx src/test-azure.ts             # Test Azure DeepSeek
npx tsx src/test-ollama.ts            # Test Ollama
npx tsx src/test-mcp-filesystem.ts    # Test Ollama + file access
npx tsx src/test-deepseek-tools.ts    # Test DeepSeek + file access
```

## Using Gemini CLI (recommended for file operations)

```typescript
import { agent } from 'volcano-sdk';
import { llmGeminiCLI } from './src/providers/gemini-cli-provider.js';

const llm = llmGeminiCLI({ model: 'gemini-2.5-flash' });
const results = await agent({ llm })
  .then({ prompt: 'Your task' })
  .run();
```

## Using Azure DeepSeek V3.2

Requires API key in `api-keys.json` (gitignored).

```typescript
import { agent, mcpStdio } from 'volcano-sdk';
import { createDeepSeekWithTools } from './src/providers/deepseek-tools-provider.js';

// For file access, add MCP:
const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

const llm = createDeepSeekWithTools();
const results = await agent({ llm })
  .then({ prompt: 'Your task', mcps: [filesystem] })
  .run();

await filesystem.cleanup?.();
```

## Using Ollama (local, free)

Requires Ollama running: `ollama serve`

```typescript
import { agent, mcpStdio } from 'volcano-sdk';
import { createOllamaProvider } from './src/providers/ollama-provider.js';

const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

const llm = createOllamaProvider({ model: 'qwen3:8b' });
const results = await agent({ llm })
  .then({ prompt: 'Your task', mcps: [filesystem] })
  .run();

await filesystem.cleanup?.();
```

## Provider Files

- `src/providers/gemini-cli-provider.ts` — Gemini CLI wrapper
- `src/providers/deepseek-tools-provider.ts` — Azure DeepSeek with tool parsing
- `src/providers/ollama-provider.ts` — Local Ollama
- `api-keys.json` — API keys (gitignored)

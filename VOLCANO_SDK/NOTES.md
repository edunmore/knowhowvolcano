# Volcano SDK Configuration — Complete Guide

This project uses **Volcano SDK** (TypeScript) for LLM orchestration with **3 configured providers**:

1. **Gemini CLI** — Agentic provider with native file access
2. **Azure DeepSeek V3.2** — Cloud provider with MCP tool calling
3. **Ollama qwen3:8b** — Local provider with MCP tool calling

---

## Quick Start

```bash
# Run provider tests
npm test                              # Gemini CLI basic test
npx tsx src/test-azure.ts             # Azure DeepSeek test
npx tsx src/test-ollama.ts            # Ollama test
npx tsx src/test-mcp-filesystem.ts    # Ollama + MCP filesystem
npx tsx src/test-deepseek-tools.ts    # DeepSeek + MCP filesystem
```

---

## Provider Overview

| Provider | Import | File Access | API Key Required |
|----------|--------|-------------|------------------|
| Gemini CLI | `llmGeminiCLI()` | ✅ Native | No (uses `gemini` CLI) |
| DeepSeek V3.2 | `createDeepSeekWithTools()` | ✅ via MCP | Yes (`api-keys.json`) |
| Ollama | `createOllamaProvider()` | ✅ via MCP | No (local) |

---

## 1. Gemini CLI Provider

**File:** `src/providers/gemini-cli-provider.ts`

The Gemini CLI provider wraps the `gemini` command-line tool in headless mode. It has **native file system access** without needing MCP.

### Usage

```typescript
import { agent } from 'volcano-sdk';
import { llmGeminiCLI } from './src/providers/gemini-cli-provider.js';

const llm = llmGeminiCLI({
  model: 'gemini-2.5-pro',      // or 'gemini-2.5-flash'
  workingDir: process.cwd(),    // directory for file access
  yolo: true,                   // auto-accept tool calls
  timeout: 120000,              // 2 min timeout
});

const results = await agent({ llm })
  .then({ prompt: 'Read README.md and summarize it' })
  .run();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | string | `gemini-2.5-pro` | Model name |
| `workingDir` | string | `process.cwd()` | Working directory |
| `timeout` | number | `120000` | Timeout in ms |
| `yolo` | boolean | `true` | Auto-accept tools |
| `binaryPath` | string | `gemini` | Path to CLI |

---

## 2. Azure DeepSeek V3.2 Provider

**File:** `src/providers/deepseek-tools-provider.ts`

Azure-hosted DeepSeek model with custom tool call parsing (DeepSeek outputs tool calls as text, not structured JSON).

### API Key Setup

Edit `api-keys.json` (gitignored):
```json
{
  "azure": {
    "apiKey": "YOUR_AZURE_API_KEY_HERE",
    "endpoint": "https://aineu-marcus.services.ai.azure.com/openai/v1/",
    "model": "DeepSeek-V3.2",
    "deployment": "DeepSeek-V3.2"
  }
}
```

### Usage

```typescript
import { agent, mcpStdio } from 'volcano-sdk';
import { createDeepSeekWithTools } from './src/providers/deepseek-tools-provider.js';

// For file access, add MCP filesystem
const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

const llm = createDeepSeekWithTools();

const results = await agent({ llm })
  .then({
    prompt: 'Read testfile.txt',
    mcps: [filesystem],  // <-- Enables file access
  })
  .run();

await filesystem.cleanup?.();  // Clean up MCP server
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKeysPath` | string | `./api-keys.json` | Path to keys file |
| `apiKey` | string | (from file) | Override key |
| `temperature` | number | `0.7` | Temperature |
| `maxTokens` | number | `2000` | Max output tokens |

---

## 3. Ollama Provider (Local)

**File:** `src/providers/ollama-provider.ts`

Local Ollama instance with OpenAI-compatible API.

### Prerequisites

```bash
# Ensure Ollama is running
ollama serve

# Pull model if needed
ollama pull qwen3:8b
```

### Usage

```typescript
import { agent, mcpStdio } from 'volcano-sdk';
import { createOllamaProvider } from './src/providers/ollama-provider.js';

// For file access
const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
});

const llm = createOllamaProvider({ model: 'qwen3:8b' });

const results = await agent({ llm })
  .then({
    prompt: 'List files in the PROMPTS directory',
    mcps: [filesystem],
  })
  .run();

await filesystem.cleanup?.();
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `model` | string | `qwen3:8b` | Model name |
| `host` | string | `http://localhost:11434` | Ollama host |
| `temperature` | number | `0.7` | Temperature |
| `maxTokens` | number | undefined | Max tokens |

---

## MCP Filesystem Tools

Any provider can gain file system access via MCP (Model Context Protocol).

### Available Tools

- `read_text_file` / `read_file` — Read file contents
- `write_file` — Create/overwrite files
- `edit_file` — Line-based edits
- `list_directory` — List directory contents
- `directory_tree` — Recursive tree view
- `search_files` — Search by pattern
- `create_directory` — Create directories
- `move_file` — Move/rename files
- `get_file_info` — File metadata

### Usage Pattern

```typescript
import { agent, mcpStdio } from 'volcano-sdk';

// Start MCP filesystem server
const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allow'],
});

// Use with any provider
const results = await agent({ llm })
  .then({
    prompt: 'Your task here...',
    mcps: [filesystem],  // <-- Add MCP servers here
  })
  .run();

// IMPORTANT: Clean up
await filesystem.cleanup?.();
```

---

## Project Structure

```
knowhow1/
├── api-keys.json                    # API keys (gitignored)
├── package.json                     # Node.js config
├── tsconfig.json                    # TypeScript config
├── src/
│   ├── providers/
│   │   ├── gemini-cli-provider.ts   # Gemini CLI wrapper
│   │   ├── azure-deepseek-provider.ts # Simple Azure provider
│   │   ├── deepseek-tools-provider.ts # Azure with tool parsing
│   │   └── ollama-provider.ts       # Local Ollama
│   ├── test-provider.ts             # Gemini CLI tests
│   ├── test-azure.ts                # Azure basic test
│   ├── test-ollama.ts               # Ollama basic test
│   ├── test-mcp-filesystem.ts       # Ollama + MCP test
│   └── test-deepseek-tools.ts       # DeepSeek + MCP test
├── VOLCANO_SDK/                     # SDK documentation
└── PROMPTS/                         # Prompt templates
```

---

## Choosing a Provider

| Use Case | Recommended Provider |
|----------|---------------------|
| Simple file operations | Gemini CLI (native tools) |
| Complex reasoning | DeepSeek V3.2 |
| Fast local inference | Ollama qwen3:8b |
| Budget-conscious | Ollama (free, local) |
| Production/cloud | DeepSeek or Gemini CLI |

---

## Adding New Providers

All providers implement Volcano SDK's `LLMHandle` interface:

```typescript
interface LLMHandle {
  id: string;
  model: string;
  client: any;
  gen(prompt: string): Promise<string>;
  genWithTools(prompt: string, tools: ToolDefinition[]): Promise<LLMToolResult>;
  genStream(prompt: string): AsyncGenerator<string>;
  getUsage?(): TokenUsage | null;
}
```

For OpenAI-compatible APIs, use `llmOpenAI` with custom `baseURL`:

```typescript
import { llmOpenAI } from 'volcano-sdk';

const llm = llmOpenAI({
  apiKey: 'your-key',
  model: 'model-name',
  baseURL: 'https://your-endpoint/v1',
});
```

---

## Reference Links

- [Volcano SDK Docs](https://volcano.dev/docs)
- [Gemini CLI Headless Mode](https://geminicli.com/docs/cli/headless)
- [MCP Filesystem Server](https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem)

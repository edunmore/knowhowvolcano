
# Code Step

> **Custom Extension** — This feature is a custom modification to Volcano SDK by edunmore (marcus@edunmore.de). It is not part of the official Volcano SDK distribution.

Direct function execution without LLM or MCP overhead. Perfect for deterministic operations, data transformations, and fast pipeline stages.

## Overview

The code step enables you to embed TypeScript functions directly in your Volcano workflow chain. Results automatically flow into context for subsequent steps.

```typescript
import { agent } from "volcano-sdk";

const results = await agent()
  .then({
    code: async (history) => ({
      result: { files: 5, bytes: 1024 },
      message: "Processed 5 files (1KB total)"
    })
  })
  .run();
```

## Step Configuration

| Option | Type                                      | Required | Description                     |
| ------ | ----------------------------------------- | -------- | ------------------------------- |
| `code` | `(history: StepResult[]) => Promise<any>` | Yes      | Function to execute             |
| `name` | string                                    | No       | Step name for logging/telemetry |

## Return Format

### Basic Return

Return any serializable data. Stored in `mcp` field for context:

```typescript
.then({
  code: async () => ({ count: 42, status: "done" })
})
// Context includes: {"count":42,"status":"done"}
```

### Enhanced Return (Crew Compatible)

For multi-agent crews, return both data and a human-readable message:

```typescript
.then({
  code: async () => ({
    result: { chunks: 42, bytes: 8192 },    // Data payload
    message: "Completed: Created 42 chunks"  // Coordinator sees this
  })
})
```

The `message` field becomes `llmOutput`, making it visible to coordinator agents in crew patterns.

## Accessing History

The code function receives the full step history:

```typescript
.then({
  code: async (history) => {
    const previousOutput = history.at(-1)?.llmOutput;
    const toolResults = history.at(-1)?.mcp?.result;
    return { processed: true };
  }
})
```

## Use Cases

### Fast Data Processing

```typescript
await agent({ llm })
  .then({ prompt: "What file should I analyze?" })
  .then({
    code: async (history) => {
      const filename = history.at(-1)?.llmOutput;
      const content = await fs.readFile(filename, "utf-8");
      return { content, lines: content.split("\n").length };
    }
  })
  .then({ prompt: "Summarize this file content" })
  .run();
```

### Pipeline Stages

```typescript
const pipeline = agent()
  .then({ code: async () => await ingestSource(path) })
  .then({ code: async (h) => await chunkText(h.at(-1)?.mcp?.result) })
  .then({ code: async (h) => await extractConcepts(h.at(-1)?.mcp?.result) });
```

### Multi-Agent Crews

```typescript
const ingestAgent = agent({
  name: "Ingest",
  description: "Read source files"
})
.then({
  code: async () => ({
    result: { files: 5 },
    message: "Completed: Ingested 5 files"  // Coordinator sees this
  })
});

// Coordinator delegates to Ingest
await agent({ llm })
  .then({ prompt: "Execute: 1. Ingest 2. Process", agents: [ingestAgent, ...] })
  .run();
```

## Performance

Code steps execute instantly with zero token overhead:

| Step Type | Tokens | Typical Duration |
| --------- | ------ | ---------------- |
| LLM       | 50-500 | 500ms-5s         |
| MCP Tool  | 0      | 100-500ms        |
| **Code**  | **0**  | **<1ms**         |

## SDK Location

The code step implementation is located at:
- **File:** `volcano-sdk/src/volcano-sdk.ts`
- **Lines:** 2629-2665
- **Marker:** Look for `CUSTOM MODIFICATION: Code Step Feature`

## Best Practices

✅ **DO:**
- Use for deterministic operations
- Return `{result, message}` in crews
- Access history for context

❌ **DON'T:**
- Make code steps too complex (keep logic in sidecars)
- Forget error handling
- Mix async patterns incorrectly

## Error Handling

Errors in code steps are caught and normalized:

```typescript
.then({
  code: async () => {
    if (!valid) throw new Error("Validation failed");
    return { success: true };
  }
})
// Error surfaces as step failure with context
```

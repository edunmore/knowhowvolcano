---
activation: always-on
---

# AI Agent Instructions for Volcano SDK

**CRITICAL:** Use Volcano's composable patterns. NO custom scripts around agents. Everything flows through the fluent API.

**Full Documentation:** @volcano-docs/api.md, @volcano-docs/patterns.md, @volcano-docs/features.md, @volcano-docs/providers.md, @volcano-docs/mcp-tools.md
**Additional Rules:** /volcano-code-organization, /volcano-providers, /volcano-custom-providers

## Step Types

### LLM Step
```typescript
.then({ prompt: 'Analyze this text', llm })
```

### MCP Step (Tool Calling)
```typescript
// Auto-select tools
.then({ prompt: 'Read file.txt', mcps: [filesystem] })

// Explicit (no LLM)
.then({ mcp: filesystem, tool: 'read_file', args: { path: 'file.txt' } })
```

### Code Step (Custom - edunmore/marcus@edunmore.de)
```typescript
// Fast deterministic execution
.then({ code: async (history) => ({ result: data }) })

// With coordinator visibility (for multi-agent crews)
.then({ code: async () => ({
    result: { count: 42 },           // Data for context
    message: 'Completed: 42 items'   // Visible to coordinator
}) })
```

### Agent Delegation
```typescript
.runAgent(mySubAgent)  // Composition
.then({ prompt: 'Task', agents: [a1, a2, a3] })  // Crew
```

## Agent Configuration

```typescript
agent({
  llm,                    // Default LLM
  instructions,           // System prompt for ALL steps
  name,                   // Agent name (MUST match task in crew prompts)
  description,            // Helps coordinator select agent
  timeout: 60,
  retry: { retries: 3 },
  telemetry: { ... }
})
```

## Mandatory Patterns

### 1. Multi-Step → .then() Chaining
```typescript
// Context flows automatically
await agent({ llm })
  .then({ prompt: "Summarize" })
  .then({ prompt: "Analyze the summary" })
  .run();
```

### 2. Looping → .forEach()
```typescript
await agent({ llm })
  .forEach(documents, (doc, a) => 
    a.then({ prompt: `Process: ${doc}` })
  )
  .run();
```

### 3. Conditional → .branch()
```typescript
await agent({ llm })
  .then({ prompt: "Classify urgent/normal" })
  .branch((h) => h[0].llmOutput?.includes("urgent"), {
    true: (a) => a.then({ prompt: "Create alert" }),
    false: (a) => a.then({ prompt: "Add to queue" })
  })
  .run();
```

### 4. Parallel Tasks → .parallel()
```typescript
await agent({ llm })
  .parallel({
    sentiment: { prompt: "Analyze sentiment" },
    entities: { prompt: "Extract entities" }
  })
  .run();
```

### 5. Reusable → .runAgent()
```typescript
const extractor = agent({ llm }).then({ prompt: "Extract" });
const analyzer = agent({ llm }).then({ prompt: "Analyze" });

await agent({ llm })
  .runAgent(extractor)
  .runAgent(analyzer)
  .run();
```

### 6. Multi-LLM → Cost Optimization
```typescript
const cheap = createDeepSeek({ maxTokens: 200 });
const expensive = createAzureGPT5Nano({ maxTokens: 1000 });

await agent()
  .then({ llm: cheap, prompt: "Preprocess" })
  .then({ llm: expensive, prompt: "Deep reasoning" })
  .run();
```

### 7. Multi-Agent Crews
```typescript
const ingestAgent = agent({
  name: 'Ingest',  // MUST match prompt task
  description: 'Read files'
}).then({ code: async () => ({
  result: { files: 5 },
  message: 'Completed: Ingested 5 files'  // Coordinator sees this
}) });

await agent({ llm })
  .then({
    prompt: `Execute: 1. Ingest 2. Chunk 3. Extract`,
    agents: [ingestAgent, chunkAgent, extractAgent]
  })
  .run();
```

**Crew Prompting:**
```
✅ Execute: 1. Ingest 2. Chunk 3. Extract
❌ Execute steps. When done say DONE.  ← SDK handles USE/DONE
```

### 8. Crew Loop (Agent Retry Until Completion)

In a multi-agent crew, the coordinator can repeat an agent until it signals completion:

```typescript
// Crew prompt with loop instruction
prompt: `Execute:
1. Ingest
2. Chunk - REPEAT until "Completed:" in output
   - If "Working on it...", call Chunk again
   - If "Completed:", move to next step
3. Extract`

// Agent that reports progress
const chunkAgent = agent({ name: 'Chunk', description: 'Chunk files' })
  .then({ code: async () => {
    if (++attempts < 3) {
      return { result: {}, message: 'Working on it...' };
    }
    return { result: { chunks: 42 }, message: 'Completed: Created 42 chunks' };
  } });
```

### 9. MCP Tools
```typescript
const filesystem = mcpStdio({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
});

await agent({ llm })
  .then({ prompt: "Read config.json", mcps: [filesystem] })
  .run();
```

### 10. Error Handling
```typescript
await agent({ llm, retry: { retries: 3 } })
  .retryUntil(
    (a) => a.then({ prompt: "Generate valid JSON" }),
    (h) => { try { JSON.parse(h.at(-1)?.llmOutput!); return true; } catch { return false; } },
    { maxRetries: 5 }
  )
  .run();
```

## Decision Tree

```
Multiple items? → .forEach() or .parallel()
Conditional? → .branch() or .switch()
Loop until? → .while() or .retryUntil()
Reuse logic? → .runAgent()
Multiple LLMs? → Override per-step
Autonomous? → agents: [] (crew)
Tools? → mcps: []
Fast deterministic? → code: async () => {}
```

## Anti-Patterns

❌ Breaking out of flow to process data manually
❌ Multiple `.run()` calls with variable passing
❌ Manual tool orchestration
❌ Custom retry loops
❌ Redundant USE/DONE instructions in prompts
❌ Inline agent definitions in main file

## Summary

**DO:** Chain `.then()`, use control flow, compose with `.runAgent()`, multi-LLM, code steps for speed, clean crew prompts

**DON'T:** Script around agents, manual data passing, overexplain to coordinator

---
description: Volcano SDK agent patterns and mandatory rules (Always-on)
---

# AI Agent Instructions for Volcano SDK

**CRITICAL:** Use Volcano's composable patterns. NO custom scripts around agents. Everything flows through the fluent API.

**Full Documentation:** See `volcano-docs/` folder for api.md, patterns.md, features.md, providers.md, mcp-tools.md

## Agent Configuration

```typescript
agent({
  llm,                    // Default LLM (can override per-step)
  instructions,           // System prompt for ALL steps
  name,                   // Agent name (for multi-agent crews)
  description,            // MCP-like tool description (for orchestrator to select this agent)
  timeout: 60,            // Default timeout per step (seconds)
  retry: { retries: 3 },  // Retry config
  telemetry: { ... }      // OpenTelemetry for production
})
```

**Key concepts:**
- `instructions` = system prompt (applies to every step)
- `name` + `description` = make agent usable as tool in crews (see Pattern 7)
- Set defaults at agent level, override per-step with `.then({ llm, timeout, ... })`

## Core Philosophy

Agents compose agents. Each can use different LLMs. Context flows automatically. No manual data passing.

## Mandatory Patterns

### 1. Multi-Step Workflows → Use .then() Chaining

**WRONG ❌** - Don't do this:
```typescript
// NO! Don't create separate function calls
async function processDocument(doc) {
  const summary = await agent().then({ prompt: "Summarize" }).run();
  const analysis = await agent().then({ prompt: "Analyze: " + summary[0].llmOutput }).run();
  return analysis;
}
```

**RIGHT ✅** - Do this:
```typescript
// YES! Context flows automatically between steps
const results = await agent({ llm })
  .then({ prompt: "Summarize this document" })
  .then({ prompt: "Analyze the summary for key insights" })
  .then({ prompt: "Create a final report" })
  .run();
```

**Why:** Context flows automatically. No manual variable passing needed.

### 2. Looping Over Items → Use .forEach()

**WRONG ❌:**
```typescript
// NO! Don't use for loops with agent calls
const results = [];
for (const doc of documents) {
  const result = await agent().then({ prompt: `Process ${doc}` }).run();
  results.push(result);
}
```

**RIGHT ✅:**
```typescript
// YES! Use .forEach() - it's built for this
const results = await agent({ llm })
  .forEach(documents, (doc, a) => 
    a.then({ prompt: `Process: ${doc}` })
     .then({ prompt: "Extract key points" })
  )
  .then({ prompt: "Combine all results" })
  .run();
```

### 3. Conditional Logic → Use .branch()

**WRONG ❌:**
```typescript
// NO! Don't pull results out and use if/else
const classify = await agent().then({ prompt: "Classify" }).run();
if (classify[0].llmOutput.includes("urgent")) {
  await agent().then({ prompt: "Handle urgent" }).run();
}
```

**RIGHT ✅:**
```typescript
// YES! Use .branch()
const results = await agent({ llm })
  .then({ prompt: "Classify as urgent or normal" })
  .branch(
    (h) => h[0].llmOutput?.includes("urgent") || false,
    {
      true: (a) => a.then({ prompt: "Create alert", mcps: [notifications] }),
      false: (a) => a.then({ prompt: "Add to queue" })
    }
  )
  .run();
```

### 4. Multiple Independent Tasks → Use .parallel()

**WRONG ❌:**
```typescript
// NO! Don't await sequentially
const sentiment = await agent().then({ prompt: "Sentiment?" }).run();
const entities = await agent().then({ prompt: "Entities?" }).run();
```

**RIGHT ✅:**
```typescript
// YES! Use .parallel()
const results = await agent({ llm })
  .parallel({
    sentiment: { prompt: "Analyze sentiment" },
    entities: { prompt: "Extract entities" },
    summary: { prompt: "Summarize" }
  })
  .then({ prompt: "Combine results" })
  .run();
```

### 5. Reusable Components → Define Agent Builders

**WRONG ❌:**
```typescript
// NO! Don't copy-paste prompts
async function analyzeDoc1() {
  return agent().then({ prompt: "Extract..." }).then({ prompt: "Analyze..." }).run();
}
async function analyzeDoc2() {
  return agent().then({ prompt: "Extract..." }).then({ prompt: "Analyze..." }).run();
}
```

**RIGHT ✅:**
```typescript
// YES! Define reusable components
const extractor = agent({ llm })
  .then({ prompt: "Extract key data" })
  .then({ prompt: "Structure as JSON" });

const analyzer = agent({ llm })
  .then({ prompt: "Analyze patterns" })
  .then({ prompt: "Generate insights" });

// Compose
const results = await agent({ llm })
  .then({ prompt: "Document: ..." })
  .runAgent(extractor)
  .runAgent(analyzer)
  .run();
```

### 6. Multi-LLM Pipelines → Cost Optimization

**WRONG ❌:**
```typescript
// NO! Don't use expensive model everywhere
const llm = llmOpenAI({ model: "gpt-4o" });
await agent({ llm })
  .then({ prompt: "Preprocess" }) // Overkill
  .then({ prompt: "Complex reasoning" })
  .then({ prompt: "Format" }) // Overkill
  .run();
```

**RIGHT ✅:**
```typescript
// YES! Use cost-optimized workflow
const cheap = llmOpenAI({ model: "gpt-4o-mini" });
const expensive = llmOpenAI({ model: "gpt-4o" });
const local = llmLlama({ model: "llama3.2:3b" });

await agent()
  .then({ llm: local, prompt: "Preprocess" })
  .then({ llm: expensive, prompt: "Deep reasoning" })
  .then({ llm: cheap, prompt: "Format output" })
  .run();
```

### 7. Multi-Agent Crews → Autonomous Delegation

**WRONG ❌:**
```typescript
// NO! Don't manually orchestrate
async function processTask(task) {
  if (task.includes("research")) return await researcher.run();
  if (task.includes("write")) return await writer.run();
}
```

**RIGHT ✅:**
```typescript
// YES! Let coordinator delegate
const researcher = agent({
  llm, name: "researcher",
  description: "Finds facts. Use for information gathering."
}).then({ prompt: "Research thoroughly" });

const writer = agent({
  llm, name: "writer",
  description: "Creates content. Use for writing."
}).then({ prompt: "Write compelling content" });

// Coordinator picks right agents
const results = await agent({ llm })
  .then({
    prompt: "Create a blog post about AI",
    agents: [researcher, writer]
  })
  .run();
```

### 8. MCP Tools → Automatic Selection

**WRONG ❌:**
```typescript
// NO! Don't manually call tools
const weatherData = await callMcpTool("get_weather", { city: "Seattle" });
const result = await agent().then({ 
  prompt: `Weather: ${weatherData}. What to do?` 
}).run();
```

**RIGHT ✅:**
```typescript
// YES! Let agent auto-select
const weather = mcp("http://localhost:8001/mcp");
const tasks = mcp("http://localhost:8002/mcp");

const results = await agent({ llm })
  .then({
    prompt: "Check Seattle weather. If rain, create umbrella task.",
    mcps: [weather, tasks]
  })
  .run();
```

### 9. Embeddings → Custom Providers

Use custom providers for embeddings, vector search, APIs, parsing. A provider is just: text input → text output. See `/volcano-custom-providers` workflow for complete guide.

### 10. Error Handling → Use Built-in Patterns

**WRONG ❌:**
```typescript
// NO! Don't write custom retry
let attempts = 0;
while (attempts < 3) {
  try {
    const result = await agent().then({ prompt: "..." }).run();
    if (isValid(result)) break;
  } catch (e) { attempts++; }
}
```

**RIGHT ✅:**
```typescript
// YES! Use built-in retry
const results = await agent({ 
  llm,
  retry: { retries: 3, delay: 1000 }
})
  .retryUntil(
    (a) => a.then({ prompt: "Generate valid JSON" }),
    (h) => {
      try {
        JSON.parse(h.at(-1)?.llmOutput || "");
        return true;
      } catch {
        return false;
      }
    },
    { maxRetries: 5 }
  )
  .run();
```

### 11. Observability → Use Hooks

**RIGHT ✅:**
```typescript
// Use hooks
const results = await agent({ llm })
  .then({ prompt: "Step 1" })
  .then({ prompt: "Step 2" })
  .run({
    onStep: (result, index) => {
      console.log(`✓ Step ${index + 1}: ${result.durationMs}ms`);
    },
    onToken: (token) => process.stdout.write(token)
  });

// Or OpenTelemetry
const results = await agent({ 
  llm,
  telemetry: {
    serviceName: "pipeline",
    endpoint: "http://localhost:4318/v1/traces"
  }
}).then({ prompt: "..." }).run();
```

## Decision Tree

```
Process multiple items? → .forEach() or .parallel()
Conditional logic? → .branch() or .switch()
Loop until condition? → .while() or .retryUntil()
Reuse logic? → Create agent builder, compose with .runAgent()
Multiple LLMs? → Set default, override per-step
Autonomous delegation? → Define agents (name/description), use crews
External tools? → Add mcps, let LLM auto-select
Observability? → Use hooks or telemetry
```

## Anti-Patterns

❌ **Breaking out of flow:** Don't pull data and process manually
❌ **Nested runs:** Don't call `.run()` multiple times
❌ **Manual tools:** Don't orchestrate tool calls yourself
❌ **Custom retries:** Use built-in retry patterns
❌ **Manual data passing:** Context flows automatically
❌ **Inline definitions:** Don't define all agents in main file

## Summary

✅ **DO:** Chain `.then()`, use `.forEach()`, `.branch()`, `.parallel()`, define reusable components, compose with `.runAgent()`, use multi-LLM, auto-select tools, built-in retry, hooks/telemetry

❌ **DON'T:** Script around agents, break flow, call `.run()` sequentially, manually orchestrate, pass data manually, use for/while outside Volcano

**Remember:** If scripting around agents, you're missing a pattern. Everything flows through the chain.

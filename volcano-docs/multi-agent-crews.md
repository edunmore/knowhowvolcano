
# Multi-Agent Crews

Advanced patterns for autonomous agent coordination. The coordinator LLM decides which agents to delegate to and when to finish.

## Overview

Define specialized agents with names and descriptions. A coordinator agent autonomously selects and delegates tasks to the appropriate specialists.

```typescript
import { agent, llmOpenAI } from "volcano-sdk";

const researcher = agent({
  llm,
  name: "researcher",
  description: "Finds facts and gathers information"
}).then({ prompt: "Research thoroughly and cite sources" });

const writer = agent({
  llm,
  name: "writer", 
  description: "Creates compelling content"
}).then({ prompt: "Write engaging, clear content" });

// Coordinator picks right agents
const results = await agent({ llm })
  .then({
    prompt: "Create a blog post about renewable energy",
    agents: [researcher, writer]
  })
  .run();
```

## Agent Configuration for Crews

| Option        | Required | Description                                    |
| ------------- | -------- | ---------------------------------------------- |
| `name`        | **Yes**  | Unique identifier (used in delegation)         |
| `description` | **Yes**  | What the agent does (helps coordinator select) |
| `llm`         | No       | Agent's LLM (can differ from coordinator)      |

**Critical:** The `name` must match how you refer to tasks in your prompt.

## Coordinator Mechanics

The SDK provides built-in instructions to the coordinator:

1. **Available agents** with names and descriptions
2. **Delegation syntax:** `USE [agent_name]: [task]`
3. **Completion syntax:** `DONE: [answer]`

You don't need to explain these mechanics — focus on the task.

## Runbook Execution Pattern

For deterministic pipelines, list tasks explicitly:

```typescript
const ingestAgent = agent({ name: "Ingest", description: "Read files" })
  .then({ code: async () => ({ result: { files: 5 }, message: "Completed: Ingested 5 files" }) });

const chunkAgent = agent({ name: "Chunk", description: "Split into pieces" })
  .then({ code: async () => ({ result: { chunks: 42 }, message: "Completed: Created 42 chunks" }) });

await agent({ llm })
  .then({
    prompt: `Execute in order:
1. Ingest
2. Chunk
3. Extract`,
    agents: [ingestAgent, chunkAgent, extractAgent]
  })
  .run();
```

The coordinator executes each step sequentially, reporting results.

## Crew Loops (Retry Until Completion)

The coordinator can repeat an agent until it signals completion:

```typescript
// Prompt with loop instruction
prompt: `Execute:
1. Initialize
2. Process - REPEAT until "Completed:" appears in output
   - If "Working on it...", call Process again
   - If "Completed:", continue
3. Finalize`

// Agent with progress reporting
const processAgent = agent({ name: "Process", description: "Process data" })
  .then({
    code: async () => {
      attempts++;
      if (attempts < 3) {
        return { result: { progress: attempts }, message: "Working on it..." };
      }
      return { result: { done: true }, message: "Completed: Processing finished" };
    }
  });
```

The coordinator understands the pattern and loops 3 times until seeing "Completed:".

## Code Agents in Crews

> **Note:** Code steps are a custom extension (see `code-step.md`).

Code agents are ideal for crews because:

1. **Zero LLM overhead** — Fast execution
2. **Predictable output** — Consistent completion signals
3. **Rich context** — Return both data and messages

```typescript
const myAgent = agent({ name: "TaskName", description: "What it does" })
  .then({
    code: async () => ({
      result: { /* data for context */ },
      message: "Completed: Clear signal for coordinator"
    })
  });
```

The `message` field becomes visible to the coordinator as agent output.

## Prompting Best Practices

### ✅ DO: Simple Task Lists

```
Execute in order:
1. Ingest
2. Chunk  
3. Extract
```

### ❌ DON'T: Redundant Instructions

```
Execute: 1. Ingest 2. Chunk
When finished, respond with DONE    ← SDK handles this
Make sure to use USE command        ← SDK handles this
```

The SDK already instructs the coordinator on `USE`/`DONE` syntax. Over-explaining confuses the LLM.

## Agent Output Visibility

| Agent Type               | Coordinator Sees |
| ------------------------ | ---------------- |
| LLM steps only           | Last `llmOutput` |
| Code step (basic)        | `[no output]`    |
| Code step with `message` | The message text |

**Recommendation:** Always return `{result, message}` in crew agents.

## Performance Comparison

Tested with 3-step runbook:

| Coordinator LLM | Tokens | Duration |
| --------------- | ------ | -------- |
| DeepSeek V3.2   | 50     | 4.2s     |
| GPT-5-nano      | 69     | 30.7s    |

Both models work correctly with clean prompting.

## Configuration Options

| Option               | Type           | Default | Description                     |
| -------------------- | -------------- | ------- | ------------------------------- |
| `agents`             | AgentBuilder[] | -       | Available agents for delegation |
| `maxAgentIterations` | number         | 10      | Max delegation cycles           |

## Error Handling

If an agent fails, the coordinator receives context about the failure and can decide to retry, skip, or fail the workflow.

## Real-World Example

```typescript
// Research pipeline with specialized agents
const gatherAgent = agent({
  name: "Gather",
  description: "Collect source materials"
}).then({ code: async () => await gatherSources() });

const analyzeAgent = agent({
  name: "Analyze", 
  description: "Deep analysis of materials"
}).then({ llm: expensiveLLM, prompt: "Analyze thoroughly" });

const synthesizeAgent = agent({
  name: "Synthesize",
  description: "Combine findings into report"  
}).then({ llm: cheapLLM, prompt: "Create summary report" });

// Coordinator orchestrates
const report = await agent({ llm: coordinatorLLM })
  .then({
    prompt: "Research AI safety: 1. Gather 2. Analyze 3. Synthesize",
    agents: [gatherAgent, analyzeAgent, synthesizeAgent]
  })
  .run();
```

---
description: Best practices for using Volcano SDK (Chaining, MCP, Multi-Agent)
---

# AGENTS.md — Volcano SDK best practices (derived from the official examples)

This file is meant to guide humans and coding agents when authoring workflows with the Volcano SDK (TypeScript). It follows the same usage patterns shown in the project’s “Hello World with Automatic Tool Selection” and “Multi‑Agent Coordinator” examples, plus the multi‑LLM chain pattern described by Kong.

## Mental model

Volcano workflows are readable, promise-like chains. You create a base agent with `agent({ llm, ... })`, add one or more `.then({ ... })` steps, and execute with `.run()`. Each step can add a `prompt`, optionally provide MCP tool servers via `mcps`, optionally swap the `llm`, or delegate to sub‑agents via `agents`. Context is carried forward so later steps can reference earlier results without manually stitching state.

## Setup that scales

Use environment variables for credentials (for example `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`), and keep secrets out of code and git history. Prefer a checked-in `.env.example` that lists required variables without values. When running locally, load env vars via your preferred mechanism (shell, dotenv in an app entrypoint, CI secrets in pipelines).

When using MCP, treat each MCP server like an external dependency: it should have a stable URL, clear tool descriptions, predictable errors, and a health endpoint (or at least a lightweight “ping” tool) so workflows can fail fast before expensive LLM work.

## Step design

A good Volcano chain reads like intent. Keep each `.then()` step single‑purpose and bounded.

Do this:
- One step to interpret/plan, one step to act, one step to format/report.
- Pass tools only where needed (`mcps: [...]` on the steps that should be allowed to call tools).
- Override the model per step when different strengths are required (planner vs writer vs classifier).

Avoid this:
- A single step that mixes planning, tool execution, and final formatting.
- Giving every step access to every MCP server “just in case”.
- Tool calls with side effects in ambiguous prompts.

### Recommended baseline structure

1) Plan / analyze (often a smaller fast model, no tools unless required).
2) Execute actions with tools (explicitly provide only the MCP servers needed).
3) Produce final output (possibly a “writer” model, no tools).

This matches the canonical multi‑LLM chain idea (plan with one provider, write with another, act with tools where needed).

## MCP tool use: safety and reliability

Volcano can do “automatic tool selection” when you provide `mcps` on a step. That makes prompt clarity and tool hygiene the main reliability lever.

Practical rules:
- Tool surface minimization: give the LLM the smallest tool set that can solve the step.
- Side‑effect containment: when a tool mutates state (create ticket, post message, charge card), make the prompt require an explicit confirmation token (“ONLY call the tool after producing a final one‑sentence confirmation of the action”) or split into a dry‑run step followed by a commit step.
- Idempotency: prefer tools that accept an idempotency key, or design prompts to include a unique run id and pass it to tools so retries do not duplicate actions.
- Deterministic inputs: tell the LLM to pass exact parameters (no “approximately”, no free‑text if the tool expects enums).
- Failure shaping: if a tool fails, have the prompt instruct the model to summarize the error and propose the next best tool call rather than looping blindly.

## Multi‑agent crews: when and how

Use crews when the work naturally decomposes into specialist roles (research vs writing, extraction vs synthesis). Define each specialist as its own agent with a `name` and `description` so the coordinator has a clear routing signal.

Best practice patterns:
- Specialists should be narrow and predictable; keep their prompts focused on one kind of output.
- The coordinator prompt should define the deliverable and quality bar, not the internal plan.
- If output format matters, enforce it at the final step (either the coordinator’s last step or a dedicated formatter agent), not inside every specialist.

## Conversational results: prefer `summary()` / `ask()` over brittle parsing

The examples demonstrate inspecting outcomes via:
- `results.summary(llm)` for a high-level explanation of what happened.
- `results.ask(llm, "...")` to query the run and retrieve the final artifact.

Use this approach when humans need to audit or iterate quickly. When a machine needs strict structure, still ask for explicit structured output in the prompt (and validate it before use).

## Production behavior

Volcano is designed to be production-friendly (retries, timeouts, connection pooling, observability). To keep that reliability in your own code:

- Set clear time budgets per run and per tool call; prefer failing fast over hanging.
- Treat retries as a correctness feature, not only availability; only retry idempotent operations unless you have an idempotency key.
- Log both the final answer and the run summary; summaries are often the best debugging artifact.
- Keep prompts versioned (store prompts in code, not only in chat history) so you can reproduce behavior.

## Observability

Enable OpenTelemetry export early in a project so you can answer: which step was slow, which tool failed, which provider/model was used, and how often retries happen. Even in small projects, add a run identifier and propagate it into tool parameters and logs.

## Testing and evaluation

You will get the most leverage by testing the boundaries between LLM steps and tools.

Recommended approach:
- Mock MCP servers in tests, or run local stub servers that implement the same tool schemas.
- Snapshot the “contract” between steps (what each step should provide to the next), and validate that later steps still succeed when earlier output varies slightly.
- Keep at least one end‑to‑end “smoke” test that hits real providers/tools behind a CI flag, so regressions are caught before shipping.

## Reference patterns (as code)

### Automatic tool selection with MCP servers

```ts
import { agent, llmOpenAI, mcp } from "volcano-sdk";

const llm = llmOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
});

const weather = mcp("http://localhost:8001/mcp");
const tasks = mcp("http://localhost:8002/mcp");

const results = await agent({ llm })
  .then({
    prompt:
      "What's the weather in Seattle? If it will rain, create a task to bring an umbrella.",
    mcps: [weather, tasks],
  })
  .run();

console.log(await results.summary(llm));
```

### Multi-agent coordinator (specialists + coordinator)

```ts
import { agent, llmOpenAI } from "volcano-sdk";

const llm = llmOpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const researcher = agent({
  llm,
  name: "researcher",
  description: "Finds facts and data",
})
  .then({ prompt: "Research the topic." })
  .then({ prompt: "Summarize the research." });

const writer = agent({ llm, name: "writer", description: "Creates content" }).then({
  prompt: "Write content.",
});

const results = await agent({ llm })
  .then({
    prompt: "Write a blog post about quantum computing",
    agents: [researcher, writer],
  })
  .run();

console.log(await results.ask(llm, "Show me the final blog post"));
```

### Multi-provider step switching (planner → executor → action)

```ts
import { agent, llmOpenAI, llmAnthropic, mcp } from "volcano-sdk";

const planner = llmOpenAI({
  model: "gpt-5-mini",
  apiKey: process.env.OPENAI_API_KEY!,
});

const executor = llmAnthropic({
  model: "claude-4.5-sonnet",
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const db = mcp("https://api.company.com/database/mcp");
const slack = mcp("https://api.company.com/slack/mcp");

await agent({ llm: planner })
  .then({ prompt: "Analyze last week's sales data.", mcps: [db] })
  .then({ llm: executor, prompt: "Write an executive summary." })
  .then({ prompt: "Post the summary to #executives.", mcps: [slack] })
  .run();
```

## One-page checklist

Before shipping a workflow, confirm:
- Each step has a single intent and minimal tool access.
- Tool steps are idempotent or use an idempotency key/run id.
- Side effects are gated (dry-run then commit, or explicit confirmation in prompt).
- You can explain what happened via `results.summary(llm)` and retrieve artifacts via `results.ask(llm, ...)`.
- Credentials are only in environment variables and are not logged.
- Timeouts/retries are configured to match your tool semantics.
- Tracing/metrics are enabled, or at least a run id is logged.

## Sources

- Volcano SDK README (Quick Start, automatic tool selection, multi-agent coordinator): https://github.com/Kong/volcano-sdk
- Kong blog post introducing Volcano SDK (multi-provider chain example): https://konghq.com/blog/product-releases/volcano

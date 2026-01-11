# Architecture

**Last Updated**: 2026-01-11  
**Status**: Pre-refactoring to Volcano SDK patterns

---

## Overview

Canon-Aware Knowledge Extraction Pipeline using Volcano SDK. Extracts structured knowledge from educational content, producing a Zettelkasten-style vault with interlinked notes.

---

## Current Architecture (Pre-Volcano Refactor)

### Entry Point
```
src/systems/research/cli.ts   # CLI entry point
  → runbook-runner.ts         # Loads and executes YAML runbooks
  → step-executors.ts         # Dispatches to step handlers
```

### Agents (To Be Refactored)
```
src/systems/research/agents/
├── ingestor.ts        # Source ingestion (create anchor)
├── extractor.ts       # Candidate extraction from chunks
├── modeler.ts         # Note modeling (structure candidates)
├── verifier.ts        # Source grounding verification
├── linker.ts          # Link resolution + stub creation
├── link-resolver.ts   # Link resolution utilities
└── chunk-gate.ts      # GPT-5-nano classification (FULL_MODEL/SKIP)
```

### Providers (Volcano-Compatible)
```
src/core/providers/
├── azure-deepseek-provider.ts   # DeepSeek V3.2 (extraction, modeling)
├── azure-gpt5-nano-provider.ts  # GPT-5-nano (gating, stubs)
├── azure-gpt52-provider.ts      # GPT-5-2
├── azure-embedding-provider.ts  # embed-v-4-0 (embeddings)
├── gemini-cli-provider.ts       # Gemini CLI wrapper
├── deepseek-tools-provider.ts   # DeepSeek with tool calling
└── ollama-provider.ts           # Local Ollama
```

### Utilities
```
src/systems/research/utils/
├── vector-store.ts         # SQLite-vec for embeddings
├── embedding-dedup.ts      # Deduplication logic
├── phase1-validator.ts     # Output validation
├── naming.ts               # ID/filename generation
├── chunker.ts              # Document chunking
├── window-assembler.ts     # Sliding window context
└── vault-utils.ts          # Vault folder helpers
```

---

## Target Architecture (Post-Volcano Refactor)

### New Structure
```
src/
├── agents/                    # Volcano agent definitions
│   ├── chunking.ts           # Chunking agents
│   ├── extracting.ts         # Extraction/modeling
│   ├── embedding.ts          # Embedding providers
│   └── verification.ts       # Verification agents
├── workflows/                 # Volcano orchestration
│   ├── vnext-pipeline.ts     # Main extraction pipeline
│   └── validation.ts         # Validation workflows
├── core/providers/           # LLM providers (existing)
└── index.ts
```

### Key Principles
1. **Agent definitions separate from workflows** (see `/volcano-code-organization`)
2. **Use Volcano patterns**: `.then()`, `.forEach()`, `.branch()`, `.parallel()`
3. **No scripting around agents** - everything through fluent API
4. **Multi-LLM cost optimization** - cheap models for preprocessing, expensive for reasoning

---

## Data Flow

```
Source Document
    ↓
[ingest] → Source Anchor
    ↓
[chunk] → Chunks (~2000 chars each)
    ↓
[gate] → Classified (FULL_MODEL/SKIP)
    ↓
[model_bundle] → Extracted + Modeled Notes (with dedup)
    ↓
[verify] → Verified Notes (pass/fail)
    ↓
[link] → Linked Notes + Stubs
    ↓
[emergent_artifacts] → MOCs, Bridges, Trails
    ↓
[index] → Vault Index + Vector DB
```

---

## Storage

- **Template Vault**: `src/systems/research/vault/`
- **Run Outputs**: `./vault-{name}/_runs/`
- **Vector Index**: `./vault-{name}/_index/vectors.db`
- **Runbooks**: `_system/runbooks/*.yml`
- **Prompts**: `_system/prompts/*.md`

---

## Observability

- Runbook step timing in run.json
- JSONL event stream per run (planned)
- OpenTelemetry traces (via Volcano telemetry config)

---

## References

- `.agent/workflows/volcano-agents.md` - Mandatory Volcano patterns
- `.agent/workflows/volcano-code-organization.md` - File structure
- `.agent/workflows/volcano-custom-providers.md` - Building providers
- `volcano-docs/` - Full Volcano SDK documentation

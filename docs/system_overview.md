# System Overview: Canon-Aware Knowledge Extraction Pipeline

## Purpose

The system extracts structured knowledge from educational content (books, articles, training materials) and produces a Zettelkasten-style vault of interlinked notes. The output is designed for use by educators, instructional designers, or anyone building knowledge bases from source material.

**Evidence:** `package.json:4` — *"Canon-Aware Knowledge Extraction Pipeline using Volcano SDK"*

## Problem Statement

Organizations possess educational content (e.g., internal training, books, webinars) but struggle to:
1. Extract discrete, reusable knowledge atoms from prose
2. Connect related concepts across different sources
3. Avoid duplicating notes for semantically equivalent concepts
4. Produce notes that are grounded in source material, not hallucinated

**Evidence:** `README.md:3` — *"Extracts structured knowledge from educational content using AI, creating a Zettelkasten-style vault with linked notes."*

## What the System Produces

For each source document, the pipeline outputs:

| Artifact Type | Description | Folder |
|---------------|-------------|--------|
| **Concepts** | Core ideas, definitions, abstractions | `concepts/` |
| **Procedures** | Step-by-step how-to methods | `procedures/` |
| **Principles** | Heuristics, rules of thumb | `principles/` |
| **Misconceptions** | Common errors, myths | `misconceptions/` |
| **Examples** | Concrete scenarios, case studies | `examples/` |
| **Stubs** | Placeholder notes for referenced but undefined concepts | `stubs/` |
| **MOCs** | Maps of Content linking notes from a source | `slipbox/mocs/` |
| **Bridges** | Explicit links between two related notes | `slipbox/bridges/` |
| **Trails** | Suggested learning sequences | `slipbox/trails/` |
| **Source Anchors** | Metadata records of ingested sources | `sources/` |
| **Vector Index** | SQLite-vec database for semantic search | `_index/vectors.db` |

**Evidence:** Verified run at `benchmark/run-2026-01-09-1259/` produced 10 notes, 5 stubs, 1 MOC, 1 bridge, 1 trail.  
**Evidence:** `utils/vault-utils.ts:37-47` — VAULT_LAYOUT constant defines folder structure.

## Definition of "Done" for a Run

A pipeline run is considered complete when:

1. **All runbook steps execute successfully** — 9/9 steps for `vnext-pipeline`
2. **Notes are created and verified** — pass_rate ≥ 0.8 (configurable threshold)
3. **Links are resolved** — either matched to existing notes or stubs created
4. **Vault index is built** — `_index/notes.json` and `_index/backlinks.json` populated
5. **Vector index is populated** — `_index/vectors.db` contains embeddings for all notes
6. **Run result persisted** — `_runs/runbooks/{runbook_id}/run-{timestamp}/run.json`

**Evidence:** `vnext-pipeline.yml:78-82` — evaluation thresholds: `notes_created: 1`, `pass_rate: 0.8`  
**Evidence:** `runbook-runner.ts:44-63` — `RunbookRunResult` defines status values: `completed`, `failed`, `stopped_at_gate`, `budget_exceeded`

## Key Capabilities

### 1. Runbook-Driven Orchestration
Pipelines are defined declaratively as YAML runbooks. Steps execute sequentially with conditional logic and evaluation gates.

**Evidence:** `src/systems/research/vault/_system/runbooks/vnext-pipeline.yml`

### 2. Embedding-Based Deduplication
Before creating notes, candidates are checked against existing notes using cosine similarity (threshold 0.7). Duplicates are skipped or merged.

**Evidence:** `utils/embedding-dedup.ts:109-222` — `checkDuplicate()` function with tiered thresholds

### 3. Source Grounding Verification
Notes are verified against source material to prevent hallucination. A two-stage check validates schema compliance and source grounding.

**Evidence:** `agents/verifier.ts:76-122` — grounding verification step

### 4. Multi-Model Architecture
Different LLMs handle different tasks based on complexity and cost:
- **DeepSeek-V3.2**: Extraction, modeling, verification (high capability)
- **GPT-5-nano**: Gating, stub generation (fast, cheap)
- **Azure embed-v-4-0**: Embeddings for deduplication

**Evidence:** `README.md:72-75` — provider assignments  
**Evidence:** Provider files in `src/core/providers/`

### 5. Sliding Window Context
Large documents are chunked (~2500 chars), and the modeler receives sliding windows (prev + current + next chunk) for context.

**Evidence:** `utils/window-assembler.ts` — window assembly logic  
**Evidence:** `step-executors.ts:571-572` — `assembleWindows()` call

## System Boundaries

### In Scope
- Markdown source files (single-file input)
- 5 extraction note types + 5 rendition types
- Local vault storage (filesystem)
- SQLite-vec for vector search

### Out of Scope (as of Jan 2026)
- Multi-file directory ingestion (placeholder exists)
- Database storage (files are source of truth)
- Web UI (CLI only)
- Real-time processing (batch-oriented)

**Evidence:** `step-executors.ts:124-127` — *"Directory chunking not yet implemented"*

## Technology Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (TypeScript via tsx) |
| LLM Framework | Volcano SDK |
| Vector DB | SQLite-vec (sqlite-vec + better-sqlite3) |
| Templating | Handlebars (for prompts) |
| Config | YAML (js-yaml) |
| API | Azure OpenAI (DeepSeek, GPT-5-nano, embed-v-4-0) |

**Evidence:** `package.json:22-35` — dependencies

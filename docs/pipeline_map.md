# Pipeline Map: vNext Pipeline (v2.0)

This document describes the extraction pipeline stages as implemented in `vnext-pipeline.yml`.

**Evidence:** `src/systems/research/vault/_system/runbooks/vnext-pipeline.yml`

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           vNext Pipeline (v2.0)                              │
│                                                                              │
│  Source File                                                                 │
│      │                                                                       │
│      ▼                                                                       │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────────┐              │
│  │ ingest  │───▶│  chunk  │───▶│  gate   │───▶│ model_bundle │              │
│  └─────────┘    └─────────┘    └─────────┘    └──────────────┘              │
│                                                       │                      │
│                                                       ▼                      │
│  ┌─────────┐    ┌─────────────────┐    ┌─────────┐ ┌────────┐              │
│  │  link   │◀───│ emit_candidates │◀───│ verify  │◀┘        │              │
│  └─────────┘    └─────────────────┘    └─────────┘          │              │
│       │                                                      │              │
│       ▼                                                      │              │
│  ┌───────────────────┐    ┌─────────┐                       │              │
│  │ emergent_artifacts│───▶│  index  │───▶ Done              │              │
│  └───────────────────┘    └─────────┘                       │              │
│                                                              │              │
│                           Vector Store ◀─────────────────────┘              │
│                          (_index/vectors.db)                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Stage 1: Ingest

**Responsibility:** Create a source anchor and copy raw content to the vault.

| Attribute | Value |
|-----------|-------|
| Step ID | `ingest` |
| Executor | `registerStepExecutor('ingest', ...)` |
| LLM | None (no LLM call) |

### Inputs
| Input | Source | Required |
|-------|--------|----------|
| `file` | CLI `--file` arg | Yes |

### Outputs
| Output | Shape | Location |
|--------|-------|----------|
| `sourceId` | `source-{filename}-{hash}` | Context |
| `sourcePath` | Absolute path | `sources/source-{hash}.md` |
| `rawPath` | Absolute path | `_sources/{sourceId}/raw.md` |
| `contentHash` | SHA1 hex | Context |

### Key Files
- Agent: `agents/ingestor.ts`
- Prompt: `_system/prompts/prompt-ingest.md`

### Validation
None (deterministic file copy).

### Failure Modes
| Failure | Surface |
|---------|---------|
| File not found | Step fails, `error` in result |
| Permission error | Step fails with OS error |

**Evidence:** `step-executors.ts:51-74`

---

## Stage 2: Chunk

**Responsibility:** Split source content into smaller chunks for processing.

| Attribute | Value |
|-----------|-------|
| Step ID | `chunk` |
| Executor | `registerStepExecutor('chunk', ...)` |
| LLM | None (deterministic) |

### Inputs
| Input | Source | Default |
|-------|--------|---------|
| `file` | CLI arg / context | Required |
| `chunkSize` | Runbook input | 2500 chars |
| `minChunk` | Runbook input | 800 chars |

### Outputs
| Output | Shape | Location |
|--------|-------|----------|
| `totalChunks` | Integer | Context |
| `sourceId` | `src_{hash12}` | Context |
| `sourceContent` | Full text | Context (for downstream) |
| Chunk files | Markdown | `_sources/{sourceId}/chunks/{seq}.md` |
| `manifest.json` | JSON | `_sources/{sourceId}/manifest.json` |

### Chunk Metadata (frontmatter)
```yaml
id: chunk_{sourceId}_{seq}
type: source_chunk
source_id: src_...
seq: 000000
start_char: 0
end_char: 2500
sha1: "abc123..."
```

### Key Files
- Utility: `utils/chunker.ts`

### Failure Modes
| Failure | Surface |
|---------|---------|
| Empty file | 0 chunks, but step succeeds |
| Read error | Step fails |

**Evidence:** `step-executors.ts:79-148`, `utils/chunker.ts:121-183`

---

## Stage 3: Gate

**Responsibility:** Classify chunks into processing tiers to optimize LLM usage.

| Attribute | Value |
|-----------|-------|
| Step ID | `gate` |
| Executor | `registerStepExecutor('gate', ...)` |
| LLM | **GPT-5-nano** |

### Classifications
| Decision | Meaning |
|----------|---------|
| `FULL_MODEL` | Full extraction and modeling |
| `LIGHT_SCAN` | Quick scan for references (not implemented) |
| `SKIP` | No valuable content (ToC, acknowledgments, etc.) |

### Fast Mode
Sources < 10kb skip gating entirely — all chunks marked `FULL_MODEL`.

**Evidence:** `step-executors.ts:183-203`

### Inputs
| Input | Source |
|-------|--------|
| `chunks` | From context (`from_context`) |
| Source chunks | Loaded from `_sources/{sourceId}/chunks/` |

### Outputs
| Output | Shape |
|--------|-------|
| `gated_chunks` | Integer |
| `full_model` | Count of FULL_MODEL chunks |
| `light_scan` | Count of LIGHT_SCAN chunks |
| `skip` | Count of SKIP chunks |
| `fast_mode` | Boolean (if < 10kb) |

### Key Files
- Agent: `agents/chunk-gate.ts`
- Prompt: `_system/prompts/prompt-chunk-gate.md`

### Failure Modes
| Failure | Surface |
|---------|---------|
| LLM rate limit | Retry with backoff (3 attempts) |
| Parse error | Chunk gets no decision, logged as warning |

**Evidence:** `step-executors.ts:153-241`

---

## Stage 4: Model Bundle

**Responsibility:** Extract candidates and model notes using sliding windows. This is the core extraction stage.

| Attribute | Value |
|-----------|-------|
| Step ID | `model_bundle` |
| Executor | `registerStepExecutor('model_bundle', ...)` |
| LLM | **DeepSeek-V3.2** (extraction + modeling) |

### Sliding Window Assembly
Each FULL_MODEL chunk is processed with context: `[prev_chunk] + [current_chunk] + [next_chunk]`

**Evidence:** `utils/window-assembler.ts`

### Substeps (per window)
1. **Extract candidates** — identify concepts, procedures, etc.
2. **Dedup check** — query vector store for duplicates
3. **Model note** — generate full note content
4. **Verify inline** — check schema and grounding
5. **Index note** — add to vector store

### Deduplication Thresholds
| Similarity | Action |
|------------|--------|
| ≥ 0.9 | MERGE into existing note |
| 0.7–0.9 | LLM verification (GPT-5-nano) |
| < 0.7 | CREATE new note |
| 0.5–0.7 | LINK_RELATED (create but link) |

**Evidence:** `utils/embedding-dedup.ts:107-223`

### Inputs
| Input | Source | Default |
|-------|--------|---------|
| `sourceId` | From context | Auto-detected |
| `max_notes_per_chunk` | Runbook input | 5 |
| `dedup_threshold` | Runbook input | 0.7 |

### Outputs
| Output | Shape | Location |
|--------|-------|----------|
| `notes_created` | Integer | Context |
| `notes` | Array of paths | Context |
| `windows_processed` | Integer | Context |
| `duplicates_skipped` | Integer | Context |
| Note files | Markdown | `{type}s/{id}.md` |

### Key Files
- Extractor: `agents/extractor.ts`
- Modeler: `agents/modeler.ts`
- Window assembler: `utils/window-assembler.ts`
- Embedding dedup: `utils/embedding-dedup.ts`
- Prompts: `prompt-extract-candidates.md`, `prompt-model-artifact.md`

### Note Frontmatter Schema
```yaml
verified: true
verified_at: 2026-01-09T...
id: outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_..."
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["keyword1", "keyword2", "keyword3"]
```

**Evidence:** `step-executors.ts:542-745`, sample note at `benchmark/run-2026-01-09-1259/concepts/outcome-ladder.md`

### Failure Modes
| Failure | Surface |
|---------|---------|
| Rate limit | Retry with backoff |
| Parse error | Candidate skipped, logged |
| Verification failure | Note kept with warning (max 1 retry) |

---

## Stage 5: Verify

**Responsibility:** Validate notes against schema and source grounding.

| Attribute | Value |
|-----------|-------|
| Step ID | `verify` |
| Executor | `registerStepExecutor('verify', ...)` |
| LLM | **DeepSeek-V3.2** |

### Verification Checks
1. **Schema check** — frontmatter fields, section structure
2. **Grounding check** — claims traceable to source text

### Optimization (M4)
Notes verified during `model_bundle` (marked `verified: true`) are skipped.

**Evidence:** `step-executors.ts:768-776`

### Inputs
| Input | Source |
|-------|--------|
| `notes` | Array of note paths from context |
| `sourceContent` | Full source text |

### Outputs
| Output | Shape |
|--------|-------|
| `verified` | Count of passed notes |
| `failed` | Count of failed notes |
| `skipped` | Count of pre-verified notes |
| `pass_rate` | Float (0.0–1.0) |

### Key Files
- Agent: `agents/verifier.ts`
- Prompts: `prompt-verify-note.md`, `prompt-verify-grounding.md`

### Failure Modes
| Failure | Surface |
|---------|---------|
| pass_rate < threshold | Run stops if evaluation gate fails |

**Evidence:** `step-executors.ts:751-802`, `vnext-pipeline.yml:81-82`

---

## Stage 6: Link

**Responsibility:** Resolve wiki-links and create stubs for undefined references.

| Attribute | Value |
|-----------|-------|
| Step ID | `link` |
| Executor | `registerStepExecutor('link', ...)` |
| LLM | **GPT-5-nano** (stub generation only) |

### Link Resolution Flow
1. Scan all notes for `[[...]]` links and `LINK_INTENTS`
2. Check exact match by filename/ID
3. Check semantic match via vector store (threshold 0.7)
4. If no match → create stub in `stubs/`

### Inputs
None explicit (reads from vault).

### Outputs
| Output | Shape | Location |
|--------|-------|----------|
| `stubs_created` | Integer | Context |
| `links_resolved` | Integer | Context |
| Stub files | Markdown | `stubs/stub-{id}.md` |

### Key Files
- Agent: `agents/linker.ts`
- Link resolver: `agents/link-resolver.ts`
- Prompt: `_system/prompts/prompt-create-stub.md`

**Evidence:** `step-executors.ts:807-830`, `agents/linker.ts:54-257`

---

## Stage 7: Emit Candidates

**Responsibility:** Extract LINK_INTENTS from notes and emit candidate notes to incubator.

| Attribute | Value |
|-----------|-------|
| Step ID | `emit_candidates` |
| Executor | `registerStepExecutor('emit_candidates', ...)` |
| LLM | None (deterministic parsing) |

### Process
1. Parse `LINK_INTENTS` JSON from each note
2. Filter by `stub_policy`
3. Create candidate entries

### Inputs
| Input | Source |
|-------|--------|
| `notes` | Array of note paths |

### Outputs
| Output | Shape |
|--------|-------|
| `candidates_created` | Integer |
| `candidates_skipped` | Integer |

### Key Files
- Utility: `utils/candidate-emitter.ts`

**Evidence:** `step-executors.ts:836-919`

---

## Stage 8: Emergent Artifacts

**Responsibility:** Generate Zettelkasten navigation structures (MOCs, bridges, trails).

| Attribute | Value |
|-----------|-------|
| Step ID | `emergent_artifacts` |
| Executor | `registerStepExecutor('emergent_artifacts', ...)` |
| LLM | **DeepSeek-V3.2** |

### Artifact Types
| Type | Purpose | Location |
|------|---------|----------|
| MOC | Map of Content for source | `slipbox/mocs/moc-{sourceId}.md` |
| Bridge | Explicit link between 2 notes | `slipbox/bridges/bridge-{a}-{b}.md` |
| Trail | Suggested learning sequence | `slipbox/trails/trail-{sourceId}.md` |
| Strand | Thematic grouping | `slipbox/strands/` |

### Inputs
| Input | Source |
|-------|--------|
| `sourceId` | From context |
| `notes` | Array of note paths |

### Outputs
| Output | Shape |
|--------|-------|
| `strands` | Count |
| `mocs` | Count |
| `bridges` | Count |
| `trails` | Count |
| `paths` | Array of created files |

### Key Files
- Utility: `utils/emergent-artifacts.ts`

**Evidence:** `step-executors.ts:924-949`

---

## Stage 9: Index

**Responsibility:** Build vault graph index for navigation and search.

| Attribute | Value |
|-----------|-------|
| Step ID | `index` |
| Executor | `registerStepExecutor('index', ...)` |
| LLM | None (deterministic) |

### Process
1. Scan all markdown files in vault
2. Extract frontmatter (id, type, title)
3. Extract `[[...]]` outbound links
4. Build backlinks map

### Inputs
None explicit.

### Outputs
| Output | Shape | Location |
|--------|-------|----------|
| `indexed` | Count of notes | Context |
| Notes index | JSON array | `_index/notes.json` |
| Backlinks | JSON object | `_index/backlinks.json` |

### Index Entry Schema
```json
{
  "id": "outcome-ladder",
  "path": "concepts/outcome-ladder.md",
  "title": "outcome-ladder",
  "type": "concept",
  "outboundLinks": ["7-Minute Microlearning Loop", "Friction Budget"]
}
```

### Key Files
- Utility: `utils/indexer.ts`

**Evidence:** `step-executors.ts:954-981`, `benchmark/run-2026-01-09-1259/_index/notes.json`

---

## Global Configuration

Defined in `vnext-pipeline.yml:23-26`:

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `token_budget` | 100,000 | Max tokens for run |
| `cost_ceiling` | $5.00 | Max cost for run |
| `time_ceiling_seconds` | 1200 | Max duration (20 min) |

### Evaluation Gates

| Stage | Metric | Threshold |
|-------|--------|-----------|
| `model_bundle` | `notes_created` | ≥ 1 |
| `verify` | `pass_rate` | ≥ 0.8 |

If evaluation fails, run status becomes `stopped_at_gate`.

**Evidence:** `vnext-pipeline.yml:78-82`, `runbook-runner.ts:294-302`

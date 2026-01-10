# Data Lineage

This document traces the transformation of data from raw source to final vault artifacts.

---

## Lineage Overview

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW                                           │
│                                                                               │
│  Input File                                                                   │
│  (./content.md)                                                               │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         INGEST                                           │ │
│  │  sources/source-{name}-{hash}.md  ←── Source Anchor (metadata)          │ │
│  │  _sources/{sourceId}/raw.md       ←── Raw copy                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         CHUNK                                            │ │
│  │  _sources/{sourceId}/chunks/000000.md  ←── Chunk 0                      │ │
│  │  _sources/{sourceId}/chunks/000001.md  ←── Chunk 1                      │ │
│  │  _sources/{sourceId}/manifest.json     ←── Chunk manifest               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         GATE                                             │ │
│  │  Chunk metadata updated in-place:                                        │ │
│  │    decision: FULL_MODEL | LIGHT_SCAN | SKIP                             │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      MODEL_BUNDLE                                        │ │
│  │                                                                          │ │
│  │  [Per Chunk Window]                                                      │ │
│  │     │                                                                    │ │
│  │     ├──▶ Candidates (in-memory JSON)                                    │ │
│  │     │      └── { type, name, quote, reason }[]                          │ │
│  │     │                                                                    │ │
│  │     ├──▶ Vector Query → Dedup Decision                                  │ │
│  │     │      └── SKIP | MERGE | CREATE | LINK_RELATED                     │ │
│  │     │                                                                    │ │
│  │     └──▶ Note Files                                                     │ │
│  │            concepts/{id}.md                                             │ │
│  │            procedures/{id}.md                                           │ │
│  │            principles/{id}.md                                           │ │
│  │            misconceptions/{id}.md                                       │ │
│  │            examples/{id}.md                                             │ │
│  │                                                                          │ │
│  │  _index/vectors.db  ←── Notes indexed after creation                    │ │
│  │  _index/duplicates-found.json  ←── Duplicate tracking                   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                     LINK + EMIT_CANDIDATES                               │ │
│  │                                                                          │ │
│  │  stubs/stub-{id}.md  ←── Stub notes for unresolved links                │ │
│  │  (stubs also indexed in vectors.db)                                     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                   EMERGENT_ARTIFACTS                                     │ │
│  │                                                                          │ │
│  │  slipbox/mocs/moc-{sourceId}.md      ←── Map of Content                 │ │
│  │  slipbox/bridges/bridge-{a}-{b}.md   ←── Note bridges                   │ │
│  │  slipbox/trails/trail-{sourceId}.md  ←── Learning trails               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         INDEX                                            │ │
│  │                                                                          │ │
│  │  _index/notes.json      ←── All notes with outbound links               │ │
│  │  _index/backlinks.json  ←── target → sources[] mapping                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│       │                                                                       │
│       ▼                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                      RUN ARTIFACTS                                       │ │
│  │                                                                          │ │
│  │  _runs/runbooks/{runbook_id}/run-{timestamp}/                           │ │
│  │    ├── run.json          ←── Full run result                            │ │
│  │    ├── decisions.json    ←── Orchestrator decisions (if any)            │ │
│  │    └── step_reports/                                                    │ │
│  │          ├── ingest.json                                                │ │
│  │          ├── chunk.json                                                 │ │
│  │          ├── gate.json                                                  │ │
│  │          ├── model_bundle.json                                          │ │
│  │          ├── verify.json                                                │ │
│  │          ├── link.json                                                  │ │
│  │          ├── emit_candidates.json                                       │ │
│  │          ├── emergent_artifacts.json                                    │ │
│  │          └── index.json                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Artifact Schemas

### Source Anchor (`sources/source-{name}-{hash}.md`)

```yaml
---
id: source-benchmark-source-nohints-38e4b47a
type: source_anchor
import_date: "2026-01-09T..."
original_filename: "benchmark_source_nohints.md"
content_hash: "38e4b47a40f0..."
title: "Benchmark Source Nohints"
---
# Benchmark Source Nohints

Details about the source...
```

**Evidence:** `benchmark/run-2026-01-09-1259/sources/source-benchmark-source-nohints-38e4b47a.md`

---

### Chunk File (`_sources/{sourceId}/chunks/{seq}.md`)

```yaml
---
id: chunk_src_38e4b47a40f0_000000
type: source_chunk
source_id: src_38e4b47a40f0
seq: 000000
start_char: 0
end_char: 2500
sha1: "abc123def456"
decision: FULL_MODEL
gate_confidence: 0.95
---

# Section Heading

Chunk content...
```

**Evidence:** `utils/chunker.ts:188-213` — `formatChunkFrontmatter()`

---

### Source Manifest (`_sources/{sourceId}/manifest.json`)

```json
{
  "source_id": "src_38e4b47a40f0",
  "original_path": "/path/to/file.md",
  "original_filename": "file.md",
  "total_chars": 4727,
  "total_chunks": 2,
  "created_at": "2026-01-09T...",
  "sha1": "38e4b47a40f0db0f16e16bace47bda2222f1fc33"
}
```

**Evidence:** `benchmark/run-2026-01-09-1259/_sources/src_38e4b47a40f0/manifest.json`

---

### Extracted Note (`{type}s/{id}.md`)

```yaml
---
verified: true
verified_at: 2026-01-09T11:59:40.449Z
id: outcome-ladder
type: concept
tags: [concept, extracted]
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Source Document"
  chunk: "full"
embedding_keys: ["learning progression", "competence levels", "skill transfer"]
---
# Outcome Ladder

## Definition
A framework for categorizing learning outcomes...

## Key Components
- Level 1 (author's "Rung A: remember"): ...
- Level 2 (author's "Rung B: recognize"): ...

## Application
The ladder is used to define...

## Links
Derived from: [Source Document](src_38e4b47a40f0)
Related: [[7-Minute Microlearning Loop]], [[Friction Budget]]

## LINK_INTENTS
```json
{
  "note_id": "outcome-ladder",
  "link_intents": [
    {
      "target_title": "7-Minute Microlearning Loop",
      "intent_type": "procedure",
      "confidence": 0.9,
      "embedding_match_keys": ["microlearning", "instructional design"]
    }
  ]
}
```

**Evidence:** `benchmark/run-2026-01-09-1259/concepts/outcome-ladder.md`

---

### Stub Note (`stubs/stub-{id}.md`)

```yaml
---
id: stub-deliberate-practice
type: concept
status: stub
---
# Deliberate Practice

*This is a stub note. The concept is referenced but not yet defined in the vault.*

## Context
Referenced from notes discussing practice and skill development.
```

**Evidence:** `benchmark/run-2026-01-09-1259/stubs/`

---

### Vector Database (`_index/vectors.db`)

SQLite database with sqlite-vec extension.

**Tables:**
| Table          | Schema                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------- |
| `notes`        | `id TEXT PK, title TEXT, type TEXT, embedding_keys TEXT, file_path TEXT, updated_at TEXT` |
| `note_vectors` | Virtual table: `note_id TEXT PK, embedding FLOAT[1536]`                                   |

**Evidence:** `utils/vector-store.ts:44-64`

---

### Notes Index (`_index/notes.json`)

```json
[
  {
    "id": "outcome-ladder",
    "path": "concepts/outcome-ladder.md",
    "title": "outcome-ladder",
    "type": "concept",
    "outboundLinks": ["7-Minute Microlearning Loop", "Friction Budget"]
  }
]
```

**Evidence:** `benchmark/run-2026-01-09-1259/_index/notes.json`

---

### Backlinks Index (`_index/backlinks.json`)

```json
{
  "7-Minute Microlearning Loop": ["outcome-ladder", "calibration-loop"],
  "Friction Budget": ["outcome-ladder", "spend-friction-where-it-buys-transfer"]
}
```

**Evidence:** `benchmark/run-2026-01-09-1259/_index/backlinks.json`

---

### Run Result (`_runs/runbooks/{id}/run-{ts}/run.json`)

```json
{
  "run_id": "run-1767959966124",
  "runbook_id": "vnext-pipeline",
  "runbook_version": "2.0",
  "status": "completed",
  "steps_completed": 9,
  "steps_total": 9,
  "step_results": [...],
  "decisions": [],
  "start_time": "2026-01-09T11:59:26.124Z",
  "end_time": "2026-01-09T12:01:44.306Z",
  "duration_ms": 138182,
  "budget_usage": {
    "tokens_used": 0,
    "tokens_budget": 100000,
    "cost_used": 0,
    "cost_budget": 5,
    "time_seconds": 138.182
  }
}
```

**Evidence:** `benchmark/run-2026-01-09-1259/_runs/runbooks/vnext-pipeline/run-1767959966124/run.json`

---

## Source of Truth

### Files as Source of Truth

The filesystem is the canonical source of truth for all vault data:

| Data              | Location                          | Format                         |
| ----------------- | --------------------------------- | ------------------------------ |
| Notes             | `{type}s/*.md`                    | Markdown with YAML frontmatter |
| Source chunks     | `_sources/{sourceId}/chunks/*.md` | Markdown with YAML frontmatter |
| Vector embeddings | `_index/vectors.db`               | SQLite database                |
| Note indexes      | `_index/*.json`                   | JSON                           |
| Run logs          | `_runs/**/*.json`                 | JSON                           |

### Derived Data

The following are derived/cached and can be regenerated:

| Artifact                | Can be regenerated from           |
| ----------------------- | --------------------------------- |
| `_index/notes.json`     | Scanning all `*.md` files         |
| `_index/backlinks.json` | Scanning all `[[...]]` links      |
| `_index/vectors.db`     | Re-indexing notes with embeddings |

### Non-Regenerable Data

| Artifact            | Why non-regenerable             |
| ------------------- | ------------------------------- |
| `sources/*.md`      | Would need original file        |
| `{type}s/*.md`      | LLM output is non-deterministic |
| `_runs/**/run.json` | Historical record of execution  |

---

## Lineage Traceability

Every extracted note contains a `derived_from` field linking back to its source:

```yaml
derived_from:
  source_id: "src_38e4b47a40f0"
  source_title: "Chapter 5: Microlearning Design"
  chunk: "full"  # or specific chunk ID
```

This enables:
1. **Audit**: trace any claim back to source text
2. **Update propagation**: re-extract if source changes
3. **Citation**: reference original material

**Evidence:** `prompt-model-artifact.md:55-67` — frontmatter contract

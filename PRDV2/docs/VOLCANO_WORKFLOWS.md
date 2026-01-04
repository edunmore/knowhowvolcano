# Volcano SDK Workflows (Education Zettelkasten Pipeline)

Date: 2026-01-03

This document describes how the pipeline maps to Volcano SDK concepts and how agents coordinate without embedding source content into prompts.

## 1. Volcano patterns used

- Step chaining (`agent().then(...).then(...).run()`)
- Multi-agent “crew” coordinator (Coordinator delegates to specialists)
- MCP tool arrays per step (automatic tool selection)
- Retries/timeouts per step for robustness
- OpenTelemetry tracing for observability of runs

## 2. File-oriented prompting convention

All steps follow this pattern:

- Inputs are file paths or vault note IDs.
- Outputs are written to explicit paths (notes + indexes).
- Prompts describe *actions* and *format constraints*; the agent reads/writes files itself.

## 3. Suggested specialist steps

### 3.1 Ingestor

Inputs:
- raw file path(s)
- bibliographic metadata json

Outputs:
- `vault/sources/source-<slug>.md`
- `vault/_index/ingestion/<run-id>.json` (append)

### 3.2 Extractor

Inputs:
- chapter file path
- source_anchor note id
- current `_index/notes.json` (for context)

Outputs:
- draft zettels (atomic modeled notes) in a staging folder `vault/_staging/`

### 3.3 Modeler

Inputs:
- staging notes
- schema doc

Outputs:
- finalized modeled notes moved into canonical folders
- ensure each note links to at least one concept (existing or stub)

### 3.4 Linker (stub resolver)

Inputs:
- newly created note paths
- vault index

Outputs:
- creates missing `concept-*` notes with `status: stub`
- rewrites links to canonical IDs when aliases were used
- emits link audit report

### 3.5 Indexer

Inputs:
- all vault note files

Outputs:
- `_index/notes.json`
- `_index/backlinks.json`
- `_index/graph.json`
- `_index/search.jsonl`

Optional:
- embeddings store

### 3.6 Storyteller

Inputs:
- objective (string or objective note id)
- retrieval selection list (note ids) OR allow Storyteller to retrieve via index

Outputs:
- `vault/stories/story-<id>.md` including facilitator appendix + activity + quiz items

### 3.7 QA/Verifier

Inputs:
- list of created/modified files in run manifest

Outputs:
- `vault/_index/qa/<run-id>.json` with pass/fail + reasons
- optional auto-fix commits (if you integrate Git tooling)

## 4. Run manifests and idempotence

Each run produces a manifest containing:
- inputs read
- notes created
- notes modified
- stubs created
- index artifacts rebuilt
- QA results

Indexing should be idempotent: repeated runs without vault changes should produce identical `_index` outputs (excluding timestamps in manifests).

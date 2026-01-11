# IDEATION PRD Add-on — SQLite Asset Store + Full-Text + Embeddings + Multi-Agent Write Safety (per-vault DB)
Date: 2026-01-09
Target: Existing runbook-driven TS pipeline + vault filesystem
Motivation: Reduce token cost + improve retrieval/generation + prepare for parallel extraction/modeling

## 1) Context (from your audit + comments)
- Critical flaw observed: **Modeler context starvation** (modeling on 1–2 sentence quote → hallucination / verification failures).
- Scaling flaw observed: **Resolver prompt includes entire vault index** (will break > ~1k notes).
- Token/time pain observed: per-candidate modeling loops + double verification + LLM-based stub creation.
- Direction decided: chunk gating + context windows + staging (incubator→grounded) + separate domain vaults.
- New requirement: generated learning assets (microlearning/scenarios/quizzes/story outlines) should be **first-class, searchable, dedupable**, and **linkable** to notes; best stored in SQLite with FTS + vectors.
- Future-proofing: system currently sequential; design must not assume single-writer forever (parallel runs / multi-agent flows likely).

## 2) Goal
- Store **generated content blocks (“assets”)** in SQLite for:
  - fast full-text retrieval
  - semantic retrieval (embeddings)
  - structured linking (note↔asset edges)
  - dedupe/merge/variant management
  - versioning + evaluation metrics
- Ensure SQLite design is safe under:
  - concurrent readers
  - many parallel workers producing assets
  - one writer constraint (explicitly handled)

## 3) Non-goals (for this PRD)
- No GUI required (API/CLI is enough).
- No migration of all notes into DB required (DB-first for assets; notes may remain files).
- No “perfect ontology” (typed edges + signatures are enough).

## 4) Key decisions
- Per vault: **one SQLite DB file** stored inside vault (e.g., `_db/vault.sqlite`).
- Content model:
  - Grounded concepts/principles may remain Markdown files.
  - **Assets are DB-first** (optionally exported to Markdown for human reading).
- Truth separation:
  - `grounded` vs `synthetic` is explicit in schema; synthetic content never masquerades as source-grounded.
- Concurrency:
  - Enable WAL mode.
  - Implement a **single-writer queue** (explicit write service) for all DB writes.
  - Workers are allowed to generate in parallel but must submit “upsert jobs” to the writer.

## 5) What is an “Asset”
- An asset is a reusable, queryable content unit linked to one or more notes, e.g.:
  - microlearning unit (Hook–Value–Action)
  - scenario set / simulations
  - quiz items + rubrics
  - story outline / story beat sheet
  - podcast outline
  - practice prompt set
- Asset lifecycle:
  - created → (optional) merged/deduped → (optional) revised/versioned → used in generation outputs

## 6) Requirements
### 6.1 Retrieval requirements
- Must retrieve assets by:
  - free-text search (FTS)
  - semantic similarity (embedding)
  - filters: `asset_type`, `audience_level`, `domain`, `status`, `grounding_level`, `source_id`
  - graph constraints: linked to note X (and optionally hop depth 1–2)
- Must support **hybrid retrieval**:
  - FTS prefilter → vector rerank (top-k) → optional edge expansion.

### 6.2 Dedup / merge requirements
- Every asset must include a **signature** used to detect similarity/duplicates:
  - `asset_type + learning_goal + audience_level + key_terms + pattern_id`
- Merge outcomes:
  - CREATE new asset
  - MERGE into existing asset (new version or append variant)
  - APPEND_VARIANT (same pattern, different examples)
  - DEPRECATE (low quality / redundant)

### 6.3 Provenance + trace requirements
- Every asset must store:
  - `run_id`, `model`, `prompt_id`, `prompt_version`
  - `created_at`, `generator_agent`
  - grounding info:
    - `grounding_level`: none | chunk_refs | span_refs
    - `source_refs`: list of `{source_id, chunk_id, start, end}` when available

### 6.4 Multi-agent / parallel safety requirements
- DB writes must be robust with parallel generation:
  - Workers generate JSON envelopes to disk in `_runs/<run_id>/out/`
  - Writer service reads envelopes and commits DB updates in batches
- Writer behavior:
  - transactional upserts
  - idempotent (safe to replay)
  - backpressure + retry on BUSY
- Reads must remain fast during writes (WAL).

## 7) Minimal schema (v1)
### Tables
- `notes` (optional mirror of file notes; minimal metadata only)
- `assets`
- `asset_versions`
- `edges` (note↔note, note↔asset, asset↔asset)
- `runs` (run metadata)
- `prompts` (prompt registry: id, version, hash, path)
- `metrics` (evaluation scores per asset/version, optional)

### FTS
- `assets_fts` indexing:
  - title, body, tags, learning_goal, key_terms
- Prefer external content mode if canonical text is in `assets`.

## 8) Pipeline integration (runbook-level)
- Modeler step outputs one JSON envelope per chunk (or per concept) containing:
  - grounded note (optional file write)
  - assets[]
  - link_candidates[]
  - edges[]
- After modeling, add a step:
  - `db_upsert_assets` (no LLM): submit envelopes to writer and update DB.
- Remove LLM stub creation:
  - link candidates create deterministic incubator notes (files) OR DB candidate records.

## 9) Prompt ideation (contracts + format)
### 9.1 Modeler prompt output (single envelope)
- Hard requirement: Return **ONLY valid JSON** (no markdown)
- Structure:
  - `grounded_note` with `body_md` plus `source_refs`
  - `assets[]` with `asset_type`, `audience_level`, `learning_goal`, `body_text`, `signature_fields`, `grounding_level`
  - `link_candidates[]` for unresolved terms
  - `edges[]` typed relations + rationale
- Rule: grounded vs synthetic separation is explicit per object.

### 9.2 Asset signature normalizer (optional)
- If signature quality is inconsistent, run a cheap model to normalize:
  - key_terms
  - pattern_id
  - learning_goal canonical form

### 9.3 Evaluator prompt (optional)
- Score assets with:
  - clarity (0–5), teachability (0–5), correctness risk (0–5), novelty (0–5)
  - ready_for_use boolean
- Store results in `metrics` table.

## 10) Milestones
- M1: Add per-vault SQLite + tables + FTS + embedding storage; basic CRUD
- M2: Implement writer queue (single writer) + WAL + idempotent upserts
- M3: Update modeler to output JSON envelope with assets + signatures
- M4: Add dedupe/merge flow (retrieve top-k assets by type; MERGE/APPEND_VARIANT)
- M5: Add evaluation scoring + versioning; store metrics per asset_version
- M6: Add hybrid retrieval API for creator pipelines (FTS→vector→edge expand)

## 11) Acceptance criteria
- A1: Assets are searchable via FTS and via embedding similarity within a vault.
- A2: Pipeline supports parallel generation without DB corruption (writer queue).
- A3: Dedupe flow merges/appends variants without losing history.
- A4: Each asset is traceable to run/prompt/model and optionally to source refs.
- A5: Creator pipeline can request: asset_type + audience_level + linked concept(s) and retrieve coherent bundles quickly.

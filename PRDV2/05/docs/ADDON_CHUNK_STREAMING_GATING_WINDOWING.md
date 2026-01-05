# Add-on PRD — Chunk Streaming, Gating, and Sliding Windows

Date: 2026-01-04  
Applies to: Education Zettelkasten system (existing running implementation)  
Scope: Incremental changes only (no full re-PRD)

## 1. Goal

Reduce token usage and improve knowledge quality by shifting from “candidate list + per-candidate modeling” to a streaming, chunk-based pipeline that (a) stores evidence chunks in the vault for re-use and future re-modeling, (b) routes chunks through a cheap quality gate to avoid intros/marketing pages, and (c) models using labeled sliding windows (PREV/CURRENT/NEXT) to preserve context without relying on large overlaps.

## 2. Non-goals

- Replacing the whole system architecture or redoing the full PRD.
- Solving the full “linking strategy” end-to-end in this add-on (link-intents is included as an optional follow-up lens, but not required for this milestone).
- Implementing full vector RAG for resolver scalability (can remain as lexical top-k prefilter for now).

## 3. Summary of changes

### 3.1 Evidence storage becomes chunk-first
Instead of relying on chapter notes or expensive “source naming” calls, the pipeline stores stable evidence units in a dedicated `_sources` namespace.

### 3.2 Add a Chunk Gate step before expensive modeling
A fast classification/scoring step routes each chunk into one of three decisions: `SKIP`, `LIGHT_SCAN`, `FULL_MODEL`. This prevents modeling concepts from low-value content such as “notes for the reader”, testimonials, marketing blurbs, about-the-author pages, legal pages, TOC, and index.

### 3.3 Use sliding windows with explicit roles (PREV/CURRENT/NEXT)
Modeling input is assembled as three labeled blocks. The modeler is instructed that CURRENT is authoritative; PREV and NEXT may only be used to disambiguate or complete a definition that clearly spans boundaries. By default, extracted artifacts are considered grounded in CURRENT.

### 3.4 Prepare for re-modeling with future “lenses”
All derived notes must retain precise provenance to chunk IDs and optionally spans. This allows re-running the book with a new modeling technique (e.g., DBM, NLP presuppositions) or a better LLM later without re-ingestion.

## 4. Vault layout additions

### 4.1 Evidence chunks
Store raw evidence under:

- `vault/_sources/<source_id>/manifest.json`
- `vault/_sources/<source_id>/chunks/<chunk_id>.md`

Chunk note frontmatter:

```yaml
---
id: chunk_<source_id>_<seq>
type: source_chunk
source_id: <source_id>
seq: 000123
start_char: 456789
end_char: 459999
sha1: "<hash>"
content_class: core | preface | notes_for_reader | toc | marketing_blurb | about_author | legal | references | index | appendix | unknown
relevance_score: 0.0
decision: SKIP | LIGHT_SCAN | FULL_MODEL
gate_confidence: 0.0
gate_reasons:
  - "..."
---
```

Body: the raw chunk text (verbatim) and optionally the nearest section heading for human readability.

### 4.2 Index extensions

- `vault/_index/chunks.json` (chunk metadata for routing and retrieval)
- `vault/_index/source_manifest.json` (optional rollup per source_id: total chunks, chapter boundaries, etc.)

## 5. Deterministic source identity (no “nice name” calls)

### 5.1 source_id
Use a deterministic `source_id` derived from the input filename/path or content hash.

Recommended:
- `source_id = "src_" + sha1(<file bytes>)[:12]`

### 5.2 Human label
Optional: store a human-editable label in `manifest.json`. No LLM call required.

## 6. Chunking strategy

### 6.1 Primary segmentation
Prefer chapter splits if you already have them. If chapters are extremely short, merge them into a “chapter group” until a target size is reached.

### 6.2 Storage unit vs modeling window
Separate:
- **Storage unit** (“chunk”): stable evidence file in `_sources`.
- **Modeling window**: assembled text passed to the modeler (PREV/CURRENT/NEXT).

This reduces vault duplication and avoids large overlaps.

### 6.3 Defaults (recommended starting point)
- Storage chunk target: ~800–1200 tokens (or an equivalent char heuristic), split at paragraph boundaries when possible.
- Modeling window: 3 blocks (PREV + CURRENT + NEXT) with the CURRENT chunk/group as the authoritative unit.
- Overlap: optional and small; if PREV/NEXT are included, overlap can be 0. Keep overlap only as robustness against bad boundaries.

## 7. Chunk Gate (routing) step

### 7.1 Purpose
Prevent expensive modeling calls on low-value text and reduce “junk concepts” created from prefatory or marketing content.

### 7.2 Gate decisions
- `SKIP`: store chunk and index it; do not run extraction/modeling.
- `LIGHT_SCAN`: run only lightweight lenses (e.g., glossary candidates, assumptions, link-intents) without heavy note schemas.
- `FULL_MODEL`: run the normal educational extraction/modeling pipeline.

### 7.3 Local gate model
Use a local Ollama model (e.g., `qwen:8b`) invoked as a Volcano agent/tool step.

### 7.4 Gate input (token-minimized)
Do not send the whole chunk. Compute a snippet locally:
- HEAD: first ~600–800 chars
- TAIL: last ~200–300 chars
- SIGNALS: up to 8 sentences chosen deterministically (definitions/procedures markers)

### 7.5 Gate output schema
Strict JSON:

```json
{
  "content_class": "core|preface|notes_for_reader|toc|marketing_blurb|about_author|legal|references|index|appendix|unknown",
  "relevance_score": 0.0,
  "decision": "SKIP|LIGHT_SCAN|FULL_MODEL",
  "confidence": 0.0,
  "reasons": ["...", "..."]
}
```

### 7.6 Threshold policy (default)
- If `decision == FULL_MODEL` but `confidence < 0.55`, downgrade to `LIGHT_SCAN` unless `content_class == core` and `relevance_score >= 0.75`.
- If gate JSON cannot be parsed, set `decision = LIGHT_SCAN`, `content_class = unknown`, `confidence = 0.0`, reason `gate_parse_failed` and continue (no retries).

## 8. Sliding window modeling (PREV/CURRENT/NEXT)

### 8.1 Assembly
For each CURRENT unit, assemble:
- PREV: the immediately preceding chunk/group
- CURRENT: the authoritative chunk/group
- NEXT: the immediately following chunk/group

### 8.2 Modeler instruction (role clarity)
The modeler must follow:
- Extract/model artifacts only if supported by CURRENT.
- Use PREV/NEXT only to disambiguate or complete definitions spanning boundaries.
- If PREV/NEXT contributes evidence materially, include those chunk IDs in `derived_from`.

### 8.3 Provenance
Derived notes must include:
- `derived_from` in YAML (array of chunk IDs used)
- optional `source_spans` (char offsets) when available

## 9. Lens-ready re-modeling

### 9.1 Lens identity
Introduce optional metadata fields on derived notes:
- `modeled_by: lens-edu-v1` (current baseline)
- `modeled_at: 2026-01-04T...`

### 9.2 Parallel renditions (optional)
Allow storing lens outputs as separate renditions instead of overwriting canonical notes:
- `concept-x--lens-dbm-v1.md`
- `concept-x--lens-nlp-v1.md`

Promotion to canonical remains governed by evaluation gates (existing MVP-5 approach).

## 10. Token optimization rationale

This add-on reduces tokens by:
- Avoiding per-candidate modeling loops that repeat instructions and context.
- Skipping non-core content early (gate).
- Modeling a CURRENT unit with supporting context rather than many tiny quote-only calls.
- Enabling later improvements (new lenses/better LLMs) without re-ingestion.

## 11. Acceptance criteria

A) Chunk evidence is stored in `_sources` with manifest and indexed in `vault/_index/chunks.json`.

B) Gate routes chunks deterministically:
- Marketing/TOC/about-author/legal/index/reference chunks are `SKIP`.
- Preface/notes-for-reader chunks default to `LIGHT_SCAN`.
- Core chapters are `FULL_MODEL`.

C) Modeling uses PREV/CURRENT/NEXT and produces fewer hallucination/“insufficient evidence” failures compared to quote-only modeling.

D) Provenance is correct:
- Derived notes contain YAML `derived_from` pointing to chunk IDs.
- If PREV/NEXT is used, those chunk IDs appear in `derived_from`.

E) Regression:
- Add a small gate corpus test set with expected routing decisions.
- Add at least one end-to-end run that proves SKIP chunks do not create educational notes.

## 12. Implementation checklist (incremental)

1) Add `_sources` layout and chunk manifest writer.
2) Implement chunker based on existing chapter splits with optional merging of short chapters.
3) Add `ChunkGate` step (Volcano → Ollama/qwen:8b) using snippet input and strict JSON output.
4) Implement routing: SKIP/LIGHT_SCAN/FULL_MODEL.
5) Implement sliding window assembler with explicit PREV/CURRENT/NEXT labeling.
6) Update modeler input contract to accept labeled blocks and enforce “CURRENT-only extraction”.
7) Update provenance: `derived_from` chunk IDs and optional spans.
8) Add `eval/gate-corpus` regression tests.

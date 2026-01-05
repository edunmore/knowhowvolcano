# Add-on PRD — DBM Lens Integration (v0.6)

Date: 2026-01-04  
Applies to: Education Zettelkasten system (existing running implementation)  
Scope: Add a new modeling technique (DBM-based) as a first-class “lens” that can be re-run over stored evidence without re-ingestion.

## 1. Goal

Introduce a DBM-based modeling technique that can be executed as an additional lens over the existing chunk-gated, sliding-window pipeline. The DBM lens writes its outputs into the vault in a way that is (a) strictly grounded to evidence chunks, (b) non-destructive to canonical notes, and (c) repeatable when prompts/models improve.

## 2. Non-goals

- Rewriting canonical note schemas or replacing the existing baseline lens (edu modeling).
- Implementing a human review UI (promotion is file-based).
- Adding full vector-RAG resolver (optional later).
- Solving link-intents/stubs end-to-end (can be layered later).

## 3. Definitions

**Lens**: A named modeling technique that produces derived artifacts from the same evidence (chunks/windows).  
**Canonical note**: The primary vault note for a concept/procedure/principle/misconception.  
**Rendition**: A lens-specific output that “renders” a canonical note but does not overwrite it.

## 4. Architecture changes

### 4.1 Lens Registry + Runner Interface

Add a registry that defines available lenses and a common runner interface.

Required fields per lens:
- `lens_id` (e.g., `lens-dbm-v1`)
- `prompt_path` (e.g., `_system/prompts/lenses/dbm/prompt-dbm-model.md`)
- `output_root` (e.g., `_lenses/lens-dbm-v1/`)
- `routing_policy` (e.g., FULL_MODEL only; optionally LIGHT_SCAN later)
- `output_types` (e.g., `lens_rendition`, optional DBM component notes)

Runner interface:
- Input: window context `PREV/CURRENT/NEXT`, chunk IDs, canonical note index snapshot (optional), and a writable filesystem handle.
- Output: a list of files written and a machine-readable summary (JSON).

CLI/Config:
- Support `--lenses edu,dbm` or equivalent configuration enabling multiple lenses per run.
- Support `--lens dbm --remodel` to re-run DBM over existing stored chunks without re-ingestion.

### 4.2 Vault Integration (recommended: Rendition notes)

Store DBM outputs under a dedicated namespace to avoid mixing with canonical notes:

- `vault/_lenses/lens-dbm-v1/renditions/<canonical_id>--lens-dbm-v1.md`
- `vault/_lenses/lens-dbm-v1/_runs/<run_id>.json` (run metadata and stats)
- `vault/_lenses/lens-dbm-v1/_patches/<canonical_id>.json` (optional proposals to improve canonical notes)

Rendition note YAML (minimum required):
```yaml
---
id: <canonical_id>--lens-dbm-v1
type: lens_rendition
lens_id: lens-dbm-v1
renders: <canonical_id>
derived_from: ["<chunk_id_current>", "<chunk_id_optional_prev>", "<chunk_id_optional_next>"]
modeled_at: 2026-01-04T00:00:00+01:00
tags: [lens, dbm, rendition]
---
```

### 4.3 Evidence policy for sliding windows

The DBM lens receives labeled blocks `PREV`, `CURRENT`, `NEXT`.

Rules:
- CURRENT is authoritative; extract only what is supported by CURRENT.
- PREV/NEXT may be used only to disambiguate or complete a definition spanning boundaries.
- If PREV/NEXT materially influences the output, include their chunk IDs in `derived_from`.

## 5. DBM content requirements (what to model)

The DBM lens should create a structured “operational core” rendition for each targeted canonical note encountered in CURRENT.

Minimum sections (rendition):
- **DBM frame** (what the behavior/skill is, in DBM terms, grounded)
- **TOTE** (Test–Operate–Test–Exit) if the source provides sufficient procedural structure; otherwise Gap Statements
- **Observable indicators** (what to see/hear/do to recognize it, grounded)
- **Failure modes** (what goes wrong, grounded; otherwise Gap Statements)
- **Calibration cues** (context signals / constraints, grounded; otherwise Gap Statements)
- **Prompts/Interventions** (only if the source provides them; otherwise Gap Statements)
- **Gaps** (use Gap Statement format; no placeholder-only sections)

Gap Statement format (required when missing):
“Not specified in this source. Open questions: (1) …? (2) …?”

Quote limit remains ≤ 30 words per quote. Prefer paraphrase.

## 6. Target selection (what gets a DBM rendition)

Two supported modes:

### Mode A — Opportunistic (recommended first)
For each CURRENT window:
1) Run baseline edu modeling (already exists) producing/merging canonical notes.
2) DBM lens reads the set of canonical note IDs touched/created in this window and generates DBM renditions for those IDs only.

### Mode B — Direct extraction (optional later)
DBM lens performs its own extraction from CURRENT and creates renditions without depending on baseline outputs. This is higher effort and can be scheduled later.

## 7. Indexing changes

Extend the vault indexer to include:
- `type: lens_rendition`
- `lens_id`
- `renders` (canonical_id)
- `derived_from` chunk IDs
- `modeled_at`

Add a simple lookup index:
- `vault/_index/lens_renditions.json` mapping `canonical_id -> [rendition_ids]`

## 8. Optional promotion workflow (file-based)

DBM lens may emit patch proposals without applying them automatically.

Patch proposal file:
- `vault/_lenses/lens-dbm-v1/_patches/<canonical_id>.json`
Contains:
- `canonical_id`
- `lens_id`
- `proposed_changes` (text patches or section replacements)
- `evidence` (chunk IDs + optional spans)
- `rationale`

Promotion step (separate command):
- Validates grounding against evidence chunks.
- Applies patch only if validation passes and change does not reduce existing content quality.

## 9. Milestones

### M1 — Lens scaffolding (1 sprint)
Deliver:
- Lens registry + runner interface
- CLI/config enabling multiple lenses
- Vault `_lenses/` namespace creation
- Indexer support for `lens_rendition`
Acceptance:
- Running with `--lenses edu` unchanged behavior
- Running with `--lenses edu,dbm` calls DBM lens and writes at least one rendition note

### M2 — DBM rendition generation (1 sprint)
Deliver:
- DBM prompt(s) + strict schema output
- Rendition writer for targeted canonical notes (Mode A)
- DBM-specific schema verifier (optional, but recommended)
Acceptance:
- Renditions contain required sections, no placeholder-only sections
- `derived_from` correctly lists chunk IDs used

### M3 — Re-modeling workflow (1 sprint)
Deliver:
- `--lens dbm --remodel` to re-run DBM over existing chunks/windows
- Run metadata file `_runs/<run_id>.json` including counts, skips, failures
Acceptance:
- DBM can be re-run without re-ingestion
- Old renditions are updated deterministically (same IDs) or versioned consistently

### M4 — Patch proposals + promotion gate (optional)
Deliver:
- Patch proposal emission
- Promotion command with grounding validation
Acceptance:
- Patch proposals are generated for at least one canonical note
- Promotion applies only when evidence supports changes

## 10. Acceptance criteria (overall)

A) DBM lens outputs are stored under `_lenses/lens-dbm-v1/` and do not overwrite canonical notes by default.

B) Every DBM rendition note contains:
- valid YAML
- `type: lens_rendition`
- `lens_id: lens-dbm-v1`
- `renders: <canonical_id>`
- `derived_from` with chunk IDs

C) DBM outputs are grounded and comply with quote limits.

D) System supports re-running DBM lens over stored evidence without re-ingestion.

E) Index includes renditions and supports lookup by canonical note.

## 11. Implementation checklist

1) Add lens registry + runner interface.
2) Add CLI/config switches for lenses and remodel mode.
3) Add `_lenses/` vault layout + writer.
4) Add DBM prompts + output schema enforcement.
5) Implement Mode A targeting (canonical notes touched in CURRENT).
6) Extend indexer to include renditions and mapping index.
7) Add regression tests:
   - rendition YAML contract
   - derived_from correctness
   - no placeholder-only sections
8) (Optional) Add patch proposal + promotion command.

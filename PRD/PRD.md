# PRD: Canon-Aware Knowledge Extraction Pipeline (Volcano SDK)

Version: 0.1  
Date: 2025-12-31

## 1. Background

You have source material already converted to Markdown (business books, webinar transcripts, video/audio transcripts). You want to extract *reproducible operational structure* (NLP-modeling style) rather than summarize or copy the author. The extracted structure must be reusable to generate *new* content (short stories / business fables, reels scripts, comic scripts). The extraction quality is measured by downstream generation performance, not by “nice summaries”.

## 2. Goals

1) Extract a method’s operational core (“Method Kernel”) and “Author Delivery Model”, with strict source traceability via short anchor snippets and locations, while keeping the prose abstracted (non-plagiaristic).  
2) Keep context bounded: never “read the whole book”; instead use a chapter router to select a small contiguous window (default max 4 files).  
3) Maintain a growing Methods Canon that is updated incrementally (merge-or-new decision), with provenance and changelog.  
4) Add an automated downstream stress test that generates a reel + fable outline + comic beats *from the extraction only*, and emits a Fix Spec for iterative improvement.  
5) Support both **DISCOVER** (new method) and **DELTA** (improve an existing canon entry) workflows.  
6) Regenerate a compact canon index after each update to keep future runs cheap.

## 3. Non-goals (for v0.1)

- OCR or raw video processing. Input is already Markdown.  
- Full-book global understanding. Only bounded windows.  
- Automatic image understanding. (Can be added later by inserting image descriptions into the Markdown as preprocessed blocks.)  
- Perfect semantic deduplication across all methods. Use bounded matching heuristics first, then refine.

## 4. Key Constraints

- **Single-source-set discipline:** only the selected chapter files (and canon files) are valid evidence.  
- **Anchor discipline:** important claims must have short verbatim “anchor snippets” (8–12 words max) + location markers.  
- **Tag discipline:** every statement must be labeled [EXTRACTED] or [INFERRED] (and [NOT IN SOURCE] when needed).  
- **Bounded reading:** max 4 source chapters per extraction run.  
- **Canon scalability:** always match via compact index first; read at most 3 full canon entries for deep checks.

## 5. User Stories

- As a user, I can run the pipeline on a specific chapter and get either a new method entry or a patch against an existing canon method.  
- As a user, I can control budget (max chapters, max canon entries to open) and quality thresholds (scores).  
- As a user, I can rerun extraction iteratively using the critic’s Fix Spec until thresholds are met.  
- As a user, I can keep a compact canon index updated automatically.

## 6. Artifacts

### 6.1 Methods Canon Index (small)

Location: `./canon/METHODS-CANON-INDEX.md`  
Purpose: cheap matching and routing.  
Contains: method_id, title, aliases, tags, kernel fingerprint, signals, and file pointer to full entry.

### 6.2 Methods Canon Entries (full)

Location: `./canon/methods/MTH-YYYY-####.md`  
Purpose: authoritative method spec with kernel, delivery model, reuse pack, provenance, changelog.

### 6.3 Run Outputs

Location: `./runs/YYYYMMDD-HHMMSS/`  
Contains: selected files list, extraction output, critic output, candidate retrieval output, canon patch, updated canon entry (or new entry), updated index, logs.

## 7. Pipeline Overview

### Step A — Canon-Aware Chapter Router
Input: chapter index + start file + canon index.  
Output: bounded file list (<= 4), plus mode hypothesis: DISCOVER or DELTA.

### Step B — Extraction
- If DELTA: run Delta Extractor against matched method entry + selected chapters.  
- If DISCOVER: run Generator-Ready Deep Structure Extraction (multi-source) on selected chapters.

### Step C — Downstream Generator Test (Critic)
Generates reel/fable/comic from extraction-only; audits anchors/labels; outputs Scorecard + Fix Spec.

### Step D — Iterate (optional loop)
If stop conditions fail, rerun extractor with Fix Spec prepended as binding constraints. If coverage is too thin, rerun router once to add an adjacent chapter within max_files.

### Step E — Canon Candidate Retrieval (index-first, bounded)
For DISCOVER runs, shortlist via canon index; read <=3 candidates; decide match or new.

### Step F — Canon Updater (merge-or-new)
Apply patch or create new method entry; append changelog; preserve provenance.

### Step G — Canon Index Regenerator
Regenerate `METHODS-CANON-INDEX.md` from the full canon entries.

## 8. Stop Condition Defaults (editable)

- Faithfulness score >= 4/5  
- Generator readiness score >= 4/5  
- Non-plagiarism safety score >= 4/5  
- Zero anchor verification issues  
- Zero unsupported [EXTRACTED] claims  
- Extraction [NOT IN SOURCE] count <= 2

## 9. CLI / Scripts (proposed)

Command: `canon-pipeline`

Subcommands:
- `route --sourceDir ./source --start ./source/016_...md --canonIndex ./canon/METHODS-CANON-INDEX.md`
- `extract --mode discover|delta --selectedFiles <json> --canonEntry <path?>`
- `critic --extraction <path> --sources <paths...>`
- `match --extraction <path> --canonIndex <path> --maxCandidates 3`
- `update --decision update|new --patch <path> --canonDir ./canon/methods`
- `reindex --canonDir ./canon/methods --out ./canon/METHODS-CANON-INDEX.md`
- `run --start ...` (orchestrates the full pipeline)

## 10. Volcano SDK Integration Notes

Implementation language: TypeScript (Node).  
Use Volcano SDK to orchestrate the LLM steps (router/extractor/critic/matcher/updater) as a chain with `.then(...).run()`; providers can be swapped per-step when desired.

## 11. Open Questions (captured)

- How to represent chapter locations reliably (line numbers vs paragraph indices). v0.1 uses heading + paragraph index; optional line numbers if your markdown loader provides them.  
- How to incorporate image knowledge: recommended approach is to insert precomputed image descriptions into the Markdown as a dedicated block (future step).


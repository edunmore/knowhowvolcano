# PRD (Ideation → Implementation Guide) — vNext Integrated: Staging + Chunk-Centric Modeling + Emergent Zettelkasten + Volcano-Native Orchestration
Date: 2026-01-08
Status: Ideation PRD rewritten for direct use by an implementation agent
Applies to: Existing TS pipeline (runbook-driven) that already supports ingest → chunk → gate → (extract/resolve/model/verify/link/index/report) into a vault

## 1) Goal
Deliver a vNext pipeline that is cheaper (tokens), faster (wall-clock), and higher quality (less hallucination, fewer low-substance notes) by:
1) Making chunk gating actually reduce expensive work (filtered corpus),
2) Introducing a staging lifecycle (candidate/incubator → grounded/slipbox → synthesized/bridges),
3) Switching to chunk-centric “bundle modeling” with context windows,
4) Removing LLM usage for deterministic work (stub creation, most step “decisions”),
5) Adding emergent Zettelkasten navigation artifacts (typed edges, strands, MOCs, bridges, trails),
6) Expressing fan-out/branch/repair loops using Volcano orchestration primitives (not bespoke glue).

## 2) Non-negotiable principles (anti-workaround)
P1 — **Gate must protect expensive steps.** If a step runs on “full source text” regardless of gate, the gate is wasted.
P2 — **Never promote weak mentions to permanent notes.** Capture them in an incubator; promote only with evidence.
P3 — **Deterministic tasks must not call an LLM.** Parsing wikilinks, writing stub templates, file routing, and index building are pure code.
P4 — **Contracts beat prompt hopes.** Every LLM step has input/output schema validation plus a single repair attempt.
P5 — **Emergence lives outside source-grounded notes.** New connective claims go to bridges/MOCs/trails (status: synthesized).
P6 — **Use Volcano for orchestration.** If you are writing custom queues/pools/retries/branching, stop and map it to Volcano flow primitives.

## 3) What changes (delta vs current pipeline)
### 3.1 Pipeline shape (conceptual)
Current: chunk → gate → extract (full text) → resolve → model per candidate → verify per note (twice) → link stubs via LLM

vNext: chunk → gate → **assemble filtered corpus** → (optional) extract/resolve → **model per chunk bundle** → verify bundle → emit link candidates → deterministic stub/candidate creation → promote/merge → emergent artifacts → index/report

### 3.2 Two key architecture shifts
Shift A: **Candidate-first staging** (incubator) rather than “everything becomes a slipbox note”.
Shift B: **Chunk-centric modeling** rather than candidate-centric modeling.

## 4) Vault model (storage + lifecycle)
### 4.1 Folders (recommended)
- `_sources/` raw sources + chunk files (existing)
- `incubator/` candidate notes and unresolved stubs (new)
- `slipbox/` grounded permanent notes (existing or new home)
- `slipbox/bridges/` synthesized bridge notes (new)
- `slipbox/mocs/` structure notes (new)
- `slipbox/strands/` ordered strands (new)
- `slipbox/trails/` learning sequences (new)
- `_graph/edges.jsonl` typed edge log (new or optional)
- `_runs/<run_id>/` rendered prompts, outputs, metrics (recommended)

Navigation must be via links/edges/strands/MOCs/trails; folders are storage, not the retrieval system.

### 4.2 Lifecycle statuses (frontmatter)
Use explicit status for any knowledge note:
- `candidate` (weak signal, mention without substance)
- `grounded` (meets permanent-note bar; supported by modeled content and/or sources)
- `synthesized` (new connective claim; bridge/MOC/trail commentary)
- `redirect` (old id forwarding to canonical id after merge)
- `deprecated` (noise/superseded)

### 4.3 Permanent-note bar (grounded eligibility)
A grounded slipbox note must include at least one:
- operational definition / procedure / decision rule
- worked example
- boundary conditions / pitfalls
- misconception + correction
- explicit teaching implication (“learner can now …”)

Anything that cannot meet this bar stays in incubator as `candidate`.

## 5) Step-by-step spec (vNext runbook)
Implement as a new runbook (e.g., `vnext-pipeline.yml`) while keeping current `full-pipeline` unchanged.

### Step 1 — Ingest (no LLM)
Same as current.

### Step 2 — Chunk (no LLM)
Deterministic chunker. Avoid LLM “chunk size decisions” in normal runs.
Runbook provides `chunk_size` and `boundary_preference` as parameters.

Optional: small-file bypass (if length < threshold, treat as single chunk).

### Step 3 — Gate (LLM, cheap model)
For each chunk, classify: core/preface/marketing/etc + decision SKIP/LIGHT_SCAN/FULL_MODEL.
Output is strictly validated JSON (parse + repair once + fallback).

**Volcano guidance:** Gate is a fan-out `forEach(chunks, concurrency=N)`.

### Step 4 — Assemble filtered corpora (no LLM)
Build:
- `FULL_MODEL_TEXT`: concatenation of FULL_MODEL chunks (preserving order, with separators containing chunk ids)
- `LIGHT_SCAN_TEXT`: concatenation of LIGHT_SCAN chunks (optional)
Persist these in `_runs/<run_id>/corpus/` for reproducibility.

### Step 5 — Modeling strategy selection (no LLM in normal runs)
Default strategy:
- Model per FULL_MODEL chunk using a context window (prev/current/next).
- Keep extract/resolve optional as a later optimization/feature flag.

If experimentation is needed, use separate “experiment runbooks” rather than an Orchestrator LLM.

### Step 6 — Chunk-Centric Bundle Model (LLM, main cost center)
For each FULL_MODEL chunk, build an input window:
- `prev_support` (optional, previous chunk)
- `focus_chunk` (current chunk)
- `next_support` (optional, next chunk)

The modeler outputs:
A) 0–K grounded notes (K small; default 2–3) as separate markdown blobs with ids/titles/types
B) Inline wiki-links inside those notes where terms need clarification
C) A machine-readable appendix `LINK_CANDIDATES` (JSONL) listing all unresolved terms that deserve candidate notes
D) Optional typed edges (relation + rationale) for high-confidence links

Hard cap rule (prevents “atom soup”):
- At most K grounded notes per chunk.
- Prefer procedures, decision rules, examples, misconceptions over generic definitions.
- Everything else becomes candidate(s) in LINK_CANDIDATES.

**Volcano guidance:** Model is another fan-out `forEach(fullModelChunks, concurrency=M)` with rate-limits.

### Step 7 — Verify bundle (LLM, cheaper than modeling)
Verification is done once per produced note (or per bundle), not twice across the pipeline.
Recommended verification split:
- Schema validation: deterministic if possible (frontmatter + required sections)
- Grounding check: LLM only when needed (new or repaired notes)

Rule: If the model step already verified successfully, the pipeline must not re-verify the same unchanged note later.

### Step 8 — Candidate emission + deterministic stub creation (no LLM)
From LINK_CANDIDATES:
- If a target note exists in slipbox, do nothing (link resolves).
- Else create an `incubator/<id>.md` candidate template (status:candidate) and/or a redirect note if merging later.
This replaces the current LLM stub creation step entirely.

### Step 9 — Resolve/promote/merge (hybrid: retrieval + optional LLM)
Goal: avoid passing “entire vault index” to an LLM.
Mechanism:
- Create a compact “concept signature” per grounded note (title + 1–2 lines + keywords) and embed it.
- For each candidate, retrieve top-k similar grounded signatures.
- Only then ask an LLM (or deterministic rules) to decide: MERGE/KEEP_CANDIDATE/DEPRECATE/REDIRECT.

Promotion rule:
- When evidence appears, upgrade candidate → grounded or merge candidate into canonical and convert candidate file to redirect.

### Step 10 — Emergent Zettelkasten pass (LLM optional; small)
Run after batch:
1) Write/update typed edges with rationale for important links (may be partly emitted earlier)
2) Create/update **Book Strand** (ordered traversal following chunk order) and insert created notes in that order
3) Create/update 1–3 small MOCs (curated, with relationship explanations)
4) Create 2–6 bridge notes (status:synthesized)
5) Create/update 1 trail (microlearning first)

Do not generate massive hubs; keep artifacts small and expandable.

### Step 11 — Index/report (no LLM)
Same as current, plus include run metrics relevant to vNext (see Section 9).

## 6) Link creation: what the modeler must do (and what it must not do)
Modeler must:
- Mark likely-clarification terms as `[[WikiLinks]]` inline
- Emit LINK_CANDIDATES JSONL describing these links (term + type guess + reason)
- Avoid resolving/merging during modeling (that is post-batch)

Modeler must not:
- Create large numbers of “grounded notes” from mentions
- Hide synthesis inside grounded notes
- Invent authoritative definitions for candidate terms without labeling them provisional

## 7) Volcano-native implementation guidance
### 7.1 Minimal agent module shape
Each agent module binds:
- prompt loading from vault
- prompt-contract injection (variables, paths, chunk ids)
- Volcano flow (including retries/loops)
- output validation (schema parse)
- artifact persistence to `_runs/` and vault

### 7.2 Repair loop pattern (JSON)
For any strict JSON output step (gate, resolver decisions):
- attempt parse
- if fail: single repair call (“return valid JSON only”)
- if still fail: fallback safe output + low confidence

### 7.3 Concurrency and rate limiting
Use Volcano’s concurrency controls at fan-out points (gate, model).
Do not implement custom promise pools unless Volcano lacks a primitive you need.

## 8) Milestones (incremental, keeps system running)
M1 — Gate drives filtered corpus (Step 4 implemented; extraction/modeling uses FULL_MODEL_TEXT only)  
M2 — Introduce incubator + deterministic candidate/stub creation + LINK_CANDIDATES appendix  
M3 — Switch modeling to chunk-centric bundles + context windows + cap K grounded notes per chunk  
M4 — Remove duplicate global verify or make it incremental (verify only changed/repaired)  
M5 — Add emergent artifacts: Book Strands + small MOCs + bridges + one trail  
M6 — Refactor control flow to Volcano-native patterns (fan-out/branch/repair) and shrink bespoke orchestration code

## 9) Metrics (to confirm improvement)
Track per run:
- total LLM calls, by step
- total input/output tokens, by step
- wall-clock time, by step
- number of grounded notes created
- number of candidate notes created
- promotion rate (candidate→grounded)
- verification fail rate + repair count
- average grounded notes per FULL_MODEL chunk
- stub count (should be deterministic + cheap)
- top-k retrieval hit rate for merges

## 10) Acceptance criteria
A) On a mixed document (preface/marketing/core), FULL_MODEL steps run only on FULL_MODEL corpus.  
B) Candidate explosion is contained: weak mentions become incubator notes, not grounded notes.  
C) Modeling quality improves: modeler receives context windows; grounding failures drop materially.  
D) LLM stub creation is removed; stub/candidate creation is deterministic file I/O.  
E) Duplicate verification is eliminated or becomes incremental.  
F) Emergent navigation artifacts exist after each run: at least 1 Book Strand, 1 MOC, 2 bridges (configurable), 1 trail.  
G) Most orchestration fan-out/branch/repair loops are expressed via Volcano flows, not bespoke glue.

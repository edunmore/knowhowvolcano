# PRD — Education Zettelkasten Vault + Modeling Pipeline (Volcano SDK)

Version: 0.4  
Date: 2026-01-03  
Status: Draft  
Primary platform: TypeScript + Volcano SDK  
Vault format: Markdown files (Obsidian-style wikilinks) + derived indexes

## 1. Problem statement

I want an automated, agent-driven pipeline that ingests learning material (books, chapters, transcripts), extracts and models reusable knowledge (concepts, procedures, criteria, assumptions, misconceptions), stores it as a Zettelkasten-style “education vault”, and then generates educational assets—especially short business-fable stories—by recombining those modeled artifacts. The system should stay generic (not “summary of a specific book”), keep provenance, and minimize copyright risk by storing modeled structures and original examples rather than long excerpts.

## 2. Goals

1) Create a scalable “education Zettelkasten” that can aggregate multiple books/authors/frameworks into a single navigable knowledge base.  
2) Support autonomous ingestion + extraction + linking (including stub creation for implied prerequisites / missing criteria).  
3) Maintain full-text + semantic search + backlinks/graph indexes to keep retrieval fast even with many notes.  
4) Enable content generation workflows (lesson fragments, microlearning, quizzes, and business-fable stories) grounded in the vault.  
5) Keep the system file-based and tool-friendly: the agent can read/write files directly and can be extended by writing code against open-source libraries.

## 3. Non-goals (initially)

- A full end-user UI (Obsidian can be used as a viewer; later build a custom UI).  
- Perfect ontology/tagging up front. The system starts schema-light and progressively formalizes.  
- Fully automated legal review; instead the pipeline enforces content-handling rules to stay “model-first” and avoids long quotations.

## 4. Users and primary workflows

### Primary user
- A course/content creator who wants to synthesize multi-source material into teachable artifacts and original stories.

### Secondary user
- A software agent (Volcano SDK-based) operating autonomously on a local or server filesystem.

### Workflows
- Ingest a chapter → produce modeled notes + links + stubs → update indexes → generate a set of educational outputs (e.g., a fable + facilitator notes + one exercise + quiz items).

## 5. Core design principles

- **Vault is source of truth**: Markdown notes are canonical; indexes are derived and rebuildable.
- **Model-first storage**: store operational structure (steps, criteria, boundary conditions) and original examples; keep quotations short and purposeful.
- **Progressive formalization**: start with weakly-typed relations; strengthen only when repeated patterns emerge.
- **Deterministic linking**: link targets resolve to stable IDs; missing targets become stubs.
- **Separation of concerns**: “what the source says” vs “what the concept is” vs “how to teach it.”

## 6. System overview

The pipeline is implemented as Volcano SDK agents (specialists) coordinated by a primary “Coordinator” agent. Each ingestion run operates on an input file (e.g., chapter text) and writes output notes into the vault plus updated indexes.

High-level stages:

1) **Ingest**: register input material + metadata as a `source_anchor` note.  
2) **Extract**: identify candidate concepts/procedures/claims/misconceptions and produce atomic notes.  
3) **Model**: convert candidates into generic, teachable artifacts (DBM/NLP-style deep-structure).  
4) **Link**: resolve links to existing concepts; create stubs for “known unknowns”; add backlinks via indexing.  
5) **Index**: rebuild full-text, embeddings (optional), and graph/backlinks indexes.  
6) **Generate**: create educational outputs (fable, lesson outline, exercises, assessments) grounded in retrieved notes.  
7) **Curate** (optional): merge duplicates, promote stubs, improve titles/aliases.

## 7. Data model

### 7.1 Vault layout (file system)

Recommended minimal layout:

- `vault/`
  - `sources/` — `source_anchor` notes (one per book/chapter/video)
  - `objectives/` — learning objectives (canonical “join keys”)
  - `concepts/` — canonical concepts (including stubs)
  - `procedures/` — step-by-step methods
  - `principles/` — heuristics, decision rules
  - `misconceptions/` — common mistakes + corrections
  - `examples/` — original cases, business mini-scenarios
  - `activities/` — practice tasks + facilitation notes
  - `assessments/` — quiz items, rubrics
  - `stories/` — generated business fables + facilitator appendix
  - `storyboards/` — beat-by-beat story plans that map to objectives
  - `microlearning/` — microlearning units (cards/steps) mapped to objectives
  - `_system/` — system assets (prompts, promptsets, eval reports)
  - `eval/` — evaluation corpus and expectations (optional)
  - `_index/` — derived machine indexes (JSON, SQLite, embeddings store)

### 7.2 Note ID strategy

- **Concept notes** (including stubs): deterministic slug IDs, e.g. `concept-query-expansion`.  
- **Atomic extraction notes / “zettels”**: time-based IDs, e.g. `20260103T142233Z-grow-observable-goals`.  
- **Generated story notes**: deterministic from objective + seed, e.g. `story-obj-observable-goals-001`.

All notes store `id` in YAML frontmatter and filenames match `id.md`.

### 7.3 Recommended note types (MVP)

- `source_anchor`
- `learning_objective`
- `concept` (with `status: stub|draft|evergreen`)
- `procedure`
- `principle`
- `misconception`
- `example_case`
- `activity`
- `assessment_item`
- `story`
- `storyboard`
- `microlearning_unit`

A full schema (frontmatter + required sections) is in `docs/NOTE_TYPES_AND_LINKS.md`.

### 7.4 Link categories (MVP)

- `derived_from` (provenance): modeled notes → `source_anchor`
- `prerequisite` (knowledge dependency): concept/procedure → concept/objective/activity
- `part_of` (composition): component → system
- `applies_to` (usage): concept/procedure → example/activity/story scene
- `contrasts_with` (alternative lens): concept ↔ concept
- `supports_objective` (alignment): concept/procedure/principle/story → learning objective
- `practices_objective` (practice): activity/microlearning → learning objective
- `primary_objective` (anchoring): content artifact → learning objective (exactly one)
- `assesses` (measurement): assessment → objective/concept
- `addresses_misconception` (remediation): misconception → concept/objective

MVP stores these as labeled sections in Markdown plus optional frontmatter arrays for indexing.

## 8. Stub creation (the “known unknowns” mechanism)

A stub is created when the agent detects that a concept is required for comprehension or execution but is not yet present in the vault. The stub is an addressable landing page with scope and open questions, not a full explanation.

### 8.1 When to create a stub

Create a stub when any of the following conditions is met:

- The text implies a prerequisite concept not explained locally (presuppositions / missing background).
- Evaluative terms imply missing criteria (e.g., “effective”, “good”, “better”).
- Nominalizations imply missing operational definitions (e.g., “alignment”, “trust”, “engagement”).
- Cause-effect language implies an unstated mechanism or boundary conditions.

### 8.2 Stub content rules (MVP)

A stub may contain:
- title + aliases
- scope statement (1–2 sentences)
- open questions
- one optional “working hypothesis” explicitly marked as hypothesis (not as fact)

A stub should not contain long paraphrases of the source and should not attempt to “complete” the author’s explanation unless later evidence is added and linked.

## 8.3 Prompt system in the vault (first-class assets)

Prompts are treated as system assets and stored inside the vault under a dedicated namespace (recommended: `vault/_system/prompts/`). Prompts are versioned, linkable, and governed by an explicit rendering contract. Volcano steps reference prompt IDs, not hardcoded prompt strings.

Canonical pattern:
- A prompt is a Markdown note with YAML frontmatter defining required variables, plus a template body.
- The Coordinator builds a per-step `RunContext` object, validates it against the prompt’s declared variables, renders the prompt, and executes the step.
- Prompt changes are promoted only via an evaluation gate (see self-improvement loop below).

System notes are excluded from normal educational retrieval by default (e.g., the Storyteller should not retrieve system prompts).

## 8.4 Prompt contract and templating (generic injection)

The system supports dynamic injection (paths, filenames, note IDs, retrieval sets, constraints) via a standardized context object.

Requirements:
- Prompts declare variables and types in frontmatter.
- The Coordinator validates that all required variables exist and types match.
- The prompt body uses a single templating engine (recommended: Handlebars) with limited helpers (e.g., `json`, `join`).
- The agent reads/writes files directly; prompts should inject file references, not raw source text.

See: `docs/PROMPT_CONTRACT.md`.

## 8.5 Self-improvement loop (evaluation + promotion)

The system includes two feedback loops:

In-run repair loop:
- After each run, QA/Verifier produces a machine-readable issue list (schema violations, missing links, weak sections).
- The Coordinator re-runs only the failing step(s) with the issue list as constraints and produces a repaired output.

Cross-run prompt evolution loop:
- Maintain an evaluation corpus (`eval/corpus/`) and a set of property-based expectations (not “gold text”).
- A dedicated Evaluator compares baseline promptset vs candidate promptset across the corpus.
- Only candidates that meet gate thresholds are promoted to “current”.

Artifacts:
- Prompt notes: `vault/_system/prompts/prompt-*.md`
- Promptsets: `vault/_system/promptsets/promptset-*.md`
- Eval reports: `vault/_system/eval/eval-<run>.md` plus JSON metrics in `vault/_index/eval/`

See: `docs/ADDON_SELF_IMPROVEMENT_AND_PROMPTS_IN_VAULT.md` and `docs/PROMPT_EVOLUTION_WORKFLOW.md`.
## 8.6 Top improvement candidates (ranked)

This section describes five high-impact improvements for system quality and autonomy. The recommended next step is Improvement #1, because it enables safe, compounding iteration across prompts and pipeline logic.

1) **Regression harness + promotion gates (highest impact)**: corpus-based evaluation with deterministic detectors, property-based expectations, metrics comparison, and gated promotion of promptsets/pipeline changes.

2) **Concept normalization (dedupe + aliases + canonical IDs)**: continuous merge-candidate detection, alias notes, redirects, and hub stabilization to prevent vault entropy.

3) **Constraint-driven pack planner (assembly-first generation)**: produce a plan (objective, prerequisites, misconception, practice, assessment mode, size) and then generate artifacts from the plan.

4) **Claim-level provenance layer**: model notes contain explicit, paraphrased claims with traceable provenance fields and confidence/coverage tags.

5) **Usage feedback loop**: ingest training analytics and facilitator notes into misconception updates, mastery criteria refinement, and better assessment items.

Detailed specifications:
- `docs/ADDON_IMPROVEMENTS_RANKED.md`
- `docs/EVAL_HARNESS_AND_PROMOTION_GATES.md`
- `docs/DETECTORS_AND_EXPECTATIONS.md`
## 9. Volcano SDK architecture

### 9.1 Agent roles

- **Coordinator**: orchestrates the run; maintains state; decides which specialist runs next.
- **Ingestor**: creates/updates `source_anchor` notes and ingestion manifests.
- **Extractor**: produces candidate atomic notes (raw but already paraphrased).
- **Modeler**: converts candidates into structured educational artifacts (procedure/principle/misconception/etc.).
- **Linker**: resolves wikilinks; creates stubs; adds `derived_from` references.
- **Indexer**: rebuilds `_index/` artifacts (backlinks, graph, search docs, embeddings).
- **Storyteller**: generates business fables grounded in selected objectives and retrieved notes.
- **QA/Verifier**: checks formatting, required sections, “no long quotes”, and link validity.

### 9.2 Tooling model

The agent assumes filesystem read/write. Optional MCP servers are used for:
- embeddings + vector search
- external bibliographic lookups (optional)
- rendering/exports (e.g., PDF, HTML) (optional)

Volcano SDK provides multi-step workflows, branching, retries/timeouts, and OpenTelemetry hooks for observability of runs.

## 10. Core pipeline requirements

### 10.1 Ingestion

- Must create a `source_anchor` note containing minimal bibliographic metadata and pointers to the input file(s).
- Must store ingestion manifest under `_index/ingestion/<run-id>.json` recording files read and notes created.

### 10.2 Extraction + Modeling

- Must output only modeled artifacts (definitions, criteria, procedures, misconceptions) and original examples.
- Must avoid storing long verbatim text from sources.
- Must attach provenance: each modeled note links to one or more `source_anchor` notes via `derived_from`.

### 10.3 Linking + Stub creation

- Every new modeled note must link to at least 1 concept (existing or newly stubbed).
- The Linker must ensure all wikilinks resolve to a file in the vault; missing targets become stubs.
- The system must compute backlinks and expose them in `_index/backlinks.json`.

### 10.4 Indexes

Minimum derived artifacts:

- `_index/notes.json` (metadata per note: id, type, title, aliases, outbound links, source refs)
- `_index/backlinks.json` (target → list of inbound note ids)
- `_index/graph.json` (nodes + edges for visualization)
- `_index/search.jsonl` (one JSON per note for full-text search tooling)

Optional:

- `_index/embeddings/` (vector store) with deterministic embedding IDs (note id + section hash).

### 10.5 Content generation (business fables)

The Storyteller must be able to generate:

- a short fable-style story (1–3 pages equivalent)
- a “facilitator appendix” that maps story beats → concepts/procedures/misconceptions
- a storyboard note (beats/scenes + learning mapping)
- 3–7 microlearning cards/steps as a `microlearning_unit`
- one practice activity (5–15 minutes) aligned to the same objective
- 3–5 assessment items (MCQ or short answer) with answer key + rationale

Each story must link back to the used concepts/procedures via `applies_to` and store the selection set in frontmatter for traceability.

## 11. Library choices (open source)

### Recommended “vault engine”
- `@tereza-tech/zettel` for reading notes, tags, and generating graph data from a notes directory.

### Recommended Markdown parsing for wikilinks
- `@flowershow/remark-wiki-link` to parse Obsidian-style `[[wikilinks]]`.
- `@gocoder/remark-obsidian-links` or `remark-obsidian-link` to convert internal links to standard links if needed.

The PRD assumes you can mix: the vault stays plain Markdown, while your indexer uses remark/unified for precise parsing and your graph export can use either your own index or Zettel’s graph output.

## 12. Quality gates (automated)

- All notes must parse as valid Markdown and include required sections per type.
- No note may contain quotation blocks longer than a configurable threshold (default: 25 words per quote).
- Every wikilink must resolve to an existing file (or a stub created in the same run).
- Duplicate concept detection: warn when two concept notes exceed similarity threshold and share aliases.
- Story output must cite (via links) at least N concept/procedure notes used.

## 13. MVP scope and milestones

### MVP-1: Vault + Index + Stub creation
- Vault layout + note schemas
- Ingestion + extraction + modeling for `concept`, `procedure`, `misconception`
- Stub resolver
- Backlinks + graph index rebuild
- Basic CLI entrypoint

### MVP-2: Education generation pack
- Activity + assessment generation
- Story fable generation with facilitator appendix
- “Objective-driven” retrieval and assembly

### MVP-3: Curation + progressive formalization
- Duplicate merges (aliases + redirects)
- Stub promotion workflow
- Light taxonomy emergence reports (top hubs, strongest contrasts)

### MVP-4: Prompt evolution and self-improvement
- Store prompts as `system_prompt` notes in the vault with typed variables
- Maintain `promptset` releases and a promotion gate
- Evaluation corpus + metrics + regression runs
- Automatic in-run repair loop based on QA findings

### MVP-5: Regression harness and promotion gates (recommended next)
- Maintain an eval corpus with expectations
- Deterministic detectors + property checks
- Baseline vs candidate comparison
- Hard gates + promotion log
- Optional: nightly regression runs via automation

## 14. Acceptance criteria

- Given a chapter input, the pipeline produces:
  - at least 5 modeled notes (mix of concept/procedure/misconception)
  - at least 1 stub when prerequisites are implied
  - valid backlinks and graph index
- Given a selected objective note, the system generates a story pack (story + storyboard + microlearning + activity + assessment) where every key claim is linked to vault notes.
- Re-running indexing produces identical backlinks/graph outputs (idempotence), except for timestamped run manifests.

## 15. Open questions

- Which DBM/NLP modeling representation should be canonical in notes (TOTE, logical levels, metamodel prompts, decision tables)?
- Do we want a separate `learning_objective` note type now, or embed objectives inside story/activity notes until later?
- Embeddings provider: local vs cloud; do we store embeddings in SQLite/FAISS or via an MCP server?
- Do we maintain “redirect notes” for merged concept IDs, or update all backlinks in-place?

---

See also:
- `docs/NOTE_TYPES_AND_LINKS.md`
- `docs/VOLCANO_WORKFLOWS.md`
- `docs/VAULT_LAYOUT.md`
- `prompts/` for prompt templates (file-oriented)
- `code/agent-skeleton/` for a minimal Volcano SDK orchestration example

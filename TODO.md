# TODO - Canon Extraction Pipeline

**Last Updated**: 2026-01-10  
**Source**: Discussions + PRDV2/14

---

## ✅ Completed (Jan 8, 2026)

### Phase 1 vNext Pipeline
- [x] New `vnext-pipeline.yml` runbook (v2.0)
- [x] `model_bundle` step (extract + model + verify in one)
- [x] Fast mode for sources < 10kb
- [x] Stubs go to `stubs/` folder
- [x] Runbook orchestrator (PRD-12) - main entry point

### Embedding-Based Deduplication
- [x] Azure embed-v-4-0 provider (`azure-embedding-provider.ts`)
- [x] SQLite-vec vector store (`vector-store.ts`)
- [x] Dedup check before modeling candidates
- [x] Dedup check before creating stubs
- [x] Configurable threshold (0.7) and top-k (3)

### Clean Filenames
- [x] Remove type prefix from IDs/filenames
- [x] `friction-budget.md` not `concept-friction-budget.md`
- [x] Folder still organizes by type (`concepts/`, `principles/`, etc.)

### Improved Prompts
- [x] `embedding_keys` required (3-5 semantic keywords)
- [x] `embedding_match_keys` in link_intents
- [x] Human-readable `derived_from` with source_title
- [x] Term abstraction (e.g., "Level 1" not "Rung A")
- [x] Max 5 inline links, max 3-5 link_intents

### Validation
- [x] `phase1-validator.ts` CLI tool
- [x] `--strict` mode (warnings = failures)
- [x] Unit tests for output requirements

---

## � Phase 1 Completion (HIGH PRIORITY)

> These items MUST be done before Phase 2 (Generation). From discussion reviews.

### Embedding Quality - Critical Gaps
- [ ] **Better candidate keywords for dedup** - use `reason` + `quote`, not just title words
  - File: `step-executors.ts:627-635`
  - Currently: `name.split()` → just title words, no semantic context
  - Fix: Include extractor's `reason` field + quote snippet
- [ ] **LLM verification for ambiguous matches (0.7-0.9)**
  - Add GPT-5-nano call: "Are A and B the same concept?"
  - File: `step-executors.ts` after dedup check
- [ ] **Create link when duplicate found** (BUG!)
  - Currently: just skips → broken Zettelkasten
  - Fix: Track skipped candidates, create wikilink to existing note
- [ ] **Index stubs with embedding keys**
  - Currently: stubs can't be found by semantic search
  - File: `linker.ts` after writing stub

### Dedup Threshold Tuning
- [ ] Test edge cases: "The Calibration Loop" vs "Calibration Loop"
- [ ] Tune threshold (0.7 may be too low/high)
- [ ] Implement tiered thresholds:
  - ≥ 0.9 → auto-merge content
  - 0.7-0.9 → LLM verification
  - 0.5-0.7 → create + link as related
  - < 0.5 → create new

### Multi-Source Processing
- [ ] **Source manifest** for folders/books
  - Type: book, webinar, course
  - Structure: chapters, recordings, slides
  - Original order/hierarchy
- [ ] **Batch ingestion** - loop through files maintaining order
- [ ] **Sliding window extract+model** - one pass per window

---

## 📋 Phase 1b - Content Index Enhancement

> From discussion: embed more than just keywords

- [ ] **Content Index** - embed definitions + full note content
  - Better dedup: compare definitions, not just titles
  - Semantic search: "Find notes about learning plateaus"
  - Related notes: notes with similar key ideas
- [ ] Store in vector DB:
  - `definition_embedding` (first paragraph)
  - `full_content_embedding` (entire body)
  - `summary` (LLM-generated 1-sentence)

---

## 📋 Phase 2 - Generation (After Phase 1 Complete)

> From PRDV2/14: SQLite Asset Store + Learning Assets

### Asset Store (PRD-14)
- [ ] **Per-vault SQLite DB** (`_db/vault.sqlite`)
  - Tables: `assets`, `asset_versions`, `edges`, `runs`, `prompts`, `metrics`
  - FTS5 for full-text search
  - Embeddings for semantic retrieval
- [ ] **Asset types**:
  - Microlearning units (Hook-Value-Action)
  - Scenario sets / simulations
  - Quiz items + rubrics
  - Story outlines / beat sheets
  - Podcast outlines
  - Practice prompt sets
- [ ] **Single-writer queue** for parallel safety
  - Workers write JSON envelopes to `_runs/<run_id>/out/`
  - Writer service commits to DB in batches
  - WAL mode + busy_timeout

### JSON Envelope Output (PRD-14)
- [ ] Update modeler to output JSON envelope:
  ```json
  {
    "grounded_note": {..., "source_refs": [...]},
    "link_candidates": [...],
    "assets": [...],
    "edges": [...]
  }
  ```
- [ ] Add `db_upsert_assets` step (no LLM)
- [ ] Asset signatures for dedupe/merge

### Retrieval API
- [ ] Hybrid retrieval: FTS → vector rerank → edge expansion
- [ ] Filter by: `asset_type`, `audience_level`, `domain`, `status`

---

## 📋 Phase 3 - Self-Learning

### Feedback Loop
- [ ] Failure analysis → prompt improvement
- [ ] Auto-tune thresholds based on feedback
- [ ] User corrections → training data
- [ ] Track verification failures for learning

### Multi-Source
- [ ] Cross-source linking
- [ ] Source dependency graph
- [ ] Reconstruct original teaching flow from notes

---

## 📋 Future Ideas

### SQLite Expansion
- [ ] Use SQLite for backlinks index (not just JSON)
- [ ] FTS5 for full-text search across vault
- [ ] Consider notes-in-SQLite vs files (major arch change)

### Export
- [ ] Obsidian plugin compatibility
- [ ] Export to Anki flashcards
- [ ] PDF generation

### Performance
- [ ] Parallel extraction for large sources
- [ ] Streaming output for long runs
- [ ] Resume from checkpoint
- [ ] Batch embedding calls
- [ ] Cache embeddings across runs

---

## 🐛 Known Issues

1. **Stubs created for existing concepts**
   - "The Calibration Loop" vs "Calibration Loop" - slight naming difference
   - Solution: Improve embedding keywords + fuzzy title matching

2. **No link when duplicate skipped**
   - Currently: skip silently → loses Zettelkasten connections
   - Solution: Create wikilink to existing note

3. **Candidate keywords too weak**
   - Currently: just title words split
   - Solution: Use extractor's reason + quote

4. **Stubs not indexed**
   - Currently: can't be found by semantic search
   - Solution: Index with embedding_match_keys

---

## � References

- **Discussions**: `discussions/2026-01-08_vnext-pipeline-flow.md`, `discussions/2026-01-09_embedding-architecture.md`
- **PRD-14**: `PRDV2/14/docs/IDEATION-PRD-SQLITE-ASSETS-CONCURRENCY-v1.4.md`
- **Docs**: `docs/system_overview.md`, `docs/pipeline_map.md`, `docs/ops_runbook.md`

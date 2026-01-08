# TODO - Canon Extraction Pipeline

## ✅ Completed (Jan 8, 2026)

### Phase 1 vNext Pipeline
- [x] New `vnext-pipeline.yml` runbook (v2.0)
- [x] `model_bundle` step (extract + model + verify in one)
- [x] Fast mode for sources < 10kb
- [x] Stubs go to `stubs/` folder

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

## 🚧 In Progress

### Embedding Quality
- [ ] Test embedding similarity accuracy with edge cases
- [ ] Tune threshold (0.7 may be too low/high)
- [ ] Add LLM verification for ambiguous matches (0.7-0.9)

---

## 📋 TODO - Phase 2

### Embeddings Improvements
- [ ] Index stubs with their embedding_match_keys
- [ ] Batch embedding calls (reduce API usage)
- [ ] Cache embeddings across runs
- [ ] Add embedding similarity to LINK_INTENTS output

### Link Resolution
- [ ] Replace [[wikilinks]] with actual file paths after linking
- [ ] Generate backlinks.json automatically
- [ ] MOC generation from graph traversal

### Verification
- [ ] Duplicate detection agent (post-run fixer)
- [ ] Grounding audit improvements
- [ ] Track verification failures for self-learning

### Performance
- [ ] Parallel extraction for large sources
- [ ] Streaming output for long runs
- [ ] Resume from checkpoint

### Testing
- [ ] Integration tests for full pipeline
- [ ] Benchmark regression tests
- [ ] Embedding similarity unit tests

---

## 📋 TODO - Phase 3

### Multi-Source
- [ ] Process folder of sources
- [ ] Cross-source linking
- [ ] Source dependency graph

### Self-Learning
- [ ] Failure analysis → prompt improvement
- [ ] Auto-tune thresholds based on feedback
- [ ] User corrections → training data

### Export
- [ ] Obsidian plugin compatibility
- [ ] Export to Anki flashcards
- [ ] PDF generation

---

## 🐛 Known Issues

1. **Some stubs created for existing concepts**
   - "The Calibration Loop" vs "Calibration Loop" - slight naming difference
   - Solution: Improve embedding keywords or add fuzzy title matching

2. **Verifier sections mismatch**
   - Prompt uses "Key Components" but verifier expected "Operationalization"
   - Fixed in prompt-verify-note.md v2

3. **LINK_INTENTS sometimes missing closing backticks**
   - LLM truncates output
   - Solution: Parser handles missing backticks

---

## 📝 Notes

- Vector DB stored at `_index/vectors.db` (SQLite-vec)
- Embeddings generated from `embedding_keys` (notes) or title words (stubs)
- Threshold 0.7 = 70% cosine similarity required for match

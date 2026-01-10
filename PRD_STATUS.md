# Project Status

**Last Updated**: 2026-01-10  
**Documentation Source of Truth**: `docs/` folder

---

## ✅ Completed (Production Ready)

### Core Pipeline
| Feature                           | Status | Evidence                                 |
| --------------------------------- | ------ | ---------------------------------------- |
| Runbook-driven orchestration      | ✅ Done | `run --runbook <id>` is main entry point |
| vNext Pipeline v2.0 (9 steps)     | ✅ Done | `vnext-pipeline.yml`                     |
| Chunk streaming + sliding windows | ✅ Done | `chunker.ts`, `window-assembler.ts`      |
| GPT-5-nano gating                 | ✅ Done | Fast mode for <10kb sources              |
| Embedding-based deduplication     | ✅ Done | SQLite-vec, tiered thresholds            |
| Phase 1 validator                 | ✅ Done | `--strict` mode                          |
| Multi-model architecture          | ✅ Done | DeepSeek + GPT-5-nano + embed-v-4-0      |

### Pipeline Stages (all integrated)
```
ingest → chunk → gate → model_bundle → verify → link → emit_candidates → emergent_artifacts → index
```

### Note Types (10 total)
- **5 Extraction**: concept, procedure, principle, misconception, example
- **5 Rendition**: MOC, bridge, trail, strand, stub

### Output Features
| Feature                                  | Status | Notes                                                 |
| ---------------------------------------- | ------ | ----------------------------------------------------- |
| Clean filenames                          | ✅ Done | `friction-budget.md` not `concept-friction-budget.md` |
| `embedding_keys` in frontmatter          | ✅ Done | 3-5 semantic keywords                                 |
| `derived_from` with source_title         | ✅ Done | Human-readable provenance                             |
| `link_intents` with embedding_match_keys | ✅ Done | Max 5 per note                                        |
| Term abstraction                         | ✅ Done | Generic terms, not source-specific                    |

---

## 🚧 In Progress

### Embedding Quality Tuning
- [ ] Test similarity accuracy with edge cases
- [ ] Tune threshold (0.7 may be too low/high)
- [ ] Add LLM verification for ambiguous matches (0.7-0.9)

---

## 📋 TODO - Phase 2

### Embeddings Improvements
- [ ] Index stubs with their embedding_match_keys
- [ ] Batch embedding calls (reduce API usage)
- [ ] Cache embeddings across runs

### Link Resolution Enhancements
- [ ] Replace `[[wikilinks]]` with actual file paths
- [ ] Generate backlinks.json automatically (partially done)

### Performance
- [ ] Parallel extraction for large sources
- [ ] Resume from checkpoint

### Testing
- [ ] Integration tests for full pipeline
- [ ] Benchmark regression tests

---

## 📋 TODO - Phase 3

### Multi-Source
- [ ] Process folder of sources
- [ ] Cross-source linking

### Export
- [ ] Obsidian plugin compatibility
- [ ] Export to Anki flashcards

---

## 🔧 Quick Commands

```bash
# Full pipeline run
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./content.md \
  --vault ./vault

# Validate output
npx tsx src/systems/research/utils/phase1-validator.ts ./vault --strict

# Benchmark run
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./benchmark/run-$(date +%Y-%m-%d-%H%M)
```

---

## 📚 Documentation

| Document                                                  | Purpose                            |
| --------------------------------------------------------- | ---------------------------------- |
| [system_overview.md](docs/system_overview.md)             | What the system does, capabilities |
| [pipeline_map.md](docs/pipeline_map.md)                   | Stage-by-stage pipeline details    |
| [ops_runbook.md](docs/ops_runbook.md)                     | How to run, configure, debug       |
| [data_lineage.md](docs/data_lineage.md)                   | Data flow from source to artifacts |
| [project-context.md](.agent/workflows/project-context.md) | Quick reference for agents         |

---

## 🐛 Known Issues

1. **Stub naming mismatch** - "The Calibration Loop" vs "Calibration Loop" creates duplicate stubs
   - *Fix*: Improve embedding keywords or add fuzzy title matching

2. **LINK_INTENTS truncation** - LLM sometimes truncates output
   - *Fix*: Parser handles missing backticks

---

## History

- **Jan 8, 2026** - Phase 1 vNext pipeline completed
- **Jan 6, 2026** - Runbook orchestrator integrated (PRD-12)
- **Jan 5, 2026** - Embedding deduplication added
- **Jan 4, 2026** - Gap statement format, repair instructions

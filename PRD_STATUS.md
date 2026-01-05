# PRD V2 Implementation Status

**Date**: 2026-01-05
**Last Run**: Not yet tested (modules created)

## MVP-1: Vault + Index + Stub Creation ✅ COMPLETE
| Feature | Status | Notes |
|---------|--------|-------|
| Vault layout + note schemas | ✅ | `concepts/`, `procedures/`, `principles/`, etc. |
| Ingestion | ✅ | `Ingestor` agent creates `source_anchor` notes |
| Extraction | ✅ | `Extractor` agent identifies candidates |
| Modeling for concept/procedure/principle/misconception | ✅ | `Modeler` agent with Gap Statement support |
| Stub resolver (Linker) | ✅ | Creates stubs for broken wikilinks |
| Backlinks + graph index | ✅ | `Indexer` generates `notes.json`, `backlinks.json` |
| Basic CLI entrypoint | ✅ | `cli.ts ingest --file` |

## MVP-2: Education Generation Pack 🟡 PARTIAL
| Feature | Status | Notes |
|---------|--------|-------|
| Story fable generation | ✅ | `Storyteller` agent creates stories |
| Storyboard in story | ✅ | Included in story output |
| Microlearning in story | ✅ | Included in story output |
| Facilitator appendix | ❌ | Not implemented |
| Activity generation | ❌ | Not implemented |
| Assessment generation | ❌ | Not implemented |
| Objective-driven retrieval | ❌ | No `learning_objective` note type yet |

## MVP-3: Curation + Progressive Formalization ❌ NOT STARTED
| Feature | Status | Notes |
|---------|--------|-------|
| Duplicate merges (aliases + redirects) | ❌ | Resolver exists but no alias/redirect notes |
| Stub promotion workflow | ❌ | Not implemented |
| Taxonomy emergence reports | ❌ | Not implemented |

## MVP-4: Prompt Evolution and Self-Improvement 🟡 PARTIAL
| Feature | Status | Notes |
|---------|--------|-------|
| Prompts as vault notes | ✅ | Already stored in `_system/prompts/` |
| Promptset releases | 🟡 | `promptset-current.md` exists, no versioning |
| Evaluation corpus | ✅ | Step scenarios framework ready |
| Regression runs | ✅ | `step-scenario-runner.ts` created |
| In-run repair loop | ✅ | Implemented (retry with repair instructions) |

## MVP-5: Regression Harness ✅ FRAMEWORK COMPLETE
| Feature | Status | Notes |
|---------|--------|-------|
| Eval corpus with expectations | ✅ | `step_scenario.schema.json` + runner |
| Deterministic detectors | ✅ | `comparators.ts` (exactJson, setOverlap, etc.) |
| Baseline vs candidate comparison | ✅ | `nkm-builder.ts` (precision/recall/F1) |
| Promotion gates | ✅ | `runbook-runner.ts` with evaluation gates |

---

## PRD V2 Enhancement Add-ons ✅ IMPLEMENTED

### PRD-05: Chunk Streaming & Gating
| Feature | Status | Notes |
|---------|--------|-------|
| Evidence storage (`_sources/`) | ✅ | `chunker.ts` |
| Chunk Gate (Ollama) | ✅ | `chunk-gate.ts` |
| Sliding windows (PREV/CURRENT/NEXT) | ✅ | `window-assembler.ts` |

### PRD-06: DBM Lens
| Feature | Status | Notes |
|---------|--------|-------|
| Lens registry | ✅ | `lens-registry.ts` |
| DBM renditions | ✅ | `agents/lenses/lens-dbm.ts` |

### PRD-09: Dynamic Vault Path + Stepwise Eval
| Feature | Status | Notes |
|---------|--------|-------|
| `--vault <path>` CLI flag | ✅ | `cli.ts` updated |
| Step scenario runner | ✅ | `eval/step-scenario-runner.ts` |

### PRD-10: Round-Trip Evaluation
| Feature | Status | Notes |
|---------|--------|-------|
| NKM format | ✅ | `eval/nkm-builder.ts` |
| Round-trip comparator | ✅ | `compareNKMs()` with P/R/F1 |

### PRD-11: Domain Primer
| Feature | Status | Notes |
|---------|--------|-------|
| Primer loader | ✅ | `primer-loader.ts` |
| Step-aware injection | ✅ | `renderPrimerHeader()` |
| Token budget enforcement | ✅ | 250/300/600 defaults |

### PRD-12: Runbook Orchestrator
| Feature | Status | Notes |
|---------|--------|-------|
| Runbook loader | ✅ | `runbook-loader.ts` |
| Runbook runner | ✅ | `runbook-runner.ts` |
| Evaluation gates | ✅ | `checkEvaluationGate()` |

---

## Critical Fixes Applied (2026-01-04)
1. ✅ **YAML `derived_from`**: Now required in frontmatter, not just body links
2. ✅ **Gap Statement Format**: Replaces bare "Insufficient evidence" placeholders
3. ✅ **Context Window**: Modeler receives ±2000 chars around quote, not just quote
4. ✅ **Type Validation**: Cross-type merges blocked in orchestrator
5. ✅ **Repair Instructions**: Verifier issues fed back as explicit fix directives

## Recommended Next Steps
1. **Run Integration Test**: Test with DeepSeek + Ollama on a sample chapter
2. **Add Sample Runbook**: Create `ingest_and_model.yml` for declarative workflow
3. **Create Step Scenarios**: Add test cases for gate and modeler validation


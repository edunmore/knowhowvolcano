# PRD V2 Implementation Status

**Date**: 2026-01-04
**Last Run**: Successful (Pipeline completed with all verification passing)

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

## MVP-4: Prompt Evolution and Self-Improvement ❌ NOT STARTED
| Feature | Status | Notes |
|---------|--------|-------|
| Prompts as vault notes | ✅ | Already stored in `_system/prompts/` |
| Promptset releases | 🟡 | `promptset-current.md` exists, no versioning |
| Evaluation corpus | ❌ | Not implemented |
| Regression runs | ❌ | Not implemented |
| In-run repair loop | ✅ | Implemented (retry with repair instructions) |

## MVP-5: Regression Harness ❌ NOT STARTED
| Feature | Status | Notes |
|---------|--------|-------|
| Eval corpus with expectations | ❌ | Not implemented |
| Deterministic detectors | ❌ | Not implemented |
| Baseline vs candidate comparison | ❌ | Not implemented |
| Promotion gates | ❌ | Not implemented |

---

## Critical Fixes Applied (2026-01-04)
1. ✅ **YAML `derived_from`**: Now required in frontmatter, not just body links
2. ✅ **Gap Statement Format**: Replaces bare "Insufficient evidence" placeholders
3. ✅ **Context Window**: Modeler receives ±2000 chars around quote, not just quote
4. ✅ **Type Validation**: Cross-type merges blocked in orchestrator
5. ✅ **Repair Instructions**: Verifier issues fed back as explicit fix directives

## Recommended Next Steps
1. **MVP-2 Completion**: Add Activity and Assessment generators
2. **Learning Objectives**: Implement `learning_objective` note type for objective-driven retrieval
3. **Facilitator Appendix**: Add to Storyteller output
4. **Resolver Scalability**: Implement fuzzy prefilter or vector search (Warning in promptset)

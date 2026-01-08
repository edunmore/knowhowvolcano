# PRD V2 Implementation Status

**Date**: 2026-01-06 (Audit Update)
**Last Run**: 2026-01-05 - Benchmark tests
**Status Key**: ✅ Integrated & Working | 🟡 Scaffolded (Not Integrated) | ❌ Not Started

---

## Critical Finding: Hardcoded Pipeline

> [!WARNING]
> The system runs on a **hardcoded pipeline** in `orchestrator.ts`:
> `ingest → extract → resolve → model → verify → link → index → story`
> 
> Many PRD modules exist as standalone code but are **NOT integrated** into CLI or orchestrator.

---

## MVP-1: Vault + Index + Stub Creation ✅ WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Vault layout + note schemas | ✅ | `concepts/`, `procedures/`, `principles/`, etc. |
| Ingestion (hash-based IDs) | ✅ | `ingestor.ts` - NO LLM, uses content hash |
| Extraction | ✅ | `extractor.ts` identifies candidates |
| Modeling (concept/procedure/principle/misconception/example) | ✅ | `modeler.ts` with Gap Statement support |
| Verifier (repair loop) | ✅ | `verifier.ts` - issues fed back as repair instructions |
| Link Resolution (two-phase) | ✅ | `link-resolver.ts` + `linker.ts` for stubs |
| Backlinks + graph index | ✅ | `indexer.ts` generates `notes.json`, `backlinks.json` |
| Basic CLI (`ingest --file`) | ✅ | Single command available |

---

## MVP-2: Education Generation Pack 🟡 PARTIAL

| Feature | Status | Notes |
|---------|--------|-------|
| Story fable generation | ✅ | `storyteller.ts` integrated in orchestrator |
| Storyboard in story | ❌ | Not generated separately |
| Microlearning in story | ❌ | Not generated separately |
| Facilitator appendix | ❌ | Not implemented |
| Activity generation | ❌ | Not implemented |
| Assessment generation | ❌ | Not implemented |
| `learning_objective` note type | ❌ | No note type definition |
| Objective-driven retrieval | ❌ | No retrieval by objective |

---

## MVP-3: Curation + Progressive Formalization ❌ NOT STARTED

| Feature | Status | Notes |
|---------|--------|-------|
| Duplicate merges (aliases + redirects) | ❌ | Resolver exists but no merge workflow |
| Stub promotion workflow | ❌ | Not implemented |
| Taxonomy emergence reports | ❌ | Not implemented |

---

## MVP-4: Prompt Evolution and Self-Improvement 🟡 PARTIAL

| Feature | Status | Notes |
|---------|--------|-------|
| Prompts as vault notes | ✅ | Stored in `_system/prompts/` |
| Promptset releases | 🟡 | `promptset-current.md` exists, no versioning |
| In-run repair loop | ✅ | Implemented (retry with repair instructions) |
| Evaluation corpus format | 🟡 | Schema exists, no actual corpus |
| Regression runs | 🟡 | `step-scenario-runner.ts` exists, **NOT in CLI** |

---

## MVP-5: Regression Harness ❌ SCAFFOLDED ONLY

| Feature | Status | Notes |
|---------|--------|-------|
| Eval corpus with expectations | 🟡 | `step_scenario.schema.json` exists, **no CLI command** |
| Deterministic comparators | 🟡 | `comparators.ts` exists, **not hooked to pipeline** |
| Baseline vs candidate comparison | 🟡 | `nkm-builder.ts` exists, **no CLI command** |
| Promotion gates | 🟡 | Logic in `runbook-runner.ts`, **not connected** |

---

## PRD Enhancement Add-ons

### PRD-05: Chunk Streaming & Gating 🟡 SCAFFOLDED

| Feature | Status | Notes |
|---------|--------|-------|
| Evidence storage (`_sources/`) | 🟡 | `chunker.ts` exists, **NOT called by orchestrator** |
| Chunk Gate (Ollama) | 🟡 | `chunk-gate.ts` exists, **NOT called** |
| Sliding windows (PREV/CURRENT/NEXT) | 🟡 | `window-assembler.ts` exists, **NOT used** |

**Reality**: Orchestrator reads whole file, NOT chunked. Gate never runs.

### PRD-06: DBM Lens 🟡 SCAFFOLDED

| Feature | Status | Notes |
|---------|--------|-------|
| Lens registry | 🟡 | `lens-registry.ts` exists, **not imported anywhere** |
| DBM renditions | 🟡 | `agents/lenses/lens-dbm.ts` exists, **never called** |
| `--lenses <list>` CLI flag | ❌ | **Does not exist** |
| `--remodel` flag | ❌ | **Does not exist** |

### PRD-09: Dynamic Vault Path + Stepwise Eval

| Feature | Status | Notes |
|---------|--------|-------|
| `--vault <path>` CLI flag | ✅ | Works |
| Step scenario runner | 🟡 | Module exists, **no CLI command** |

### PRD-10: Round-Trip Evaluation 🟡 SCAFFOLDED

| Feature | Status | Notes |
|---------|--------|-------|
| NKM format | 🟡 | `nkm-builder.ts` exists, **no CLI command** |
| Round-trip comparator | 🟡 | `compareNKMs()` exists, **not connected** |
| `vault clone` command | ❌ | **Does not exist** |
| `compare roundtrip` command | ❌ | **Does not exist** |
| `promote system` command | ❌ | **Does not exist** |

### PRD-11: Domain Primer ✅ WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Primer loader | ✅ | `primer-loader.ts` |
| Step-aware injection | ✅ | `renderPrimerHeader()` |
| Token budget enforcement | ✅ | Defaults configured |
| Auto-create default primer | ✅ | Works on vault init |

### PRD-12: Runbook Orchestrator 🟡 SCAFFOLDED

| Feature | Status | Notes |
|---------|--------|-------|
| Runbook schema | 🟡 | `runbook.schema.json` exists |
| Runbook loader | 🟡 | `runbook-loader.ts` exists, **not used** |
| Runbook runner | 🟡 | `runbook-runner.ts` exists, **no CLI command** |
| `--runbook <id>` CLI flag | ❌ | **Does not exist** |
| Decision logging | 🟡 | Code exists, never runs |
| Evaluation gates | 🟡 | Code exists, never runs |

---

## Benchmark System ✅ WORKING

| Feature | Status | Notes |
|---------|--------|-------|
| Benchmark analyzer agent | ✅ | `eval/benchmark-analyzer.ts` |
| CLI: `analyze-benchmark.ts` | ✅ | Works as standalone script |
| History tracking | ✅ | `benchmark/_history/` |
| P/R/F1 metrics | ✅ | Calculated but evaluation logic needs tuning |

---

## Summary: What Actually Runs vs What's Scaffolded

### ✅ Actually Called in Production Pipeline (`cli.ts ingest`):

```
ingestor.ts → extractor.ts → resolver.ts → modeler.ts → verifier.ts 
→ link-resolver.ts → linker.ts → indexer.ts → storyteller.ts
```

Supporting: `primer-loader.ts`, `vault-utils.ts`, `naming.ts`, `run-logger.ts`

### 🟡 Scaffolded but NEVER Called:

| Module | Purpose | Missing Integration |
|--------|---------|---------------------|
| `chunker.ts` | Split large files | Orchestrator reads whole file |
| `chunk-gate.ts` | Triage chunks via Ollama | Never invoked |
| `window-assembler.ts` | PREV/CURRENT/NEXT context | Never imported |
| `lens-registry.ts` | Alternative modeling | No CLI flag |
| `lens-dbm.ts` | DBM lens implementation | Never called |
| `runbook-loader.ts` | Load runbook YAML | No CLI command |
| `runbook-runner.ts` | Execute runbooks | No CLI command |
| `step-scenario-runner.ts` | Run step tests | No CLI command |
| `nkm-builder.ts` | Round-trip eval | No CLI command |
| `comparators.ts` | Compare outputs | Only used by nkm-builder |

---

## Recommended Priority for Integration

1. **Chunk Streaming** (PRD-05) - Enable processing of full books
2. **Runbook Orchestrator** (PRD-12) - Replace hardcoded pipeline with declarative workflows
3. **Lenses** (PRD-06) - Enable DBM and other modeling approaches
4. **Step Evaluation** (PRD-09) - CLI command for running step tests
5. **Education Pack** (MVP-2) - Add activity/assessment/microlearning generation

---

## Critical Fixes Applied (2026-01-04)
1. ✅ **YAML `derived_from`**: Now required in frontmatter
2. ✅ **Gap Statement Format**: Replaces bare "Insufficient evidence" placeholders
3. ✅ **Context Window**: Modeler receives ±2000 chars around quote
4. ✅ **Type Validation**: Cross-type merges blocked in orchestrator
5. ✅ **Repair Instructions**: Verifier issues fed back as explicit fix directives

---

## CLI Commands Available

```bash
# The ONLY working command:
npx tsx src/systems/research/cli.ts ingest --file <file> [--vault <path>] [--provider azure-gpt52|deepseek|ollama]

# Benchmark (separate script):
npx tsx scripts/analyze-benchmark.ts <benchmark_dir> <vault_dir>
```

### CLI Commands That Should Exist But Don't:

```bash
# These do NOT work yet:
npx tsx cli.ts run --runbook <id>        # Not implemented
npx tsx cli.ts eval --step <step>        # Not implemented
npx tsx cli.ts lens --apply dbm          # Not implemented
npx tsx cli.ts compare --baseline A --candidate B  # Not implemented
```

---
description: Project context and key rules for the Canon Extraction Pipeline
---

# Knowledge Extraction Pipeline - Project Context

## 🎯 What This Project Does
Extracts structured knowledge from educational content using AI, creating a Zettelkasten-style vault with linked notes (concepts, procedures, principles, misconceptions, examples).

**Current State:** vNext pipeline with embedding-based deduplication, clean filenames, and SQLite-vec vector storage.

---

## ✅ Quick Test Command (ALWAYS START HERE)
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-$(date +%H%M)
```

**Expected:** 
- `✅ Copied template vault to...`
- 10 notes created (concepts, principles, procedures, etc.)
- `Runbook completed`
- Vector index created at `_index/vectors.db`

---

## 📊 Phase 1 Validation (After Running Pipeline)

```bash
# Validate Phase 1 requirements
npx tsx src/systems/research/utils/phase1-validator.ts ./vault-path

# Strict mode (warnings = failures)
npx tsx src/systems/research/utils/phase1-validator.ts ./vault-path --strict
```

**Checks:**
- `embedding_keys` present (3-5 items)
- `derived_from` has human-readable `source_title`
- `link_intents` max 5 with `embedding_match_keys`
- No unabstracted domain terms

---

## 🚨 Critical Facts (READ FIRST)

1. **ONE execution path:** `run --runbook <id>` - Runbooks drive everything
2. **Vaults auto-create** - NO manual setup needed
3. **Provider defaults:**
   - **DeepSeek-V3.2** for extraction, modeling, verification
   - **Azure GPT-5-nano** for gating, stub generation
   - **Azure embed-v-4-0** for embeddings/deduplication
4. **10 note types** - 5 extraction + 5 rendition
5. **Embedding-based deduplication** - Before modeling AND before stub creation
6. **Clean filenames** - Type NOT in filename (e.g., `friction-budget.md` not `concept-friction-budget.md`)

> [!CAUTION]
> **NO PROMPTS IN CODE - EVER!** All prompts live in `_system/prompts/*.md`.

---

## 📁 Key File Locations

### Template Vault
```
src/systems/research/vault/
└── _system/
    ├── runbooks/vnext-pipeline.yml  # Main runbook
    ├── prompts/                      # All agent prompts
    └── schemas/
```

### Core Code
```
src/systems/research/
├── cli.ts                      # Entry point
├── runbook-runner.ts           # Runbook execution
├── step-executors.ts           # Step handlers
├── agents/
│   ├── ingestor.ts             # Source ingestion
│   ├── extractor.ts            # Candidate extraction
│   ├── modeler.ts              # Note modeling
│   ├── verifier.ts             # Note verification
│   ├── linker.ts               # Link resolution + stub creation
│   └── chunk-gate.ts           # GPT-5-nano gating
└── utils/
    ├── vector-store.ts         # SQLite-vec embeddings
    ├── phase1-validator.ts     # Output validation
    ├── naming.ts               # ID/filename generation
    └── note-embedding-index.ts # Legacy JSON index
```

### Providers
```
src/core/providers/
├── azure-gpt5-nano-provider.ts  # Gating, stubs
├── azure-embedding-provider.ts  # embed-v-4-0
└── deepseek-provider.ts         # Extraction, modeling
```

---

## 🔧 vNext Pipeline Steps

1. **ingest** - Create source anchor (no LLM)
2. **chunk** - Split into ~2000 char chunks
3. **gate** - Classify with GPT-5-nano (FULL_MODEL/SKIP)
4. **model_bundle** - Extract + model with embedding dedup
5. **verify** - Validate against source
6. **link** - Resolve links, create stubs (embedding search)
7. **emit_candidates** - Extract LINK_INTENTS
8. **emergent_artifacts** - MOCs, bridges, trails
9. **index** - Build vault graph

---

## 💻 Common Commands

### Run vNext Pipeline
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./content.md \
  --vault ./vault
```

### Validate Output
```bash
npx tsx src/systems/research/utils/phase1-validator.ts ./vault --strict
```

### Run Unit Tests
```bash
npx vitest run src/systems/research/__tests__/phase1-validation.test.ts
```

---

## 🔑 Provider Configuration

**API Keys:** `api-keys.json` in project root
```json
{
  "azure": { "apiKey": "your-key" },
  "deepseek": { "apiKey": "your-key" }
}
```

---

## 📚 Recent Changes (Jan 8, 2026)

### Phase 1 vNext Pipeline ✅
- New `vnext-pipeline.yml` runbook (v2.0)
- `model_bundle` step combines extract+model+verify
- Fast mode for small sources (<10kb)

### Embedding-Based Deduplication ✅
- SQLite-vec vector database (`_index/vectors.db`)
- Azure embed-v-4-0 for embeddings
- Dedup before modeling AND before stub creation
- Configurable threshold (default 0.7)

### Clean Filenames ✅
- Removed type prefix from IDs/filenames
- `friction-budget.md` not `concept-friction-budget.md`

### Improved Prompts ✅
- `embedding_keys` required (3-5 semantic keywords)
- `embedding_match_keys` in link_intents
- Human-readable `derived_from` with source_title
- Term abstraction (e.g., "Level 1" instead of "Rung A")
- Max 5 inline links, max 3-5 link_intents

### Validation ✅
- `phase1-validator.ts` with `--strict` mode
- 7 unit tests for output requirements

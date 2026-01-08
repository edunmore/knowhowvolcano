---
description: Project context and key rules for the Canon Extraction Pipeline
---

# Knowledge Extraction Pipeline - Project Context

## 🎯 What This Project Does
Extracts structured knowledge from educational content using AI, creating a Zettelkasten-style vault with linked notes (concepts, procedures, principles, misconceptions, examples).

**Current State:** Fully functional with runbook-based orchestration, DeepSeek for extraction/modeling, and Azure GPT-5-nano for gating.

---

## ✅ Quick Test Command (ALWAYS START HERE)
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook full-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-$(date +%H%M)
```

**Expected:** 
- `✅ Copied template vault to...`
- 10 notes created (concepts, principles, procedures, etc.)
- `Runbook completed`

---

## 📊 Benchmark Analysis (After Running Pipeline)

After running the pipeline, analyze results against expected items:

```bash
# Step 1: Build index (if pipeline didn't complete or hit budget)
npx tsx scripts/build-index.ts ./vault-path

# Step 2: Run benchmark analysis
npx tsx scripts/analyze-benchmark.ts ./benchmark ./vault-path
```

**Example:**
```bash
npx tsx scripts/build-index.ts ./benchmark/full-pipeline-2026-01-07-1338
npx tsx scripts/analyze-benchmark.ts ./benchmark ./benchmark/full-pipeline-2026-01-07-1338
```

**Output:**
- Creates `BENCHMARK_ANALYSIS.md` in the vault
- Shows Precision, Recall, F1 Score
- Lists matches (✅), type mismatches (⚠️ 60%), and missing items (❌)
- Saves history to `benchmark/_history/` for trend tracking

**Key Files:**
- `benchmark/benchmark_expected.json` - Expected items to extract
- `benchmark/benchmark_source_nohints.md` - Source content for testing
- `scripts/analyze-benchmark.ts` - Analysis CLI
- `scripts/build-index.ts` - Manual index builder

---

## 🧠 Self-Learning Groundwork (Failure Analysis)

Verification failures are now logged to `_system/failures/` for future self-learning:

```bash
# Analyze verification failures in a vault
npx tsx scripts/analyze-failures.ts ./vault
```

**Creates:** `FAILURE_ANALYSIS.md` with:
- Failure counts by note type
- Common issue patterns
- Source context vs generated content

**Purpose:** When self-learning is implemented, this data will be used to automatically improve prompts. For now, manually review patterns and update prompts in `_system/prompts/`.

**Key Files:**
- `_system/failures/*.json` - Individual failure records
- `src/systems/research/utils/failure-log.ts` - Logging utility
- `scripts/analyze-failures.ts` - Analysis script

## 🚨 Critical Facts (READ FIRST)

1. **ONE execution path:** `run --runbook <id>` - Runbooks drive everything
2. **Vaults auto-create** - NO manual setup needed
3. **Provider defaults:**
   - **DeepSeek-V3.2** for orchestrator decisions, extraction, modeling, verification
   - **Azure GPT-5-nano** for chunk gating (fast classification)
4. **10 note types** - 5 extraction + 5 rendition
5. **Zettelkasten linking** - Notes have `[[wikilinks]]` and `LINK_INTENTS` metadata
6. **Fix root causes, not symptoms** - Always fix the prompt/code generating issues, don't just add workarounds in consuming code

> [!CAUTION]
> **NO PROMPTS IN CODE - EVER!** All prompts and templates MUST live in `_system/prompts/*.md`. Code reads from vault files only. This is non-negotiable.

---

## 📁 Key File Locations

### Template Vault (Source)
```
src/systems/research/vault/
└── _system/
    ├── runbooks/          # 6 .yml files (full-pipeline, chunk-gate-test, etc.)
    ├── prompts/           # All agent prompts
    └── schemas/
```

### Core Code
```
src/systems/research/
├── cli.ts                      # Entry point (run command)
├── runbook-runner.ts           # Runbook execution engine
├── step-executors.ts           # Step handlers (call real agents)
├── agents/
│   ├── ingestor.ts             # Source ingestion
│   ├── extractor.ts            # Candidate extraction
│   ├── modeler.ts              # Note modeling
│   ├── verifier.ts             # Note verification
│   ├── resolver.ts             # Entity deduplication
│   ├── linker.ts               # Wikilink resolution
│   ├── chunk-gate.ts           # GPT-5-nano gating
│   └── storyteller.ts          # Story generation
└── utils/
    ├── vault-utils.ts          # Auto-vault creation
    └── chunker.ts              # Content chunking
```

---

## 🔧 How It Works

### Pipeline Architecture
```
cli.ts run --runbook full-pipeline
       │
       ▼
   Runbook YAML (defines steps + decision points)
       │
       ▼
   Runbook Runner (for each step: calls step executor)
       │
       ├── Decision points → DeepSeek decides (e.g., chunk size)
       │
       └── Step executors → Call real agents
```

### Full Pipeline Steps
1. **ingest** - Create source anchor (no LLM)
2. **chunk** - Split into semantic chunks (~2000 chars)
3. **gate** - Classify chunks with GPT-5-nano (FULL_MODEL/LIGHT_SCAN/SKIP)
4. **extract** - Extract candidates with DeepSeek
5. **resolve** - Deduplicate against existing vault
6. **model** - Create notes with verification loop (up to 3 retries)
7. **verify** - Validate all notes against source
8. **link** - Resolve wikilinks, create stubs
9. **index** - Build vault graph
10. **story** - Generate story (optional)

---

## 💻 Common Commands

### Run Full Pipeline
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook full-pipeline \
  --file ./content.md \
  --vault ./vault
```

### Quick Gate Test
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./content.md \
  --vault ./test-vault
```

### Resolve Links (After Extraction)
```bash
npx tsx src/systems/research/resolve-links.ts ./vault
```

---

## 🎓 Available Runbooks

| Runbook | Purpose |
|---------|---------|
| **full-pipeline** | Complete 10-step extraction (RECOMMENDED) |
| **chunk-gate-test** | Test chunking + GPT-5-nano gating |
| **chunk-only** | Chunking without gating |
| **knowledge-extraction-v2** | Config schema (not executable) |

---

## 🔑 Provider Configuration

### DeepSeek (Default for most steps)
- Used for: Extraction, Modeling, Verification, Resolution, Linking
- Model: `DeepSeek-V3.2` via Azure

### Azure GPT-5-Nano (for Gating)
- Used for: Chunk classification only
- Model: `gpt-5-nano`
- Fixed temperature 1.0

**API Keys:** `api-keys.json` in project root
```json
{
  "azure": { "apiKey": "your-key" },
  "deepseek": { "apiKey": "your-key" }
}
```

---

## 🐛 Common Issues & Solutions

### "Ollama connection refused"
**Solution:** Ollama is deprecated. Use DeepSeek (default) instead.

### Time budget exceeded
**Solution:** Increase `time_ceiling_seconds` in runbook globals, or reduce content size.

### "Runbook not found"
**Solution:** Vault auto-creates. If issue persists, check template exists in `src/systems/research/vault/_system/runbooks/`.

---

## 📚 Recent Changes (Jan 7, 2026)

### Pipeline Consolidation ✅
- Unified to single `run --runbook` execution path
- Removed legacy `ingest` and `coordinate` commands
- Default provider changed to DeepSeek (no Ollama)

### Step Executors Integration ✅
- All step executors now call real agents
- No more placeholder implementations
- Full verification with grounding checks

### Provider Updates ✅
- DeepSeek for extraction/modeling
- GPT-5-nano for gating
- Removed Ollama dependency

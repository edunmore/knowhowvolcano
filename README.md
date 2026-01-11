# Knowledge Extraction Pipeline

Extracts structured knowledge from educational content using AI, creating a Zettelkasten-style vault with linked notes.

## 🚀 Quick Start

```bash
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-vault
```

**Output:**
- 10 notes (concepts, principles, procedures, misconceptions, examples)
- Stubs for missing references
- Vector index for semantic search
- MOCs, bridges, trails

---

## Features (Jan 2026)

- **vNext Pipeline** - Single `model_bundle` step for extract+model+verify
- **Embedding Dedup** - SQLite-vec vector DB, Azure embed-v-4-0
- **Clean Filenames** - `friction-budget.md` not `concept-friction-budget.md`
- **Semantic Keywords** - `embedding_keys` for matching
- **Validation** - `phase1-validator.ts --strict`

---

## Requirements

```bash
# API keys in api-keys.json
{
  "azure": { "apiKey": "your-azure-key" },
  "deepseek": { "apiKey": "your-deepseek-key" }
}
```

---

## Commands

| Command | Purpose |
|---------|---------|
| `run --runbook vnext-pipeline` | Full extraction pipeline |
| `phase1-validator.ts ./vault` | Validate output |
| `vitest run` | Run unit tests |

---

## Documentation

- **Agent Guide**: `.agent/workflows/project-context.md`
- **TODO**: `TODO.md`
- **Pipeline Details**: `src/systems/research/README.md`

---

## Architecture

```
Source → Chunk → Gate → Model → Verify → Link → Index
                         ↓
                  Vector Store (SQLite-vec)
                         ↓
                  Embedding Dedup
```

Providers:
- **DeepSeek-V3.2** - Extraction, modeling, verification
- **Azure GPT-5-nano** - Gating, stub generation
- **Azure embed-v-4-0** - Embeddings

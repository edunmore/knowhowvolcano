# Volcano Canon Extractor

A knowledge extraction pipeline that transforms source material (books, articles, transcripts) into structured, reusable method definitions stored in a versioned canon.

Built with [Volcano SDK](https://volcano.dev) for multi-provider LLM orchestration.

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate chapter summaries first (uses DeepSeek, ~3sec/chapter)
npx tsx src/cli.ts summarize --sourceDir ./booksample

# Run extraction on a chapter
npx tsx src/cli.ts run --start ./booksample/016_9_the_grow_model_with_descriptions.md

# With verbose logging (see all LLM prompts/responses in run.log)
npx tsx src/cli.ts run --start ./booksample/016_...md --verbose
```

**Output:**
- `booksample/canon/methods/MTH-XXXXXXXX-XXXXXX.md` — Extracted method
- `booksample/canon/METHODS-CANON-INDEX.md` — Updated index
- `runs/XXXXXXXX-XXXXXX/` — Run artifacts (extraction, critic, logs)

---

## Pipeline Overview

```
┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌────────────┐
│   Source    │────▶│  Router   │────▶│ Extractor │────▶│   Critic   │
│  Material   │     │ (02/03)   │     │   (04)    │     │   (05)     │
└─────────────┘     └───────────┘     └───────────┘     └────────────┘
       │                  │                                    │
       ▼                  ▼                                    ▼
┌─────────────┐  ┌─────────────────┐                 ┌─────────────────┐
│ Summarizer  │  │ Chapter Summary │                 │    Scorecard    │
│    (01)     │  │  (if missing)   │                 │                 │
└─────────────┘  └─────────────────┘                 └─────────────────┘
                                                           │
                          ┌────────────────────────────────┘
                          ▼
                 ┌─────────────────┐     ┌─────────────────┐
                 │    Matcher      │────▶│  Canon Updater  │
                 │     (06)        │     │                 │
                 └─────────────────┘     └─────────────────┘
```

---

## Key Design Decisions

### 1. File-Reference Prompts (not embedded content)
LLMs read source files directly using their file-reading tools. This:
- Keeps prompts small (~2KB instead of 30-50KB)
- Enables potential caching by LLM
- Works with all providers (Gemini native, DeepSeek/Ollama via MCP)

### 2. All Prompts Externalized
**MANDATORY RULE:** All prompts in `PROMPTS/` folder, no hardcoded prompts.
- See [PROMPTS/README.md](PROMPTS/README.md) for full documentation
- Use `loadPromptWithValues('PROMPT_NAME', {...})` to load
- Archive old versions to `PROMPTS/history/` before editing

### 3. Source-Relative Canon Storage
Canon entries stored in `{sourceDir}/canon/` not a global `./canon/`:
- `booksample/canon/methods/MTH-...md`
- `webinarsample/canon/methods/MTH-...md`

### 4. Multi-Provider Support
All providers work interchangeably:
- **Gemini CLI** — `gemini-3-pro-preview` (native tools)
- **DeepSeek V3.2** — Azure-hosted (MCP tools)
- **Ollama** — `qwen3:8b` local (MCP tools)

---

## CLI Commands

```bash
# Full pipeline
npx tsx src/cli.ts run --start <file> [--provider gemini|deepseek|ollama] [--verbose]

# Individual steps
npx tsx src/cli.ts summarize --sourceDir <dir> [--summaryProvider deepseek]
npx tsx src/cli.ts route --sourceDir <dir> --start <file>
npx tsx src/cli.ts extract --files <file1,file2,...>
npx tsx src/cli.ts reindex --canonDir <dir>
```

---

## Project Structure

```
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── pipeline/
│   │   ├── prompt-loader.ts      # Centralized prompt loading
│   │   ├── verbose-logger.ts     # Provider-level logging wrapper
│   │   ├── summarizer.ts         # 01 - Chapter summaries
│   │   ├── router.ts             # 02/03 - Chapter selection
│   │   ├── extractor.ts          # 04 - Method extraction
│   │   ├── critic.ts             # 05 - Quality scoring
│   │   ├── canon-matcher.ts      # 06 - Match to canon
│   │   ├── canon-updater.ts      # Create/update entries
│   │   ├── canon-indexer.ts      # Regenerate index
│   │   └── orchestrator.ts       # Full pipeline coordination
│   └── providers/
│       ├── gemini-cli-provider.ts
│       ├── deepseek-tools-provider.ts
│       └── ollama-provider.ts
├── PROMPTS/                       # All LLM prompts (MANDATORY)
│   ├── 01_SUMMARIZER.md
│   ├── 02_CHAPTER_ROUTER.md
│   ├── 03_SMART_ROUTER.md
│   ├── 04_EXTRACTOR.md
│   ├── 05_CRITIC.md
│   ├── 06_MATCHER.md
│   ├── 07_DELTA_EXTRACTOR.md
│   ├── README.md                  # Prompt documentation
│   └── history/                   # Version tracking
├── booksample/                    # Example source material
│   └── canon/                     # Generated canon
│       ├── methods/               # Method entries
│       ├── chaptersummary.md      # Chapter summaries
│       └── METHODS-CANON-INDEX.md # Index
└── runs/                          # Pipeline run artifacts
```

---

## Current Status

**Branch:** `refactor/file-reference-prompts`

**Recent Changes:**
1. File-reference prompts (LLM reads files directly)
2. Mandatory prompt management rules
3. Prompts renumbered 01-07 to match pipeline order
4. Verbose logging (`--verbose` flag)

**What Works:**
- ✅ Full extraction pipeline with all 3 providers
- ✅ Smart chapter routing using summaries
- ✅ Canon matching and updates
- ✅ Verbose LLM call logging

**TODO:**
- [ ] Implement DELTA flow (07_DELTA_EXTRACTOR)
- [ ] Iterative refinement loop
- [ ] Merge refactor branch to main

---

## References

- [PROMPTS/README.md](PROMPTS/README.md) — Prompt documentation
- [VOLCANO_SDK/NOTES.md](VOLCANO_SDK/NOTES.md) — Provider setup
- [PRD/PRD.md](PRD/PRD.md) — Original requirements
- [ARCHITECTURE/ARCHITECTURE.md](ARCHITECTURE/ARCHITECTURE.md) — System design

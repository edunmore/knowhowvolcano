# Volcano Canon Extractor

A knowledge extraction pipeline that transforms source material (books, articles, transcripts) into structured, reusable method definitions stored in a versioned canon.

Built with [Volcano SDK](https://volcano.dev) for multi-provider LLM orchestration.

---

## Quick Start

```bash
# Install dependencies
npm install

# Generate chapter summaries (one-time, uses DeepSeek by default)
npx tsx src/cli.ts summarize --sourceDir ./booksample

# Run extraction on a chapter
npx tsx src/cli.ts run --start ./booksample/016_9_the_grow_model_with_descriptions.md
```

**Output:**
- `booksample/canon/methods/MTH-XXXXXXXX-XXXXXX.md` — Extracted method entry
- `booksample/canon/METHODS-CANON-INDEX.md` — Updated index
- `runs/XXXXXXXX-XXXXXX/` — Run artifacts (extraction, critic report, logs)

---

## Pipeline Overview

```
┌─────────────┐     ┌───────────┐     ┌───────────┐     ┌────────────┐
│   Source    │────▶│  Router   │────▶│ Extractor │────▶│   Critic   │
│  Material   │     │ (smart)   │     │           │     │            │
└─────────────┘     └───────────┘     └───────────┘     └────────────┘
                          │                                    │
                          ▼                                    ▼
                 ┌─────────────────┐                 ┌─────────────────┐
                 │ Chapter Summary │                 │    Scorecard    │
                 │  (if missing)   │                 │  (faith/ready)  │
                 └─────────────────┘                 └─────────────────┘
                                                           │
                          ┌────────────────────────────────┘
                          ▼
                 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
                 │  Canon Matcher  │────▶│  Canon Updater  │────▶│  Canon Indexer  │
                 │  (NEW/UPDATE?)  │     │ (write entry)   │     │ (regenerate)    │
                 └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Detailed Pipeline Steps

### 1. Chapter Summarizer (optional pre-step)

**Purpose:** Generate knowledge-extraction-oriented summaries for intelligent chapter selection.

**Input:** All markdown files in source directory  
**Output:** `{sourceDir}/canon/chaptersummary.md`

**Summary Format:**
```markdown
## 016_the_grow_model.md
**Methods:** GROW coaching framework, goal-setting technique
**Concepts:** awareness, responsibility, options generation
**Patterns:** 4-stage sequence (G→R→O→W), SMART criteria
**Related:** goal setting, reality checking, coaching questions
```

**Prompt:** [05_SUMMARIZER.md](PROMPTS/05_SUMMARIZER.md)

---

### 2. Router

**Purpose:** Select the best chapters to include for extracting a complete method.

**Two Modes:**
| Mode | Trigger | Strategy |
|------|---------|----------|
| **Smart** | `chaptersummary.md` exists | Thematic matching - finds chapters with related concepts |
| **Fallback** | No summaries | Adjacent files with saturation rules |

**Input:** Start file, chapter index, existing canon  
**Output:** List of 1-4 files to process together

**Prompts:** 
- [00_CHAPTER_ROUTER.md](PROMPTS/00_CHAPTER_ROUTER.md) (fallback)
- [01_SMART_ROUTER.md](PROMPTS/01_SMART_ROUTER.md) (smart)

---

### 3. Extractor

**Purpose:** Deep structure extraction from selected chapters.

**Extracts:**
- **Method Kernel** — Purpose, preconditions, roles, process, decision rules, success signals, failure modes
- **Author Delivery Model** — How the author teaches (examples, Q&A patterns, etc.)
- **Reuse Pack** — Templates, checklists, example scenarios

**Input:** Selected chapter files  
**Output:** Structured markdown with `[EXTRACTED]` anchors to source locations

**Prompt:** [02_EXTRACTOR_MULTI.md](PROMPTS/02_EXTRACTOR_MULTI.md)

---

### 4. Critic

**Purpose:** Quality assessment and stress testing.

**Tasks:**
1. **Generation Stress Test** — Can a story generator use this extraction?
2. **Faithfulness Audit** — Are claims grounded in source material?
3. **Scorecard** — Rate operational completeness, decision rules clarity, teaching transfer, generator readiness, faithfulness, non-plagiarism safety

**Input:** Extraction + source files  
**Output:** Critic report with scorecard (each dimension 1-5)

**Prompt:** [04_DOWNSTREAM_CRITIC.md](PROMPTS/04_DOWNSTREAM_CRITIC.md)

---

### 5. Canon Matcher

**Purpose:** Determine if extraction matches existing canon entries or is a new method.

**Decision:**
- **MATCH** → Update existing entry (merge guidance provided)
- **NONE** → Create new entry

**Input:** Extraction + canon index  
**Output:** Match decision with confidence score and rationale

**Prompt:** [06_CANON_MATCHER.md](PROMPTS/06_CANON_MATCHER.md)

---

### 6. Canon Updater

**Purpose:** Create or update canon method entries.

**Canon Entry Structure:**
```markdown
---
method_id: MTH-20260101-143421
title: "The GROW Model"
provider: "GeminiCLI-gemini-2.5-flash"
start_file: "016_the_grow_model.md"
created: 2026-01-01T14:34:06.120
---

# Method Kernel
## Purpose
...

# Provenance
## Source Material
- **Start file:** 016_the_grow_model.md
- **Selected chapters:** [list]

# Changelog
- date: 2026-01-01...
```

---

### 7. Canon Indexer

**Purpose:** Regenerate the unified canon index from all method files.

**Output:** `{sourceDir}/canon/METHODS-CANON-INDEX.md`

---

## CLI Commands

```bash
# Full pipeline
npx tsx src/cli.ts run --start <file> [options]

# Individual steps
npx tsx src/cli.ts summarize --sourceDir <dir> [--summaryProvider deepseek|gemini|ollama]
npx tsx src/cli.ts route --sourceDir <dir> --start <file>
npx tsx src/cli.ts extract --files <file1,file2,...>
npx tsx src/cli.ts reindex --canonDir <dir>
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `--provider` | `gemini` | LLM provider (gemini, deepseek, ollama) |
| `--summaryProvider` | `deepseek` | Provider for summary generation |
| `--sourceDir` | (from start file) | Source material directory |
| `--canonDir` | `{sourceDir}/canon` | Canon output directory |
| `--maxFiles` | `4` | Max chapters to select |

---

## LLM Providers

| Provider | Model | Best For |
|----------|-------|----------|
| **Gemini CLI** | gemini-3-pro-preview | Full pipeline (native tools) |
| **DeepSeek V3.2** | deepseek-v3.2 | Summaries, matching (cost-effective) |
| **Ollama** | qwen3:8b | Local testing, privacy |

See [VOLCANO_SDK/NOTES.md](VOLCANO_SDK/NOTES.md) for provider setup.

---

## Project Structure

```
├── src/
│   ├── cli.ts                 # CLI entry point
│   ├── pipeline/
│   │   ├── types.ts           # TypeScript interfaces
│   │   ├── prompt-loader.ts   # Centralized prompt loading
│   │   ├── source-store.ts    # File loading & indexing
│   │   ├── summarizer.ts      # Chapter summary generation
│   │   ├── router.ts          # Chapter selection
│   │   ├── extractor.ts       # Method extraction
│   │   ├── critic.ts          # Quality assessment
│   │   ├── canon-matcher.ts   # Canon matching
│   │   ├── canon-updater.ts   # Entry creation/update
│   │   ├── canon-indexer.ts   # Index regeneration
│   │   └── orchestrator.ts    # Full pipeline coordination
│   └── providers/
│       ├── gemini-cli-provider.ts
│       ├── deepseek-tools-provider.ts
│       └── ollama-provider.ts
├── PROMPTS/                   # All LLM prompts (externalized)
│   ├── README.md              # Prompt index
│   └── history/               # Version tracking
├── booksample/                # Example source material
│   └── canon/                 # Generated canon (per-source)
└── runs/                      # Pipeline run artifacts
```

---

## References

- [PRD.md](PRD/PRD.md) — Product requirements
- [ARCHITECTURE.md](ARCHITECTURE/ARCHITECTURE.md) — System design
- [PROMPTS/README.md](PROMPTS/README.md) — Prompt documentation
- [Volcano SDK](https://volcano.dev) — LLM orchestration framework

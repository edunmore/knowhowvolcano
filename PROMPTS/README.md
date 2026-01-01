# Prompts Directory

This folder contains all system prompts used by the Canon Extraction Pipeline.
**All prompts are externalized here** — no hardcoded prompts in the codebase.

## Prompt Index

| File | Purpose | Used In |
|------|---------|---------|
| [00_CHAPTER_ROUTER.md](00_CHAPTER_ROUTER.md) | Select chapters for extraction (fallback, adjacent-based) | `src/pipeline/router.ts` |
| [01_SMART_ROUTER.md](01_SMART_ROUTER.md) | Select chapters using summaries (thematic matching) | `src/pipeline/router.ts` |
| [02_EXTRACTOR_MULTI.md](02_EXTRACTOR_MULTI.md) | Extract Method Kernel + Delivery Model + Reuse Pack | `src/pipeline/extractor.ts` |
| [04_DOWNSTREAM_CRITIC.md](04_DOWNSTREAM_CRITIC.md) | Stress test + faithfulness audit + scoring | `src/pipeline/critic.ts` |
| [05_SUMMARIZER.md](05_SUMMARIZER.md) | Generate knowledge-extraction-oriented chapter summaries | `src/pipeline/summarizer.ts` |
| [06_CANON_MATCHER.md](06_CANON_MATCHER.md) | Match extractions against existing canon entries | `src/pipeline/canon-matcher.ts` |

## Prompt Lifecycle

1. **New prompts** → Create numbered file (e.g., `07_NEW_PROMPT.md`)
2. **Edit prompts** → Copy current version to `history/` first
3. **Review changes** → Check `history/` for prompt evolution

## History Structure

Version history is maintained in `history/` folder:

```
history/
├── 00_CHAPTER_ROUTER_v1_2026-01-01.md
├── 02_EXTRACTOR_MULTI_v1_2026-01-01.md
└── CHANGELOG.md
```

Each archived version includes:
- Original prompt content
- Version number
- Date archived
- Reason for change
- Author

## Adding New Prompts

1. Create file: `NN_PROMPT_NAME.md`
2. Add entry to this README
3. Load in code using `loadPrompt()` helper
4. Commit with descriptive message

## Best Practices

- **Be specific** — Vague prompts produce vague results
- **Include output format** — Models follow structure when given
- **Add constraints** — Bounds prevent hallucination
- **Test changes** — Run before committing

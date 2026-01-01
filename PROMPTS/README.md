# Prompts Directory

> **⚠️ MANDATORY RULE: All prompts MUST be defined in this folder. No hardcoded prompts in code.**

This folder contains all system prompts used by the Canon Extraction Pipeline.

---

## Rules (MUST Follow)

1. **All prompts MUST be in PROMPTS folder** — No inline prompt strings in TypeScript files
2. **All prompts MUST be documented** — Each prompt's variables and usage documented below
3. **All changes MUST be archived** — Copy current version to `history/` before editing
4. **Use `loadPromptWithValues()`** — Load prompts via `src/pipeline/prompt-loader.ts`

---

## Prompt Index

| File | Purpose | Variables | Used In |
|------|---------|-----------|---------|
| [00_CHAPTER_ROUTER.md](00_CHAPTER_ROUTER.md) | Select chapters (fallback, adjacent-based) | `{chapterIndex}`, `{startFile}`, `{canonSummary}`, `{maxFiles}`, `{startPreview}` | `router.ts` |
| [01_SMART_ROUTER.md](01_SMART_ROUTER.md) | Select chapters (thematic, summary-based) | `{startFile}`, `{startPreview}`, `{summaries}`, `{canonSummary}`, `{maxFiles}`, `{additionalFiles}` | `router.ts` |
| [02_EXTRACTOR_MULTI.md](02_EXTRACTOR_MULTI.md) | Extract Method Kernel + Delivery Model + Reuse Pack | `{sourceFiles}` | `extractor.ts` |
| [03_DELTA_EXTRACTOR.md](03_DELTA_EXTRACTOR.md) | Update existing canon entry with new info | (not yet implemented) | — |
| [04_DOWNSTREAM_CRITIC.md](04_DOWNSTREAM_CRITIC.md) | Stress test + faithfulness audit + scoring | `{sourceFiles}`, `{extraction}` | `critic.ts` |
| [05_SUMMARIZER.md](05_SUMMARIZER.md) | Generate chapter summaries for routing | `{filename}`, `{content}` | `summarizer.ts` |
| [06_CANON_MATCHER.md](06_CANON_MATCHER.md) | Match extraction to existing canon | `{extraction}`, `{canonMethods}` | `canon-matcher.ts` |

---

## Variable Reference

### Variable Format
All variables use `{variableName}` format: `{sourceFiles}`, `{extraction}`, etc.

### Common Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{sourceFiles}` | List of file paths to read | `1. /path/to/file1.md\n2. /path/to/file2.md` |
| `{extraction}` | Extraction markdown output | `# Method Kernel\n...` |
| `{startFile}` | Starting chapter filename | `016_the_grow_model.md` |
| `{startPreview}` | First 800-1000 chars of start file | `# Chapter 16\n...` |
| `{chapterIndex}` | Numbered list of all chapters | `1. chapter1.md\n2. chapter2.md\n...` |
| `{summaries}` | Formatted chapter summaries | `file.md: Methods=[X] Concepts=[Y]\n...` |
| `{canonSummary}` | Existing canon entries | `- MTH-001: Method Name\n...` |
| `{maxFiles}` | Maximum files to select | `4` |
| `{filename}` | Single file name | `016_the_grow_model.md` |
| `{content}` | File content or instruction | `[Please read this file: /path/...]` |
| `{canonMethods}` | Canon methods for matching | `- MTH-001: Method Name\n...` |

---

## How to Add a New Prompt

1. **Create file**: `NN_PROMPT_NAME.md` (use next available number)
2. **Add to registry**: Update `PROMPTS` object in `src/pipeline/prompt-loader.ts`
3. **Document here**: Add row to Prompt Index table above
4. **Document variables**: List all `{variable}` placeholders
5. **Use in code**: `loadPromptWithValues('PROMPT_NAME', { var1: value1, ... })`

---

## How to Modify a Prompt

1. **Archive first**: Copy current version to `history/`
   ```bash
   cp PROMPTS/02_EXTRACTOR_MULTI.md "PROMPTS/history/02_EXTRACTOR_MULTI_v2_2026-01-02.md"
   ```
2. **Update CHANGELOG**: Document the change in `history/CHANGELOG.md`
3. **Edit prompt**: Make your changes
4. **Update README**: If variables changed, update table above
5. **Test**: Run pipeline to verify

---

## History Structure

Version history is maintained in `history/` folder:

```
history/
├── CHANGELOG.md                          # Log of all changes
├── 00_CHAPTER_ROUTER_v1_2026-01-01.md   # Archived versions
├── 02_EXTRACTOR_MULTI_v1_2026-01-01.md
├── 04_DOWNSTREAM_CRITIC_v1_2026-01-01.md
└── ...
```

### Naming Convention
```
{NN}_{PROMPT_NAME}_v{VERSION}_{DATE}.md
```

---

## Code Example

```typescript
import { loadPromptWithValues } from './pipeline/prompt-loader.js';

// Load prompt with variable substitution
const prompt = loadPromptWithValues('EXTRACTOR_MULTI', {
  sourceFiles: '1. /path/to/file1.md\n2. /path/to/file2.md',
});

// For prompts without variables
import { loadPrompt } from './pipeline/prompt-loader.js';
const basePrompt = loadPrompt('CHAPTER_ROUTER');
```

---

## Enforcement

The `prompt-loader.ts` module is the ONLY way to load prompts. Direct file reading or inline strings are prohibited. This ensures:

- ✓ All prompts are tracked
- ✓ Variables are consistently replaced
- ✓ Changes can be audited
- ✓ Prompts can be versioned

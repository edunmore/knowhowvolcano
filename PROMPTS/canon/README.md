# Prompts Directory

> **⚠️ MANDATORY RULE: All prompts MUST be defined in this folder. No hardcoded prompts in code.**

This folder contains all system prompts used by the Canon Extraction Pipeline.
Prompts are **numbered by pipeline execution order** (01 = first, 07 = last).

---

## Rules (MUST Follow)

1. **All prompts MUST be in PROMPTS folder** — No inline prompt strings in TypeScript files
2. **All prompts MUST be documented** — Each prompt's variables and usage documented below
3. **All changes MUST be archived** — Copy current version to `history/` before editing
4. **Use `loadPromptWithValues()`** — Load prompts via `src/pipeline/prompt-loader.ts`

---

## Prompt Index (Pipeline Order)

| # | File | Purpose | Variables | Used In |
|---|------|---------|-----------|---------|
| 01 | [01_SUMMARIZER.md](01_SUMMARIZER.md) | Generate chapter summaries | `{filename}`, `{content}` | `summarizer.ts` |
| 02 | [02_CHAPTER_ROUTER.md](02_CHAPTER_ROUTER.md) | Select chapters (fallback) | `{chapterIndex}`, `{startFile}`, `{canonSummary}`, `{maxFiles}`, `{startPreview}` | `router.ts` |
| 03 | [03_SMART_ROUTER.md](03_SMART_ROUTER.md) | Select chapters (smart) | `{startFile}`, `{startPreview}`, `{summaries}`, `{canonSummary}`, `{maxFiles}`, `{additionalFiles}` | `router.ts` |
| 04 | [04_EXTRACTOR.md](04_EXTRACTOR.md) | Extract Method Kernel | `{sourceFiles}` | `extractor.ts` |
| 05 | [05_CRITIC.md](05_CRITIC.md) | Stress test + scoring | `{sourceFiles}`, `{extraction}` | `critic.ts` |
| 06 | [06_MATCHER.md](06_MATCHER.md) | Match to canon | `{extraction}`, `{canonMethods}` | `canon-matcher.ts` |
| 07 | [07_DELTA_EXTRACTOR.md](07_DELTA_EXTRACTOR.md) | Update existing entry | (not yet implemented) | — |

---

## Variable Reference

### Format
All variables use `{variableName}`: `{sourceFiles}`, `{extraction}`, etc.

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{sourceFiles}` | File paths to read | `1. /path/file1.md\n2. /path/file2.md` |
| `{extraction}` | Extraction output | `# Method Kernel\n...` |
| `{startFile}` | Starting chapter | `016_the_grow_model.md` |
| `{startPreview}` | First 800-1000 chars | `# Chapter 16\n...` |
| `{chapterIndex}` | All chapters list | `1. chapter1.md\n2. chapter2.md` |
| `{summaries}` | Chapter summaries | `file.md: Methods=[X] Concepts=[Y]` |
| `{canonSummary}` | Existing canon | `- MTH-001: Method Name` |
| `{maxFiles}` | Max files to select | `4` |
| `{filename}` | Single file name | `016_the_grow_model.md` |
| `{content}` | File content/instruction | `[Please read: /path/...]` |
| `{canonMethods}` | Methods for matching | `- MTH-001: Method Name` |

---

## How to Add/Modify Prompts

### Add New Prompt
1. Create `NN_PROMPT_NAME.md` (use next number)
2. Add to `PROMPTS` in `src/pipeline/prompt-loader.ts`
3. Document in table above
4. Use: `loadPromptWithValues('PROMPT_NAME', {...})`

### Modify Existing
1. Archive: `cp PROMPTS/04_EXTRACTOR.md "PROMPTS/history/04_EXTRACTOR_v2_2026-01-02.md"`
2. Update `history/CHANGELOG.md`
3. Edit prompt
4. Update README if variables changed
5. Test pipeline

---

## History

Version history in `history/` folder. See [CHANGELOG.md](history/CHANGELOG.md).

Unused PRD templates archived in `history/unused_prd_templates/`.

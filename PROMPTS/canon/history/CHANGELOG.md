# Prompt Changelog

All prompt changes are documented here with version history.

---

## 2026-01-01 — Prompt Refactoring (v2)

**Author:** System  
**Reason:** Enforce no-hardcoded-prompts rule, add proper placeholders

### Changes Made
- `00_CHAPTER_ROUTER.md` — Added placeholders: `{chapterIndex}`, `{startFile}`, `{canonSummary}`, `{maxFiles}`, `{startPreview}`
- `02_EXTRACTOR_MULTI.md` — Changed `<FILE_N>` to `{sourceFiles}` placeholder
- `04_DOWNSTREAM_CRITIC.md` — Added placeholders: `{sourceFiles}`, `{extraction}`

### Archived Versions
- `00_CHAPTER_ROUTER_v1_2026-01-01.md`
- `01_SMART_ROUTER_v1_2026-01-01.md`
- `02_EXTRACTOR_MULTI_v1_2026-01-01.md`
- `04_DOWNSTREAM_CRITIC_v1_2026-01-01.md`

---

## 2026-01-01 — Initial Prompt Externalization (v1)

**Author:** System  
**Reason:** Centralize all prompts from hardcoded strings to external files

### New Files Created
- `01_SMART_ROUTER.md` — Extracted from `router.ts` SMART_ROUTER_PROMPT
- `05_SUMMARIZER.md` — Extracted from `summarizer.ts` SUMMARY_PROMPT
- `06_CANON_MATCHER.md` — Extracted from `canon-matcher.ts` inline prompt

### Existing Files (already externalized)
- `00_CHAPTER_ROUTER.md`
- `02_EXTRACTOR_MULTI.md`
- `03_DELTA_EXTRACTOR.md`
- `04_DOWNSTREAM_CRITIC.md`

---

## Version Archive Convention

When modifying a prompt, copy to `history/` with naming:
```
{NN}_{PROMPT_NAME}_v{VERSION}_{DATE}.md
```

Example: `02_EXTRACTOR_MULTI_v2_2026-01-02.md`

Include in archive header:
- Version number
- Date
- Author
- Reason for change

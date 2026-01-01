# Prompt Changelog

All prompt changes are documented here with version history.

---

## 2026-01-01 — Initial Prompt Externalization

**Author:** System  
**Reason:** Centralize all prompts from hardcoded strings to external files

### New Files Created
- `01_SMART_ROUTER.md` — Extracted from `router.ts` SMART_ROUTER_PROMPT
- `05_SUMMARIZER.md` — Extracted from `summarizer.ts` SUMMARY_PROMPT
- `06_CANON_MATCHER.md` — Extracted from `canon-matcher.ts` inline prompt

### Existing Files
- `00_CHAPTER_ROUTER.md` — Already externalized
- `02_EXTRACTOR_MULTI.md` — Already externalized
- `03_DELTA_EXTRACTOR.md` — Already externalized
- `04_DOWNSTREAM_CRITIC.md` — Already externalized

---

## Version Archive Convention

When modifying a prompt, copy to `history/` with naming:
```
{NN}_{PROMPT_NAME}_v{VERSION}_{DATE}.md
```

Example: `02_EXTRACTOR_MULTI_v1_2026-01-01.md`

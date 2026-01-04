---
description: Project context and key rules for the Canon Extraction Pipeline
---

# Canon Extraction Pipeline - Agent Context

## What This Project Does
Extracts structured method definitions from books/articles into a versioned canon using LLMs.

## Key Files to Read First
1. `README.md` — Project overview and current status
2. `PROMPTS/README.md` — **MANDATORY** prompt management rules
3. `.agent/workflows/volcano-best-practices.md` — **Read this for SDK patterns**
4. `VOLCANO_SDK/NOTES.md` — LLM provider setup

## MANDATORY Rules

### 1. All Prompts in PROMPTS Folder
- NO inline prompt strings in TypeScript
- Use `loadPromptWithValues('PROMPT_NAME', {...})` from `prompt-loader.ts`
- Archive old versions to `PROMPTS/history/` before editing
- Document all changes in `PROMPTS/history/CHANGELOG.md`

### 2. File-Reference Prompts
- LLMs read files directly, we don't embed content in prompts
- Pass absolute file paths: `/home/mac/projects/knowhow1/booksample/...`
- All providers support file reading (Gemini native, DeepSeek/Ollama via MCP)

### 3. Source-Relative Canon Storage
- Canon stored in `{sourceDir}/canon/` not global `./canon/`
- Example: `booksample/canon/methods/MTH-...md`

## Pipeline Steps (in order)
1. `01_SUMMARIZER.md` — Generate chapter summaries (optional pre-step)
2. `02_CHAPTER_ROUTER.md` / `03_SMART_ROUTER.md` — Select chapters
3. `04_EXTRACTOR.md` — Extract method kernel
4. `05_CRITIC.md` — Score extraction quality
5. `06_MATCHER.md` — Match to existing canon
6. `07_DELTA_EXTRACTOR.md` — Update existing entry (not implemented)

## Quick Commands
```bash
# Summarize chapters (one-time, uses DeepSeek)
npx tsx src/cli.ts summarize --sourceDir ./booksample

# Run full pipeline
npx tsx src/cli.ts run --start ./booksample/016_...md --provider gemini

# With verbose logging
npx tsx src/cli.ts run --start ./booksample/016_...md --verbose
```

## Current Branch
`refactor/file-reference-prompts` — Ready to merge to main

## TODO
- [ ] Implement DELTA flow (07_DELTA_EXTRACTOR)
- [ ] Iterative refinement loop
- [ ] Merge refactor branch to main

## Agent Best Practices (User Feedback)
1.  **Simplified Prompts**: Since agents can read/write files directly, prompts do NOT need to contain embedded content. Just point to the files.
2.  **Observability**: Keep using the `runs/` folder for detailed output and the `--verbose` flag for terminal visibility. The user loves this transparency.
3.  **Git Safety**: **ALWAYS** create a feature branch before starting any major refactoring. Never commit broken code to main.

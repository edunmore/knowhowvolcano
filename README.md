# Volcano Canon Extractor — PRD Pack

Date: 2025-12-31

This zip contains a PRD + prompt library + data model templates for a canon-aware, bounded-context knowledge extraction pipeline designed to run with an agentic layer (Volcano SDK) and LLM providers.

## What you feed into your implementation agent

Start with:
- `PRD/PRD.md` (requirements and pipeline)
- `ARCHITECTURE/ARCHITECTURE.md` (module boundaries and data flow)
- `PROMPTS/` (prompt library; each file is ready to load as a string template)
- `DATA_MODELS/` (canon index + canon entry templates)
- `SCRIPTS_SPEC/` (CLI behavior and I/O contracts)

## Minimal expected output from the implementation agent

A TypeScript/Node project that:
1) Reads markdown sources from a folder.
2) Routes a bounded set of chapters (<=4) for each run.
3) Produces extraction + critic reports.
4) Updates/creates canon entries and regenerates the canon index.


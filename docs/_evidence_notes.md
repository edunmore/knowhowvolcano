# Evidence Notes for System Documentation

Generated: 2026-01-10
Purpose: Track evidence sources for documentation claims

## Entry Points

| Evidence | Location | Notes |
|----------|----------|-------|
| CLI Commands | `src/systems/research/cli.ts` | `run`, `coordinate`, `ingest` commands |
| npm scripts | `package.json:11-12` | `npm run research` → cli.ts |

## Pipeline Stages (from vnext-pipeline.yml)

| Step | Type | Evidence |
|------|------|----------|
| 1. ingest | `ingest` | `step-executors.ts:51-74` |
| 2. chunk | `chunk` | `step-executors.ts:79-148`, `chunker.ts` |
| 3. gate | `gate` | `step-executors.ts:153-241`, `agents/chunk-gate.ts` |
| 4. model_bundle | `model_bundle` | `step-executors.ts:542-745` |
| 5. verify | `verify` | `step-executors.ts:751-802` |
| 6. link | `link` | `step-executors.ts:807-830`, `agents/linker.ts` |
| 7. emit_candidates | `emit_candidates` | `step-executors.ts:836-919` |
| 8. emergent_artifacts | `emergent_artifacts` | `step-executors.ts:924-949` |
| 9. index | `index` | `step-executors.ts:954-981`, `utils/indexer.ts` |

## Runbook Definition

| Evidence | Location |
|----------|----------|
| vnext-pipeline.yml | `src/systems/research/vault/_system/runbooks/vnext-pipeline.yml` |
| Runbook schema | `src/systems/research/vault/_system/schemas/runbook.schema.json` |
| Runbook runner | `src/systems/research/runbook-runner.ts` |
| Runbook loader | `src/systems/research/runbook-loader.ts` |

## Agents

| Agent | File | LLM Provider |
|-------|------|-------------|
| Extractor | `agents/extractor.ts` | DeepSeek-V3.2 (via azure-deepseek-provider) |
| Modeler | `agents/modeler.ts` | DeepSeek-V3.2 |
| Verifier | `agents/verifier.ts` | DeepSeek-V3.2 |
| Linker | `agents/linker.ts` | GPT-5-nano (for stub creation) |
| ChunkGate | `agents/chunk-gate.ts` | GPT-5-nano |

## Prompts

| Prompt | File | Purpose |
|--------|------|---------|
| extract-candidates | `_system/prompts/prompt-extract-candidates.md` | Identify candidates from source |
| model-artifact | `_system/prompts/prompt-model-artifact.md` | Generate note content |
| verify-note | `_system/prompts/prompt-verify-note.md` | Schema validation |
| verify-grounding | `_system/prompts/prompt-verify-grounding.md` | Source grounding check |
| create-stub | `_system/prompts/prompt-create-stub.md` | Stub note generation |
| chunk-gate | `_system/prompts/prompt-chunk-gate.md` | Chunk classification |

## LLM Providers

| Provider | File | Usage |
|----------|------|-------|
| DeepSeek-V3.2 | `core/providers/azure-deepseek-provider.ts` | Main extraction/modeling |
| GPT-5-nano | `core/providers/azure-gpt5-nano-provider.ts` | Gating, stub generation |
| Azure embeddings | `core/providers/azure-embedding-provider.ts` | Deduplication |

## Storage Artifacts

| Artifact | Location Pattern | Format |
|----------|-----------------|--------|
| Source anchor | `sources/source-{hash}.md` | Markdown w/ frontmatter |
| Chunks | `_sources/{source_id}/chunks/{seq}.md` | Markdown w/ frontmatter |
| Source manifest | `_sources/{source_id}/manifest.json` | JSON |
| Concepts | `concepts/{id}.md` | Markdown w/ frontmatter |
| Procedures | `procedures/{id}.md` | Markdown w/ frontmatter |
| Principles | `principles/{id}.md` | Markdown w/ frontmatter |
| Misconceptions | `misconceptions/{id}.md` | Markdown w/ frontmatter |
| Examples | `examples/{id}.md` | Markdown w/ frontmatter |
| Stubs | `stubs/stub-{id}.md` | Markdown w/ frontmatter |
| MOCs | `slipbox/mocs/moc-{sourceId}.md` | Markdown |
| Bridges | `slipbox/bridges/bridge-{a}-{b}.md` | Markdown |
| Trails | `slipbox/trails/trail-{sourceId}.md` | Markdown |
| Run result | `_runs/runbooks/{id}/run-{ts}/run.json` | JSON |
| Step reports | `_runs/runbooks/{id}/run-{ts}/step_reports/{stepId}.json` | JSON |
| Notes index | `_index/notes.json` | JSON array |
| Backlinks | `_index/backlinks.json` | JSON object |
| Vector DB | `_index/vectors.db` | SQLite (sqlite-vec) |

## Verified Run Evidence

| Evidence | Location |
|----------|----------|
| Complete run | `benchmark/run-2026-01-09-1259/_runs/runbooks/vnext-pipeline/run-1767959966124/run.json` |
| Run duration | 138182ms (2m 18s) |
| Notes created | 10 notes |
| Stubs created | 5 stubs |
| Steps completed | 9/9 |
| Vector DB | `benchmark/run-2026-01-09-1259/_index/vectors.db` (6.3MB) |

## Deduplication System

| Evidence | Location | Notes |
|----------|----------|-------|
| Embedding dedup | `utils/embedding-dedup.ts` | Thresholds: 0.9=MERGE, 0.7-0.9=verify, <0.7=CREATE |
| Vector store | `utils/vector-store.ts` | SQLite-vec with 1536-dim embeddings |
| Dedup in model_bundle | `step-executors.ts:635-680` | Uses `checkDuplicate()` |

## Configuration

| Config | File | Notes |
|--------|------|-------|
| API keys | `api-keys.json` | Azure and DeepSeek keys |
| Vault layout | `utils/vault-utils.ts:26-48` | VAULT_LAYOUT constant |
| Primer | `_system/primer.json` | Domain-specific config |
| Runbook globals | `vnext-pipeline.yml:23-26` | Token/cost/time budgets |

## Unverified Items

- Autonomous coordinator (`coordinate` command) - not tested with real run
- Offline/Ollama mode - mentioned in code but not run-verified
- Multi-file directory ingestion - placeholder code exists but not implemented

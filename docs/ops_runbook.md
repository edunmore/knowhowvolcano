# Operations Runbook

This document describes how to run the extraction pipeline, configure it, and debug issues.

---

## Quick Start

### Basic Run

```bash
# Run the vNext pipeline on a source file
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./path/to/source.md \
  --vault ./my-vault
```

**Expected output:**
```
✅ Copied template vault to ./my-vault
Running runbook: vnext-pipeline
  Vault: /path/to/my-vault
  Provider: deepseek

Runbook completed: completed
  Steps: 9/9
  Decisions: 0
```

**Evidence:** `README.md:7-12`, `.agent/workflows/project-context.md:14-20`

---

### Validate Output

```bash
# Validate extracted notes meet Phase 1 requirements
npx tsx src/systems/research/utils/phase1-validator.ts ./my-vault

# Strict mode (warnings = failures)
npx tsx src/systems/research/utils/phase1-validator.ts ./my-vault --strict
```

**Checks:**
- `embedding_keys` present (3-5 items)
- `derived_from` has `source_title`
- `link_intents` max 5
- No unabstracted domain terms

**Evidence:** `.agent/workflows/project-context.md:30-45`

---

## CLI Options

```bash
npx tsx src/systems/research/cli.ts <command> [options]
```

### Commands

| Command                     | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `run --runbook <id>`        | Execute a runbook workflow               |
| `coordinate --runbook <id>` | Autonomous AI coordinator (experimental) |
| `ingest --file <file>`      | Legacy hardcoded pipeline                |

### Options

| Flag                | Default              | Description                                        |
| ------------------- | -------------------- | -------------------------------------------------- |
| `--vault <path>`    | `./vault`            | Vault directory                                    |
| `--file <path>`     | *(required)*         | Source file to process                             |
| `--runbook <id>`    | *(required for run)* | Runbook to execute                                 |
| `--provider <name>` | `deepseek`           | LLM provider (`deepseek`, `azure-gpt52`, `ollama`) |
| `--verbose`         | `false`              | Enable debug logging                               |
| `--runsDir <path>`  | `<vault>/_runs`      | Override runs directory                            |
| `--chunk-size <n>`  | 2500                 | Override chunk size                                |

**Evidence:** `src/systems/research/cli.ts:49-78`

---

## Available Runbooks

| Runbook                | Purpose                                |
| ---------------------- | -------------------------------------- |
| `vnext-pipeline`       | Full extraction pipeline (recommended) |
| `chunk-only`           | Chunk and gate only (no modeling)      |
| `knowledge-extraction` | Legacy single-pass pipeline            |
| `echo-test`            | Test runbook execution                 |

**Evidence:** `src/systems/research/vault/_system/runbooks/`

---

## Configuration

### API Keys (`api-keys.json`)

Create `api-keys.json` in project root:

```json
{
  "azure": {
    "apiKey": "your-azure-api-key"
  },
  "deepseek": {
    "apiKey": "your-deepseek-key"
  }
}
```

> ⚠️ This file is gitignored. Never commit API keys.

**Evidence:** `src/core/providers/azure-deepseek-provider.ts:31-57`

---

### Configurable Parameters

#### Runbook Globals (`vnext-pipeline.yml:23-26`)

| Parameter              | Default | Description           |
| ---------------------- | ------- | --------------------- |
| `token_budget`         | 100,000 | Max tokens per run    |
| `cost_ceiling`         | $5.00   | Max cost per run      |
| `time_ceiling_seconds` | 1200    | Max duration (20 min) |

#### Step Inputs

| Step           | Parameter             | Default | Location                |
| -------------- | --------------------- | ------- | ----------------------- |
| `chunk`        | `chunkSize`           | 2500    | `vnext-pipeline.yml:40` |
| `model_bundle` | `max_notes_per_chunk` | 5       | `vnext-pipeline.yml:56` |
| `model_bundle` | `dedup_threshold`     | 0.7     | `step-executors.ts:588` |
| `model_bundle` | `verify_ambiguous`    | true    | `step-executors.ts:589` |

#### Gate Thresholds

| Threshold | Value         | Effect                      |
| --------- | ------------- | --------------------------- |
| Fast mode | source < 10kb | Skip gating, all FULL_MODEL |

**Evidence:** `step-executors.ts:183-203`

#### Deduplication Thresholds

| Similarity | Action                |
| ---------- | --------------------- |
| ≥ 0.9      | Auto-merge            |
| 0.7–0.9    | LLM verification      |
| 0.5–0.7    | Create + link related |
| < 0.5      | Create new            |

**Evidence:** `utils/embedding-dedup.ts:107-223`

---

### Primer Configuration (`_system/primer.json`)

Domain-specific behavior is configured in the primer:

```json
{
  "domain": {
    "scope_in": ["coaching techniques", "leadership"],
    "scope_out": ["marketing", "legal text"]
  },
  "style": {
    "paraphrase_rules": ["max 30 words per quote"],
    "tone": "neutral educator"
  },
  "budgets": {
    "core_max_tokens": 250
  }
}
```

**Evidence:** `CONFIGURATION.md:40-80`

---

### Prompt Customization

All prompts are vault-resident and editable:

| Prompt       | File                                           | Purpose              |
| ------------ | ---------------------------------------------- | -------------------- |
| Extraction   | `_system/prompts/prompt-extract-candidates.md` | Identify candidates  |
| Modeling     | `_system/prompts/prompt-model-artifact.md`     | Generate notes       |
| Verification | `_system/prompts/prompt-verify-note.md`        | Schema check         |
| Grounding    | `_system/prompts/prompt-verify-grounding.md`   | Source check         |
| Stub         | `_system/prompts/prompt-create-stub.md`        | Stub generation      |
| Gate         | `_system/prompts/prompt-chunk-gate.md`         | Chunk classification |

**Evidence:** `CONFIGURATION.md:95-111`

---

## Debugging

### 1. Enable Verbose Logging

```bash
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./source.md \
  --vault ./vault \
  --verbose
```

This outputs:
- Full prompts sent to LLM
- Raw LLM responses
- Step timing details

### 2. Check Run Logs

After each run, find logs at:
```
<vault>/_runs/runbooks/<runbook-id>/run-<timestamp>/
├── run.json              # Full run result
├── decisions.json        # Orchestrator decisions (if any)
└── step_reports/
    ├── ingest.json
    ├── chunk.json
    ├── gate.json
    ├── model_bundle.json
    ├── verify.json
    ├── link.json
    └── index.json
```

Each step report contains:
```json
{
  "step_id": "model_bundle",
  "step_type": "model_bundle",
  "success": true,
  "outputs": {
    "notes_created": 10,
    "notes": [...],
    "duplicates_skipped": 0
  },
  "duration_ms": 87820
}
```

**Evidence:** `runbook-runner.ts:358-392`

### 3. Common Failure Modes

#### Rate Limit Errors

**Symptom:**
```
[RateLimit] Extractor hit rate limit, waiting 2000ms before retry 1/3
```

**Solution:**
- Wait and retry (automatic, 3 attempts)
- Reduce `max_notes_per_chunk` to lower API calls
- Use a different provider

**Evidence:** `utils/rate-limit-utils.ts`

#### Empty Extraction

**Symptom:**
```
[Extract] Extracted 0 candidates
```

**Causes:**
- Source has no extractable content (marketing, ToC, etc.)
- Gate classified all chunks as SKIP
- Prompt mismatch with content type

**Debug:**
1. Check `_sources/{sourceId}/chunks/` for `decision: SKIP`
2. Review `prompt-extract-candidates.md` scope
3. Try smaller source file

#### Verification Failures

**Symptom:**
```
[Model] Attempt 1 failed verification
[Model] Max retries reached for Outcome Ladder. Keeping imperfect note.
```

**Causes:**
- Note contains hallucinated content
- Schema mismatch (missing required sections)
- Quote exceeds 30 words

**Debug:**
1. Check `_runs/.../step_reports/verify.json` for `issues`
2. Review `utils/failure-log.ts` output at `<vault>/_failures/`
3. Adjust prompt or extraction scope

#### Vector Store Errors

**Symptom:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Solution:**
1. Ensure `_index/` directory exists
2. Check permissions
3. Delete corrupted `vectors.db` and re-run

### 4. Inspecting Vector Store

```bash
# Using sqlite3 CLI
sqlite3 <vault>/_index/vectors.db

# List all indexed notes
SELECT id, title, type FROM notes;

# Check embedding count
SELECT COUNT(*) FROM note_vectors;
```

---

## Recovery Procedures

### Re-index Notes

If `_index/notes.json` is corrupted:

```bash
# Delete and re-run just the index step
rm <vault>/_index/notes.json
rm <vault>/_index/backlinks.json

# Manually trigger indexer
# (Not directly exposed, run full pipeline on empty source)
```

### Re-build Vector Store

```bash
rm <vault>/_index/vectors.db

# Next pipeline run will rebuild from existing notes
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./any-small-source.md \
  --vault ./vault
```

### Start Fresh

```bash
# Remove generated content, keep _system templates
rm -rf <vault>/concepts
rm -rf <vault>/procedures
rm -rf <vault>/principles
rm -rf <vault>/misconceptions
rm -rf <vault>/examples
rm -rf <vault>/stubs
rm -rf <vault>/slipbox
rm -rf <vault>/_index
rm -rf <vault>/_sources
rm -rf <vault>/_runs
rm -rf <vault>/sources
```

---

## Performance Tuning

### Reduce LLM Calls

| Knob                         | Effect                          |
| ---------------------------- | ------------------------------- |
| Increase `chunkSize`         | Fewer chunks = fewer gate calls |
| Reduce `max_notes_per_chunk` | Fewer notes per window          |
| Disable `verify_ambiguous`   | Skip LLM dedup verification     |

### Speed Up Runs

| Approach             | How                                           |
| -------------------- | --------------------------------------------- |
| Use fast mode        | Sources < 10kb skip gating                    |
| Disable verification | Set `pass_rate: 0` in evaluations             |
| Batch sources        | Process small files that need only 1-2 chunks |

### Reduce Costs

| Approach             | How                            |
| -------------------- | ------------------------------ |
| Use GPT-5-nano more  | Cheaper for gating/stubs       |
| Lower `token_budget` | Stop before expensive modeling |
| Pre-filter sources   | Remove marketing/ToC manually  |

---

## Testing

### Unit Tests

```bash
npx vitest run src/systems/research/__tests__/phase1-validation.test.ts
```

### Benchmark Run

```bash
# Standard benchmark file
npx tsx src/systems/research/cli.ts run \
  --runbook vnext-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./benchmark/run-$(date +%Y-%m-%d-%H%M)
```

**Expected results:**
- 10 notes created
- 5 stubs created
- 1 MOC, 1 bridge, 1 trail
- Duration: ~2-3 minutes

**Evidence:** `benchmark/run-2026-01-09-1259/_runs/runbooks/vnext-pipeline/run-1767959966124/run.json`

---

## Monitoring

### What to Watch

| Metric             | Location                               | Healthy Value            |
| ------------------ | -------------------------------------- | ------------------------ |
| Steps completed    | `run.json:steps_completed`             | 9/9                      |
| Pass rate          | `verify.json:pass_rate`                | ≥ 0.8                    |
| Duplicates skipped | `model_bundle.json:duplicates_skipped` | Low for new sources      |
| Duration           | `run.json:duration_ms`                 | < 300s for small sources |

### Alerting (Manual)

Check for:
- `status: "failed"` or `status: "budget_exceeded"` in `run.json`
- `pass_rate < 0.5` indicating prompt issues
- `notes_created: 0` for non-trivial sources

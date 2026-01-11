# ⚡ START HERE - Knowledge Extraction Pipeline

## For New Agents/Chat Sessions

### ONE COMMAND TO RUN FULL PIPELINE:
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook full-pipeline \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-$(date +%H%M)
```

### Expected Output:
```
Running runbook: full-pipeline
  Vault: ./test-XXXX
  Provider: deepseek
✅ Copied template vault to ./test-XXXX
[Runbook] Starting: full-pipeline v2.0
...
[Model] Created 10 notes
[Runbook] Finished: completed (10/10 steps)
```

If you see this, **the system works!**

---

## Quick Gate Test (Faster)
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-$(date +%H%M)
```

---

## If It Fails

1. **Check templates exist:**
   ```bash
   ls src/systems/research/vault/_system/runbooks/
   ```
   Should show: `full-pipeline.yml`, `chunk-gate-test.yml`, etc.

2. **Check API keys:**
   ```bash
   cat api-keys.json
   ```
   Should have `azure` and `deepseek` keys.

3. **Test Azure GPT-5-nano:**
   ```bash
   npx tsx src/core/providers/test-azure-gpt5.ts
   ```

---

## Key Facts

1. ✅ **Runbooks drive everything** - Use `run --runbook <id>` 
2. ✅ **Vaults auto-create** - No manual setup needed
3. ✅ **DeepSeek** - Used for extraction, modeling, verification
4. ✅ **GPT-5-nano** - Used for fast chunk gating
5. ✅ **NO Ollama** - Not used anymore

---

## 📊 Benchmark Analysis

After running the pipeline, check extraction quality:
```bash
# Build index first (if pipeline hit budget limit)
npx tsx scripts/build-index.ts ./your-vault

# Run analysis
npx tsx scripts/analyze-benchmark.ts ./benchmark ./your-vault
```

Output shows: Recall, Precision, F1 Score, and detailed match report in `BENCHMARK_ANALYSIS.md`.

---

## Documentation Files

- **PROJECT CONTEXT**: `.agent/workflows/project-context.md` - Full system overview
- **QUICKSTART**: `src/systems/research/QUICKSTART.md` - Fast commands
- **ROOT README**: `./README.md` - Project overview

---

## Tell Users

**Simple command:**
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook full-pipeline \
  --file ./your-content.md \
  --vault ./vault
```

That's it. Vault creates automatically. 10 notes extracted.

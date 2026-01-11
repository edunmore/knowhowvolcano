# Knowledge Extraction Pipeline - Quick Start Guide

## ✅ Vaults Now Auto-Create!

**The system automatically creates vaults and copies all templates.** Just run the CLI!

---

## Quick Test (30 seconds)

```bash
# Single command - vault created automatically
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-vault
```

**Expected output:**
- ✅ `Copied template vault to ./test-vault`
- ✅ `Runbook completed: completed`
- ✅ `Gate] Results: FULL_MODEL=4, LIGHT_SCAN=0, SKIP=0`

---

## Full Knowledge Extraction

```bash
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction-v2 \
  --file ./your-content.md \
  --vault ./my-vault
```

Then resolve links:
```bash
npx tsx src/systems/research/resolve-links.ts ./my-vault
```

---

## What Happens Automatically

1. ✅ Vault directories created
2. ✅ Templates copied from `./src/systems/research/vault/`
3. ✅ All 6 runbooks available
4. ✅ All prompts included
5. ✅ Ready to use immediately

**No manual setup needed!**

---

## Available Runbooks

All runbooks are in `./src/systems/research/vault/_system/runbooks/`:

### knowledge-extraction.yml
Basic extraction (original version)

### knowledge-extraction-v2.yml (RECOMMENDED)
Enhanced with validation and schemas

### chunk-gate-test.yml
Tests chunking + Azure GPT-5-nano gating

### chunk-only.yml
Tests chunking without LLM gating

### full-pipeline.yml
Complete pipeline (experimental)

---

## Common Commands

### Extract Knowledge
```bash
# Use enhanced runbook v2
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction-enhanced \
  --file ./source.md \
  --vault ./vault
```

### Test Chunking + Gating
```bash
# Make sure to copy _system first!
mkdir -p ./test-vault
cp -r ./src/systems/research/vault/_system ./test-vault/

npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./source.md \
  --vault ./test-vault
```

### Resolve Links
```bash
# After extraction, create stubs for [[wikilinks]]
npx tsx src/systems/research/resolve-links.ts ./vault
```

### Validate Runbook
```bash
npx tsx src/systems/research/validate-runbook.ts \
  ./vault/_system/runbooks/knowledge-extraction-v2.yml \
  ./vault
```

---

## Troubleshooting

### "Runbook not found" Error

**Problem:** Runbook files don't exist in target vault

**Solution:** Copy from template:
```bash
cp -r ./src/systems/research/vault/_system ./your-vault/
```

### "No chunks found for gating"

**Problem:** Chunking step didn't run or chunks not found

**Solution:** Check that chunks exist:
```bash
ls -la ./vault/_sources/*/chunks/
```

### Azure GPT-5-nano Empty Responses

**Problem:** API returns 0 tokens

**Solution:** Verify API key is correct:
```bash
# Test Azure connection
npx tsx src/core/providers/test-azure-gpt5.ts
```

---

## File Locations

### Template Vault
```
./src/systems/research/vault/
├── _system/
│   ├── runbooks/      ← All .yml runbooks
│   ├── prompts/       ← Coordinator prompts
│   └── schemas/
```

### Benchmark Files
```
./benchmark/
├── benchmark_source_nohints.md   ← Test file (4727 chars)
└── test-*/                       ← Test runs
```

### Core Code
```
./src/systems/research/
├── cli.ts                        ← Main CLI entry point
├── autonomous-coordinator.ts     ← Extraction coordinator
├── link-resolver.ts              ← Link resolution
├── agents/chunk-gate.ts          ← Chunk classification
└── utils/vault-utils.ts          ← Vault management
```

---

## Next Steps

1. **First Time:** Use Option 1 (copy template vault)
2. **For Testing:** Use Option 2 (benchmark test)
3. **Read**: Full README at `./src/systems/research/README.md`
4. **Check**: CHANGELOG.md for recent changes

# Knowledge Extraction Pipeline

## 🚀 QUICK START (Works Out of the Box!)

### Test the System (30 Seconds)
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-vault
```

**That's it!** The vault auto-creates with all templates.

---

## What This Does

Extracts structured knowledge from educational content using AI:
- Identifies concepts, procedures, principles
- Creates linked notes (Zettelkasten-style)
- Uses Azure GPT-5-nano for fast classification

---

## Full Documentation

- **Quick Commands**: `src/systems/research/QUICKSTART.md`
- **New Agent Guide**: `.gemini/antigravity/brain/*/NEW-AGENT-GUIDE.md`
- **Full Details**: `src/systems/research/README.md`

---

## Common Commands

**Run extraction:**
```bash
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction-v2 \
  --file ./your-file.md \
  --vault ./my-vault
```

**Resolve links (after extraction):**
```bash
npx tsx src/systems/research/resolve-links.ts ./my-vault
```

**Test Azure connection:**
```bash
npx tsx src/core/providers/test-azure-gpt5.ts
```

---

## Troubleshooting

**"Runbook not found"**
- Fixed! Vaults auto-create now. If still failing, check that `src/systems/research/vault/_system/` exists.

**"Azure returns 0 tokens"**  
- Check `api-keys.json` has Azure API key under `azure.apiKey`
- Test: `npx tsx src/core/providers/test-azure-gpt5.ts`

---

## Requirements

- Node.js
- Azure OpenAI API key in `api-keys.json`
- That's it!

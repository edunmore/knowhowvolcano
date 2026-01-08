# Knowledge Extraction Pipeline - README

## Overview

The Knowledge Extraction Pipeline is an autonomous system for extracting structured knowledge from educational content. It uses AI to identify concepts, procedures, principles, and misconceptions, then links them together in a Zettelkasten-style knowledge graph.

## ✅ Quick Start (Vaults Auto-Create!)

**Just run the CLI - vaults are created automatically with all templates.**

### Test the System
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./benchmark/benchmark_source_nohints.md \
  --vault ./test-vault

# Vault auto-creates with all runbooks and prompts!
```

### Full Extraction
```bash
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction-v2 \
  --file ./your-content.md \
  --vault ./my-vault

# Then resolve links
npx tsx src/systems/research/resolve-links.ts ./my-vault
```

**See [QUICKSTART.md](./QUICKSTART.md) and [NEW-AGENT-GUIDE.md](../../../.gemini/antigravity/brain/*/NEW-AGENT-GUIDE.md) for details.**

---

## Features

### ✅ Zettelkasten Linking (Phases 1-4)

**Phase 1: Link Generation**
- Coordinator generates inline `[[wikilinks]]` in extracted notes
- Creates `LINK_INTENTS` JSON metadata with stub policies
- Supports all note types: concept, procedure, principle, misconception, example

**Phase 2: Link Resolution**
- Parses all `[[wikilinks]]` from vault notes
- Resolves links to existing files
- Creates stub files for unresolved links
- AI-generated provisional explanations for high-confidence stubs
- Tracks stubs in `_index/stubs.json`

**Phase 3: Runbook Enhancement**
- Enhanced runbook schema with prompts, validation, and output schemas
- Note type registry (10 types)
- Runbook validation CLI

**Phase 4: Rendition Types**
- Added 4 new note types for learning content
- Templates for microlearnings, learning paths, quizzes, flashcards

### ✅ Azure GPT-5-Nano Integration

**Chunk Gating**
- Fast, cost-effective content classification
- Classifies chunks as SKIP / LIGHT_SCAN / FULL_MODEL
- Provides confidence scores and reasoning
- Replaces Ollama/qwen3 for better performance

---

## Runbooks

### knowledge-extraction (v1.0)
Basic goal-based extraction without explicit schemas.

### knowledge-extraction-v2 (v2.0)
Enhanced extraction with:
- Prompt templates
- Output schemas and validation
- Link rules and stub policies
- Note type registry

**Example:**
```yaml
# knowledge-extraction-v2.yml
output:
  note_types:
    - concept
    - procedure
    - principle
    - misconception
    - example
  
  required_fields:
    concept:
      - definition
      - key_points
      - evidence
      - link_intents
```

### chunk-gate-test (v1.0)
Tests chunking + Azure GPT-5-nano gating:
```bash
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./test.md \
  --vault ./test-vault
```

---

## Vault Structure

```
vault/
├── _system/
│   ├── prompts/
│   │   ├── prompt-coordinator.md
│   │   ├── prompt-chunk-gate.md
│   │   └── prompt-linking-rules.md
│   ├── runbooks/
│   │   ├── knowledge-extraction.yml
│   │   ├── knowledge-extraction-v2.yml
│   │   └── chunk-gate-test.yml
│   ├── schemas/
│   └── vault.json
├── _index/
│   ├── stubs.json          # Tracks created stub files
│   └── links.json          # (Future) Link index
├── _sources/
│   └── src_*/
│       └── chunks/*.md
├── concepts/               # Definitions, frameworks
├── procedures/             # Step-by-step processes
├── principles/             # Rules, heuristics
├── misconceptions/         # Common wrong beliefs
├── examples/               # Scenarios, cases
├── stories/                # Narrative teaching
├── microlearnings/         # Bite-sized lessons
├── learning_paths/         # Sequenced journeys
├── quizzes/                # Assessments
└── flashcards/             # Spaced repetition
```

---

## Note Format

### Extraction Note (with LINK_INTENTS)

```markdown
---
id: friction_budget
type: concept
domain: coaching
derived_from: src_12345
---

## Friction Budget

The maximum mental effort a learner can expend before they quit or resort to [[Deliberate Practice]].

## Key Points

- Exceeding the budget causes learners to stop
- The principle is to "spend friction where it buys [[Transfer]]"
- Rooted in [[Cognitive Load]] management

## Evidence

> "Every learning unit has a friction budget..."

\`\`\`json
{
  "note_id": "friction_budget",
  "link_intents": [
    {
      "target_title": "Cognitive Load",
      "intent_type": "concept",
      "stub_policy": "create_with_ai_explanation",
      "confidence": 0.95,
      "reason": "Friction budget is an application of cognitive load management"
    }
  ]
}
\`\`\`
```

### Stub Note (AI-Generated)

```markdown
---
id: cognitive_load
type: concept
tags: [stub, unresolved]
---

# Cognitive Load

## Provisional Explanation

This is a stub note. Based on context analysis:
- **Intent**: concept
- **Reason**: Friction budget is an application of cognitive load management
- **Confidence**: 95%

This stub should be filled in with proper content during the next extraction pass.
```

---

## Configuration

### API Keys (`api-keys.json`)

```json
{
  "azure": {
    "apiKey": "your-azure-api-key-here"
  }
}
```

### Azure GPT-5-Nano Settings

**Provider:** `azure-gpt5-nano-provider.ts`

**Configuration:**
- Endpoint: `https://aineu-marcus.cognitiveservices.azure.com/openai/v1/`
- Model: `gpt-5-nano`
- Temperature: 1.0 (fixed, cannot be changed)
- Max tokens: 1000 (recommended for gating)

**Usage:**
```typescript
import { createAzureGPT5Nano } from './providers/azure-gpt5-nano-provider.js';

const gpt5nano = createAzureGPT5Nano({ maxTokens: 1000 });
```

---

## CLI Commands

### Extraction
```bash
# Autonomous coordinator (recommended)
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction-enhanced \
  --file ./source.md \
  --vault ./vault

# Deterministic runbook (testing)
npx tsx src/systems/research/cli.ts run \
  --runbook chunk-gate-test \
  --file ./source.md \
  --vault ./vault
```

### Link Resolution
```bash
# Resolve all [[wikilinks]] and create stubs
npx tsx src/systems/research/resolve-links.ts ./vault
```

### Validation
```bash
# Validate runbook schema
npx tsx src/systems/research/validate-runbook.ts \
  ./vault/_system/runbooks/knowledge-extraction-v2.yml \
  ./vault
```

### Testing
```bash
# Test Azure GPT-5-nano API directly
npx tsx src/core/providers/test-azure-gpt5.ts
```

---

## Troubleshooting

### Azure GPT-5-Nano Returns Empty Responses

**Issue:** API calls succeed but return 0 tokens

**Solution:** Ensure you're using `OpenAI` client with `baseURL`, NOT `AzureOpenAI`:
```typescript
import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "https://aineu-marcus.cognitiveservices.azure.com/openai/v1/",
    apiKey: apiKey
});
```

### Temperature Errors

**Issue:** `400 Unsupported value: 'temperature' does not support X`

**Solution:** GPT-5-nano only supports temperature=1.0. Don't specify temperature parameter.

### JSON Parsing Failures

**Issue:** Gate responses fail to parse

**Solution:** 
1. Verify prompt formatting (see `prompt-chunk-gate.md`)
2. Check that response includes complete JSON object
3. Review nano-optimized prompt requirements

---

## Next Steps

1. **Run UAT**: Test with real content
2. **Create Rendition Generators**: Agents for microlearnings, quizzes, etc.
3. **Backlink Population**: Auto-populate backlinks in note frontmatter
4. **Full Pipeline**: Integrate all phases in autonomous coordinator

---

## Support

For issues or questions:
1. Check this README
2. Review CHANGELOG.md for recent changes
3. See `task.md` for implementation status
4. Check test scripts in `src/core/providers/test-*.ts`

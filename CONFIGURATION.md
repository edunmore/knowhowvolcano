# Configuration Guide

This document describes all configurable parameters for the Education Zettelkasten pipeline.

## CLI Parameters

| Flag | Default | Description |
|------|---------|-------------|
| `--vault <path>` | `./vault` | Path to vault directory |
| `--provider <name>` | `azure-gpt52` | LLM provider: `azure-gpt52`, `deepseek`, `ollama` |
| `--runsDir <path>` | `<vault>/_runs` | Where run logs are stored |
| `--verbose` | `false` | Enable detailed logging |
| `--file <path>` | *(required)* | Source file to ingest |

---

## Vault Configuration Files

### `_system/vault.json`

Created automatically on first run. Contains vault identity.

```json
{
  "vault_id": "auto-generated-hash",
  "title": "Knowledge Vault",
  "domain_tags": ["general"],
  "created_at": "ISO-timestamp"
}
```

| Field | Description |
|-------|-------------|
| `vault_id` | Unique identifier (SHA1 from path) |
| `title` | Human-readable vault name |
| `domain_tags` | Categorization tags |

---

### `_system/primer.json`

Domain-specific configuration that shapes all agent behavior.

```json
{
  "schema_version": "1.0",
  "domain": {
    "id": "coaching",
    "title": "Coaching Knowledge Vault",
    "scope_in": ["coaching techniques", "leadership development"],
    "scope_out": ["marketing copy", "testimonials", "legal text"]
  },
  "core": "Brief description of what this vault stores...",
  "ontology": {
    "note_types": ["concept", "procedure", "principle", "misconception"],
    "link_categories": ["prerequisite_of", "part_of", "contrasts_with"]
  },
  "style": {
    "paraphrase_rules": [
      "Never copy source text verbatim (max 30 words per quote)",
      "Use neutral educator tone"
    ],
    "banned_patterns": ["generic leadership theory without source"],
    "tone": "neutral educator"
  },
  "steps": {
    "gate": "Skip marketing, TOC, testimonials...",
    "model": "Write actionable notes with definitions...",
    "verify": "Ensure YAML derived_from is present...",
    "story": "Create engaging workplace scenarios..."
  },
  "lenses": {
    "dbm": "Model with DBM frames: TOTE structure..."
  },
  "budgets": {
    "core_max_tokens": 250,
    "step_slice_max_tokens": 300,
    "total_primer_max_tokens": 600
  }
}
```

| Section | Purpose |
|---------|---------|
| `domain` | What's in/out of scope |
| `core` | Injected into all prompts |
| `ontology` | Allowed note types and link categories |
| `style` | Writing rules for modeler |
| `steps` | Step-specific primer slices |
| `lenses` | Lens-specific primer slices |
| `budgets` | Token limits for primer injection |

---

## Prompts (`_system/prompts/`)

All agent prompts are vault-resident and editable.

| File | Agent | Purpose |
|------|-------|---------|
| `prompt-ingest.md` | Ingestor | Generate source anchor metadata |
| `prompt-extract-candidates.md` | Extractor | Identify knowledge candidates |
| `prompt-model-artifact.md` | Modeler | Write concept/procedure/principle/misconception |
| `prompt-verify-note.md` | Verifier | Schema + placeholder validation |
| `prompt-verify-grounding.md` | Verifier | Source grounding check |
| `prompt-resolve-entities.md` | Resolver | Deduplicate candidates |
| `prompt-create-stub.md` | Linker | Create stub notes |
| `prompt-storyteller-v1.md` | Storyteller | Generate story packs |
| `prompt-chunk-gate.md` | ChunkGate | Route chunks (SKIP/LIGHT_SCAN/FULL_MODEL) |
| `lenses/dbm/prompt-dbm-model.md` | DBM Lens | Generate DBM renditions |

---

## Schemas (`_system/schemas/`)

JSON schemas for validation.

| File | Validates |
|------|-----------|
| `primer.schema.json` | Domain primer structure |
| `step_scenario.schema.json` | Stepwise evaluation scenarios |
| `nkm.schema.json` | Normalized Knowledge Manifest |
| `roundtrip.report.schema.json` | Round-trip comparison reports |
| `runbook.schema.json` | Runbook definitions |

---

## Runbooks (`_system/runbooks/`)

Declarative workflow definitions (YAML or JSON).

Example `ingest-and-model.yml`:
```yaml
runbook_id: ingest-and-model
version: "1.0"
steps:
  - id: ingest
    type: ingest
    inputs: { file: "{{input_file}}" }
  - id: extract
    type: extract
  - id: model
    type: model
    conditions: { extract.candidates: "> 0" }
evaluations:
  model:
    verification_pass_rate: 0.8
```

---

## Hardcoded Values (To Be Migrated)

| Item | Current Location | Target Location |
|------|------------------|-----------------|
| Note types list | `extractor.ts` | `primer.json` ontology |
| Quote limit (30 words) | `prompt-verify-note.md` | `primer.json` style |
| Retry count (2) | `orchestrator.ts` | `primer.json` or runbook |
| Context window (±2000 chars) | `orchestrator.ts` | `primer.json` budgets |
| Default provider | `cli.ts` | `vault.json` |

---

## Future: Interactive Vault Initialization

Planned: `vault init --interactive` will prompt for:
1. Domain name and description
2. Scope (what to include/exclude)
3. Default LLM provider
4. Token budget preferences
5. Note type ontology customization

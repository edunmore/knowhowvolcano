# Runbook System Guide

The Runbook System enables **autonomous, goal-driven knowledge extraction** using LLM agents. Instead of hardcoded pipeline steps, you define goals and constraints in a YAML/Markdown runbook, and the coordinator agent decides how to achieve them.

## Quick Start

```bash
# Run a runbook on a source file
npx tsx src/systems/research/cli.ts coordinate \
  --runbook knowledge-extraction \
  --file ./booksample/006_1_what_is_coaching.md \
  --vault ./test-vault
```

## What is a Runbook?

A runbook is a **declarative specification** of what you want to achieve, not how to achieve it:

```yaml
runbook_id: knowledge-extraction
version: "1.0"
description: "Extract educational concepts from source material"

goals:
  - "Split content into logical chunks (~4000 chars)"
  - "Gate each chunk (SKIP/LIGHT_SCAN/FULL_MODEL)"
  - "Extract concept notes with definition, key points, evidence"
  - "Avoid duplicating existing vault content"
  - "Suggest improvements to this runbook"

constraints:
  max_retries: 3
  min_verification_pass_rate: 0.8

self_improvement:
  enabled: true
  log_path: "_runs/improvements.json"
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTONOMOUS COORDINATOR                        │
├─────────────────────────────────────────────────────────────────┤
│  1. Load runbook goals & constraints                             │
│  2. Read vault state (existing notes, sources)                   │
│  3. Read input file content                                      │
│  4. Send to LLM with structured output format                    │
│  5. Parse LLM response (notes to extract)                        │
│  6. Execute file operations (write notes to vault)               │
│  7. Log results & improvement suggestions                        │
└─────────────────────────────────────────────────────────────────┘
```

## Creating a New Runbook

### Step 1: Create the Runbook File

Create `test-vault/_runs/runbooks/<your-runbook-id>/runbook.yaml`:

```yaml
runbook_id: my-custom-extraction
version: "1.0"
description: "Custom extraction for technical documentation"

goals:
  - "Extract API definitions and their parameters"
  - "Create concept notes for each major feature"
  - "Include code examples in evidence sections"
  - "Link related concepts together"

constraints:
  max_retries: 5
  min_verification_pass_rate: 0.9

preferences:
  note_types:
    - concept
    - procedure
    - api-definition
  required_sections:
    - definition
    - parameters
    - example
    - related_concepts

self_improvement:
  enabled: true
  log_path: "_runs/improvements.json"
```

### Step 2: Run It

```bash
npx tsx src/systems/research/cli.ts coordinate \
  --runbook my-custom-extraction \
  --file ./docs/api-reference.md \
  --vault ./my-vault
```

## Runbook Schema Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `runbook_id` | string | Unique identifier (used in CLI) |
| `version` | string | Semantic version |
| `goals` | string[] | List of objectives for the coordinator |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Human-readable description |
| `constraints.max_retries` | number | Max retry attempts (default: 3) |
| `constraints.min_verification_pass_rate` | number | Required pass rate 0-1 (default: 0.8) |
| `constraints.max_tokens` | number | Token budget limit |
| `constraints.max_cost_usd` | number | Cost budget limit |
| `preferences` | object | Custom preferences passed to LLM |
| `self_improvement.enabled` | boolean | Enable improvement logging |
| `self_improvement.log_path` | string | Path for improvement suggestions |

## Sample Runbooks

### 1. Knowledge Extraction (Default)

```yaml
runbook_id: knowledge-extraction
version: "1.0"
description: "Extract educational concepts from books and articles"

goals:
  - "Split content into logical chunks (~4000 chars)"
  - "Gate each chunk: SKIP (meta/TOC), LIGHT_SCAN (context), FULL_MODEL (concepts)"
  - "Extract concept notes with: definition, key_points, evidence"
  - "Use snake_case IDs like 'coaching_definition'"
  - "Include verbatim quotes in evidence sections"
  - "Avoid duplicating existing vault notes"

constraints:
  max_retries: 3
  min_verification_pass_rate: 0.8

self_improvement:
  enabled: true
```

### 2. Technical Documentation

```yaml
runbook_id: tech-docs-extraction
version: "1.0"
description: "Extract from technical documentation and APIs"

goals:
  - "Identify API endpoints, functions, and classes"
  - "Extract parameters, return types, and examples"
  - "Create procedure notes for how-to guides"
  - "Link prerequisites and dependencies"

preferences:
  code_language: typescript
  include_examples: true

constraints:
  max_retries: 5
```

### 3. Research Paper Analysis

```yaml
runbook_id: paper-analysis
version: "1.0"
description: "Extract insights from academic papers"

goals:
  - "Identify main thesis and hypotheses"
  - "Extract methodology as procedure notes"
  - "Capture key findings with statistical evidence"
  - "Note limitations and future work suggestions"
  - "Create links to cited works"

preferences:
  citation_style: apa
  extract_figures: false

constraints:
  min_verification_pass_rate: 0.9
```

### 4. Meeting Notes Processing

```yaml
runbook_id: meeting-notes
version: "1.0"
description: "Process meeting transcripts into actionable notes"

goals:
  - "Extract action items with owners and deadlines"
  - "Identify decisions made and their rationale"
  - "Capture key discussion points"
  - "Note open questions for follow-up"

preferences:
  note_types:
    - action_item
    - decision
    - discussion_point
```

## Output Structure

When a runbook runs, it creates:

```
test-vault/
├── concepts/
│   └── coaching_definition.md      # Extracted concept notes
├── _sources/
│   └── src_1234567890/
│       └── chunks/
│           └── chunk_0.md          # Source chunks (if enabled)
└── _runs/
    └── coordinator/
        └── run-1234567890/
            ├── result.json         # Run summary
            ├── decision.json       # LLM decisions
            └── llm_output.txt      # Raw LLM response
```

## CLI Options

```bash
npx tsx src/systems/research/cli.ts coordinate [options]

Options:
  --runbook <id>     Runbook ID to use (required)
  --file <path>      Input file to process (required)
  --vault <path>     Vault directory (default: ./test-vault)
  --verbose          Enable verbose logging
```

## Future Enhancements

1. **GUI Runbook Editor** - Visual interface to create/edit runbooks with AI assist
2. **Custom MCP Vault Tools** - LLM can query vault during extraction:
   - `search_notes(query)` - semantic search
   - `check_duplicates(concept)` - duplicate detection
   - `get_related(noteId)` - find linked concepts
3. **Multi-file Processing** - Process entire directories
4. **Verification Agents** - Specialist agents to verify extracted notes
5. **Runbook Templates** - Pre-built templates for common use cases

## Troubleshooting

### "Failed to parse coordinator response as JSON"

The LLM returned malformed JSON. Check `_runs/coordinator/<run-id>/llm_output.txt` for the raw response. The prompt may need adjustment.

### "Access denied - path outside allowed directories"

MCP filesystem is sandboxed. Ensure paths are absolute and within the vault directory.

### Notes not being created

Check the run result in `_runs/coordinator/<run-id>/result.json` for errors and the `notesCreated` array.

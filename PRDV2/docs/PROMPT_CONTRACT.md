# Prompt Contract (Template Rendering + Variable Injection)

Date: 2026-01-03

This document specifies a generic way to inject dynamic values (paths, filenames, IDs, lists, constraints) into prompts stored in the vault.

## 1. Goal

Allow Volcano steps to load prompts from the vault and render them with a validated context object, without embedding source content directly in the prompt string.

## 2. Prompt storage

Prompts are stored as Markdown notes:

- `vault/_system/prompts/prompt-*.md`

Each prompt note contains:
- YAML frontmatter declaring variables and types
- a template body using a single templating engine (recommended: Handlebars)

## 3. Standard frontmatter

Example:

```yaml
---
id: prompt-modeler-v1
type: system_prompt
title: Modeler — staging to canonical notes
engine: handlebars
vars:
  vault_dir: { type: string, required: true }
  staging_dir: { type: string, required: true }
  schema_path: { type: string, required: true }
  run_id: { type: string, required: true }
  new_note_paths: { type: array, items: string, required: true }
  source_anchor_id: { type: string, required: false }
---
```

## 4. Rendering context (RunContext)

The Coordinator constructs a JSON object per step, typically a subset of this canonical shape:

- `run_id`: string
- `vault_dir`: string
- `inputs`: { files: string[], source_anchor_id?: string, objective_id?: string }
- `outputs`: { staging_dir?: string, notes_dir?: string, index_dir?: string }
- `retrieval_set`: string[] (note IDs)
- `constraints`: { max_quote_words?: number, require_sections?: string[] }

Prompts should depend on these stable keys to stay portable.

## 5. Validation

Before rendering, validate that:
- all `vars.*.required: true` are present
- types match (`string|number|boolean|array`)
- arrays match `items` type

Invalid contexts fail fast and produce a structured error.

## 6. Templating engine and helpers

Use one engine across the system (Handlebars recommended).

Recommended helpers:
- `json x` → pretty JSON
- `join list sep` → string join
- `basename path` → filename only (optional)

Prompts should inject references (paths, IDs) not large chunks of source text, since the agent can read files directly.

## 7. Promotion and versioning

- Prompt notes are versioned by ID and can `supersedes` older prompt IDs.
- A `promptset` note pins which prompt IDs are used for each step.
- Promotion to “current” happens only after passing regression gates (see prompt evolution workflow).

See also:
- `docs/PROMPT_EVOLUTION_WORKFLOW.md`
- `docs/ADDON_SELF_IMPROVEMENT_AND_PROMPTS_IN_VAULT.md`

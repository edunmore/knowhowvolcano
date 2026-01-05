# Add-on PRD — Dynamic Vault Path + Stepwise Evaluation (v0.9)

Date: 2026-01-05  
Applies to: Education Zettelkasten system (existing implementation)  
Purpose: Add two simplifying foundations:
1) `--vault <path>` to run the pipeline against any vault directory (domain-specific vaults, isolated experiments).
2) A stepwise evaluation harness (unit-test-like scenarios per pipeline step) to iteratively improve prompts in a controlled way, before full round-trip loops.

This add-on complements (not replaces) Git-based releases and round-trip evaluation. It makes both easier.

---

## 1. Goals

### G1 — Dynamic vault selection
Allow the orchestrator/agent to run with:
- `--vault ./vaults/coaching`
- `--vault ./vaults/negotiation`
- `--vault /tmp/exp-vault-A`

All paths (prompts, runs, indices, notes, lenses) resolve relative to that vault root.

### G2 — Stepwise evaluation (component benchmarks)
Introduce a scenario format that tests **one step at a time** with a known expected outcome (golden/target), enabling:
- fast iteration on a single prompt or small prompt chain
- clearer failure localization
- deterministic comparisons where possible

## 2. Non-goals

- Forcing Git usage; Git remains optional (but recommended) for release promotion.
- Designing a global multi-vault cross-linking UI.
- Fully automating prompt mutation/search (can be added later).

## 3. Dynamic vault path: required behavior

### 3.1 CLI / config
Add CLI flag:
- `--vault <path>` (required for all commands; default may be `./vault` for backwards compatibility)

Optional flags:
- `--shared-system <path>` (advanced): overlay shared prompts/contracts/config into the vault runtime, while still writing outputs into `--vault`.
  Use case: maintain one “system template” but many domain vaults.

### 3.2 Standard vault layout
Within `VAULT_ROOT`:
- `_system/` prompts, contracts, schemas, scenarios, config
- `_runs/` run outputs
- `_index/` indices (stable where possible)
- `_lenses/` lens outputs and patches
- domain notes (e.g., `concepts/`, `procedures/`, `stories/`, etc.)

### 3.3 Vault identity (metadata)
Add `VAULT_ROOT/_system/vault.json`:
```json
{
  "vault_id": "coaching",
  "title": "Coaching Vault",
  "domain_tags": ["coaching", "leadership"],
  "created_at": "2026-01-05"
}
```

### 3.4 Vault registry (optional)
If you want a single entrypoint to manage multiple vaults, add a registry file outside vaults, e.g. `vaults/registry.json`:
```json
{
  "vaults": [
    { "id": "coaching", "path": "./vaults/coaching" },
    { "id": "negotiation", "path": "./vaults/negotiation" }
  ]
}
```

## 4. Domain-specific vault strategy

Recommendation:
- Use separate vaults for clearly different domains (coaching vs negotiation) to keep indices small, reduce resolver noise, and keep link-intents domain-relevant.
- Use shared “system template” prompts/contracts via `--shared-system` or by periodically syncing `_system/` from a template repo.

Cross-vault reuse options (later):
- A federated “meta index” that can search multiple vaults (read-only) and suggest import/merge.
- Export/import of canonical notes via stable IDs and provenance fields (source vault id).

## 5. Stepwise evaluation harness

### 5.1 Concept
A **Step Scenario** is a small test case for one pipeline step:
- Gate classification (SKIP/LIGHT_SCAN/FULL_MODEL)
- Candidate extraction
- Resolver merge/create decisions
- Modeler note generation (schema + grounding)
- Story generation (manifest presence + constraints)
- Artifact-to-knowledge extraction (NKM recovery)

Each scenario specifies:
- inputs (files or inline test fixtures)
- the step under test
- expected output (golden)
- comparison method (exact, JSON schema + similarity, rubric judge)

### 5.2 Scenario storage
Store under:
- `VAULT_ROOT/_system/step_scenarios/<step>/<scenario_id>/scenario.json`
- `.../inputs/*`
- `.../expected/*`

### 5.3 Step scenario JSON format
See `schemas/step_scenario.schema.json`.

Key fields:
- `scenario_id`
- `step`: one of `gate`, `extract_candidates`, `resolve`, `model_note`, `generate_story`, `extract_nkm`
- `inputs`: file paths relative to scenario folder
- `expected`: file paths relative to scenario folder
- `compare`: method and thresholds
- `models`: optional overrides (e.g., use local qwen8b for gate)

### 5.4 Comparison strategies (recommended)
- Gate: exact JSON match (`decision`, `relevance_score`, `reasons` optional)
- Extract candidates: JSON schema + set overlap on `name/type` (allow ordering differences)
- Resolve: exact JSON on actions for known index snapshot
- Model note: deterministic YAML+section checks + grounding verifier pass (LLM optional)
- Story: deterministic checks (length range, manifest present, intended IDs) + optional rubric judge
- Extract NKM: strict JSON schema + overlap metrics vs expected

### 5.5 Stepwise optimization loop (manual seed → automatic iteration)
Workflow:
1) You manually curate 5–30 scenarios per step (start with gate and model_note).
2) System runs scenarios, produces a report with pass/fail and metrics.
3) You edit prompts (or the system proposes changes) and rerun.
4) Stop when the step reaches target thresholds.
5) Move to next step.

This yields “local maxima” improvements that are easier to validate than end-to-end loops.

## 6. Integration with Git releases (optional but compatible)
Even without Git, you can run:
- `--vault /tmp/vault-A`
- `--vault /tmp/vault-B`

With Git:
- put each vault under a repo or monorepo (`vaults/coaching`, `vaults/negotiation`)
- use branches/worktrees to run A/B on the same vault seed
- commit only `_system/` changes for promotion

## 7. Milestones

### M1 — Dynamic vault path
Deliver:
- `--vault` implemented across all commands
- relative path resolution for `_system`, `_runs`, `_index`, `_lenses`
- `vault.json` created by scaffold command (or first run)
Acceptance:
- Running the same scenario against two different vault paths produces outputs in the correct location.

### M2 — Step scenario format + runner
Deliver:
- `step_scenario.schema.json`
- runner command: `run-step-scenarios --step gate` (or similar)
- report output: `VAULT_ROOT/_runs/step_scenarios/<step>/<run_id>/report.json`
Acceptance:
- At least one scenario per step can be executed and compared.

### M3 — Comparator library
Deliver:
- deterministic JSON comparators (set overlap, exact match, schema validation)
- markdown/yaml structural comparator for notes
- optional rubric judge hook (LLM) with evidence requirement
Acceptance:
- Runner produces stable pass/fail results and summary metrics.

### M4 — Optional promptset packaging
Deliver:
- promptset versioning inside `_system/promptsets/<id>/...`
- ability to run scenarios against a chosen promptset without modifying the current one
Acceptance:
- A/B promptset comparison for a single step without creating separate vault dirs.

## 8. Acceptance criteria (overall)

A) `--vault` works and isolates runs and outputs.
B) Step scenarios can be curated and executed repeatedly with deterministic reports.
C) Improvements can be localized to a single step and validated quickly.
D) System remains compatible with Git-based release promotion and end-to-end round-trip evaluation.
